# In backend/app/main.py
from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response
from sqlalchemy.orm import Session
from typing import List
from jose import JWTError, jwt
import os

# --- CORRECTED to Absolute Imports ---
from app.database import SessionLocal, engine
from app import models
from app import schemas
from app import security
from app import pdf_generator
from app import crud
# --- END CORRECTION ---

models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="Internal Feedback Tool API")

# ... The rest of the file remains the same ...

# --- CORS Middleware ---
# Allows the frontend to communicate with the backend
CORS_ORIGINS = os.getenv("CORS_ORIGINS", "http://localhost:3000")
origins = [origin.strip() for origin in CORS_ORIGINS.split(',')]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
@app.get("/")
def health_check():
    return {"status": "ok"}

# --- Dependencies ---
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

async def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, security.SECRET_KEY, algorithms=[security.ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    user = crud.get_user_by_email(db, email=email)
    if user is None:
        raise credentials_exception
    return user

def get_current_manager(current_user: models.User = Depends(get_current_user)):
    if current_user.role != models.UserRole.manager:
        raise HTTPException(status_code=403, detail="Not authorized. Requires manager role.")
    return current_user

# --- Authentication Routes ---
@app.post("/token", response_model=schemas.Token)
async def login_for_access_token(db: Session = Depends(get_db), form_data: OAuth2PasswordRequestForm = Depends()):
    user = crud.get_user_by_email(db, email=form_data.username)
    if not user or not security.verify_password(form_data.password, user.hashed_password):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Incorrect email or password")
    access_token = security.create_access_token(data={"sub": user.email})
    return {"access_token": access_token, "token_type": "bearer"}

@app.get("/users/me/", response_model=schemas.User)
async def read_users_me(current_user: models.User = Depends(get_current_user)):
    return current_user

@app.get("/manager/dashboard", response_model=schemas.ManagerDashboard)
def get_manager_dashboard(db: Session = Depends(get_db), manager: models.User = Depends(get_current_manager)):
    # ... (fetching team, requests, history) ...
    team = crud.get_team_members(db, manager_id=manager.id)
    requests = crud.get_feedback_requests_for_manager(db, manager_id=manager.id)
    history = crud.get_feedback_by_manager(db, manager_id=manager.id)

    # This now returns data with nested objects already included!
    peer_feedback = crud.get_peer_feedback_for_manager(db, manager_id=manager.id)
    
    # --- FIX: Use 'submitter' when clearing for anonymous feedback ---
    for pf in peer_feedback:
        if pf.is_anonymous:
            pf.submitter = None

    # ... (sentiment trends logic) ...
    sentiments = [fb.sentiment.value for fb in history if fb.sentiment is not None]
    trends = {
        "positive": sentiments.count("positive"),
        "neutral": sentiments.count("neutral"),
        "negative": sentiments.count("negative"),
    }
    
    return {
        "team_members": team,
        "feedback_requests": requests,
        "peer_feedback": peer_feedback,
        "feedback_history": history,
        "sentiment_trends": trends,
    }

@app.post("/manager/feedback", response_model=schemas.Feedback, status_code=status.HTTP_201_CREATED)
def submit_feedback(feedback: schemas.FeedbackCreate, db: Session = Depends(get_db), manager: models.User = Depends(get_current_manager)):
    employee = crud.get_user(db, user_id=feedback.employee_id)
    if not employee or employee.manager_id != manager.id:
        raise HTTPException(status_code=404, detail="Employee not found in your team.")
    db_feedback = crud.create_feedback(db=db, feedback=feedback, manager_id=manager.id)
    
    # Create notification for the employee
    crud.create_notification(
        db, 
        user_id=employee.id, 
        message=f"You have new feedback from {manager.full_name}.",
        link=f"/feedback/{db_feedback.id}"
    )
    return db_feedback

@app.put("/manager/feedback/{feedback_id}", response_model=schemas.Feedback)
def update_feedback_entry(feedback_id: int, feedback_update: schemas.FeedbackUpdateRequest, db: Session = Depends(get_db), manager: models.User = Depends(get_current_manager)):
    db_feedback = crud.get_feedback_by_id(db, feedback_id)
    if not db_feedback or db_feedback.manager_id != manager.id:
        raise HTTPException(status_code=404, detail="Feedback not found or you are not the author.")
    
    updated_feedback = crud.update_feedback(db, db_feedback, feedback_update)

    # If filling a request, notify the employee
    if db_feedback.status == models.FeedbackStatus.published:
        crud.create_notification(
            db, 
            user_id=db_feedback.employee_id,
            message=f"{manager.full_name} has responded to your feedback request.",
            link=f"/feedback/{db_feedback.id}"
        )
    return updated_feedback

# --- Employee Routes ---
@app.get("/employee/feedback", response_model=List[schemas.Feedback])
def get_my_feedback(current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    return crud.get_feedback_for_employee(db, employee_id=current_user.id)

@app.post("/employee/feedback/{feedback_id}/acknowledge", response_model=schemas.Feedback)
def acknowledge_feedback_entry(feedback_id: int, current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    db_feedback = crud.get_feedback_by_id(db, feedback_id)
    if not db_feedback or db_feedback.employee_id != current_user.id:
        raise HTTPException(status_code=404, detail="Feedback not found.")
    return crud.acknowledge_feedback(db, db_feedback)

@app.post("/employee/request-feedback", response_model=schemas.Feedback, status_code=status.HTTP_201_CREATED)
def request_feedback_from_manager(current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    if not current_user.manager_id:
        raise HTTPException(status_code=400, detail="You do not have a manager assigned.")
    
    feedback_request = crud.request_feedback(db, employee=current_user)
    
    # Notify manager
    crud.create_notification(
        db,
        user_id=current_user.manager_id,
        message=f"{current_user.full_name} has requested feedback.",
        link=f"/feedback/{feedback_request.id}"
    )
    return feedback_request

@app.get("/employee/teammates", response_model=List[schemas.User])
def get_my_teammates(current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    return crud.get_teammates(db, user=current_user)

@app.post("/employee/peer-feedback", response_model=schemas.PeerFeedback, status_code=status.HTTP_201_CREATED)
def submit_peer_feedback(peer_feedback: schemas.PeerFeedbackCreate, current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    teammates = crud.get_teammates(db, user=current_user)
    teammate_ids = {t.id for t in teammates}
    if peer_feedback.target_employee_id not in teammate_ids:
        raise HTTPException(status_code=403, detail="You can only give feedback to your direct teammates.")
    
    db_peer_feedback = crud.create_peer_feedback(db, peer_feedback, current_user)
    
    # Notify the manager of the team
    target_user = crud.get_user(db, peer_feedback.target_employee_id)
    if target_user and target_user.manager_id:
        message = f"New peer feedback submitted for {target_user.full_name}"
        if not peer_feedback.is_anonymous:
            message += f" by {current_user.full_name}"
        crud.create_notification(
            db,
            user_id=target_user.manager_id,
            message=message,
            link="/dashboard" # Or a more specific link
        )
    
    # Process for response model
    response_schema = schemas.PeerFeedback.from_orm(db_peer_feedback)
    if db_peer_feedback.is_anonymous:
        response_schema.submitter = None

    return response_schema

# --- Shared Routes (Comments, PDF, Notifications) ---
@app.post("/feedback/{feedback_id}/comments", response_model=schemas.Comment, status_code=status.HTTP_201_CREATED)
def post_comment(feedback_id: int, comment: schemas.CommentCreate, current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    db_feedback = crud.get_feedback_by_id(db, feedback_id)
    if not db_feedback:
        raise HTTPException(status_code=404, detail="Feedback not found.")
    
    is_manager = current_user.role == models.UserRole.manager and db_feedback.manager_id == current_user.id
    is_employee = current_user.role == models.UserRole.employee and db_feedback.employee_id == current_user.id
    if not (is_manager or is_employee):
        raise HTTPException(status_code=403, detail="You are not authorized to comment on this feedback.")
        
    db_comment = crud.create_comment(db, db_feedback, current_user, comment.text)
    
    # Notify the other party
    recipient_id = db_feedback.manager_id if is_employee else db_feedback.employee_id
    crud.create_notification(
        db,
        user_id=recipient_id,
        message=f"{current_user.full_name} left a comment on your feedback.",
        link=f"/feedback/{db_feedback.id}"
    )
    return db_comment

@app.get("/feedback/{feedback_id}/pdf")
def get_feedback_as_pdf(feedback_id: int, current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    db_feedback = crud.get_feedback_by_id(db, feedback_id)
    if not db_feedback:
        raise HTTPException(status_code=404, detail="Feedback not found.")
    if current_user.id not in [db_feedback.manager_id, db_feedback.employee_id]:
        raise HTTPException(status_code=403, detail="Not authorized.")
        
    pdf_buffer = pdf_generator.create_feedback_pdf(db_feedback)
    return Response(content=pdf_buffer.getvalue(), media_type="application/pdf", headers={
        "Content-Disposition": f'attachment; filename="feedback_{feedback_id}.pdf"'
    })

@app.get("/notifications", response_model=List[schemas.Notification])
def get_my_notifications(current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    return crud.get_unread_notifications(db, user_id=current_user.id)

@app.post("/notifications/{notification_id}/read", status_code=status.HTTP_204_NO_CONTENT)
def mark_notification_read(notification_id: int, current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    crud.mark_notification_as_read(db, notification_id, current_user.id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)
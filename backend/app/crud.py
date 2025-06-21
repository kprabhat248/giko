from sqlalchemy.orm import Session,joinedload
import bleach

# --- CORRECTED to Absolute Imports ---
from app import models
from app import schemas
from app import security
# --- END CORRECTION ---

# --- User CRUD ---
def get_user(db: Session, user_id: int):
    return db.query(models.User).filter(models.User.id == user_id).first()

def get_user_by_email(db: Session, email: str):
    return db.query(models.User).filter(models.User.email == email).first()

def create_user(db: Session, user: schemas.UserCreate):
    hashed_password = security.get_password_hash(user.password)
    db_user = models.User(
        email=user.email,
        full_name=user.full_name,
        hashed_password=hashed_password,
        role=user.role,
        manager_id=user.manager_id
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

def get_team_members(db: Session, manager_id: int):
    return db.query(models.User).filter(models.User.manager_id == manager_id).all()

def get_teammates(db: Session, user: models.User):
    if not user.manager_id:
        return []
    return db.query(models.User).filter(
        models.User.manager_id == user.manager_id,
        models.User.id != user.id
    ).all()

# --- Tag CRUD ---
def get_or_create_tags(db: Session, tag_names: list[str]):
    tags = []
    for name in tag_names:
        tag = db.query(models.Tag).filter(models.Tag.name.ilike(name.strip())).first()
        if not tag:
            tag = models.Tag(name=name.strip())
            db.add(tag)
        tags.append(tag)
    db.commit()
    return tags

# --- Feedback CRUD ---
def create_feedback(db: Session, feedback: schemas.FeedbackCreate, manager_id: int):
    tags = get_or_create_tags(db, feedback.tag_names)
    
    db_feedback = models.Feedback(
        strengths=feedback.strengths,
        areas_to_improve=feedback.areas_to_improve,
        sentiment=feedback.sentiment,
        employee_id=feedback.employee_id,
        manager_id=manager_id,
        tags=tags,
        status=models.FeedbackStatus.published
    )
    db.add(db_feedback)
    db.commit()
    db.refresh(db_feedback)
    return db_feedback

def update_feedback(db: Session, db_feedback: models.Feedback, feedback_update: schemas.FeedbackUpdateRequest):
    if feedback_update.strengths is not None:
        db_feedback.strengths = feedback_update.strengths
    if feedback_update.areas_to_improve is not None:
        db_feedback.areas_to_improve = feedback_update.areas_to_improve
    if feedback_update.sentiment is not None:
        db_feedback.sentiment = feedback_update.sentiment
    if feedback_update.tag_names is not None:
        db_feedback.tags = get_or_create_tags(db, feedback_update.tag_names)
    
    # If a draft/request is being filled, change its status
    if db_feedback.status == models.FeedbackStatus.requested:
        db_feedback.status = models.FeedbackStatus.published

    db.commit()
    db.refresh(db_feedback)
    return db_feedback

def get_feedback_for_employee(db: Session, employee_id: int):
    return db.query(models.Feedback).filter(
        models.Feedback.employee_id == employee_id,
        models.Feedback.status == models.FeedbackStatus.published
    ).order_by(models.Feedback.created_at.desc()).all()

def get_feedback_by_id(db: Session, feedback_id: int):
    return db.query(models.Feedback).filter(models.Feedback.id == feedback_id).first()

def acknowledge_feedback(db: Session, db_feedback: models.Feedback):
    db_feedback.is_acknowledged = True
    db.commit()
    db.refresh(db_feedback)
    return db_feedback

def request_feedback(db: Session, employee: models.User):
    if not employee.manager_id:
        return None
    db_feedback_req = models.Feedback(
        employee_id=employee.id,
        manager_id=employee.manager_id,
        status=models.FeedbackStatus.requested
    )
    db.add(db_feedback_req)
    db.commit()
    db.refresh(db_feedback_req)
    return db_feedback_req

def get_feedback_requests_for_manager(db: Session, manager_id: int):
    return db.query(models.Feedback).filter(
        models.Feedback.manager_id == manager_id,
        models.Feedback.status == models.FeedbackStatus.requested
    ).all()


def get_feedback_by_manager(db: Session, manager_id: int):
    """
    Retrieves all feedback records submitted by a specific manager.
    Also fetches the employee's full name for easier display on the frontend.
    """
    feedback_list = db.query(models.Feedback).filter(models.Feedback.manager_id == manager_id).order_by(models.Feedback.created_at.desc()).all()
    
    # Manually attach the employee's full name to each feedback object
    # This populates the 'employee_full_name' field we added to the schema.
    for fb in feedback_list:
        fb.employee_full_name = fb.recipient.full_name # Using the 'recipient' relationship
        
    return feedback_list

# --- Comment CRUD ---
def create_comment(db: Session, feedback: models.Feedback, author: models.User, comment_text: str):
    # Sanitize HTML to prevent XSS attacks
    safe_text = bleach.clean(comment_text, tags=['p', 'b', 'i', 'u', 'em', 'strong', 'a', 'br', 'ul', 'ol', 'li'], attributes={'a': ['href']})
    db_comment = models.Comment(
        text=safe_text,
        feedback_id=feedback.id,
        author_id=author.id
    )
    db.add(db_comment)
    db.commit()
    db.refresh(db_comment)
    return db_comment

# --- Notification CRUD ---
def create_notification(db: Session, user_id: int, message: str, link: str):
    notification = models.Notification(user_id=user_id, message=message, link=link)
    db.add(notification)
    db.commit()
    db.refresh(notification)
    return notification

def get_unread_notifications(db: Session, user_id: int):
    return db.query(models.Notification).filter(
        models.Notification.user_id == user_id,
        models.Notification.is_read == False
    ).order_by(models.Notification.created_at.desc()).all()

def mark_notification_as_read(db: Session, notification_id: int, user_id: int):
    notification = db.query(models.Notification).filter(
        models.Notification.id == notification_id,
        models.Notification.user_id == user_id
    ).first()
    if notification:
        notification.is_read = True
        db.commit()
    return notification

# In app/crud.py

# --- Peer Feedback CRUD ---
def create_peer_feedback(db: Session, feedback_data: schemas.PeerFeedbackCreate, submitter: models.User):
    # Sanitize the new, separate fields instead of the old 'text' field.
    safe_strengths = bleach.clean(feedback_data.strengths)
    safe_areas_to_improve = bleach.clean(feedback_data.areas_to_improve)

    # Create the database model instance with the new fields.
    # This assumes your models.PeerFeedback class has 'strengths' and 'areas_to_improve' columns.
    peer_feedback = models.PeerFeedback(
        target_employee_id=feedback_data.target_employee_id,
        strengths=safe_strengths,
        areas_to_improve=safe_areas_to_improve,
        is_anonymous=feedback_data.is_anonymous,
        submitter_id=submitter.id
    )
    
    db.add(peer_feedback)
    db.commit()
    db.refresh(peer_feedback)
    return peer_feedback

def get_peer_feedback_for_manager(db: Session, manager_id: int):
    """
    Gets all peer feedback written ABOUT a manager's direct team members.
    Eagerly loads the target_employee and submitter to populate names in the UI.
    """
    # --- FIX START ---

    # 1. Get the IDs of the employees who report to this manager.
    #    Using a subquery is efficient.
    team_member_ids = db.query(models.User.id).filter(models.User.manager_id == manager_id).subquery()

    # 2. Build the final, correct query.
    return db.query(models.PeerFeedback).options(
        # THIS is the part that fixes "Unknown Employee". It tells the database
        # to fetch the full User object for both the target and the submitter.
        joinedload(models.PeerFeedback.target_employee),
        joinedload(models.PeerFeedback.submitter)
    ).filter(
        # THIS is the part that enforces your business rule. It only selects
        # feedback where the target_employee_id is in the manager's team.
        models.PeerFeedback.target_employee_id.in_(team_member_ids)
    ).order_by(models.PeerFeedback.created_at.desc()).all()

    # --- FIX END ---
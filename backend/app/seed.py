from sqlalchemy.orm import Session
from app import crud, schemas
from app.database import SessionLocal
from app.models import UserRole

def seed_db():
    """
    Seeds the database with initial data:
    - 2 Managers
    - 5 Employees (2 for Manager 1, 3 for Manager 2)
    - Initial feedback, comments, and requests.
    """
    db: Session = SessionLocal()
    try:
        # Check if the first manager exists to prevent re-seeding
        if crud.get_user_by_email(db, email="manager1@example.com"):
            print("Database already seeded.")
            return

        print("Seeding database with 2 managers and 5 employees...")

        # --- Manager 1 and Team ---
        print("Creating Manager 1 and their team...")
        manager1 = crud.create_user(db, user=schemas.UserCreate(
            email="manager1@example.com",
            full_name="Maria Manager",
            password="password123",
            role=UserRole.manager
        ))
        
        emp1 = crud.create_user(db, user=schemas.UserCreate(
            email="employee1@example.com",
            full_name="Eric Employee",
            password="password123",
            role=UserRole.employee,
            manager_id=manager1.id
        ))
        
        emp2 = crud.create_user(db, user=schemas.UserCreate(
            email="employee2@example.com",
            full_name="Eva Employee",
            password="password123",
            role=UserRole.employee,
            manager_id=manager1.id
        ))
        
        # Add initial feedback for Manager 1's team
        fb1 = crud.create_feedback(db, feedback=schemas.FeedbackCreate(
            employee_id=emp1.id,
            strengths="- Excellent problem-solving skills.\n- Very proactive in team discussions.",
            areas_to_improve="- Could improve documentation on completed tasks.",
            sentiment="positive",
            tag_names=["Q3-Review", "Performance"]
        ), manager_id=manager1.id)

        # Add a comment to the feedback
        crud.create_comment(db, fb1, manager1, "Great work this quarter, Eric!")

        # Add a feedback request for another employee
        crud.request_feedback(db, emp2)

        # --- Manager 2 and Team ---
        print("Creating Manager 2 and their team...")
        manager2 = crud.create_user(db, user=schemas.UserCreate(
            email="manager2@example.com",
            full_name="Michael Manager",
            password="password123",
            role=UserRole.manager
        ))
        
        emp3 = crud.create_user(db, user=schemas.UserCreate(
            email="employee3@example.com",
            full_name="Sam Smith",
            password="password123",
            role=UserRole.employee,
            manager_id=manager2.id
        ))
        
        emp4 = crud.create_user(db, user=schemas.UserCreate(
            email="employee4@example.com",
            full_name="Olivia Chen",
            password="password123",
            role=UserRole.employee,
            manager_id=manager2.id
        ))
        
        emp5 = crud.create_user(db, user=schemas.UserCreate(
            email="employee5@example.com",
            full_name="Ben Carter",
            password="password123",
            role=UserRole.employee,
            manager_id=manager2.id
        ))

        # Add initial feedback for Manager 2's team
        crud.create_feedback(db, feedback=schemas.FeedbackCreate(
            employee_id=emp3.id,
            strengths="- Strong contributor to the Project Alpha launch.\n- Always willing to help teammates.",
            areas_to_improve="- Needs to take more ownership of individual tasks.",
            sentiment="neutral",
            tag_names=["Project-Alpha", "Collaboration"]
        ), manager_id=manager2.id)

        crud.create_feedback(db, feedback=schemas.FeedbackCreate(
            employee_id=emp4.id,
            strengths="- Exceptional attention to detail in all reports.",
            areas_to_improve="- Can be hesitant to share ideas in larger meetings.",
            sentiment="positive",
            tag_names=["Q3-Review", "Detail-Oriented"]
        ), manager_id=manager2.id)
        
        # Add a feedback request for the last employee
        crud.request_feedback(db, emp5)


        print("Database seeded successfully!")

    finally:
        db.close()

if __name__ == "__main__":
    seed_db()
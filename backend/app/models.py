from sqlalchemy import (
    Boolean, Column, ForeignKey, Integer, String, Text, DateTime, Enum, Table
)
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum
from .database import Base

# --- Enums ---
class UserRole(str, enum.Enum):
    manager = "manager"
    employee = "employee"

class FeedbackSentiment(str, enum.Enum):
    positive = "positive"
    neutral = "neutral"
    negative = "negative"

class FeedbackStatus(str, enum.Enum):
    draft = "draft"
    published = "published"
    requested = "requested"

# --- Association Table for Many-to-Many relationship between Feedback and Tag ---
feedback_tags = Table('feedback_tags', Base.metadata,
    Column('feedback_id', Integer, ForeignKey('feedback.id'), primary_key=True),
    Column('tag_id', Integer, ForeignKey('tags.id'), primary_key=True)
)

# --- Main Models ---
class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    full_name = Column(String, nullable=False)
    hashed_password = Column(String, nullable=False)
    role = Column(Enum(UserRole), nullable=False)
    manager_id = Column(Integer, ForeignKey("users.id"), nullable=True)

    manager = relationship("User", remote_side=[id], back_populates="team_members")
    team_members = relationship("User", back_populates="manager")
    
    comments = relationship("Comment", back_populates="author")
    notifications = relationship("Notification", back_populates="user")
    
    # --- FIX 1 of 2: ADD REVERSE RELATIONSHIPS FOR PEER FEEDBACK ---
    # This defines the collection of peer feedback a user has GIVEN.
    feedback_given = relationship(
        "PeerFeedback", 
        foreign_keys="PeerFeedback.submitter_id", 
        back_populates="submitter"
    )
    # This defines the collection of peer feedback a user has RECEIVED.
    feedback_received = relationship(
        "PeerFeedback", 
        foreign_keys="PeerFeedback.target_employee_id", 
        back_populates="target_employee"
    )
    # --- END OF FIX ---
    
class Feedback(Base):
    __tablename__ = "feedback"
    id = Column(Integer, primary_key=True, index=True)
    strengths = Column(Text)
    areas_to_improve = Column(Text)
    sentiment = Column(Enum(FeedbackSentiment))
    status = Column(Enum(FeedbackStatus), nullable=False, default=FeedbackStatus.published)
    is_acknowledged = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    employee_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    manager_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    
    recipient = relationship("User", foreign_keys=[employee_id])
    author = relationship("User", foreign_keys=[manager_id])
    
    tags = relationship("Tag", secondary=feedback_tags, back_populates="feedback_items")
    comments = relationship("Comment", back_populates="feedback", cascade="all, delete-orphan")

class Tag(Base):
    __tablename__ = "tags"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True, nullable=False)
    feedback_items = relationship("Feedback", secondary=feedback_tags, back_populates="tags")

class Comment(Base):
    __tablename__ = "comments"
    id = Column(Integer, primary_key=True, index=True)
    text = Column(Text, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    feedback_id = Column(Integer, ForeignKey("feedback.id"), nullable=False)
    author_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    
    feedback = relationship("Feedback", back_populates="comments")
    author = relationship("User", back_populates="comments")

class Notification(Base):
    __tablename__ = "notifications"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    message = Column(String, nullable=False)
    is_read = Column(Boolean, default=False)
    link = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    user = relationship("User", back_populates="notifications")
    
class PeerFeedback(Base):
    __tablename__ = "peer_feedback"

    id = Column(Integer, primary_key=True, index=True)
    strengths = Column(Text, nullable=False)
    areas_to_improve = Column(Text, nullable=False)
    is_anonymous = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    submitter_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    target_employee_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    
    # --- FIX 2 of 2: UPDATE RELATIONSHIPS TO BE BIDIRECTIONAL ---
    # This relationship now explicitly links to the 'feedback_given' list on the User model.
    submitter = relationship(
        "User", 
        foreign_keys=[submitter_id], 
        back_populates="feedback_given"
    )
    
    # This relationship now explicitly links to the 'feedback_received' list on the User model.
    target_employee = relationship(
        "User", 
        foreign_keys=[target_employee_id], 
        back_populates="feedback_received"
    )
    # --- END OF FIX ---
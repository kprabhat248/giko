from pydantic import BaseModel, EmailStr
from typing import List, Optional
from datetime import datetime

# Assuming your models are in app/models.py
# This ensures we use the Enums for role, sentiment, and status
from . import models

# --- Tag Schemas ---
class TagBase(BaseModel):
    name: str

class TagCreate(TagBase):
    pass

class Tag(TagBase):
    id: int
    class Config:
        orm_mode = True

# --- Comment Schemas ---
class CommentBase(BaseModel):
    text: str

class CommentCreate(CommentBase):
    pass

class UserSimple(BaseModel):
    id: int
    full_name: str
    class Config:
        from_attributes = True

class Comment(CommentBase):
    id: int
    created_at: datetime
    author: UserSimple
    class Config:
        orm_mode = True

# --- Feedback Schemas ---
class FeedbackBase(BaseModel):
    strengths: Optional[str]
    areas_to_improve: Optional[str]
    sentiment: Optional[models.FeedbackSentiment]

class FeedbackCreate(FeedbackBase):
    employee_id: int
    tag_names: List[str] = []

class FeedbackRequest(BaseModel):
    pass # No data needed to request feedback

class FeedbackUpdateRequest(BaseModel):
    strengths: Optional[str] = None
    areas_to_improve: Optional[str] = None
    sentiment: Optional[models.FeedbackSentiment] = None
    tag_names: Optional[List[str]] = None

class Feedback(FeedbackBase):
    id: int
    employee_id: int
    manager_id: int
    status: models.FeedbackStatus
    is_acknowledged: bool
    created_at: datetime
    updated_at: Optional[datetime]
    author: UserSimple
    recipient: UserSimple
    tags: List[Tag]
    comments: List[Comment]

    # --- ADD THIS FIELD ---
    # This field is for the frontend's "Feedback History" tab.
    # We will populate it manually in the crud.py file.
    employee_full_name: Optional[str] = None

    class Config:
        orm_mode = True

# --- User Schemas ---
class UserBase(BaseModel):
    email: EmailStr
    full_name: str

class UserCreate(UserBase):
    password: str
    role: models.UserRole
    manager_id: Optional[int] = None

class User(UserBase):
    id: int
    role: models.UserRole
    manager_id: Optional[int] = None
    class Config:
        orm_mode = True

# --- Auth Schemas ---
class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    email: Optional[str] = None

# --- Notification Schemas ---
class Notification(BaseModel):
    id: int
    message: str
    is_read: bool
    link: Optional[str]
    created_at: datetime
    class Config:
        orm_mode = True
        
# --- Peer Feedback Schemas ---
# NOTE: Your original file had 'text'. Based on your frontend JS, it seems
# 'strengths' and 'areas_to_improve' are more consistent. I've used those here.
class PeerFeedbackCreate(BaseModel):
    target_employee_id: int
    strengths: str
    areas_to_improve: str
    is_anonymous: bool = True

class PeerFeedback(BaseModel):
    id: int
    strengths: str
    areas_to_improve: str
    is_anonymous: bool
    created_at: datetime
    target_employee: UserSimple
    submitter: Optional[UserSimple] # Optional for anonymous
    class Config:
        from_attributes = True

# --- Dashboard Schemas ---

# --- ADD THIS NEW SCHEMA ---
# This defines the structure for our sentiment trend data.
class SentimentTrends(BaseModel):
    positive: int
    neutral: int
    negative: int


# --- UPDATE THIS SCHEMA ---
class ManagerDashboard(BaseModel):
    team_members: List[User]
    feedback_requests: List[Feedback]
    peer_feedback: List[PeerFeedback]
    
    # --- ADD THESE TWO LINES ---
    feedback_history: List[Feedback]
    sentiment_trends: SentimentTrends
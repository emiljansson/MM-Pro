from pydantic import BaseModel, Field, EmailStr
from typing import Optional, Dict, List
from datetime import datetime
import uuid


class UserStatistics(BaseModel):
    games_played: int = 0
    total_correct: int = 0
    total_questions: int = 0
    best_streak: int = 0
    current_streak: int = 0
    total_time_played: float = 0.0
    category_stats: Dict[str, Dict] = {}


class UserBase(BaseModel):
    email: EmailStr
    display_name: str = Field(..., min_length=2, max_length=50)
    language: str = "sv"


class UserCreate(UserBase):
    password: Optional[str] = Field(None, min_length=6)


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserUpdate(BaseModel):
    display_name: Optional[str] = Field(None, min_length=2, max_length=50)
    first_name: Optional[str] = Field(None, max_length=50)
    last_name: Optional[str] = Field(None, max_length=50)
    email: Optional[EmailStr] = None
    language: Optional[str] = None
    picture: Optional[str] = None


class User(UserBase):
    user_id: str = Field(default_factory=lambda: f"user_{uuid.uuid4().hex[:12]}")
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    picture: Optional[str] = None
    role: str = "user"  # user, admin, superadmin
    statistics: UserStatistics = Field(default_factory=UserStatistics)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    is_pro: bool = False
    auth_provider: str = "email"  # email, google

    class Config:
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }


class UserSession(BaseModel):
    session_id: str = Field(default_factory=lambda: uuid.uuid4().hex)
    user_id: str
    session_token: str = Field(default_factory=lambda: f"sess_{uuid.uuid4().hex}")
    expires_at: datetime
    created_at: datetime = Field(default_factory=datetime.utcnow)


class UserPublic(BaseModel):
    user_id: str
    display_name: str
    picture: Optional[str] = None
    language: str
    role: str
    statistics: UserStatistics
    is_pro: bool
    created_at: datetime


class PasswordReset(BaseModel):
    email: EmailStr


class PasswordResetConfirm(BaseModel):
    token: str
    new_password: str = Field(..., min_length=6)

from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
import uuid
import random
import string


def generate_invite_code() -> str:
    """Generate a 6-character invite code with mixed letters and numbers"""
    chars = string.ascii_uppercase + string.digits
    return ''.join(random.choices(chars, k=6))


class GroupMember(BaseModel):
    user_id: str
    display_name: str
    role: str = "member"  # member, admin
    joined_at: datetime = Field(default_factory=datetime.utcnow)


class GroupBase(BaseModel):
    name: str = Field(..., min_length=2, max_length=50)
    description: Optional[str] = None


class GroupCreate(GroupBase):
    pass


class GroupUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=2, max_length=50)
    description: Optional[str] = None


class Group(GroupBase):
    group_id: str = Field(default_factory=lambda: f"grp_{uuid.uuid4().hex[:8]}")
    invite_code: str = Field(default_factory=generate_invite_code)
    creator_id: str
    members: List[GroupMember] = []
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)


class GroupJoin(BaseModel):
    invite_code: str = Field(..., min_length=6, max_length=6)


class GroupMemberUpdate(BaseModel):
    user_id: str
    role: str  # member, admin


class ChallengeBase(BaseModel):
    name: str
    description: Optional[str] = None
    categories: List[str]  # List of category keys
    difficulty: str
    question_count: int = 15
    start_date: datetime
    end_date: datetime
    daily_challenge: bool = False  # If true, must complete each day


class ChallengeCreate(ChallengeBase):
    pass


class ChallengeParticipant(BaseModel):
    user_id: str
    display_name: str
    score: int = 0
    completed_days: List[datetime] = []
    best_time: Optional[float] = None
    joined_at: datetime = Field(default_factory=datetime.utcnow)


class Challenge(ChallengeBase):
    challenge_id: str = Field(default_factory=lambda: f"chal_{uuid.uuid4().hex[:8]}")
    group_id: str
    creator_id: str
    participants: List[ChallengeParticipant] = []
    active: bool = True
    created_at: datetime = Field(default_factory=datetime.utcnow)

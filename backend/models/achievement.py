from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
import uuid


class AchievementBase(BaseModel):
    key: str  # unique key for the achievement
    name_key: str  # translation key
    description_key: str  # translation key
    icon: str  # icon name or emoji
    category: str  # games, streaks, social, special
    requirement_type: str  # games_played, correct_answers, streak, etc.
    requirement_value: int
    points: int = 10
    tier: str = "bronze"  # bronze, silver, gold, platinum


class AchievementCreate(AchievementBase):
    pass


class AchievementUpdate(BaseModel):
    name_key: Optional[str] = None
    description_key: Optional[str] = None
    icon: Optional[str] = None
    requirement_value: Optional[int] = None
    points: Optional[int] = None
    tier: Optional[str] = None
    active: Optional[bool] = None


class Achievement(AchievementBase):
    achievement_id: str = Field(default_factory=lambda: f"ach_{uuid.uuid4().hex[:8]}")
    active: bool = True
    created_at: datetime = Field(default_factory=datetime.utcnow)


class UserAchievement(BaseModel):
    user_achievement_id: str = Field(default_factory=lambda: f"ua_{uuid.uuid4().hex[:8]}")
    user_id: str
    achievement_id: str
    achievement_key: str
    earned_at: datetime = Field(default_factory=datetime.utcnow)
    notified: bool = False


class LeaderboardEntry(BaseModel):
    user_id: str
    display_name: str
    picture: Optional[str] = None
    score: int
    category: str
    rank: int

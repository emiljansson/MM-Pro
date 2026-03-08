from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime
import uuid


class DifficultyLevel(BaseModel):
    key: str  # easy, medium, hard, expert
    name_key: str  # translation key
    description_key: str  # translation key
    min_value: int
    max_value: int
    time_bonus: float = 1.0  # multiplier for score


class GameCategoryBase(BaseModel):
    key: str  # addition, subtraction, fractions, etc.
    name_key: str  # translation key
    description_key: str  # translation key
    icon: str  # icon name
    color: str  # hex color
    pro_only: bool = False
    active: bool = True
    order: int = 0


class GameCategoryCreate(GameCategoryBase):
    levels: List[DifficultyLevel] = []


class GameCategoryUpdate(BaseModel):
    name_key: Optional[str] = None
    description_key: Optional[str] = None
    icon: Optional[str] = None
    color: Optional[str] = None
    pro_only: Optional[bool] = None
    active: Optional[bool] = None
    order: Optional[int] = None
    levels: Optional[List[DifficultyLevel]] = None


class GameCategory(GameCategoryBase):
    category_id: str = Field(default_factory=lambda: f"cat_{uuid.uuid4().hex[:8]}")
    levels: List[DifficultyLevel] = []
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)


class Question(BaseModel):
    question_id: str = Field(default_factory=lambda: f"q_{uuid.uuid4().hex[:8]}")
    num1: Any  # Can be int, float, or string for complex questions
    num2: Any
    operation: str
    symbol: str
    correct_answer: Any
    display: str
    options: Optional[List[Any]] = None  # For multiple choice
    hint: Optional[str] = None
    image_url: Optional[str] = None  # For geometry questions


class GameSessionCreate(BaseModel):
    category: str
    difficulty: str
    question_count: int
    score: int
    correct_answers: int
    total_time: float
    answers: List[Dict] = []


class GameSession(GameSessionCreate):
    session_id: str = Field(default_factory=lambda: f"game_{uuid.uuid4().hex[:8]}")
    user_id: Optional[str] = None
    language: str = "sv"
    created_at: datetime = Field(default_factory=datetime.utcnow)


class GenerateQuestionsRequest(BaseModel):
    category: str = "addition"
    difficulty: str = "easy"
    count: int = 15
    operations: Optional[List[str]] = None  # For backwards compatibility

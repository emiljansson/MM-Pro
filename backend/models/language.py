from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime
import uuid


class LanguageBase(BaseModel):
    code: str = Field(..., min_length=2, max_length=10)
    name: str  # English name
    native_name: str  # Native name
    rtl: bool = False
    active: bool = True
    priority: int = 100  # Lower = higher priority


class LanguageCreate(LanguageBase):
    pass


class LanguageUpdate(BaseModel):
    name: Optional[str] = None
    native_name: Optional[str] = None
    rtl: Optional[bool] = None
    active: Optional[bool] = None
    priority: Optional[int] = None


class Language(LanguageBase):
    language_id: str = Field(default_factory=lambda: f"lang_{uuid.uuid4().hex[:8]}")
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)


class TranslationBase(BaseModel):
    key: str
    language_code: str
    text: str
    category: str = "ui"  # ui, game, admin, achievement, etc.


class TranslationCreate(TranslationBase):
    pass


class TranslationUpdate(BaseModel):
    text: str


class Translation(TranslationBase):
    translation_id: str = Field(default_factory=lambda: f"trans_{uuid.uuid4().hex[:8]}")
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    updated_by: Optional[str] = None  # user_id


class TranslationBulkUpdate(BaseModel):
    translations: list[TranslationCreate]

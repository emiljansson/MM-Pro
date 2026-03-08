from fastapi import APIRouter, HTTPException, Request
from typing import List, Optional
from datetime import datetime, timezone

from models import (
    Language, LanguageCreate, LanguageUpdate,
    Translation, TranslationCreate, TranslationUpdate, TranslationBulkUpdate
)
from routes.auth import require_admin, require_superadmin

router = APIRouter(prefix="/api/languages", tags=["Languages"])

# Default languages data
DEFAULT_LANGUAGES = [
    {"code": "sv", "name": "Swedish", "native_name": "Svenska", "rtl": False, "priority": 1},
    {"code": "en", "name": "English", "native_name": "English", "rtl": False, "priority": 2},
    {"code": "ar", "name": "Arabic", "native_name": "العربية", "rtl": True, "priority": 3},
    {"code": "fi", "name": "Finnish", "native_name": "Suomi", "rtl": False, "priority": 4},
    {"code": "es", "name": "Spanish", "native_name": "Español", "rtl": False, "priority": 5},
    {"code": "so", "name": "Somali", "native_name": "Soomaali", "rtl": False, "priority": 6},
]


@router.get("/")
async def get_languages(request: Request, active_only: bool = True):
    """Get all languages"""
    db = request.app.state.db
    
    query = {"active": True} if active_only else {}
    languages = await db.languages.find(query, {"_id": 0}).sort("priority", 1).to_list(100)
    
    if not languages:
        # Return default languages if none in DB
        return DEFAULT_LANGUAGES
    
    return languages


@router.get("/{code}")
async def get_language(request: Request, code: str):
    """Get a specific language by code"""
    db = request.app.state.db
    
    language = await db.languages.find_one({"code": code}, {"_id": 0})
    if not language:
        # Check default languages
        for lang in DEFAULT_LANGUAGES:
            if lang["code"] == code:
                return lang
        raise HTTPException(status_code=404, detail="Language not found")
    
    return language


@router.post("/")
async def create_language(request: Request, language_data: LanguageCreate):
    """Create a new language (superadmin only)"""
    await require_superadmin(request)
    db = request.app.state.db
    
    # Check if exists
    existing = await db.languages.find_one({"code": language_data.code})
    if existing:
        raise HTTPException(status_code=400, detail="Language code already exists")
    
    language = Language(**language_data.dict())
    lang_dict = language.dict()
    lang_dict["created_at"] = datetime.now(timezone.utc)
    lang_dict["updated_at"] = datetime.now(timezone.utc)
    
    await db.languages.insert_one(lang_dict)
    lang_dict.pop("_id", None)
    
    return lang_dict


@router.put("/{code}")
async def update_language(request: Request, code: str, update_data: LanguageUpdate):
    """Update a language (superadmin only)"""
    await require_superadmin(request)
    db = request.app.state.db
    
    update_dict = {k: v for k, v in update_data.dict().items() if v is not None}
    if update_dict:
        update_dict["updated_at"] = datetime.now(timezone.utc)
        result = await db.languages.update_one(
            {"code": code},
            {"$set": update_dict}
        )
        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="Language not found")
    
    language = await db.languages.find_one({"code": code}, {"_id": 0})
    return language


@router.delete("/{code}")
async def delete_language(request: Request, code: str):
    """Delete a language (superadmin only)"""
    await require_superadmin(request)
    db = request.app.state.db
    
    # Don't allow deleting default languages
    if code in ["sv", "en"]:
        raise HTTPException(status_code=400, detail="Cannot delete default languages")
    
    result = await db.languages.delete_one({"code": code})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Language not found")
    
    # Also delete all translations for this language
    await db.translations.delete_many({"language_code": code})
    
    return {"message": "Language deleted"}


# Translation routes
@router.get("/translations/{language_code}")
async def get_translations(request: Request, language_code: str, category: Optional[str] = None):
    """Get all translations for a language"""
    db = request.app.state.db
    
    query = {"language_code": language_code}
    if category:
        query["category"] = category
    
    translations = await db.translations.find(query, {"_id": 0}).to_list(5000)
    
    # Convert to key-value format
    result = {}
    for trans in translations:
        result[trans["key"]] = trans["text"]
    
    return result


@router.get("/translations/{language_code}/full")
async def get_translations_full(request: Request, language_code: str):
    """Get all translations with full details (admin)"""
    await require_admin(request)
    db = request.app.state.db
    
    translations = await db.translations.find(
        {"language_code": language_code},
        {"_id": 0}
    ).to_list(5000)
    
    return translations


@router.post("/translations")
async def create_translation(request: Request, translation_data: TranslationCreate):
    """Create or update a translation (admin)"""
    user = await require_admin(request)
    db = request.app.state.db
    
    # Upsert translation
    await db.translations.update_one(
        {
            "key": translation_data.key,
            "language_code": translation_data.language_code
        },
        {
            "$set": {
                "text": translation_data.text,
                "category": translation_data.category,
                "updated_at": datetime.now(timezone.utc),
                "updated_by": user.user_id
            },
            "$setOnInsert": {
                "translation_id": f"trans_{datetime.now().strftime('%Y%m%d%H%M%S')}"
            }
        },
        upsert=True
    )
    
    return {"message": "Translation saved"}


@router.post("/translations/bulk")
async def bulk_update_translations(request: Request, data: TranslationBulkUpdate):
    """Bulk update translations (admin)"""
    user = await require_admin(request)
    db = request.app.state.db
    
    for trans in data.translations:
        await db.translations.update_one(
            {
                "key": trans.key,
                "language_code": trans.language_code
            },
            {
                "$set": {
                    "text": trans.text,
                    "category": trans.category,
                    "updated_at": datetime.now(timezone.utc),
                    "updated_by": user.user_id
                },
                "$setOnInsert": {
                    "translation_id": f"trans_{datetime.now().strftime('%Y%m%d%H%M%S')}"
                }
            },
            upsert=True
        )
    
    return {"message": f"Updated {len(data.translations)} translations"}


@router.delete("/translations/{language_code}/{key}")
async def delete_translation(request: Request, language_code: str, key: str):
    """Delete a translation (admin)"""
    await require_admin(request)
    db = request.app.state.db
    
    result = await db.translations.delete_one({
        "key": key,
        "language_code": language_code
    })
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Translation not found")
    
    return {"message": "Translation deleted"}

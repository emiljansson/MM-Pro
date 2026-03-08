from fastapi import APIRouter, HTTPException, Request
from typing import List, Optional
from datetime import datetime, timezone

from models import (
    GameCategory, GameCategoryCreate, GameCategoryUpdate,
    GameSession, GameSessionCreate, Question, GenerateQuestionsRequest,
    DifficultyLevel
)
from utils.questions import generate_questions, DIFFICULTY_RANGES
from routes.auth import get_current_user, require_auth, require_admin

router = APIRouter(prefix="/api/games", tags=["Games"])

# Default game categories
DEFAULT_CATEGORIES = [
    {
        "key": "addition",
        "name_key": "addition",
        "description_key": "addition_desc",
        "icon": "add-circle",
        "color": "#81D4FA",
        "pro_only": False,
        "order": 1,
        "levels": [
            {"key": "easy", "name_key": "easy", "description_key": "easy_desc", "min_value": 1, "max_value": 10, "time_bonus": 1.0},
            {"key": "medium", "name_key": "medium", "description_key": "medium_desc", "min_value": 10, "max_value": 50, "time_bonus": 1.2},
            {"key": "hard", "name_key": "hard", "description_key": "hard_desc", "min_value": 50, "max_value": 100, "time_bonus": 1.5},
        ]
    },
    {
        "key": "subtraction",
        "name_key": "subtraction",
        "description_key": "subtraction_desc",
        "icon": "remove-circle",
        "color": "#FFB74D",
        "pro_only": False,
        "order": 2,
        "levels": [
            {"key": "easy", "name_key": "easy", "description_key": "easy_desc", "min_value": 1, "max_value": 10, "time_bonus": 1.0},
            {"key": "medium", "name_key": "medium", "description_key": "medium_desc", "min_value": 10, "max_value": 50, "time_bonus": 1.2},
            {"key": "hard", "name_key": "hard", "description_key": "hard_desc", "min_value": 50, "max_value": 100, "time_bonus": 1.5},
        ]
    },
    {
        "key": "multiplication",
        "name_key": "multiplication",
        "description_key": "multiplication_desc",
        "icon": "close-circle",
        "color": "#CE93D8",
        "pro_only": False,
        "order": 3,
        "levels": [
            {"key": "easy", "name_key": "easy", "description_key": "easy_desc", "min_value": 1, "max_value": 10, "time_bonus": 1.0},
            {"key": "medium", "name_key": "medium", "description_key": "medium_desc", "min_value": 1, "max_value": 12, "time_bonus": 1.2},
            {"key": "hard", "name_key": "hard", "description_key": "hard_desc", "min_value": 1, "max_value": 15, "time_bonus": 1.5},
        ]
    },
    {
        "key": "division",
        "name_key": "division",
        "description_key": "division_desc",
        "icon": "git-compare",
        "color": "#A5D6A7",
        "pro_only": False,
        "order": 4,
        "levels": [
            {"key": "easy", "name_key": "easy", "description_key": "easy_desc", "min_value": 1, "max_value": 10, "time_bonus": 1.0},
            {"key": "medium", "name_key": "medium", "description_key": "medium_desc", "min_value": 1, "max_value": 12, "time_bonus": 1.2},
            {"key": "hard", "name_key": "hard", "description_key": "hard_desc", "min_value": 1, "max_value": 15, "time_bonus": 1.5},
        ]
    },
    {
        "key": "fractions",
        "name_key": "fractions",
        "description_key": "fractions_desc",
        "icon": "pie-chart",
        "color": "#F48FB1",
        "pro_only": False,
        "order": 5,
        "levels": [
            {"key": "easy", "name_key": "easy", "description_key": "fractions_easy_desc", "min_value": 2, "max_value": 6, "time_bonus": 1.0},
            {"key": "medium", "name_key": "medium", "description_key": "fractions_medium_desc", "min_value": 2, "max_value": 12, "time_bonus": 1.2},
            {"key": "hard", "name_key": "hard", "description_key": "fractions_hard_desc", "min_value": 2, "max_value": 20, "time_bonus": 1.5},
        ]
    },
    {
        "key": "equations",
        "name_key": "equations",
        "description_key": "equations_desc",
        "icon": "code-working",
        "color": "#90CAF9",
        "pro_only": False,
        "order": 6,
        "levels": [
            {"key": "easy", "name_key": "easy", "description_key": "equations_easy_desc", "min_value": 1, "max_value": 10, "time_bonus": 1.0},
            {"key": "medium", "name_key": "medium", "description_key": "equations_medium_desc", "min_value": 1, "max_value": 20, "time_bonus": 1.2},
            {"key": "hard", "name_key": "hard", "description_key": "equations_hard_desc", "min_value": 1, "max_value": 50, "time_bonus": 1.5},
        ]
    },
    {
        "key": "percentage",
        "name_key": "percentage",
        "description_key": "percentage_desc",
        "icon": "analytics",
        "color": "#FFCC80",
        "pro_only": False,
        "order": 7,
        "levels": [
            {"key": "easy", "name_key": "easy", "description_key": "percentage_easy_desc", "min_value": 10, "max_value": 100, "time_bonus": 1.0},
            {"key": "medium", "name_key": "medium", "description_key": "percentage_medium_desc", "min_value": 10, "max_value": 500, "time_bonus": 1.2},
            {"key": "hard", "name_key": "hard", "description_key": "percentage_hard_desc", "min_value": 10, "max_value": 1000, "time_bonus": 1.5},
        ]
    },
    {
        "key": "geometry",
        "name_key": "geometry",
        "description_key": "geometry_desc",
        "icon": "shapes",
        "color": "#B39DDB",
        "pro_only": False,
        "order": 8,
        "levels": [
            {"key": "easy", "name_key": "easy", "description_key": "geometry_easy_desc", "min_value": 1, "max_value": 10, "time_bonus": 1.0},
            {"key": "medium", "name_key": "medium", "description_key": "geometry_medium_desc", "min_value": 5, "max_value": 20, "time_bonus": 1.2},
            {"key": "hard", "name_key": "hard", "description_key": "geometry_hard_desc", "min_value": 10, "max_value": 50, "time_bonus": 1.5},
        ]
    },
    {
        "key": "units",
        "name_key": "units",
        "description_key": "units_desc",
        "icon": "resize",
        "color": "#80DEEA",
        "pro_only": False,
        "order": 9,
        "levels": [
            {"key": "easy", "name_key": "easy", "description_key": "units_easy_desc", "min_value": 1, "max_value": 10, "time_bonus": 1.0},
            {"key": "medium", "name_key": "medium", "description_key": "units_medium_desc", "min_value": 1, "max_value": 100, "time_bonus": 1.2},
            {"key": "hard", "name_key": "hard", "description_key": "units_hard_desc", "min_value": 1, "max_value": 1000, "time_bonus": 1.5},
        ]
    },
    {
        "key": "rounding",
        "name_key": "rounding",
        "description_key": "rounding_desc",
        "icon": "swap-horizontal",
        "color": "#BCAAA4",
        "pro_only": False,
        "order": 10,
        "levels": [
            {"key": "easy", "name_key": "easy", "description_key": "rounding_easy_desc", "min_value": 1, "max_value": 100, "time_bonus": 1.0},
            {"key": "medium", "name_key": "medium", "description_key": "rounding_medium_desc", "min_value": 1, "max_value": 1000, "time_bonus": 1.2},
            {"key": "hard", "name_key": "hard", "description_key": "rounding_hard_desc", "min_value": 1, "max_value": 10000, "time_bonus": 1.5},
        ]
    },
    {
        "key": "angles",
        "name_key": "angles",
        "description_key": "angles_desc",
        "icon": "compass",
        "color": "#EF9A9A",
        "pro_only": False,
        "order": 11,
        "levels": [
            {"key": "easy", "name_key": "easy", "description_key": "angles_easy_desc", "min_value": 10, "max_value": 90, "time_bonus": 1.0},
            {"key": "medium", "name_key": "medium", "description_key": "angles_medium_desc", "min_value": 10, "max_value": 180, "time_bonus": 1.2},
            {"key": "hard", "name_key": "hard", "description_key": "angles_hard_desc", "min_value": 10, "max_value": 360, "time_bonus": 1.5},
        ]
    },
    {
        "key": "probability",
        "name_key": "probability",
        "description_key": "probability_desc",
        "icon": "dice",
        "color": "#C5E1A5",
        "pro_only": False,
        "order": 12,
        "levels": [
            {"key": "easy", "name_key": "easy", "description_key": "probability_easy_desc", "min_value": 2, "max_value": 6, "time_bonus": 1.0},
            {"key": "medium", "name_key": "medium", "description_key": "probability_medium_desc", "min_value": 2, "max_value": 12, "time_bonus": 1.2},
            {"key": "hard", "name_key": "hard", "description_key": "probability_hard_desc", "min_value": 2, "max_value": 20, "time_bonus": 1.5},
        ]
    },
    {
        "key": "diagrams",
        "name_key": "diagrams",
        "description_key": "diagrams_desc",
        "icon": "bar-chart",
        "color": "#FFF59D",
        "pro_only": False,
        "order": 13,
        "levels": [
            {"key": "easy", "name_key": "easy", "description_key": "diagrams_easy_desc", "min_value": 1, "max_value": 20, "time_bonus": 1.0},
            {"key": "medium", "name_key": "medium", "description_key": "diagrams_medium_desc", "min_value": 10, "max_value": 50, "time_bonus": 1.2},
            {"key": "hard", "name_key": "hard", "description_key": "diagrams_hard_desc", "min_value": 20, "max_value": 100, "time_bonus": 1.5},
        ]
    },
]


@router.get("/categories")
async def get_categories(request: Request, include_pro: bool = True):
    """Get all game categories"""
    db = request.app.state.db
    
    # Check if user is pro
    user = await get_current_user(request)
    is_pro = user and user.is_pro if user else False
    
    # Get categories from DB
    categories = await db.game_categories.find(
        {"active": True},
        {"_id": 0}
    ).sort("order", 1).to_list(100)
    
    if not categories:
        categories = DEFAULT_CATEGORIES
    
    # Filter pro categories if user is not pro
    if not include_pro or not is_pro:
        # Mark pro_only categories as locked instead of filtering them out
        for cat in categories:
            if cat.get("pro_only") and not is_pro:
                cat["locked"] = True
    
    return categories


@router.get("/categories/{key}")
async def get_category(request: Request, key: str):
    """Get a specific category"""
    db = request.app.state.db
    
    category = await db.game_categories.find_one({"key": key}, {"_id": 0})
    
    if not category:
        for cat in DEFAULT_CATEGORIES:
            if cat["key"] == key:
                return cat
        raise HTTPException(status_code=404, detail="Category not found")
    
    return category


@router.post("/categories")
async def create_category(request: Request, category_data: GameCategoryCreate):
    """Create a new category (admin)"""
    await require_admin(request)
    db = request.app.state.db
    
    existing = await db.game_categories.find_one({"key": category_data.key})
    if existing:
        raise HTTPException(status_code=400, detail="Category key already exists")
    
    category = GameCategory(**category_data.dict())
    cat_dict = category.dict()
    cat_dict["created_at"] = datetime.now(timezone.utc)
    cat_dict["updated_at"] = datetime.now(timezone.utc)
    
    await db.game_categories.insert_one(cat_dict)
    cat_dict.pop("_id", None)
    
    return cat_dict


@router.put("/categories/{key}")
async def update_category(request: Request, key: str, update_data: GameCategoryUpdate):
    """Update a category (admin)"""
    await require_admin(request)
    db = request.app.state.db
    
    update_dict = {k: v for k, v in update_data.dict().items() if v is not None}
    if update_dict:
        update_dict["updated_at"] = datetime.now(timezone.utc)
        result = await db.game_categories.update_one(
            {"key": key},
            {"$set": update_dict}
        )
        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="Category not found")
    
    category = await db.game_categories.find_one({"key": key}, {"_id": 0})
    return category


@router.post("/generate")
async def generate_game_questions(request: Request, req: GenerateQuestionsRequest):
    """Generate questions for a game - all categories are free"""
    # Get user's language preference
    user = await get_current_user(request)
    language = user.language if user else "sv"
    
    # Also check for language in request headers
    accept_language = request.headers.get("Accept-Language", "sv")
    if accept_language and not user:
        lang_code = accept_language.split(",")[0].split("-")[0].lower()
        if lang_code in ["sv", "en", "ar", "fi", "es", "so"]:
            language = lang_code
    
    # Generate questions with language
    questions = generate_questions(
        category=req.category,
        difficulty=req.difficulty,
        count=req.count,
        operations=req.operations,
        language=language
    )
    
    return {"questions": questions}


@router.post("/sessions")
async def save_game_session(request: Request, session_data: GameSessionCreate):
    """Save a game session"""
    db = request.app.state.db
    user = await get_current_user(request)
    
    session = GameSession(**session_data.dict())
    session_dict = session.dict()
    
    if user:
        session_dict["user_id"] = user.user_id
        session_dict["language"] = user.language
        
        # Update user statistics
        await db.users.update_one(
            {"user_id": user.user_id},
            {
                "$inc": {
                    "statistics.games_played": 1,
                    "statistics.total_correct": session_data.correct_answers,
                    "statistics.total_questions": session_data.question_count,
                    "statistics.total_time_played": session_data.total_time
                }
            }
        )
        
        # Update category stats
        category = session_data.category
        await db.users.update_one(
            {"user_id": user.user_id},
            {
                "$inc": {
                    f"statistics.category_stats.{category}.games": 1,
                    f"statistics.category_stats.{category}.correct": session_data.correct_answers,
                    f"statistics.category_stats.{category}.total": session_data.question_count
                }
            }
        )
    
    session_dict["created_at"] = datetime.now(timezone.utc)
    await db.game_sessions.insert_one(session_dict)
    session_dict.pop("_id", None)
    
    return session_dict


@router.get("/history")
async def get_game_history(
    request: Request,
    category: Optional[str] = None,
    difficulty: Optional[str] = None,
    limit: int = 50
):
    """Get game history for current user"""
    user = await require_auth(request)
    db = request.app.state.db
    
    query = {"user_id": user.user_id}
    if category:
        query["category"] = category
    if difficulty:
        query["difficulty"] = difficulty
    
    sessions = await db.game_sessions.find(
        query,
        {"_id": 0}
    ).sort("created_at", -1).limit(limit).to_list(limit)
    
    return sessions


@router.get("/stats")
async def get_game_stats(request: Request):
    """Get game statistics for current user"""
    user = await require_auth(request)
    db = request.app.state.db
    
    # Get user with stats
    user_doc = await db.users.find_one({"user_id": user.user_id}, {"_id": 0})
    
    return {
        "statistics": user_doc.get("statistics", {}),
        "user_id": user.user_id,
        "display_name": user_doc.get("display_name")
    }

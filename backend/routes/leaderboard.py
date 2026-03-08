from fastapi import APIRouter, HTTPException, Request
from typing import List, Optional
from datetime import datetime, timezone

from models import (
    Achievement, AchievementCreate, AchievementUpdate,
    UserAchievement, LeaderboardEntry
)
from routes.auth import require_auth, get_current_user, require_admin

router = APIRouter(prefix="/api", tags=["Achievements & Leaderboard"])

# Default achievements
DEFAULT_ACHIEVEMENTS = [
    {
        "key": "first_game",
        "name_key": "ach_first_game",
        "description_key": "ach_first_game_desc",
        "icon": "star",
        "category": "games",
        "requirement_type": "games_played",
        "requirement_value": 1,
        "points": 10,
        "tier": "bronze"
    },
    {
        "key": "ten_games",
        "name_key": "ach_ten_games",
        "description_key": "ach_ten_games_desc",
        "icon": "ribbon",
        "category": "games",
        "requirement_type": "games_played",
        "requirement_value": 10,
        "points": 50,
        "tier": "silver"
    },
    {
        "key": "hundred_games",
        "name_key": "ach_hundred_games",
        "description_key": "ach_hundred_games_desc",
        "icon": "trophy",
        "category": "games",
        "requirement_type": "games_played",
        "requirement_value": 100,
        "points": 200,
        "tier": "gold"
    },
    {
        "key": "perfect_game",
        "name_key": "ach_perfect_game",
        "description_key": "ach_perfect_game_desc",
        "icon": "medal",
        "category": "special",
        "requirement_type": "perfect_score",
        "requirement_value": 1,
        "points": 100,
        "tier": "gold"
    },
    {
        "key": "streak_5",
        "name_key": "ach_streak_5",
        "description_key": "ach_streak_5_desc",
        "icon": "flame",
        "category": "streaks",
        "requirement_type": "streak",
        "requirement_value": 5,
        "points": 30,
        "tier": "bronze"
    },
    {
        "key": "streak_10",
        "name_key": "ach_streak_10",
        "description_key": "ach_streak_10_desc",
        "icon": "bonfire",
        "category": "streaks",
        "requirement_type": "streak",
        "requirement_value": 10,
        "points": 75,
        "tier": "silver"
    },
    {
        "key": "math_master",
        "name_key": "ach_math_master",
        "description_key": "ach_math_master_desc",
        "icon": "school",
        "category": "special",
        "requirement_type": "all_categories",
        "requirement_value": 1,
        "points": 500,
        "tier": "platinum"
    },
]


@router.get("/achievements")
async def get_achievements(request: Request):
    """Get all available achievements"""
    db = request.app.state.db
    
    achievements = await db.achievements.find(
        {"active": True},
        {"_id": 0}
    ).to_list(100)
    
    if not achievements:
        return DEFAULT_ACHIEVEMENTS
    
    return achievements


@router.get("/achievements/my")
async def get_my_achievements(request: Request):
    """Get current user's earned achievements"""
    user = await require_auth(request)
    db = request.app.state.db
    
    user_achievements = await db.user_achievements.find(
        {"user_id": user.user_id},
        {"_id": 0}
    ).to_list(100)
    
    # Get full achievement details
    earned_keys = [ua["achievement_key"] for ua in user_achievements]
    
    all_achievements = await db.achievements.find(
        {"active": True},
        {"_id": 0}
    ).to_list(100)
    
    if not all_achievements:
        all_achievements = DEFAULT_ACHIEVEMENTS
    
    result = []
    for ach in all_achievements:
        earned = ach["key"] in earned_keys
        earned_at = None
        if earned:
            ua = next((ua for ua in user_achievements if ua["achievement_key"] == ach["key"]), None)
            if ua:
                earned_at = ua.get("earned_at")
        
        result.append({
            **ach,
            "earned": earned,
            "earned_at": earned_at
        })
    
    return result


@router.post("/achievements")
async def create_achievement(request: Request, achievement_data: AchievementCreate):
    """Create a new achievement (admin only)"""
    await require_admin(request)
    db = request.app.state.db
    
    existing = await db.achievements.find_one({"key": achievement_data.key})
    if existing:
        raise HTTPException(status_code=400, detail="Achievement key already exists")
    
    achievement = Achievement(**achievement_data.dict())
    ach_dict = achievement.dict()
    ach_dict["created_at"] = datetime.now(timezone.utc)
    
    await db.achievements.insert_one(ach_dict)
    ach_dict.pop("_id", None)
    
    return ach_dict


# Leaderboard endpoints
@router.get("/leaderboard")
async def get_leaderboard(
    request: Request,
    category: Optional[str] = None,
    limit: int = 50
):
    """Get leaderboard - overall or by category"""
    db = request.app.state.db
    
    if category:
        # Category-specific leaderboard
        pipeline = [
            {"$match": {f"statistics.category_stats.{category}": {"$exists": True}}},
            {
                "$project": {
                    "_id": 0,
                    "user_id": 1,
                    "display_name": 1,
                    "picture": 1,
                    "score": f"$statistics.category_stats.{category}.correct",
                    "games": f"$statistics.category_stats.{category}.games"
                }
            },
            {"$match": {"score": {"$gt": 0}}},
            {"$sort": {"score": -1}},
            {"$limit": limit}
        ]
    else:
        # Overall leaderboard
        pipeline = [
            {"$match": {"statistics.total_correct": {"$gt": 0}}},
            {
                "$project": {
                    "_id": 0,
                    "user_id": 1,
                    "display_name": 1,
                    "picture": 1,
                    "score": "$statistics.total_correct",
                    "games": "$statistics.games_played"
                }
            },
            {"$sort": {"score": -1}},
            {"$limit": limit}
        ]
    
    results = await db.users.aggregate(pipeline).to_list(limit)
    
    # Add ranks
    for i, entry in enumerate(results):
        entry["rank"] = i + 1
        entry["category"] = category or "overall"
    
    return results


@router.get("/leaderboard/categories")
async def get_leaderboard_categories(request: Request, limit: int = 10):
    """Get top players for each category"""
    db = request.app.state.db
    
    categories = [
        "addition", "subtraction", "multiplication", "division",
        "fractions", "equations", "geometry", "percentage",
        "units", "rounding", "angles", "probability", "diagrams"
    ]
    
    result = {}
    
    for category in categories:
        pipeline = [
            {"$match": {f"statistics.category_stats.{category}": {"$exists": True}}},
            {
                "$project": {
                    "_id": 0,
                    "user_id": 1,
                    "display_name": 1,
                    "picture": 1,
                    "score": f"$statistics.category_stats.{category}.correct"
                }
            },
            {"$match": {"score": {"$gt": 0}}},
            {"$sort": {"score": -1}},
            {"$limit": limit}
        ]
        
        leaders = await db.users.aggregate(pipeline).to_list(limit)
        for i, entry in enumerate(leaders):
            entry["rank"] = i + 1
        
        result[category] = leaders
    
    return result

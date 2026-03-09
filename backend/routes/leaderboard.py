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
    # === GAMES PLAYED ===
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
        "key": "fifty_games",
        "name_key": "ach_fifty_games",
        "description_key": "ach_fifty_games_desc",
        "icon": "medal",
        "category": "games",
        "requirement_type": "games_played",
        "requirement_value": 50,
        "points": 100,
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
        "key": "five_hundred_games",
        "name_key": "ach_five_hundred_games",
        "description_key": "ach_five_hundred_games_desc",
        "icon": "diamond",
        "category": "games",
        "requirement_type": "games_played",
        "requirement_value": 500,
        "points": 500,
        "tier": "platinum"
    },
    {
        "key": "thousand_games",
        "name_key": "ach_thousand_games",
        "description_key": "ach_thousand_games_desc",
        "icon": "planet",
        "category": "games",
        "requirement_type": "games_played",
        "requirement_value": 1000,
        "points": 1000,
        "tier": "diamond"
    },
    # === CORRECT ANSWERS ===
    {
        "key": "hundred_correct",
        "name_key": "ach_hundred_correct",
        "description_key": "ach_hundred_correct_desc",
        "icon": "checkmark-circle",
        "category": "accuracy",
        "requirement_type": "total_correct",
        "requirement_value": 100,
        "points": 50,
        "tier": "bronze"
    },
    {
        "key": "five_hundred_correct",
        "name_key": "ach_five_hundred_correct",
        "description_key": "ach_five_hundred_correct_desc",
        "icon": "checkmark-done-circle",
        "category": "accuracy",
        "requirement_type": "total_correct",
        "requirement_value": 500,
        "points": 150,
        "tier": "silver"
    },
    {
        "key": "thousand_correct",
        "name_key": "ach_thousand_correct",
        "description_key": "ach_thousand_correct_desc",
        "icon": "sparkles",
        "category": "accuracy",
        "requirement_type": "total_correct",
        "requirement_value": 1000,
        "points": 300,
        "tier": "gold"
    },
    {
        "key": "five_thousand_correct",
        "name_key": "ach_five_thousand_correct",
        "description_key": "ach_five_thousand_correct_desc",
        "icon": "rocket",
        "category": "accuracy",
        "requirement_type": "total_correct",
        "requirement_value": 5000,
        "points": 750,
        "tier": "platinum"
    },
    # === PERFECT GAMES ===
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
        "key": "five_perfect",
        "name_key": "ach_five_perfect",
        "description_key": "ach_five_perfect_desc",
        "icon": "star",
        "category": "special",
        "requirement_type": "perfect_games",
        "requirement_value": 5,
        "points": 200,
        "tier": "gold"
    },
    {
        "key": "ten_perfect",
        "name_key": "ach_ten_perfect",
        "description_key": "ach_ten_perfect_desc",
        "icon": "infinite",
        "category": "special",
        "requirement_type": "perfect_games",
        "requirement_value": 10,
        "points": 400,
        "tier": "platinum"
    },
    # === STREAKS ===
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
        "key": "streak_20",
        "name_key": "ach_streak_20",
        "description_key": "ach_streak_20_desc",
        "icon": "flash",
        "category": "streaks",
        "requirement_type": "streak",
        "requirement_value": 20,
        "points": 150,
        "tier": "gold"
    },
    {
        "key": "streak_50",
        "name_key": "ach_streak_50",
        "description_key": "ach_streak_50_desc",
        "icon": "thunderstorm",
        "category": "streaks",
        "requirement_type": "streak",
        "requirement_value": 50,
        "points": 500,
        "tier": "platinum"
    },
    # === CATEGORY MASTERY ===
    {
        "key": "addition_master",
        "name_key": "ach_addition_master",
        "description_key": "ach_addition_master_desc",
        "icon": "add-circle",
        "category": "mastery",
        "requirement_type": "category_correct",
        "requirement_category": "addition",
        "requirement_value": 200,
        "points": 100,
        "tier": "gold"
    },
    {
        "key": "subtraction_master",
        "name_key": "ach_subtraction_master",
        "description_key": "ach_subtraction_master_desc",
        "icon": "remove-circle",
        "category": "mastery",
        "requirement_type": "category_correct",
        "requirement_category": "subtraction",
        "requirement_value": 200,
        "points": 100,
        "tier": "gold"
    },
    {
        "key": "multiplication_master",
        "name_key": "ach_multiplication_master",
        "description_key": "ach_multiplication_master_desc",
        "icon": "close-circle",
        "category": "mastery",
        "requirement_type": "category_correct",
        "requirement_category": "multiplication",
        "requirement_value": 200,
        "points": 100,
        "tier": "gold"
    },
    {
        "key": "division_master",
        "name_key": "ach_division_master",
        "description_key": "ach_division_master_desc",
        "icon": "git-compare",
        "category": "mastery",
        "requirement_type": "category_correct",
        "requirement_category": "division",
        "requirement_value": 200,
        "points": 100,
        "tier": "gold"
    },
    {
        "key": "fractions_master",
        "name_key": "ach_fractions_master",
        "description_key": "ach_fractions_master_desc",
        "icon": "pie-chart",
        "category": "mastery",
        "requirement_type": "category_correct",
        "requirement_category": "fractions",
        "requirement_value": 200,
        "points": 150,
        "tier": "gold"
    },
    {
        "key": "geometry_master",
        "name_key": "ach_geometry_master",
        "description_key": "ach_geometry_master_desc",
        "icon": "shapes",
        "category": "mastery",
        "requirement_type": "category_correct",
        "requirement_category": "geometry",
        "requirement_value": 200,
        "points": 150,
        "tier": "gold"
    },
    {
        "key": "equations_master",
        "name_key": "ach_equations_master",
        "description_key": "ach_equations_master_desc",
        "icon": "code-working",
        "category": "mastery",
        "requirement_type": "category_correct",
        "requirement_category": "equations",
        "requirement_value": 200,
        "points": 150,
        "tier": "gold"
    },
    # === SPEED ===
    {
        "key": "speed_demon",
        "name_key": "ach_speed_demon",
        "description_key": "ach_speed_demon_desc",
        "icon": "speedometer",
        "category": "speed",
        "requirement_type": "fast_answer",
        "requirement_value": 3,
        "points": 50,
        "tier": "silver"
    },
    {
        "key": "lightning_fast",
        "name_key": "ach_lightning_fast",
        "description_key": "ach_lightning_fast_desc",
        "icon": "flash",
        "category": "speed",
        "requirement_type": "fast_game",
        "requirement_value": 60,
        "points": 150,
        "tier": "gold"
    },
    # === CHALLENGES ===
    {
        "key": "first_challenge",
        "name_key": "ach_first_challenge",
        "description_key": "ach_first_challenge_desc",
        "icon": "flag",
        "category": "social",
        "requirement_type": "challenges_completed",
        "requirement_value": 1,
        "points": 50,
        "tier": "bronze"
    },
    {
        "key": "challenge_winner",
        "name_key": "ach_challenge_winner",
        "description_key": "ach_challenge_winner_desc",
        "icon": "trophy",
        "category": "social",
        "requirement_type": "challenges_won",
        "requirement_value": 1,
        "points": 100,
        "tier": "gold"
    },
    {
        "key": "five_challenges",
        "name_key": "ach_five_challenges",
        "description_key": "ach_five_challenges_desc",
        "icon": "podium",
        "category": "social",
        "requirement_type": "challenges_completed",
        "requirement_value": 5,
        "points": 150,
        "tier": "silver"
    },
    # === DIFFICULTIES ===
    {
        "key": "easy_champion",
        "name_key": "ach_easy_champion",
        "description_key": "ach_easy_champion_desc",
        "icon": "happy",
        "category": "difficulty",
        "requirement_type": "difficulty_games",
        "requirement_difficulty": "easy",
        "requirement_value": 50,
        "points": 50,
        "tier": "bronze"
    },
    {
        "key": "medium_warrior",
        "name_key": "ach_medium_warrior",
        "description_key": "ach_medium_warrior_desc",
        "icon": "fitness",
        "category": "difficulty",
        "requirement_type": "difficulty_games",
        "requirement_difficulty": "medium",
        "requirement_value": 50,
        "points": 100,
        "tier": "silver"
    },
    {
        "key": "hard_hero",
        "name_key": "ach_hard_hero",
        "description_key": "ach_hard_hero_desc",
        "icon": "skull",
        "category": "difficulty",
        "requirement_type": "difficulty_games",
        "requirement_difficulty": "hard",
        "requirement_value": 50,
        "points": 200,
        "tier": "gold"
    },
    # === SPECIAL ===
    {
        "key": "night_owl",
        "name_key": "ach_night_owl",
        "description_key": "ach_night_owl_desc",
        "icon": "moon",
        "category": "special",
        "requirement_type": "night_game",
        "requirement_value": 1,
        "points": 25,
        "tier": "bronze"
    },
    {
        "key": "early_bird",
        "name_key": "ach_early_bird",
        "description_key": "ach_early_bird_desc",
        "icon": "sunny",
        "category": "special",
        "requirement_type": "morning_game",
        "requirement_value": 1,
        "points": 25,
        "tier": "bronze"
    },
    {
        "key": "weekend_warrior",
        "name_key": "ach_weekend_warrior",
        "description_key": "ach_weekend_warrior_desc",
        "icon": "calendar",
        "category": "special",
        "requirement_type": "weekend_games",
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
    {
        "key": "group_leader",
        "name_key": "ach_group_leader",
        "description_key": "ach_group_leader_desc",
        "icon": "people",
        "category": "social",
        "requirement_type": "groups_created",
        "requirement_value": 1,
        "points": 50,
        "tier": "bronze"
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


@router.post("/achievements/check")
async def check_and_award_achievements(request: Request):
    """Check and award new achievements after a game"""
    user = await require_auth(request)
    db = request.app.state.db
    
    # Get user's current stats
    user_doc = await db.users.find_one({"user_id": user.user_id})
    if not user_doc:
        return {"new_achievements": []}
    
    stats = user_doc.get("statistics", {})
    
    # Get already earned achievements
    earned = await db.user_achievements.find(
        {"user_id": user.user_id},
        {"achievement_key": 1}
    ).to_list(100)
    earned_keys = set(ua["achievement_key"] for ua in earned)
    
    # Get all achievements
    all_achievements = await db.achievements.find({"active": True}).to_list(100)
    if not all_achievements:
        all_achievements = DEFAULT_ACHIEVEMENTS
    
    new_achievements = []
    
    for ach in all_achievements:
        key = ach["key"]
        if key in earned_keys:
            continue
            
        req_type = ach.get("requirement_type")
        req_value = ach.get("requirement_value", 0)
        earned_now = False
        
        # Check different requirement types
        if req_type == "games_played":
            if stats.get("games_played", 0) >= req_value:
                earned_now = True
                
        elif req_type == "total_correct":
            if stats.get("total_correct", 0) >= req_value:
                earned_now = True
                
        elif req_type == "perfect_score":
            if stats.get("perfect_games", 0) >= req_value:
                earned_now = True
                
        elif req_type == "perfect_games":
            if stats.get("perfect_games", 0) >= req_value:
                earned_now = True
                
        elif req_type == "streak":
            if stats.get("best_streak", 0) >= req_value:
                earned_now = True
                
        elif req_type == "category_correct":
            cat = ach.get("requirement_category")
            cat_stats = stats.get("category_stats", {}).get(cat, {})
            if cat_stats.get("correct", 0) >= req_value:
                earned_now = True
        
        if earned_now:
            # Award the achievement
            await db.user_achievements.insert_one({
                "user_id": user.user_id,
                "achievement_key": key,
                "earned_at": datetime.now(timezone.utc)
            })
            
            new_achievements.append({
                "key": key,
                "name": ach.get("name_key", key),
                "description": ach.get("description_key", ""),
                "icon": ach.get("icon", "star"),
                "tier": ach.get("tier", "bronze"),
                "points": ach.get("points", 0)
            })
    
    return {"new_achievements": new_achievements}


from fastapi import APIRouter, HTTPException, Request, Query
from typing import List, Optional
from datetime import datetime, timezone
import uuid

from routes.auth import require_admin, require_superadmin
from utils.auth import hash_password

router = APIRouter(prefix="/api/admin", tags=["Admin"])


@router.get("/users")
async def get_users(
    request: Request,
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    search: Optional[str] = None,
    role: Optional[str] = None
):
    """Get all users (admin only)"""
    await require_admin(request)
    db = request.app.state.db
    
    # Build query
    query = {}
    if search:
        query["$or"] = [
            {"email": {"$regex": search, "$options": "i"}},
            {"display_name": {"$regex": search, "$options": "i"}}
        ]
    if role:
        query["role"] = role
    
    # Get total count
    total = await db.users.count_documents(query)
    
    # Get users
    users = await db.users.find(
        query,
        {"_id": 0, "password_hash": 0}
    ).skip(skip).limit(limit).sort("created_at", -1).to_list(limit)
    
    return {
        "users": users,
        "total": total,
        "skip": skip,
        "limit": limit
    }


@router.get("/users/{user_id}")
async def get_user(request: Request, user_id: str):
    """Get a specific user (admin only)"""
    await require_admin(request)
    db = request.app.state.db
    
    user = await db.users.find_one(
        {"user_id": user_id},
        {"_id": 0, "password_hash": 0}
    )
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    return user


@router.put("/users/{user_id}")
async def update_user(request: Request, user_id: str):
    """Update a user (superadmin only)"""
    admin = await require_superadmin(request)
    db = request.app.state.db
    
    body = await request.json()
    
    # Get current user
    user = await db.users.find_one({"user_id": user_id})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Prepare update
    update_data = {}
    
    if "display_name" in body:
        update_data["display_name"] = body["display_name"]
    
    if "role" in body:
        # Only superadmin can change roles
        if admin.role != "superadmin":
            raise HTTPException(status_code=403, detail="Only superadmin can change roles")
        if body["role"] not in ["user", "admin", "superadmin"]:
            raise HTTPException(status_code=400, detail="Invalid role")
        update_data["role"] = body["role"]
    
    if "is_active" in body:
        update_data["is_active"] = body["is_active"]
    
    if update_data:
        update_data["updated_at"] = datetime.now(timezone.utc)
        await db.users.update_one(
            {"user_id": user_id},
            {"$set": update_data}
        )
    
    # Return updated user
    user = await db.users.find_one(
        {"user_id": user_id},
        {"_id": 0, "password_hash": 0}
    )
    
    return user


@router.post("/users/{user_id}/reset-password")
async def admin_reset_password(request: Request, user_id: str):
    """Reset a user's password (superadmin only)"""
    await require_superadmin(request)
    db = request.app.state.db
    
    body = await request.json()
    new_password = body.get("new_password")
    
    if not new_password or len(new_password) < 6:
        raise HTTPException(status_code=400, detail="Password must be at least 6 characters")
    
    # Check user exists
    user = await db.users.find_one({"user_id": user_id})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Update password
    new_hash = hash_password(new_password)
    await db.users.update_one(
        {"user_id": user_id},
        {"$set": {"password_hash": new_hash, "updated_at": datetime.now(timezone.utc)}}
    )
    
    # Invalidate all sessions
    await db.user_sessions.delete_many({"user_id": user_id})
    
    return {"message": "Password reset successfully"}


@router.delete("/users/{user_id}")
async def delete_user(request: Request, user_id: str):
    """Delete a user (superadmin only)"""
    admin = await require_superadmin(request)
    db = request.app.state.db
    
    # Don't allow self-deletion
    if admin.user_id == user_id:
        raise HTTPException(status_code=400, detail="Cannot delete your own account")
    
    # Check user exists
    user = await db.users.find_one({"user_id": user_id})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Don't allow deleting other superadmins
    if user.get("role") == "superadmin":
        raise HTTPException(status_code=400, detail="Cannot delete superadmin accounts")
    
    # Delete user and related data
    await db.users.delete_one({"user_id": user_id})
    await db.user_sessions.delete_many({"user_id": user_id})
    await db.game_sessions.delete_many({"user_id": user_id})
    await db.user_achievements.delete_many({"user_id": user_id})
    
    return {"message": "User deleted successfully"}


@router.get("/stats")
async def get_admin_stats(request: Request):
    """Get admin dashboard statistics (admin only)"""
    await require_admin(request)
    db = request.app.state.db
    
    # User stats
    total_users = await db.users.count_documents({})
    admin_users = await db.users.count_documents({"role": {"$in": ["admin", "superadmin"]}})
    
    # Count users by role
    role_pipeline = [
        {"$group": {"_id": "$role", "count": {"$sum": 1}}}
    ]
    role_counts = await db.users.aggregate(role_pipeline).to_list(10)
    users_by_role = {item["_id"]: item["count"] for item in role_counts}
    
    # Game stats
    total_games = await db.game_sessions.count_documents({})
    
    # Recent activity (last 7 days)
    from datetime import timedelta
    week_ago = datetime.now(timezone.utc) - timedelta(days=7)
    recent_users = await db.users.count_documents({"created_at": {"$gte": week_ago}})
    recent_games = await db.game_sessions.count_documents({"created_at": {"$gte": week_ago}})
    
    # Translation stats
    total_translations = await db.translations.count_documents({})
    
    # Language distribution
    lang_pipeline = [
        {"$group": {"_id": "$language_code", "count": {"$sum": 1}}}
    ]
    lang_counts = await db.translations.aggregate(lang_pipeline).to_list(10)
    translations_by_lang = {item["_id"]: item["count"] for item in lang_counts}
    
    return {
        "users": {
            "total": total_users,
            "admins": admin_users,
            "by_role": users_by_role,
            "new_this_week": recent_users
        },
        "games": {
            "total": total_games,
            "this_week": recent_games
        },
        "translations": {
            "total": total_translations,
            "by_language": translations_by_lang
        }
    }


@router.get("/activity")
async def get_recent_activity(
    request: Request,
    limit: int = Query(20, ge=1, le=100)
):
    """Get recent activity log (admin only)"""
    await require_admin(request)
    db = request.app.state.db
    
    # Get recent game sessions
    games = await db.game_sessions.find(
        {},
        {"_id": 0}
    ).sort("created_at", -1).limit(limit).to_list(limit)
    
    # Get recent users
    users = await db.users.find(
        {},
        {"_id": 0, "password_hash": 0}
    ).sort("created_at", -1).limit(limit).to_list(limit)
    
    # Combine and sort
    activity = []
    
    for game in games:
        activity.append({
            "type": "game",
            "data": game,
            "timestamp": game.get("created_at")
        })
    
    for user in users:
        activity.append({
            "type": "user_registration",
            "data": {"user_id": user.get("user_id"), "email": user.get("email"), "display_name": user.get("display_name")},
            "timestamp": user.get("created_at")
        })
    
    # Sort by timestamp
    activity.sort(key=lambda x: x.get("timestamp") or datetime.min.replace(tzinfo=timezone.utc), reverse=True)
    
    return activity[:limit]

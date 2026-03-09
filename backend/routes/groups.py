from fastapi import APIRouter, HTTPException, Request
from typing import List, Optional
from datetime import datetime, timezone
import random
import string

from models import (
    Group, GroupCreate, GroupUpdate, GroupJoin, GroupMember, GroupMemberUpdate,
    Challenge, ChallengeCreate, ChallengeParticipant
)
from routes.auth import require_auth, get_current_user

router = APIRouter(prefix="/api/groups", tags=["Groups"])


def generate_invite_code() -> str:
    """Generate a 6-character invite code with mixed letters and numbers"""
    chars = string.ascii_uppercase + string.digits
    return ''.join(random.choices(chars, k=6))


@router.get("/")
async def get_my_groups(request: Request):
    """Get all groups the current user is a member of"""
    user = await require_auth(request)
    db = request.app.state.db
    
    groups = await db.groups.find(
        {"members.user_id": user.user_id},
        {"_id": 0}
    ).to_list(100)
    
    return groups


@router.post("/")
async def create_group(request: Request, group_data: GroupCreate):
    """Create a new group"""
    user = await require_auth(request)
    db = request.app.state.db
    
    # Create group
    group = Group(
        name=group_data.name,
        description=group_data.description,
        creator_id=user.user_id,
        invite_code=generate_invite_code(),
        members=[GroupMember(
            user_id=user.user_id,
            display_name=user.display_name,
            role="admin"
        )]
    )
    
    group_dict = group.dict()
    group_dict["created_at"] = datetime.now(timezone.utc)
    group_dict["updated_at"] = datetime.now(timezone.utc)
    
    await db.groups.insert_one(group_dict)
    group_dict.pop("_id", None)
    
    return group_dict


@router.get("/{group_id}")
async def get_group(request: Request, group_id: str):
    """Get a specific group"""
    user = await require_auth(request)
    db = request.app.state.db
    
    group = await db.groups.find_one(
        {"group_id": group_id, "members.user_id": user.user_id},
        {"_id": 0}
    )
    
    if not group:
        raise HTTPException(status_code=404, detail="Group not found")
    
    return group


@router.put("/{group_id}")
async def update_group(request: Request, group_id: str, update_data: GroupUpdate):
    """Update a group (admin only)"""
    user = await require_auth(request)
    db = request.app.state.db
    
    # Check if user is admin of the group
    group = await db.groups.find_one(
        {"group_id": group_id, "members": {"$elemMatch": {"user_id": user.user_id, "role": "admin"}}},
        {"_id": 0}
    )
    
    if not group:
        raise HTTPException(status_code=403, detail="Not authorized to update this group")
    
    update_dict = {k: v for k, v in update_data.dict().items() if v is not None}
    if update_dict:
        update_dict["updated_at"] = datetime.now(timezone.utc)
        await db.groups.update_one(
            {"group_id": group_id},
            {"$set": update_dict}
        )
    
    return await db.groups.find_one({"group_id": group_id}, {"_id": 0})


@router.post("/join")
async def join_group(request: Request, join_data: GroupJoin):
    """Join a group using invite code"""
    user = await require_auth(request)
    db = request.app.state.db
    
    # Find group by invite code
    group = await db.groups.find_one(
        {"invite_code": join_data.invite_code.upper()},
        {"_id": 0}
    )
    
    if not group:
        raise HTTPException(status_code=404, detail="Invalid invite code")
    
    # Check if already a member
    is_member = any(m["user_id"] == user.user_id for m in group.get("members", []))
    if is_member:
        raise HTTPException(status_code=400, detail="Already a member of this group")
    
    # Add member
    new_member = {
        "user_id": user.user_id,
        "display_name": user.display_name,
        "role": "member",
        "joined_at": datetime.now(timezone.utc)
    }
    
    await db.groups.update_one(
        {"group_id": group["group_id"]},
        {
            "$push": {"members": new_member},
            "$set": {"updated_at": datetime.now(timezone.utc)}
        }
    )
    
    return await db.groups.find_one({"group_id": group["group_id"]}, {"_id": 0})


@router.post("/{group_id}/leave")
async def leave_group(request: Request, group_id: str):
    """Leave a group"""
    user = await require_auth(request)
    db = request.app.state.db
    
    group = await db.groups.find_one(
        {"group_id": group_id, "members.user_id": user.user_id},
        {"_id": 0}
    )
    
    if not group:
        raise HTTPException(status_code=404, detail="Group not found")
    
    # Check if user is the only admin
    admins = [m for m in group.get("members", []) if m.get("role") == "admin"]
    user_is_admin = any(m["user_id"] == user.user_id for m in admins)
    
    if user_is_admin and len(admins) == 1 and len(group.get("members", [])) > 1:
        raise HTTPException(
            status_code=400,
            detail="You must assign another admin before leaving"
        )
    
    # Remove member
    await db.groups.update_one(
        {"group_id": group_id},
        {
            "$pull": {"members": {"user_id": user.user_id}},
            "$set": {"updated_at": datetime.now(timezone.utc)}
        }
    )
    
    # Delete group if no members left
    updated_group = await db.groups.find_one({"group_id": group_id})
    if not updated_group.get("members"):
        await db.groups.delete_one({"group_id": group_id})
        return {"message": "Left and deleted empty group"}
    
    return {"message": "Left group successfully"}


@router.put("/{group_id}/members/{target_user_id}")
async def update_member_role(request: Request, group_id: str, target_user_id: str, update_data: GroupMemberUpdate):
    """Update a member's role (admin only)"""
    user = await require_auth(request)
    db = request.app.state.db
    
    # Check if user is admin
    group = await db.groups.find_one(
        {"group_id": group_id, "members": {"$elemMatch": {"user_id": user.user_id, "role": "admin"}}},
        {"_id": 0}
    )
    
    if not group:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    # Update member role
    result = await db.groups.update_one(
        {"group_id": group_id, "members.user_id": target_user_id},
        {
            "$set": {
                "members.$.role": update_data.role,
                "updated_at": datetime.now(timezone.utc)
            }
        }
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Member not found")
    
    return await db.groups.find_one({"group_id": group_id}, {"_id": 0})


@router.delete("/{group_id}/members/{target_user_id}")
async def remove_member(request: Request, group_id: str, target_user_id: str):
    """Remove a member from the group (admin only)"""
    user = await require_auth(request)
    db = request.app.state.db
    
    # Check if user is admin
    group = await db.groups.find_one(
        {"group_id": group_id, "members": {"$elemMatch": {"user_id": user.user_id, "role": "admin"}}},
        {"_id": 0}
    )
    
    if not group:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    # Can't remove yourself this way
    if target_user_id == user.user_id:
        raise HTTPException(status_code=400, detail="Use leave endpoint to leave the group")
    
    await db.groups.update_one(
        {"group_id": group_id},
        {
            "$pull": {"members": {"user_id": target_user_id}},
            "$set": {"updated_at": datetime.now(timezone.utc)}
        }
    )
    
    return {"message": "Member removed"}


# Challenge endpoints
@router.get("/{group_id}/challenges")
async def get_group_challenges(request: Request, group_id: str):
    """Get all challenges for a group"""
    user = await require_auth(request)
    db = request.app.state.db
    
    # Verify membership
    group = await db.groups.find_one(
        {"group_id": group_id, "members.user_id": user.user_id}
    )
    if not group:
        raise HTTPException(status_code=404, detail="Group not found")
    
    challenges = await db.challenges.find(
        {"group_id": group_id},
        {"_id": 0}
    ).sort("created_at", -1).to_list(100)
    
    return challenges


@router.post("/{group_id}/challenges")
async def create_challenge(request: Request, group_id: str, challenge_data: ChallengeCreate):
    """Create a new challenge in a group"""
    user = await require_auth(request)
    db = request.app.state.db
    
    # Verify membership
    group = await db.groups.find_one(
        {"group_id": group_id, "members.user_id": user.user_id}
    )
    if not group:
        raise HTTPException(status_code=404, detail="Group not found")
    
    challenge = Challenge(
        **challenge_data.dict(),
        group_id=group_id,
        creator_id=user.user_id,
        participants=[ChallengeParticipant(
            user_id=user.user_id,
            display_name=user.display_name
        )]
    )
    
    challenge_dict = challenge.dict()
    challenge_dict["created_at"] = datetime.now(timezone.utc)
    
    await db.challenges.insert_one(challenge_dict)
    challenge_dict.pop("_id", None)
    
    return challenge_dict


@router.post("/{group_id}/challenges/{challenge_id}/join")
async def join_challenge(request: Request, group_id: str, challenge_id: str):
    """Join a challenge"""
    user = await require_auth(request)
    db = request.app.state.db
    
    challenge = await db.challenges.find_one(
        {"challenge_id": challenge_id, "group_id": group_id}
    )
    
    if not challenge:
        raise HTTPException(status_code=404, detail="Challenge not found")
    
    # Check if already participating
    is_participant = any(p["user_id"] == user.user_id for p in challenge.get("participants", []))
    if is_participant:
        raise HTTPException(status_code=400, detail="Already participating")
    
    new_participant = {
        "user_id": user.user_id,
        "display_name": user.display_name,
        "score": 0,
        "completed_days": [],
        "best_time": None,
        "joined_at": datetime.now(timezone.utc)
    }
    
    await db.challenges.update_one(
        {"challenge_id": challenge_id},
        {"$push": {"participants": new_participant}}
    )
    
    return await db.challenges.find_one({"challenge_id": challenge_id}, {"_id": 0})


# Delete challenge (creator only)
@router.delete("/{group_id}/challenges/{challenge_id}")
async def delete_challenge(request: Request, group_id: str, challenge_id: str):
    user = await require_auth(request)
    db = request.app.state.db
    
    # Check if user is the challenge creator
    challenge = await db.challenges.find_one({"challenge_id": challenge_id, "group_id": group_id})
    if not challenge:
        raise HTTPException(status_code=404, detail="Challenge not found")
    
    if challenge.get("creator_id") != user.user_id:
        raise HTTPException(status_code=403, detail="Only the creator can delete this challenge")
    
    await db.challenges.delete_one({"challenge_id": challenge_id})
    return {"message": "Challenge deleted"}


# Delete group (creator only)
@router.delete("/{group_id}")
async def delete_group(request: Request, group_id: str):
    user = await require_auth(request)
    db = request.app.state.db
    
    # Check if user is the group creator
    group = await db.groups.find_one({"group_id": group_id})
    if not group:
        raise HTTPException(status_code=404, detail="Group not found")
    
    if group.get("creator_id") != user.user_id:
        raise HTTPException(status_code=403, detail="Only the creator can delete this group")
    
    # Delete all challenges in the group
    await db.challenges.delete_many({"group_id": group_id})
    
    # Delete the group
    await db.groups.delete_one({"group_id": group_id})
    return {"message": "Group deleted"}

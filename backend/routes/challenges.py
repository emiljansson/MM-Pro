from fastapi import APIRouter, HTTPException, Request
from routes.auth import require_auth

router = APIRouter(prefix="/api/challenges", tags=["Challenges"])


@router.get("/{challenge_id}")
async def get_challenge_by_id(request: Request, challenge_id: str):
    """Get challenge and group info for deep linking - requires auth"""
    user = await require_auth(request)
    db = request.app.state.db
    
    # Find the challenge
    challenge = await db.challenges.find_one(
        {"challenge_id": challenge_id},
        {"_id": 0}
    )
    
    if not challenge:
        raise HTTPException(status_code=404, detail="Challenge not found")
    
    # Get the group
    group = await db.groups.find_one(
        {"group_id": challenge["group_id"]},
        {"_id": 0, "group_id": 1, "name": 1, "invite_code": 1}
    )
    
    if not group:
        raise HTTPException(status_code=404, detail="Group not found")
    
    return {
        "challenge": challenge,
        "group": group
    }

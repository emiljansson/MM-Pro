from fastapi import APIRouter, HTTPException, Response, Request, Depends
from typing import Optional
from datetime import datetime, timezone
import uuid
import jwt
import json
import requests as http_requests
from jwcrypto import jwk

from models import (
    User, UserCreate, UserLogin, UserUpdate, UserPublic,
    UserSession, PasswordReset, PasswordResetConfirm
)
from utils.auth import (
    hash_password, verify_password, generate_token,
    get_session_expiry, is_session_expired, get_google_session_data
)

router = APIRouter(prefix="/api/auth", tags=["Authentication"])

# Apple Auth configuration
APPLE_KEYS_URL = "https://appleid.apple.com/auth/keys"
APPLE_ISSUER = "https://appleid.apple.com"
# Cache for Apple's public keys
_apple_keys_cache = None
_apple_keys_cache_time = None


async def get_current_user(request: Request) -> Optional[User]:
    """Get current user from session token"""
    db = request.app.state.db
    
    # Check Authorization header first
    auth_header = request.headers.get("Authorization")
    session_token = None
    
    if auth_header and auth_header.startswith("Bearer "):
        session_token = auth_header.split(" ")[1]
    else:
        # Check cookies
        session_token = request.cookies.get("session_token")
    
    if not session_token:
        return None
    
    # Find session
    session_doc = await db.user_sessions.find_one(
        {"session_token": session_token},
        {"_id": 0}
    )
    
    if not session_doc:
        return None
    
    # Check expiry
    expires_at = session_doc.get("expires_at")
    if isinstance(expires_at, str):
        expires_at = datetime.fromisoformat(expires_at)
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)
    
    if expires_at < datetime.now(timezone.utc):
        return None
    
    # Get user
    user_doc = await db.users.find_one(
        {"user_id": session_doc["user_id"]},
        {"_id": 0}
    )
    
    if not user_doc:
        return None
    
    # Remove password hash before returning
    user_doc.pop("password_hash", None)
    return User(**user_doc)


async def require_auth(request: Request) -> User:
    """Require authenticated user"""
    user = await get_current_user(request)
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    return user


async def require_admin(request: Request) -> User:
    """Require admin or superadmin user"""
    user = await require_auth(request)
    if user.role not in ["admin", "superadmin"]:
        raise HTTPException(status_code=403, detail="Admin access required")
    return user


async def require_superadmin(request: Request) -> User:
    """Require superadmin user"""
    user = await require_auth(request)
    if user.role != "superadmin":
        raise HTTPException(status_code=403, detail="Superadmin access required")
    return user


@router.post("/register")
async def register(request: Request, user_data: UserCreate, response: Response):
    """Register a new user with email/password"""
    db = request.app.state.db
    
    # Check if email exists
    existing = await db.users.find_one({"email": user_data.email})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    if not user_data.password:
        raise HTTPException(status_code=400, detail="Password required")
    
    # Create user
    user = User(
        email=user_data.email,
        display_name=user_data.display_name,
        language=user_data.language,
        auth_provider="email"
    )
    
    # Hash password
    user_dict = user.dict()
    user_dict["password_hash"] = hash_password(user_data.password)
    user_dict["created_at"] = datetime.now(timezone.utc)
    user_dict["updated_at"] = datetime.now(timezone.utc)
    
    await db.users.insert_one(user_dict)
    
    # Create session
    session = UserSession(
        user_id=user.user_id,
        expires_at=get_session_expiry()
    )
    await db.user_sessions.insert_one(session.dict())
    
    # Set cookie
    response.set_cookie(
        key="session_token",
        value=session.session_token,
        httponly=True,
        secure=True,
        samesite="none",
        path="/",
        max_age=7 * 24 * 60 * 60  # 7 days
    )
    
    # Return user without password
    user_dict.pop("password_hash", None)
    user_dict.pop("_id", None)
    
    return {
        "user": user_dict,
        "session_token": session.session_token
    }


@router.post("/login")
async def login(request: Request, credentials: UserLogin, response: Response):
    """Login with email/username and password"""
    db = request.app.state.db
    
    # Find user by email or display_name
    user_doc = await db.users.find_one(
        {"$or": [
            {"email": credentials.email},
            {"display_name": credentials.email}
        ]}, 
        {"_id": 0}
    )
    
    if not user_doc:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    # Check password
    if not user_doc.get("password_hash"):
        raise HTTPException(status_code=401, detail="Please use Google login")
    
    if not verify_password(credentials.password, user_doc["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    # Create session
    session = UserSession(
        user_id=user_doc["user_id"],
        expires_at=get_session_expiry()
    )
    await db.user_sessions.insert_one(session.dict())
    
    # Set cookie
    response.set_cookie(
        key="session_token",
        value=session.session_token,
        httponly=True,
        secure=True,
        samesite="none",
        path="/",
        max_age=7 * 24 * 60 * 60
    )
    
    # Return user without password
    user_doc.pop("password_hash", None)
    
    return {
        "user": user_doc,
        "session_token": session.session_token
    }


@router.post("/google")
async def google_auth(request: Request, response: Response):
    """Authenticate with Google OAuth via Emergent Auth"""
    db = request.app.state.db
    
    body = await request.json()
    session_id = body.get("session_id")
    
    if not session_id:
        raise HTTPException(status_code=400, detail="Session ID required")
    
    # Get user data from Emergent Auth
    google_data = await get_google_session_data(session_id)
    
    if not google_data:
        raise HTTPException(status_code=401, detail="Invalid session")
    
    # Check if user exists
    existing_user = await db.users.find_one(
        {"email": google_data["email"]},
        {"_id": 0}
    )
    
    if existing_user:
        # Update user info if needed
        await db.users.update_one(
            {"email": google_data["email"]},
            {
                "$set": {
                    "picture": google_data.get("picture"),
                    "display_name": google_data.get("name", existing_user.get("display_name")),
                    "updated_at": datetime.now(timezone.utc)
                }
            }
        )
        user_id = existing_user["user_id"]
    else:
        # Create new user
        user = User(
            email=google_data["email"],
            display_name=google_data.get("name", google_data["email"].split("@")[0]),
            picture=google_data.get("picture"),
            auth_provider="google"
        )
        user_dict = user.dict()
        user_dict["created_at"] = datetime.now(timezone.utc)
        user_dict["updated_at"] = datetime.now(timezone.utc)
        await db.users.insert_one(user_dict)
        user_id = user.user_id
    
    # Create session
    session = UserSession(
        user_id=user_id,
        expires_at=get_session_expiry()
    )
    await db.user_sessions.insert_one(session.dict())
    
    # Set cookie
    response.set_cookie(
        key="session_token",
        value=session.session_token,
        httponly=True,
        secure=True,
        samesite="none",
        path="/",
        max_age=7 * 24 * 60 * 60
    )
    
    # Get updated user
    user_doc = await db.users.find_one({"user_id": user_id}, {"_id": 0})
    user_doc.pop("password_hash", None)
    
    return {
        "user": user_doc,
        "session_token": session.session_token
    }


async def get_apple_public_keys():
    """Fetch and cache Apple's public keys for token verification"""
    global _apple_keys_cache, _apple_keys_cache_time
    from datetime import timedelta
    
    # Check if cache is still valid (24 hours)
    if _apple_keys_cache and _apple_keys_cache_time:
        if datetime.now(timezone.utc) - _apple_keys_cache_time < timedelta(hours=24):
            return _apple_keys_cache
    
    try:
        response = http_requests.get(APPLE_KEYS_URL, timeout=10)
        response.raise_for_status()
        _apple_keys_cache = response.json()
        _apple_keys_cache_time = datetime.now(timezone.utc)
        return _apple_keys_cache
    except Exception as e:
        print(f"Failed to fetch Apple public keys: {e}")
        # Return cached keys if available
        if _apple_keys_cache:
            return _apple_keys_cache
        raise HTTPException(status_code=500, detail="Failed to fetch Apple public keys")


async def validate_apple_token(identity_token: str, bundle_ids: list):
    """Validate Apple identity token and extract user information"""
    try:
        # Decode without verification first to get the header
        unverified_header = jwt.get_unverified_header(identity_token)
        kid = unverified_header.get('kid')
        
        if not kid:
            return None, "Missing key ID in token header"
        
        # Get Apple's public keys
        apple_keys = await get_apple_public_keys()
        
        # Find the matching key
        public_key_data = None
        for key in apple_keys.get('keys', []):
            if key.get('kid') == kid:
                public_key_data = key
                break
        
        if not public_key_data:
            return None, f"Public key with kid {kid} not found"
        
        # Construct the public key from JWK format
        try:
            jwk_key = jwk.JWK.from_json(json.dumps(public_key_data))
            public_key_pem = jwk_key.export_to_pem()
        except Exception as e:
            return None, f"Failed to construct public key: {str(e)}"
        
        # Verify and decode the token - try each bundle ID
        last_error = None
        for bundle_id in bundle_ids:
            try:
                payload = jwt.decode(
                    identity_token,
                    public_key_pem,
                    algorithms=['RS256'],
                    audience=bundle_id,
                    issuer=APPLE_ISSUER
                )
                return payload, None
            except jwt.InvalidAudienceError:
                last_error = f"Invalid audience (tried: {bundle_id})"
                continue
            except jwt.ExpiredSignatureError:
                return None, "Token has expired"
            except jwt.InvalidIssuerError:
                return None, "Invalid issuer in token"
            except jwt.InvalidTokenError as e:
                return None, f"Invalid token: {str(e)}"
        
        # If we get here, none of the bundle IDs matched
        # Try to decode without audience verification to see what the actual audience is
        try:
            unverified_payload = jwt.decode(
                identity_token,
                public_key_pem,
                algorithms=['RS256'],
                options={"verify_aud": False},
                issuer=APPLE_ISSUER
            )
            actual_aud = unverified_payload.get('aud', 'unknown')
            return None, f"Invalid audience in token. Expected one of {bundle_ids}, got: {actual_aud}"
        except Exception:
            return None, last_error or "Invalid audience in token"
            
    except Exception as e:
        return None, f"Token validation error: {str(e)}"


@router.post("/apple")
async def apple_auth(request: Request, response: Response):
    """Authenticate with Apple Sign In"""
    db = request.app.state.db
    
    body = await request.json()
    identity_token = body.get("identity_token")
    user_data = body.get("user_data", {})  # Contains name and email from first login
    
    if not identity_token:
        raise HTTPException(status_code=400, detail="Identity token required")
    
    # Bundle IDs - includes production app and Expo Go for development
    bundle_ids = [
        "com.emja.mathmasterpro",  # Production app bundle ID
        "host.exp.Exponent",        # Expo Go bundle ID (for development)
    ]
    
    # Validate the Apple token
    payload, error = await validate_apple_token(identity_token, bundle_ids)
    
    if error:
        print(f"Apple token validation error: {error}")
        raise HTTPException(status_code=401, detail=f"Invalid Apple token: {error}")
    
    # Extract user info from token
    apple_user_id = payload.get("sub")
    email = payload.get("email")
    email_verified = payload.get("email_verified", False)
    
    if not apple_user_id:
        raise HTTPException(status_code=401, detail="No user ID in token")
    
    # Check if user exists by Apple user ID or email
    existing_user = None
    if email:
        existing_user = await db.users.find_one(
            {"$or": [
                {"apple_user_id": apple_user_id},
                {"email": email}
            ]},
            {"_id": 0}
        )
    else:
        existing_user = await db.users.find_one(
            {"apple_user_id": apple_user_id},
            {"_id": 0}
        )
    
    if existing_user:
        # Update user info - link Apple ID if not already linked
        update_data = {
            "apple_user_id": apple_user_id,
            "updated_at": datetime.now(timezone.utc)
        }
        
        await db.users.update_one(
            {"user_id": existing_user["user_id"]},
            {"$set": update_data}
        )
        user_id = existing_user["user_id"]
    else:
        # Create new user
        # Get name from user_data (only provided on first login)
        given_name = user_data.get("given_name", "")
        family_name = user_data.get("family_name", "")
        display_name = f"{given_name} {family_name}".strip()
        
        if not display_name:
            # Fallback to email username or Apple User
            display_name = email.split("@")[0] if email else f"Apple User {apple_user_id[:8]}"
        
        user = User(
            email=email,
            display_name=display_name,
            first_name=given_name if given_name else None,
            last_name=family_name if family_name else None,
            auth_provider="apple"
        )
        user_dict = user.dict()
        user_dict["apple_user_id"] = apple_user_id
        user_dict["created_at"] = datetime.now(timezone.utc)
        user_dict["updated_at"] = datetime.now(timezone.utc)
        await db.users.insert_one(user_dict)
        user_id = user.user_id
    
    # Create session
    session = UserSession(
        user_id=user_id,
        expires_at=get_session_expiry()
    )
    await db.user_sessions.insert_one(session.dict())
    
    # Set cookie
    response.set_cookie(
        key="session_token",
        value=session.session_token,
        httponly=True,
        secure=True,
        samesite="none",
        path="/",
        max_age=7 * 24 * 60 * 60
    )
    
    # Get updated user
    user_doc = await db.users.find_one({"user_id": user_id}, {"_id": 0})
    user_doc.pop("password_hash", None)
    
    return {
        "user": user_doc,
        "session_token": session.session_token
    }



@router.get("/me")
async def get_me(request: Request):
    """Get current authenticated user"""
    user = await require_auth(request)
    return user.dict()


@router.put("/me")
async def update_me(request: Request, update_data: UserUpdate):
    """Update current user profile"""
    db = request.app.state.db
    user = await require_auth(request)
    
    update_dict = {k: v for k, v in update_data.dict().items() if v is not None}
    if update_dict:
        update_dict["updated_at"] = datetime.now(timezone.utc)
        await db.users.update_one(
            {"user_id": user.user_id},
            {"$set": update_dict}
        )
    
    # Return updated user
    user_doc = await db.users.find_one({"user_id": user.user_id}, {"_id": 0})
    user_doc.pop("password_hash", None)
    return user_doc


@router.post("/logout")
async def logout(request: Request, response: Response):
    """Logout current user"""
    db = request.app.state.db
    
    # Get session token
    auth_header = request.headers.get("Authorization")
    session_token = None
    
    if auth_header and auth_header.startswith("Bearer "):
        session_token = auth_header.split(" ")[1]
    else:
        session_token = request.cookies.get("session_token")
    
    if session_token:
        await db.user_sessions.delete_one({"session_token": session_token})
    
    # Clear cookie
    response.delete_cookie(
        key="session_token",
        path="/",
        secure=True,
        samesite="none"
    )
    
    return {"message": "Logged out successfully"}


@router.post("/password-reset")
async def request_password_reset(request: Request, data: PasswordReset):
    """Request password reset"""
    db = request.app.state.db
    
    # Check if user exists
    user = await db.users.find_one({"email": data.email})
    
    # Always return success to prevent email enumeration
    if user:
        # Generate reset token
        token = generate_token()
        expires_at = get_session_expiry(hours=1)  # 1 hour expiry
        
        await db.password_resets.insert_one({
            "user_id": user["user_id"],
            "token": token,
            "expires_at": expires_at,
            "used": False,
            "created_at": datetime.now(timezone.utc)
        })
        
        # Send password reset email
        from services.email_service import get_email_service
        email_svc = get_email_service()
        email_svc.db = db
        
        # Get app URL from settings
        settings = await db.settings.find_one({"key": "email_settings"})
        app_url = settings.get("app_url", "https://mathematicsmaster.app") if settings else "https://mathematicsmaster.app"
        
        result = await email_svc.send_password_reset_email(
            to_email=data.email,
            reset_token=token,
            user_name=user.get("display_name", "Användare"),
            app_url=app_url
        )
        
        if result["status"] == "error":
            # Log error but don't expose to user
            print(f"Failed to send password reset email: {result['message']}")
            # Still log token for development fallback
            print(f"Password reset token for {data.email}: {token}")
    
    return {"message": "If the email exists, a reset link has been sent"}


@router.post("/password-reset/confirm")
async def confirm_password_reset(request: Request, data: PasswordResetConfirm):
    """Confirm password reset with token"""
    db = request.app.state.db
    
    # Find token
    reset_doc = await db.password_resets.find_one({
        "token": data.token,
        "used": False
    })
    
    if not reset_doc:
        raise HTTPException(status_code=400, detail="Invalid or expired token")
    
    # Check expiry
    expires_at = reset_doc["expires_at"]
    if isinstance(expires_at, str):
        expires_at = datetime.fromisoformat(expires_at)
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)
    
    if expires_at < datetime.now(timezone.utc):
        raise HTTPException(status_code=400, detail="Token expired")
    
    # Update password
    new_hash = hash_password(data.new_password)
    await db.users.update_one(
        {"user_id": reset_doc["user_id"]},
        {"$set": {"password_hash": new_hash, "updated_at": datetime.now(timezone.utc)}}
    )
    
    # Mark token as used
    await db.password_resets.update_one(
        {"token": data.token},
        {"$set": {"used": True}}
    )
    
    # Invalidate all existing sessions
    await db.user_sessions.delete_many({"user_id": reset_doc["user_id"]})
    
    return {"message": "Password updated successfully"}


@router.put("/update-profile")
async def update_profile(request: Request):
    """Update user profile with all fields"""
    db = request.app.state.db
    user = await require_auth(request)
    
    body = await request.json()
    
    update_dict = {}
    
    # Update allowed fields
    if "display_name" in body and body["display_name"]:
        update_dict["display_name"] = body["display_name"].strip()
    
    if "first_name" in body:
        update_dict["first_name"] = body["first_name"].strip() if body["first_name"] else None
    
    if "last_name" in body:
        update_dict["last_name"] = body["last_name"].strip() if body["last_name"] else None
    
    if "email" in body and body["email"]:
        # Check if email is already taken by another user
        existing = await db.users.find_one({
            "email": body["email"],
            "user_id": {"$ne": user.user_id}
        })
        if existing:
            raise HTTPException(status_code=400, detail="E-postadressen används redan")
        update_dict["email"] = body["email"].strip()
    
    if update_dict:
        update_dict["updated_at"] = datetime.now(timezone.utc)
        await db.users.update_one(
            {"user_id": user.user_id},
            {"$set": update_dict}
        )
    
    # Return updated user
    user_doc = await db.users.find_one({"user_id": user.user_id}, {"_id": 0})
    user_doc.pop("password_hash", None)
    return user_doc


@router.delete("/delete-account")
async def delete_account(request: Request, response: Response):
    """Delete user account and all associated data"""
    db = request.app.state.db
    user = await require_auth(request)
    
    # Delete user's game sessions
    await db.game_sessions.delete_many({"user_id": user.user_id})
    
    # Delete user's achievements
    await db.user_achievements.delete_many({"user_id": user.user_id})
    
    # Delete user's group memberships
    await db.group_members.delete_many({"user_id": user.user_id})
    
    # Delete user's sessions
    await db.user_sessions.delete_many({"user_id": user.user_id})
    
    # Delete password reset tokens
    await db.password_resets.delete_many({"user_id": user.user_id})
    
    # Finally delete the user
    await db.users.delete_one({"user_id": user.user_id})
    
    # Clear session cookie
    response.delete_cookie(
        key="session_token",
        path="/",
        secure=True,
        samesite="none"
    )
    
    return {"message": "Account deleted successfully"}

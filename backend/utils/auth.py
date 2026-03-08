import bcrypt
import secrets
from datetime import datetime, timedelta, timezone
from typing import Optional
import httpx


def hash_password(password: str) -> str:
    """Hash a password using bcrypt"""
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(password.encode('utf-8'), salt).decode('utf-8')


def verify_password(password: str, hashed: str) -> bool:
    """Verify a password against its hash"""
    return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))


def generate_token(length: int = 32) -> str:
    """Generate a secure random token"""
    return secrets.token_urlsafe(length)


def get_session_expiry(days: int = 7) -> datetime:
    """Get session expiry datetime"""
    return datetime.now(timezone.utc) + timedelta(days=days)


def is_session_expired(expires_at: datetime) -> bool:
    """Check if a session is expired"""
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)
    return expires_at < datetime.now(timezone.utc)


async def get_google_session_data(session_id: str) -> Optional[dict]:
    """Get user data from Emergent Auth session"""
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(
                "https://demobackend.emergentagent.com/auth/v1/env/oauth/session-data",
                headers={"X-Session-ID": session_id}
            )
            if response.status_code == 200:
                return response.json()
    except Exception as e:
        print(f"Error getting Google session data: {e}")
    return None

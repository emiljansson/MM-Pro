"""
Database seed script for MathMaster Pro
Usage: python seed_database.py

Requires MONGO_URL environment variable
"""
import asyncio
import json
import os
from motor.motor_asyncio import AsyncIOMotorClient
from passlib.context import CryptContext
from datetime import datetime, timezone
from dotenv import load_dotenv

load_dotenv()

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

async def seed_database():
    """Seed the database with initial data"""
    
    mongo_url = os.environ.get('MONGO_URL')
    db_name = os.environ.get('DB_NAME', 'mathmaster')
    
    if not mongo_url:
        print("ERROR: MONGO_URL environment variable not set")
        return
    
    client = AsyncIOMotorClient(mongo_url)
    db = client[db_name]
    
    print(f"Connected to database: {db_name}")
    
    # Load export data if exists
    try:
        with open('db_export.json', 'r', encoding='utf-8') as f:
            export_data = json.load(f)
        print("Loaded db_export.json")
    except FileNotFoundError:
        print("db_export.json not found, creating default data...")
        export_data = None
    
    # Seed users
    existing_users = await db.users.count_documents({})
    if existing_users == 0:
        if export_data and 'users' in export_data:
            # Import from export
            for user in export_data['users']:
                user.pop('_id', None)  # Remove old ID
                await db.users.insert_one(user)
            print(f"Imported {len(export_data['users'])} users")
        else:
            # Create default admin
            admin_user = {
                "email": "admin@mathmaster.app",
                "display_name": "Admin",
                "password_hash": pwd_context.hash("admin123"),
                "role": "superadmin",
                "language": "sv",
                "created_at": datetime.now(timezone.utc),
                "is_pro": True,
                "auth_provider": "email"
            }
            await db.users.insert_one(admin_user)
            print("Created default admin user: admin@mathmaster.app / admin123")
    else:
        print(f"Users collection already has {existing_users} documents, skipping...")
    
    # Seed translations
    existing_translations = await db.translations.count_documents({})
    if existing_translations == 0:
        if export_data and 'translations' in export_data:
            for trans in export_data['translations']:
                trans.pop('_id', None)
                await db.translations.insert_one(trans)
            print(f"Imported {len(export_data['translations'])} translations")
        else:
            print("No translations to import, will be created on server startup")
    else:
        print(f"Translations collection already has {existing_translations} documents, skipping...")
    
    print("\nDatabase seeding complete!")
    client.close()

if __name__ == "__main__":
    asyncio.run(seed_database())

"""Crée le premier compte administrateur.
Usage (depuis le dossier backend/) : python seed.py
"""
import asyncio
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker
from app.models.user import User
from app.services.auth_service import hash_password
from app.config import settings

async def seed():
    engine = create_async_engine(settings.DATABASE_URL)
    Session = async_sessionmaker(engine, expire_on_commit=False)

    async with Session() as db:
        admin = User(
            email="admin@teampilot.com",
            hashed_password=hash_password("admin123"),
            first_name="Alex",
            last_name="Graham",
            is_admin=True,
            type="staff",
        )
        db.add(admin)
        await db.commit()
        print(f"✅ Admin créé : {admin.email}  /  mot de passe : admin123")

    await engine.dispose()

if __name__ == "__main__":
    asyncio.run(seed())

"""Données initiales : admin, club, saison active, staff de démo.
Usage (depuis le dossier backend/) : python seed.py
"""
import asyncio
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker
from sqlalchemy import select
from app.models.user import User
from app.models.club import Club, Season
from app.models.staff import StaffMember
from app.services.auth_service import hash_password
from app.config import settings


async def seed():
    engine = create_async_engine(settings.DATABASE_URL)
    Session = async_sessionmaker(engine, expire_on_commit=False)

    async with Session() as db:
        # ── Admin user ─────────────────────────────────────────────────────────
        existing = await db.execute(select(User).where(User.email == "admin@teampilot.com"))
        if not existing.scalar_one_or_none():
            admin = User(
                email="admin@teampilot.com",
                hashed_password=hash_password("admin123"),
                first_name="Clément",
                last_name="Conrié",
                is_admin=True,
                type="staff",
            )
            db.add(admin)
            await db.flush()
            print(f"✅ Admin créé : {admin.email}  /  mot de passe : admin123")
        else:
            print("ℹ️  Admin déjà existant, ignoré.")

        # ── Club ───────────────────────────────────────────────────────────────
        club_result = await db.execute(select(Club).where(Club.id == 1))
        if not club_result.scalar_one_or_none():
            club = Club(
                id=1,
                name="Metropolis United FC",
                founded_year="1924",
                league="Elite Pro League",
                email="admin@metropolisunited.com",
                phone="+44 20 7946 0012",
                address="United Training Complex",
                city="London, SE1 7PB, UK",
            )
            db.add(club)
            await db.flush()
            print("✅ Club créé : Metropolis United FC")
        else:
            print("ℹ️  Club déjà existant, ignoré.")

        # ── Saison active ──────────────────────────────────────────────────────
        season_result = await db.execute(select(Season).where(Season.is_active == True))
        if not season_result.scalar_one_or_none():
            season = Season(
                club_id=1,
                label="2026/2027",
                start_date="2026-08-01",
                end_date="2027-05-31",
                competitions="Premier League · FA Cup",
                objective="Top 4 · Quart FA Cup",
                status="En cours",
                is_active=True,
            )
            db.add(season)
            await db.flush()
            print("✅ Saison créée : 2026/2027 (active)")
        else:
            print("ℹ️  Saison active déjà existante, ignorée.")

        # ── Staff de démo ──────────────────────────────────────────────────────
        staff_data = [
            ("Thomas",  "Laurent", "Coach Principal",    "tlaurent@metropolisunited.com", "+44 20 1234 5678", "2022-07-01"),
            ("Sophie",  "Moreau",  "Kinésithérapeute",   "smoreau@metropolisunited.com",  "+44 20 2345 6789", "2023-08-15"),
            ("David",   "Park",    "Analyste Vidéo",     "dpark@metropolisunited.com",    "+44 20 3456 7890", "2024-01-01"),
            ("Claire",  "Dupuis",  "Médecin",            "cdupuis@metropolisunited.com",  "+44 20 4567 8901", "2021-09-01"),
        ]
        for first, last, role, email, phone, since in staff_data:
            exists = await db.execute(select(StaffMember).where(StaffMember.email == email))
            if not exists.scalar_one_or_none():
                member = StaffMember(
                    first_name=first, last_name=last,
                    role=role, email=email,
                    phone=phone, since_date=since,
                )
                db.add(member)
                await db.flush()
                user = User(
                    email=email,
                    hashed_password=hash_password("staff123"),
                    first_name=first, last_name=last,
                    is_admin=False, type="staff",
                    staff_id=member.id,
                )
                db.add(user)
                print(f"✅ Staff créé : {first} {last} ({role})")

        await db.commit()
        print("\n🎉 Seed terminé.")

    await engine.dispose()


if __name__ == "__main__":
    asyncio.run(seed())

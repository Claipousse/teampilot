"""Données initiales : admin, club, saison, staff, joueurs, événements.
Usage (depuis le dossier backend/) : python seed.py
"""
import asyncio
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker
from sqlalchemy import select
from app.models.user import User
from app.models.club import Club, Season
from app.models.staff import StaffMember
from app.models.player import Player
from app.models.event import Event
from app.services.auth_service import hash_password
from app.config import settings


async def seed():
    engine = create_async_engine(settings.DATABASE_URL)
    Session = async_sessionmaker(engine, expire_on_commit=False)

    async with Session() as db:

        # ── Admin user ─────────────────────────────────────────────────────────
        existing = await db.execute(select(User).where(User.email == "admin@teampilot.com"))
        if not existing.scalar_one_or_none():
            admin = User(email="admin@teampilot.com", hashed_password=hash_password("admin123"),
                first_name="Clément", last_name="Conrié", is_admin=True, type="staff")
            db.add(admin)
            await db.flush()
            print("✅ Admin créé : admin@teampilot.com  /  admin123")
        else:
            print("ℹ️  Admin déjà existant, ignoré.")

        # ── Club ───────────────────────────────────────────────────────────────
        club_r = await db.execute(select(Club).where(Club.id == 1))
        if not club_r.scalar_one_or_none():
            db.add(Club(id=1, name="Metropolis United FC", founded_year="1924", league="Elite Pro League",
                email="admin@metropolisunited.com", phone="+44 20 7946 0012",
                address="United Training Complex", city="London, SE1 7PB, UK"))
            await db.flush()
            print("✅ Club créé")

        # ── Saison ─────────────────────────────────────────────────────────────
        season_r = await db.execute(select(Season).where(Season.is_active == True))
        if not season_r.scalar_one_or_none():
            db.add(Season(club_id=1, label="2026/2027", start_date="2026-08-01", end_date="2027-05-31",
                competitions="Premier League · FA Cup", objective="Top 4 · Quart FA Cup",
                status="En cours", is_active=True))
            await db.flush()
            print("✅ Saison créée : 2026/2027")

        # ── Staff ──────────────────────────────────────────────────────────────
        for first, last, role, email, phone, since in [
            ("Thomas", "Laurent", "Coach Principal",  "tlaurent@metropolisunited.com", "+44 20 1234 5678", "2022-07-01"),
            ("Sophie", "Moreau",  "Kinésithérapeute", "smoreau@metropolisunited.com",  "+44 20 2345 6789", "2023-08-15"),
            ("David",  "Park",    "Analyste Vidéo",   "dpark@metropolisunited.com",    "+44 20 3456 7890", "2024-01-01"),
            ("Claire", "Dupuis",  "Médecin",          "cdupuis@metropolisunited.com",  "+44 20 4567 8901", "2021-09-01"),
        ]:
            exists = await db.execute(select(StaffMember).where(StaffMember.email == email))
            if not exists.scalar_one_or_none():
                member = StaffMember(first_name=first, last_name=last, role=role, email=email, phone=phone, since_date=since)
                db.add(member)
                await db.flush()
                db.add(User(email=email, hashed_password=hash_password("staff123"),
                    first_name=first, last_name=last, is_admin=False, type="staff", staff_id=member.id))
                print(f"✅ Staff : {first} {last}")

        # ── Joueurs ────────────────────────────────────────────────────────────
        players_data = [
            dict(first_name="Marcus",  last_name="Valentin", shirt_number=8,  position="Milieu Central",    position_short="MIL", nationality="Anglais",   nationality_flag=None,  date_of_birth="1998-03-15", height_cm=182, weight_kg=78, preferred_foot="Droit",  status="Disponible", contract_end_date="2027-06-30", academy="Manchester Academy", matches=22, goals=4,  assists=9, yellow_cards=3, minutes_played=1850, notes="Excellent visionnaire du jeu.", email="m.valentin@metropolisunited.com"),
            dict(first_name="Julian",  last_name="Romero",   shirt_number=3,  position="Arrière Gauche",    position_short="DEF", nationality="Espagnol",  nationality_flag="🇪🇸", date_of_birth="2000-07-22", height_cm=175, weight_kg=72, preferred_foot="Gauche", status="Blessé",     contract_end_date="2025-06-30", academy="Atletico Madrid B", matches=14, assists=3, yellow_cards=2, minutes_played=1170, injury_description="Ischio-jambiers", return_date_estimate="Dans 3 semaines", email="j.romero@metropolisunited.com"),
            dict(first_name="Kevin",   last_name="Larson",   shirt_number=9,  position="Attaquant Centre",  position_short="ATT", nationality="Français",  nationality_flag="🇫🇷", date_of_birth="1996-11-08", height_cm=186, weight_kg=82, preferred_foot="Droit",  status="Disponible", contract_end_date="2028-06-30", academy="OL Academy",          matches=22, goals=11, assists=4, yellow_cards=1, minutes_played=1940, notes="Meilleur buteur.", email="k.larson@metropolisunited.com"),
            dict(first_name="Stefan",  last_name="Koch",     shirt_number=1,  position="Gardien de but",    position_short="GK",  nationality="Allemand",  nationality_flag="🇩🇪", date_of_birth="1995-05-14", height_cm=192, weight_kg=88, preferred_foot="Droit",  status="Disponible", contract_end_date="2028-06-30", academy="Bayern Youth",        matches=22, clean_sheets=9, goals_conceded=18, minutes_played=1980, email="s.koch@metropolisunited.com"),
            dict(first_name="Alex",    last_name="Mendez",   shirt_number=5,  position="Défenseur Central", position_short="DEF", nationality="Brésilien", nationality_flag="🇧🇷", date_of_birth="1997-01-30", height_cm=188, weight_kg=84, preferred_foot="Droit",  status="Suspendu",   contract_end_date="2026-06-30", academy="Flamengo Youth",      matches=19, goals=2, assists=1, yellow_cards=5, red_cards=1, minutes_played=1710, injury_description="2 matchs de suspension", email="a.mendez@metropolisunited.com"),
            dict(first_name="Tom",     last_name="Owen",     shirt_number=11, position="Ailier Droit",      position_short="ATT", nationality="Anglais",   nationality_flag=None,  date_of_birth="2001-09-19", height_cm=178, weight_kg=74, preferred_foot="Gauche", status="Incertain",  contract_end_date="2027-06-30", academy="Chelsea Academy",     matches=18, goals=6, assists=7, yellow_cards=1, minutes_played=1420, injury_description="Gêne musculaire cuisse", return_date_estimate="Décision avant le match", email="t.owen@metropolisunited.com"),
        ]
        admin_user_r = await db.execute(select(User).where(User.email == "admin@teampilot.com"))
        admin_user = admin_user_r.scalar_one_or_none()
        for pd in players_data:
            em = pd.pop("email")
            exists_p = await db.execute(select(Player).where(Player.first_name == pd["first_name"], Player.last_name == pd["last_name"]))
            if not exists_p.scalar_one_or_none():
                p = Player(**pd)
                db.add(p)
                await db.flush()
                user_exists = await db.execute(select(User).where(User.email == em))
                if not user_exists.scalar_one_or_none():
                    db.add(User(email=em, hashed_password=hash_password("player123"),
                        first_name=pd["first_name"], last_name=pd["last_name"],
                        is_admin=False, type="player", player_id=p.id))
                print(f"✅ Joueur : {pd['first_name']} {pd['last_name']}")

        # ── Événements ─────────────────────────────────────────────────────────
        if admin_user:
            events_data = [
                ("Pre-Match Training",   "Entraînement", "2026-06-05", "10:00", "Terrain principal",         "Activation physique 60 min."),
                ("Match Away",           "Match",        "2026-06-05", "15:00", "Etihad Stadium",            "Départ bus 12h00. Tenue : maillot extérieur."),
                ("Tactical Analysis",    "Réunion",      "2026-06-07", "11:00", "Salle vidéo · Bâtiment B",  "Présence obligatoire."),
                ("Gym Session",          "Entraînement", "2026-06-09", "09:30", "Salle de musculation",      None),
                ("Pre-Match Activation", "Entraînement", "2026-06-19", "11:00", "Terrain principal",         None),
                ("Home Match",           "Match",        "2026-06-19", "17:00", "Stade principal (domicile)","Échauffement 16h00."),
            ]
            for title, tag, edate, etime, loc, notes in events_data:
                exists_e = await db.execute(select(Event).where(Event.title == title, Event.event_date == edate))
                if not exists_e.scalar_one_or_none():
                    db.add(Event(title=title, tag=tag, event_date=edate, event_time=etime,
                        location=loc, notes=notes, created_by=admin_user.id))
                    print(f"✅ Événement : {title} ({edate})")

        await db.commit()
        print("\n🎉 Seed terminé.")

    await engine.dispose()


if __name__ == "__main__":
    asyncio.run(seed())

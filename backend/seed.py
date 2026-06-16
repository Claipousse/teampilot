"""Données initiales : admin, club, saison, staff, joueurs, événements, messagerie.
Usage (depuis le dossier backend/) : python seed.py
"""
import asyncio
from datetime import datetime
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker
from sqlalchemy import select
from app.models.user import User
from app.services.auth_service import make_username_base
from app.models.club import Club, Season
from app.models.staff import StaffMember
from app.models.player import Player
from app.models.event import Event
from app.models.message import Conversation, ConversationParticipant, Message
from app.models.notification import Notification
from app.services.auth_service import hash_password
from app.config import settings

DIV = "━" * 56


async def seed():
    engine = create_async_engine(settings.DATABASE_URL)
    Session = async_sessionmaker(engine, expire_on_commit=False)

    stats = {"coaches": [0, 0], "staff": [0, 0], "players": [0, 0], "events": [0, 0], "notifs": [0, 0]}

    async with Session() as db:

        async def _unique_username(base: str) -> str:
            rows = (await db.execute(
                select(User.username).where(User.username.like(f"{base}%"))
            )).scalars().all()
            existing = {u for u in rows if u}
            if base not in existing:
                return base
            i = 2
            while f"{base}{i}" in existing:
                i += 1
            return f"{base}{i}"

        async def ensure_staff(first, last, role, email, phone, since, is_admin=False):
            exists = await db.execute(select(StaffMember).where(StaffMember.email == email))
            cat = "coaches" if "coach" in role.lower() or is_admin else "staff"
            sm = exists.scalar_one_or_none()
            if sm:
                stats[cat][1] += 1
                user_ex = await db.execute(select(User).where(User.staff_id == sm.id))
                u = user_ex.scalar_one_or_none()
                if u and not u.username:
                    base = make_username_base(first, last)
                    u.username = await _unique_username(base)
                    u.must_change_password = False
                return None
            sm = StaffMember(first_name=first, last_name=last, role=role,
                             email=email, phone=phone, since_date=since)
            db.add(sm)
            await db.flush()
            user_ex = await db.execute(select(User).where(User.email == email))
            if not user_ex.scalar_one_or_none():
                base = make_username_base(first, last)
                username = await _unique_username(base)
                db.add(User(email=email, username=username,
                            hashed_password=hash_password("staff123"),
                            first_name=first, last_name=last,
                            is_admin=is_admin, type="staff", staff_id=sm.id,
                            must_change_password=False))
            stats[cat][0] += 1
            return sm

        async def ensure_player(pd, email):
            exists = await db.execute(select(Player).where(
                Player.first_name == pd["first_name"], Player.last_name == pd["last_name"]))
            p = exists.scalar_one_or_none()
            if p:
                stats["players"][1] += 1
                user_ex = await db.execute(select(User).where(User.player_id == p.id))
                u = user_ex.scalar_one_or_none()
                if u and not u.username:
                    base = make_username_base(pd["first_name"], pd["last_name"])
                    u.username = await _unique_username(base)
                    u.must_change_password = False
                return None
            p = Player(**pd)
            db.add(p)
            await db.flush()
            user_ex = await db.execute(select(User).where(User.email == email))
            if not user_ex.scalar_one_or_none():
                base = make_username_base(pd["first_name"], pd["last_name"])
                username = await _unique_username(base)
                db.add(User(email=email, username=username,
                            hashed_password=hash_password("player123"),
                            first_name=pd["first_name"], last_name=pd["last_name"],
                            is_admin=False, type="player", player_id=p.id,
                            must_change_password=False))
            stats["players"][0] += 1
            return p

        # ── Admin ──────────────────────────────────────────────────────────────
        admin_ex = await db.execute(select(User).where(User.email == "admin@teampilot.com"))
        admin_user_obj = admin_ex.scalar_one_or_none()
        if not admin_user_obj:
            db.add(User(email="admin@teampilot.com", username="admin.test",
                        hashed_password=hash_password("admin123"),
                        first_name="Admin", last_name="Test",
                        is_admin=True, type="staff", must_change_password=False))
            await db.flush()
        else:
            admin_user_obj.username = "admin.test"
            admin_user_obj.first_name = "Admin"
            admin_user_obj.last_name = "Test"
            admin_user_obj.hashed_password = hash_password("admin123")
            admin_user_obj.must_change_password = False

        # ── Comptes de test ────────────────────────────────────────────────────
        staff_ex = await db.execute(select(User).where(User.email == "staff@teampilot.com"))
        staff_user_obj = staff_ex.scalar_one_or_none()
        if not staff_user_obj:
            sm_test = StaffMember(first_name="Staff", last_name="Test", role="Logistique",
                                  email="staff@teampilot.com", phone="+44 20 5678 9012",
                                  since_date="2025-01-01")
            db.add(sm_test)
            await db.flush()
            db.add(User(email="staff@teampilot.com", username="staff.test",
                        hashed_password=hash_password("staff123"),
                        first_name="Staff", last_name="Test",
                        is_admin=False, type="staff", staff_id=sm_test.id,
                        must_change_password=False))
        else:
            staff_user_obj.username = "staff.test"
            staff_user_obj.first_name = "Staff"
            staff_user_obj.last_name = "Test"
            staff_user_obj.hashed_password = hash_password("staff123")
            staff_user_obj.must_change_password = False

        joueur_ex = await db.execute(select(User).where(User.email == "joueur@teampilot.com"))
        joueur_user_obj = joueur_ex.scalar_one_or_none()
        if not joueur_user_obj:
            tp = Player(first_name="Joueur", last_name="Test", shirt_number=77,
                        position="Milieu Offensif", position_short="MIL",
                        nationality="Français", status="Disponible",
                        contract_end_date="2027-06-30")
            db.add(tp)
            await db.flush()
            db.add(User(email="joueur@teampilot.com", username="joueur.test",
                        hashed_password=hash_password("joueur123"),
                        first_name="Joueur", last_name="Test",
                        is_admin=False, type="player", player_id=tp.id,
                        must_change_password=False))
        else:
            joueur_user_obj.username = "joueur.test"
            joueur_user_obj.first_name = "Joueur"
            joueur_user_obj.last_name = "Test"
            joueur_user_obj.hashed_password = hash_password("joueur123")
            joueur_user_obj.must_change_password = False

        print("  ✅ Comptes tests créés  (admin.test / staff.test / joueur.test)")

        # ── Club & Saison ──────────────────────────────────────────────────────
        club_ex = await db.execute(select(Club).where(Club.id == 1))
        if not club_ex.scalar_one_or_none():
            db.add(Club(id=1, name="Metropolis United FC", founded_year="1924",
                        league="Elite Pro League", email="admin@metropolisunited.com",
                        phone="+44 20 7946 0012", address="United Training Complex",
                        city="London, SE1 7PB, UK"))
            await db.flush()
            print("  ✅ Club créé  :  Metropolis United FC")

        season_ex = await db.execute(select(Season).where(Season.is_active == True))
        if not season_ex.scalar_one_or_none():
            db.add(Season(club_id=1, label="2026/2027", start_date="2026-08-01",
                          end_date="2027-05-31", competitions="Premier League · FA Cup",
                          objective="Top 4 · Quart FA Cup", status="En cours", is_active=True))
            await db.flush()
            print("  ✅ Saison créée  :  2026/2027")

        # ── Coachs (5) ─────────────────────────────────────────────────────────
        for first, last, role, email, phone, since, is_admin in [
            ("Thomas",    "Laurent",  "Coach Principal",            "tlaurent@metropolisunited.com",   "+44 20 1234 5678", "2022-07-01", False),
            ("Pierre",    "Moreau",   "Coach Adjoint",              "pmoreau@metropolisunited.com",    "+44 20 1234 5679", "2023-01-15", False),
            ("Marc",      "Rousseau", "Directeur Technique",        "mrousseauc@metropolisunited.com", "+44 20 1234 5680", "2021-08-01", True),
            ("Jean",      "Bernard",  "Coach Gardiens",             "jbernard@metropolisunited.com",   "+44 20 1234 5681", "2023-07-01", False),
            ("Florent",   "Garnier",  "Coach Attaque",              "fgarnier@metropolisunited.com",   "+44 20 1234 5682", "2024-02-01", False),
        ]:
            await ensure_staff(first, last, role, email, phone, since, is_admin)
        c, s = stats["coaches"]
        print(f"  ✅ Coachs  —  {c} créé(s), {s} existant(s)")

        # ── Staff non-coaches (10) ─────────────────────────────────────────────
        for first, last, role, email, phone, since in [
            ("Sophie",   "Moreau",  "Kinésithérapeute",          "smoreau@metropolisunited.com",  "+44 20 2345 6789", "2023-08-15"),
            ("David",    "Park",    "Analyste Vidéo",            "dpark@metropolisunited.com",    "+44 20 3456 7890", "2024-01-01"),
            ("Claire",   "Dupuis",  "Médecin",                   "cdupuis@metropolisunited.com",  "+44 20 4567 8901", "2021-09-01"),
            ("Marie",    "Leblanc", "Nutritionniste",            "mleblanc@metropolisunited.com", "+44 20 5678 0001", "2023-05-01"),
            ("Paul",     "Girard",  "Ostéopathe",                "pgirard@metropolisunited.com",  "+44 20 5678 0002", "2024-02-15"),
            ("Julie",    "Renard",  "Physiothérapeute",          "jrenard@metropolisunited.com",  "+44 20 5678 0003", "2023-09-01"),
            ("Marc",     "Lefevre", "Intendant",                 "mlefevre@metropolisunited.com", "+44 20 5678 0004", "2022-03-01"),
            ("Aurélie",  "Dumont",  "Directrice Administrative", "adumont@metropolisunited.com",  "+44 20 5678 0005", "2021-07-01"),
            ("Eric",     "Mercier", "Responsable Sécurité",      "emercier@metropolisunited.com", "+44 20 5678 0006", "2022-11-01"),
            ("Laura",    "Simon",   "Responsable Communication", "lsimon@metropolisunited.com",   "+44 20 5678 0007", "2023-01-15"),
        ]:
            await ensure_staff(first, last, role, email, phone, since)
        c, s = stats["staff"]
        print(f"  ✅ Staff  —  {c} créé(s), {s} existant(s)")

        # ── Joueurs (15) ───────────────────────────────────────────────────────
        for pd, email in [
            (dict(first_name="Marcus",  last_name="Valentin", shirt_number=8,  position="Milieu Central",    position_short="MIL", nationality="Anglais",   date_of_birth="1998-03-15", height_cm=182, weight_kg=78, preferred_foot="Droit",  status="Disponible", contract_end_date="2027-06-30", academy="Manchester Academy", matches=22, goals=4,  assists=9,  yellow_cards=3, minutes_played=1850, notes="Excellent visionnaire du jeu."),  "m.valentin@metropolisunited.com"),
            (dict(first_name="Julian",  last_name="Romero",   shirt_number=3,  position="Arrière Gauche",    position_short="DEF", nationality="Espagnol",  nationality_flag="🇪🇸", date_of_birth="2000-07-22", height_cm=175, weight_kg=72, preferred_foot="Gauche", status="Blessé",     contract_end_date="2025-06-30", academy="Atletico Madrid B", matches=14, assists=3, yellow_cards=2, minutes_played=1170, injury_description="Ischio-jambiers", return_date_estimate="Dans 3 semaines"), "j.romero@metropolisunited.com"),
            (dict(first_name="Kevin",   last_name="Larson",   shirt_number=9,  position="Attaquant Centre",  position_short="ATT", nationality="Français",  nationality_flag="🇫🇷", date_of_birth="1996-11-08", height_cm=186, weight_kg=82, preferred_foot="Droit",  status="Disponible", contract_end_date="2028-06-30", academy="OL Academy", matches=22, goals=11, assists=4, yellow_cards=1, minutes_played=1940, notes="Meilleur buteur."), "k.larson@metropolisunited.com"),
            (dict(first_name="Stefan",  last_name="Koch",     shirt_number=1,  position="Gardien de but",    position_short="GK",  nationality="Allemand",  nationality_flag="🇩🇪", date_of_birth="1995-05-14", height_cm=192, weight_kg=88, preferred_foot="Droit",  status="Disponible", contract_end_date="2028-06-30", academy="Bayern Youth", matches=22, clean_sheets=9, goals_conceded=18, minutes_played=1980), "s.koch@metropolisunited.com"),
            (dict(first_name="Alex",    last_name="Mendez",   shirt_number=5,  position="Défenseur Central", position_short="DEF", nationality="Brésilien", nationality_flag="🇧🇷", date_of_birth="1997-01-30", height_cm=188, weight_kg=84, preferred_foot="Droit",  status="Suspendu",   contract_end_date="2026-06-30", academy="Flamengo Youth", matches=19, goals=2, assists=1, yellow_cards=5, red_cards=1, minutes_played=1710, injury_description="2 matchs de suspension"), "a.mendez@metropolisunited.com"),
            (dict(first_name="Tom",     last_name="Owen",     shirt_number=11, position="Ailier Droit",      position_short="ATT", nationality="Anglais",   date_of_birth="2001-09-19", height_cm=178, weight_kg=74, preferred_foot="Gauche", status="Incertain",  contract_end_date="2027-06-30", academy="Chelsea Academy", matches=18, goals=6, assists=7, yellow_cards=1, minutes_played=1420, injury_description="Gêne musculaire cuisse", return_date_estimate="Décision avant le match"), "t.owen@metropolisunited.com"),
            (dict(first_name="Antoine", last_name="Moreau",   shirt_number=2,  position="Arrière Droit",     position_short="DEF", nationality="Français",  nationality_flag="🇫🇷", date_of_birth="2001-04-12", height_cm=180, weight_kg=76, preferred_foot="Droit",  status="Disponible", contract_end_date="2028-06-30", matches=20, goals=1, assists=4, minutes_played=1800), "a.moreau@metropolisunited.com"),
            (dict(first_name="Samuel",  last_name="Blanc",    shirt_number=4,  position="Défenseur Central", position_short="DEF", nationality="Français",  nationality_flag="🇫🇷", date_of_birth="1999-08-20", height_cm=190, weight_kg=86, preferred_foot="Droit",  status="Disponible", contract_end_date="2027-06-30", matches=21, goals=2, assists=1, yellow_cards=2, minutes_played=1890), "s.blanc@metropolisunited.com"),
            (dict(first_name="Eric",    last_name="Dubois",   shirt_number=6,  position="Milieu Défensif",   position_short="MIL", nationality="Belge",     nationality_flag="🇧🇪", date_of_birth="1998-12-05", height_cm=183, weight_kg=79, preferred_foot="Droit",  status="Disponible", contract_end_date="2026-06-30", matches=19, goals=3, assists=6, yellow_cards=4, minutes_played=1710), "e.dubois@metropolisunited.com"),
            (dict(first_name="Theo",    last_name="Durand",   shirt_number=7,  position="Ailier Gauche",     position_short="ATT", nationality="Français",  nationality_flag="🇫🇷", date_of_birth="2002-03-28", height_cm=176, weight_kg=71, preferred_foot="Gauche", status="Disponible", contract_end_date="2029-06-30", matches=17, goals=5, assists=8, minutes_played=1530), "t.durand@metropolisunited.com"),
            (dict(first_name="Maxime",  last_name="Girard",   shirt_number=10, position="Meneur de jeu",     position_short="MIL", nationality="Français",  nationality_flag="🇫🇷", date_of_birth="1997-06-14", height_cm=177, weight_kg=73, preferred_foot="Gauche", status="Disponible", contract_end_date="2028-06-30", matches=22, goals=7, assists=12, yellow_cards=1, minutes_played=1980), "m.girard@metropolisunited.com"),
            (dict(first_name="Roberto", last_name="Diaz",     shirt_number=12, position="Milieu Central",    position_short="MIL", nationality="Argentin",  nationality_flag="🇦🇷", date_of_birth="1999-11-30", height_cm=181, weight_kg=77, preferred_foot="Droit",  status="Disponible", contract_end_date="2027-06-30", matches=18, goals=2, assists=5, yellow_cards=3, minutes_played=1620), "r.diaz@metropolisunited.com"),
            (dict(first_name="Lucas",   last_name="Bernard",  shirt_number=13, position="Attaquant Centre",  position_short="ATT", nationality="Français",  nationality_flag="🇫🇷", date_of_birth="2000-02-17", height_cm=185, weight_kg=81, preferred_foot="Droit",  status="Disponible", contract_end_date="2027-06-30", matches=16, goals=8, assists=2, minutes_played=1440), "l.bernard@metropolisunited.com"),
            (dict(first_name="Romain",  last_name="Laurent",  shirt_number=14, position="Arrière Gauche",    position_short="DEF", nationality="Français",  nationality_flag="🇫🇷", date_of_birth="2001-07-09", height_cm=179, weight_kg=74, preferred_foot="Gauche", status="Disponible", contract_end_date="2028-06-30", matches=20, assists=3, yellow_cards=2, minutes_played=1800), "r.laurent@metropolisunited.com"),
            (dict(first_name="Nicolas", last_name="Petit",    shirt_number=15, position="Milieu Box-to-Box", position_short="MIL", nationality="Français",  nationality_flag="🇫🇷", date_of_birth="1998-09-22", height_cm=184, weight_kg=80, preferred_foot="Droit",  status="Disponible", contract_end_date="2026-06-30", matches=21, goals=4, assists=7, yellow_cards=3, minutes_played=1890), "n.petit@metropolisunited.com"),
        ]:
            await ensure_player(pd, email)
        c, s = stats["players"]
        print(f"  ✅ Joueurs  —  {c} créé(s), {s} existant(s)")

        # ── Événements ─────────────────────────────────────────────────────────
        admin_r = await db.execute(select(User).where(User.email == "admin@teampilot.com"))
        admin_user = admin_r.scalar_one_or_none()
        if admin_user:
            for title, tag, edate, etime, loc, notes in [
                ("Pre-Match Training",   "Entraînement", "2026-06-05", "10:00", "Terrain principal",         "Activation physique 60 min."),
                ("Match Away",           "Match",        "2026-06-05", "15:00", "Etihad Stadium",            "Départ bus 12h00. Tenue : maillot extérieur."),
                ("Tactical Analysis",    "Réunion",      "2026-06-07", "11:00", "Salle vidéo · Bâtiment B",  "Présence obligatoire."),
                ("Gym Session",          "Entraînement", "2026-06-09", "09:30", "Salle de musculation",      None),
                ("Bilan Médical",        "Réunion",      "2026-06-11", "09:00", "Centre médical",            "Bilans trimestriels obligatoires."),
                ("Sprint Training",      "Entraînement", "2026-06-12", "10:30", "Terrain 2",                 None),
                ("Conférence de Presse", "Réunion",      "2026-06-13", "14:00", "Salle de presse",           "Coach + 2 joueurs désignés."),
                ("Recovery Session",     "Entraînement", "2026-06-15", "11:00", "Piscine · Spa",             None),
                ("Pre-Match Activation", "Entraînement", "2026-06-19", "11:00", "Terrain principal",         None),
                ("Home Match",           "Match",        "2026-06-19", "17:00", "Stade principal (domicile)","Échauffement 16h00."),
            ]:
                ex = await db.execute(select(Event).where(Event.title == title, Event.event_date == edate))
                if not ex.scalar_one_or_none():
                    db.add(Event(title=title, tag=tag, event_date=edate, event_time=etime,
                                 location=loc, notes=notes, created_by=admin_user.id))
                    stats["events"][0] += 1
                else:
                    stats["events"][1] += 1
        c, s = stats["events"]
        print(f"  ✅ Événements  —  {c} créé(s), {s} existant(s)")

        # ── Notifications (comptes tests uniquement) ───────────────────────────
        all_events = (await db.execute(select(Event))).scalars().all()
        TEST_EMAILS = ["admin@teampilot.com", "staff@teampilot.com", "joueur@teampilot.com"]
        test_users = (await db.execute(
            select(User).where(User.email.in_(TEST_EMAILS), User.is_active == True)
        )).scalars().all()
        notif_titles = {
            "Pre-Match Training":   "Pre-Match Training ajouté",
            "Match Away":           "Match Away ajouté",
            "Tactical Analysis":    "Tactical Analysis ajouté",
            "Gym Session":          "Gym Session ajouté",
            "Bilan Médical":        "Bilan Médical ajouté",
            "Sprint Training":      "Sprint Training ajouté",
            "Conférence de Presse": "Conférence de Presse ajoutée",
            "Recovery Session":     "Recovery Session ajouté",
            "Pre-Match Activation": "Pre-Match Activation ajouté",
            "Home Match":           "Home Match ajouté",
        }
        for evt in all_events:
            notif_title = notif_titles.get(evt.title, f"{evt.title} ajouté")
            for u in test_users:
                ex = await db.execute(
                    select(Notification).where(
                        Notification.event_id == evt.id,
                        Notification.user_id == u.id,
                    )
                )
                existing = ex.scalars().first()
                if not existing:
                    db.add(Notification(
                        user_id=u.id, kind="added",
                        title=notif_title, tag=evt.tag,
                        event_id=evt.id, event_date=evt.event_date,
                    ))
                    stats["notifs"][0] += 1
                else:
                    if existing.tag is None:
                        existing.tag = evt.tag
                    stats["notifs"][1] += 1
        await db.flush()
        c, s = stats["notifs"]
        print(f"  ✅ Notifications  —  {c} créée(s), {s} existante(s)")

        # ── Messagerie ─────────────────────────────────────────────────────────
        existing_conv = await db.execute(select(Conversation).limit(1))
        if existing_conv.scalar_one_or_none():
            print("  ℹ️  Messagerie déjà existante, ignorée.")
        else:
            def _u(em): return select(User).where(User.email == em)
            adm = (await db.execute(_u("admin@teampilot.com"))).scalar_one_or_none()
            thl = (await db.execute(_u("tlaurent@metropolisunited.com"))).scalar_one_or_none()
            cdp = (await db.execute(_u("cdupuis@metropolisunited.com"))).scalar_one_or_none()
            smo = (await db.execute(_u("smoreau@metropolisunited.com"))).scalar_one_or_none()
            dpk = (await db.execute(_u("dpark@metropolisunited.com"))).scalar_one_or_none()
            mkv = (await db.execute(_u("m.valentin@metropolisunited.com"))).scalar_one_or_none()
            kvl = (await db.execute(_u("k.larson@metropolisunited.com"))).scalar_one_or_none()
            stk = (await db.execute(_u("s.koch@metropolisunited.com"))).scalar_one_or_none()
            pmo = (await db.execute(_u("pmoreau@metropolisunited.com"))).scalar_one_or_none()
            fga = (await db.execute(_u("fgarnier@metropolisunited.com"))).scalar_one_or_none()
            mgi = (await db.execute(_u("m.girard@metropolisunited.com"))).scalar_one_or_none()

            convs_n = 0

            def _msg(conv_id, sender_id, text, h, m=0, day=6):
                return Message(conversation_id=conv_id, sender_id=sender_id, msg_type="text",
                               text=text, created_at=datetime(2026, 6, day, h, m, 0))

            def _sys(conv_id, text, h=8, day=6):
                return Message(conversation_id=conv_id, sender_id=None, msg_type="system",
                               text=text, created_at=datetime(2026, 6, day, h, 0, 0))

            def _part(conv_id, *users):
                return [ConversationParticipant(conversation_id=conv_id, user_id=u.id)
                        for u in users if u]

            # 1. Tactical AI
            ai = Conversation(name="Tactical AI", category="staff", role_type="ai", is_ai=True,
                              initials="✦", avatar_bg="bg-primary",
                              created_at=datetime(2026, 6, 6, 8, 0))
            db.add(ai); await db.flush()
            db.add_all(_part(ai.id, adm))
            db.add_all([
                _msg(ai.id, None,    "Bonjour Coach. Le planning de la semaine prochaine est disponible. Entraînement intensif lundi, récupération mercredi avant le match de samedi.", 8, 0),
                _msg(ai.id, adm.id,  "Merci. Prépare-moi un résumé des statistiques de la semaine passée.", 8, 5),
                _msg(ai.id, None,    "3 entraînements effectués, 94% de présence, distance moyenne : 9.2 km par joueur.", 8, 6),
                _msg(ai.id, adm.id,  "Parfait. Prépare aussi un point sur les absences.", 8, 10),
                _msg(ai.id, None,    "Julian R. absent 2 séances (blessure). Alex M. absent 1 séance (suspension préventive). Tous les autres présents.", 8, 11),
            ])
            convs_n += 1

            # 2. Thomas Laurent
            if thl:
                c2 = Conversation(name=f"{thl.first_name} {thl.last_name}", category="staff",
                                  role_type="coach", initials="TL", avatar_bg="bg-surface-container-high",
                                  role="Coach Principal", created_at=datetime(2026, 6, 6, 9, 30))
                db.add(c2); await db.flush()
                db.add_all(_part(c2.id, adm, thl))
                db.add_all([
                    _msg(c2.id, thl.id,  "La séance du matin est annulée suite aux conditions météo. On reprend à 14h sur le terrain 2.", 9, 30),
                    _msg(c2.id, adm.id,  "Reçu. Je préviens les joueurs.", 9, 35),
                    _msg(c2.id, thl.id,  "Prévois aussi une séance vidéo à 13h pour analyser le dernier match.", 9, 36),
                    _msg(c2.id, adm.id,  "C'est noté. Salle de projection disponible à 13h.", 9, 40),
                    _msg(c2.id, thl.id,  "Merci. Rappelle-moi aussi de contacter le kiné pour Stefan.", 10, 45),
                ])
                convs_n += 1

            # 3. Claire Dupuis
            if cdp:
                c3 = Conversation(name=f"{cdp.first_name} {cdp.last_name}", category="staff",
                                  role_type="staff", initials="CD", avatar_bg="bg-surface-container-high",
                                  role="Médecin", created_at=datetime(2026, 6, 6, 8, 45))
                db.add(c3); await db.flush()
                db.add_all(_part(c3.id, adm, cdp))
                db.add_all([
                    _msg(c3.id, cdp.id,  "Bonjour. Le scanner de Julian R. vient de revenir. Lésion grade 2 ischio-jambiers. Repos 3 semaines minimum.", 8, 45),
                    _msg(c3.id, adm.id,  "Merci. Forfait pour les 2 prochains matchs ?", 8, 50),
                    _msg(c3.id, cdp.id,  "Oui, au minimum. On réévalue dans 10 jours.", 8, 52),
                    _msg(c3.id, cdp.id,  "Rapport_Medical.pdf", 8, 53),
                    _msg(c3.id, adm.id,  "Bien reçu. Gardez-moi informé.", 9, 12),
                ])
                convs_n += 1

            # 4. Groupe Staff Tactique
            c4 = Conversation(name="Staff Tactique", category="staff", role_type="group", is_group=True,
                              initials="ST", avatar_bg="bg-inverse-surface",
                              created_at=datetime(2026, 6, 5, 18, 0))
            db.add(c4); await db.flush()
            db.add_all(_part(c4.id, adm, thl, cdp, smo, dpk, pmo, fga))
            db.add_all([
                _sys(c4.id, "Groupe créé · 7 membres", 18, 5),
                _msg(c4.id, thl.id if thl else None,  "Réunion de staff demain matin à 9h. Point blessés + préparation match samedi.", 18, 0, 5),
                _msg(c4.id, cdp.id if cdp else None,  "Je serai présente. Je prépare un point sur Julian R. et Tom O.", 18, 15, 5),
                _msg(c4.id, dpk.id if dpk else None,  "Ok pour moi. Tom O. a bien récupéré depuis hier.", 18, 30, 5),
                _msg(c4.id, pmo.id if pmo else None,  "Présent. J'apporterai les statistiques de la semaine.", 18, 32, 5),
                _msg(c4.id, adm.id,                   "Salle de réunion A. À demain.", 18, 35, 5),
            ])
            convs_n += 1

            # 5. Marcus Valentin
            if mkv:
                c5 = Conversation(name=f"{mkv.first_name} {mkv.last_name}", category="team",
                                  role_type="player", initials="MV", avatar_bg="bg-surface-container-high",
                                  role="Milieu Central · #8", created_at=datetime(2026, 6, 6, 10, 45))
                db.add(c5); await db.flush()
                db.add_all(_part(c5.id, adm, mkv))
                db.add_all([
                    _msg(c5.id, adm.id,  "Marcus, peux-tu venir 30 min plus tôt demain pour un travail sur les transitions ?", 10, 45),
                    _msg(c5.id, mkv.id,  "Bien sûr Coach. À quelle heure ?", 10, 50),
                    _msg(c5.id, adm.id,  "8h30, avant la séance collective.", 10, 52),
                    _msg(c5.id, mkv.id,  "Présent à 8h30 demain Coach.", 11, 20),
                ])
                convs_n += 1

            # 6. Kevin Larson
            if kvl:
                c6 = Conversation(name=f"{kvl.first_name} {kvl.last_name}", category="team",
                                  role_type="player", initials="KL", avatar_bg="bg-surface-container-high",
                                  role="Attaquant Centre · #9", created_at=datetime(2026, 6, 6, 9, 0))
                db.add(c6); await db.flush()
                db.add_all(_part(c6.id, adm, kvl))
                db.add_all([
                    _msg(c6.id, adm.id,  "Kevin, excellente semaine d'entraînement. Continue sur cette lancée pour samedi.", 9, 0),
                    _msg(c6.id, kvl.id,  "Merci Coach ! Je me sens vraiment bien. Hâte d'être au match.", 9, 10),
                    _msg(c6.id, adm.id,  "Parfait. Récupère bien jeudi et vendredi.", 9, 25),
                    _msg(c6.id, kvl.id,  "D'accord, je ferai attention.", 9, 30),
                ])
                convs_n += 1

            # 7. Groupe Équipe Première
            c7 = Conversation(name="Équipe Première", category="team", role_type="group", is_group=True,
                              initials="EP", avatar_bg="bg-primary",
                              created_at=datetime(2026, 6, 5, 17, 0))
            db.add(c7); await db.flush()
            db.add_all(_part(c7.id, adm, mkv, kvl, stk, mgi))
            db.add_all([
                _sys(c7.id, "Groupe Équipe Première · 18 membres", 17, 5),
                _msg(c7.id, adm.id,                   "Rendez-vous samedi 13h au stade. Bus départ 12h30 depuis le centre.", 17, 0, 5),
                _msg(c7.id, mkv.id if mkv else None,  "Reçu Coach. On sera là.", 17, 5, 5),
                _msg(c7.id, stk.id if stk else None,  "Présent. Peut-on amener nos familles en tribune ?", 17, 10, 5),
                _msg(c7.id, adm.id,                   "Oui, 2 places par joueur au guichet. Parlez à Marc pour les billets.", 17, 15, 5),
                _msg(c7.id, kvl.id if kvl else None,  "On va gagner samedi !", 17, 20, 5),
                _msg(c7.id, mgi.id if mgi else None,  "Motivés ! On compte sur toi Kevin.", 17, 25, 5),
            ])
            convs_n += 1

            # 8. Stefan Koch
            if stk:
                c8 = Conversation(name=f"{stk.first_name} {stk.last_name}", category="team",
                                  role_type="player", initials="SK", avatar_bg="bg-surface-container-high",
                                  role="Gardien de but · #1", created_at=datetime(2026, 6, 5, 14, 0))
                db.add(c8); await db.flush()
                db.add_all(_part(c8.id, adm, stk))
                db.add_all([
                    _msg(c8.id, adm.id,  "Stefan, bon match la semaine dernière. Un point à travailler : tes sorties sur les centres.", 14, 0, 5),
                    _msg(c8.id, stk.id,  "Oui j'ai revu les images. Je dois être plus décisif sur les ballons aériens.", 14, 15, 5),
                    _msg(c8.id, adm.id,  "On travaille ça vendredi avec Jean en séance spécifique gardiens.", 14, 20, 5),
                    _msg(c8.id, stk.id,  "Merci pour le retour, je travaille dessus.", 14, 25, 5),
                ])
                convs_n += 1

            # 9. Florent Garnier
            if fga:
                c9 = Conversation(name=f"{fga.first_name} {fga.last_name}", category="staff",
                                  role_type="coach", initials="FG", avatar_bg="bg-surface-container-high",
                                  role="Coach Attaque", created_at=datetime(2026, 6, 4, 16, 0))
                db.add(c9); await db.flush()
                db.add_all(_part(c9.id, adm, fga))
                db.add_all([
                    _msg(c9.id, fga.id,  "J'ai préparé un plan d'exercices pour améliorer le pressing haut.", 16, 0, 4),
                    _msg(c9.id, adm.id,  "Excellent. On peut l'intégrer dès mardi ?", 16, 15, 4),
                    _msg(c9.id, fga.id,  "Oui, séance de 45 min après l'échauffement collectif.", 16, 20, 4),
                    _msg(c9.id, adm.id,  "Parfait, je valide. Prépare les plots pour mardi.", 16, 30, 4),
                ])
                convs_n += 1

            print(f"  ✅ Messagerie  —  {convs_n} conversation(s) créée(s)")

        await db.commit()

        print(f"\n{DIV}")
        print("  🎉  Seed terminé !")
        print(f"{DIV}\n")

    await engine.dispose()


if __name__ == "__main__":
    asyncio.run(seed())

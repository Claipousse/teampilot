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
            db.add(User(email="admin@teampilot.com", username="coach.test",
                        hashed_password=hash_password("coach123"),
                        first_name="Coach", last_name="Test",
                        is_admin=True, type="staff", must_change_password=False))
            await db.flush()
        else:
            admin_user_obj.username = "coach.test"
            admin_user_obj.first_name = "Coach"
            admin_user_obj.last_name = "Test"
            admin_user_obj.hashed_password = hash_password("coach123")
            admin_user_obj.must_change_password = False

        # ── Comptes de test ────────────────────────────────────────────────────
        staff_ex = await db.execute(select(User).where(User.email == "staff@teampilot.com"))
        staff_user_obj = staff_ex.scalar_one_or_none()
        if not staff_user_obj:
            sm_test = StaffMember(first_name="Médecin", last_name="Test", role="Médecin",
                                  email="staff@teampilot.com", phone="+44 20 5678 9012",
                                  since_date="2025-01-01")
            db.add(sm_test)
            await db.flush()
            db.add(User(email="staff@teampilot.com", username="medecin.test",
                        hashed_password=hash_password("medecin123"),
                        first_name="Médecin", last_name="Test",
                        is_admin=False, type="staff", staff_id=sm_test.id,
                        must_change_password=False))
        else:
            staff_user_obj.username = "medecin.test"
            staff_user_obj.first_name = "Médecin"
            staff_user_obj.last_name = "Test"
            staff_user_obj.hashed_password = hash_password("medecin123")
            staff_user_obj.must_change_password = False
            if staff_user_obj.staff_id:
                sm_ex = await db.execute(select(StaffMember).where(StaffMember.id == staff_user_obj.staff_id))
                sm_existing = sm_ex.scalar_one_or_none()
                if sm_existing:
                    sm_existing.first_name = "Médecin"
                    sm_existing.last_name = "Test"
                    sm_existing.role = "Médecin"

        joueur_ex = await db.execute(select(User).where(User.email == "joueur@teampilot.com"))
        joueur_user_obj = joueur_ex.scalar_one_or_none()
        if not joueur_user_obj:
            tp = Player(first_name="Joueur", last_name="Test", shirt_number=77,
                        position="Milieu Offensif", position_short="MIL",
                        nationality="Français", nationality_flag="fr", status="Disponible",
                        contract_end_date="2027-06-30",
                        matches=18, goals=5, assists=7, yellow_cards=2, minutes_played=1530)
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
            if joueur_user_obj.player_id:
                tp_ex = await db.execute(select(Player).where(Player.id == joueur_user_obj.player_id))
                tp_existing = tp_ex.scalar_one_or_none()
                if tp_existing:
                    tp_existing.matches = 18
                    tp_existing.goals = 5
                    tp_existing.assists = 7
                    tp_existing.yellow_cards = 2
                    tp_existing.minutes_played = 1530

        print("  ✅ Comptes tests créés  (coach.test / medecin.test / joueur.test)")

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
            (dict(first_name="Marcus",  last_name="Valentin", shirt_number=8,  position="Milieu Central",    position_short="MIL", nationality="Anglais",   nationality_flag="gb", date_of_birth="1998-03-15", height_cm=182, weight_kg=78, preferred_foot="Droit",  status="Disponible", contract_end_date="2027-06-30", academy="Manchester Academy", matches=22, goals=4,  assists=9,  yellow_cards=3, minutes_played=1850, notes="Excellent visionnaire du jeu."),  "m.valentin@metropolisunited.com"),
            (dict(first_name="Julian",  last_name="Romero",   shirt_number=3,  position="Arrière Gauche",    position_short="DEF", nationality="Espagnol",  nationality_flag="es", date_of_birth="2000-07-22", height_cm=175, weight_kg=72, preferred_foot="Gauche", status="Blessé",     contract_end_date="2025-06-30", academy="Atletico Madrid B", matches=14, assists=3, yellow_cards=2, minutes_played=1170, injury_description="Ischio-jambiers", return_date_estimate="2026-07-14"), "j.romero@metropolisunited.com"),
            (dict(first_name="Kevin",   last_name="Larson",   shirt_number=9,  position="Attaquant Centre",  position_short="ATT", nationality="Français",  nationality_flag="fr", date_of_birth="1996-11-08", height_cm=186, weight_kg=82, preferred_foot="Droit",  status="Disponible", contract_end_date="2028-06-30", academy="OL Academy", matches=22, goals=11, assists=4, yellow_cards=1, minutes_played=1940, notes="Meilleur buteur."), "k.larson@metropolisunited.com"),
            (dict(first_name="Stefan",  last_name="Koch",     shirt_number=1,  position="Gardien de but",    position_short="GK",  nationality="Allemand",  nationality_flag="de", date_of_birth="1995-05-14", height_cm=192, weight_kg=88, preferred_foot="Droit",  status="Disponible", contract_end_date="2028-06-30", academy="Bayern Youth", matches=22, clean_sheets=9, goals_conceded=18, minutes_played=1980), "s.koch@metropolisunited.com"),
            (dict(first_name="Alex",    last_name="Mendez",   shirt_number=5,  position="Défenseur Central", position_short="DEF", nationality="Brésilien", nationality_flag="br", date_of_birth="1997-01-30", height_cm=188, weight_kg=84, preferred_foot="Droit",  status="Suspendu",   contract_end_date="2026-06-30", academy="Flamengo Youth", matches=19, goals=2, assists=1, yellow_cards=5, red_cards=1, minutes_played=1710, injury_description="2 matchs de suspension"), "a.mendez@metropolisunited.com"),
            (dict(first_name="Tom",     last_name="Owen",     shirt_number=11, position="Ailier Droit",      position_short="ATT", nationality="Anglais",   nationality_flag="gb", date_of_birth="2001-09-19", height_cm=178, weight_kg=74, preferred_foot="Gauche", status="Incertain",  contract_end_date="2027-06-30", academy="Chelsea Academy", matches=18, goals=6, assists=7, yellow_cards=1, minutes_played=1420, injury_description="Gêne musculaire cuisse", return_date_estimate="Décision avant le match"), "t.owen@metropolisunited.com"),
            (dict(first_name="Antoine", last_name="Moreau",   shirt_number=2,  position="Arrière Droit",     position_short="DEF", nationality="Français",  nationality_flag="fr", date_of_birth="2001-04-12", height_cm=180, weight_kg=76, preferred_foot="Droit",  status="Disponible", contract_end_date="2028-06-30", matches=20, goals=1, assists=4, minutes_played=1800), "a.moreau@metropolisunited.com"),
            (dict(first_name="Samuel",  last_name="Blanc",    shirt_number=4,  position="Défenseur Central", position_short="DEF", nationality="Français",  nationality_flag="fr", date_of_birth="1999-08-20", height_cm=190, weight_kg=86, preferred_foot="Droit",  status="Disponible", contract_end_date="2027-06-30", matches=21, goals=2, assists=1, yellow_cards=2, minutes_played=1890), "s.blanc@metropolisunited.com"),
            (dict(first_name="Eric",    last_name="Dubois",   shirt_number=6,  position="Milieu Défensif",   position_short="MIL", nationality="Belge",     nationality_flag="be", date_of_birth="1998-12-05", height_cm=183, weight_kg=79, preferred_foot="Droit",  status="Disponible", contract_end_date="2026-06-30", matches=19, goals=3, assists=6, yellow_cards=4, minutes_played=1710), "e.dubois@metropolisunited.com"),
            (dict(first_name="Theo",    last_name="Durand",   shirt_number=7,  position="Ailier Gauche",     position_short="ATT", nationality="Français",  nationality_flag="fr", date_of_birth="2002-03-28", height_cm=176, weight_kg=71, preferred_foot="Gauche", status="Disponible", contract_end_date="2029-06-30", matches=17, goals=5, assists=8, minutes_played=1530), "t.durand@metropolisunited.com"),
            (dict(first_name="Maxime",  last_name="Girard",   shirt_number=10, position="Milieu Offensif",   position_short="MIL", nationality="Français",  nationality_flag="fr", date_of_birth="1997-06-14", height_cm=177, weight_kg=73, preferred_foot="Gauche", status="Disponible", contract_end_date="2028-06-30", matches=22, goals=7, assists=12, yellow_cards=1, minutes_played=1980), "m.girard@metropolisunited.com"),
            (dict(first_name="Roberto", last_name="Diaz",     shirt_number=12, position="Milieu Central",    position_short="MIL", nationality="Argentin",  nationality_flag="ar", date_of_birth="1999-11-30", height_cm=181, weight_kg=77, preferred_foot="Droit",  status="Disponible", contract_end_date="2027-06-30", matches=18, goals=2, assists=5, yellow_cards=3, minutes_played=1620), "r.diaz@metropolisunited.com"),
            (dict(first_name="Lucas",   last_name="Bernard",  shirt_number=13, position="Attaquant Centre",  position_short="ATT", nationality="Français",  nationality_flag="fr", date_of_birth="2000-02-17", height_cm=185, weight_kg=81, preferred_foot="Droit",  status="Disponible", contract_end_date="2027-06-30", matches=16, goals=8, assists=2, minutes_played=1440), "l.bernard@metropolisunited.com"),
            (dict(first_name="Romain",  last_name="Laurent",  shirt_number=14, position="Arrière Gauche",    position_short="DEF", nationality="Français",  nationality_flag="fr", date_of_birth="2001-07-09", height_cm=179, weight_kg=74, preferred_foot="Gauche", status="Disponible", contract_end_date="2028-06-30", matches=20, assists=3, yellow_cards=2, minutes_played=1800), "r.laurent@metropolisunited.com"),
            (dict(first_name="Nicolas", last_name="Petit",    shirt_number=15, position="Milieu Défensif",   position_short="MIL", nationality="Français",  nationality_flag="fr", date_of_birth="1998-09-22", height_cm=184, weight_kg=80, preferred_foot="Droit",  status="Disponible", contract_end_date="2026-06-30", matches=21, goals=4, assists=7, yellow_cards=3, minutes_played=1890), "n.petit@metropolisunited.com"),
        ]:
            await ensure_player(pd, email)
        c, s = stats["players"]
        print(f"  ✅ Joueurs  —  {c} créé(s), {s} existant(s)")

        # ── Événements ─────────────────────────────────────────────────────────
        # Passé récent (avant le 25 juin) + à venir (après le 25 juin)
        admin_r = await db.execute(select(User).where(User.email == "admin@teampilot.com"))
        admin_user = admin_r.scalar_one_or_none()
        if admin_user:
            for title, tag, edate, etime, loc, notes in [
                # ── Passé récent ───────────────────────────────────────────────
                # ── Mi-juin — fin de saison ───────────────────────────────────
                ("Séance Récupération",      "Entraînement", "2026-06-16", "10:00", "Piscine · Spa",              "Récupération post-match. Présence obligatoire."),
                ("Conférence de Presse",     "Réunion",      "2026-06-18", "14:00", "Salle de presse",            "Coach + capitaine. Point fin de phase aller."),
                ("Débrief Vidéo",            "Réunion",      "2026-06-18", "10:00", "Salle vidéo · Bâtiment B",  "Analyse du dernier match. Tout le groupe."),
                ("Match Amical — Lyon FC",   "Match",        "2026-06-20", "17:00", "Stade principal (domicile)", "Match de préparation. Échauffement 16h."),
                ("Bilan de fin de saison",   "Réunion",      "2026-06-23", "10:00", "Salle de réunion A",         "Présence staff complet. Bilan individuel joueurs."),
                # ── Cette semaine / transition ─────────────────────────────────
                ("Entretiens Individuels",   "Réunion",      "2026-06-25", "09:00", "Bureau coach principal",     "Planning : 30 min par joueur. Liste affichée vestiaire."),
                ("Gym Libre",                "Entraînement", "2026-06-25", "14:00", "Salle de musculation",       "Accès libre salle muscu. Programme individuel."),
                ("Séance Technique Libre",   "Entraînement", "2026-06-27", "10:30", "Terrain 2",                  "Participation volontaire. Travail technique individuel."),
                # ── Juillet — pré-saison ───────────────────────────────────────
                ("Reprise Pré-saison",       "Entraînement", "2026-07-07", "09:00", "Terrain principal",          "Reprise officielle. Présence obligatoire. Tenue : rouge."),
                ("Tests Médicaux",           "Réunion",      "2026-07-08", "08:00", "Centre médical",             "Bilans cardio + physio pour tous les joueurs."),
                ("Séance Cardio Matinale",   "Entraînement", "2026-07-08", "15:00", "Terrain 2",                  "Après visites médicales. Groupe allégé, intensité modérée."),
                ("Entraînement Tactique",    "Entraînement", "2026-07-10", "09:00", "Terrain principal",          "Mise en place du système 4-3-3. Vidéo à 09h00."),
                ("Analyse Adversaire",       "Réunion",      "2026-07-10", "14:30", "Salle vidéo · Bâtiment B",  "Préparation Ajax B. Visionnage vidéo + plan de jeu."),
                ("Séance Pressing Haut",     "Entraînement", "2026-07-12", "10:00", "Terrain 2",                  "Exercices spécifiques pressing. Florent Garnier dirige."),
                ("Match Amical — Ajax B",    "Match",        "2026-07-14", "15:00", "Terrain principal",          "Premier test pré-saison. Bus départ 13h30."),
                ("Récupération Post-Match",  "Récupération", "2026-07-15", "10:00", "Piscine · Spa",              "Bains froids + étirements. Présence obligatoire."),
                ("Séance Attaquants",        "Entraînement", "2026-07-17", "10:00", "Terrain principal",          "Travail finition + jeu dans le dos. Coach attaque."),
                ("Tournoi Pré-saison J1",    "Match",        "2026-07-19", "14:00", "Stade de Metz",              "Tournoi 4 équipes. Départ bus 11h00. Nuit à l'hôtel."),
                ("Tournoi Pré-saison J2",    "Match",        "2026-07-20", "11:00", "Stade de Metz",              "Match de classement. Retour bus après match."),
                ("Récupération Tournoi",     "Récupération", "2026-07-21", "10:00", "Centre médical",             "Bilan physio post-tournoi. Massages + cryothérapie."),
                ("Point Recrutement",        "Réunion",      "2026-07-22", "11:00", "Bureau directeur sportif",   "Transferts entrants / sortants. Staff direction uniquement."),
                ("Séance Corners & Phases",  "Entraînement", "2026-07-24", "10:00", "Terrain principal",          "Phases arrêtées offensives et défensives."),
                ("Réunion Tactique Défense", "Réunion",      "2026-07-24", "15:00", "Salle vidéo · Bâtiment B",  "Bloc défensif + transitions. Défenseurs + milieux déf."),
                ("Match Amical — Bordeaux",  "Match",        "2026-07-26", "16:00", "Stade Chaban-Delmas",        "Déplacement. Bus 12h00. Nuit sur place."),
                ("Récupération Bordeaux",    "Récupération", "2026-07-27", "10:00", "Piscine · Spa",              "Retour de déplacement. Récupération active obligatoire."),
                ("Conférence Pré-saison",    "Réunion",      "2026-07-29", "14:00", "Salle de presse",            "Présentation objectifs saison 2026/2027."),
                # ── Août — lancement de saison ─────────────────────────────────
                ("Activation Pré-ouverture", "Entraînement", "2026-08-01", "10:00", "Terrain principal",          "Dernière séance avant la saison. Léger + tactique."),
                ("Revue Effectif",           "Réunion",      "2026-08-01", "15:00", "Bureau coach principal",     "Point final sur le groupe retenu pour J1."),
                ("Reconnaissance Stade",     "Entraînement", "2026-08-08", "11:00", "Stade principal (domicile)", "Séance sur la pelouse J-1. Légère, 45 min."),
                ("Réunion Pré-match",        "Réunion",      "2026-08-08", "15:00", "Salle de réunion A",         "Consignes tactiques J1. Plan de jeu final. Obligatoire."),
                ("Ouverture Elite Pro",      "Match",        "2026-08-09", "17:00", "Stade principal (domicile)", "Journée 1 Elite Pro League. Échauffement 16h. Tenue domicile."),
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
        for evt in all_events:
            notif_title = f"{evt.title} ajouté"
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

            def _msg(conv_id, sender_id, text, h, m=0, day=20, month=6):
                return Message(conversation_id=conv_id, sender_id=sender_id, msg_type="text",
                               text=text, created_at=datetime(2026, month, day, h, m, 0))

            def _sys(conv_id, text, h=8, day=20, month=6):
                return Message(conversation_id=conv_id, sender_id=None, msg_type="system",
                               text=text, created_at=datetime(2026, month, day, h, 0, 0))

            def _part(conv_id, *users):
                return [ConversationParticipant(conversation_id=conv_id, user_id=u.id)
                        for u in users if u]

            # 1. Tactical AI
            ai = Conversation(name="Tactical AI", category="staff", role_type="ai", is_ai=True,
                              initials="✦", avatar_bg="bg-primary",
                              created_at=datetime(2026, 6, 21, 8, 0))
            db.add(ai); await db.flush()
            db.add_all(_part(ai.id, adm))
            db.add_all([
                _msg(ai.id, None,    "Bonjour Coach. La reprise pré-saison est fixée au 7 juillet. Voulez-vous que je prépare un planning de la semaine ?", 8, 0, 21),
                _msg(ai.id, adm.id,  "Oui, fais-moi un point sur les charges d'entraînement prévues.", 8, 5, 21),
                _msg(ai.id, None,    "Semaine 1 (7–11 juillet) : charge progressive. Lundi reprise physique, mardi tests médicaux, jeudi–vendredi tactique.", 8, 6, 21),
                _msg(ai.id, adm.id,  "Ajoute une séance pressing haut vendredi avec Florent.", 8, 10, 21),
                _msg(ai.id, None,    "C'est noté. Séance pressing haute ajoutée vendredi 10h, terrain 2. Florent Garnier désigné responsable.", 8, 11, 21),
            ])
            convs_n += 1

            # 2. Thomas Laurent
            if thl:
                c2 = Conversation(name=f"{thl.first_name} {thl.last_name}", category="staff",
                                  role_type="coach", initials="TL", avatar_bg="bg-surface-container-high",
                                  role="Coach Principal", created_at=datetime(2026, 6, 22, 9, 0))
                db.add(c2); await db.flush()
                db.add_all(_part(c2.id, adm, thl))
                db.add_all([
                    _msg(c2.id, thl.id,  "J'ai revu le calendrier de pré-saison. Je propose qu'on commence le 4-3-3 dès la deuxième semaine.", 9, 0, 22),
                    _msg(c2.id, adm.id,  "D'accord. On a le tournoi de Metz le 19, c'est un bon test pour ça.", 9, 10, 22),
                    _msg(c2.id, thl.id,  "Exactement. Il faudra aussi décider de la hiérarchie des gardiens avant la reprise.", 9, 15, 22),
                    _msg(c2.id, adm.id,  "Stefan est titulaire indiscutable. On peut en reparler après les tests médicaux du 8.", 9, 20, 22),
                    _msg(c2.id, thl.id,  "Reçu. Je prépare aussi un document sur les axes de progression individuels.", 9, 35, 22),
                ])
                convs_n += 1

            # 3. Claire Dupuis
            if cdp:
                c3 = Conversation(name=f"{cdp.first_name} {cdp.last_name}", category="staff",
                                  role_type="staff", initials="CD", avatar_bg="bg-surface-container-high",
                                  role="Médecin", created_at=datetime(2026, 6, 20, 11, 0))
                db.add(c3); await db.flush()
                db.add_all(_part(c3.id, adm, cdp))
                db.add_all([
                    _msg(c3.id, cdp.id,  "Bilan fin de saison terminé. Julian R. : reprise progressive possible début juillet. Alex M. : suspendu jusqu'au 2 juillet.", 11, 0, 20),
                    _msg(c3.id, adm.id,  "Julian peut faire les tests médicaux du 8 ?", 11, 10, 20),
                    _msg(c3.id, cdp.id,  "Oui si la rééducation suit le planning actuel. Je confirme le 30 juin.", 11, 15, 20),
                    _msg(c3.id, adm.id,  "Parfait. Tenez-moi informé. Et pour Tom Owen ?", 11, 20, 20),
                    _msg(c3.id, cdp.id,  "Tom est quasi à 100%. Je valide sa reprise complète pour le 7 juillet.", 11, 25, 20),
                ])
                convs_n += 1

            # 4. Groupe Staff Tactique
            c4 = Conversation(name="Staff Tactique", category="staff", role_type="group", is_group=True,
                              initials="ST", avatar_bg="bg-inverse-surface",
                              created_at=datetime(2026, 6, 20, 9, 0))
            db.add(c4); await db.flush()
            db.add_all(_part(c4.id, adm, thl, cdp, smo, dpk, pmo, fga))
            db.add_all([
                _sys(c4.id, "Groupe créé · 7 membres", 9, 20),
                _msg(c4.id, adm.id,                   "Bilan de saison demain 10h, salle A. Points à couvrir : bilan stats, blessures, objectifs pré-saison.", 9, 0, 20),
                _msg(c4.id, thl.id if thl else None,  "Je prépare un slide sur les stats collectives et les axes d'amélioration.", 9, 15, 20),
                _msg(c4.id, cdp.id if cdp else None,  "Je ferai un point médical : Julian R., Alex M. et Tom O.", 9, 20, 20),
                _msg(c4.id, dpk.id if dpk else None,  "J'apporte les vidéos des 5 derniers matchs et les heatmaps.", 9, 22, 20),
                _msg(c4.id, fga.id if fga else None,  "J'ai des pistes pour améliorer notre efficacité offensive. On en parle demain.", 9, 30, 20),
                _msg(c4.id, adm.id,                   "Parfait. À demain 10h.", 9, 35, 20),
            ])
            convs_n += 1

            # 5. Marcus Valentin
            if mkv:
                c5 = Conversation(name=f"{mkv.first_name} {mkv.last_name}", category="team",
                                  role_type="player", initials="MV", avatar_bg="bg-surface-container-high",
                                  role="Milieu Central · #8", created_at=datetime(2026, 6, 23, 10, 0))
                db.add(c5); await db.flush()
                db.add_all(_part(c5.id, adm, mkv))
                db.add_all([
                    _msg(c5.id, adm.id,  "Marcus, très bonne saison. Entretien individuel jeudi 25 à 9h30. Tu es disponible ?", 10, 0, 23),
                    _msg(c5.id, mkv.id,  "Oui Coach, je serai là. J'ai des questions sur mon rôle la saison prochaine.", 10, 20, 23),
                    _msg(c5.id, adm.id,  "On en parle justement. On envisage de te donner plus de liberté dans le 4-3-3.", 10, 25, 23),
                    _msg(c5.id, mkv.id,  "Super nouvelle. Hâte d'en discuter !", 10, 30, 23),
                ])
                convs_n += 1

            # 6. Kevin Larson
            if kvl:
                c6 = Conversation(name=f"{kvl.first_name} {kvl.last_name}", category="team",
                                  role_type="player", initials="KL", avatar_bg="bg-surface-container-high",
                                  role="Attaquant Centre · #9", created_at=datetime(2026, 6, 21, 14, 0))
                db.add(c6); await db.flush()
                db.add_all(_part(c6.id, adm, kvl))
                db.add_all([
                    _msg(c6.id, adm.id,  "Kevin, 11 buts cette saison, chapeau. On compte sur toi pour faire encore mieux en 2026/2027.", 14, 0, 21),
                    _msg(c6.id, kvl.id,  "Merci Coach ! Je travaille dur cet été. Objectif 15 buts minimum.", 14, 10, 21),
                    _msg(c6.id, adm.id,  "Avec Theo et Maxime derrière toi, tu auras encore plus d'occasions.", 14, 15, 21),
                    _msg(c6.id, kvl.id,  "On va faire une grande saison j'en suis convaincu.", 14, 20, 21),
                ])
                convs_n += 1

            # 7. Groupe Équipe Première
            c7 = Conversation(name="Équipe Première", category="team", role_type="group", is_group=True,
                              initials="EP", avatar_bg="bg-primary",
                              created_at=datetime(2026, 6, 20, 17, 0))
            db.add(c7); await db.flush()
            db.add_all(_part(c7.id, adm, mkv, kvl, stk, mgi))
            db.add_all([
                _sys(c7.id, "Groupe Équipe Première · 18 membres", 17, 20),
                _msg(c7.id, adm.id,                   "Bonne fin de saison à tous ! Reprise officielle le 7 juillet à 9h. Profitez bien de vos vacances.", 17, 0, 20),
                _msg(c7.id, kvl.id if kvl else None,  "Merci Coach ! Reposez-vous aussi. On reviendra encore plus forts !", 17, 10, 20),
                _msg(c7.id, stk.id if stk else None,  "À dans 2 semaines. Belle coupure à tout le monde.", 17, 15, 20),
                _msg(c7.id, mkv.id if mkv else None,  "Hâte de reprendre. Bel été les gars 💪", 17, 20, 20),
                _msg(c7.id, mgi.id if mgi else None,  "Top saison ! On va tout donner en 2026/2027.", 17, 25, 20),
            ])
            convs_n += 1

            # 8. Stefan Koch
            if stk:
                c8 = Conversation(name=f"{stk.first_name} {stk.last_name}", category="team",
                                  role_type="player", initials="SK", avatar_bg="bg-surface-container-high",
                                  role="Gardien de but · #1", created_at=datetime(2026, 6, 22, 15, 0))
                db.add(c8); await db.flush()
                db.add_all(_part(c8.id, adm, stk))
                db.add_all([
                    _msg(c8.id, adm.id,  "Stefan, 9 clean sheets cette saison, excellent. Jean va préparer un programme spécifique gardiens pour la pré-saison.", 15, 0, 22),
                    _msg(c8.id, stk.id,  "Merci Coach. Je travaille aussi sur mes relances courtes cet été.", 15, 10, 22),
                    _msg(c8.id, adm.id,  "Parfait, c'est un axe important avec notre pressing haut. On intègre ça dès la semaine 2.", 15, 15, 22),
                    _msg(c8.id, stk.id,  "Je serai prêt. À le 7 juillet !", 15, 20, 22),
                ])
                convs_n += 1

            # 9. Florent Garnier
            if fga:
                c9 = Conversation(name=f"{fga.first_name} {fga.last_name}", category="staff",
                                  role_type="coach", initials="FG", avatar_bg="bg-surface-container-high",
                                  role="Coach Attaque", created_at=datetime(2026, 6, 19, 16, 0))
                db.add(c9); await db.flush()
                db.add_all(_part(c9.id, adm, fga))
                db.add_all([
                    _msg(c9.id, fga.id,  "J'ai analysé nos 5 derniers matchs. Notre pressing haut manque de synchronisation entre attaquants et milieux.", 16, 0, 19),
                    _msg(c9.id, adm.id,  "C'est exactement ce qu'on veut corriger en pré-saison. Tu avais un plan d'exercices ?", 16, 15, 19),
                    _msg(c9.id, fga.id,  "Oui, 3 exercices progressifs. Je les intègre dans la séance du 12 juillet.", 16, 20, 19),
                    _msg(c9.id, adm.id,  "Parfait. Envoie-moi le document avant le 7. On valide ensemble.", 16, 30, 19),
                    _msg(c9.id, fga.id,  "Je te l'envoie vendredi. Bel été Coach.", 16, 35, 19),
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

"""Données initiales : admin, club, saison, staff, joueurs, événements, messagerie.
Usage (depuis le dossier backend/) : python seed.py
"""
import asyncio
from datetime import datetime
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker
from sqlalchemy import select
from app.models.user import User
from app.models.club import Club, Season
from app.models.staff import StaffMember
from app.models.player import Player
from app.models.event import Event
from app.models.message import Conversation, ConversationParticipant, Message
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

        # ── Comptes de test génériques ─────────────────────────────────────────
        test_staff_r = await db.execute(select(User).where(User.email == "staff@teampilot.com"))
        if not test_staff_r.scalar_one_or_none():
            db.add(User(email="staff@teampilot.com", hashed_password=hash_password("staff123"),
                first_name="Alex", last_name="Martin", is_admin=False, type="staff"))
            print("✅ Compte test staff : staff@teampilot.com  /  staff123")

        test_joueur_r = await db.execute(select(User).where(User.email == "joueur@teampilot.com"))
        if not test_joueur_r.scalar_one_or_none():
            test_player = Player(
                first_name="Jamie", last_name="Dupont",
                shirt_number=77, position="Milieu Offensif", position_short="MIL",
                nationality="Français", status="Disponible", contract_end_date="2027-06-30",
            )
            db.add(test_player)
            await db.flush()
            db.add(User(email="joueur@teampilot.com", hashed_password=hash_password("player123"),
                first_name="Jamie", last_name="Dupont",
                is_admin=False, type="player", player_id=test_player.id))
            print("✅ Compte test joueur : joueur@teampilot.com  /  player123")

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

        # ── Messagerie ────────────────────────────────────────────────────────
        # Vérifier si les conversations existent déjà
        existing_conv = await db.execute(select(Conversation).limit(1))
        if not existing_conv.scalar_one_or_none():
            # Récupérer les utilisateurs par email
            def _u(email: str): return select(User).where(User.email == email)

            adm  = (await db.execute(_u("admin@teampilot.com"))).scalar_one_or_none()
            thl  = (await db.execute(_u("tlaurent@metropolisunited.com"))).scalar_one_or_none()
            cdp  = (await db.execute(_u("cdupuis@metropolisunited.com"))).scalar_one_or_none()
            smo  = (await db.execute(_u("smoreau@metropolisunited.com"))).scalar_one_or_none()
            dpk  = (await db.execute(_u("dpark@metropolisunited.com"))).scalar_one_or_none()
            mkv  = (await db.execute(_u("m.valentin@metropolisunited.com"))).scalar_one_or_none()
            kvl  = (await db.execute(_u("k.larson@metropolisunited.com"))).scalar_one_or_none()
            stk  = (await db.execute(_u("s.koch@metropolisunited.com"))).scalar_one_or_none()

            today = datetime  # alias pour les timestamps

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
            print("✅ Conversation : Tactical AI")

            # 2. Thomas Laurent (Coach Principal)
            if thl:
                c2 = Conversation(name=f"{thl.first_name} {thl.last_name}", category="staff",
                                  role_type="coach", initials="TL", avatar_bg="bg-surface-container-high",
                                  role="Coach Principal", created_at=datetime(2026, 6, 6, 9, 30))
                db.add(c2); await db.flush()
                db.add_all(_part(c2.id, adm, thl))
                db.add_all([
                    _msg(c2.id, thl.id,  "Bonjour. La séance du matin est annulée suite aux conditions météo. On reprend à 14h sur le terrain 2 couvert.", 9, 30),
                    _msg(c2.id, adm.id,  "Reçu. Je préviens les joueurs tout de suite.", 9, 35),
                    _msg(c2.id, thl.id,  "Merci. Prévois aussi une séance vidéo à 13h pour analyser le dernier match.", 9, 36),
                    _msg(c2.id, adm.id,  "C'est noté. La salle de projection est disponible à 13h.", 9, 40),
                    _msg(c2.id, thl.id,  "On reprend à 14h sur le terrain 2.", 10, 45),
                ])
                print(f"✅ Conversation : {thl.first_name} {thl.last_name}")

            # 3. Claire Dupuis (Médecin)
            if cdp:
                c3 = Conversation(name=f"{cdp.first_name} {cdp.last_name}", category="staff",
                                  role_type="staff", initials="CD", avatar_bg="bg-surface-container-high",
                                  role="Médecin", created_at=datetime(2026, 6, 6, 8, 45))
                db.add(c3); await db.flush()
                db.add_all(_part(c3.id, adm, cdp))
                db.add_all([
                    _msg(c3.id, cdp.id,  "Bonjour. Le scanner de Julian R. vient de revenir. Lésion de grade 2 aux ischio-jambiers. Repos complet 3 semaines minimum.", 8, 45),
                    _msg(c3.id, adm.id,  "Merci. Il sera donc forfait pour les 2 prochains matchs ?", 8, 50),
                    _msg(c3.id, cdp.id,  "Oui, au minimum. On réévalue dans 10 jours. Je vous envoie le rapport complet.", 8, 52),
                    _msg(c3.id, cdp.id,  "Rapport_Medical.pdf", 8, 53),
                    _msg(c3.id, adm.id,  "Bien reçu. Gardez-moi informé de l'évolution.", 9, 12),
                ])
                print(f"✅ Conversation : {cdp.first_name} {cdp.last_name}")

            # 4. Groupe Staff Tactique
            c4 = Conversation(name="Staff Tactique", category="staff", role_type="group", is_group=True,
                              initials="ST", avatar_bg="bg-inverse-surface",
                              created_at=datetime(2026, 6, 5, 18, 0))
            db.add(c4); await db.flush()
            db.add_all(_part(c4.id, adm, thl, cdp, smo, dpk))
            db.add_all([
                _sys(c4.id, f"Groupe créé par {thl.first_name if thl else 'Coach'} · 5 membres", 18, 5),
                _msg(c4.id, thl.id if thl else None, "Réunion de staff demain matin à 9h. Point sur les blessés et préparation match samedi.", 18, 0, day=5),
                _msg(c4.id, cdp.id if cdp else None, "Je serai présente. Je prépare un point sur Julian R. et Tom O.", 18, 15, day=5),
                _msg(c4.id, dpk.id if dpk else None, "Ok pour moi. Tom O. a bien récupéré depuis hier.", 18, 30, day=5),
                _msg(c4.id, adm.id, "Parfait. Salle de réunion A.", 18, 35, day=5),
                _msg(c4.id, thl.id if thl else None, "Réunion demain 9h. À demain.", 19, 0, day=5),
            ])
            print("✅ Conversation : Staff Tactique (groupe)")

            # 5. Marcus Valentin
            if mkv:
                c5 = Conversation(name=f"{mkv.first_name} {mkv.last_name}", category="team",
                                  role_type="player", initials="MV", avatar_bg="bg-surface-container-high",
                                  role="Milieu Central · #8", created_at=datetime(2026, 6, 6, 10, 45))
                db.add(c5); await db.flush()
                db.add_all(_part(c5.id, adm, mkv))
                db.add_all([
                    _msg(c5.id, adm.id,  "Marcus, peux-tu venir 30 minutes plus tôt demain pour un travail sur les transitions ?", 10, 45),
                    _msg(c5.id, mkv.id,  "Bien sûr Coach, pas de problème. À quelle heure ?", 10, 50),
                    _msg(c5.id, adm.id,  "8h30, avant la séance collective.", 10, 52),
                    _msg(c5.id, mkv.id,  "Présent à 8h30 demain Coach.", 11, 20),
                ])
                print(f"✅ Conversation : {mkv.first_name} {mkv.last_name}")

            # 6. Kevin Larson
            if kvl:
                c6 = Conversation(name=f"{kvl.first_name} {kvl.last_name}", category="team",
                                  role_type="player", initials="KL", avatar_bg="bg-surface-container-high",
                                  role="Attaquant Centre · #9", created_at=datetime(2026, 6, 6, 9, 0))
                db.add(c6); await db.flush()
                db.add_all(_part(c6.id, adm, kvl))
                db.add_all([
                    _msg(c6.id, adm.id,  "Kevin, excellente semaine d'entraînement. Continue sur cette lancée pour samedi.", 9, 0),
                    _msg(c6.id, kvl.id,  "Merci Coach ! Je me sens vraiment bien en ce moment. Hâte d'être au match.", 9, 10),
                    _msg(c6.id, adm.id,  "Parfait. Pense à bien récupérer jeudi et vendredi. Pas de surcharge.", 9, 25),
                    _msg(c6.id, kvl.id,  "D'accord, je ferai attention.", 9, 30),
                ])
                print(f"✅ Conversation : {kvl.first_name} {kvl.last_name}")

            # 7. Groupe Équipe Première
            c7 = Conversation(name="Équipe Première", category="team", role_type="group", is_group=True,
                              initials="EP", avatar_bg="bg-primary",
                              created_at=datetime(2026, 6, 5, 17, 0))
            db.add(c7); await db.flush()
            db.add_all(_part(c7.id, adm, mkv, kvl, stk))
            db.add_all([
                _sys(c7.id, "Groupe Équipe Première · 18 membres", 17, 5),
                _msg(c7.id, adm.id,  "Rendez-vous samedi 13h au stade. Bus départ 12h30 depuis le centre.", 17, 0, day=5),
                _msg(c7.id, mkv.id if mkv else None, "Reçu Coach. On sera là.", 17, 5, day=5),
                _msg(c7.id, stk.id if stk else None, "Présent. Peut-on amener nos familles en tribune ?", 17, 10, day=5),
                _msg(c7.id, adm.id,  "Oui, 2 places par joueur au guichet. Parlez à Marc pour les billets.", 17, 15, day=5),
                _msg(c7.id, kvl.id if kvl else None, "On va gagner samedi !", 17, 20, day=5),
            ])
            print("✅ Conversation : Équipe Première (groupe)")

            # 8. Stefan Koch
            if stk:
                c8 = Conversation(name=f"{stk.first_name} {stk.last_name}", category="team",
                                  role_type="player", initials="SK", avatar_bg="bg-surface-container-high",
                                  role="Gardien de but · #1", created_at=datetime(2026, 6, 5, 14, 0))
                db.add(c8); await db.flush()
                db.add_all(_part(c8.id, adm, stk))
                db.add_all([
                    _msg(c8.id, adm.id,  "Stefan, bon match la semaine dernière. Un point à travailler : tes sorties sur les centres.", 14, 0, day=5),
                    _msg(c8.id, stk.id,  "Oui j'ai revu les images. Je dois être plus décisif sur les ballons aériens.", 14, 15, day=5),
                    _msg(c8.id, adm.id,  "On travaille ça vendredi avec Jean en séance spécifique gardiens.", 14, 20, day=5),
                    _msg(c8.id, stk.id,  "Merci pour le retour, je travaille dessus.", 14, 25, day=5),
                ])
                print(f"✅ Conversation : {stk.first_name} {stk.last_name}")

        await db.commit()
        print("\n🎉 Seed terminé.")

    await engine.dispose()


if __name__ == "__main__":
    asyncio.run(seed())

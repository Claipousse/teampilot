# Structure du projet — Teampilot

> Tous les dossiers et fichiers du projet, expliqués simplement. Si tu ne sais pas où chercher quelque chose, commence ici.

---

## Vue d'ensemble

Le projet est divisé en deux grandes parties qui tournent en parallèle :

- **`backend/`** — Le serveur Python (FastAPI). Il tourne sur le port 8000, gère la base de données, vérifie les droits, et répond aux requêtes de l'application.
- **`app/` et le reste** — L'application web (Next.js). Elle tourne sur le port 3000 et affiche les pages dans le navigateur.

Pense à un restaurant : le backend c'est la cuisine (invisible, fait le vrai travail), le frontend c'est la salle (ce que le client voit).

---

## Arborescence complète

```
teampilot/
│
├── backend/                         ← Tout le code Python (le serveur)
│   │
│   ├── app/                         ← Le cœur de l'application Python
│   │   ├── main.py                  ← Point de départ : lance le serveur et branche toutes les routes
│   │   ├── config.py                ← Lit les réglages depuis le fichier .env (clé secrète, BDD, etc.)
│   │   ├── database.py              ← Crée la connexion à la base de données SQLite
│   │   │
│   │   ├── dependencies/            ← "Gardiens" réutilisables appelés avant chaque requête
│   │   │   ├── auth.py              ← Vérifie qui fait la requête (connecté ? admin ? staff ?)
│   │   │   └── db.py                ← Ouvre une connexion BDD pour la durée d'une requête
│   │   │
│   │   ├── models/                  ← Description des tables de la base de données
│   │   │   ├── user.py              ← Table users : les comptes de connexion
│   │   │   ├── player.py            ← Table players : les fiches joueurs avec stats
│   │   │   ├── staff.py             ← Table staff_members : les membres du staff
│   │   │   ├── club.py              ← Tables clubs et seasons (club + saisons sportives)
│   │   │   ├── event.py             ← Table events : les événements du calendrier
│   │   │   ├── message.py           ← Tables conversations, participants et messages
│   │   │   └── notification.py      ← Table notifications : alertes in-app de chaque utilisateur
│   │   │
│   │   ├── schemas/                 ← Formats de données acceptés/retournés par l'API
│   │   │   ├── auth.py              ← Formats pour la connexion et le changement de mot de passe
│   │   │   ├── player.py            ← Formats pour créer, modifier ou lire un joueur
│   │   │   ├── staff.py             ← Formats pour créer, modifier ou lire un membre du staff
│   │   │   ├── club.py              ← Formats pour lire ou modifier le club
│   │   │   ├── season.py            ← Formats pour les saisons sportives
│   │   │   ├── event.py             ← Formats pour les événements du calendrier
│   │   │   ├── message.py           ← Formats pour les conversations et messages
│   │   │   ├── notification.py      ← Format d'une notification retournée à l'API
│   │   │   ├── dashboard.py         ← Formats pour les KPIs et le résumé admin du dashboard
│   │   │   └── ai.py                ← Formats de la requête et réponse du chatbot IA
│   │   │
│   │   ├── routers/                 ← Les URLs disponibles dans l'API, organisées par thème
│   │   │   ├── auth.py              ← /auth/login, /auth/me, /auth/change-password
│   │   │   ├── players.py           ← /players — tout ce qui concerne les joueurs
│   │   │   ├── staff.py             ← /staff — tout ce qui concerne le staff
│   │   │   ├── club.py              ← /club — infos et modification du club
│   │   │   ├── seasons.py           ← /seasons — gestion des saisons sportives
│   │   │   ├── events.py            ← /events — calendrier et notifications automatiques
│   │   │   ├── messages.py          ← /messages — conversations et messagerie
│   │   │   ├── notifications.py     ← /notifications — lire et supprimer des notifications
│   │   │   ├── dashboard.py         ← /dashboard — KPIs et données agrégées
│   │   │   └── ai.py                ← /ai — chatbot Tactical AI
│   │   │
│   │   └── services/                ← Fonctions utilitaires appelées par les routers
│   │       ├── auth_service.py      ← Hachage mots de passe, création/décodage JWT, génération d'identifiants
│   │       └── ai_service.py        ← Appel Groq, fallback Ollama, construction du contexte IA
│   │
│   ├── alembic/                     ← Système de gestion des changements de base de données
│   │   ├── env.py                   ← Configure comment Alembic se connecte à la BDD
│   │   └── versions/                ← Historique des modifications (10 scripts, un par changement)
│   │       ├── 066b31e8af6b_init_users.py           ← Création initiale de la table users
│   │       ├── b708c92ff456_add_club_season_staff.py ← Ajout tables clubs, seasons, staff_members
│   │       ├── 39f5ba0ea579_add_players_events.py   ← Ajout tables players et events
│   │       ├── c4d5e6f7a8b9_add_messages.py         ← Ajout tables conversations et messages
│   │       ├── d1e2f3a4b5c6_add_hidden_to_participants.py ← Ajout colonne "hidden" (quitter une conv)
│   │       ├── e2f3a4b5c6d7_add_notifications.py   ← Ajout table notifications
│   │       ├── f3g4h5i6j7k8_notif_kind_string.py   ← Type de notification : Enum → texte libre
│   │       ├── g4h5i6j7k8l9_notif_add_tag.py       ← Ajout colonne "tag" sur les notifications
│   │       ├── h5i6j7k8l9m0_add_username.py        ← Ajout colonne "username" sur les users
│   │       └── i6j7k8l9m0n1_staff_email_nullable.py ← Email du staff rendu optionnel
│   │
│   ├── alembic.ini                  ← Fichier de configuration d'Alembic (chemin des scripts)
│   ├── requirements.txt             ← Liste de toutes les librairies Python à installer
│   ├── .env                         ← Variables secrètes (clé API, etc.) — jamais committé sur git
│   └── teampilot.db                 ← La base de données SQLite (créée automatiquement, pas sur git)
│
│
├── app/                             ← Tout le code Next.js (les pages du navigateur)
│   │
│   ├── (auth)/                      ← Pages accessibles sans être connecté
│   │   └── login/
│   │       └── page.tsx             ← La page de connexion (identifiant + mot de passe)
│   │
│   ├── (app)/                       ← Pages protégées (nécessitent d'être connecté)
│   │   ├── layout.tsx               ← Structure commune : sidebar + header + nav mobile
│   │   │
│   │   ├── dashboard/               ← Tableau de bord
│   │   │   ├── page.tsx             ← Choisit entre Desktop et Mobile selon la taille d'écran
│   │   │   ├── DashboardDesktop.tsx ← Version grand écran (KPIs, événements, joueurs, convs)
│   │   │   └── DashboardMobile.tsx  ← Version mobile (même contenu, empilé verticalement)
│   │   │
│   │   ├── joueurs/                 ← Gestion des joueurs
│   │   │   ├── page.tsx             ← Choisit Desktop ou Mobile
│   │   │   ├── JoueursDesktop.tsx   ← Liste avec filtres, panel de détail, CRUD admin
│   │   │   └── JoueursMobile.tsx    ← Cartes verticales, modal de détail
│   │   │
│   │   ├── calendrier/              ← Calendrier des événements
│   │   │   ├── page.tsx             ← Choisit Desktop ou Mobile
│   │   │   ├── CalendrierDesktop.tsx ← Vue mensuelle (grille 7×6), panel de détail
│   │   │   └── CalendrierMobile.tsx  ← Vue semaine (7 jours), navigation semaine par semaine
│   │   │
│   │   ├── messagerie/              ← Messagerie entre utilisateurs + Tactical AI
│   │   │   ├── page.tsx             ← Choisit Desktop ou Mobile
│   │   │   ├── MessagerieDesktop.tsx ← Vue 2 colonnes : liste conv à gauche, chat à droite
│   │   │   └── MessagerieMobile.tsx  ← Vue alternée : soit la liste, soit le chat
│   │   │
│   │   ├── administration/          ← Panel admin (club, saison, staff) — admins uniquement
│   │   │   ├── page.tsx             ← Choisit Desktop ou Mobile
│   │   │   ├── AdministrationDesktop.tsx ← 3 panneaux : Club, Saison, Staff
│   │   │   └── AdministrationMobile.tsx  ← Même contenu, adapté mobile
│   │   │
│   │   └── change-password/
│   │       └── page.tsx             ← Changement de mot de passe (forcé à la 1ère connexion ou volontaire)
│   │
│   ├── api/                         ← Routes "serveur" de Next.js (invisibles dans le navigateur)
│   │   ├── auth/
│   │   │   ├── login/route.ts       ← Reçoit le login, appelle FastAPI, pose le cookie JWT
│   │   │   ├── logout/route.ts      ← Supprime le cookie JWT
│   │   │   └── me/route.ts          ← Vérifie si la session est valide, retourne l'utilisateur
│   │   ├── backend/
│   │   │   └── [...path]/route.ts   ← Proxy universel : redirige tout vers FastAPI en ajoutant le token
│   │   └── nationalities/
│   │       └── route.ts             ← Liste des nationalités avec drapeaux (mise en cache)
│   │
│   ├── layout.tsx                   ← Layout racine de Next.js (balises HTML, polices)
│   └── page.tsx                     ← Page racine "/" — redirige immédiatement vers /dashboard
│
│
├── components/                      ← Composants React réutilisables dans plusieurs pages
│   ├── layout/
│   │   ├── Sidebar.tsx              ← Menu de navigation vertical (desktop, côté gauche)
│   │   ├── Header.tsx               ← Barre du haut avec notifications (desktop)
│   │   ├── MobileHeader.tsx         ← Barre du haut avec notifications (mobile)
│   │   └── BottomNav.tsx            ← Barre de navigation du bas (mobile uniquement)
│   └── NationalitySelect.tsx        ← Sélecteur de nationalité avec drapeaux et recherche
│
├── contexts/                        ← Données partagées dans toute l'application
│   ├── AuthContext.tsx              ← Partage l'utilisateur connecté (nom, rôle, droits)
│   └── LanguageContext.tsx          ← Partage la langue courante (fr/en) et les traductions
│
├── hooks/                           ← Fonctions réutilisables avec logique React
│   ├── useCurrentUser.ts            ← Raccourci vers isAdmin, type, playerId de l'utilisateur connecté
│   ├── useDashboard.ts              ← Charge toutes les données du tableau de bord
│   └── useNotifications.ts          ← Charge, affiche et supprime les notifications
│
├── lib/                             ← Fonctions utilitaires et constantes partagées
│   ├── playerUtils.ts               ← Types, constantes et fonctions liés aux joueurs
│   └── dashboardUtils.ts            ← Types, constantes et fonctions liés au dashboard
│
├── locales/
│   └── translations.ts              ← Tous les textes de l'app en français et en anglais
│
├── public/                          ← Fichiers statiques (favicon, images, icônes)
│
├── docs/                            ← Cette documentation
│   ├── STACK.md                     ← Technologies utilisées et pourquoi
│   ├── STRUCTURE.md                 ← Ce fichier : tous les dossiers et fichiers expliqués
│   ├── BACKEND.md                   ← Toutes les fonctions du backend, fichier par fichier
│   ├── FRONTEND.md                  ← Les composants frontend et leur rôle
│   └── AI.md                        ← Focus sur le chatbot Tactical AI
│
├── proxy.ts                         ← Middleware Next.js : redirige vers /login si pas connecté
├── next.config.ts                   ← Configuration de Next.js
├── package.json                     ← Liste des dépendances JavaScript et scripts npm
├── tsconfig.json                    ← Configuration du compilateur TypeScript
├── AGENTS.md                        ← Instructions pour l'assistant IA de développement
└── README.md                        ← Installation et démarrage du projet
```

---

## Les `__init__.py`

Dans chaque dossier Python (`models/`, `schemas/`, `routers/`, `services/`, `dependencies/`), il y a un fichier `__init__.py` vide. Il ne contient rien de spécial — c'est juste une convention Python qui indique "ce dossier est un module importable". Sans lui, Python ne sait pas que le dossier existe en tant que module.

## Les `page.tsx`

Dans Next.js, chaque dossier de page contient un `page.tsx`. Ce fichier fait généralement une seule chose : choisir entre la version Desktop et la version Mobile du composant selon la taille de l'écran. La vraie logique est dans les fichiers `*Desktop.tsx` et `*Mobile.tsx`.

## Ce qui n'est pas sur git

- `backend/.env` — contient les clés secrètes (GROQ_API_KEY, SECRET_KEY). Jamais committé.
- `backend/teampilot.db` — la base de données. Chaque développeur en a une locale.
- `backend/uploads/` — les images uploadées (photos joueurs, staff, logo).
- `node_modules/` et `backend/__pycache__/` — fichiers générés automatiquement à l'installation.

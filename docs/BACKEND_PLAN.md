# TeampilotAI — Plan Backend

> **Version :** 1.1 — Juin 2026
> **Frontend :** Next.js 16 / React 19 / Tailwind 4 / TypeScript
> **Backend cible :** FastAPI (Python 3.12)

---

## Sommaire

1. [Stack technique](#1-stack-technique)
2. [Arborescence backend](#2-arborescence-backend)
3. [Modèles de données](#3-modèles-de-données)
4. [Endpoints API](#4-endpoints-api)
5. [Gouvernance RBAC](#5-gouvernance-rbac)
6. [Chatbot Tactical AI](#6-chatbot-tactical-ai)
7. [WebSockets — Messagerie temps réel](#7-websockets--messagerie-temps-réel)
8. [Sécurité](#8-sécurité)
9. [Docker & déploiement](#9-docker--déploiement)
10. [Roadmap d'intégration frontend](#10-roadmap-dintégration-frontend)
11. [Impact sur le code frontend existant](#11-impact-sur-le-code-frontend-existant)

---

## 1. Stack technique

| Composant | Choix | Version | Justification |
|---|---|---|---|
| Framework | FastAPI | 0.115 | Async natif, OpenAPI auto, WebSocket intégré |
| Serveur | Uvicorn | 0.32 | ASGI, workers multiples en prod |
| ORM | SQLAlchemy async | 2.0 | Typed, compatible Alembic |
| Migrations | Alembic | 1.14 | Standard avec SQLAlchemy |
| BDD prod | PostgreSQL | 16 | JSONB, full-text search, robustesse |
| BDD dev | SQLite | — | Zéro config, même ORM |
| Validation | Pydantic v2 | 2.10 | Schémas request/response, settings |
| Auth | python-jose + passlib | 3.3 / 1.7 | JWT HS256, bcrypt |
| Chatbot | Groq API | 0.13 | Gratuit, Llama 3.3 70B, <1s latence |
| Fallback IA | Ollama (local) | — | llama3.2:3b, offline, 0 coût |
| Temps réel | WebSocket FastAPI natif | — | Pas de dépendance tierce |
| Cache / Pub-Sub | Redis | 7 | Broadcast WS multi-instances |
| Rate limiting | slowapi | 0.1.9 | Middleware FastAPI |
| Upload | python-multipart + Pillow | — | Validation MIME, resize images |
| Tests | pytest + pytest-asyncio | 8.3 / 0.24 | Tests async |

### `requirements.txt`

```
fastapi==0.115.6
uvicorn[standard]==0.32.1
sqlalchemy==2.0.36
alembic==1.14.0
pydantic[email]==2.10.3
pydantic-settings==2.6.1
python-jose[cryptography]==3.3.0
passlib[bcrypt]==1.7.4
python-multipart==0.0.20
aiofiles==24.1.0
websockets==14.1
redis==5.2.1
groq==0.13.0
slowapi==0.1.9
pillow==11.1.0
httpx==0.28.1
pytest==8.3.4
pytest-asyncio==0.24.0
```

---

## 2. Arborescence backend

```
backend/
├── app/
│   ├── __init__.py
│   ├── main.py                    # Point d'entrée : app FastAPI, routers, CORS, middleware
│   ├── config.py                  # Settings Pydantic (lecture .env)
│   ├── database.py                # Engine SQLAlchemy async, get_db()
│   │
│   ├── models/                    # Tables SQLAlchemy
│   │   ├── __init__.py
│   │   ├── user.py                # User (is_admin, type, linked_profile_id)
│   │   ├── club.py                # Club (singleton), Season
│   │   ├── player.py              # Player, PlayerStats
│   │   ├── staff.py               # StaffMember
│   │   ├── event.py               # Event (calendrier)
│   │   ├── messaging.py           # Conversation, ConversationParticipant, Message
│   │   └── notification.py        # Notification
│   │
│   ├── schemas/                   # Pydantic v2 — request / response
│   │   ├── __init__.py
│   │   ├── auth.py                # TokenResponse, LoginRequest, RefreshRequest
│   │   ├── user.py                # UserCreate, UserRead, UserUpdate
│   │   ├── club.py                # ClubRead, ClubUpdate
│   │   ├── season.py              # SeasonRead, SeasonCreate, SeasonUpdate
│   │   ├── player.py              # PlayerRead, PlayerCreate, PlayerUpdate, PlayerStatsRead
│   │   ├── staff.py               # StaffMemberRead, StaffMemberCreate, StaffMemberUpdate
│   │   ├── event.py               # EventRead, EventCreate, EventUpdate
│   │   ├── messaging.py           # ConversationRead, MessageRead, MessageCreate
│   │   ├── notification.py        # NotificationRead
│   │   └── ai.py                  # AIChatRequest, AIChatResponse
│   │
│   ├── routers/                   # Endpoints par domaine
│   │   ├── __init__.py
│   │   ├── auth.py                # /auth/login, /auth/refresh, /auth/me
│   │   ├── players.py             # CRUD joueurs + upload photo
│   │   ├── events.py              # CRUD événements calendrier
│   │   ├── staff.py               # CRUD staff
│   │   ├── club.py                # Lecture/mise à jour club
│   │   ├── seasons.py             # CRUD saisons
│   │   ├── messaging.py           # Conversations + messages (REST)
│   │   ├── notifications.py       # Lecture, suppression notifications
│   │   ├── ai.py                  # Endpoint chatbot Tactical AI
│   │   ├── uploads.py             # Upload images (joueurs, staff, logo)
│   │   └── dashboard.py           # KPIs agrégés
│   │
│   ├── websocket/
│   │   ├── __init__.py
│   │   ├── manager.py             # ConnectionManager (connect, broadcast, Redis Pub-Sub)
│   │   └── router.py              # Route WS /ws?token=<jwt>
│   │
│   ├── services/                  # Logique métier découplée des routers
│   │   ├── auth_service.py        # create_token, verify_token, hash_password
│   │   ├── player_service.py
│   │   ├── event_service.py       # + création auto de notifications
│   │   ├── messaging_service.py   # + broadcast WS
│   │   ├── notification_service.py
│   │   └── ai_service.py          # Groq + fallback Ollama + build_context()
│   │
│   ├── dependencies/
│   │   ├── auth.py                # get_current_user(), require_admin()
│   │   └── db.py                  # get_db (async generator)
│   │
│   └── utils/
│       ├── image.py               # Validation MIME, resize, sauvegarde
│       └── pagination.py          # PaginatedResponse[T]
│
├── alembic/
│   ├── env.py
│   ├── script.py.mako
│   └── versions/
│
├── tests/
│   ├── conftest.py
│   ├── test_auth.py
│   ├── test_players.py
│   ├── test_events.py
│   ├── test_messaging.py
│   └── test_ai.py
│
├── uploads/                       # Fichiers uploadés (volume Docker)
│   ├── players/
│   ├── staff/
│   └── club/
│
├── .env
├── .env.example
├── alembic.ini
├── requirements.txt
├── Dockerfile
└── docker-compose.yml
```

---

## 3. Modèles de données

### 3.1 User

Entité centrale. Chaque utilisateur est soit lié à un joueur, soit à un membre du staff (ou aucun pour un "Dirigeant pur" sans profil terrain).

```
User
├── id              : int (PK)
├── email           : str (unique, indexed)
├── hashed_password : str
├── is_admin        : bool          ← UNIQUE interrupteur de permissions
├── type            : enum('player', 'staff')  ← pour l'UI uniquement
├── player_id       : int | null    (FK → players.id, OneToOne)
├── staff_id        : int | null    (FK → staff_members.id, OneToOne)
├── is_active       : bool = True
├── created_at      : datetime
└── updated_at      : datetime

Règle : player_id et staff_id ne peuvent pas être tous deux non-null.
Règle : type='player' → is_admin=False (toujours).
```

**Relation avec les couleurs messagerie :**
- `type='player'` → bleu (primary)
- `type='staff'` + `is_admin=False` → vert (secondary)
- `type='staff'` + `is_admin=True` → orange (#B45309)

### 3.2 Club *(singleton — id=1 toujours)*

```
Club
├── id          : int (PK)
├── name        : str
├── founded_year: str
├── league      : str
├── email       : str
├── phone       : str
├── address     : str
├── city        : str
├── logo_url    : str | null
└── updated_at  : datetime
```

### 3.3 Season

```
Season
├── id                : int (PK)
├── club_id           : int (FK → club.id)
├── label             : str           # "2026/2027" — calculé à la création
├── start_date        : date
├── end_date          : date
├── competitions      : str           # "Premier League · FA Cup"
├── objective         : str
├── status            : enum('À venir', 'En cours', 'Terminée')
├── is_active         : bool = False  # une seule saison active à la fois
├── matchday_total    : int | null
├── matchday_current  : int | null
├── created_at        : datetime
└── updated_at        : datetime
```

### 3.4 Player

```
Player
├── id                   : int (PK)
├── first_name           : str
├── last_name            : str
├── shirt_number         : int
├── position             : str                        # "Milieu Central"
├── position_short       : enum('GK','DEF','MIL','ATT')
├── nationality          : str
├── nationality_flag     : str | null                 # emoji
├── date_of_birth        : date | null
├── height_cm            : int | null
├── weight_kg            : int | null
├── preferred_foot       : enum('Droit','Gauche','Les deux') | null
├── photo_url            : str | null
├── status               : enum('Disponible','Blessé','Suspendu','Incertain')
├── injury_description   : str | null
├── return_date_estimate : str | null
├── contract_end_date    : date | null
├── academy              : str | null
├── notes                : str | null
├── is_active            : bool = True
├── created_at           : datetime
└── updated_at           : datetime

→ stats : List[PlayerStats]  (une entrée par saison)
```

### 3.5 PlayerStats

```
PlayerStats
├── id              : int (PK)
├── player_id       : int (FK → players.id, indexed)
├── season_id       : int (FK → seasons.id)
├── matches         : int = 0
├── goals           : int = 0
├── assists         : int = 0
├── yellow_cards    : int = 0
├── red_cards       : int = 0
├── minutes_played  : int = 0
├── clean_sheets    : int = 0    # GK
└── goals_conceded  : int = 0    # GK

UniqueConstraint(player_id, season_id)
```

### 3.6 StaffMember

Les 12 rôles prédéfinis + **"Dirigeant"** (pour un compte admin sans profil terrain) :

```
StaffMember
├── id         : int (PK)
├── first_name : str
├── last_name  : str
├── role       : enum(
│     'Coach Principal', 'Coach Adjoint', 'Préparateur Physique',
│     'Médecin', 'Kinésithérapeute', 'Manager', 'Modérateur',
│     'Scout', 'Analyste Vidéo', 'Intendant', 'Directeur Sportif',
│     'Psychologue', 'Dirigeant'         ← nouveau
│   )
├── email      : str (unique)
├── phone      : str | null
├── since_date : date | null
├── photo_url  : str | null
├── notes      : str | null
├── is_active  : bool = True
├── created_at : datetime
└── updated_at : datetime
```

### 3.7 Event

```
Event
├── id          : int (PK)
├── title       : str
├── tag         : enum('Match', 'Entraînement', 'Récupération', 'Réunion')
├── event_date  : date (indexed)
├── event_time  : time
├── location    : str | null
├── notes       : str | null
├── created_by  : int (FK → users.id)
├── created_at  : datetime
└── updated_at  : datetime
```

### 3.8 Conversation

```
Conversation
├── id         : int (PK)
├── name       : str | null     # Nom du groupe (null si DM)
├── is_group   : bool = False
├── is_ai      : bool = False   # True = conversation Tactical AI
├── created_by : int (FK → users.id)
├── created_at : datetime
└── updated_at : datetime       # mis à jour à chaque nouveau message
```

### 3.9 ConversationParticipant

```
ConversationParticipant
├── id              : int (PK)
├── conversation_id : int (FK → conversations.id, indexed)
├── user_id         : int (FK → users.id, indexed)
├── last_read_at    : datetime | null    # calcul des non-lus
└── joined_at       : datetime

UniqueConstraint(conversation_id, user_id)
```

### 3.10 Message

```
Message
├── id              : int (PK)
├── conversation_id : int (FK → conversations.id, indexed)
├── sender_id       : int | null (FK → users.id — null si IA)
├── content         : str | null
├── message_type    : enum('text', 'file', 'system', 'ai_response')
├── file_url        : str | null
├── file_name       : str | null
├── file_size_kb    : int | null
├── sent_at         : datetime (indexed)
└── is_deleted      : bool = False     # soft delete
```

### 3.11 Notification

```
Notification
├── id         : int (PK)
├── user_id    : int (FK → users.id, indexed)
├── kind       : enum('added', 'rescheduled', 'cancelled', 'message')
├── title      : str
├── event_date : date | null    # pour auto-nettoyage si événement passé
├── event_id   : int | null (FK → events.id)
├── message_id : int | null (FK → messages.id)
├── is_read    : bool = False
└── created_at : datetime
```

---

## 4. Endpoints API

Préfixe global : `/api/v1`

### Auth — `/auth`

| Méthode | Path | Accès | Description |
|---|---|---|---|
| POST | `/login` | Public | email + password → access_token + refresh_token |
| POST | `/refresh` | Authentifié | Renouvelle l'access_token |
| GET | `/me` | Tous | Profil utilisateur connecté |
| PATCH | `/me/password` | Tous | Changement de mot de passe |

### Players — `/players`

| Méthode | Path | Accès | Description |
|---|---|---|---|
| GET | `/` | Tous | Liste paginée, filtres position/status/search |
| POST | `/` | Admin | Créer joueur + compte User associé |
| GET | `/{id}` | Tous | Détail joueur |
| PATCH | `/{id}` | Admin | Modifier un joueur |
| DELETE | `/{id}` | Admin | Soft delete |
| POST | `/{id}/photo` | Admin | Upload photo |
| DELETE | `/{id}/photo` | Admin | Retirer la photo |
| GET | `/{id}/stats` | Tous | Stats saison active |
| PATCH | `/{id}/stats` | Admin | Mise à jour des stats |
| GET | `/summary` | Tous | Counts par statut (KPIs dashboard) |

### Events — `/events`

| Méthode | Path | Accès | Description |
|---|---|---|---|
| GET | `/` | Tous | Liste filtrée par mois (year, month) |
| POST | `/` | Admin | Créer un événement + notifs auto |
| GET | `/{id}` | Tous | Détail d'un événement |
| PATCH | `/{id}` | Admin | Modifier + notif "rescheduled" auto |
| DELETE | `/{id}` | Admin | Supprimer + notif "cancelled" auto |
| GET | `/upcoming` | Tous | 5 prochains événements (dashboard) |

### Staff — `/staff`

| Méthode | Path | Accès | Description |
|---|---|---|---|
| GET | `/` | Tous | Liste avec filtres role/search |
| POST | `/` | Admin | Créer membre + compte User associé |
| GET | `/{id}` | Tous | Détail d'un membre |
| PATCH | `/{id}` | Admin | Modifier (dont `is_admin` du User lié) |
| DELETE | `/{id}` | Admin | Soft delete |
| POST | `/{id}/photo` | Admin | Upload photo |
| DELETE | `/{id}/photo` | Admin | Retirer la photo |

### Club — `/club`

| Méthode | Path | Accès | Description |
|---|---|---|---|
| GET | `/` | Tous | Infos du club |
| PATCH | `/` | Admin | Modifier les infos |
| POST | `/logo` | Admin | Upload logo |
| DELETE | `/logo` | Admin | Retirer le logo |

### Seasons — `/seasons`

| Méthode | Path | Accès | Description |
|---|---|---|---|
| GET | `/` | Tous | Liste de toutes les saisons |
| GET | `/active` | Tous | Saison active |
| POST | `/` | Admin | Créer une saison |
| PATCH | `/{id}` | Admin | Modifier |
| PATCH | `/{id}/activate` | Admin | Activer (désactive les autres) |
| DELETE | `/{id}` | Admin | Supprimer |

### Messaging — `/messaging`

| Méthode | Path | Accès | Description |
|---|---|---|---|
| GET | `/conversations` | Tous | Conversations de l'utilisateur |
| POST | `/conversations` | Tous | Créer une conversation (DM ou groupe) |
| GET | `/conversations/{id}/messages` | Tous (participant) | Messages paginés |
| POST | `/conversations/{id}/messages` | Tous (participant) | Envoyer un message |
| POST | `/conversations/{id}/files` | Tous (participant) | Envoyer un fichier |
| PATCH | `/conversations/{id}/read` | Tous (participant) | Marquer comme lu |
| GET | `/unread-count` | Tous | Total messages non lus |

### Notifications — `/notifications`

| Méthode | Path | Accès | Description |
|---|---|---|---|
| GET | `/` | Tous | Notifications de l'utilisateur |
| PATCH | `/{id}/read` | Tous | Marquer comme lu |
| DELETE | `/{id}` | Tous | Supprimer une notification |
| DELETE | `/cleanup/past` | Admin | Nettoyage des notifs événements passés |

### Dashboard — `/dashboard`

| Méthode | Path | Accès | Description |
|---|---|---|---|
| GET | `/kpis` | Tous | Agrégat : joueurs, events, messages non lus |
| GET | `/upcoming-events` | Tous | 5 prochains événements |
| GET | `/recent-messages` | Tous | 4 dernières conversations |
| GET | `/unavailable-players` | Tous | Joueurs non-disponibles |
| GET | `/admin-summary` | Admin | Infos club + saison + staff (panel admin) |

### AI — `/ai`

| Méthode | Path | Accès | Description |
|---|---|---|---|
| POST | `/chat` | Tous | Envoie message → réponse Tactical AI |
| GET | `/conversation` | Tous | Historique IA de l'utilisateur |
| DELETE | `/conversation` | Tous | Effacer l'historique IA |

---

## 5. Gouvernance RBAC

### Principe : modèle binaire

```python
# Un seul champ, une seule règle
is_admin: bool

# Dépendances FastAPI
async def get_current_user(...)  → User      # vérifie JWT valide
async def require_admin(...)     → User      # vérifie is_admin=True → 403 sinon
```

### Matrice des permissions

| Ressource | Action | `is_admin=True` | `is_admin=False` |
|---|---|---|---|
| **Club** | Lire | Oui | Oui |
| **Club** | Modifier / Logo | Oui | Non |
| **Saison** | Lire | Oui | Oui |
| **Saison** | CRUD / Activer | Oui | Non |
| **Joueurs** | Lire tous / stats | Oui | Oui |
| **Joueurs** | CRUD / Photo | Oui | Non |
| **Joueurs** | Modifier sa fiche | — | Non (admins uniquement) |
| **Staff** | Lire | Oui | Oui |
| **Staff** | CRUD / Photo / `is_admin` | Oui | Non |
| **Événements** | Lire | Oui | Oui |
| **Événements** | CRUD | Oui | Non |
| **Notifications** | Ses notifs (lire/suppr) | Oui | Oui |
| **Messagerie** | Toutes fonctions | Oui | **Oui** |
| **Tactical AI** | Accès | Oui | **Oui** |
| **Dashboard** | KPIs + events + messages | Oui | Oui |
| **Dashboard** | Panel admin (club/saison/staff) | Oui | Non (masqué) |

### Couleurs messagerie ← dérivées de l'utilisateur

| Condition | Couleur UI | Token Tailwind |
|---|---|---|
| `type = 'player'` | Bleu | `text-primary` |
| `type = 'staff'` + `is_admin = false` | Vert | `text-secondary` |
| `type = 'staff'` + `is_admin = true` | Orange | `text-[#B45309]` |

### Implémentation

```python
# app/dependencies/auth.py

async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(HTTPBearer()),
    db: AsyncSession = Depends(get_db),
) -> User:
    user_id = verify_token(credentials.credentials)
    user = await db.get(User, user_id)
    if not user or not user.is_active:
        raise HTTPException(401, "Utilisateur inactif ou introuvable")
    return user

async def require_admin(
    current_user: User = Depends(get_current_user),
) -> User:
    if not current_user.is_admin:
        raise HTTPException(403, "Action réservée aux administrateurs")
    return current_user

# Utilisation dans un router :
# @router.post("/",   dependencies=[Depends(require_admin)])   ← admin only
# @router.get("/",    dependencies=[Depends(get_current_user)]) ← tous
```

---

## 6. Chatbot Tactical AI

### Vue d'ensemble

Accessible à **tous les utilisateurs** (admin et non-admin). Chaque utilisateur a sa propre conversation IA persistée (`is_ai=True` dans `Conversation`). Le contexte du club est injecté dynamiquement dans le prompt système à chaque appel.

### Modèle et free tier

| Fournisseur | Modèle | Limite gratuite | Latence |
|---|---|---|---|
| **Groq (principal)** | llama-3.3-70b-versatile | 30 req/min, 14 400 req/jour | <1s |
| **Ollama (fallback)** | llama3.2:3b | Illimité (local) | 2-5s |

### Prompt système (contexte injecté)

```python
SYSTEM_PROMPT = """Tu es Tactical AI, l'assistant IA de {club_name}.
Tu es un expert en football et gestion de club. Tu aides le staff à prendre des décisions.

=== CLUB ===
{club_name} | {league} | {city}

=== SAISON {season_label} — {season_status} ===
Compétitions : {competitions} | Objectif : {objective}
Journée : {matchday_current}/{matchday_total}

=== EFFECTIF ({players_total} joueurs) ===
Disponibles ({available_count}) : {available_list}
Blessés ({injured_count}) : {injured_list}
Suspendus ({suspended_count}) : {suspended_list}
Incertains ({uncertain_count}) : {uncertain_list}

=== PROCHAIN ÉVÉNEMENT ===
{next_event}

=== STAFF ({staff_count} membres) ===
{staff_list}

Réponds en français, de façon concise et professionnelle.
Base-toi uniquement sur les données ci-dessus. N'invente aucune information.
"""
```

### Rate limiting

```python
@router.post("/chat")
@limiter.limit("20/minute")   # marge sous le free tier de 30 req/min Groq
async def ai_chat(...):
    ...
```

### Fallback Ollama

```python
async def chat_with_ai(message, history, db) -> str:
    try:
        return await call_groq(message, history, db)
    except Exception:
        return await call_ollama(message, history, db)  # fallback local
```

---

## 7. WebSockets — Messagerie temps réel

### Connexion

```
ws://<api>/ws?token=<access_token>
```

L'authentification se fait via token JWT en query param (les WebSocket ne supportent pas le header `Authorization`).

### ConnectionManager

```python
class ConnectionManager:
    _connections: dict[int, set[WebSocket]]  # {user_id: set[WebSocket]}
    _redis: aioredis.Redis                   # Pub-Sub multi-instances

    async def connect(websocket, user_id)
    async def disconnect(websocket, user_id)
    async def send_to_user(user_id, payload)
    async def broadcast_to_conversation(conversation_id, user_ids, payload)
```

### Catalogue des événements

| Direction | Type | Payload | Déclencheur |
|---|---|---|---|
| Serveur → Client | `new_message` | `{conversation_id, message}` | Nouveau message |
| Serveur → Client | `message_read` | `{conversation_id, user_id}` | Messages lus |
| Serveur → Client | `notification` | `{id, kind, title, event_date}` | Nouvelle notif |
| Serveur → Client | `unread_update` | `{total_unread}` | Compteur mis à jour |
| Client → Serveur | `typing` | `{conversation_id}` | Indicateur de saisie |
| Client → Serveur | `read` | `{conversation_id}` | Conversation ouverte |

---

## 8. Sécurité

### JWT

- **Access token** : durée 30 min, stocké en `localStorage`
- **Refresh token** : durée 7 jours, cookie `httpOnly` (non accessible en JS)
- Renouvellement automatique côté frontend sur réponse 401

### CORS

```python
allow_origins = [
    "http://localhost:3000",        # dev
    "https://teampilot.vercel.app", # prod (à adapter)
]
allow_credentials = True
```

### Rate limiting

| Endpoint | Limite |
|---|---|
| `POST /auth/login` | 10 req/min (anti brute-force) |
| `POST /ai/chat` | 20 req/min (Groq free tier) |
| Tous les autres POST | 100 req/min |

### Upload d'images

- Types autorisés : `image/jpeg`, `image/png`, `image/webp`
- Taille max : 5 Mo
- Validation Pillow (vérifie que c'est vraiment une image)
- Redimensionnement auto si > 1024px
- Sauvegarde en `.webp` avec nom UUID aléatoire
- Servies statiquement depuis `/uploads/`

### Variables d'environnement

```bash
# .env.example
DATABASE_URL=postgresql+asyncpg://teampilot:password@db:5432/teampilot
SECRET_KEY=<clé_256_bits_aléatoire>
ALGORITHM=HS256
GROQ_API_KEY=gsk_xxxxxxxxxxxxxxxxxxxx
REDIS_URL=redis://redis:6379/0
CORS_ORIGINS=http://localhost:3000,https://teampilot.vercel.app
UPLOAD_DIR=./uploads
MAX_UPLOAD_SIZE_MB=5
OLLAMA_URL=http://localhost:11434    # optionnel
```

---

## 9. Docker & déploiement

### Services

```yaml
# docker-compose.yml
services:
  api:      # FastAPI — port 8000
  db:       # PostgreSQL 16 — port 5432
  redis:    # Redis 7 — port 6379
  adminer:  # Inspecteur BDD (dev seulement, profile: dev)
```

### Volumes persistants

```yaml
volumes:
  postgres_data:   # Données PostgreSQL
  redis_data:      # Cache Redis
  ./uploads:       # Fichiers uploadés (monté sur /app/uploads)
```

### Commandes essentielles

```bash
# Démarrage
docker-compose up -d

# Migrations
docker-compose exec api alembic upgrade head

# Nouvelle migration après modification des modèles
docker-compose exec api alembic revision --autogenerate -m "description"

# Logs API
docker-compose logs -f api

# Accès BDD (dev)
docker-compose --profile dev up adminer
# → http://localhost:8080
```

---

## 10. Roadmap d'intégration frontend

### Phase 1 — Auth (8 – 11 juin)

**Objectif :** Remplacer `useCurrentUser` mocké par une vraie session JWT.

- Backend : `POST /auth/login`, `POST /auth/refresh`, seed des premiers utilisateurs
- Frontend :
  - `hooks/useCurrentUser.ts` → lit le JWT, expose `{ isAdmin, type, playerId }`
  - Contexte `AuthContext` : `login()`, `logout()`, `refreshToken()`
  - Intercepteur fetch/axios : refresh automatique sur 401
  - Page `/login` (nouvelle page à créer)
  - Redirection vers `/login` si non authentifié

### Phase 2 — Club, Saison, Staff (12 – 14 juin)

**Objectif :** Connecter la page Administration et le panel admin du dashboard.

- Backend : routers `club`, `seasons`, `staff` + seed données mock
- Frontend :
  - `AdministrationDesktop/Mobile` : remplacer `INIT_CLUB`, `INIT_SAISON`, `INIT_STAFF` par appels API
  - Formulaire staff : ajouter le toggle `Droits administrateur` (`is_admin`)
  - Upload logo + photos staff fonctionnel
  - Dashboard panel admin : `GET /dashboard/admin-summary`

### Phase 3 — Joueurs & Calendrier (15 – 18 juin)

**Objectif :** CRUD persisté pour les deux sections principales.

- Backend : routers `players`, `events`, `dashboard`
- Frontend :
  - `JoueursDesktop/Mobile` : remplacer `INITIAL_PLAYERS` par API, CRUD branché
  - Formulaire joueur : ajouter champs `email` + `mot de passe` (création compte)
  - Mise en avant de la fiche du joueur connecté (`playerId` depuis `useCurrentUser`)
  - `CalendrierDesktop/Mobile` : events depuis API, CRUD branché
  - Dashboard KPIs : `GET /dashboard/kpis` + `GET /dashboard/upcoming-events` + `GET /dashboard/unavailable-players`

### Phase 4 — Messagerie & Notifications (19 – 22 juin)

**Objectif :** Messagerie temps réel et notifications persistées.

- Backend : router `messaging`, ConnectionManager WebSocket, router `notifications`, Redis
- Frontend :
  - `MessagerieDesktop/Mobile` : conversations et messages depuis API
  - Hook `useWebSocket(token)` : connexion WS, dispatch `new_message` / `unread_update`
  - `nameColor()` / `roleAccent()` : logique `is_admin` + `type` depuis l'API (remplace `roleType` hardcodé)
  - Header : notifications depuis `GET /notifications`, suppression via API
  - Compteur non-lus en temps réel via WS

### Phase 5 — Tactical AI (23 – 25 juin)

**Objectif :** Chatbot fonctionnel avec contexte réel du club.

- Backend : router `ai`, `build_context()` avec vraies données BDD, clé Groq
- Frontend :
  - Conversation IA : historique depuis `GET /ai/conversation`
  - Envoi vers `POST /ai/chat` au lieu du send générique
  - Indicateur de chargement (`typing...`) pendant l'appel
  - Gestion erreur 429 : message "Assistant temporairement indisponible"

---

## 11. Impact sur le code frontend existant

### Fichiers à modifier (post-Phase 1)

| Fichier | Changement |
|---|---|
| `hooks/useCurrentUser.ts` | Retourne `{ isAdmin: boolean, type: 'player'\|'staff', playerId?: number }` |
| `components/layout/Sidebar.tsx` | `role === 'admin'` → `isAdmin` |
| `components/layout/BottomNav.tsx` | `role === 'admin'` → `isAdmin` |
| `app/(app)/dashboard/DashboardDesktop.tsx` | `role === 'admin'` → `isAdmin` |
| `app/(app)/dashboard/DashboardMobile.tsx` | `role === 'admin'` → `isAdmin` |
| `app/(app)/calendrier/CalendrierDesktop.tsx` | `canEdit` → `isAdmin` |
| `app/(app)/calendrier/CalendrierMobile.tsx` | `canEdit` → `isAdmin` |
| `app/(app)/joueurs/JoueursDesktop.tsx` | Boutons CRUD → `isAdmin` + highlight fiche propre |
| `app/(app)/joueurs/JoueursMobile.tsx` | Idem |
| `app/(app)/messagerie/MessagerieDesktop.tsx` | `nameColor()` / `roleAccent()` → basé sur `is_admin` + `type` |
| `app/(app)/messagerie/MessagerieMobile.tsx` | Idem |
| `app/(app)/administration/` | Accès déjà conditionnel, ajouter toggle `is_admin` dans le formulaire staff |
| `app/(app)/joueurs/` | Ajouter champs `email` + `mot de passe` dans le formulaire de création joueur |

### Valeur mock pendant les phases de transition

```typescript
// hooks/useCurrentUser.ts — mock à jour
export function useCurrentUser(): CurrentUser {
  return {
    isAdmin: true,       // ← remplace role: 'admin'
    type: 'staff',
    playerId: undefined,
  };
}
```

---

*Ce document est le référentiel unique du plan backend. Mettre à jour lors de chaque décision d'architecture significative.*

# Backend — Fonctions et endpoints

> Toutes les fonctions du backend, organisées par fichier. Pour chaque fonction : ce qu'elle fait en une phrase, avec les détails techniques quand c'est utile.

---

## `app/main.py` — Point d'entrée du serveur

**`app` (l'objet FastAPI)**
Crée l'application FastAPI, configure le CORS (autorise uniquement `http://localhost:3000` à appeler l'API), et branche tous les routers sous le préfixe `/api/v1`.

---

## `app/config.py` — Configuration

**`Settings` (classe Pydantic)**
Lit automatiquement le fichier `.env` et expose les valeurs dans `settings.*` partout dans le code.

| Paramètre | Valeur par défaut | Rôle |
|---|---|---|
| `DATABASE_URL` | `sqlite+aiosqlite:///./teampilot.db` | Chemin vers la BDD |
| `SECRET_KEY` | `"changeme"` | Clé pour signer les JWT — à changer en production |
| `ALGORITHM` | `HS256` | Algorithme de signature des JWT |
| `ACCESS_TOKEN_EXPIRE_HOURS` | `24` | Durée de vie d'un token (24h) |
| `UPLOAD_DIR` | `./uploads` | Dossier des images uploadées |
| `MAX_UPLOAD_SIZE_MB` | `5` | Taille max d'un fichier uploadé |
| `GROQ_API_KEY` | `""` | Clé API Groq pour le chatbot |
| `OLLAMA_URL` | `http://localhost:11434` | URL du serveur Ollama local |

---

## `app/database.py` — Connexion à la base de données

**`engine`**
Le moteur de connexion à SQLite — la "tuyauterie" qui sait comment parler à la base.

**`AsyncSessionLocal`**
Une usine à sessions : chaque requête HTTP crée sa propre session de BDD indépendante via `get_db()`, puis la ferme proprement à la fin.

**`Base`**
La classe parente de tous les modèles. Tout modèle qui hérite de `Base` est automatiquement reconnu par SQLAlchemy et Alembic.

---

## `app/dependencies/db.py`

**`get_db()`**
Ouvre une session de base de données au début d'une requête et la ferme automatiquement à la fin, même en cas d'erreur — les routers l'utilisent via `Depends(get_db)`.

---

## `app/dependencies/auth.py` — Vérification des droits

**`get_current_user(credentials, db)`**
Extrait le token JWT du header `Authorization`, le décode, charge l'utilisateur depuis la BDD et vérifie qu'il est actif — retourne l'objet `User` ou lève une erreur 401 si quelque chose ne va pas.

**`require_admin(current_user)`**
Appelle `get_current_user` puis vérifie que `is_admin == True` — lève une erreur 403 si l'utilisateur n'est pas administrateur.

**`require_staff(current_user)`**
Appelle `get_current_user` puis vérifie que `type != "player"` — lève une erreur 403 si l'utilisateur est un joueur (pas du staff).

---

## `app/models/` — Tables de la base de données

Les modèles sont des classes Python où chaque attribut correspond à une colonne en base. SQLAlchemy les utilise pour créer et lire des données.

### `models/user.py` — Table `users`

Stocke tous les comptes de connexion (joueurs et staff). Un utilisateur de type `player` a un lien vers sa fiche joueur (`player_id`), un utilisateur de type `staff` a un lien vers sa fiche staff (`staff_id`).

| Colonne | Type | Description |
|---|---|---|
| `id` | int (PK) | Identifiant unique |
| `username` | str unique | Format `prenom.nom` — utilisé pour se connecter |
| `email` | str unique, optionnel | Email de contact |
| `hashed_password` | str | Mot de passe haché avec bcrypt (jamais stocké en clair) |
| `first_name`, `last_name` | str | Prénom et nom |
| `is_admin` | bool | Donne accès aux fonctions d'administration |
| `type` | `player` ou `staff` | Détermine les fonctionnalités accessibles |
| `player_id` | int, optionnel | Lien vers la fiche joueur |
| `staff_id` | int, optionnel | Lien vers la fiche staff |
| `must_change_password` | bool | Vrai à la création — force le changement au premier login |
| `is_active` | bool | Faux = compte désactivé (soft-delete : données conservées) |

### `models/player.py` — Table `players`

Fiche complète d'un joueur : infos personnelles, contrat, statut médical, et **toutes les stats dans la même table** (choix de simplicité : une ligne par joueur plutôt qu'une table de stats par match).

| Colonne | Description |
|---|---|
| `shirt_number` | Numéro de maillot |
| `position` | Poste complet (ex: "Défenseur Central") |
| `position_short` | Abréviation : `GK`, `DEF`, `MIL` ou `ATT` |
| `nationality`, `nationality_flag` | Nationalité + code ISO 2 lettres pour le drapeau |
| `status` | `Disponible`, `Blessé`, `Suspendu` ou `Incertain` |
| `injury_description`, `return_date_estimate` | Description et date de retour estimée si blessé |
| `contract_end_date` | Date de fin de contrat au format `YYYY-MM-DD` |
| `is_active` | Soft-delete |
| `matches`, `goals`, `assists` | Stats principales |
| `yellow_cards`, `red_cards`, `minutes_played` | Discipline et temps de jeu |
| `clean_sheets`, `goals_conceded` | Stats gardien (GK uniquement) |

### `models/staff.py` — Table `staff_members`

Fiche d'un membre du staff. Le champ `role` est l'un des 13 rôles définis : Coach Principal, Coach Adjoint, Préparateur Physique, Médecin, Kinésithérapeute, Manager, Modérateur, Scout, Analyste Vidéo, Intendant, Directeur Sportif, Psychologue, Dirigeant.
Le champ `is_admin` ici est synchronisé avec le `is_admin` du compte `User` associé.

### `models/club.py` — Tables `clubs` et `seasons`

**`Club`** — Il n'existe toujours qu'**un seul club** dans la base (id=1). Contient les infos du club : nom, année de fondation, ligue, coordonnées, logo.

**`Season`** — Une saison sportive. Plusieurs saisons peuvent exister mais **une seule a `is_active = True`** à la fois. Le champ `label` (ex: `"2025/2026"`) est calculé automatiquement depuis les dates de début et fin.

### `models/event.py` — Table `events`

Événements du calendrier. Le champ `event_date` est **indexé** pour accélérer les filtres par mois. Le champ `tag` (`Match`, `Entraînement`, `Récupération`, `Réunion`) détermine la couleur dans l'interface. La colonne `created_by` lie l'événement à l'utilisateur qui l'a créé.

### `models/message.py` — Tables `conversations`, `conversation_participants`, `messages`

**`Conversation`** — Un canal de discussion. Les champs `name`, `initials`, `avatar_bg`, `role_type` stockent les infos d'affichage (calculées à la création). `is_ai = True` pour la conversation avec Tactical AI.

**`ConversationParticipant`** — Qui est dans quelle conversation. Le champ `hidden = True` signifie que l'utilisateur a "quitté" la conversation — elle disparaît de sa liste mais les données restent en base.

**`Message`** — Un message dans une conversation. `sender_id` est `null` pour les messages de l'IA (il n'y a pas de compte utilisateur pour l'IA).

### `models/notification.py` — Table `notifications`

Une notification in-app par utilisateur. Le champ `kind` indique le type : `added` (nouvel événement), `rescheduled` (événement modifié), `cancelled` (événement supprimé), `message` (nouveau message). Le champ `event_id` peut devenir `null` si l'événement est supprimé (la notification garde quand même `event_date` pour l'affichage).

---

## `app/schemas/` — Formats de données (Pydantic)

Les schémas définissent ce que l'API **accepte** (en entrée) et **retourne** (en sortie). Convention : `XCreate` pour créer, `XUpdate` pour modifier (tous champs optionnels), `XRead` pour ce que retourne le GET.

### `schemas/auth.py`
- **`LoginRequest`** — `username` + `password` (ce qu'on envoie pour se connecter)
- **`UserResponse`** — Ce que retourne le login : id, username, prénom, nom, is_admin, type, must_change_password, player_id, staff_id
- **`TokenResponse`** — `access_token` + `token_type` + `user: UserResponse`
- **`ChangePasswordRequest`** — `current_password` (optionnel si changement forcé) + `new_password` (minimum 8 caractères)

### `schemas/player.py`
- **`PlayerCreate`** — Tous les champs pour créer un joueur (prénom, nom, numéro, poste, nationalité, statut obligatoires ; le reste optionnel)
- **`PlayerUpdate`** — Mêmes champs mais tous optionnels, plus les stats
- **`PlayerRead`** — Toutes les informations d'un joueur
- **`PlayerCreatedResponse`** — Comme `PlayerRead` + `username` + `temp_password` (retournés une seule fois à la création)

### `schemas/staff.py`
- **`StaffMemberCreate`** — Prénom, nom, rôle obligatoires ; email (validé par EmailStr), téléphone, date d'arrivée, notes, is_admin optionnels
- **`StaffMemberUpdate`** — Tous optionnels
- **`StaffMemberRead`** — Données du membre (sans mot de passe)
- **`StaffCreatedResponse`** — Comme `StaffMemberRead` + `username` + `temp_password`
- **`ResetPasswordResponse`** — `username` + `temp_password` après un reset

### `schemas/club.py`
- **`ClubRead`** — Toutes les infos du club incluant `logo_url`
- **`ClubUpdate`** — Tous les champs optionnels (nom, ligue, email, téléphone, adresse, ville)

### `schemas/season.py`
- **`SeasonCreate`** — `start_date`, `end_date`, `competitions`, `objective`, `status`
- **`SeasonUpdate`** — Tous optionnels
- **`SeasonRead`** — Inclut `id`, `label` (calculé automatiquement), `is_active`

### `schemas/event.py`
- **`EventCreate`** — `title`, `tag`, `event_date`, `event_time` obligatoires ; `location`, `notes` optionnels
- **`EventUpdate`** — Tous optionnels
- **`EventRead`** — Toutes les infos (sans `created_by`)

### `schemas/message.py`
- **`MessageRead`** — Message enrichi : contenu + infos de l'expéditeur (initiales, nom, couleur de rôle)
- **`MessageCreate`** — Juste `text`
- **`ConversationRead`** — Conversation avec `preview` (extrait du dernier message), `time` (quand), membres pour les groupes
- **`ParticipantRead`** — Un participant avec ses initiales, couleur et type de rôle
- **`UserCard`** — Carte utilisateur pour choisir un destinataire (nom, type, rôle)
- **`UsersGrouped`** — Tous les utilisateurs classés : `coaches`, `staff`, `players`
- **`ConversationCreate`** — `participant_ids` + `is_group` + `group_name` (optionnel)

### `schemas/notification.py`
- **`NotificationRead`** — id, kind, title, tag, event_id, event_date, created_at

### `schemas/dashboard.py`
- **`KPIsRead`** — 4 compteurs : total joueurs, joueurs disponibles, événements à venir, messages non lus
- **`AdminSummaryRead`** — Regroupe `club` + `season` + `staff` en une seule réponse

### `schemas/ai.py`
- **`AIChatRequest`** — `text` (le message envoyé au chatbot)
- **`AIChatResponse`** — `conversation_id` + `user_message: MessageRead` + `ai_message: MessageRead`

---

## `app/services/auth_service.py` — Sécurité et identifiants

**`hash_password(password)`** → `str`
Transforme un mot de passe lisible en empreinte bcrypt illisible — le seul format stocké en base de données.

**`verify_password(plain, hashed)`** → `bool`
Vérifie si un mot de passe en clair correspond à son empreinte bcrypt — utilisé à la connexion et au changement de mot de passe.

**`create_access_token(user_id)`** → `str`
Crée un JWT contenant l'`user_id` et une date d'expiration (maintenant + 24h), signé avec `SECRET_KEY` (impossible à falsifier sans la clé).

**`decode_token(token)`** → `int` (user_id)
Décode un JWT, vérifie sa signature ET sa date d'expiration — lève `JWTError` si le token est altéré ou expiré.

**`generate_temp_password()`** → `str`
Génère un mot de passe temporaire de 10 caractères (lettres + chiffres) avec `secrets.choice` (cryptographiquement sûr, pas `random.choice`).

**`_slugify(s)`** → `str` *(privée)*
Retire les accents, passe en minuscules, supprime tout ce qui n'est pas `a-z` ou `0-9` — ex: `"Élodie"` → `"elodie"`.

**`make_username_base(first_name, last_name)`** → `str`
Combine deux slugs pour former l'identifiant de base — ex: `make_username_base("Thomas", "Laurent")` → `"thomas.laurent"`.

---

## `app/services/ai_service.py` — Chatbot Tactical AI

Voir le fichier `AI.md` pour le détail complet de ce service.

**`build_context(db)`** → `str`
Interroge la BDD en temps réel (club, saison active, joueurs actifs avec stats, staff actif, prochain événement) et retourne le system prompt complet avec toutes ces données injectées.

**`_call_groq(messages)`** → `str` *(privée)*
Envoie la conversation au modèle `llama-3.3-70b-versatile` via l'API Groq et retourne la réponse texte.

**`_call_ollama(messages)`** → `str` *(privée)*
Envoie la conversation au modèle local `llama3.2:3b` via l'API HTTP d'Ollama et retourne la réponse texte.

**`chat_with_ai(user_text, history, db)`** → `str`
Orchestre l'appel IA : construit le contexte, essaie Groq en premier, bascule sur Ollama si Groq échoue, lève une `RuntimeError` si les deux sont indisponibles.

---

## `app/routers/` — Endpoints de l'API

Préfixe global : `/api/v1`. Toutes les routes ci-dessous s'y ajoutent.

---

### `routers/auth.py` — Authentification (`/auth`)

**`POST /auth/login`** *(public)*
Vérifie `username` + `password`, retourne un JWT et les infos utilisateur si les identifiants sont corrects — retourne une erreur 401 si incorrects ou compte désactivé.

**`GET /auth/me`** *(connecté)*
Retourne les informations de l'utilisateur associé au token JWT — utilisé par `AuthContext` au chargement de l'app.

**`POST /auth/change-password`** *(connecté)*
Change le mot de passe : vérifie l'ancien si changement volontaire (l'ancien n'est pas requis si `must_change_password = True`), vérifie la longueur minimale (8 caractères), met à jour le hash et remet `must_change_password = False`.

---

### `routers/players.py` — Joueurs (`/players`)

**`_unique_username(base, db)`** *(interne)*
Vérifie si un identifiant est disponible et incrémente un suffixe numérique jusqu'à trouver un identifiant libre — ex: `thomas.laurent` pris → essaie `thomas.laurent2`, etc.

**`GET /players`** *(connecté)*
Retourne la liste des joueurs actifs avec filtres optionnels : `?position=DEF`, `?status=Blessé`, `?search=Laurent` (recherche en Python sur nom et poste).

**`POST /players`** *(admin)*
Crée la fiche joueur + le compte utilisateur associé en une seule opération, génère un identifiant unique et un mot de passe temporaire, retourne les credentials une seule fois.

**`POST /players/{player_id}/reset-password`** *(admin)*
Génère un nouveau mot de passe temporaire pour un joueur et remet `must_change_password = True`.

**`PATCH /players/{player_id}`** *(admin)*
Modifie uniquement les champs envoyés dans la requête (les autres gardent leur valeur), inclut les stats.

**`DELETE /players/{player_id}`** *(admin)*
Soft-delete : met `is_active = False` sur la fiche joueur ET sur le compte utilisateur associé — les données restent en base.

---

### `routers/staff.py` — Staff (`/staff`)

**`GET /staff`** *(connecté)*
Retourne la liste des membres du staff actifs avec filtres optionnels : `?search=`, `?role=`.

**`POST /staff`** *(admin)*
Vérifie l'unicité de l'email si fourni, puis crée la fiche staff + le compte utilisateur en synchronisant le champ `is_admin` entre les deux tables.

**`PATCH /staff/{staff_id}`** *(admin)*
Modifie la fiche staff et synchronise le compte `User` associé si `is_admin`, `first_name` ou `last_name` changent.

**`DELETE /staff/{staff_id}`** *(admin)*
Soft-delete identique aux joueurs.

---

### `routers/club.py` — Club (`/club`)

**`_get_or_create_club(db)`** *(interne)*
Cherche le club avec `id = 1` et le crée avec des valeurs vides s'il n'existe pas encore — évite de vérifier l'existence à chaque opération.

**`GET /club`** *(connecté)*
Retourne les informations du club (id=1).

**`PATCH /club`** *(admin)*
Modifie les informations du club, seuls les champs envoyés sont mis à jour.

---

### `routers/seasons.py` — Saisons (`/seasons`)

**`_make_label(start, end)`** *(interne)*
Extrait les années des dates pour créer le label — ex: `("2025-08-01", "2026-05-31")` → `"2025/2026"`.

**`GET /seasons`** *(connecté)*
Retourne toutes les saisons de la plus récente à la plus ancienne.

**`GET /seasons/active`** *(connecté)*
Retourne la saison avec `is_active = True` ou une erreur 404 si aucune saison n'est active.

**`POST /seasons`** *(admin)*
Crée une saison avec son label calculé automatiquement et crée le club id=1 s'il n'existe pas encore.

**`PATCH /seasons/{season_id}`** *(admin)*
Modifie la saison et recalcule le label si les dates changent.

**`PATCH /seasons/{season_id}/activate`** *(admin)*
Met `is_active = False` sur toutes les saisons puis `is_active = True` sur la saison ciblée — garantit l'unicité de la saison active.

**`DELETE /seasons/{season_id}`** *(admin)*
Suppression définitive (hard delete, pas de soft-delete pour les saisons).

---

### `routers/events.py` — Événements (`/events`)

**`GET /events`** *(connecté)*
Retourne tous les événements, ou seulement ceux d'un mois spécifique avec `?year=2026&month=6` (filtre via `LIKE "2026-06%"` sur `event_date`).

**`GET /events/upcoming`** *(connecté)*
Retourne les 5 prochains événements à partir d'aujourd'hui, triés par date et heure.

**`GET /events/{event_id}`** *(connecté)*
Retourne le détail d'un événement.

**`POST /events`** *(admin)*
Crée l'événement et génère automatiquement une notification `kind="added"` pour chaque utilisateur actif en base.

**`PATCH /events/{event_id}`** *(admin)*
Modifie l'événement et, si la date ou l'heure change, crée une notification `kind="rescheduled"` pour tous les utilisateurs actifs.

**`DELETE /events/{event_id}`** *(admin)*
Crée une notification `kind="cancelled"` pour tous (avec `event_id=null` car l'événement va disparaître, mais en gardant `event_date`), puis supprime définitivement l'événement.

---

### `routers/messages.py` — Messagerie (`/messages`)

**`_role_type(user)`** *(interne)*
Retourne le type visuel d'un utilisateur : `"player"` si joueur, `"coach"` si admin, `"staff"` sinon.

**`_role_type_with_sm(user, sm)`** *(interne)*
Comme `_role_type` mais affine le résultat avec la fiche staff — retourne `"coach"` si le rôle staff contient "coach" même sans `is_admin`.

**`_fmt_time(dt)`** *(interne)*
Formate une date/heure pour l'affichage : aujourd'hui → `"14:32"`, hier → `"Hier"`, avant → `"09/06"`.

**`GET /messages/users`** *(connecté)*
Retourne tous les utilisateurs actifs sauf soi-même, classés en trois groupes : `coaches`, `staff`, `players`.

**`GET /messages/conversations`** *(connecté)*
Retourne les conversations visibles de l'utilisateur triées par activité — recalcule en temps réel les infos de l'autre participant pour les 1:1 (nom, initiales, rôle depuis son vrai profil).

**`POST /messages/conversations`** *(connecté)*
Crée une conversation 1:1 ou groupe : vérifie si une conv entre ces personnes existe déjà, la réaffiche si elle était cachée, sinon crée avec les participants.

**`POST /messages/conversations/{conv_id}/leave`** *(connecté)*
Met `hidden = True` sur la participation de l'utilisateur — la conversation disparaît de sa liste sans être supprimée.

**`DELETE /messages/conversations/{conv_id}`** *(connecté)*
Supprime définitivement une conversation uniquement si elle ne contient aucun message.

**`GET /messages/conversations/{conv_id}/messages`** *(connecté)*
Retourne tous les messages d'une conversation dans l'ordre chronologique, enrichis des infos de l'expéditeur.

**`POST /messages/conversations/{conv_id}/messages`** *(connecté)*
Envoie un message, puis crée une notification `kind="message"` pour chaque autre participant non-caché (title tronqué à 80 caractères, tag = role_type de l'expéditeur).

---

### `routers/notifications.py` — Notifications (`/notifications`)

**`GET /notifications`** *(connecté)*
Retourne toutes les notifications de l'utilisateur courant, de la plus récente à la plus ancienne.

**`DELETE /notifications/{notif_id}`** *(connecté)*
Supprime une notification après avoir vérifié qu'elle appartient bien à l'utilisateur qui fait la requête.

---

### `routers/dashboard.py` — Tableau de bord (`/dashboard`)

**`GET /dashboard/kpis`** *(connecté)*
Retourne 4 compteurs : total joueurs actifs, joueurs disponibles, événements à venir, messages non lus (fixé à 0 pour l'instant).

**`GET /dashboard/upcoming-events`** *(connecté)*
Retourne les 5 prochains événements à partir d'aujourd'hui.

**`GET /dashboard/unavailable-players`** *(connecté)*
Retourne tous les joueurs actifs dont le statut n'est pas "Disponible".

**`GET /dashboard/admin-summary`** *(admin)*
Retourne en un seul appel les infos du club + la saison active + la liste complète du staff.

---

### `routers/ai.py` — Tactical AI (`/ai`)

**`_get_or_create_ai_conv(user, db)`** *(interne)*
Cherche la conversation IA de l'utilisateur (une par utilisateur, `is_ai=True`) et la crée si elle n'existe pas encore.

**`POST /ai/chat`** *(connecté)*
Stocke le message de l'utilisateur en base → récupère les 40 derniers messages comme historique → appelle `chat_with_ai()` → stocke la réponse (sender_id=null) → retourne les deux messages.

**`GET /ai/conversation`** *(connecté)*
Retourne tous les messages de la conversation IA de l'utilisateur.

**`DELETE /ai/conversation`** *(connecté)*
Supprime tous les messages de la conversation IA de l'utilisateur (garde la conversation elle-même).

---

## `alembic/` — Migrations de base de données

**`alembic/env.py`**
Configure Alembic : ajoute `backend/` au chemin Python pour pouvoir importer les modèles, définit les modes offline (génère du SQL sans connexion) et online (modifie la BDD directement). Les migrations online utilisent un runner async pour être compatibles avec aiosqlite.

**`alembic/versions/*.py`**
Chaque fichier contient `upgrade()` (appliquer le changement) et `downgrade()` (l'annuler). Alembic les exécute dans l'ordre chronologique via `alembic upgrade head`.

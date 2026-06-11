# Teampilot AI — Documentation complète du projet

> Dernière mise à jour : 2026-06-12

---

## Avant de commencer — comprendre les grands concepts

Avant de détailler chaque fichier, voici une explication simple des technologies utilisées. Tu peux revenir à cette section si tu rencontres un terme que tu ne comprends pas.

### C'est quoi un "backend" et un "frontend" ?

Imagine une application comme un restaurant :
- Le **frontend** c'est la **salle** : ce que le client voit, avec qui il interagit. Ici c'est Next.js (React) — les pages que tu vois dans ton navigateur.
- Le **backend** c'est la **cuisine** : ce que le client ne voit pas, mais qui fait tout le travail. Ici c'est FastAPI (Python) — il gère la base de données, vérifie les droits, renvoie les données.

Le frontend parle au backend via des **URLs** (appelées endpoints ou API). Par exemple : `GET /api/v1/players` → "donne-moi la liste des joueurs".

### C'est quoi une "base de données" ?

C'est un fichier structuré qui stocke toutes les données de façon permanente. Ici c'est **SQLite** — un simple fichier `teampilot.db` sur le disque. C'est comme un classeur Excel avec plusieurs feuilles (tables), une par type de donnée : une pour les joueurs, une pour les événements, etc.

### C'est quoi SQLAlchemy ?

C'est un outil Python qui permet de parler à la base de données **sans écrire du SQL brut**. On définit des "modèles" (des classes Python) qui correspondent à des tables. SQLAlchemy s'occupe de traduire les opérations Python en requêtes SQL.

### C'est quoi Pydantic ?

C'est un outil de **validation de données**. Quand le frontend envoie des données (ex: créer un joueur), Pydantic vérifie que tous les champs requis sont là, que les types sont corrects, etc. Si quelque chose ne va pas, il retourne une erreur claire au lieu de planter silencieusement.

### C'est quoi un JWT (token) ?

C'est une **carte d'identité numérique** temporaire. Quand tu te connectes, le backend te donne un JWT (une longue chaîne de caractères). À chaque requête suivante, tu présentes ce JWT pour prouver qui tu es. Il a une durée de vie (ici 24h) et est signé cryptographiquement (impossible à falsifier).

### C'est quoi un cookie httpOnly ?

C'est un endroit sécurisé dans le navigateur pour stocker le JWT. La particularité "httpOnly" : JavaScript ne peut pas le lire — seul le navigateur l'envoie automatiquement. Ça empêche un script malveillant (XSS) de voler ton token.

### C'est quoi un Context React ?

C'est un mécanisme pour **partager des données entre composants** sans avoir à les passer manuellement de parent en enfant. Par exemple, `AuthContext` contient l'utilisateur connecté — n'importe quel composant de l'app peut y accéder sans qu'on le "passe en props" à chaque niveau.

### C'est quoi un Hook React ?

C'est une fonction réutilisable qui encapsule de la logique React. Le nom commence toujours par `use`. Par exemple `useDashboard()` est un hook qui charge toutes les données du tableau de bord — au lieu de réécrire ce code dans DashboardDesktop ET DashboardMobile, on l'écrit une seule fois dans le hook.

### C'est quoi une migration Alembic ?

Quand on veut modifier la structure de la base de données (ajouter une colonne, créer une table), on ne peut pas juste modifier le fichier — les données existantes seraient perdues. Alembic gère ça proprement : chaque changement est une "migration", un script qui décrit quoi ajouter/modifier. Les migrations s'appliquent dans l'ordre et peuvent être annulées.

### C'est quoi async/await ?

C'est une façon d'écrire du code qui peut "attendre" sans bloquer. Par exemple, pendant qu'on attend une réponse de la base de données, le serveur peut traiter d'autres requêtes au lieu de rester bloqué à ne rien faire. Tout ce qui commence par `async def` ou `async function` fonctionne ainsi.

---

## Table des matières

1. [Vue d'ensemble de l'application](#1-vue-densemble-de-lapplication)
2. [Comment les deux parties communiquent](#2-comment-les-deux-parties-communiquent)
3. [Connexion et sécurité](#3-connexion-et-sécurité)
4. [Arborescence des fichiers](#4-arborescence-des-fichiers)
5. [BACKEND — Tous les fichiers expliqués](#5-backend--tous-les-fichiers-expliqués)
   - [Configuration & démarrage](#51-configuration--démarrage)
   - [Base de données & migrations](#52-base-de-données--migrations)
   - [Vérification des droits](#53-vérification-des-droits)
   - [Les tables de la base de données (Modèles)](#54-les-tables-de-la-base-de-données-modèles)
   - [Validation des données (Schémas)](#55-validation-des-données-schémas)
   - [Fonctions utilitaires (Services)](#56-fonctions-utilitaires-services)
   - [Les URLs de l'API (Routers)](#57-les-urls-de-lapi-routers)
6. [FRONTEND — Tous les fichiers expliqués](#6-frontend--tous-les-fichiers-expliqués)
   - [Le pont entre Next.js et FastAPI](#61-le-pont-entre-nextjs-et-fastapi)
   - [La protection des pages](#62-la-protection-des-pages)
   - [Les données partagées (Contexts)](#63-les-données-partagées-contexts)
   - [Les fonctions réutilisables (Hooks)](#64-les-fonctions-réutilisables-hooks)
   - [Les utilitaires partagés (lib/)](#65-les-utilitaires-partagés-lib)
   - [La mise en page (Layout)](#66-la-mise-en-page-layout)
   - [Les pages de l'application](#67-les-pages-de-lapplication)
7. [Structure complète de la base de données](#7-structure-complète-de-la-base-de-données)
8. [Mécanismes importants à comprendre](#8-mécanismes-importants-à-comprendre)

---

## 1. Vue d'ensemble de l'application

Teampilot AI est une application web de gestion d'équipe de football. Elle propose :

| Fonctionnalité | Ce que ça permet |
|---|---|
| **Tableau de bord** | Vue rapide : prochains événements, joueurs indisponibles, messagerie récente. Le contenu varie selon le rôle (joueur vs admin) |
| **Joueurs** | Créer, modifier, supprimer des fiches joueurs avec stats, contrat, statut médical |
| **Calendrier** | Planifier des événements (Match, Entraînement, Récupération, Réunion) avec notifications automatiques |
| **Messagerie** | Envoyer des messages à un joueur, un membre du staff, ou créer des groupes |
| **Administration** | Gérer le club, la saison, les membres du staff (admin uniquement) |
| **Notifications** | Alertes automatiques : nouvel événement, événement modifié/annulé, message reçu |

**Les trois types d'utilisateurs :**
- **Joueur** — voit son profil, le calendrier, la messagerie, ses coéquipiers
- **Staff** — comme le joueur mais sans accès à l'administration
- **Admin** (staff avec `is_admin=true`) — accès complet, peut créer/supprimer des comptes

---

## 2. Comment les deux parties communiquent

```
TON NAVIGATEUR
      │
      │  Tu visites /joueurs
      ▼
NEXT.JS (frontend) — port 3000
      │
      │  Le composant JoueursDesktop appelle :
      │  fetch('/api/backend/players')
      ▼
ROUTE PROXY NEXT.JS — app/api/backend/[...path]/route.ts
      │
      │  Lit le cookie token, ajoute "Authorization: Bearer <token>"
      │  Redirige vers : http://localhost:8000/api/v1/players
      ▼
FASTAPI (backend) — port 8000
      │
      │  Vérifie le token JWT
      │  Interroge la base de données SQLite
      │  Retourne la liste des joueurs en JSON
      ▼
NEXT.JS reçoit la réponse → composant affiche les données
```

**Pourquoi ce proxy ?** Le cookie JWT est `httpOnly` — JavaScript côté navigateur ne peut pas le lire directement. Le proxy Next.js (qui tourne côté serveur) peut lire le cookie et l'ajouter en header pour FastAPI. C'est plus sécurisé qu'un token exposé en JavaScript.

---

## 3. Connexion et sécurité

### Étape par étape

**1. Connexion (`/login`)**
- Tu entres ton identifiant (`prenom.nom`) et ton mot de passe
- Next.js envoie ça à `/api/auth/login` (sa propre route)
- Cette route relaie au backend FastAPI `/api/v1/auth/login`
- FastAPI vérifie le mot de passe (avec bcrypt — un algorithme de hachage sécurisé)
- Si correct : FastAPI retourne un JWT
- Next.js pose le JWT dans un **cookie sécurisé** (`httpOnly`, 24h)

**2. Navigation**
- À chaque visite d'une page, le middleware `proxy.ts` vérifie si le cookie existe
- Si non → redirige vers `/login`
- Si oui → laisse passer

**3. Requêtes API**
- Le composant React appelle `/api/backend/players`
- La route proxy lit le cookie, ajoute le token en header, renvoie à FastAPI
- FastAPI vérifie le token et retourne les données

**4. Déconnexion**
- Appel à `/api/auth/logout` → cookie supprimé
- À la prochaine navigation, le middleware redirige vers `/login`

**Les niveaux d'accès :**
- `get_current_user` → n'importe qui de connecté
- `require_staff` → staff uniquement (bloque les joueurs)
- `require_admin` → admins uniquement (`is_admin = true`)

---

## 4. Arborescence des fichiers

```
teampilot/
│
├── backend/                    ← Tout le code Python (serveur)
│   ├── app/
│   │   ├── main.py             ← Lance le serveur, branche tous les routers
│   │   ├── config.py           ← Variables de configuration (clé secrète, BDD, etc.)
│   │   ├── database.py         ← Connexion à SQLite
│   │   │
│   │   ├── dependencies/       ← "Middlewares" : vérifient qui fait la requête
│   │   │   ├── auth.py         ← Vérifie le JWT, vérifie les droits admin/staff
│   │   │   └── db.py           ← Ouvre une connexion BDD pour chaque requête
│   │   │
│   │   ├── models/             ← Description des tables de la BDD
│   │   │   ├── user.py         ← Table users (comptes de connexion)
│   │   │   ├── player.py       ← Table players (fiches joueurs)
│   │   │   ├── staff.py        ← Table staff_members
│   │   │   ├── club.py         ← Tables clubs + seasons
│   │   │   ├── event.py        ← Table events (calendrier)
│   │   │   ├── message.py      ← Tables conversations + participants + messages
│   │   │   └── notification.py ← Table notifications
│   │   │
│   │   ├── schemas/            ← Formulaires de validation des données entrantes/sortantes
│   │   │   ├── auth.py         ← Login, token, changement de mot de passe
│   │   │   ├── player.py       ← Créer/modifier/lire un joueur
│   │   │   ├── staff.py        ← Créer/modifier/lire un membre du staff
│   │   │   ├── club.py         ← Lire/modifier le club
│   │   │   ├── season.py       ← Créer/modifier/lire une saison
│   │   │   ├── event.py        ← Créer/modifier/lire un événement
│   │   │   ├── message.py      ← Conversations, messages, participants
│   │   │   ├── notification.py ← Lire une notification
│   │   │   └── dashboard.py    ← KPIs et résumé admin
│   │   │
│   │   ├── routers/            ← Les URLs disponibles dans l'API (les "pages" du backend)
│   │   │   ├── auth.py         ← /login, /me, /change-password
│   │   │   ├── players.py      ← CRUD joueurs + reset mot de passe
│   │   │   ├── staff.py        ← CRUD staff + reset mot de passe
│   │   │   ├── club.py         ← Lire/modifier le club
│   │   │   ├── seasons.py      ← CRUD saisons + activation
│   │   │   ├── events.py       ← CRUD événements + notifications auto
│   │   │   ├── messages.py     ← Conversations, messages, envoi
│   │   │   ├── notifications.py← Lire/supprimer les notifications
│   │   │   └── dashboard.py    ← KPIs, événements à venir, résumé admin
│   │   │
│   │   └── services/
│   │       └── auth_service.py ← Hachage mots de passe, JWT, génération identifiants
│   │
│   └── alembic/
│       ├── env.py              ← Config du système de migrations
│       └── versions/           ← Historique des modifications de la BDD (11 scripts)
│
│
├── app/                        ← Tout le code Next.js (navigateur)
│   ├── (auth)/
│   │   └── login/page.tsx      ← Page de connexion (accessible sans être connecté)
│   │
│   ├── (app)/                  ← Pages protégées (nécessitent d'être connecté)
│   │   ├── layout.tsx          ← Structure commune : sidebar + header + bottom nav
│   │   ├── dashboard/          ← Tableau de bord
│   │   ├── joueurs/            ← Gestion des joueurs
│   │   ├── calendrier/         ← Calendrier des événements
│   │   ├── messagerie/         ← Messagerie
│   │   ├── administration/     ← Panel admin (club, saison, staff)
│   │   └── change-password/    ← Changement de mot de passe
│   │
│   └── api/                    ← Routes "serveur" de Next.js (pas visibles dans le navigateur)
│       ├── auth/login/         ← Reçoit le login, pose le cookie JWT
│       ├── auth/me/            ← Vérifie si la session est valide
│       ├── auth/logout/        ← Supprime le cookie
│       ├── backend/[...path]/  ← Proxy : redirige tout vers FastAPI
│       └── nationalities/      ← Liste des nationalités avec drapeaux (avec cache)
│
├── contexts/
│   ├── AuthContext.tsx         ← Partage l'utilisateur connecté dans toute l'app
│   └── LanguageContext.tsx     ← Partage la langue (fr/en) + traductions
│
├── hooks/
│   ├── useCurrentUser.ts       ← Raccourci : est-ce que je suis admin ?
│   ├── useDashboard.ts         ← Charge toutes les données du tableau de bord
│   └── useNotifications.ts     ← Charge et gère les notifications
│
├── lib/
│   ├── playerUtils.ts          ← Types, constantes, fonctions partagés pour les joueurs
│   └── dashboardUtils.ts       ← Types, constantes, fonctions partagés pour le dashboard
│
├── components/
│   ├── layout/
│   │   ├── Sidebar.tsx         ← Menu de navigation (desktop, côté gauche)
│   │   ├── Header.tsx          ← Barre du haut (desktop, avec notifications)
│   │   ├── MobileHeader.tsx    ← Barre du haut (mobile, avec notifications)
│   │   └── BottomNav.tsx       ← Menu de navigation (mobile, barre du bas)
│   └── NationalitySelect.tsx   ← Composant select nationalité avec drapeaux
│
├── proxy.ts                    ← Protège les pages : redirige vers /login si pas connecté
└── locales/translations.ts     ← Tous les textes en français et anglais
```

---

## 5. BACKEND — Tous les fichiers expliqués

### 5.1 Configuration & démarrage

---

#### `backend/app/main.py` — Le point d'entrée du serveur

**À quoi ça sert ?**
C'est le premier fichier que Python exécute pour lancer le serveur. Il crée l'application FastAPI et lui branche tous les "routers" (les groupes d'URLs).

**Ce qu'il fait :**
- Crée l'application FastAPI avec un nom et une version
- Configure le **CORS** — c'est une règle de sécurité qui dit "seul `http://localhost:3000` (le frontend) a le droit de me parler"
- Branche tous les routers sous le préfixe `/api/v1` : cela signifie que toutes les URLs du backend commencent par `/api/v1/...`

**Les routers branchés :** auth, club, seasons, staff, players, events, dashboard, messages, notifications.

---

#### `backend/app/config.py` — La configuration

**À quoi ça sert ?**
Centralise toutes les valeurs configurables. Au lieu d'écrire des valeurs en dur dans le code, on les lit depuis un fichier `.env`. Ça facilite le changement entre développement et production.

**Les paramètres importants :**

| Paramètre | Valeur par défaut | Ce que ça fait |
|---|---|---|
| `DATABASE_URL` | `sqlite+aiosqlite:///./teampilot.db` | Chemin vers la base de données SQLite |
| `SECRET_KEY` | `"changeme"` | Clé secrète pour signer les JWT — **doit être changée en production** |
| `ALGORITHM` | `HS256` | Algorithme de signature des JWT (HMAC-SHA256) |
| `ACCESS_TOKEN_EXPIRE_HOURS` | `24` | Durée de vie du token de connexion (24 heures) |
| `UPLOAD_DIR` | `./uploads` | Où stocker les fichiers uploadés |
| `MAX_UPLOAD_SIZE_MB` | `5` | Taille maximale d'un upload (5 mégaoctets) |

> **Comment ça fonctionne ?** Pydantic Settings lit automatiquement le fichier `.env` dans le dossier backend. Si une variable est dans `.env`, elle remplace la valeur par défaut. Si elle n'y est pas, la valeur par défaut s'applique.

---

#### `backend/app/database.py` — La connexion à la base de données

**À quoi ça sert ?**
Crée et configure la connexion à SQLite. Ce fichier est importé partout où on a besoin de parler à la base de données.

**Ce qu'il contient :**
- `engine` — le moteur de connexion SQLite. `echo=False` signifie "ne pas afficher les requêtes SQL dans la console" (utile à activer pour déboguer)
- `AsyncSessionLocal` — une "usine à sessions". Chaque requête HTTP crée sa propre session de base de données (connexion isolée), la ferme proprement à la fin
- `Base` — la classe parente de tous les modèles. Tout modèle qui hérite de `Base` sera automatiquement lié à la base de données

---

### 5.2 Base de données & migrations

**Pourquoi des migrations ?**
Si on veut ajouter la colonne `username` à la table `users`, on ne peut pas juste modifier le fichier Python — la base de données existante n'a pas cette colonne. Alembic génère des scripts SQL qui ajoutent la colonne sans perdre les données existantes.

#### `backend/alembic/env.py` — Configuration des migrations

**À quoi ça sert ?**
Configure comment Alembic connaît les tables existantes et comment se connecter à la base de données.

- Ajoute `backend/` au chemin Python pour pouvoir importer `app`
- Importe tous les modèles (obligatoire pour qu'Alembic les "voie")
- Définit deux modes : **offline** (génère du SQL sans connexion) et **online** (modifie la BDD directement)

#### Les migrations — historique des changements

Les fichiers dans `backend/alembic/versions/` sont exécutés dans l'ordre par Alembic. Chaque fichier a une fonction `upgrade()` (appliquer) et `downgrade()` (annuler).

| Fichier | Ce qui a été ajouté |
|---|---|
| `066b31e8af6b` — init users | Création de la table `users` : comptes de connexion (email, mot de passe, prénom, nom, type joueur/staff) |
| `b708c92ff456` — add club/season/staff | Tables `clubs` (infos du club), `seasons` (saisons sportives), `staff_members` (membres du staff) |
| `39f5ba0ea579` — add players/events | Tables `players` (fiches joueurs avec stats) et `events` (calendrier) |
| `c4d5e6f7a8b9` — add messages | Tables `conversations`, `conversation_participants` (qui participe à quelle conv), `messages` |
| `d1e2f3a4b5c6` — add hidden | Ajout de la colonne `hidden` sur les participants : permet de "quitter" une conversation sans la supprimer |
| `e2f3a4b5c6d7` — add notifications | Table `notifications` : alertes in-app pour chaque utilisateur |
| `f3g4h5i6j7k8` — notif kind string | Le type de notification (`added`, `message`, etc.) passe de Enum à texte libre, plus flexible |
| `g4h5i6j7k8l9` — notif add tag | Ajout d'un `tag` sur les notifications (type d'événement ou rôle expéditeur, pour la couleur du point) |
| `h5i6j7k8l9m0` — add username | Ajout du champ `username` (identifiant de connexion `prenom.nom`) sur les users |
| `i6j7k8l9m0n1` — staff email nullable | L'email du staff devient optionnel (il était obligatoire avant) |

---

### 5.3 Vérification des droits

Ces fichiers contiennent les **garde-fous** de l'API. Chaque endpoint peut déclarer "pour utiliser cette URL, il faut être X" en ajoutant `Depends(get_current_user)` ou `Depends(require_admin)`.

> **Comment fonctionne `Depends()` ?** C'est le système d'injection de dépendances de FastAPI. Quand une route déclare `Depends(get_current_user)`, FastAPI appelle automatiquement `get_current_user()` avant d'exécuter la route, et lui passe le résultat. Si `get_current_user` lève une erreur (token invalide), la route ne s'exécute pas du tout.

---

#### `backend/app/dependencies/db.py` — Ouvrir une session base de données

**`get_db()`**

Crée une connexion à la base de données pour la durée d'une requête HTTP, puis la ferme automatiquement. C'est cette fonction qu'on voit dans chaque router sous la forme `db: AsyncSession = Depends(get_db)`.

- Utilise `async with` : même en cas d'erreur dans la route, la session sera toujours fermée proprement
- Une session par requête = isolation : deux utilisateurs simultanés n'interfèrent pas

---

#### `backend/app/dependencies/auth.py` — Vérifier qui fait la requête

**`get_current_user(credentials, db)`**

Vérifie qu'une requête vient d'un utilisateur connecté valide.

1. Extrait le token JWT du header `Authorization: Bearer <token>`
2. Décode le JWT et lit l'`user_id` dedans
3. Charge l'utilisateur depuis la base de données
4. Vérifie qu'il est actif (`is_active = True`)
5. Retourne l'objet `User` — la route peut ensuite s'en servir

Si une étape échoue → **erreur 401** (Non autorisé) renvoyée au client.

**`require_admin(current_user)`**

Appelle `get_current_user` d'abord, puis vérifie `is_admin == True`. Si non → **erreur 403** (Accès refusé). Utilisé pour toutes les opérations sensibles : créer/supprimer des comptes, modifier le club, etc.

**`require_staff(current_user)`**

Appelle `get_current_user` d'abord, puis vérifie que `type != "player"`. Les joueurs ne peuvent pas utiliser les endpoints réservés au staff. Si joueur → **erreur 403**.

---

### 5.4 Les tables de la base de données (Modèles)

Les modèles SQLAlchemy sont des **classes Python qui représentent les tables de la base de données**. Chaque attribut de la classe correspond à une colonne dans la table.

---

#### `models/user.py` — Table `users`

**À quoi ça sert ?** Stocke tous les comptes de connexion, que ce soit un joueur ou un membre du staff. Un joueur a un compte user ET une fiche player. Un membre du staff a un compte user ET une fiche staff_member.

| Colonne | Type | Description |
|---|---|---|
| `id` | Nombre entier (clé primaire) | Identifiant unique généré automatiquement |
| `username` | Texte unique | Format `prenom.nom` — utilisé pour se connecter (ex: `thomas.laurent`) |
| `email` | Texte unique, optionnel | Email de contact (peut être vide) |
| `hashed_password` | Texte | Mot de passe hashé avec bcrypt — le mot de passe en clair n'est jamais stocké |
| `first_name`, `last_name` | Texte | Prénom et nom |
| `is_admin` | Vrai/Faux | Si vrai, accès à l'administration |
| `type` | `player` ou `staff` | Détermine les fonctionnalités accessibles |
| `player_id` | Nombre, optionnel | Lien vers la fiche joueur (si `type = player`) |
| `staff_id` | Nombre, optionnel | Lien vers la fiche staff (si `type = staff`) |
| `must_change_password` | Vrai/Faux | Vrai pour les nouveaux comptes (mot de passe temporaire) — l'app redirige vers /change-password |
| `is_active` | Vrai/Faux | Faux = compte "supprimé" (les données restent en base, le compte ne fonctionne plus) |

---

#### `models/player.py` — Table `players`

**À quoi ça sert ?** La fiche complète d'un joueur : informations personnelles, stats, contrat, statut médical.

| Colonne | Type | Description |
|---|---|---|
| `first_name`, `last_name` | Texte | |
| `shirt_number` | Nombre | Numéro de maillot |
| `position` | Texte | Poste complet (ex: "Défenseur Central") |
| `position_short` | Texte | Abréviation : `GK`, `DEF`, `MIL` ou `ATT` |
| `nationality` | Texte | Nationalité (ex: "Français") |
| `nationality_flag` | Texte, optionnel | Code ISO 2 lettres pour le drapeau (ex: `fr`) |
| `date_of_birth` | Texte, optionnel | Format `YYYY-MM-DD` |
| `height_cm`, `weight_kg` | Nombre, optionnel | Taille et poids |
| `preferred_foot` | Texte, optionnel | `Droit`, `Gauche` ou `Les deux` |
| `photo_url` | Texte, optionnel | URL de la photo de profil |
| `status` | Enum | `Disponible`, `Blessé`, `Suspendu` ou `Incertain` |
| `injury_description` | Texte, optionnel | Description de la blessure |
| `return_date_estimate` | Texte, optionnel | Date estimée de retour |
| `contract_end_date` | Texte, optionnel | Fin de contrat au format `YYYY-MM-DD` |
| `academy` | Texte, optionnel | Club formateur |
| `notes` | Texte, optionnel | Notes internes |
| `is_active` | Vrai/Faux | Soft-delete (voir ci-dessus) |
| **Stats** | Nombre chacun | `matches`, `goals`, `assists`, `yellow_cards`, `red_cards`, `minutes_played`, `clean_sheets`, `goals_conceded` |

> **Pourquoi les stats sont dans la même table ?** C'est un choix de simplicité : une ligne par joueur contient tout. Une table de stats séparée (un enregistrement par match) serait plus précise mais bien plus complexe à gérer.

---

#### `models/staff.py` — Table `staff_members`

**À quoi ça sert ?** La fiche d'un membre du staff (coach, médecin, manager, etc.).

| Colonne | Description |
|---|---|
| `first_name`, `last_name` | |
| `role` | Un des 13 rôles définis : Coach Principal, Coach Adjoint, Préparateur Physique, Médecin, Kinésithérapeute, Manager, Modérateur, Scout, Analyste Vidéo, Intendant, Directeur Sportif, Psychologue, Dirigeant |
| `email` | Optionnel, unique (deux membres ne peuvent pas avoir le même email) |
| `phone` | Optionnel |
| `since_date` | Date d'arrivée au club (optionnel) |
| `photo_url` | Optionnel |
| `notes` | Notes internes |
| `is_admin` | Si vrai, le compte user associé aura aussi les droits admin |
| `is_active` | Soft-delete |

---

#### `models/club.py` — Tables `clubs` et `seasons`

**`Club`** — Les informations du club. Il n'existe toujours qu'**un seul club** dans la base (id=1). Ce n'est pas une application multi-clubs.

| Colonne | Description |
|---|---|
| `name` | Nom du club |
| `founded_year` | Année de fondation |
| `league` | Compétition principale |
| `email`, `phone`, `address`, `city` | Coordonnées du club |
| `logo_url` | URL du logo |

**`Season`** — Une saison sportive liée au club. Plusieurs saisons peuvent exister, mais **une seule est "active"** à la fois.

| Colonne | Description |
|---|---|
| `club_id` | Lien vers le club (toujours 1) |
| `label` | Calculé automatiquement : `"2025/2026"` depuis les dates de début/fin |
| `start_date`, `end_date` | Dates de début et fin au format `YYYY-MM-DD` |
| `competitions` | Compétitions disputées (texte libre : "Ligue 1, Coupe de France") |
| `objective` | Objectif de la saison (texte libre) |
| `status` | `À venir`, `En cours` ou `Terminée` |
| `is_active` | Seule une saison peut avoir `is_active = True` à la fois |

---

#### `models/event.py` — Table `events`

**À quoi ça sert ?** Les événements du calendrier.

| Colonne | Description |
|---|---|
| `title` | Intitulé de l'événement (ex: "Match vs Lyon") |
| `tag` | Type : `Match`, `Entraînement`, `Récupération` ou `Réunion` — détermine la couleur dans l'app |
| `event_date` | Date au format `YYYY-MM-DD` — **indexée** pour que la recherche par mois soit rapide |
| `event_time` | Heure au format `HH:MM` |
| `location` | Lieu (optionnel) |
| `notes` | Notes (optionnel) |
| `created_by` | Lien vers le compte utilisateur qui a créé l'événement |

---

#### `models/message.py` — Tables `conversations`, `conversation_participants`, `messages`

**Trois tables pour la messagerie :**

**`Conversation`** — Un canal de discussion (1:1 ou groupe).

| Colonne | Description |
|---|---|
| `name` | Nom affiché (prénom+nom du destinataire pour un 1:1, nom du groupe pour un groupe) |
| `category` | `team` (inclut des joueurs) ou `staff` (que du staff) |
| `role_type` | `player`, `coach`, `staff`, `group` ou `ai` — détermine la couleur de l'avatar dans l'app |
| `is_group` | Vrai si c'est un groupe (plusieurs participants) |
| `is_ai` | Vrai si c'est une conversation avec le bot IA (fonctionnalité future) |
| `initials` | 2 lettres pour l'avatar (ex: "TL" pour Thomas Laurent) |
| `avatar_bg` | Classe CSS Tailwind pour la couleur de fond de l'avatar |
| `role` | Rôle du staff (affiché en sous-titre dans la liste des conversations) |

**`ConversationParticipant`** — Qui participe à quelle conversation.

| Colonne | Description |
|---|---|
| `conversation_id` | Lien vers la conversation |
| `user_id` | Lien vers l'utilisateur |
| `hidden` | Si vrai, l'utilisateur a "quitté" la conversation — elle n'apparaît plus dans sa liste, mais les données restent |

**`Message`** — Un message dans une conversation.

| Colonne | Description |
|---|---|
| `conversation_id` | Dans quelle conversation |
| `sender_id` | Qui l'a envoyé (optionnel : `null` pour les messages système) |
| `msg_type` | `text`, `file` ou `system` |
| `text` | Le contenu du message |
| `created_at` | Quand il a été envoyé |

---

#### `models/notification.py` — Table `notifications`

**À quoi ça sert ?** Chaque notification apparaissant dans le panneau en haut à droite de l'app.

| Colonne | Description |
|---|---|
| `user_id` | À quel utilisateur cette notification appartient |
| `kind` | `added` (nouvel événement), `rescheduled` (événement modifié), `cancelled` (événement supprimé), `message` (nouveau message) |
| `title` | Le texte affiché dans la notification |
| `event_id` | Lien vers l'événement concerné — `null` pour les notifications de message, ou si l'événement a été supprimé |
| `event_date` | Date de l'événement (gardée même si l'événement est supprimé) |
| `tag` | Type d'événement ou rôle de l'expéditeur (pour la couleur du point indicateur) |
| `is_read` | Vrai/Faux (pour l'instant non utilisé en frontend) |

---

### 5.5 Validation des données (Schémas)

Les schémas Pydantic définissent ce que l'API **accepte en entrée** et **retourne en sortie**. Ils assurent que les données sont correctes avant d'atteindre la logique.

> **Convention de nommage :**
> - `XCreate` — données pour créer (POST)
> - `XUpdate` — données pour modifier (PATCH) — tous les champs sont optionnels
> - `XRead` — données retournées (GET) — ce que le frontend reçoit

---

#### `schemas/auth.py`

- **`LoginRequest`** — Ce qu'on envoie pour se connecter : `username` + `password`
- **`UserResponse`** — L'utilisateur retourné après login ou après `/me` : id, username, prénom, nom, is_admin, type, must_change_password, player_id, staff_id
- **`TokenResponse`** — Ce que retourne le login : `access_token` + `token_type` + `user: UserResponse`
- **`ChangePasswordRequest`** — `current_password` (optionnel si c'est un changement forcé) + `new_password`

#### `schemas/player.py`

- **`PlayerCreate`** — Tous les champs pour créer un joueur (prénom, nom, numéro, poste, nationalité, etc.)
- **`PlayerUpdate`** — Mêmes champs mais tous optionnels (on peut modifier juste le statut sans tout renvoyer). Inclut aussi les stats.
- **`PlayerRead`** — Ce que le frontend reçoit : toutes les informations + les stats
- **`PlayerCreatedResponse`** — Comme `PlayerRead` mais avec `username` et `temp_password` en plus — retournés **une seule fois** à la création, l'admin doit les noter

#### `schemas/staff.py`

- **`StaffMemberCreate`** — Prénom, nom, rôle (obligatoires), email (avec validation EmailStr), téléphone, date d'arrivée, notes, is_admin
- **`StaffMemberUpdate`** — Tous optionnels
- **`StaffMemberRead`** — Données sans mot de passe
- **`StaffCreatedResponse`** — Comme `StaffMemberRead` + `username` + `temp_password`
- **`ResetPasswordResponse`** — `username` + `temp_password` après un reset

#### `schemas/club.py`

- **`ClubUpdate`** — Tous les champs optionnels (nom, année, ligue, email, téléphone, adresse, ville)
- **`ClubRead`** — Tout le club + `logo_url`

#### `schemas/season.py`

- **`SeasonCreate`** — `start_date`, `end_date`, `competitions`, `objective`, `status`
- **`SeasonUpdate`** — Tous optionnels
- **`SeasonRead`** — Inclut `id`, `label` (calculé automatiquement), `is_active`

#### `schemas/event.py`

- **`EventCreate`** — `title`, `tag`, `event_date`, `event_time` (obligatoires), `location` et `notes` (optionnels)
- **`EventUpdate`** — Tous optionnels
- **`EventRead`** — Toutes les infos de l'événement (sans `created_by`)

#### `schemas/message.py`

- **`MessageRead`** — Un message enrichi : contenu + infos sur l'expéditeur (initiales, nom, couleur de rôle)
- **`MessageCreate`** — Juste `text` (le contenu)
- **`ConversationRead`** — Une conversation avec `preview` (extrait du dernier message), `time` (quand), et la liste des `members` pour les groupes
- **`ParticipantRead`** — Un participant avec ses initiales, couleur d'avatar et type de rôle
- **`UserCard`** — Carte utilisateur pour choisir un destinataire (nom, type, rôle)
- **`UsersGrouped`** — Tous les utilisateurs classés en trois groupes : `coaches`, `staff`, `players`
- **`ConversationCreate`** — `participant_ids` + `is_group` + `group_name` (optionnel)

#### `schemas/notification.py`

- **`NotificationRead`** — id, kind, title, tag, event_id, event_date, created_at

#### `schemas/dashboard.py`

- **`KPIsRead`** — 4 compteurs : total joueurs, joueurs disponibles, prochains événements, messages non lus
- **`AdminSummaryRead`** — Groupe `club` + `season` + `staff` en une seule réponse, pour le panneau admin du dashboard

---

### 5.6 Fonctions utilitaires (Services)

#### `backend/app/services/auth_service.py`

Toutes les fonctions liées aux mots de passe et à la sécurité.

---

**`hash_password(password)`** → texte hashé
- Transforme un mot de passe lisible en une chaîne illisible via bcrypt
- Exemple : `"MonMotDePasse"` → `"$2b$12$xyz..."` (60 caractères impossibles à lire)
- Utilisé à la création de compte et au changement de mot de passe
- **Le mot de passe en clair n'est jamais stocké en base de données**

**`verify_password(plain, hashed)`** → vrai ou faux
- Vérifie si un mot de passe en clair correspond à un hash bcrypt
- Utilisé lors de la connexion et lors du changement volontaire de mot de passe (vérification de l'ancien)

**`create_access_token(user_id)`** → chaîne JWT
- Crée un token JWT contenant l'`user_id` et une date d'expiration (maintenant + 24h)
- Le token est signé avec `SECRET_KEY` — personne ne peut le modifier sans que la signature devienne invalide
- Retourné au login, puis stocké dans le cookie httpOnly

**`decode_token(token)`** → `user_id` (nombre entier)
- Décode un JWT et extrait l'`user_id`
- Vérifie la signature ET la date d'expiration
- Si le token est altéré ou expiré : lève `JWTError` → `get_current_user` retourne un 401

**`generate_temp_password()`** → texte de 10 caractères
- Génère un mot de passe temporaire aléatoire (lettres + chiffres)
- Utilise `secrets.choice` qui est cryptographiquement sûr (pas `random.choice`)
- Retourné une seule fois à l'admin qui crée le compte — pas stocké en clair en base

**`_slugify(s)`** → texte normalisé *(fonction privée, préfixe `_`)*
- Prépare une chaîne pour en faire un identifiant : retire les accents, passe en minuscules, retire tout ce qui n'est pas `a-z` ou `0-9`
- Exemple : `"Élodie"` → `"elodie"`, `"O'Brien"` → `"obrien"`, `"Jean-Pierre"` → `"jeanpierre"`

**`make_username_base(first_name, last_name)`** → base d'identifiant
- Combine deux slugs : `make_username_base("Thomas", "Laurent")` → `"thomas.laurent"`
- Si ce nom est déjà pris, les routers ajoutent un numéro : `thomas.laurent2`, `thomas.laurent3`, etc.

---

### 5.7 Les URLs de l'API (Routers)

Tous les routers sont accessibles sous le préfixe `/api/v1`. Dans les exemples ci-dessous, on part du principe que l'URL complète est `http://localhost:8000/api/v1/...`.

---

#### `routers/auth.py` — Authentification (`/auth`)

---

**`POST /auth/login`** — *Accessible sans être connecté*

Ce que ça fait :
1. Cherche l'utilisateur dans la base par son `username` (mis en minuscules, espaces retirés)
2. Vérifie le mot de passe avec bcrypt
3. Vérifie que le compte n'est pas désactivé
4. Retourne un JWT et les informations de l'utilisateur

Ce que Next.js fait avec ça : il stocke le JWT dans un cookie sécurisé, puis retourne juste `{ user }` au navigateur.

---

**`GET /auth/me`** — *Doit être connecté*

Ce que ça fait : retourne les informations de l'utilisateur associé au token JWT.
Utilisé par `AuthContext` au chargement de la page pour savoir "qui suis-je ?"

---

**`POST /auth/change-password`** — *Doit être connecté*

Ce que ça fait :
1. Vérifie que le nouveau mot de passe fait au moins 8 caractères
2. **Si changement forcé** (`must_change_password = True`) : pas besoin de l'ancien mot de passe (le temporaire a déjà servi à se connecter)
3. **Si changement volontaire** : vérifie l'ancien mot de passe
4. Remplace le hash, met `must_change_password = False`

---

#### `routers/players.py` — Joueurs (`/players`)

---

**Fonction interne `_unique_username(base, db)`**

Vérifie si un identifiant est disponible et ajoute un numéro si nécessaire.
- `thomas.laurent` pris → essaie `thomas.laurent2`, puis `thomas.laurent3`, etc.

---

**`GET /players`** — *Doit être connecté*

Retourne la liste des joueurs actifs. Accepte des filtres optionnels en paramètre d'URL :
- `?position=DEF` → seulement les défenseurs
- `?status=Blessé` → seulement les blessés
- `?search=Laurent` → tous les joueurs dont le nom ou le poste contient "Laurent"

Le filtre `search` s'applique en Python sur les résultats déjà récupérés (pas en SQL).

---

**`POST /players`** — *Admin uniquement*

Crée un joueur ET son compte de connexion en même temps.

Étapes :
1. Crée la fiche `Player` dans la table `players`
2. Génère un `username` unique (`prenom.nom`, puis `prenom.nom2` si pris)
3. Génère un mot de passe temporaire de 10 caractères
4. Crée le compte `User` (`type="player"`, `must_change_password=True`)
5. Retourne toutes les infos + `username` et `temp_password` — l'admin doit les communiquer au joueur, ils ne seront plus affichés

---

**`POST /players/{player_id}/reset-password`** — *Admin uniquement*

Génère un nouveau mot de passe temporaire pour un joueur. Remet `must_change_password = True`. À la prochaine connexion du joueur, il sera forcé de choisir son propre mot de passe.

---

**`PATCH /players/{player_id}`** — *Admin uniquement*

Modifie une fiche joueur. Seuls les champs envoyés sont modifiés (les autres gardent leur valeur). Inclut les stats (buts, passes, etc.).

---

**`DELETE /players/{player_id}`** — *Admin uniquement*

**Soft-delete** : ne supprime pas vraiment les données. Met `is_active = False` sur la fiche joueur ET sur le compte user associé. Le joueur n'apparaît plus nulle part, mais ses données sont conservées.

---

#### `routers/staff.py` — Staff (`/staff`)

Même structure que les joueurs. Particularités :

**`GET /staff`** — *Doit être connecté* — Filtres : `search` (nom + rôle) et `role`

**`POST /staff`** — *Admin uniquement*
- Vérifie d'abord que l'email n'est pas déjà utilisé (si un email est fourni)
- Puis même logique que pour les joueurs : crée `StaffMember` + `User`
- La propriété `is_admin` est synchronisée entre les deux tables

**`PATCH /staff/{staff_id}`** — *Admin uniquement*
- Met à jour la fiche staff
- **Synchronise le compte User associé** si `is_admin`, `first_name` ou `last_name` changent — pour que les deux tables restent cohérentes

**`DELETE /staff/{staff_id}`** — *Admin uniquement* — Même soft-delete que pour les joueurs

---

#### `routers/club.py` — Club (`/club`)

Il n'y a qu'**un seul club** dans l'application (id = 1). Pas de création multiple.

**Fonction interne `_get_or_create_club(db)`**
- Cherche le club avec `id = 1`
- S'il n'existe pas (base vide, première utilisation) → le crée avec des valeurs vides
- Ça évite d'avoir à vérifier si le club existe à chaque opération

**`GET /club`** — *Doit être connecté* — Retourne les informations du club

**`PATCH /club`** — *Admin uniquement* — Modifie les informations (nom, ligue, email, etc.). Seuls les champs envoyés sont modifiés.

---

#### `routers/seasons.py` — Saisons (`/seasons`)

**Fonction interne `_make_label(start, end)`**
- Extrait les années des dates pour créer le label : `("2025-08-01", "2026-05-31")` → `"2025/2026"`

**`GET /seasons`** — *Doit être connecté* — Liste toutes les saisons (de la plus récente à la plus ancienne)

**`GET /seasons/active`** — *Doit être connecté* — Retourne la saison avec `is_active = True`. Si aucune → erreur 404.

**`POST /seasons`** — *Admin uniquement*
- Crée une nouvelle saison
- Génère automatiquement le `label` depuis les dates
- Crée le club `id=1` s'il n'existe pas encore

**`PATCH /seasons/{season_id}`** — *Admin uniquement* — Modifie et recalcule le label

**`PATCH /seasons/{season_id}/activate`** — *Admin uniquement*
- Met `is_active = False` sur **toutes** les saisons d'abord (UPDATE global)
- Puis met `is_active = True` uniquement sur la saison ciblée
- Garantit qu'il y a toujours une seule saison active au maximum

**`DELETE /seasons/{season_id}`** — *Admin uniquement* — Suppression définitive (hard delete)

---

#### `routers/events.py` — Événements (`/events`)

---

**`GET /events`** — *Doit être connecté*
- Sans paramètres : tous les événements
- Avec `?year=2026&month=6` : seulement ceux de juin 2026 (filtre via `LIKE "2026-06%"` sur `event_date` — l'index sur cette colonne rend ça rapide)

**`GET /events/upcoming`** — *Doit être connecté*
- Les 5 prochains événements à partir d'aujourd'hui, triés par date puis heure

**`POST /events`** — *Admin uniquement*
- Crée l'événement
- **Notifie automatiquement tous les utilisateurs actifs** — crée une `Notification` avec `kind="added"` pour chaque compte actif dans la base

**`GET /events/{event_id}`** — *Doit être connecté* — Retourne le détail d'un événement

**`PATCH /events/{event_id}`** — *Admin uniquement*
- Modifie l'événement
- **Si la date ou l'heure change** : crée une notification `kind="rescheduled"` pour tous les utilisateurs actifs

**`DELETE /events/{event_id}`** — *Admin uniquement*
- Avant de supprimer, crée une notification `kind="cancelled"` pour tous
- La notification garde l'`event_date` mais met `event_id = null` (car l'événement va disparaître)
- Supprime définitivement l'événement

---

#### `routers/messages.py` — Messagerie (`/messages`)

C'est le router le plus complexe. Voici d'abord les fonctions internes.

---

**Fonctions internes**

**`_role_type(user)`** → `"player"`, `"coach"` ou `"staff"`
- Détermine la "couleur" d'un utilisateur dans la messagerie
- `type == "player"` → `"player"` (bleu dans l'app)
- `is_admin == True` → `"coach"` (couleur primaire)
- Sinon → `"staff"` (orange)

**`_role_type_with_sm(user, sm)`** → même résultat mais plus précis
- Comme `_role_type` mais prend aussi la fiche staff en compte
- Si le rôle staff contient "coach" (ex: "Coach Adjoint") → retourne `"coach"` même si `is_admin = False`
- Utilisé pour classer correctement les coachs adjoints

**`_fmt_time(dt)`** → texte formaté pour l'affichage
- Aujourd'hui → `"14:32"`
- Hier → `"Hier"`
- Avant hier ou plus → `"09/06"`

---

**`GET /messages/users`** — *Doit être connecté*

Retourne tous les utilisateurs actifs **sauf l'utilisateur qui fait la requête**, classés en trois groupes pour l'interface de création de conversation :
- `coaches` — staff avec `is_admin=True` ou dont le rôle contient "coach"
- `staff` — staff non-coach
- `players` — joueurs

---

**`GET /messages/conversations`** — *Doit être connecté*

Retourne la liste des conversations visibles de l'utilisateur, triées par activité récente.

Pour chaque conversation, le backend :
1. Récupère le dernier message (pour l'aperçu et l'heure)
2. **Pour les 1:1** : cherche les vraies informations de l'autre participant (nom, initiales, rôle)
   - Pourquoi ? Parce que le nom stocké dans la conversation peut être du point de vue du créateur — on recompute tout en temps réel depuis le vrai profil de l'autre
   - C'est ce qui corrige le bug de couleur (un joueur créant une conv avec un admin → l'admin ne doit pas voir la conv en bleu "joueur")
3. **Pour les groupes** : charge la liste complète des membres

---

**`POST /messages/conversations`** — *Doit être connecté*

Crée une conversation. Deux cas :

**Mode 1:1 (is_group=False)** :
1. Vérifie si une conversation entre ces deux personnes existe déjà
2. Si oui et qu'elle était cachée → la réaffiche (l'utilisateur l'avait "quittée")
3. Si oui et visible → retourne la conversation existante (pas de doublon)
4. Si non → crée la conversation + deux entrées dans `conversation_participants`

**Mode groupe (is_group=True)** :
1. Vérifie qu'il y a au moins 2 participants
2. Si au moins un joueur → catégorie `team`, sinon `staff`
3. Nom par défaut si non fourni : "Thomas, Marie, Lucas…" (3 premiers prénoms + "…")
4. Crée la conversation + une entrée par participant

---

**`POST /messages/conversations/{conv_id}/leave`** — *Doit être connecté*

"Quitter" une conversation : met `hidden = True` sur la participation de l'utilisateur. La conversation reste en base, les autres participants ne voient rien de changé.

---

**`DELETE /messages/conversations/{conv_id}`** — *Doit être connecté*

Supprime une conversation **uniquement si elle est vide** (aucun message envoyé). Suppression définitive des participants puis de la conversation. Utilisé pour nettoyer une conversation créée par erreur avant qu'un message soit envoyé.

---

**`GET /messages/conversations/{conv_id}/messages`** — *Doit être connecté*

Retourne tous les messages d'une conversation dans l'ordre chronologique. Pour chaque message, enrichit avec les informations de l'expéditeur (initiales, nom complet, couleur de rôle).

---

**`POST /messages/conversations/{conv_id}/messages`** — *Doit être connecté*

Envoie un message. Ce qui se passe :
1. Crée le message en base
2. Pour chaque autre participant **non-caché** : crée une `Notification` `kind="message"`
   - Le `title` est `"Thomas Laurent : Bonjour tout le…"` (tronqué à 80 caractères)
   - Le `tag` est le role_type de l'expéditeur (pour la couleur du point dans les notifications)
3. Retourne le message enrichi avec les infos de l'expéditeur

---

#### `routers/notifications.py` — Notifications (`/notifications`)

**`GET /notifications`** — *Doit être connecté*

Retourne toutes les notifications de l'utilisateur courant, triées de la plus récente à la plus ancienne. Le frontend les sépare ensuite en "événements" et "messages".

**`DELETE /notifications/{notif_id}`** — *Doit être connecté*

Supprime une notification. Vérifie que la notification appartient bien à l'utilisateur qui fait la requête (protection : on ne peut pas supprimer la notification de quelqu'un d'autre).

---

#### `routers/dashboard.py` — Tableau de bord (`/dashboard`)

**`GET /dashboard/kpis`** — *Doit être connecté*

Retourne 4 compteurs calculés en base :
- Nombre total de joueurs actifs
- Nombre de joueurs disponibles (status = "Disponible")
- Nombre d'événements à venir (date >= aujourd'hui)
- Messages non lus (pour l'instant toujours 0, pas encore implémenté)

**`GET /dashboard/upcoming-events`** — *Doit être connecté*

Les 5 prochains événements à partir d'aujourd'hui.

**`GET /dashboard/unavailable-players`** — *Doit être connecté*

Tous les joueurs actifs dont le statut n'est pas "Disponible" (blessés, suspendus, incertains).

**`GET /dashboard/admin-summary`** — *Admin uniquement*

Retourne en un seul appel : les infos du club + la saison active + la liste complète du staff. Affiché dans le panneau rapide admin en haut du tableau de bord.

---

## 6. FRONTEND — Tous les fichiers expliqués

### 6.1 Le pont entre Next.js et FastAPI

---

#### `app/api/backend/[...path]/route.ts` — Le proxy universel

**À quoi ça sert ?**

Le navigateur ne peut pas envoyer directement le token JWT à FastAPI (il est dans un cookie httpOnly, JavaScript ne peut pas le lire). Ce fichier tourne côté serveur Next.js — il peut lire le cookie, ajouter le token en header, et transmettre la requête à FastAPI.

Le `[...path]` est une syntaxe Next.js qui signifie "n'importe quelle URL" — `/api/backend/players`, `/api/backend/staff/5`, `/api/backend/messages/conversations/3/messages` — toutes passent par cette même fonction.

**Ce que la fonction `handler` fait :**
1. Lit le cookie `token`
2. Si pas de token → retourne immédiatement une erreur 401
3. Construit l'URL FastAPI : `/api/backend/players` devient `http://localhost:8000/api/v1/players`
4. Ajoute `Authorization: Bearer <token>` au header
5. Pour GET/HEAD/DELETE : n'envoie pas de body (ces méthodes HTTP ne l'acceptent pas)
6. Transmet la requête à FastAPI, retourne la réponse
7. Si FastAPI est éteint (erreur réseau) → retourne `503 Backend non disponible`

---

#### `app/api/auth/login/route.ts` — La connexion

**À quoi ça sert ?** Reçoit les identifiants du formulaire de login, les vérifie auprès de FastAPI, pose le cookie sécurisé.

**Ce que `POST` fait :**
1. Relaie `{ username, password }` à FastAPI
2. Si FastAPI dit "non" → retourne une erreur au navigateur
3. Si FastAPI dit "oui" → pose le cookie `token` avec ces paramètres de sécurité :
   - `httpOnly: true` → JavaScript ne peut pas lire ce cookie (protection contre le vol de token)
   - `secure: true en production` → cookie uniquement envoyé sur HTTPS
   - `sameSite: lax` → protection contre les attaques CSRF
   - `maxAge: 86400` → expire dans 24h (cohérent avec le JWT)
4. Retourne `{ user }` au navigateur (pas le token — il est dans le cookie)

---

#### `app/api/auth/me/route.ts` — Vérification de session

**À quoi ça sert ?** Quand l'app se charge, elle ne sait pas encore qui est connecté. Elle appelle cette route pour le savoir.

**Ce que `GET` fait :** Lit le cookie `token`, le renvoie à FastAPI `/auth/me`, et retourne l'utilisateur (ou null si invalide).

---

#### `app/api/auth/logout/route.ts` — Déconnexion

**Ce que `POST` fait :** Supprime le cookie `token`. Simple mais suffisant — sans cookie, toutes les requêtes suivantes seront rejetées, et le middleware redirigera vers `/login`.

---

#### `app/api/nationalities/route.ts` — Liste des nationalités

**À quoi ça sert ?** Fournit la liste des nationalités avec leurs codes ISO (pour les drapeaux) au composant `NationalitySelect`. La liste vient d'une API publique externe.

**Le cache** : Les nationalités ne changent quasiment jamais. Inutile de rappeler l'API externe à chaque chargement de page. La liste est stockée en mémoire (`let cache = null`) une fois pour toutes.

**Ce que `GET` fait :**
1. Si déjà en cache → retourne immédiatement (0 appel réseau)
2. Sinon → essaie la première source externe (8s max avant abandon)
3. Si elle échoue → essaie la deuxième source de secours
4. Filtre les pays qui ont un gentilé masculin en français (ex: "Français", "Espagnol")
5. Trie par ordre alphabétique en français
6. Met en cache et retourne

---

### 6.2 La protection des pages

#### `proxy.ts` — Le gardien des pages

**À quoi ça sert ?** Ce fichier s'exécute automatiquement **avant chaque chargement de page**. Il décide si l'utilisateur peut accéder à la page demandée.

**Les règles :**
- Tu n'as pas de token ET tu n'es pas sur `/login` → redirigé vers `/login`
- Tu as un token ET tu essaies d'aller sur `/login` → redirigé vers `/dashboard` (déjà connecté)
- Dans tous les autres cas → laisse passer

**Le `matcher` :** Exclut les fichiers statiques (_next/static, images, icônes) et toutes les routes `/api/...` pour ne pas interférer avec les appels backend.

---

### 6.3 Les données partagées (Contexts)

---

#### `contexts/AuthContext.tsx` — L'utilisateur connecté

**À quoi ça sert ?** Partage l'information "qui est connecté" avec toute l'app, sans avoir à la passer manuellement dans chaque composant.

**Ce qu'il contient :**

`AuthUser` — la structure de l'utilisateur côté frontend :

| Champ | Description |
|---|---|
| `id` | Identifiant unique |
| `username` | Identifiant de connexion (`prenom.nom`) |
| `firstName`, `lastName` | Prénom et nom |
| `isAdmin` | Vrai si administrateur |
| `type` | `"player"` ou `"staff"` |
| `mustChangePassword` | Vrai si mot de passe temporaire non changé |
| `playerId` | ID de la fiche joueur (si `type = "player"`) |
| `staffId` | ID de la fiche staff (si `type = "staff"`) |

**`AuthProvider` — comment ça fonctionne :**
1. Au montage (chargement de l'app) : appelle `/api/auth/me` pour récupérer l'utilisateur
2. Si `mustChangePassword = True` et qu'on n'est pas sur `/change-password` → redirige immédiatement (évite la boucle infinie)
3. `logout()` : supprime le cookie, vide l'état, redirige vers `/login`

**`useAuth()`** — le hook pour accéder au contexte, retourne `{ user, loading, logout }`

---

#### `contexts/LanguageContext.tsx` — La langue de l'application

**À quoi ça sert ?** Partage la langue courante (fr/en) et les traductions avec toute l'app.

- **`useLanguage()`** — accède à la langue et à la fonction pour la changer
- **`useT()`** — raccourci pratique qui retourne directement l'objet de traductions de la langue courante

Exemple d'utilisation :
```typescript
const t = useT();
// Ensuite dans le JSX :
t.nav.dashboard    // "Tableau de bord" en fr, "Dashboard" en en
t.nav.players      // "Joueurs" en fr, "Players" en en
```

---

### 6.4 Les fonctions réutilisables (Hooks)

---

#### `hooks/useCurrentUser.ts` — Mes droits en un coup d'œil

**À quoi ça sert ?**

Un raccourci vers les trois informations les plus souvent utilisées pour les vérifications de droits. Au lieu d'appeler `useAuth()` et d'extraire ce dont on a besoin partout, ce hook fait ça en une ligne.

```typescript
const { isAdmin, type, playerId } = useCurrentUser();
```

Retourne `{ isAdmin: false, type: "staff", playerId: undefined }` si l'utilisateur n'est pas encore chargé (valeurs par défaut sécuritaires).

---

#### `hooks/useDashboard.ts` — Toutes les données du tableau de bord

**À quoi ça sert ?**

Charge toutes les données nécessaires pour le tableau de bord. Partagé entre `DashboardDesktop` et `DashboardMobile` — au lieu d'avoir le même code de chargement écrit deux fois, il est centralisé ici.

**Ce qu'il charge :**

1. **Pour tout le monde** (en parallèle, simultanément) :
   - KPIs : compteurs (total joueurs, disponibles, événements à venir)
   - Prochains événements
   - Joueurs indisponibles
   - Conversations récentes (les 3 premières)

2. **Si admin uniquement** :
   - `admin-summary` : résumé club + saison + staff

3. **Si joueur uniquement** :
   - La liste complète des joueurs pour trouver son propre profil
   - Priorité : recherche par `playerId`, sinon par prénom+nom
   - Les coéquipiers (tous les joueurs sauf soi-même)

**Ce qu'il retourne :**
`{ kpis, upcoming, unavailable, summary, recentConvs, myPlayer, teammates, auth, authLoading, isAdmin }`

---

#### `hooks/useNotifications.ts` — Les notifications

**À quoi ça sert ?**

Gère le chargement et la suppression des notifications. Partagé entre `Header` (desktop) et `MobileHeader` (mobile).

**Ce qu'il fait :**
- Charge les notifications depuis l'API au montage
- Écoute un événement DOM spécial (`dismiss-message-notifs`) : quand tu ouvres une conversation dans la messagerie, les notifications de message correspondantes disparaissent automatiquement — sans rechargement de page
- `remove(id)` : supprime une notification immédiatement dans l'affichage, puis envoie le DELETE en arrière-plan

**Ce qu'il retourne :**
- `evtNotifs` — notifications d'événements (added, rescheduled, cancelled)
- `msgNotifs` — notifications de messages
- `totalUnread` — nombre total (pour le badge rouge)
- `remove(id)` — fonction pour supprimer une notification

**Les fonctions visuelles exportées :**
- `evtDotClass(tag)` — couleur du point selon le type d'événement : Match=rouge, Entraînement=bleu, Récupération=vert, Réunion=gris
- `msgDotClass(tag)` — couleur selon le rôle de l'expéditeur : coach=bleu, player=vert, staff=orange
- `fmtNotifTime(createdAt)` — temps relatif : "À l'instant", "Il y a 5 min", "Il y a 2h", "Hier", "Il y a 3j"

---

### 6.5 Les utilitaires partagés (lib/)

Ces fichiers contiennent des fonctions et constantes utilisées dans plusieurs composants. Au lieu de copier-coller le même code dans Desktop ET Mobile, on l'écrit une seule fois ici.

---

#### `lib/playerUtils.ts` — Tout ce qui concerne les joueurs

Partagé entre `JoueursDesktop` et `JoueursMobile`.

**Les types (structures de données) :**
- `Player` — La fiche joueur côté frontend (noms en camelCase : `firstName` au lieu de `first_name`)
- `PlayerForm` — Les données d'un formulaire de création/édition
- `FormErrors` — Les erreurs de validation par champ (ex: `{ prenom: "Champ obligatoire" }`)
- `Credentials` — `{ username, temp_password }` affichés après la création d'un compte

**Les constantes :**
- `EMPTY_FORM` — Formulaire vide (valeurs initiales pour un nouveau joueur)
- `POSITION_OPTIONS` — Les 10 postes possibles avec leur abréviation
- `STATUSES_FORM` — Les 4 statuts : `['Disponible', 'Blessé', 'Suspendu', 'Incertain']`
- `FOOT_OPTIONS` — `['Droit', 'Gauche', 'Les deux']`
- `POSITIONS`, `STATUSES` — Listes pour les filtres (incluent "Tous")
- `S` — Map `statut → classes Tailwind` pour les badges colorés
- `STATUS_ACTIVE`, `STATUS_HOVER` — Classes CSS pour les onglets de filtre actif/survol

**Les fonctions :**

**`playerFromApi(data)`** — Convertit la réponse API en objet `Player`
- Traduit `first_name` en `firstName`, `shirt_number` en `number`, etc.
- Calcule `initials` (ex: "TL"), `name` (ex: "Laurent T.")

**`validateForm(form)`** → objet d'erreurs
- Vérifie que prénom, nom, numéro, poste, nationalité et statut sont remplis
- Retourne un objet vide si tout est valide, ou `{ prenom: "Champ obligatoire", ... }` si des erreurs

**`contractColor(contract?)`** → classe CSS de couleur
- Calcule la couleur du texte "fin de contrat" selon l'urgence
- < 6 mois → rouge, < 12 mois → orange, sinon → vert
- Utilise `new Date()` dynamiquement (pas d'année fixe dans le code)

**`ph(v?)`** → texte ou tiret
- Raccourci : `ph(player.notes)` retourne les notes ou `"—"` si vides

**`inputCls(err?)`** → classes CSS pour un champ de formulaire
- Rouge (bordure d'erreur) si `err` est défini, normal sinon

**`labelCls`** — Classes CSS fixes pour les labels de formulaires

---

#### `lib/dashboardUtils.ts` — Tout ce qui concerne le tableau de bord

Partagé entre `DashboardDesktop` et `DashboardMobile`.

**Les types :** `EventTag` (les 4 types d'événements)

**Les constantes (maps de couleurs Tailwind) :**
- `TAG_STYLE` — Bordure gauche + badge + texte par type d'événement (Match=rouge, Entraînement=bleu, etc.)
- `STATUS_BADGE` — Badge couleur pour les joueurs non-disponibles
- `PLAYER_STATUS` — Badge + point indicateur + texte par statut joueur
- `SS_SEASON` — Badge couleur par statut de saison (À venir=orange, En cours=vert, Terminée=rouge)

**Les fonctions :**
- `fmtDate("2026-06-11")` → `"11/06/2026"` — date complète formatée
- `fmtEventDate("2026-06-11")` → `"11/06"` — format court pour les événements

---

### 6.6 La mise en page (Layout)

---

#### `app/(app)/layout.tsx` — La coquille des pages connectées

**À quoi ça sert ?** C'est le fichier qui définit la structure commune à toutes les pages de l'app (dashboard, joueurs, calendrier...). Il n'est chargé qu'une seule fois et toutes les pages s'y insèrent.

**Ce qu'il fait :**
- Enveloppe toute l'app dans `AuthProvider` et `LanguageProvider`
- Sur desktop (`lg:`) : affiche la Sidebar à gauche + Header en haut
- Sur mobile : affiche le MobileHeader en haut + BottomNav en bas
- La zone de contenu (`main`) a un padding bas différent selon le format : plus grand sur mobile pour ne pas être caché par la barre de navigation

---

#### `components/layout/Sidebar.tsx` — Menu de navigation desktop

**Masquée sur mobile** (`hidden lg:flex`). Navigation verticale à gauche.

**Ce qu'il fait :**
- Construit la liste des pages avec leurs icônes
- Filtre les items `adminOnly` selon `isAdmin` (les non-admins ne voient pas "Administration")
- L'item actif = fond bleu (`bg-primary`)
- L'item Administration a un style rouge distinct pour signaler visuellement son caractère sensible

---

#### `components/layout/Header.tsx` — Barre du haut desktop

Affiche le nom de la page courante et le panneau de notifications.

**Le panneau de notifications :**
- S'ouvre en cliquant sur la cloche
- Deux onglets : "Événements" et "Messages"
- Maximum 5 notifications affichées, bouton "Voir X de plus"
- Clic sur une notification → navigue vers la bonne page (calendrier ou messagerie)
- Croix sur chaque notification → appelle `remove(id)` du hook `useNotifications()`

---

#### `components/layout/MobileHeader.tsx` — Barre du haut mobile

Même fonctionnalité que le Header desktop, adaptée pour mobile. Le panneau de notifications s'ouvre en slide depuis le haut. Utilise le même hook `useNotifications()`.

---

#### `components/layout/BottomNav.tsx` — Navigation mobile du bas

**Masquée sur desktop** (`lg:hidden`). Barre fixe en bas de l'écran sur mobile.

Même logique que la Sidebar : filtre les items `adminOnly`, style rouge pour Administration.

---

#### `components/NationalitySelect.tsx` — Sélecteur de nationalité

**À quoi ça sert ?** Un composant de recherche de nationalité avec drapeaux. Utilisé dans les formulaires joueur et staff.

**Ce qu'il fait :**
- Charge la liste des nationalités (avec le cache module-level)
- Affiche un input texte avec un drapeau à gauche si une nationalité est sélectionnée
- Au focus : ouvre une liste déroulante filtrée par la saisie
- Clic sur une option → appelle `onChange(label, iso)`
- Au clic en dehors → ferme la liste et revient à la dernière valeur valide

**Les détails techniques non-évidents :**
- `onMouseDown={e => e.preventDefault()}` sur chaque option : empêche l'input de perdre le focus avant que le clic sur l'option s'enregistre (le `blur` se déclenche avant le `click` dans l'ordre des événements du navigateur)
- Le `handleBlur` attend 150ms avant de fermer pour la même raison

---

### 6.7 Les pages de l'application

Chaque section suit le même pattern :
- Un `page.tsx` qui choisit entre Desktop et Mobile
- Un composant `*Desktop.tsx` (visible uniquement sur grand écran, `hidden lg:block`)
- Un composant `*Mobile.tsx` (visible uniquement sur petit écran, `lg:hidden`)

---

#### `app/(auth)/login/page.tsx` — La page de connexion

Accessible sans être connecté. Deux colonnes sur desktop, une seule sur mobile.

**Ce qu'elle fait :**
1. Formulaire avec identifiant et mot de passe
2. `username.trim().toLowerCase()` : normalise avant envoi (les identifiants sont en minuscules)
3. Appelle `/api/auth/login`
4. Si `must_change_password = true` dans la réponse → redirige vers `/change-password`
5. Sinon → redirige vers `/dashboard`

---

#### `app/(app)/change-password/page.tsx` — Changement de mot de passe

Deux modes distincts :

**Mode forcé** (première connexion, `mustChangePassword = true`) :
- Pas de champ "mot de passe actuel" (le temporaire a déjà servi à se connecter)
- Pas de bouton retour (pas le choix de changer)
- Bouton "Se déconnecter" si l'utilisateur veut abandonner

**Mode volontaire** (l'utilisateur veut changer son mot de passe) :
- Champ "mot de passe actuel" requis
- Bouton retour disponible

> **Détail important :** `isForced` est initialisé à `true` par défaut (pas `false`). Pourquoi ? Parce que pendant le chargement de l'app, `user` est `null` (pas encore chargé). Si on mettait `false` par défaut, on verrait brièvement le mode "volontaire" avant de basculer vers "forcé" — ce qui serait confus visuellement.

---

#### `app/(app)/dashboard/` — Tableau de bord

Les deux composants utilisent `useDashboard()`.

**`DashboardDesktop.tsx`**
- Pour les **admins** : panneau club + saison + staff en haut, puis KPIs, prochains événements, joueurs indisponibles, conversations récentes
- Pour les **joueurs** : profil personnel, coéquipiers, prochains événements, conversations récentes

**`DashboardMobile.tsx`** — Mêmes données, empilées verticalement.

---

#### `app/(app)/joueurs/` — Gestion des joueurs

Les deux composants importent depuis `lib/playerUtils.ts`.

**`JoueursDesktop.tsx`**
- Liste avec filtres : position (GK/DEF/MIL/ATT), statut, recherche textuelle
- Clic sur un joueur → panel de détail (ou modal sur mobile)
- Admin : boutons ajout, modification, suppression
- Modal de création → affiche les credentials (à noter)
- Modal de suppression : compte à rebours 3s (protection contre la suppression accidentelle)

**`JoueursMobile.tsx`** — Même fonctionnalité, présentation en cartes verticales.

---

#### `app/(app)/calendrier/` — Calendrier

**`CalendrierDesktop.tsx`**
- Vue mensuelle (grille 6 lignes × 7 colonnes)
- Flèches de navigation mois
- Clic sur un événement → panel de détail à droite
- Admin : créer, modifier, supprimer un événement

**`CalendrierMobile.tsx`**
- Vue semaine (7 jours affichés)
- Navigation semaine par semaine

**Le `pendingEventIdRef` :** Si une notification d'événement sur un autre mois est cliquée, l'app doit d'abord naviguer vers le bon mois, attendre le chargement des événements, puis ouvrir le détail. Pour orchestrer ces trois étapes, l'ID de l'événement cible est stocké dans une `ref` (pas un `state`) — elle survit aux re-renders sans déclencher de cycle supplémentaire.

---

#### `app/(app)/messagerie/` — Messagerie

**`MessagerieDesktop.tsx`** — Vue deux colonnes : liste des conversations à gauche, chat à droite.

Fonctionnalités clés :
- **Polling toutes les 5 secondes** : pas de WebSocket côté backend → le frontend re-demande périodiquement s'il y a de nouveaux messages. Pour éviter des re-renders inutiles, il compare l'ID du dernier message reçu avec ce qu'il a déjà.
- **Couleurs selon le rôle** : `player` = bleu, `coach` = bleu primaire, `staff` = orange, `group` = fond primaire
- **Dispatch d'événement** : quand tu ouvres une conversation, un événement `dismiss-message-notifs` est envoyé → `useNotifications` l'intercepte et supprime les notifications de message correspondantes sans rechargement

**`MessagerieMobile.tsx`** — Vue alternée : soit la liste, soit le chat (pas les deux en même temps).

---

#### `app/(app)/administration/` — Panel d'administration

*Réservé aux admins.*

**`AdministrationDesktop.tsx`** — Trois panneaux : Club, Saison, Staff.

Points importants :
- **Modal de suppression avec countdown 3s** : le bouton "Confirmer" n'est cliquable qu'après 3 secondes, pour éviter les suppressions accidentelles
- **`onDelConfirmed` ref** : le callback de suppression est stocké dans une `ref` (pas un `state`) pour que le même modal générique puisse supprimer n'importe quoi (un joueur, un membre du staff, etc.) sans recréer le composant
- **Preview de l'identifiant** : quand tu tapes un nom dans le formulaire, l'identifiant qui sera généré s'affiche en temps réel (même logique que le backend : NFD + suppression des accents)
- **`saisonId` null** : si aucune saison n'existe encore, `submitSaison` fera un POST (création) + activation immédiate. Sinon, un PATCH (modification).

**`AdministrationMobile.tsx`** — Même fonctionnalités, UI adaptée mobile.

---

## 7. Structure complète de la base de données

```
┌─────────────────────────────────────────────────────────────────┐
│  users                                                          │
│  id · username · email · hashed_password                        │
│  first_name · last_name · is_admin                              │
│  type (player|staff) · player_id → players                      │
│  staff_id → staff_members · must_change_password                │
│  is_active · created_at · updated_at                            │
└────────────┬────────────────────────┬───────────────────────────┘
             │                        │
             ▼                        ▼
┌────────────────────┐    ┌──────────────────────────┐
│  players           │    │  staff_members            │
│  id · first_name   │    │  id · first_name          │
│  last_name         │    │  last_name · role         │
│  shirt_number      │    │  email (nullable)         │
│  position          │    │  phone · since_date       │
│  position_short    │    │  photo_url · notes        │
│  nationality       │    │  is_admin · is_active     │
│  nationality_flag  │    └──────────────────────────┘
│  date_of_birth     │
│  height_cm         │    ┌──────────────────────────┐
│  weight_kg         │    │  clubs (singleton id=1)   │
│  preferred_foot    │    │  name · founded_year      │
│  photo_url · status│    │  league · email           │
│  injury_description│    │  phone · address · city   │
│  return_date       │    │  logo_url                 │
│  contract_end_date │    └──────────┬───────────────┘
│  academy · notes   │               │
│  is_active         │               ▼
│  ─── Stats ─────── │    ┌──────────────────────────┐
│  matches · goals   │    │  seasons                  │
│  assists           │    │  id · club_id → clubs     │
│  yellow_cards      │    │  label (auto: 2025/2026)  │
│  red_cards         │    │  start_date · end_date    │
│  minutes_played    │    │  competitions · objective │
│  clean_sheets      │    │  status · is_active       │
│  goals_conceded    │    └──────────────────────────┘
└────────────────────┘

┌────────────────────────────────────────────────────────────┐
│  events                                                    │
│  id · title · tag (Match|Entraînement|Récupération|Réunion)│
│  event_date (YYYY-MM-DD, indexé) · event_time (HH:MM)     │
│  location · notes · created_by → users                    │
└────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────┐
│  conversations                                               │
│  id · name · category (team|staff)                           │
│  role_type (player|coach|staff|group|ai)                     │
│  is_group · is_ai · initials · avatar_bg · role              │
└──────────────┬───────────────────────────────────────────────┘
               │
   ┌───────────┴──────────────┐
   ▼                          ▼
┌───────────────────────┐   ┌────────────────────────────────────┐
│ conversation_         │   │  messages                          │
│ participants          │   │  id · conversation_id → conv       │
│ id                    │   │  sender_id → users (nullable)      │
│ conversation_id → conv│   │  msg_type (text|file|system)       │
│ user_id → users       │   │  text · created_at                 │
│ hidden                │   └────────────────────────────────────┘
└───────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│  notifications                                                  │
│  id · user_id → users (indexé)                                  │
│  kind (added|rescheduled|cancelled|message)                     │
│  title · tag                                                    │
│  event_id → events (nullable, ondelete=CASCADE)                 │
│  event_date · is_read · created_at                              │
└─────────────────────────────────────────────────────────────────┘
```

---

## 8. Mécanismes importants à comprendre

### Le soft-delete (suppression douce)

Quand on "supprime" un joueur ou un membre du staff, les données ne sont pas effacées de la base. On met juste `is_active = False`. C'est ce qu'on appelle un "soft-delete".

**Pourquoi ?**
- Conservation de l'historique (stats, messages envoyés)
- Possibilité de réactiver un compte en cas d'erreur
- Cohérence des données : si un message a été envoyé par un joueur, ce message reste lisible même si le joueur est "supprimé"

**Comment ça se passe :**
- Le compte ne peut plus se connecter (`is_active = False` est vérifié dans `get_current_user`)
- Le joueur n'apparaît plus dans aucune liste (toutes les requêtes filtrent sur `is_active = True`)

### La création d'un compte (joueur ou staff)

Quand un admin crée un joueur ou un membre du staff, **deux tables sont remplies simultanément** :
1. La table métier (`players` ou `staff_members`) — la fiche avec toutes les infos
2. La table `users` — le compte de connexion

Le compte est créé avec `must_change_password = True` et un mot de passe temporaire de 10 caractères aléatoires. L'admin voit ces credentials une seule fois (dans une modal), et doit les communiquer à la personne concernée. À la première connexion, la personne sera forcée de choisir son propre mot de passe.

### La génération des identifiants

Les identifiants (`username`) sont générés automatiquement : `prenom.nom` en minuscules, sans accents ni caractères spéciaux.

Exemple : `Thomas Laurent` → `thomas.laurent`

Si ce nom est déjà pris (deux Thomas Laurent) : `thomas.laurent2`, puis `thomas.laurent3`, etc.

La même logique est implémentée **deux fois** : côté backend (génération réelle) et côté frontend (prévisualisation en temps réel dans le formulaire). C'est pourquoi le formulaire d'administration montre l'identifiant qui sera généré avant même que tu cliques sur "Créer".

### Le système de notifications

Chaque action importante crée automatiquement une notification pour les utilisateurs concernés.

| Action | Qui est notifié | Type |
|---|---|---|
| Création d'un événement | **Tous** les utilisateurs actifs | `added` |
| Modification date/heure d'un événement | **Tous** les utilisateurs actifs | `rescheduled` |
| Suppression d'un événement | **Tous** les utilisateurs actifs | `cancelled` |
| Envoi d'un message | Les autres participants de la conversation | `message` |

Les notifications sont **purement personnelles** : chaque utilisateur a ses propres entrées dans la table `notifications`. Supprimer une notification ne l'efface que pour soi.

### L'animation des modals (Open/Close pattern)

Toutes les modals de l'app s'ouvrent et se ferment avec une transition CSS. Ce pattern utilise deux booléens pour chaque modal :

```
xOpen    → contrôle si la modal est dans le DOM (montée/démontée)
xVisible → contrôle si la modal est visible (transition CSS)
```

**Ouverture :**
1. `setXOpen(true)` → la modal est ajoutée au DOM (mais encore invisible)
2. 10ms plus tard → `setXVisible(true)` → la transition CSS commence (fondu/glissement)
- Les 10ms sont nécessaires pour que le navigateur "voie" le changement et anime la transition

**Fermeture :**
1. `setXVisible(false)` → la transition CSS inverse commence
2. 200ms plus tard → `setXOpen(false)` → la modal est retirée du DOM
- Les 200ms laissent l'animation se terminer avant de démonter

### Le pendingEventIdRef (navigation vers un événement d'un autre mois)

Imaginons que tu cliques sur une notification "Match annulé le 15 juillet" alors que le calendrier affiche juin. L'app doit :
1. Naviguer vers juillet (changer le mois affiché)
2. Attendre que les événements de juillet soient chargés
3. Ouvrir le détail de cet événement précis

Le problème : on ne peut pas mettre l'eventId dans un `state` pour cette attente, car le changement de mois va re-déclencher plein de `useEffect` et potentiellement réinitialiser le state.

La solution : stocker l'eventId dans une `ref`. Les refs ne déclenchent pas de re-render et survivent à tous les cycles de rendu. Un `useEffect` surveille les événements chargés : quand `pendingEventIdRef.current` est non-null et que les événements sont là, il ouvre le détail et remet la ref à null.

### Le polling de la messagerie

La messagerie vérifie les nouveaux messages toutes les 5 secondes. Il n'y a pas de WebSocket (connexion permanente) côté backend.

Pour éviter que l'affichage "saute" à chaque vérification (même si rien n'a changé), le code compare l'ID du dernier message en base avec l'ID du dernier message déjà affiché. Si c'est le même → aucune mise à jour de l'affichage.

### Le dismiss automatique des notifications de message

Quand tu ouvres une conversation dans la messagerie, les notifications de message correspondantes doivent disparaître du panneau en haut (sinon elles restent même si tu as lu les messages).

**Comment ça marche :**
1. `MessagerieDesktop` dispatch un événement DOM personnalisé : `window.dispatchEvent(new CustomEvent('dismiss-message-notifs', { detail: { convName: "Thomas Laurent" } }))`
2. `useNotifications` est à l'écoute de cet événement
3. Il filtre les notifications `kind="message"` dont le `title` commence par `"Thomas Laurent : "`
4. Les supprime en local (l'affichage disparaît immédiatement) et envoie les DELETE en arrière-plan

Cela fonctionne parce que Header et la page Messagerie sont tous les deux dans le DOM en même temps — l'événement DOM traverse les deux.

# TeampilotAI — Guide Backend pour Débutants

> Ce document explique **pourquoi** on a fait ces choix, **ce que ça veut dire concrètement**, et **à quoi sert chaque fichier**. Il est à lire avant de toucher au code. Pour les détails techniques précis (champs exacts, endpoints complets), voir `BACKEND_PLAN.md`.

---

## Sommaire

1. [Pourquoi FastAPI plutôt qu'autre chose ?](#1-pourquoi-fastapi-plutôt-quautre-chose-)
2. [La base de données — PostgreSQL et SQLite](#2-la-base-de-données--postgresql-et-sqlite)
3. [Comment les données sont structurées (les modèles)](#3-comment-les-données-sont-structurées-les-modèles)
4. [Les endpoints API — comment le frontend parle au backend](#4-les-endpoints-api--comment-le-frontend-parle-au-backend)
5. [L'authentification — comment on sait qui est connecté](#5-lauthentification--comment-on-sait-qui-est-connecté)
6. [Les permissions — qui peut faire quoi](#6-les-permissions--qui-peut-faire-quoi)
7. [Le chatbot IA — comment ça marche gratuitement](#7-le-chatbot-ia--comment-ça-marche-gratuitement)
8. [La messagerie temps réel — les WebSockets](#8-la-messagerie-temps-réel--les-websockets)
9. [La sécurité — les points importants](#9-la-sécurité--les-points-importants)
10. [Docker — comment tout ça tourne ensemble](#10-docker--comment-tout-ça-tourne-ensemble)
11. [Explication de chaque dossier et fichier](#11-explication-de-chaque-dossier-et-fichier)
12. [Par où commencer — les 5 phases expliquées](#12-par-où-commencer--les-5-phases-expliquées)

---

## 1. Pourquoi FastAPI plutôt qu'autre chose ?

Il existe plein de façons de faire un backend : Node.js/Express, Django, Ruby on Rails, Laravel, Spring... On a choisi **FastAPI** pour ces raisons concrètes :

### C'est du Python — facile à lire
Python est probablement le langage le plus lisible qui existe. Une ligne FastAPI ressemble presque à du français :
```python
@router.get("/joueurs")
async def get_joueurs():
    return liste_des_joueurs
```

### Il génère la documentation automatiquement
FastAPI lit ton code et crée tout seul une page interactive où tu peux tester tous tes endpoints. Ça s'appelle **Swagger UI** et c'est accessible à `http://localhost:8000/docs` quand le serveur tourne. Très utile pour déboguer sans écrire de tests.

### Il gère le temps réel (WebSocket) sans plugin
La messagerie temps réel (tu envoies un message, l'autre le reçoit instantanément sans recharger la page) nécessite les WebSockets. FastAPI les supporte directement, sans avoir besoin d'installer une librairie tierce comme Socket.IO.

### Il est rapide
FastAPI est l'un des frameworks Python les plus rapides qui existent. Pas aussi rapide que du Go ou du Rust, mais largement suffisant pour une application de gestion de club de foot.

### Comparaison rapide

| Framework | Langage | Facilité | Vitesse | WebSocket natif |
|---|---|---|---|---|
| **FastAPI** ← notre choix | Python | Facile | Très rapide | Oui |
| Django | Python | Moyen | Moyen | Via plugin |
| Express | JavaScript | Facile | Rapide | Via Socket.IO |
| Spring Boot | Java | Difficile | Très rapide | Oui |

---

## 2. La base de données — PostgreSQL et SQLite

### C'est quoi une base de données ?
C'est un programme spécialisé dans le stockage et la recherche d'informations. Pense à un Excel ultra-puissant qui peut gérer des millions de lignes, plusieurs utilisateurs en même temps, et des liens entre les tableaux.

### Pourquoi deux bases différentes ?

On utilise **deux bases selon le contexte**, mais le code ne change pas — c'est la même façon de parler aux deux grâce à SQLAlchemy (voir plus bas).

- **SQLite (développement)** : un simple fichier sur ton ordi, zéro installation. Tu codes, tu testes, ça marche. Parfait pour développer seul sur sa machine.
- **PostgreSQL (production)** : un vrai serveur de base de données robuste. Nécessaire quand le site est en ligne avec de vrais utilisateurs.

### C'est quoi SQLAlchemy ?
C'est l'intermédiaire entre Python et la base de données. Au lieu d'écrire du SQL brut (`SELECT * FROM players WHERE status = 'Blessé'`), tu écris du Python (`await db.query(Player).filter(Player.status == 'Blessé').all()`). SQLAlchemy traduit ça en SQL tout seul.

**Avantage :** le même code Python fonctionne avec SQLite ET PostgreSQL. Tu développes avec SQLite, tu déploies avec PostgreSQL, rien à changer dans le code.

### C'est quoi Alembic ?
Quand tu modifies la structure de ta base de données (tu ajoutes une colonne, tu renommes une table...), il faut "migrer" la base existante sans perdre les données. Alembic gère ça automatiquement en créant des fichiers qui décrivent les changements à appliquer.

---

## 3. Comment les données sont structurées (les modèles)

Dans la base de données, les données sont organisées en **tables** (comme des feuilles dans Excel). Chaque table a des **colonnes** (les champs) et des **lignes** (les enregistrements).

Voici les tables principales et ce qu'elles contiennent, expliquées simplement :

### `User` — Les comptes utilisateurs
C'est la table centrale. Elle contient les informations de connexion (email, mot de passe chiffré) et une seule règle de permission : `is_admin` (vrai ou faux).

Un `User` est toujours lié à soit un joueur, soit un membre du staff. Quand tu crées un joueur dans la page Joueurs, ça crée en même temps un `User` avec un email et un mot de passe.

### `Club` — Les infos du club
C'est un **singleton** — il n'y en a qu'un seul dans toute la base. Nom, ligue, ville, email de contact, logo... Ce sont les infos qu'on voit dans le panneau admin du dashboard.

### `Season` — Les saisons
Une saison a des dates, un statut ("En cours", "Terminée"...), des compétitions, un objectif. Une seule peut être "active" à la fois.

### `Player` — Les joueurs
Toutes les infos d'une fiche joueur : nom, numéro, poste, nationalité, pied, statut (disponible/blessé...), photo. Les stats sont dans une table séparée (`PlayerStats`) pour pouvoir avoir les stats de chaque saison.

### `StaffMember` — Les membres du staff
Similaire aux joueurs : nom, rôle, email, photo. Le rôle peut être "Coach Principal", "Médecin", "Dirigeant", etc.

### `Event` — Les événements du calendrier
Chaque case du calendrier est un Event : titre, date, heure, lieu, tag (Match/Entraînement/...).

### `Conversation` + `Message` — La messagerie
Une conversation peut être un message direct entre deux personnes, un groupe, ou la conversation spéciale avec l'IA. Chaque message dans une conversation est une ligne dans la table `Message`.

### `Notification` — Les notifications
Quand un événement est créé/modifié/annulé, ou quand tu reçois un message, une notification est créée. Chaque utilisateur a ses propres notifications.

---

## 4. Les endpoints API — comment le frontend parle au backend

### C'est quoi un endpoint ?
Un endpoint, c'est une URL spéciale sur le backend à laquelle le frontend envoie des requêtes. Par exemple :
- `GET /api/v1/players` → "donne-moi la liste des joueurs"
- `POST /api/v1/players` → "crée ce nouveau joueur"
- `DELETE /api/v1/players/42` → "supprime le joueur numéro 42"

### Les méthodes HTTP
Chaque requête a une "méthode" qui indique l'intention :

| Méthode | Usage | Exemple |
|---|---|---|
| `GET` | Lire des données | Afficher la liste des joueurs |
| `POST` | Créer quelque chose | Ajouter un joueur |
| `PATCH` | Modifier partiellement | Changer le statut d'un joueur |
| `DELETE` | Supprimer | Retirer un joueur |

### Le préfixe `/api/v1/`
Tous nos endpoints commencent par `/api/v1/`. Le `v1` signifie "version 1". Si un jour on change complètement l'API de façon incompatible, on peut faire une `v2` et maintenir les deux un temps, sans casser les applis qui utilisent encore `v1`.

### Exemple concret — charger la page Joueurs
Aujourd'hui dans le code, les joueurs sont une liste fictive dans le fichier TypeScript. Après le backend, ça ressemblera à :
```typescript
// Au chargement de la page
const response = await fetch('/api/v1/players?position=Milieu');
const data = await response.json();
// data.players = la vraie liste depuis la BDD
```

---

## 5. L'authentification — comment on sait qui est connecté

### Le problème
HTTP est un protocole "sans mémoire" : chaque requête est indépendante. Le serveur ne se souvient pas que tu t'es connecté à la requête précédente. Il faut donc un mécanisme pour "prouver son identité" à chaque requête.

### La solution : les JWT (JSON Web Tokens)
Quand tu te connectes (email + mot de passe), le serveur te donne un **token** — une longue chaîne de caractères chiffrée. Ce token contient ton identifiant utilisateur et une date d'expiration, et il est signé par le serveur (donc impossible à falsifier).

Ensuite, pour chaque requête, tu envoies ce token dans le header :
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsIn...
```
Le serveur lit le token, vérifie sa signature, et sait qui tu es.

### Deux tokens : access + refresh
- **Access token** (30 minutes) : le token du quotidien. Court pour limiter le risque si quelqu'un le vole.
- **Refresh token** (7 jours) : stocké dans un cookie sécurisé, sert uniquement à obtenir un nouveau access token quand le précédent expire. Le frontend fait ça automatiquement.

### Bcrypt — le chiffrement des mots de passe
Les mots de passe ne sont **jamais stockés en clair** dans la base de données. On utilise bcrypt, un algorithme conçu exprès pour ça : il est volontairement lent, ce qui rend les attaques par force brute quasi impossibles. Même les développeurs du projet ne peuvent pas voir les vrais mots de passe.

---

## 6. Les permissions — qui peut faire quoi

### Le principe "binaire"
On a choisi la solution la plus simple possible : **un seul champ `is_admin` (vrai ou faux)**.

Pas de rôles multiples, pas de matrice complexe avec 10 niveaux de permission. La question est juste : "Est-ce que cet utilisateur est admin ?"

- `is_admin = true` → coach, dirigeant, staff avec responsabilités — peut tout faire (créer, modifier, supprimer)
- `is_admin = false` → joueur ou staff sans droits spéciaux — peut voir, envoyer des messages, utiliser l'IA

### Pourquoi c'est suffisant ?
Dans un club de foot, la réalité est simple : soit tu gères le club (tu as tous les droits), soit tu en fais partie (tu as accès à l'info sans pouvoir la modifier). Une matrice de permissions complexe avec 5 niveaux serait une sur-ingénierie inutile ici.

### Comment c'est implémenté
Dans le code Python, deux fonctions suffisent :
- `get_current_user()` : vérifie juste que tu es connecté
- `require_admin()` : vérifie que tu es connecté ET que `is_admin = true`

Chaque endpoint déclare lequel des deux il utilise. C'est tout.

---

## 7. Le chatbot IA — comment ça marche gratuitement

### Groq — une API IA gratuite
On n'a pas besoin d'OpenAI (payant) pour avoir un bon chatbot. **Groq** propose une API gratuite avec le modèle **Llama 3.3 70B** (un très bon modèle open source de Meta). Les limites du plan gratuit sont :
- 30 requêtes par minute
- 14 400 requêtes par jour
- Latence < 1 seconde (Groq a du matériel spécialisé très rapide)

Pour un club de foot de quelques dizaines d'utilisateurs, c'est plus que suffisant.

### Pourquoi c'est "intelligent" pour notre club ?
Le chatbot ne sait pas magiquement quels joueurs sont blessés ou quel est le prochain match. À chaque message, on lui envoie un **contexte** — un bloc de texte qui résume l'état actuel du club :
```
Tu es l'assistant IA de FC Teampilot.
Joueurs disponibles (18) : Martin, Dupont, ...
Joueurs blessés (3) : Rousseau (genou), ...
Prochain match : Samedi 14h vs Lyon...
```
Et ensuite le message de l'utilisateur. Le modèle répond en tenant compte de ce contexte. C'est une technique qui s'appelle le **"prompt engineering"**.

### Ollama — le plan B local
Si l'API Groq est indisponible (panne, quota dépassé...), on bascule automatiquement sur **Ollama**, qui fait tourner un modèle IA directement sur la machine du serveur. C'est plus lent et moins intelligent (modèle 3B vs 70B), mais ça garantit que le chatbot répond toujours.

---

## 8. La messagerie temps réel — les WebSockets

### Le problème avec HTTP normal
Avec HTTP classique, c'est toujours le client (navigateur) qui initie la conversation. Le serveur ne peut pas "envoyer" un message au navigateur spontanément. Pour voir les nouveaux messages, il faudrait recharger la page ou interroger le serveur toutes les X secondes — ce qui est lent et gaspille des ressources.

### La solution : WebSockets
Un WebSocket, c'est une connexion permanente et bidirectionnelle entre le navigateur et le serveur. Une fois établie, n'importe qui peut envoyer un message à tout moment :
```
Navigateur connecté  ←──connexion ouverte──→  Serveur

[Jean envoie "Salut"]  ──────────────────────→  Serveur reçoit
                                                  Serveur envoie aux participants
Marie reçoit "Salut"  ←──────────────────────  Serveur diffuse
```

### Redis — pour que ça marche sur plusieurs serveurs
Redis est une base de données ultra-rapide qui vit entièrement en mémoire (RAM). On l'utilise comme **canal de diffusion** : quand un message arrive sur le serveur A, il le publie dans Redis. Tous les autres serveurs (B, C...) qui ont des utilisateurs connectés récupèrent le message et le leur envoient.

Sans Redis, si Jean est connecté au serveur A et Marie au serveur B, Marie ne recevrait jamais les messages de Jean. Avec Redis, les deux serveurs sont synchronisés.

---

## 9. La sécurité — les points importants

### Rate limiting — contre les abus
Sans protection, n'importe qui pourrait essayer des milliers de mots de passe en quelques secondes pour pirater un compte. Le **rate limiting** bloque une IP qui fait trop de requêtes :
- Page de login : maximum 10 tentatives par minute
- Chatbot IA : 20 requêtes par minute (pour rester sous la limite Groq)

### Upload d'images — pourquoi c'est risqué
Laisser les utilisateurs uploader des fichiers peut être dangereux : un fichier malveillant déguisé en image pourrait compromettre le serveur. Nos protections :
1. Vérification du type MIME (pas juste l'extension `.jpg`)
2. Validation par Pillow (Python lit vraiment l'image pour confirmer que c'est une image)
3. Taille max 5 Mo
4. Sauvegarde sous un nom aléatoire (UUID) pour éviter l'écrasement de fichiers existants
5. Conversion en `.webp` (format moderne, plus léger)

### CORS — qui peut parler à l'API
CORS (Cross-Origin Resource Sharing) définit quels sites ont le droit d'appeler l'API. Sans ça, n'importe quel site web pourrait faire des appels à ton API en se faisant passer pour toi. On autorise uniquement `localhost:3000` (développement) et le vrai domaine de production.

---

## 10. Docker — comment tout ça tourne ensemble

### Le problème sans Docker
Le backend a besoin de Python 3.12, PostgreSQL 16, Redis 7... Sur ta machine, tu as peut-être d'autres versions installées. Sur le serveur de prod, encore d'autres. "Ça marche chez moi" est un problème classique.

### Docker : tout dans des boîtes
Docker crée des **conteneurs** — des environnements isolés qui contiennent exactement ce dont ils ont besoin, indépendamment du système hôte. Le fichier `docker-compose.yml` décrit comment lancer tous les services ensemble :

- **api** (le serveur FastAPI, port 8000)
- **db** (PostgreSQL, port 5432)
- **redis** (port 6379)
- **adminer** (une interface web pour voir le contenu de la BDD, en mode dev seulement)

Tu fais `docker-compose up -d` et tout démarre automatiquement, dans le bon ordre, avec les bonnes versions, peu importe ta machine.

### Les volumes — pour ne pas perdre les données
Par défaut, si tu supprimes un conteneur, tout ce qu'il contient disparaît. Les **volumes** sont des dossiers partagés entre le conteneur et ta machine : même si tu supprimes et recrées le conteneur PostgreSQL, les données restent.

---

## 11. Explication de chaque dossier et fichier

Voici l'arborescence complète avec une explication en français simple de ce que fait chaque fichier :

```
backend/
├── app/
│   ├── main.py
│   │   └── Le point d'entrée. C'est ce fichier que tu lances pour démarrer
│   │       le serveur. Il assemble tous les "routers" et configure le middleware
│   │       (CORS, rate limiting...).
│   │
│   ├── config.py
│   │   └── Lit les variables d'environnement du fichier .env (clé secrète JWT,
│   │       URL de la BDD, clé API Groq...) et les rend disponibles dans le code.
│   │       Tu ne mets jamais de vraies valeurs sensibles directement dans le code.
│   │
│   ├── database.py
│   │   └── Configure la connexion à la base de données et fournit la fonction
│   │       get_db() que chaque endpoint utilise pour parler à la BDD.
│   │
│   ├── models/
│   │   └── Les "plans" de tes tables de base de données. Chaque fichier =
│   │       une ou plusieurs tables. SQLAlchemy lit ces fichiers pour créer
│   │       les vraies tables.
│   │   ├── user.py      → Table User (comptes de connexion + is_admin)
│   │   ├── club.py      → Tables Club et Season
│   │   ├── player.py    → Tables Player et PlayerStats
│   │   ├── staff.py     → Table StaffMember
│   │   ├── event.py     → Table Event (calendrier)
│   │   ├── messaging.py → Tables Conversation, ConversationParticipant, Message
│   │   └── notification.py → Table Notification
│   │
│   ├── schemas/
│   │   └── Les "formats" de données que l'API accepte (en entrée) et renvoie
│   │       (en sortie). Pydantic vérifie automatiquement que les données
│   │       correspondent au format attendu. Si tu envoies un email mal formaté,
│   │       Pydantic renvoie une erreur claire au lieu de planter.
│   │   ├── auth.py      → Format du login (email + password) et du token reçu
│   │   ├── player.py    → Format pour créer/modifier/lire un joueur
│   │   ├── messaging.py → Format des messages et conversations
│   │   └── ai.py        → Format de la requête au chatbot et de sa réponse
│   │
│   ├── routers/
│   │   └── Les endpoints de l'API, organisés par thème. Chaque fichier =
│   │       un groupe d'URLs. Un router dit "pour l'URL /players, appelle
│   │       cette fonction Python".
│   │   ├── auth.py       → /auth/login, /auth/refresh, /auth/me
│   │   ├── players.py    → Tout ce qui concerne les joueurs
│   │   ├── events.py     → Tout ce qui concerne le calendrier
│   │   ├── staff.py      → Tout ce qui concerne le staff
│   │   ├── club.py       → Infos et mise à jour du club
│   │   ├── seasons.py    → Gestion des saisons
│   │   ├── messaging.py  → Conversations et messages (partie REST, pas WS)
│   │   ├── notifications.py → Lecture et suppression des notifications
│   │   ├── ai.py         → Endpoint du chatbot Tactical AI
│   │   ├── uploads.py    → Upload des photos (joueurs, staff, logo)
│   │   └── dashboard.py  → KPIs et données agrégées pour le dashboard
│   │
│   ├── websocket/
│   │   └── Tout ce qui concerne la connexion temps réel pour la messagerie.
│   │   ├── manager.py    → Le "chef d'orchestre" des connexions WebSocket.
│   │   │                   Il garde en mémoire qui est connecté et sait à
│   │   │                   qui envoyer chaque message.
│   │   └── router.py     → L'URL de connexion WebSocket (/ws?token=...)
│   │
│   ├── services/
│   │   └── La vraie logique métier, séparée des routers. Un router ne fait
│   │       qu'appeler un service. Pourquoi séparer ? Si demain tu veux
│   │       appeler la même logique depuis un autre endroit, tu n'as pas
│   │       à dupliquer le code.
│   │   ├── auth_service.py    → Créer/vérifier un JWT, hasher un mot de passe
│   │   ├── player_service.py  → Logique de création/modification d'un joueur
│   │   ├── event_service.py   → Créer un événement + envoyer les notifications auto
│   │   ├── messaging_service.py → Envoyer un message + diffusion WebSocket
│   │   └── ai_service.py      → Appel Groq + fallback Ollama + construction du contexte
│   │
│   ├── dependencies/
│   │   └── Des fonctions réutilisables que FastAPI injecte automatiquement
│   │       dans les endpoints qui en ont besoin.
│   │   ├── auth.py   → get_current_user() et require_admin()
│   │   │               Ces deux fonctions sont utilisées dans presque tous
│   │   │               les endpoints pour vérifier les droits.
│   │   └── db.py     → get_db() — fournit une session de BDD à chaque requête
│   │
│   └── utils/
│       └── Des outils techniques sans logique métier.
│       ├── image.py      → Valider et redimensionner une image uploadée
│       └── pagination.py → Format standard pour les listes paginées
│                           (résultats 1-20 sur 150, page suivante...)
│
├── alembic/
│   └── Les fichiers de migration de base de données.
│   ├── env.py            → Configuration d'Alembic (connexion à la BDD)
│   └── versions/         → Un fichier par migration, créé automatiquement.
│                           Chaque fichier décrit les changements à appliquer
│                           ("ajouter la colonne phone à la table staff").
│
├── tests/
│   └── Les tests automatisés qui vérifient que le code fonctionne.
│   ├── conftest.py       → Configuration partagée (BDD de test, utilisateur de test...)
│   ├── test_auth.py      → Tests de connexion, token, droits
│   ├── test_players.py   → Tests CRUD joueurs
│   └── test_messaging.py → Tests messagerie
│
├── uploads/
│   └── Dossier où sont stockées les images uploadées (photos joueurs, staff, logo).
│       Ce dossier est monté en volume Docker pour persister entre les redémarrages.
│   ├── players/
│   ├── staff/
│   └── club/
│
├── .env
│   └── Variables d'environnement RÉELLES (clés secrètes, mots de passe BDD...).
│       CE FICHIER NE DOIT JAMAIS ÊTRE COMMITÉ SUR GIT. Il est dans .gitignore.
│
├── .env.example
│   └── Un modèle vide du .env, sans les vraies valeurs. Celui-là on peut
│       le commiter — il sert à montrer aux autres développeurs quelles variables
│       ils doivent remplir.
│
├── requirements.txt
│   └── La liste de toutes les librairies Python nécessaires avec leurs versions
│       exactes. `pip install -r requirements.txt` installe tout en une commande.
│
├── Dockerfile
│   └── La "recette" pour créer l'image Docker de l'API : quel Python,
│       quelles librairies, quelle commande pour démarrer le serveur.
│
└── docker-compose.yml
    └── Décrit comment lancer tous les services ensemble (API + PostgreSQL + Redis)
        et comment ils communiquent entre eux.
```

---

## 12. Par où commencer — les 5 phases expliquées

Le plan est découpé en 5 phases pour ne pas tout faire d'un coup. Chaque phase produit quelque chose de testable.

### Phase 1 — L'authentification (8 – 11 juin)
**Ce qu'on fait :** Créer le système de connexion. Une page de login, un vrai token JWT, et le hook `useCurrentUser` qui lit ce token.

**Pourquoi en premier :** Tout le reste dépend de ça. On a besoin de savoir qui est connecté avant de faire quoi que ce soit d'autre.

**Ce que ça apporte :** Le site nécessite de se connecter. Le menu Admin disparaît pour les non-admins.

### Phase 2 — Club, Saison, Staff (12 – 14 juin)
**Ce qu'on fait :** Connecter la page Administration à de vraies données en base.

**Pourquoi en deuxième :** Ce sont des données relativement simples (peu de dépendances entre tables) et elles alimentent le panneau admin du dashboard.

**Ce que ça apporte :** Les admins peuvent vraiment modifier les infos du club. Les données persistent entre les rechargements.

### Phase 3 — Joueurs & Calendrier (15 – 18 juin)
**Ce qu'on fait :** CRUD complet pour les joueurs et les événements, les vrais KPIs dans le dashboard.

**Pourquoi en troisième :** Ce sont les pages les plus riches en données et en interactions. Les dépendances (photos, stats par saison...) nécessitent que la Phase 2 soit en place.

**Ce que ça apporte :** Les cartes joueurs viennent de la vraie BDD. Le calendrier est persisté. Le dashboard affiche de vrais chiffres.

### Phase 4 — Messagerie & Notifications (19 – 22 juin)
**Ce qu'on fait :** Messagerie temps réel, compteur de non-lus, notifications automatiques.

**Pourquoi en quatrième :** C'est la partie la plus complexe techniquement (WebSocket, Redis). Elle nécessite que les utilisateurs existent vraiment (Phase 1).

**Ce que ça apporte :** Les messages arrivent en temps réel. Les notifications apparaissent quand un événement est modifié.

### Phase 5 — Tactical AI (23 – 25 juin)
**Ce qu'on fait :** Brancher le chatbot sur les vraies données du club.

**Pourquoi en dernier :** Le chatbot injecte les données du club dans son contexte — il faut donc que toutes les données soient en base (joueurs, staff, saison...) pour que le contexte soit complet et pertinent.

**Ce que ça apporte :** L'IA connaît vraiment l'effectif, les blessés, le prochain match.

---

## En résumé

| Ce qu'on construit | Pourquoi ce choix | Niveau de complexité |
|---|---|---|
| FastAPI (Python) | Simple à lire, rapide, WebSocket intégré | Facile à moyen |
| PostgreSQL | Robuste pour la production | Moyen (géré par Docker) |
| JWT | Standard du secteur, sans état côté serveur | Moyen |
| RBAC binaire (`is_admin`) | Suffisant pour nos besoins, zéro complexité | Facile |
| Groq API (gratuit) | LLM performant sans abonnement | Facile |
| WebSocket + Redis | Seule vraie façon de faire du temps réel | Difficile |
| Docker | Garantit que ça marche partout | Moyen |

Le point techniquement le plus complexe est la messagerie temps réel (WebSocket + Redis). Tout le reste est relativement standard pour un backend moderne.

---

*Pour les détails techniques précis (champs de chaque modèle, liste complète des endpoints, exemples de code), voir `BACKEND_PLAN.md`.*

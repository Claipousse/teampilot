# Stack technique — Teampilot

> Chaque technologie est listée avec ce qu'elle fait et pourquoi on l'a choisie plutôt qu'une autre.

---

## Frontend

**Next.js 16 (React 19)**
C'est le framework principal du côté navigateur. Il gère la navigation entre les pages, peut faire du rendu côté serveur, et permet de créer des "routes API" côté serveur (utilisées ici comme proxy sécurisé vers le backend).
Choisi parce qu'il intègre tout : routing, SSR, routes serveur. Pas besoin d'assembler plusieurs librairies.

**TypeScript**
C'est du JavaScript avec un système de types. Quand tu écris `const age: number = "bonjour"`, TypeScript signale l'erreur immédiatement avant même de lancer le code.
Choisi parce qu'il détecte une grande catégorie de bugs à l'écriture, et rend le code plus facile à comprendre et à refactoriser.

**Tailwind CSS v4**
Un système de styles CSS où on applique les styles directement dans le HTML via des classes courtes (`bg-blue-500`, `text-xl`, `flex`). Pas de fichier CSS séparé à maintenir.
Choisi pour sa rapidité : on voit le résultat visuel directement dans le composant, sans aller-retour entre fichiers.

**react-markdown**
Transforme du texte formaté Markdown (`**gras**`, `## titre`, `- liste`) en vrai HTML. Utilisé uniquement pour afficher les réponses de l'IA, qui retourne du Markdown.
Choisi parce que Tailwind v4 ne supporte pas le plugin typography de façon standard, donc on gère le rendu manuellement avec ce composant.

---

## Backend

**Python 3.12 / 3.13**
Langage principal du backend. Lisible, populaire dans l'écosystème IA, et suffisant en performances pour une application de gestion de club.
Choisi pour sa lisibilité et parce que les meilleures librairies IA (Groq, Ollama) ont des clients Python officiels.

> Note : Python 3.14 est incompatible avec certaines dépendances (aiosqlite) — utiliser 3.12 ou 3.13.

**FastAPI 0.115**
Framework Python pour construire des APIs web. Il lit le code et génère automatiquement une page de documentation interactive (`http://localhost:8000/docs`) où on peut tester tous les endpoints depuis le navigateur.
Choisi pour sa vitesse de développement, sa documentation automatique, et son support natif de l'async.

**Uvicorn**
C'est le serveur qui fait tourner FastAPI. Comme `npm run dev` pour Next.js, la commande `uvicorn app.main:app --reload` lance un serveur qui redémarre automatiquement à chaque modification de code.
Choisi car c'est le serveur de référence recommandé pour FastAPI.

**SQLAlchemy 2.0 (async)**
ORM (Object-Relational Mapper) : permet de parler à la base de données en Python sans écrire de SQL brut. On écrit `select(Player).where(Player.status == "Blessé")` au lieu de `SELECT * FROM players WHERE status = 'Blessé'`.
Le mode async permet au serveur de traiter d'autres requêtes pendant qu'il attend la réponse de la base de données, au lieu de rester bloqué.
Choisi pour sa compatibilité avec Alembic et son mode async indispensable avec FastAPI.

**Alembic**
Outil de migration de base de données. Quand on modifie la structure d'une table (ajouter une colonne, changer un type), Alembic crée un script qui applique le changement sans effacer les données existantes.
Choisi car c'est le standard avec SQLAlchemy, les deux sont conçus pour fonctionner ensemble.

**SQLite + aiosqlite**
SQLite : base de données stockée dans un seul fichier (`teampilot.db`). Zéro installation, zéro serveur à lancer. aiosqlite est l'adaptateur qui permet à SQLAlchemy d'utiliser SQLite en mode async.
Choisi pour simplifier le développement local : on clone le repo, on lance le backend, c'est tout.

**Pydantic v2**
Librairie de validation de données. Quand l'API reçoit des données (ex: créer un joueur), Pydantic vérifie automatiquement que tous les champs requis sont présents et correctement typés. Aussi utilisé pour lire les variables d'environnement depuis le fichier `.env`.
Choisi car c'est intégré nativement à FastAPI — les deux fonctionnent parfaitement ensemble.

**python-jose + passlib/bcrypt**
python-jose : crée et vérifie les tokens JWT (les "cartes d'identité numériques" de connexion).
passlib/bcrypt : transforme les mots de passe en empreintes illisibles avant de les stocker. bcrypt est volontairement lent, ce qui rend les attaques par force brute quasi impossibles.
Choisis car ce sont les standards du secteur pour l'authentification en Python.

**httpx**
Client HTTP asynchrone pour Python. Utilisé dans le backend pour appeler l'API Ollama (le serveur IA local de fallback).
Choisi car il est async-compatible, contrairement à la librairie `requests` standard.

---

## Intelligence Artificielle

**Groq API (`groq` 0.13)**
API cloud qui donne accès au modèle `llama-3.3-70b-versatile` de Meta. Le plan gratuit offre jusqu'à 14 400 requêtes par jour avec une latence inférieure à 1 seconde (Groq utilise du matériel spécialisé appelé LPU).
Choisi parce qu'il permet d'avoir un LLM de très bonne qualité (70 milliards de paramètres) gratuitement, ce qu'OpenAI ne propose pas.

**Ollama**
Fait tourner un modèle IA (`llama3.2:3b`) directement sur la machine locale, sans internet. Utilisé comme plan de secours si Groq est indisponible ou si le quota quotidien est dépassé.
Choisi pour garantir que le chatbot répond toujours, même en cas de panne de l'API externe.

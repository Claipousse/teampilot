# TeamPilot

Application de gestion d'équipe sportive — Next.js (frontend) + FastAPI (backend).

---

## Lancer le projet

### Backend (FastAPI)

**Windows**
```bash
cd backend

python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt

alembic upgrade head
python seed.py       # données de test

uvicorn app.main:app --reload
```

**Linux / macOS**

> **Python 3.12 ou 3.13 requis.** Python 3.14 n'est pas encore supporté par certaines dépendances (`pydantic-core`, `pillow`).

```bash
cd backend

# Vérifier la version Python (doit être 3.12 ou 3.13)
python3 --version

# Si besoin, installer Python 3.12 (Fedora/RHEL)
sudo dnf install python3.12
# Ubuntu/Debian : sudo apt install python3.12

python3.12 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

alembic upgrade head
python seed.py       # données de test

uvicorn app.main:app --reload
```

### Frontend (Next.js)

```bash
# Installer les dépendances (première fois)
npm install

# Démarrer le serveur de développement (port 3000)
npm run dev
```

Ouvrir [http://localhost:3000](http://localhost:3000).

---

## Réinitialiser la base de données

```bash
cd backend

# Base vierge (schéma seul, sans données)
python reset_db.py

# Base vierge + données de test complètes
python reset_db.py --seed
```

---

**Comptes de test**

| Rôle | Username | Email | Mot de passe |
|------|----------|-------|-------------|
| Admin | `admin.test` | `admin@teampilot.com` | `admin123` |
| Staff | `staff.test` | `staff@teampilot.com` | `staff123` |
| Joueur | `joueur.test` | `joueur@teampilot.com` | `joueur123` |

---

## Stack

- **Frontend** : Next.js · Tailwind CSS · TypeScript
- **Backend** : FastAPI · SQLAlchemy (async) · SQLite · Alembic
- **Auth** : JWT via cookie HTTP-only

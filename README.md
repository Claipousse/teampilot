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

python -m alembic upgrade head
python seed.py

uvicorn app.main:app --reload
```

**Linux / macOS**
```bash
cd backend

python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

python -m alembic upgrade head
python seed.py

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

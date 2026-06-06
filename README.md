# TeamPilot

Application de gestion d'équipe sportive — Next.js (frontend) + FastAPI (backend).

---

## Lancer le projet

### Backend (FastAPI)

```bash
cd backend

# Installer les dépendances (première fois)
python -m venv venv
venv\Scripts\activate        # Windows
pip install -r requirements.txt

# Appliquer les migrations
python -m alembic upgrade head

# Peupler la base de données (première fois)
python seed.py

# Démarrer le serveur (port 8000)
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

| Rôle | Email | Mot de passe |
|------|-------|-------------|
| Admin (staff) | `admin@teampilot.com` | `admin123` |
| Staff (non admin) | `tlaurent@metropolisunited.com` | `staff123` |
| Joueur | `m.valentin@metropolisunited.com` | `player123` |

---

## Stack

- **Frontend** : Next.js · Tailwind CSS · TypeScript
- **Backend** : FastAPI · SQLAlchemy (async) · SQLite · Alembic
- **Auth** : JWT via cookie HTTP-only

#!/usr/bin/env bash
# Lance Teampilot : installe les dépendances si besoin, seed si première fois, démarre les deux serveurs.
# Usage (depuis la racine du projet) :
#   bash start.sh           → setup auto + lancement
#   bash start.sh --reset   → remet la BDD à zéro avant de lancer

set -e

ROOT="$(cd "$(dirname "$0")" && pwd)"
BACKEND="$ROOT/backend"

GRN='\033[0;32m'
BLU='\033[0;34m'
YEL='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

DIV="━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

log()  { echo -e "  ${GRN}✅${NC}  $1"; }
info() { echo -e "  ${BLU}⏳${NC}  $1"; }
warn() { echo -e "  ${YEL}ℹ️${NC}   $1"; }
err()  { echo -e "  ${RED}❌${NC}  $1"; exit 1; }

echo ""
echo "$DIV"
echo "  🚀  Teampilot — Initialisation"
echo "$DIV"

# ─────────────────────────────────────────────────────────────
# BACKEND
# ─────────────────────────────────────────────────────────────
echo ""
echo -e "${BLU}▶ Backend${NC}"
cd "$BACKEND"

# Détection Python 3.12 / 3.13
if   command -v python3.13 &>/dev/null; then PYTHON=python3.13
elif command -v python3.12 &>/dev/null; then PYTHON=python3.12
elif command -v python3    &>/dev/null; then
    PY_VER=$(python3 -c 'import sys; print(sys.version_info[:2])')
    if [[ "$PY_VER" == "(3, 12)" || "$PY_VER" == "(3, 13)" ]]; then
        PYTHON=python3
    else
        err "Python 3.12 ou 3.13 requis (trouvé : $PY_VER). Voir README."
    fi
else
    err "Python 3.12+ introuvable."
fi

# Environnement virtuel
if [ ! -d "venv" ]; then
    info "Création du venv ($PYTHON)..."
    $PYTHON -m venv venv
    log "Venv créé"
else
    log "Venv existant"
fi

source venv/bin/activate

# Dépendances Python
info "Installation des dépendances Python..."
pip install -r requirements.txt -q
log "Dépendances Python OK"

# Reset BDD si --reset
if [[ "$*" == *"--reset"* ]]; then
    info "Reset de la BDD (--reset)..."
    python reset_db.py
fi

# Migrations
info "Migrations Alembic..."
alembic upgrade head 2>/dev/null
log "Migrations OK"

# Seed automatique si la BDD est vide
DB_EMPTY=$(python - <<'EOF'
import sqlite3, os, sys
db = "teampilot.db"
if not os.path.exists(db):
    print("yes")
    sys.exit()
try:
    conn = sqlite3.connect(db)
    count = conn.execute("SELECT COUNT(*) FROM users").fetchone()[0]
    conn.close()
    print("yes" if count == 0 else "no")
except Exception:
    print("yes")
EOF
)

if [ "$DB_EMPTY" = "yes" ]; then
    info "Base vide — seed des données de test..."
    python seed.py
else
    warn "BDD existante avec données — seed ignoré  (utiliser --reset pour remettre à zéro)"
fi

# ─────────────────────────────────────────────────────────────
# FRONTEND
# ─────────────────────────────────────────────────────────────
echo ""
echo -e "${BLU}▶ Frontend${NC}"
cd "$ROOT"

if [ ! -d "node_modules" ]; then
    info "Installation des dépendances npm..."
    npm install --silent
    log "Dépendances npm OK"
else
    log "node_modules existant"
fi

# ─────────────────────────────────────────────────────────────
# LANCEMENT
# ─────────────────────────────────────────────────────────────
echo ""
echo "$DIV"
echo "  🟢  Serveurs en cours de démarrage"
echo "$DIV"
echo "  Backend   →  http://localhost:8000"
echo "  Frontend  →  http://localhost:3000"
echo "  API docs  →  http://localhost:8000/docs"
echo ""
echo "  Ctrl+C pour tout arrêter"
echo "$DIV"
echo ""

cleanup() {
    echo ""
    echo -e "  🛑  Arrêt des serveurs..."
    kill "$BACKEND_PID" "$FRONTEND_PID" 2>/dev/null
    wait "$BACKEND_PID" "$FRONTEND_PID" 2>/dev/null
    exit 0
}
trap cleanup SIGINT SIGTERM

# Backend
cd "$BACKEND"
source venv/bin/activate
{ uvicorn app.main:app --reload --port 8000 2>&1 | while IFS= read -r line; do
    echo -e "${BLU}[API]${NC} $line"
done; } &
BACKEND_PID=$!

# Frontend
cd "$ROOT"
{ npm run dev 2>&1 | while IFS= read -r line; do
    echo -e "${GRN}[APP]${NC} $line"
done; } &
FRONTEND_PID=$!

wait "$BACKEND_PID" "$FRONTEND_PID"

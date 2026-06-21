# Lance Teampilot (Windows — PowerShell)
# Usage depuis la racine du projet :
#   .\start.ps1           -> setup auto + lancement
#   .\start.ps1 --reset   -> remet la BDD a zero avant de lancer
#
# Si PowerShell bloque l'execution, lancer une fois en admin :
#   Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser

param([switch]$reset)

$ROOT    = $PSScriptRoot
$BACKEND = Join-Path $ROOT "backend"
$DIV     = "=" * 56

function log  { param($m) Write-Host "  [OK]  $m" -ForegroundColor Green  }
function info { param($m) Write-Host "  ...   $m" -ForegroundColor Cyan   }
function warn { param($m) Write-Host "  [i]   $m" -ForegroundColor Yellow }
function err  { param($m) Write-Host "  [ERR] $m" -ForegroundColor Red; exit 1 }

Write-Host ""
Write-Host $DIV
Write-Host "  Teampilot -- Initialisation"
Write-Host $DIV

# ─────────────────────────────────────────────────────────────
# BACKEND
# ─────────────────────────────────────────────────────────────
Write-Host ""
Write-Host ">> Backend" -ForegroundColor Cyan
Set-Location $BACKEND

# Detection Python
$PYTHON = $null
foreach ($cmd in @("python3.13","python3.12","python3","python")) {
    if (Get-Command $cmd -ErrorAction SilentlyContinue) {
        $ver = & $cmd -c "import sys; v=sys.version_info; print(v.major*10+v.minor)" 2>$null
        if ($ver -ge 312) { $PYTHON = $cmd; break }
    }
}
if (-not $PYTHON) { err "Python 3.12 ou 3.13 requis. Voir README." }

# Venv
if (-not (Test-Path "venv")) {
    info "Creation du venv ($PYTHON)..."
    & $PYTHON -m venv venv
    log "Venv cree"
} else {
    log "Venv existant"
}

# Activation venv
$activateScript = Join-Path $BACKEND "venv\Scripts\Activate.ps1"
if (-not (Test-Path $activateScript)) { err "Venv corrompu — supprime le dossier 'venv' et relance." }
& $activateScript

# Dependances
info "Installation des dependances Python..."
pip install -r requirements.txt -q
log "Dependances Python OK"

# Reset BDD
if ($reset) {
    info "Reset de la BDD (--reset)..."
    python reset_db.py
}

# Migrations
info "Migrations Alembic..."
alembic upgrade head 2>$null
log "Migrations OK"

# Seed si BDD vide
$dbEmpty = python -c "import sqlite3,os; db='teampilot.db'; print('yes' if not os.path.exists(db) else ('yes' if sqlite3.connect(db).execute('SELECT COUNT(*) FROM users').fetchone()[0]==0 else 'no'))"
if ($dbEmpty -eq "yes") {
    info "Base vide -- seed des donnees de test..."
    python seed.py
} else {
    warn "BDD existante avec donnees -- seed ignore  (--reset pour remettre a zero)"
}

# ─────────────────────────────────────────────────────────────
# FRONTEND
# ─────────────────────────────────────────────────────────────
Write-Host ""
Write-Host ">> Frontend" -ForegroundColor Cyan
Set-Location $ROOT

if (-not (Test-Path "node_modules")) {
    info "Installation des dependances npm..."
    npm install --silent
    log "Dependances npm OK"
} else {
    log "node_modules existant"
}

# ─────────────────────────────────────────────────────────────
# LANCEMENT (deux fenetres separees)
# ─────────────────────────────────────────────────────────────
Write-Host ""
Write-Host $DIV
Write-Host "  Lancement des serveurs..."
Write-Host $DIV
Write-Host "  Backend   ->  http://localhost:8000"
Write-Host "  Frontend  ->  http://localhost:3000"
Write-Host "  API docs  ->  http://localhost:8000/docs"
Write-Host ""
Write-Host "  Deux fenetres PowerShell vont s'ouvrir."
Write-Host "  Fermez-les pour arreter les serveurs."
Write-Host $DIV
Write-Host ""

$backendCmd  = "Set-Location '$BACKEND'; & 'venv\Scripts\Activate.ps1'; uvicorn app.main:app --reload --port 8000"
$frontendCmd = "Set-Location '$ROOT'; npm run dev"

Start-Process powershell -ArgumentList "-NoExit", "-Command", $backendCmd
Start-Process powershell -ArgumentList "-NoExit", "-Command", $frontendCmd

"""
Reset de la base de données — supprime toutes les données et recrée le schéma proprement.

Usage (depuis le dossier backend/) :
  python reset_db.py          → base vierge (schéma uniquement)
  python reset_db.py --seed   → base vierge + données de test (équivalent à seed.py)
"""
import asyncio
import sys
from pathlib import Path
from alembic.config import Config
from alembic import command

DIV = "━" * 56
DB_PATH = Path("teampilot.db")


def reset_db():
    print(f"\n{DIV}")
    print("  🗑️   Reset de la base de données")
    print(DIV)

    if DB_PATH.exists():
        DB_PATH.unlink()
        print(f"  ✅  {DB_PATH} supprimé")
    else:
        print("  ℹ️   Aucune base existante — création from scratch")

    print("  ⏳  Application des migrations...")
    alembic_cfg = Config("alembic.ini")
    command.upgrade(alembic_cfg, "head")
    print("  ✅  Schéma recréé  (alembic upgrade head)")

    print(f"{DIV}")
    print("  Base vierge prête.")
    print(f"{DIV}\n")


if __name__ == "__main__":
    reset_db()

    if "--seed" in sys.argv:
        print()
        import seed
        asyncio.run(seed.seed())

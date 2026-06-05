from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.dependencies.db import get_db
from app.dependencies.auth import get_current_user, require_admin
from app.models.player import Player
from app.models.user import User
from app.schemas.player import PlayerCreate, PlayerUpdate, PlayerRead
from app.services.auth_service import hash_password

router = APIRouter(prefix="/players", tags=["players"])


@router.get("", response_model=list[PlayerRead], dependencies=[Depends(get_current_user)])
async def list_players(
    position: str = "", status: str = "", search: str = "",
    db: AsyncSession = Depends(get_db),
):
    q = select(Player).where(Player.is_active == True)
    if position:
        q = q.where(Player.position_short == position)
    if status:
        q = q.where(Player.status == status)
    result = await db.execute(q)
    players = result.scalars().all()
    if search:
        s = search.lower()
        players = [p for p in players if s in f"{p.first_name} {p.last_name}".lower() or s in p.position.lower()]
    return players



@router.post("", response_model=PlayerRead, dependencies=[Depends(require_admin)])
async def create_player(data: PlayerCreate, db: AsyncSession = Depends(get_db)):
    existing = await db.execute(select(User).where(User.email == data.email))
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Email déjà utilisé")
    player = Player(
        first_name=data.first_name, last_name=data.last_name,
        shirt_number=data.shirt_number, position=data.position,
        position_short=data.position_short, nationality=data.nationality,
        nationality_flag=data.nationality_flag, date_of_birth=data.date_of_birth,
        height_cm=data.height_cm, weight_kg=data.weight_kg,
        preferred_foot=data.preferred_foot, status=data.status,
        injury_description=data.injury_description, return_date_estimate=data.return_date_estimate,
        contract_end_date=data.contract_end_date, academy=data.academy, notes=data.notes,
    )
    db.add(player)
    await db.flush()
    user = User(
        email=data.email,
        hashed_password=hash_password(data.password),
        first_name=data.first_name, last_name=data.last_name,
        is_admin=False, type="player", player_id=player.id,
    )
    db.add(user)
    await db.commit()
    await db.refresh(player)
    return player


@router.patch("/{player_id}", response_model=PlayerRead, dependencies=[Depends(require_admin)])
async def update_player(player_id: int, data: PlayerUpdate, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Player).where(Player.id == player_id))
    player = result.scalar_one_or_none()
    if not player:
        raise HTTPException(status_code=404, detail="Joueur introuvable")
    for field, value in data.model_dump(exclude_none=True).items():
        setattr(player, field, value)
    await db.commit()
    await db.refresh(player)
    return player


@router.delete("/{player_id}", dependencies=[Depends(require_admin)])
async def delete_player(player_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Player).where(Player.id == player_id))
    player = result.scalar_one_or_none()
    if not player:
        raise HTTPException(status_code=404, detail="Joueur introuvable")
    player.is_active = False
    user_r = await db.execute(select(User).where(User.player_id == player_id))
    user = user_r.scalar_one_or_none()
    if user:
        user.is_active = False
    await db.commit()
    return {"ok": True}

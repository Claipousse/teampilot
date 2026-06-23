from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.dependencies.db import get_db
from app.dependencies.auth import get_current_user, require_admin
from app.models.player import Player
from app.models.user import User
from app.schemas.player import PlayerCreate, PlayerUpdate, PlayerRead, PlayerCreatedResponse
from app.services.auth_service import hash_password, generate_temp_password, make_username_base

router = APIRouter(prefix="/players", tags=["players"])


async def _unique_username(base: str, db: AsyncSession) -> str:
    rows = (await db.execute(
        select(User.username).where(User.username.like(f"{base}%"))
    )).scalars().all()
    existing = {u for u in rows if u}
    if base not in existing:
        return base
    i = 2
    while f"{base}{i}" in existing:
        i += 1
    return f"{base}{i}"


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


@router.post("", response_model=PlayerCreatedResponse, dependencies=[Depends(require_admin)])
async def create_player(data: PlayerCreate, db: AsyncSession = Depends(get_db)):
    player = Player(
        first_name=data.first_name, last_name=data.last_name,
        shirt_number=data.shirt_number, position=data.position,
        position_short=data.position_short, nationality=data.nationality,
        nationality_flag=data.nationality_flag, date_of_birth=data.date_of_birth,
        height_cm=data.height_cm, weight_kg=data.weight_kg,
        preferred_foot=data.preferred_foot, photo_url=data.photo_url, status=data.status,
        injury_description=data.injury_description, return_date_estimate=data.return_date_estimate,
        contract_end_date=data.contract_end_date, academy=data.academy, notes=data.notes,
    )
    db.add(player)
    await db.flush()

    base = make_username_base(data.first_name, data.last_name)
    username = await _unique_username(base, db)
    temp_password = generate_temp_password()

    user = User(
        username=username,
        hashed_password=hash_password(temp_password),
        first_name=data.first_name,
        last_name=data.last_name,
        is_admin=False,
        type="player",
        player_id=player.id,
        must_change_password=True,
    )
    db.add(user)
    await db.commit()
    await db.refresh(player)

    result = PlayerRead.model_validate(player).model_dump()
    result["username"] = username
    result["temp_password"] = temp_password
    return result


@router.post("/{player_id}/reset-password", dependencies=[Depends(require_admin)])
async def reset_player_password(player_id: int, db: AsyncSession = Depends(get_db)):
    user = (await db.execute(select(User).where(User.player_id == player_id))).scalar_one_or_none()
    if not user:
        raise HTTPException(404, "Utilisateur introuvable")
    temp_password = generate_temp_password()
    user.hashed_password = hash_password(temp_password)
    user.must_change_password = True
    await db.commit()
    return {"username": user.username, "temp_password": temp_password}


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
    user_result = await db.execute(select(User).where(User.player_id == player_id))
    user = user_result.scalar_one_or_none()
    if user:
        user.is_active = False
    await db.commit()
    return {"ok": True}

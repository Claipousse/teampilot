from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update
from app.dependencies.db import get_db
from app.dependencies.auth import get_current_user, require_admin
from app.models.club import Club, Season
from app.schemas.season import SeasonRead, SeasonCreate, SeasonUpdate

router = APIRouter(prefix="/seasons", tags=["seasons"])


def _make_label(start: str, end: str) -> str:
    return f"{start[:4]}/{end[:4]}"


@router.get("/", response_model=list[SeasonRead], dependencies=[Depends(get_current_user)])
async def list_seasons(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Season).order_by(Season.start_date.desc()))
    return result.scalars().all()


@router.get("/active", response_model=SeasonRead, dependencies=[Depends(get_current_user)])
async def get_active_season(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Season).where(Season.is_active == True))
    season = result.scalar_one_or_none()
    if not season:
        raise HTTPException(status_code=404, detail="Aucune saison active")
    return season


@router.post("/", response_model=SeasonRead, dependencies=[Depends(require_admin)])
async def create_season(data: SeasonCreate, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Club).where(Club.id == 1))
    club = result.scalar_one_or_none()
    if not club:
        club = Club(id=1)
        db.add(club)
        await db.flush()
    season = Season(
        club_id=1,
        label=_make_label(data.start_date, data.end_date),
        **data.model_dump(),
    )
    db.add(season)
    await db.commit()
    await db.refresh(season)
    return season


@router.patch("/{season_id}", response_model=SeasonRead, dependencies=[Depends(require_admin)])
async def update_season(season_id: int, data: SeasonUpdate, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Season).where(Season.id == season_id))
    season = result.scalar_one_or_none()
    if not season:
        raise HTTPException(status_code=404, detail="Saison introuvable")
    for field, value in data.model_dump(exclude_none=True).items():
        setattr(season, field, value)
    season.label = _make_label(season.start_date, season.end_date)
    await db.commit()
    await db.refresh(season)
    return season


@router.patch("/{season_id}/activate", response_model=SeasonRead, dependencies=[Depends(require_admin)])
async def activate_season(season_id: int, db: AsyncSession = Depends(get_db)):
    await db.execute(update(Season).values(is_active=False))
    result = await db.execute(select(Season).where(Season.id == season_id))
    season = result.scalar_one_or_none()
    if not season:
        raise HTTPException(status_code=404, detail="Saison introuvable")
    season.is_active = True
    await db.commit()
    await db.refresh(season)
    return season


@router.delete("/{season_id}", dependencies=[Depends(require_admin)])
async def delete_season(season_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Season).where(Season.id == season_id))
    season = result.scalar_one_or_none()
    if not season:
        raise HTTPException(status_code=404, detail="Saison introuvable")
    await db.delete(season)
    await db.commit()
    return {"ok": True}

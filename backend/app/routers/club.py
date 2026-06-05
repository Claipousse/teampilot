from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.dependencies.db import get_db
from app.dependencies.auth import get_current_user, require_admin
from app.models.club import Club
from app.schemas.club import ClubRead, ClubUpdate

router = APIRouter(prefix="/club", tags=["club"])


async def _get_or_create_club(db: AsyncSession) -> Club:
    result = await db.execute(select(Club).where(Club.id == 1))
    club = result.scalar_one_or_none()
    if not club:
        club = Club(id=1)
        db.add(club)
        await db.commit()
        await db.refresh(club)
    return club


@router.get("/", response_model=ClubRead, dependencies=[Depends(get_current_user)])
async def get_club(db: AsyncSession = Depends(get_db)):
    return await _get_or_create_club(db)


@router.patch("/", response_model=ClubRead, dependencies=[Depends(require_admin)])
async def update_club(data: ClubUpdate, db: AsyncSession = Depends(get_db)):
    club = await _get_or_create_club(db)
    for field, value in data.model_dump(exclude_none=True).items():
        setattr(club, field, value)
    await db.commit()
    await db.refresh(club)
    return club

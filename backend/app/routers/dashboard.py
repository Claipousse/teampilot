from datetime import date
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from app.dependencies.db import get_db
from app.dependencies.auth import get_current_user, require_admin
from app.models.player import Player
from app.models.event import Event
from app.models.club import Club, Season
from app.models.staff import StaffMember
from app.schemas.club import ClubRead
from app.schemas.season import SeasonRead
from app.schemas.staff import StaffMemberRead
from app.schemas.event import EventRead
from app.schemas.player import PlayerRead
from app.schemas.dashboard import KPIsRead, AdminSummaryRead

router = APIRouter(prefix="/dashboard", tags=["dashboard"])


@router.get("/kpis", response_model=KPIsRead, dependencies=[Depends(get_current_user)])
async def kpis(db: AsyncSession = Depends(get_db)):
    today = str(date.today())
    total     = await db.scalar(select(func.count()).select_from(Player).where(Player.is_active == True)) or 0
    available = await db.scalar(select(func.count()).select_from(Player).where(Player.is_active == True, Player.status == "Disponible")) or 0
    upcoming  = await db.scalar(select(func.count()).select_from(Event).where(Event.event_date >= today)) or 0
    return KPIsRead(total_players=total, available_players=available, upcoming_events_count=upcoming)


@router.get("/upcoming-events", response_model=list[EventRead], dependencies=[Depends(get_current_user)])
async def upcoming_events(db: AsyncSession = Depends(get_db)):
    today = str(date.today())
    result = await db.execute(
        select(Event).where(Event.event_date >= today).order_by(Event.event_date, Event.event_time).limit(5)
    )
    return result.scalars().all()


@router.get("/unavailable-players", response_model=list[PlayerRead], dependencies=[Depends(get_current_user)])
async def unavailable_players(db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Player).where(Player.is_active == True, Player.status != "Disponible")
    )
    return result.scalars().all()


@router.get("/admin-summary", response_model=AdminSummaryRead, dependencies=[Depends(require_admin)])
async def admin_summary(db: AsyncSession = Depends(get_db)):
    club_r = await db.execute(select(Club).where(Club.id == 1))
    club = club_r.scalar_one_or_none()
    season_r = await db.execute(select(Season).where(Season.is_active == True))
    season = season_r.scalar_one_or_none()
    staff_r = await db.execute(select(StaffMember).where(StaffMember.is_active == True))
    staff = staff_r.scalars().all()
    return AdminSummaryRead(
        club=ClubRead.model_validate(club) if club else None,
        season=SeasonRead.model_validate(season) if season else None,
        staff=[StaffMemberRead.model_validate(s) for s in staff],
    )

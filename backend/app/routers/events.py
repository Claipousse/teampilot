from datetime import date
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.dependencies.db import get_db
from app.dependencies.auth import get_current_user, require_admin
from app.models.event import Event
from app.models.user import User
from app.schemas.event import EventCreate, EventUpdate, EventRead

router = APIRouter(prefix="/events", tags=["events"])


@router.get("", response_model=list[EventRead], dependencies=[Depends(get_current_user)])
async def list_events(year: int = 0, month: int = 0, db: AsyncSession = Depends(get_db)):
    if year and month:
        prefix = f"{year}-{str(month).zfill(2)}"
        q = select(Event).where(Event.event_date.like(f"{prefix}%")).order_by(Event.event_date, Event.event_time)
    else:
        q = select(Event).order_by(Event.event_date, Event.event_time)
    result = await db.execute(q)
    return result.scalars().all()


@router.get("/upcoming", response_model=list[EventRead], dependencies=[Depends(get_current_user)])
async def upcoming_events(db: AsyncSession = Depends(get_db)):
    today = str(date.today())
    result = await db.execute(
        select(Event).where(Event.event_date >= today).order_by(Event.event_date, Event.event_time).limit(5)
    )
    return result.scalars().all()


@router.post("", response_model=EventRead)
async def create_event(
    data: EventCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    event = Event(**data.model_dump(), created_by=current_user.id)
    db.add(event)
    await db.commit()
    await db.refresh(event)
    return event


@router.patch("/{event_id}", response_model=EventRead, dependencies=[Depends(require_admin)])
async def update_event(event_id: int, data: EventUpdate, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Event).where(Event.id == event_id))
    event = result.scalar_one_or_none()
    if not event:
        raise HTTPException(status_code=404, detail="Événement introuvable")
    for field, value in data.model_dump(exclude_none=True).items():
        setattr(event, field, value)
    await db.commit()
    await db.refresh(event)
    return event


@router.delete("/{event_id}", dependencies=[Depends(require_admin)])
async def delete_event(event_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Event).where(Event.id == event_id))
    event = result.scalar_one_or_none()
    if not event:
        raise HTTPException(status_code=404, detail="Événement introuvable")
    await db.delete(event)
    await db.commit()
    return {"ok": True}

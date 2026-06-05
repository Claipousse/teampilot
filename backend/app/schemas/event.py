from typing import Literal
from pydantic import BaseModel, ConfigDict

EventTag = Literal["Match", "Entraînement", "Récupération", "Réunion"]


class EventCreate(BaseModel):
    title: str
    tag: EventTag
    event_date: str  # YYYY-MM-DD
    event_time: str  # HH:MM
    location: str | None = None
    notes: str | None = None


class EventUpdate(BaseModel):
    title: str | None = None
    tag: EventTag | None = None
    event_date: str | None = None
    event_time: str | None = None
    location: str | None = None
    notes: str | None = None


class EventRead(BaseModel):
    id: int
    title: str
    tag: str
    event_date: str
    event_time: str
    location: str | None
    notes: str | None
    model_config = ConfigDict(from_attributes=True)

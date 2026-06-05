from datetime import datetime, timezone
from sqlalchemy import Integer, String, DateTime, ForeignKey, Enum as SAEnum
from sqlalchemy.orm import Mapped, mapped_column
from app.database import Base

_now = lambda: datetime.now(timezone.utc)


class Event(Base):
    __tablename__ = "events"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    title: Mapped[str] = mapped_column(String, nullable=False)
    tag: Mapped[str] = mapped_column(
        SAEnum("Match", "Entraînement", "Récupération", "Réunion", name="event_tag"),
        nullable=False,
    )
    event_date: Mapped[str] = mapped_column(String, nullable=False, index=True)  # YYYY-MM-DD
    event_time: Mapped[str] = mapped_column(String, nullable=False, default="10:00")  # HH:MM
    location: Mapped[str | None] = mapped_column(String, nullable=True)
    notes: Mapped[str | None] = mapped_column(String, nullable=True)
    created_by: Mapped[int] = mapped_column(Integer, ForeignKey("users.id"), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=_now)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=_now, onupdate=_now)

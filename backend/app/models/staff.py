from datetime import datetime, timezone
from sqlalchemy import Integer, String, Boolean, DateTime
from sqlalchemy.orm import Mapped, mapped_column
from app.database import Base

_now = lambda: datetime.now(timezone.utc)

STAFF_ROLES = [
    "Coach Principal", "Coach Adjoint", "Préparateur Physique",
    "Médecin", "Kinésithérapeute", "Manager", "Modérateur",
    "Scout", "Analyste Vidéo", "Intendant", "Directeur Sportif",
    "Psychologue", "Dirigeant",
]


class StaffMember(Base):
    __tablename__ = "staff_members"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    first_name: Mapped[str] = mapped_column(String, nullable=False)
    last_name: Mapped[str] = mapped_column(String, nullable=False)
    role: Mapped[str] = mapped_column(String, nullable=False)
    email: Mapped[str | None] = mapped_column(String, unique=True, index=True, nullable=True)
    phone: Mapped[str | None] = mapped_column(String, nullable=True)
    since_date: Mapped[str | None] = mapped_column(String, nullable=True)  # YYYY-MM-DD
    photo_url: Mapped[str | None] = mapped_column(String, nullable=True)
    notes: Mapped[str | None] = mapped_column(String, nullable=True)
    is_admin: Mapped[bool] = mapped_column(Boolean, default=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=_now)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=_now, onupdate=_now)

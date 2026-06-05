from datetime import datetime, timezone
from sqlalchemy import Integer, String, Boolean, DateTime, Enum as SAEnum
from sqlalchemy.orm import Mapped, mapped_column
from app.database import Base

_now = lambda: datetime.now(timezone.utc)


class Player(Base):
    __tablename__ = "players"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    first_name: Mapped[str] = mapped_column(String, nullable=False)
    last_name: Mapped[str] = mapped_column(String, nullable=False)
    shirt_number: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    position: Mapped[str] = mapped_column(String, nullable=False)
    position_short: Mapped[str] = mapped_column(String, nullable=False)  # GK/DEF/MIL/ATT
    nationality: Mapped[str] = mapped_column(String, nullable=False, default="")
    nationality_flag: Mapped[str | None] = mapped_column(String, nullable=True)
    date_of_birth: Mapped[str | None] = mapped_column(String, nullable=True)  # YYYY-MM-DD
    height_cm: Mapped[int | None] = mapped_column(Integer, nullable=True)
    weight_kg: Mapped[int | None] = mapped_column(Integer, nullable=True)
    preferred_foot: Mapped[str | None] = mapped_column(String, nullable=True)
    photo_url: Mapped[str | None] = mapped_column(String, nullable=True)
    status: Mapped[str] = mapped_column(
        SAEnum("Disponible", "Blessé", "Suspendu", "Incertain", name="player_status"),
        nullable=False, default="Disponible",
    )
    injury_description: Mapped[str | None] = mapped_column(String, nullable=True)
    return_date_estimate: Mapped[str | None] = mapped_column(String, nullable=True)
    contract_end_date: Mapped[str | None] = mapped_column(String, nullable=True)  # YYYY-MM-DD
    academy: Mapped[str | None] = mapped_column(String, nullable=True)
    notes: Mapped[str | None] = mapped_column(String, nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=_now)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=_now, onupdate=_now)

    # Stats (denormalisées pour simplicité — une ligne par joueur)
    matches: Mapped[int] = mapped_column(Integer, default=0)
    goals: Mapped[int] = mapped_column(Integer, default=0)
    assists: Mapped[int] = mapped_column(Integer, default=0)
    yellow_cards: Mapped[int] = mapped_column(Integer, default=0)
    red_cards: Mapped[int] = mapped_column(Integer, default=0)
    minutes_played: Mapped[int] = mapped_column(Integer, default=0)
    clean_sheets: Mapped[int] = mapped_column(Integer, default=0)
    goals_conceded: Mapped[int] = mapped_column(Integer, default=0)

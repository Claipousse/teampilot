from datetime import datetime, timezone
from sqlalchemy import Integer, String, DateTime, ForeignKey, Boolean
from sqlalchemy.orm import Mapped, mapped_column
from app.database import Base

_now = lambda: datetime.now(timezone.utc)


class Notification(Base):
    __tablename__ = "notifications"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    kind: Mapped[str] = mapped_column(String, nullable=False)  # added | rescheduled | cancelled | message
    title: Mapped[str] = mapped_column(String, nullable=False)
    event_id: Mapped[int | None] = mapped_column(Integer, ForeignKey("events.id", ondelete="CASCADE"), nullable=True)
    event_date: Mapped[str | None] = mapped_column(String, nullable=True)  # YYYY-MM-DD
    tag: Mapped[str | None] = mapped_column(String, nullable=True)  # event tag or sender role
    is_read: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=_now)

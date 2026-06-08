from datetime import datetime, timezone
from sqlalchemy import Integer, String, Boolean, DateTime, ForeignKey, Text, Enum
from sqlalchemy.orm import Mapped, mapped_column
from app.database import Base

_now = lambda: datetime.now(timezone.utc)


class Conversation(Base):
    __tablename__ = "conversations"

    id:        Mapped[int]      = mapped_column(Integer, primary_key=True)
    name:      Mapped[str]      = mapped_column(String, nullable=False)
    category:  Mapped[str]      = mapped_column(Enum("team", "staff", name="conv_category"), nullable=False)
    role_type: Mapped[str]      = mapped_column(String, nullable=False)  # player|coach|staff|group|ai
    is_group:  Mapped[bool]     = mapped_column(Boolean, default=False)
    is_ai:     Mapped[bool]     = mapped_column(Boolean, default=False)
    initials:  Mapped[str]      = mapped_column(String, nullable=False)
    avatar_bg: Mapped[str]      = mapped_column(String, nullable=False)
    role:      Mapped[str|None] = mapped_column(String, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=_now)


class ConversationParticipant(Base):
    __tablename__ = "conversation_participants"

    id:              Mapped[int]  = mapped_column(Integer, primary_key=True)
    conversation_id: Mapped[int]  = mapped_column(Integer, ForeignKey("conversations.id"), nullable=False)
    user_id:         Mapped[int]  = mapped_column(Integer, ForeignKey("users.id"), nullable=False)
    hidden:          Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)


class Message(Base):
    __tablename__ = "messages"

    id:              Mapped[int]      = mapped_column(Integer, primary_key=True)
    conversation_id: Mapped[int]      = mapped_column(Integer, ForeignKey("conversations.id"), nullable=False)
    sender_id:       Mapped[int|None] = mapped_column(Integer, ForeignKey("users.id"), nullable=True)
    msg_type:        Mapped[str]      = mapped_column(Enum("text", "file", "system", name="msg_type"), nullable=False, default="text")
    text:            Mapped[str|None] = mapped_column(Text, nullable=True)
    created_at:      Mapped[datetime] = mapped_column(DateTime, default=_now)

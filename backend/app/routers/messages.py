from datetime import datetime, timezone, timedelta
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.dependencies.db import get_db
from app.dependencies.auth import get_current_user
from app.models.message import Conversation, ConversationParticipant, Message
from app.models.user import User
from app.schemas.message import ConversationRead, MessageRead, MessageCreate, ParticipantRead

router = APIRouter(prefix="/messages", tags=["messages"])


def _role_type(user: User) -> str:
    if user.is_admin:
        return "coach"
    return "staff" if user.type == "staff" else "player"


def _fmt_time(dt: datetime) -> str:
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=timezone.utc)
    now = datetime.now(timezone.utc)
    if now.date() == dt.date():
        return dt.strftime("%H:%M")
    if (now - dt) < timedelta(days=2):
        return "Hier"
    return dt.strftime("%d/%m")


@router.get("/conversations", response_model=list[ConversationRead])
async def list_conversations(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    part_ids_r = await db.execute(
        select(ConversationParticipant.conversation_id)
        .where(ConversationParticipant.user_id == current_user.id)
    )
    conv_ids = [r[0] for r in part_ids_r.all()]

    convs = (await db.execute(
        select(Conversation).where(Conversation.id.in_(conv_ids))
    )).scalars().all()

    result = []
    for conv in convs:
        last = (await db.execute(
            select(Message)
            .where(Message.conversation_id == conv.id)
            .order_by(Message.created_at.desc())
            .limit(1)
        )).scalar_one_or_none()

        members = None
        if conv.is_group:
            rows = (await db.execute(
                select(ConversationParticipant, User)
                .join(User, ConversationParticipant.user_id == User.id)
                .where(ConversationParticipant.conversation_id == conv.id)
            )).all()
            members = [
                ParticipantRead(
                    user_id=u.id,
                    first_name=u.first_name,
                    last_name=u.last_name,
                    initials=f"{u.first_name[0]}{u.last_name[0]}",
                    bg="bg-surface-container-high",
                    role_type=_role_type(u),
                    role=None,
                )
                for _, u in rows
            ]

        result.append(ConversationRead(
            id=conv.id, name=conv.name, category=conv.category,
            role_type=conv.role_type, is_group=conv.is_group, is_ai=conv.is_ai,
            initials=conv.initials, avatar_bg=conv.avatar_bg, role=conv.role,
            preview=last.text if last else None,
            time=_fmt_time(last.created_at) if last else None,
            members=members,
        ))

    return result


@router.get("/conversations/{conv_id}/messages", response_model=list[MessageRead])
async def list_messages(
    conv_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    msgs = (await db.execute(
        select(Message)
        .where(Message.conversation_id == conv_id)
        .order_by(Message.created_at)
    )).scalars().all()

    result = []
    for msg in msgs:
        extra: dict = {}
        if msg.sender_id:
            sender = (await db.execute(
                select(User).where(User.id == msg.sender_id)
            )).scalar_one_or_none()
            if sender:
                extra = dict(
                    sender_initials=f"{sender.first_name[0]}{sender.last_name[0]}",
                    sender_bg="bg-surface-container-high",
                    sender_name=f"{sender.first_name} {sender.last_name}",
                    sender_role_type=_role_type(sender),
                )
        result.append(MessageRead(
            id=msg.id, conversation_id=msg.conversation_id,
            sender_id=msg.sender_id, msg_type=msg.msg_type,
            text=msg.text, created_at=msg.created_at, **extra,
        ))
    return result


@router.post("/conversations/{conv_id}/messages", response_model=MessageRead)
async def send_message(
    conv_id: int,
    data: MessageCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    msg = Message(conversation_id=conv_id, sender_id=current_user.id, msg_type="text", text=data.text)
    db.add(msg)
    await db.commit()
    await db.refresh(msg)
    return MessageRead(
        id=msg.id, conversation_id=msg.conversation_id,
        sender_id=msg.sender_id, msg_type=msg.msg_type,
        text=msg.text, created_at=msg.created_at,
        sender_initials=f"{current_user.first_name[0]}{current_user.last_name[0]}",
        sender_bg="bg-surface-container-high",
        sender_name=f"{current_user.first_name} {current_user.last_name}",
        sender_role_type=_role_type(current_user),
    )

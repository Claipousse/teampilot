from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete as sa_delete
from app.dependencies.auth import get_current_user
from app.dependencies.db import get_db
from app.models.message import Conversation, ConversationParticipant, Message
from app.models.user import User
from app.schemas.message import MessageRead
from app.schemas.ai import AIChatRequest, AIChatResponse
from app.services.ai_service import chat_with_ai

router = APIRouter(prefix="/ai", tags=["ai"])

_AI_NAME   = "Tactical AI"
_AI_BG     = "bg-primary"
_AI_INITIALS = "✦"


async def _get_or_create_ai_conv(user: User, db: AsyncSession) -> Conversation:
    conv = (await db.execute(
        select(Conversation)
        .join(ConversationParticipant, ConversationParticipant.conversation_id == Conversation.id)
        .where(
            ConversationParticipant.user_id == user.id,
            Conversation.is_ai == True,
        )
    )).scalar_one_or_none()
    if conv:
        return conv

    conv = Conversation(
        name=_AI_NAME,
        category="staff",
        role_type="ai",
        is_group=False,
        is_ai=True,
        initials=_AI_INITIALS,
        avatar_bg=_AI_BG,
        role=None,
    )
    db.add(conv)
    await db.flush()
    db.add(ConversationParticipant(conversation_id=conv.id, user_id=user.id))
    await db.commit()
    await db.refresh(conv)
    return conv


def _user_role_type(user: User) -> str:
    if user.type == "player":
        return "player"
    if user.is_admin:
        return "coach"
    return "staff"


def _to_read(msg: Message, **extra) -> MessageRead:
    return MessageRead(
        id=msg.id,
        conversation_id=msg.conversation_id,
        sender_id=msg.sender_id,
        msg_type=msg.msg_type,
        text=msg.text,
        created_at=msg.created_at,
        **extra,
    )


@router.post("/chat", response_model=AIChatResponse)
async def ai_chat(
    data: AIChatRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    conv = await _get_or_create_ai_conv(current_user, db)

    user_msg = Message(
        conversation_id=conv.id,
        sender_id=current_user.id,
        msg_type="text",
        text=data.text,
    )
    db.add(user_msg)
    await db.flush()

    # Historique des 40 derniers messages (20 échanges)
    history_rows = (await db.execute(
        select(Message)
        .where(Message.conversation_id == conv.id, Message.id != user_msg.id)
        .order_by(Message.created_at.desc())
        .limit(40)
    )).scalars().all()
    history_rows.reverse()

    history = [
        {
            "role": "user" if m.sender_id is not None else "assistant",
            "content": m.text or "",
        }
        for m in history_rows
    ]

    try:
        ai_text = await chat_with_ai(data.text, history, db)
    except RuntimeError:
        await db.rollback()
        raise HTTPException(503, "Assistant temporairement indisponible")

    ai_msg = Message(
        conversation_id=conv.id,
        sender_id=None,
        msg_type="text",
        text=ai_text,
    )
    db.add(ai_msg)
    await db.commit()
    await db.refresh(user_msg)
    await db.refresh(ai_msg)

    user_initials = f"{current_user.first_name[0]}{current_user.last_name[0]}"

    return AIChatResponse(
        conversation_id=conv.id,
        user_message=_to_read(
            user_msg,
            sender_initials=user_initials,
            sender_bg="bg-surface-container-high",
            sender_name=f"{current_user.first_name} {current_user.last_name}",
            sender_role_type=_user_role_type(current_user),
        ),
        ai_message=_to_read(
            ai_msg,
            sender_initials=None,
            sender_bg=_AI_BG,
            sender_name=_AI_NAME,
            sender_role_type="ai",
        ),
    )


@router.get("/conversation", response_model=list[MessageRead])
async def get_ai_conversation(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    conv = await _get_or_create_ai_conv(current_user, db)
    msgs = (await db.execute(
        select(Message)
        .where(Message.conversation_id == conv.id)
        .order_by(Message.created_at)
    )).scalars().all()

    user_initials = f"{current_user.first_name[0]}{current_user.last_name[0]}"
    result = []
    for msg in msgs:
        if msg.sender_id is not None:
            result.append(_to_read(
                msg,
                sender_initials=user_initials,
                sender_bg="bg-surface-container-high",
                sender_name=f"{current_user.first_name} {current_user.last_name}",
                sender_role_type=_user_role_type(current_user),
            ))
        else:
            result.append(_to_read(
                msg,
                sender_initials=None,
                sender_bg=_AI_BG,
                sender_name=_AI_NAME,
                sender_role_type="ai",
            ))
    return result


@router.delete("/conversation")
async def clear_ai_conversation(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    conv = (await db.execute(
        select(Conversation)
        .join(ConversationParticipant, ConversationParticipant.conversation_id == Conversation.id)
        .where(
            ConversationParticipant.user_id == current_user.id,
            Conversation.is_ai == True,
        )
    )).scalar_one_or_none()
    if conv:
        await db.execute(sa_delete(Message).where(Message.conversation_id == conv.id))
        await db.commit()
    return {"ok": True}

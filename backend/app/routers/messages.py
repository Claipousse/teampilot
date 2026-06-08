from datetime import datetime, timezone, timedelta
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, delete as sa_delete
from app.dependencies.db import get_db
from app.dependencies.auth import get_current_user
from app.models.message import Conversation, ConversationParticipant, Message
from app.models.notification import Notification
from app.models.user import User
from app.models.staff import StaffMember
from app.schemas.message import (
    ConversationRead, MessageRead, MessageCreate, ParticipantRead,
    UserCard, UsersGrouped, ConversationCreate,
)

router = APIRouter(prefix="/messages", tags=["messages"])


def _role_type(user: User) -> str:
    if user.type == "player":
        return "player"
    if user.is_admin:
        return "coach"
    return "staff"


def _role_type_with_sm(user: User, sm: StaffMember | None) -> str:
    if user.type == "player":
        return "player"
    if user.is_admin or (sm and "coach" in sm.role.lower()):
        return "coach"
    return "staff"


def _fmt_time(dt: datetime) -> str:
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=timezone.utc)
    now = datetime.now(timezone.utc)
    if now.date() == dt.date():
        return dt.strftime("%H:%M")
    if (now - dt) < timedelta(days=2):
        return "Hier"
    return dt.strftime("%d/%m")


# ── Lister les utilisateurs pour créer une conversation ──────────────────────

@router.get("/users", response_model=UsersGrouped)
async def list_users_for_conversation(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    rows = (await db.execute(
        select(User, StaffMember)
        .outerjoin(StaffMember, User.staff_id == StaffMember.id)
        .where(User.id != current_user.id, User.is_active == True)
        .order_by(User.first_name)
    )).all()

    coaches, staff_list, players = [], [], []
    for user, sm in rows:
        card = UserCard(
            id=user.id,
            first_name=user.first_name,
            last_name=user.last_name,
            user_type=user.type,
            is_admin=user.is_admin,
            role=sm.role if sm else None,
        )
        if user.type == "player":
            players.append(card)
        elif user.is_admin or (sm and "coach" in sm.role.lower()):
            coaches.append(card)
        else:
            staff_list.append(card)

    return UsersGrouped(coaches=coaches, staff=staff_list, players=players)


# ── Lister les conversations ──────────────────────────────────────────────────

@router.get("/conversations", response_model=list[ConversationRead])
async def list_conversations(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    conv_ids = [r[0] for r in (await db.execute(
        select(ConversationParticipant.conversation_id)
        .where(
            ConversationParticipant.user_id == current_user.id,
            ConversationParticipant.hidden == False,
        )
    )).all()]

    convs = (await db.execute(
        select(Conversation).where(Conversation.id.in_(conv_ids))
    )).scalars().all()

    result_with_time = []
    for conv in convs:
        last = (await db.execute(
            select(Message)
            .where(Message.conversation_id == conv.id)
            .order_by(Message.created_at.desc())
            .limit(1)
        )).scalar_one_or_none()

        display_name     = conv.name
        display_initials = conv.initials
        display_role     = conv.role
        members = None

        if conv.is_group:
            rows = (await db.execute(
                select(ConversationParticipant, User)
                .join(User, ConversationParticipant.user_id == User.id)
                .where(ConversationParticipant.conversation_id == conv.id)
            )).all()
            members = [
                ParticipantRead(
                    user_id=u.id, first_name=u.first_name, last_name=u.last_name,
                    initials=f"{u.first_name[0]}{u.last_name[0]}",
                    bg="bg-surface-container-high",
                    role_type=_role_type(u), role=None,
                )
                for _, u in rows
            ]
        elif not conv.is_ai:
            # Résoudre nom/initiales depuis l'AUTRE participant (pas celui qui consulte)
            other = (await db.execute(
                select(User, StaffMember)
                .outerjoin(StaffMember, User.staff_id == StaffMember.id)
                .join(ConversationParticipant, ConversationParticipant.user_id == User.id)
                .where(
                    ConversationParticipant.conversation_id == conv.id,
                    ConversationParticipant.user_id != current_user.id,
                )
            )).first()
            if other:
                other_user, other_sm = other
                display_name     = f"{other_user.first_name} {other_user.last_name}"
                display_initials = f"{other_user.first_name[0]}{other_user.last_name[0]}"
                display_role     = other_sm.role if other_sm else None

        sort_key = last.created_at if last else conv.created_at
        result_with_time.append((
            ConversationRead(
                id=conv.id, name=display_name, category=conv.category,
                role_type=conv.role_type, is_group=conv.is_group, is_ai=conv.is_ai,
                initials=display_initials, avatar_bg=conv.avatar_bg, role=display_role,
                preview=last.text if last else None,
                time=_fmt_time(last.created_at) if last else None,
                members=members,
            ),
            sort_key,
        ))

    result_with_time.sort(key=lambda x: x[1], reverse=True)
    return [r for r, _ in result_with_time]


# ── Créer une conversation ────────────────────────────────────────────────────

@router.post("/conversations", response_model=ConversationRead)
async def create_conversation(
    data: ConversationCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if not data.is_group:
        if len(data.participant_ids) != 1:
            raise HTTPException(400, "Une conversation individuelle nécessite 1 participant")

        partner_id = data.participant_ids[0]

        # Vérifier si une conversation 1:1 existe déjà
        curr_ids = {r[0] for r in (await db.execute(
            select(ConversationParticipant.conversation_id)
            .where(ConversationParticipant.user_id == current_user.id)
        )).all()}
        part_ids = {r[0] for r in (await db.execute(
            select(ConversationParticipant.conversation_id)
            .where(ConversationParticipant.user_id == partner_id)
        )).all()}
        shared = curr_ids & part_ids
        if shared:
            existing = (await db.execute(
                select(Conversation).where(
                    Conversation.id.in_(shared),
                    Conversation.is_group == False,
                    Conversation.is_ai == False,
                ).limit(1)
            )).scalar_one_or_none()
            if existing:
                # Unhide for current user if they had previously hidden it
                my_part = (await db.execute(
                    select(ConversationParticipant).where(
                        ConversationParticipant.conversation_id == existing.id,
                        ConversationParticipant.user_id == current_user.id,
                    )
                )).scalar_one_or_none()
                if my_part and my_part.hidden:
                    my_part.hidden = False
                    await db.commit()
                # Fetch partner info so name/initials are correct for the requesting user
                p = (await db.execute(
                    select(User, StaffMember)
                    .outerjoin(StaffMember, User.staff_id == StaffMember.id)
                    .where(User.id == partner_id)
                )).first()
                p_name     = f"{p[0].first_name} {p[0].last_name}" if p else existing.name
                p_initials = f"{p[0].first_name[0]}{p[0].last_name[0]}" if p else existing.initials
                p_role     = p[1].role if p and p[1] else existing.role
                last = (await db.execute(
                    select(Message).where(Message.conversation_id == existing.id)
                    .order_by(Message.created_at.desc()).limit(1)
                )).scalar_one_or_none()
                return ConversationRead(
                    id=existing.id, name=p_name, category=existing.category,
                    role_type=existing.role_type, is_group=False, is_ai=False,
                    initials=p_initials, avatar_bg=existing.avatar_bg, role=p_role,
                    preview=last.text if last else None,
                    time=_fmt_time(last.created_at) if last else None,
                )

        partner = (await db.execute(select(User).where(User.id == partner_id))).scalar_one_or_none()
        if not partner:
            raise HTTPException(404, "Utilisateur introuvable")
        partner_sm = None
        if partner.staff_id:
            partner_sm = (await db.execute(
                select(StaffMember).where(StaffMember.id == partner.staff_id)
            )).scalar_one_or_none()

        conv = Conversation(
            name=f"{partner.first_name} {partner.last_name}",
            category="team" if partner.type == "player" else "staff",
            role_type=_role_type_with_sm(partner, partner_sm),
            is_group=False, is_ai=False,
            initials=f"{partner.first_name[0]}{partner.last_name[0]}",
            avatar_bg="bg-surface-container-high",
            role=partner_sm.role if partner_sm else None,
        )
        db.add(conv)
        await db.flush()
        for uid in [current_user.id, partner_id]:
            db.add(ConversationParticipant(conversation_id=conv.id, user_id=uid))

    else:
        if len(data.participant_ids) < 2:
            raise HTTPException(400, "Un groupe nécessite au moins 2 participants")

        members_users = (await db.execute(
            select(User).where(User.id.in_(data.participant_ids))
        )).scalars().all()

        has_player  = any(u.type == "player" for u in members_users)
        category    = "team" if has_player else "staff"
        name        = data.group_name or ", ".join(u.first_name for u in members_users[:3]) + ("…" if len(members_users) > 3 else "")
        initials    = name[:2].upper()
        avatar_bg   = "bg-primary" if has_player else "bg-inverse-surface"

        conv = Conversation(
            name=name, category=category, role_type="group",
            is_group=True, is_ai=False,
            initials=initials, avatar_bg=avatar_bg,
        )
        db.add(conv)
        await db.flush()
        for uid in [current_user.id] + data.participant_ids:
            db.add(ConversationParticipant(conversation_id=conv.id, user_id=uid))

    await db.commit()
    await db.refresh(conv)

    members = None
    if conv.is_group:
        rows = (await db.execute(
            select(ConversationParticipant, User)
            .join(User, ConversationParticipant.user_id == User.id)
            .where(ConversationParticipant.conversation_id == conv.id)
        )).all()
        members = [
            ParticipantRead(
                user_id=u.id, first_name=u.first_name, last_name=u.last_name,
                initials=f"{u.first_name[0]}{u.last_name[0]}",
                bg="bg-surface-container-high", role_type=_role_type(u), role=None,
            )
            for _, u in rows
        ]

    return ConversationRead(
        id=conv.id, name=conv.name, category=conv.category,
        role_type=conv.role_type, is_group=conv.is_group, is_ai=conv.is_ai,
        initials=conv.initials, avatar_bg=conv.avatar_bg, role=conv.role,
        preview=None, time=None, members=members,
    )


# ── Masquer une conversation (soft-hide pour l'utilisateur courant) ───────────

@router.post("/conversations/{conv_id}/leave")
async def leave_conversation(
    conv_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    part = (await db.execute(
        select(ConversationParticipant).where(
            ConversationParticipant.conversation_id == conv_id,
            ConversationParticipant.user_id == current_user.id,
        )
    )).scalar_one_or_none()
    if not part:
        raise HTTPException(404, "Conversation introuvable")
    part.hidden = True
    await db.commit()
    return {"ok": True}


# ── Supprimer une conversation vide (cleanup) ────────────────────────────────

@router.delete("/conversations/{conv_id}")
async def delete_conversation(
    conv_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    msg_count = (await db.execute(
        select(func.count()).where(Message.conversation_id == conv_id)
    )).scalar()
    if msg_count and msg_count > 0:
        raise HTTPException(400, "Impossible de supprimer une conversation non vide")

    await db.execute(sa_delete(ConversationParticipant).where(ConversationParticipant.conversation_id == conv_id))
    await db.execute(sa_delete(Conversation).where(Conversation.id == conv_id))
    await db.commit()
    return {"ok": True}


# ── Messages d'une conversation ───────────────────────────────────────────────

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


# ── Envoyer un message ────────────────────────────────────────────────────────

@router.post("/conversations/{conv_id}/messages", response_model=MessageRead)
async def send_message(
    conv_id: int,
    data: MessageCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    msg = Message(conversation_id=conv_id, sender_id=current_user.id, msg_type="text", text=data.text)
    db.add(msg)
    await db.flush()

    parts = (await db.execute(
        select(ConversationParticipant).where(
            ConversationParticipant.conversation_id == conv_id,
            ConversationParticipant.user_id != current_user.id,
            ConversationParticipant.hidden == False,
        )
    )).scalars().all()
    sender_name = f"{current_user.first_name} {current_user.last_name}"
    preview = data.text if len(data.text) <= 80 else data.text[:77] + "…"
    sender_tag = _role_type(current_user)
    for part in parts:
        db.add(Notification(
            user_id=part.user_id,
            kind="message",
            title=f"{sender_name} : {preview}",
            tag=sender_tag,
        ))

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

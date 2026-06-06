from pydantic import BaseModel
from datetime import datetime


class ParticipantRead(BaseModel):
    user_id:    int
    first_name: str
    last_name:  str
    initials:   str
    bg:         str
    role_type:  str
    role:       str | None

    model_config = {"from_attributes": True}


class MessageRead(BaseModel):
    id:              int
    conversation_id: int
    sender_id:       int | None
    msg_type:        str
    text:            str | None
    created_at:      datetime
    sender_initials: str | None = None
    sender_bg:       str | None = None
    sender_name:     str | None = None
    sender_role_type: str | None = None

    model_config = {"from_attributes": True}


class MessageCreate(BaseModel):
    text: str


class ConversationRead(BaseModel):
    id:        int
    name:      str
    category:  str
    role_type: str
    is_group:  bool
    is_ai:     bool
    initials:  str
    avatar_bg: str
    role:      str | None
    preview:   str | None = None
    time:      str | None = None
    unread:    bool = False
    members:   list[ParticipantRead] | None = None

    model_config = {"from_attributes": True}


class UserCard(BaseModel):
    id:         int
    first_name: str
    last_name:  str
    user_type:  str        # "player" | "staff"
    is_admin:   bool
    role:       str | None = None

    model_config = {"from_attributes": True}


class UsersGrouped(BaseModel):
    coaches: list[UserCard]
    staff:   list[UserCard]
    players: list[UserCard]


class ConversationCreate(BaseModel):
    participant_ids: list[int]
    is_group:        bool = False
    group_name:      str | None = None

from pydantic import BaseModel
from .message import MessageRead


class AIChatRequest(BaseModel):
    text: str


class AIChatResponse(BaseModel):
    conversation_id: int
    user_message: MessageRead
    ai_message: MessageRead

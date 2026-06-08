from datetime import datetime
from pydantic import BaseModel, ConfigDict


class NotificationRead(BaseModel):
    id: int
    kind: str
    title: str
    tag: str | None
    event_id: int | None
    event_date: str | None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

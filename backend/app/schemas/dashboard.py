from pydantic import BaseModel
from app.schemas.club import ClubRead
from app.schemas.season import SeasonRead
from app.schemas.staff import StaffMemberRead


class KPIsRead(BaseModel):
    total_players: int
    available_players: int
    upcoming_events_count: int
    unread_messages: int = 0


class AdminSummaryRead(BaseModel):
    club: ClubRead | None
    season: SeasonRead | None
    staff: list[StaffMemberRead]

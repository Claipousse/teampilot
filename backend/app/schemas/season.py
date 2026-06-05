from typing import Literal
from pydantic import BaseModel, ConfigDict

SeasonStatus = Literal["À venir", "En cours", "Terminée"]


class SeasonCreate(BaseModel):
    start_date: str  # YYYY-MM-DD
    end_date: str
    competitions: str
    objective: str
    status: SeasonStatus = "À venir"


class SeasonUpdate(BaseModel):
    start_date: str | None = None
    end_date: str | None = None
    competitions: str | None = None
    objective: str | None = None
    status: SeasonStatus | None = None


class SeasonRead(BaseModel):
    id: int
    label: str
    start_date: str
    end_date: str
    competitions: str
    objective: str
    status: str
    is_active: bool
    model_config = ConfigDict(from_attributes=True)

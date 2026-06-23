from typing import Literal
from pydantic import BaseModel, ConfigDict

PlayerStatus = Literal["Disponible", "Blessé", "Suspendu", "Incertain"]


class PlayerCreate(BaseModel):
    first_name: str
    last_name: str
    shirt_number: int
    position: str
    position_short: str
    nationality: str
    nationality_flag: str | None = None
    date_of_birth: str | None = None
    height_cm: int | None = None
    weight_kg: int | None = None
    preferred_foot: str | None = None
    photo_url: str | None = None
    status: PlayerStatus = "Disponible"
    injury_description: str | None = None
    return_date_estimate: str | None = None
    contract_end_date: str | None = None
    academy: str | None = None
    notes: str | None = None


class PlayerUpdate(BaseModel):
    first_name: str | None = None
    last_name: str | None = None
    shirt_number: int | None = None
    position: str | None = None
    position_short: str | None = None
    nationality: str | None = None
    nationality_flag: str | None = None
    date_of_birth: str | None = None
    height_cm: int | None = None
    weight_kg: int | None = None
    preferred_foot: str | None = None
    photo_url: str | None = None
    status: PlayerStatus | None = None
    injury_description: str | None = None
    return_date_estimate: str | None = None
    contract_end_date: str | None = None
    academy: str | None = None
    notes: str | None = None
    matches: int | None = None
    goals: int | None = None
    assists: int | None = None
    yellow_cards: int | None = None
    red_cards: int | None = None
    minutes_played: int | None = None
    clean_sheets: int | None = None
    goals_conceded: int | None = None


class PlayerRead(BaseModel):
    id: int
    first_name: str
    last_name: str
    shirt_number: int
    position: str
    position_short: str
    nationality: str
    nationality_flag: str | None
    date_of_birth: str | None
    height_cm: int | None
    weight_kg: int | None
    preferred_foot: str | None
    photo_url: str | None
    status: str
    injury_description: str | None
    return_date_estimate: str | None
    contract_end_date: str | None
    academy: str | None
    notes: str | None
    matches: int
    goals: int
    assists: int
    yellow_cards: int
    red_cards: int
    minutes_played: int
    clean_sheets: int
    goals_conceded: int
    model_config = ConfigDict(from_attributes=True)


class PlayerCreatedResponse(PlayerRead):
    username: str
    temp_password: str

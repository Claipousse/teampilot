from pydantic import BaseModel, ConfigDict


class ClubUpdate(BaseModel):
    name: str | None = None
    founded_year: str | None = None
    league: str | None = None
    email: str | None = None
    phone: str | None = None
    address: str | None = None
    city: str | None = None


class ClubRead(BaseModel):
    id: int
    name: str
    founded_year: str
    league: str
    email: str
    phone: str
    address: str
    city: str
    logo_url: str | None
    model_config = ConfigDict(from_attributes=True)

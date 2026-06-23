from pydantic import BaseModel


class LoginRequest(BaseModel):
    username: str
    password: str


class UserResponse(BaseModel):
    id: int
    username: str | None
    first_name: str
    last_name: str
    is_admin: bool
    type: str
    player_id: int | None = None
    staff_id: int | None = None
    must_change_password: bool = False
    photo_url: str | None = None

    model_config = {"from_attributes": True}


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse


class ChangePasswordRequest(BaseModel):
    current_password: str | None = None  # None autorisé si must_change_password=True
    new_password: str

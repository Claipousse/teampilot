from pydantic import BaseModel, EmailStr, ConfigDict


class StaffMemberCreate(BaseModel):
    first_name: str
    last_name: str
    role: str
    email: EmailStr | None = None
    phone: str | None = None
    since_date: str | None = None
    notes: str | None = None
    is_admin: bool = False


class StaffMemberUpdate(BaseModel):
    first_name: str | None = None
    last_name: str | None = None
    role: str | None = None
    email: EmailStr | None = None
    phone: str | None = None
    since_date: str | None = None
    notes: str | None = None
    is_admin: bool | None = None


class StaffMemberRead(BaseModel):
    id: int
    first_name: str
    last_name: str
    role: str
    email: str | None
    phone: str | None
    since_date: str | None
    photo_url: str | None
    notes: str | None
    is_admin: bool
    model_config = ConfigDict(from_attributes=True)


class StaffCreatedResponse(StaffMemberRead):
    username: str
    temp_password: str


class ResetPasswordResponse(BaseModel):
    username: str
    temp_password: str

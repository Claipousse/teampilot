from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.dependencies.db import get_db
from app.dependencies.auth import get_current_user, require_admin
from app.models.staff import StaffMember
from app.models.user import User
from app.schemas.staff import StaffMemberCreate, StaffMemberUpdate, StaffMemberRead, StaffCreatedResponse, ResetPasswordResponse
from app.services.auth_service import hash_password, generate_temp_password, make_username_base

router = APIRouter(prefix="/staff", tags=["staff"])


async def _unique_username(base: str, db: AsyncSession) -> str:
    rows = (await db.execute(
        select(User.username).where(User.username.like(f"{base}%"))
    )).scalars().all()
    existing = {u for u in rows if u}
    if base not in existing:
        return base
    i = 2
    while f"{base}{i}" in existing:
        i += 1
    return f"{base}{i}"


@router.get("", response_model=list[StaffMemberRead], dependencies=[Depends(get_current_user)])
async def list_staff(search: str = "", role: str = "", db: AsyncSession = Depends(get_db)):
    q = select(StaffMember).where(StaffMember.is_active == True)
    if role:
        q = q.where(StaffMember.role == role)
    result = await db.execute(q)
    members = result.scalars().all()
    if search:
        s = search.lower()
        members = [m for m in members if s in f"{m.first_name} {m.last_name}".lower() or s in m.role.lower()]
    return members


@router.post("", response_model=StaffCreatedResponse, dependencies=[Depends(require_admin)])
async def create_staff(data: StaffMemberCreate, db: AsyncSession = Depends(get_db)):
    existing_sm = await db.execute(select(StaffMember).where(StaffMember.email == data.email))
    if existing_sm.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Email déjà utilisé")

    member = StaffMember(
        first_name=data.first_name,
        last_name=data.last_name,
        role=data.role,
        email=data.email,
        phone=data.phone,
        since_date=data.since_date,
        notes=data.notes,
        is_admin=data.is_admin,
    )
    db.add(member)
    await db.flush()

    base = make_username_base(data.first_name, data.last_name)
    username = await _unique_username(base, db)
    temp_password = generate_temp_password()

    user = User(
        username=username,
        hashed_password=hash_password(temp_password),
        first_name=data.first_name,
        last_name=data.last_name,
        is_admin=data.is_admin,
        type="staff",
        staff_id=member.id,
        must_change_password=True,
    )
    db.add(user)
    await db.commit()
    await db.refresh(member)

    result = StaffMemberRead.model_validate(member).model_dump()
    result["username"] = username
    result["temp_password"] = temp_password
    return result


@router.post("/{staff_id}/reset-password", response_model=ResetPasswordResponse, dependencies=[Depends(require_admin)])
async def reset_staff_password(staff_id: int, db: AsyncSession = Depends(get_db)):
    user = (await db.execute(select(User).where(User.staff_id == staff_id))).scalar_one_or_none()
    if not user:
        raise HTTPException(404, "Utilisateur introuvable")
    temp_password = generate_temp_password()
    user.hashed_password = hash_password(temp_password)
    user.must_change_password = True
    await db.commit()
    return {"username": user.username, "temp_password": temp_password}


@router.patch("/{staff_id}", response_model=StaffMemberRead, dependencies=[Depends(require_admin)])
async def update_staff(staff_id: int, data: StaffMemberUpdate, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(StaffMember).where(StaffMember.id == staff_id))
    member = result.scalar_one_or_none()
    if not member:
        raise HTTPException(status_code=404, detail="Membre introuvable")
    updates = data.model_dump(exclude_none=True)
    for field, value in updates.items():
        setattr(member, field, value)
    user_result = await db.execute(select(User).where(User.staff_id == staff_id))
    user = user_result.scalar_one_or_none()
    if user:
        if "is_admin" in updates:
            user.is_admin = updates["is_admin"]
        if "first_name" in updates:
            user.first_name = updates["first_name"]
        if "last_name" in updates:
            user.last_name = updates["last_name"]
    await db.commit()
    await db.refresh(member)
    return member


@router.delete("/{staff_id}", dependencies=[Depends(require_admin)])
async def delete_staff(staff_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(StaffMember).where(StaffMember.id == staff_id))
    member = result.scalar_one_or_none()
    if not member:
        raise HTTPException(status_code=404, detail="Membre introuvable")
    member.is_active = False
    user_result = await db.execute(select(User).where(User.staff_id == staff_id))
    user = user_result.scalar_one_or_none()
    if user:
        user.is_active = False
    await db.commit()
    return {"ok": True}

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.dependencies.db import get_db
from app.dependencies.auth import get_current_user, require_admin
from app.models.staff import StaffMember
from app.models.user import User
from app.schemas.staff import StaffMemberCreate, StaffMemberUpdate, StaffMemberRead
from app.services.auth_service import hash_password

router = APIRouter(prefix="/staff", tags=["staff"])


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


@router.post("", response_model=StaffMemberRead, dependencies=[Depends(require_admin)])
async def create_staff(data: StaffMemberCreate, db: AsyncSession = Depends(get_db)):
    existing = await db.execute(select(User).where(User.email == data.email))
    if existing.scalar_one_or_none():
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
    user = User(
        email=data.email,
        hashed_password=hash_password(data.password),
        first_name=data.first_name,
        last_name=data.last_name,
        is_admin=data.is_admin,
        type="staff",
        staff_id=member.id,
    )
    db.add(user)
    await db.commit()
    await db.refresh(member)
    return member


@router.patch("/{staff_id}", response_model=StaffMemberRead, dependencies=[Depends(require_admin)])
async def update_staff(staff_id: int, data: StaffMemberUpdate, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(StaffMember).where(StaffMember.id == staff_id))
    member = result.scalar_one_or_none()
    if not member:
        raise HTTPException(status_code=404, detail="Membre introuvable")
    updates = data.model_dump(exclude_none=True)
    password = updates.pop("password", None)
    for field, value in updates.items():
        setattr(member, field, value)
    user_result = await db.execute(select(User).where(User.staff_id == staff_id))
    user = user_result.scalar_one_or_none()
    if user:
        if "is_admin" in updates:
            user.is_admin = updates["is_admin"]
        if password:
            user.hashed_password = hash_password(password)
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

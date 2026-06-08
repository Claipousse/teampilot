from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.dependencies.db import get_db
from app.dependencies.auth import get_current_user
from app.models.user import User
from app.schemas.auth import LoginRequest, TokenResponse, UserResponse, ChangePasswordRequest
from app.services.auth_service import verify_password, hash_password, create_access_token

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/login", response_model=TokenResponse)
async def login(data: LoginRequest, db: AsyncSession = Depends(get_db)):
    user = await db.scalar(select(User).where(User.username == data.username.lower().strip()))
    if not user or not verify_password(data.password, user.hashed_password):
        raise HTTPException(401, "Identifiant ou mot de passe incorrect")
    if not user.is_active:
        raise HTTPException(401, "Compte désactivé")
    return {"access_token": create_access_token(user.id), "token_type": "bearer", "user": user}


@router.get("/me", response_model=UserResponse)
async def me(current_user: User = Depends(get_current_user)):
    return current_user


@router.post("/change-password")
async def change_password(
    data: ChangePasswordRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if len(data.new_password) < 8:
        raise HTTPException(400, "Le mot de passe doit contenir au moins 8 caractères")
    if not current_user.must_change_password:
        if not data.current_password:
            raise HTTPException(400, "Mot de passe actuel requis")
        if not verify_password(data.current_password, current_user.hashed_password):
            raise HTTPException(400, "Mot de passe actuel incorrect")
    current_user.hashed_password = hash_password(data.new_password)
    current_user.must_change_password = False
    await db.commit()
    return {"ok": True}

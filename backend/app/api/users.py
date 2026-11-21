from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from backend.app.core.database import get_db
from backend.app.models.models import User
from backend.app.schemas.schemas import UserResponse, UserSimpleResponse, UserUpdateRole
from backend.app.api.deps import get_current_user, require_role
from backend.app.core.config import settings

router = APIRouter(prefix="/users", tags=["Users"])

@router.get("", response_model=List[UserSimpleResponse])
def get_users(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    users = db.query(User).filter(User.is_active == True).offset(skip).limit(limit).all()
    return users

@router.get("/{user_id}", response_model=UserResponse)
def get_user_by_id(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    return user

@router.put("/{user_id}/role", response_model=UserResponse)
def update_user_role(
    user_id: int,
    role_data: UserUpdateRole,
    db: Session = Depends(get_db),
    admin_user: User = Depends(require_role([settings.ROLE_ADMIN]))
):
    if role_data.role not in [settings.ROLE_ADMIN, settings.ROLE_DEVELOPER, settings.ROLE_VIEWER]:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid role specified")
    
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    
    user.role = role_data.role
    db.commit()
    db.refresh(user)
    return user


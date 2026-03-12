from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select

from app.api.deps import CurrentUser
from app.db.session import get_session
from app.models.user import User
from app.schemas.user import UserResponse, UserUpdate, PasswordChange
from app.core.security import hash_password, verify_password

router = APIRouter(tags=["users"])


def user_to_response(user: User) -> UserResponse:
    return UserResponse(
        id=user.id,
        email=user.email,
        first_name=user.first_name,
        last_name=user.last_name,
        role=user.role,
        created_at=user.created_at,
        updated_at=user.updated_at,
    )


@router.get("/me", response_model=UserResponse)
def get_me(current_user: CurrentUser):
    """Return the current authenticated user."""
    return user_to_response(current_user)


@router.patch("/me", response_model=UserResponse)
def update_me(
    body: UserUpdate,
    current_user: CurrentUser,
    session: Session = Depends(get_session),
):
    """Update current user's first_name, last_name, email."""
    if body.email is not None:
        other = session.exec(select(User).where(User.email == body.email, User.id != current_user.id)).first()
        if other:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already in use",
            )
        current_user.email = body.email
    if body.first_name is not None:
        current_user.first_name = body.first_name
    if body.last_name is not None:
        current_user.last_name = body.last_name
    current_user.updated_at = datetime.utcnow()
    session.add(current_user)
    session.commit()
    session.refresh(current_user)
    return user_to_response(current_user)


@router.post("/me/password", status_code=status.HTTP_200_OK)
def change_password(
    body: PasswordChange,
    current_user: CurrentUser,
    session: Session = Depends(get_session),
):
    """Change current user's password. Requires current password verification."""
    if not verify_password(body.current_password, current_user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Current password is incorrect",
        )
    
    current_user.password_hash = hash_password(body.new_password)
    current_user.updated_at = datetime.utcnow()
    session.add(current_user)
    session.commit()
    
    return {"message": "Password changed successfully"}

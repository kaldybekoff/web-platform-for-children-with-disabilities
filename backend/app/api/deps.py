from typing import Annotated

from fastapi import Depends, HTTPException, Request, status
from sqlmodel import Session, select

from app.core.security import decode_access_token_full
from app.db.session import get_session
from app.models.user import User

_COOKIE_NAME = "access_token"
_CSRF_HEADER = "X-CSRF-Token"
_SAFE_METHODS = {"GET", "HEAD", "OPTIONS"}


def get_current_user(
    request: Request,
    session: Annotated[Session, Depends(get_session)],
) -> User:
    token = request.cookies.get(_COOKIE_NAME)
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
        )
    result = decode_access_token_full(token)
    if not result:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
        )
    user_id_str, csrf_in_token, token_version = result

    if request.method not in _SAFE_METHODS:
        csrf_header = request.headers.get(_CSRF_HEADER, "")
        if not csrf_header or csrf_header != csrf_in_token:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="CSRF token invalid",
            )

    try:
        user_id = int(user_id_str)
    except ValueError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")

    user = session.get(User, user_id)
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")
    if user.token_version != token_version:
        # password changed / reset since this token was issued
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Session expired")
    return user


CurrentUser = Annotated[User, Depends(get_current_user)]


def require_teacher_or_admin(user: User) -> None:
    """Raise 403 if user is not teacher or admin."""
    if user.role not in ("teacher", "admin"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Teacher or admin access required",
        )


def require_teacher(user: User) -> None:
    """Raise 403 if user is not teacher."""
    if user.role != "teacher":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Teacher access required",
        )


def require_admin(user: User) -> None:
    """Raise 403 if user is not admin."""
    if user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required",
        )


def user_to_response(user: User):
    """Convert User model to UserResponse schema."""
    from app.schemas.user import UserResponse
    return UserResponse(
        id=user.id,
        email=user.email,
        first_name=user.first_name,
        last_name=user.last_name,
        role=user.role,
        created_at=user.created_at,
        updated_at=user.updated_at,
        has_password=bool(user.password_hash),
        google_connected=bool(user.google_id),
    )


def is_enrolled(user: User, course_id: int, session: Session) -> bool:
    """Check if user can access a course. Teachers and admins always return True."""
    if user.role in ("teacher", "admin"):
        return True
    from app.models.enrollment import Enrollment
    enrollment = session.exec(
        select(Enrollment).where(
            Enrollment.student_id == user.id,
            Enrollment.course_id == course_id,
        )
    ).first()
    return enrollment is not None

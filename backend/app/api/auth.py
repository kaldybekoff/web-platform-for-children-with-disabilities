from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select

from app.db.session import get_session
from app.models.user import User
from app.schemas.user import TokenResponse, UserCreate, UserLogin, UserResponse
from app.core.security import hash_password, verify_password, create_access_token

router = APIRouter(prefix="/auth", tags=["auth"])


def user_to_response(user: User) -> UserResponse:
    return UserResponse(
        id=user.id,
        email=user.email,
        first_name=user.first_name,
        last_name=user.last_name,
        phone=user.phone,
        role=user.role,
        created_at=user.created_at,
        updated_at=user.updated_at,
    )


@router.post("/register", response_model=UserResponse)
def register(
    body: UserCreate,
    session: Session = Depends(get_session),
):
    """Create a new user. Admin role cannot be created via public registration."""
    # Prevent admin registration through public API
    if body.role == "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin accounts cannot be created through registration",
        )
    
    existing = session.exec(select(User).where(User.email == body.email)).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered",
        )
    user = User(
        email=body.email,
        password_hash=hash_password(body.password),
        first_name=body.first_name,
        last_name=body.last_name,
        phone=body.phone,
        role=body.role,
    )
    session.add(user)
    session.commit()
    session.refresh(user)
    return user_to_response(user)


@router.post("/login", response_model=TokenResponse)
def login(
    body: UserLogin,
    session: Session = Depends(get_session),
):
    """Validate email/password and return token + user."""
    user = session.exec(select(User).where(User.email == body.email)).first()
    if not user or not verify_password(body.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
        )
    token = create_access_token(str(user.id))
    return TokenResponse(access_token=token, user=user_to_response(user))

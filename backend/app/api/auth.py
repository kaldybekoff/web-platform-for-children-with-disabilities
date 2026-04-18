import secrets
from datetime import datetime, timedelta

from authlib.integrations.starlette_client import OAuth
from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, Request, status
from fastapi.responses import RedirectResponse
from sqlmodel import Session, select

from app.core.config import settings
from app.core.email import send_password_reset_email, send_verification_email
from app.core.limiter import limiter
from app.core.security import create_access_token, hash_password, verify_password
from app.db.session import get_session
from app.models.user import User
from app.schemas.user import (
    ForgotPasswordRequest,
    RegisterResponse,
    ResendVerificationRequest,
    ResetPasswordRequest,
    TokenResponse,
    UserCreate,
    UserLogin,
)
from app.api.deps import user_to_response

router = APIRouter(prefix="/auth", tags=["auth"])

_VERIFY_TTL_HOURS = 24
_RESET_TTL_HOURS = 1

# --- Google OAuth client (lazy-initialized only when credentials are set) ---
_oauth = OAuth()
_oauth.register(
    name="google",
    client_id=settings.google_client_id or "placeholder",
    client_secret=settings.google_client_secret or "placeholder",
    server_metadata_url="https://accounts.google.com/.well-known/openid-configuration",
    client_kwargs={"scope": "openid email profile"},
)


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _make_token(ttl_hours: int) -> tuple[str, datetime]:
    token = secrets.token_urlsafe(32)
    expires = datetime.utcnow() + timedelta(hours=ttl_hours)
    return token, expires


def _assign_verification_token(user: User) -> str:
    token, expires = _make_token(_VERIFY_TTL_HOURS)
    user.verification_token = token
    user.verification_token_expires = expires
    return token


def _assign_reset_token(user: User) -> str:
    token, expires = _make_token(_RESET_TTL_HOURS)
    user.reset_token = token
    user.reset_token_expires = expires
    return token


# ---------------------------------------------------------------------------
# Register / Login
# ---------------------------------------------------------------------------

@router.post("/register", response_model=RegisterResponse, status_code=status.HTTP_201_CREATED)
@limiter.limit("5/minute")
async def register(
    request: Request,
    body: UserCreate,
    background_tasks: BackgroundTasks,
    session: Session = Depends(get_session),
) -> RegisterResponse:
    if body.role == "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN,
                            detail="Admin accounts cannot be created through registration")

    existing = session.exec(select(User).where(User.email == body.email)).first()
    if existing:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST,
                            detail="Email already registered")

    user = User(
        email=body.email,
        password_hash=hash_password(body.password),
        first_name=body.first_name,
        last_name=body.last_name,
        role=body.role,
        is_verified=not settings.email_verification_enabled,
    )

    if settings.email_verification_enabled:
        token = _assign_verification_token(user)

    session.add(user)
    session.commit()
    session.refresh(user)

    if settings.email_verification_enabled:
        name = f"{body.first_name} {body.last_name}".strip() or body.email
        background_tasks.add_task(send_verification_email, body.email, name, token)

    return RegisterResponse(
        message="Registration successful. Please check your email to verify your account.",
        email=body.email,
    )


@router.post("/login", response_model=TokenResponse)
@limiter.limit("10/minute")
async def login(
    request: Request,
    body: UserLogin,
    session: Session = Depends(get_session),
) -> TokenResponse:
    user = session.exec(select(User).where(User.email == body.email)).first()
    if not user or not verify_password(body.password, user.password_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED,
                            detail="Incorrect email or password")

    if not user.is_verified:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Email not verified. Please check your inbox and click the verification link.",
        )

    token = create_access_token(str(user.id))
    return TokenResponse(access_token=token, user=user_to_response(user))


# ---------------------------------------------------------------------------
# Email verification
# ---------------------------------------------------------------------------

@router.get("/verify")
async def verify_email(token: str, session: Session = Depends(get_session)) -> RedirectResponse:
    frontend = settings.frontend_url.rstrip("/")
    user = session.exec(select(User).where(User.verification_token == token)).first()

    if not user:
        return RedirectResponse(url=f"{frontend}?verified=error", status_code=302)
    if user.is_verified:
        return RedirectResponse(url=f"{frontend}?verified=already", status_code=302)
    if user.verification_token_expires is None or user.verification_token_expires < datetime.utcnow():
        return RedirectResponse(url=f"{frontend}?verified=expired", status_code=302)

    user.is_verified = True
    user.verification_token = None
    user.verification_token_expires = None
    session.add(user)
    session.commit()
    return RedirectResponse(url=f"{frontend}?verified=1", status_code=302)


@router.post("/resend-verification", status_code=200)
@limiter.limit("3/minute")
async def resend_verification(
    request: Request,
    body: ResendVerificationRequest,
    background_tasks: BackgroundTasks,
    session: Session = Depends(get_session),
) -> dict:
    if not settings.email_verification_enabled:
        return {"message": "Email verification is not enabled."}

    user = session.exec(select(User).where(User.email == body.email)).first()
    if not user or user.is_verified:
        return {"message": "If that email exists and is unverified, a new link has been sent."}

    token = _assign_verification_token(user)
    session.add(user)
    session.commit()

    name = f"{user.first_name} {user.last_name}".strip() or user.email
    background_tasks.add_task(send_verification_email, user.email, name, token)
    return {"message": "If that email exists and is unverified, a new link has been sent."}


# ---------------------------------------------------------------------------
# Password reset
# ---------------------------------------------------------------------------

@router.post("/forgot-password", status_code=200)
@limiter.limit("3/minute")
async def forgot_password(
    request: Request,
    body: ForgotPasswordRequest,
    background_tasks: BackgroundTasks,
    session: Session = Depends(get_session),
) -> dict:
    """Send a password-reset email. Always 200 to prevent email enumeration."""
    user = session.exec(select(User).where(User.email == body.email)).first()
    if user and user.password_hash:  # OAuth-only users have no password to reset
        token = _assign_reset_token(user)
        session.add(user)
        session.commit()
        name = f"{user.first_name} {user.last_name}".strip() or user.email
        if settings.email_verification_enabled:
            background_tasks.add_task(send_password_reset_email, user.email, name, token)

    return {"message": "If an account with that email exists, a reset link has been sent."}


@router.post("/reset-password", status_code=200)
@limiter.limit("5/minute")
async def reset_password(
    request: Request,
    body: ResetPasswordRequest,
    session: Session = Depends(get_session),
) -> dict:
    user = session.exec(select(User).where(User.reset_token == body.token)).first()

    if not user:
        raise HTTPException(status_code=400, detail="Invalid or expired reset link.")
    if user.reset_token_expires is None or user.reset_token_expires < datetime.utcnow():
        raise HTTPException(status_code=400, detail="Reset link has expired. Please request a new one.")

    user.password_hash = hash_password(body.new_password)
    user.reset_token = None
    user.reset_token_expires = None
    user.is_verified = True  # verify account if it wasn't (edge case)
    session.add(user)
    session.commit()
    return {"message": "Password updated successfully."}


# ---------------------------------------------------------------------------
# Google OAuth
# ---------------------------------------------------------------------------

@router.get("/google")
async def google_login(request: Request) -> RedirectResponse:
    if not settings.google_oauth_enabled:
        raise HTTPException(status_code=501, detail="Google OAuth is not configured.")
    redirect_uri = f"{settings.backend_url.rstrip('/')}/api/auth/google/callback"
    return await _oauth.google.authorize_redirect(request, redirect_uri)


@router.get("/google/callback")
async def google_callback(
    request: Request,
    session: Session = Depends(get_session),
) -> RedirectResponse:
    frontend = settings.frontend_url.rstrip("/")
    try:
        token = await _oauth.google.authorize_access_token(request)
    except Exception:
        return RedirectResponse(url=f"{frontend}?auth_error=google_failed", status_code=302)

    user_info = token.get("userinfo") or {}
    email = user_info.get("email")
    if not email:
        return RedirectResponse(url=f"{frontend}?auth_error=google_failed", status_code=302)

    google_id = user_info.get("sub", "")
    full_name = user_info.get("name", "")
    parts = full_name.strip().split(" ", 1)
    first_name = parts[0] if parts else ""
    last_name = parts[1] if len(parts) > 1 else ""

    user = session.exec(select(User).where(User.email == email)).first()
    if not user:
        user = User(
            email=email,
            password_hash="",  # no password for OAuth-only accounts
            first_name=first_name,
            last_name=last_name,
            role="student",
            is_verified=True,
            google_id=google_id,
        )
        session.add(user)
        session.commit()
        session.refresh(user)
    else:
        if not user.google_id:
            user.google_id = google_id
        user.is_verified = True
        session.add(user)
        session.commit()

    jwt = create_access_token(str(user.id))
    return RedirectResponse(url=f"{frontend}?auth_token={jwt}", status_code=302)

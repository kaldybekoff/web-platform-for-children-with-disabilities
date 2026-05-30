"""Auth provider for the admin service: log in against the User table (role == admin)."""
import time
from collections import defaultdict
from threading import Lock

from sqlalchemy import func
from sqlmodel import Session, select
from starlette.requests import Request
from starlette.responses import Response
from starlette_admin.auth import AdminUser, AuthProvider
from starlette_admin.exceptions import LoginFailed

from app.core.limiter import client_ip
from app.core.security import DUMMY_PASSWORD_HASH, verify_password
from app.db.session import engine
from app.models.user import User

_SESSION_KEY = "admin_user_id"

# Brute-force protection for the admin login form. starlette-admin's AuthProvider
# isn't a route, so slowapi decorators don't apply — track failed attempts per IP
# in-process (the admin service runs as a single low-traffic instance).
_MAX_FAILED_ATTEMPTS = 5
_ATTEMPT_WINDOW_SECONDS = 300
_failed_attempts: dict[str, list[float]] = defaultdict(list)
_attempts_lock = Lock()


def _too_many_attempts(ip: str) -> bool:
    now = time.time()
    with _attempts_lock:
        recent = [t for t in _failed_attempts[ip] if now - t < _ATTEMPT_WINDOW_SECONDS]
        _failed_attempts[ip] = recent
        return len(recent) >= _MAX_FAILED_ATTEMPTS


def _record_failure(ip: str) -> None:
    with _attempts_lock:
        _failed_attempts[ip].append(time.time())


def _clear_failures(ip: str) -> None:
    with _attempts_lock:
        _failed_attempts.pop(ip, None)


class AdminAuth(AuthProvider):
    """Session-based auth that only allows users with role == "admin"."""

    async def login(
        self,
        username: str,
        password: str,
        remember_me: bool,
        request: Request,
        response: Response,
    ) -> Response:
        ip = client_ip(request)
        if _too_many_attempts(ip):
            raise LoginFailed("Слишком много попыток входа. Повторите попытку позже.")

        email = (username or "").strip().lower()
        with Session(engine) as session:
            user = session.exec(
                select(User).where(func.lower(User.email) == email)
            ).first()

        # Always spend one bcrypt verification so a missing/passwordless account
        # can't be told apart by response timing (anti-enumeration).
        if user and user.password_hash:
            password_ok = verify_password(password, user.password_hash)
        else:
            verify_password(password, DUMMY_PASSWORD_HASH)
            password_ok = False

        # Single generic message — never reveal whether the email exists or is a
        # non-admin account.
        if not user or not password_ok or user.role != "admin":
            _record_failure(ip)
            raise LoginFailed("Неверный email или пароль")

        _clear_failures(ip)
        request.session.update({_SESSION_KEY: user.id})
        return response

    async def is_authenticated(self, request: Request) -> bool:
        user_id = request.session.get(_SESSION_KEY)
        if user_id is None:
            return False
        with Session(engine) as session:
            user = session.get(User, user_id)
        if not user or user.role != "admin":
            return False
        request.state.admin_user = user
        return True

    def get_admin_user(self, request: Request) -> AdminUser:
        user: User = request.state.admin_user
        display_name = f"{user.first_name} {user.last_name}".strip() or user.email
        return AdminUser(username=display_name)

    async def logout(self, request: Request, response: Response) -> Response:
        request.session.clear()
        return response

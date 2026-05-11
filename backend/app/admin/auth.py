"""Auth provider for the admin service: log in against the User table (role == admin)."""
from sqlalchemy import func
from sqlmodel import Session, select
from starlette.requests import Request
from starlette.responses import Response
from starlette_admin.auth import AdminUser, AuthProvider
from starlette_admin.exceptions import LoginFailed

from app.core.security import verify_password
from app.db.session import engine
from app.models.user import User

_SESSION_KEY = "admin_user_id"


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
        email = (username or "").strip().lower()
        with Session(engine) as session:
            user = session.exec(
                select(User).where(func.lower(User.email) == email)
            ).first()

        if not user or not verify_password(password, user.password_hash):
            raise LoginFailed("Неверный email или пароль")
        if user.role != "admin":
            raise LoginFailed("Доступ только для администраторов")

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

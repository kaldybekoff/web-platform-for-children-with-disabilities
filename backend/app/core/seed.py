"""
Seed module for creating initial system data.
Admin account is created here, not through public registration.
"""
from sqlmodel import Session, select

from app.models.user import User
from app.core.security import hash_password
from app.core.config import settings


def seed_admin(session: Session) -> None:
    """
    Create admin user if it doesn't exist.
    This is the only way to create an admin account.
    Password is stored hashed, never in plain text.
    """
    # Админ создается только если явно заданы все необходимые переменные окружения.
    if not (
        settings.admin_email
        and settings.admin_password
        and settings.admin_first_name
        and settings.admin_last_name
    ):
        return
    existing_admin = session.exec(
        select(User).where(User.email == settings.admin_email)
    ).first()
    
    if existing_admin:
        return
    
    admin_user = User(
        email=settings.admin_email,
        password_hash=hash_password(settings.admin_password),
        first_name=settings.admin_first_name,
        last_name=settings.admin_last_name,
        role="admin",
        is_verified=True,
    )
    
    session.add(admin_user)
    session.commit()
    print(f"[SEED] Admin user created: {settings.admin_email}")


def run_seeds(session: Session) -> None:
    """Run all seed functions."""
    seed_admin(session)

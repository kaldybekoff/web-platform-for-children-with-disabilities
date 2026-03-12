"""
Seed module for creating initial system data.
Admin account is created here, not through public registration.
"""
import os
from sqlmodel import Session, select

from app.models.user import User
from app.core.security import hash_password


# Admin credentials from environment or defaults for development
ADMIN_EMAIL = os.getenv("ADMIN_EMAIL", "admin@gmail.com")
ADMIN_PASSWORD = os.getenv("ADMIN_PASSWORD", "Admin@1234")
ADMIN_FIRST_NAME = os.getenv("ADMIN_FIRST_NAME", "System")
ADMIN_LAST_NAME = os.getenv("ADMIN_LAST_NAME", "Admin")


def seed_admin(session: Session) -> None:
    """
    Create admin user if it doesn't exist.
    This is the only way to create an admin account.
    Password is stored hashed, never in plain text.
    """
    existing_admin = session.exec(
        select(User).where(User.email == ADMIN_EMAIL)
    ).first()
    
    if existing_admin:
        return
    
    admin_user = User(
        email=ADMIN_EMAIL,
        password_hash=hash_password(ADMIN_PASSWORD),
        first_name=ADMIN_FIRST_NAME,
        last_name=ADMIN_LAST_NAME,
        role="admin",
    )
    
    session.add(admin_user)
    session.commit()
    print(f"[SEED] Admin user created: {ADMIN_EMAIL}")


def run_seeds(session: Session) -> None:
    """Run all seed functions."""
    seed_admin(session)

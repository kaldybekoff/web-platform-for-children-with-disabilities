from datetime import datetime
from typing import Literal

from sqlmodel import Field, SQLModel

Role = Literal["student", "teacher", "admin"]


class User(SQLModel, table=True):
    """User table for auth and profile."""

    __tablename__ = "users"

    id: int | None = Field(default=None, primary_key=True)
    email: str = Field(unique=True, index=True)
    password_hash: str = Field()
    first_name: str = Field(default="")
    last_name: str = Field(default="")
    role: str = Field(default="student")  # values: student, teacher, admin
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

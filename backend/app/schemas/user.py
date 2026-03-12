from datetime import datetime
from typing import Literal

from pydantic import BaseModel, EmailStr, field_validator

Role = Literal["student", "teacher", "admin"]


class UserCreate(BaseModel):
    """Request body for registration."""

    email: EmailStr
    password: str
    first_name: str = ""
    last_name: str = ""
    role: Role = "student"

    @field_validator("password")
    @classmethod
    def validate_password(cls, v: str) -> str:
        if len(v) < 6:
            raise ValueError("Password must be at least 6 characters")
        return v


class UserLogin(BaseModel):
    """Request body for login."""

    email: EmailStr
    password: str


class UserUpdate(BaseModel):
    """Request body for PATCH /me."""

    first_name: str | None = None
    last_name: str | None = None
    email: EmailStr | None = None


class PasswordChange(BaseModel):
    """Request body for password change."""

    current_password: str
    new_password: str

    @field_validator("new_password")
    @classmethod
    def validate_new_password(cls, v: str) -> str:
        if len(v) < 6:
            raise ValueError("Password must be at least 6 characters")
        return v


class UserResponse(BaseModel):
    """User in API responses (no password)."""

    id: int
    email: str
    first_name: str
    last_name: str
    role: Role
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class TokenResponse(BaseModel):
    """Response for login."""

    access_token: str
    token_type: str = "bearer"
    user: UserResponse

import re
from datetime import datetime
from typing import Literal

from pydantic import BaseModel, EmailStr, field_validator

Role = Literal["student", "teacher", "admin"]


def validate_password_strength(password: str) -> str:
    """
    Validate password strength with the following requirements:
    - At least 6 characters
    - At least 1 uppercase letter
    - At least 1 lowercase letter
    - At least 1 digit
    - At least 1 special character (recommended)
    
    Returns the password if valid, raises ValueError otherwise.
    """
    errors = []
    
    if len(password) < 6:
        errors.append("at least 6 characters")
    
    if not re.search(r'[A-Z]', password):
        errors.append("at least 1 uppercase letter")
    
    if not re.search(r'[a-z]', password):
        errors.append("at least 1 lowercase letter")
    
    if not re.search(r'\d', password):
        errors.append("at least 1 digit")
    
    if not re.search(r'[!@#$%^&*(),.?":{}|<>_\-+=\[\]\\;\'`~]', password):
        errors.append("at least 1 special character (!@#$%^&* etc.)")
    
    if errors:
        raise ValueError(f"Password must contain: {', '.join(errors)}")
    
    return password


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
        return validate_password_strength(v)


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
        return validate_password_strength(v)


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


class RegisterResponse(BaseModel):
    """Response for successful registration (email verification pending)."""

    message: str
    email: str


class ResendVerificationRequest(BaseModel):
    """Request body for resending a verification email."""

    email: EmailStr


class ForgotPasswordRequest(BaseModel):
    """Request body for initiating password reset."""

    email: EmailStr


class ResetPasswordRequest(BaseModel):
    """Request body for completing password reset."""

    token: str
    new_password: str

    @field_validator("new_password")
    @classmethod
    def validate_new_password(cls, v: str) -> str:
        return validate_password_strength(v)

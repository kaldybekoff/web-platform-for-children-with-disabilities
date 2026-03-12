from datetime import datetime, timedelta

import bcrypt
from jose import JWTError, jwt

from app.core.config import settings

# bcrypt ограничивает пароль 72 байтами
MAX_PASSWORD_BYTES = 72


def _truncate_for_bcrypt(password: str) -> bytes:
    data = password.encode("utf-8")
    if len(data) > MAX_PASSWORD_BYTES:
        return data[:MAX_PASSWORD_BYTES]
    return data


def hash_password(password: str) -> str:
    data = _truncate_for_bcrypt(password)
    return bcrypt.hashpw(data, bcrypt.gensalt()).decode("utf-8")


def verify_password(plain_password: str, password_hash: str) -> bool:
    try:
        data = _truncate_for_bcrypt(plain_password)
        return bcrypt.checkpw(data, password_hash.encode("utf-8"))
    except Exception:
        return False


def create_access_token(subject: str) -> str:
    expire = datetime.utcnow() + timedelta(minutes=settings.access_token_expire_minutes)
    to_encode = {"sub": subject, "exp": expire}
    return jwt.encode(to_encode, settings.secret_key, algorithm=settings.algorithm)


def decode_access_token(token: str) -> str | None:
    try:
        payload = jwt.decode(token, settings.secret_key, algorithms=[settings.algorithm])
        sub = payload.get("sub")
        return str(sub) if sub else None
    except JWTError:
        return None

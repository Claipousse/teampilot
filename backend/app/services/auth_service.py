import re
import secrets
import string
import unicodedata
from datetime import datetime, timedelta, timezone
from jose import jwt
from passlib.context import CryptContext
from app.config import settings

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(plain: str, hashed: str) -> bool:
    return pwd_context.verify(plain, hashed)


def create_access_token(user_id: int) -> str:
    expire = datetime.now(timezone.utc) + timedelta(hours=settings.ACCESS_TOKEN_EXPIRE_HOURS)
    return jwt.encode(
        {"sub": str(user_id), "exp": expire},
        settings.SECRET_KEY,
        algorithm=settings.ALGORITHM,
    )


def decode_token(token: str) -> int:
    payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
    return int(payload["sub"])


def generate_temp_password() -> str:
    """Generate a 10-character random alphanumeric password."""
    return ''.join(secrets.choice(string.ascii_letters + string.digits) for _ in range(10))


def _slugify(s: str) -> str:
    s = unicodedata.normalize('NFD', s)
    s = ''.join(c for c in s if unicodedata.category(c) != 'Mn')
    s = s.lower()
    return re.sub(r'[^a-z0-9]', '', s)


def make_username_base(first_name: str, last_name: str) -> str:
    return f"{_slugify(first_name)}.{_slugify(last_name)}"

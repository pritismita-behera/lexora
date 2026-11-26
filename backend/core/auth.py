import hashlib
import hmac
import os
import secrets
from datetime import datetime, timedelta, timezone

import jwt

JWT_ALGORITHM = "HS256"


def hash_password(password: str) -> str:
    salt = secrets.token_bytes(16)
    digest = hashlib.scrypt(password.encode(), salt=salt, n=16384, r=8, p=1)
    return f"scrypt${salt.hex()}${digest.hex()}"


def verify_password(password: str, encoded: str) -> bool:
    try:
        _, salt_hex, digest_hex = encoded.split("$", 2)
        expected = hashlib.scrypt(password.encode(), salt=bytes.fromhex(salt_hex), n=16384, r=8, p=1)
        return hmac.compare_digest(expected.hex(), digest_hex)
    except (ValueError, TypeError):
        return False


def create_access_token(admin_id: int, email: str, role: str) -> str:
    secret = os.getenv("JWT_SECRET", "development-only-secret")
    payload = {"sub": str(admin_id), "email": email, "role": role, "exp": datetime.now(timezone.utc) + timedelta(hours=8)}
    return jwt.encode(payload, secret, algorithm=JWT_ALGORITHM)


def decode_access_token(token: str) -> dict:
    return jwt.decode(token, os.getenv("JWT_SECRET", "development-only-secret"), algorithms=[JWT_ALGORITHM])

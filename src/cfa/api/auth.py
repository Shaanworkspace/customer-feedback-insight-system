"""Auth: pbkdf2 passwords + HS256 JWT. Users persisted in MySQL via db.repo."""

import base64
import hashlib
import hmac
import json
import os
import time

from cfa.db.repo import create_user as _create_user, get_user_by_username as _get_user

SECRET = os.environ.get("JWT_SECRET", "dev-secret-change-me")
ALGO = "HS256"
EXPIRY_SECONDS = 3600


def _b64url_encode(raw: bytes) -> str:
    return base64.urlsafe_b64encode(raw).rstrip(b"=").decode("ascii")


def _b64url_decode(text: str) -> bytes:
    return base64.urlsafe_b64decode(text + "=" * (-len(text) % 4))


def hash_password(password: str):
    salt = os.urandom(16)
    digest = hashlib.pbkdf2_hmac("sha256", password.encode(), salt, 100_000)
    return salt.hex(), digest.hex()


def verify_password(password: str, salt_hex: str, hash_hex: str) -> bool:
    salt = bytes.fromhex(salt_hex)
    digest = hashlib.pbkdf2_hmac("sha256", password.encode(), salt, 100_000)
    return hmac.compare_digest(digest.hex(), hash_hex)


def add_user(username: str, password: str, first_name: str = "", email: str = "") -> bool:
    if not username or not password:
        return False
    salt, digest = hash_password(password)
    return _create_user(username, salt, digest, first_name, email) is not None


def authenticate(username: str, password: str) -> bool:
    user = _get_user(username)
    if not user:
        return False
    return verify_password(password, user.salt, user.hash)


def create_token(username: str) -> str:
    header = _b64url_encode(json.dumps({"alg": ALGO, "typ": "JWT"}).encode())
    payload = _b64url_encode(
        json.dumps(
            {"sub": username, "iat": int(time.time()), "exp": int(time.time()) + EXPIRY_SECONDS}
        ).encode()
    )
    signature = _b64url_encode(
        hmac.new(SECRET.encode(), f"{header}.{payload}".encode(), hashlib.sha256).digest()
    )
    return f"{header}.{payload}.{signature}"


def decode_token(token: str):
    try:
        header, payload, signature = token.split(".")
    except ValueError:
        return None
    expected = _b64url_encode(
        hmac.new(SECRET.encode(), f"{header}.{payload}".encode(), hashlib.sha256).digest()
    )
    if not hmac.compare_digest(expected, signature):
        return None
    try:
        data = json.loads(_b64url_decode(payload))
    except (ValueError, json.JSONDecodeError):
        return None
    if data.get("exp", 0) < int(time.time()):
        return None
    return data.get("sub")

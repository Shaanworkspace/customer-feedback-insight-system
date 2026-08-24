"""Database engine + session.

Connection comes from the DATABASE_URL env var:
  MySQL (Aiven): mysql+pymysql://user:pass@host:port/db
  SQLite fallback (local/tests, no env set): sqlite:///data/app.db

Aiven requires SSL; for mysql URLs we pass ssl via connect_args.
A local .env file is loaded if present (gitignored, never committed).
"""

import os

from sqlalchemy import create_engine
from sqlalchemy.orm import scoped_session, sessionmaker

DEFAULT_SQLITE = "sqlite:///data/app.db"


def _load_dotenv() -> None:
    path = os.path.join(os.getcwd(), ".env")
    if not os.path.exists(path):
        return
    with open(path) as fh:
        for line in fh:
            line = line.strip()
            if not line or line.startswith("#") or "=" not in line:
                continue
            key, val = line.split("=", 1)
            key, val = key.strip(), val.strip().strip('"').strip("'")
            if key and key not in os.environ:
                os.environ[key] = val


_load_dotenv()


def _build_url() -> str:
    url = os.environ.get("DATABASE_URL")
    if not url:
        os.makedirs("data", exist_ok=True)
        return DEFAULT_SQLITE
    return url.split("?", 1)[0]


_URL = _build_url()
_CONNECT_ARGS: dict = {}
if _URL.startswith("sqlite"):
    _db_path = _URL[len("sqlite:///"):] if _URL.startswith("sqlite:///") else _URL[len("sqlite://"):]
    if _db_path and not os.path.isabs(_db_path):
        _db_path = os.path.join(os.getcwd(), _db_path)
    os.makedirs(os.path.dirname(_db_path) or ".", exist_ok=True)
elif _URL.startswith("mysql"):
    _CONNECT_ARGS = {"ssl": {"verify_mode": False, "check_hostname": False}, "connect_timeout": 15}

engine = create_engine(_URL, connect_args=_CONNECT_ARGS, pool_pre_ping=True, future=True)
SessionLocal = scoped_session(sessionmaker(bind=engine, autoflush=False, future=True))


def init_db() -> None:
    from cfa.db import models

    models.Base.metadata.create_all(engine)

    # Safe, idempotent migration for columns added after first release.
    try:
        from sqlalchemy import inspect, text

        existing = {c["name"] for c in inspect(engine).get_columns("users")}
        with engine.begin() as conn:
            if "first_name" not in existing:
                conn.execute(text("ALTER TABLE users ADD COLUMN first_name VARCHAR(64)"))
            if "email" not in existing:
                conn.execute(text("ALTER TABLE users ADD COLUMN email VARCHAR(255)"))
    except Exception:
        # inspect/alter unsupported on this backend; create_all already ran.
        pass


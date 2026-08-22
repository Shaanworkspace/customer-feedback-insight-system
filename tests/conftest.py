import os

os.environ["DATABASE_URL"] = "sqlite:///data/test.db"

from cfa.db import init_db
from cfa.db.core import engine
from cfa.db.models import Base

if os.path.exists("data/test.db"):
    os.remove("data/test.db")
Base.metadata.create_all(engine)

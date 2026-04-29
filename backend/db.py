from __future__ import annotations

import os
from contextlib import contextmanager

from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker


load_dotenv()

BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), os.pardir))


def _build_database_url() -> str:
    direct_url = os.getenv("DATABASE_URL") or os.getenv("DB_URL")
    if direct_url:
        return direct_url

    if any(os.getenv(name) for name in ("DB_USER", "DB_PASSWORD", "DB_HOST", "DB_PORT", "DB_NAME")):
        driver = os.getenv("DB_DRIVER", "mysql+pymysql")
        user = os.getenv("DB_USER", "root")
        password = os.getenv("DB_PASSWORD", "")
        host = os.getenv("DB_HOST", "127.0.0.1")
        port = os.getenv("DB_PORT", "3306")
        database = os.getenv("DB_NAME", "goeats_food")
        return f"{driver}://{user}:{password}@{host}:{port}/{database}"

    sqlite_path = os.path.join(BASE_DIR, "goeats_food_dev.db")
    return f"sqlite:///{sqlite_path}"


DATABASE_URL = _build_database_url()

engine_kwargs = {"pool_pre_ping": True, "future": True}
if DATABASE_URL.startswith("sqlite"):
    engine_kwargs["connect_args"] = {"check_same_thread": False}

engine = create_engine(DATABASE_URL, **engine_kwargs)
SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False, future=True)
Base = declarative_base()


@contextmanager
def session_scope():
    session = SessionLocal()
    try:
        yield session
        session.commit()
    except Exception:
        session.rollback()
        raise
    finally:
        session.close()

from collections.abc import Generator

from sqlalchemy import text
from sqlalchemy.exc import SQLAlchemyError
from sqlmodel import Session, SQLModel, create_engine

import app.models  # noqa: F401
from app.config import get_settings

settings = get_settings()

engine = create_engine(
    settings.sqlalchemy_database_url,
    echo=settings.database_echo,
    pool_pre_ping=True,
)


def init_database() -> None:
    SQLModel.metadata.create_all(engine)
    from app.services.tags import ensure_system_tags

    with Session(engine) as session:
        ensure_system_tags(session)


def get_session() -> Generator[Session, None, None]:
    with Session(engine) as session:
        yield session


def check_database() -> tuple[bool, str | None]:
    try:
        with engine.connect() as connection:
            connection.execute(text("SELECT 1"))
        return True, None
    except SQLAlchemyError as exc:
        return False, str(exc)

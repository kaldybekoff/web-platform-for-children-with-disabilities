"""Database session and engine configuration."""
from sqlmodel import Session, create_engine, SQLModel

from app.core.config import settings

# Import all models so SQLModel discovers them for table creation (SQLite)
# Alembic остается основным механизмом миграций для PostgreSQL.
from app.models import (  # noqa: F401
    User,
    Course,
    Lesson,
    Enrollment,
    Quiz,
    Question,
    Answer,
    QuizAttempt,
    LessonProgress,
    News,
    SuccessPost,
    SuccessPostLike,
)

_connect_args = {}
if "sqlite" in settings.database_url:
    _connect_args["check_same_thread"] = False

engine = create_engine(
    settings.database_url,
    echo=False,
    connect_args=_connect_args,
)


def create_db_and_tables():
    """Create tables (for SQLite on first run)."""
    SQLModel.metadata.create_all(engine)


def get_session():
    """Dependency that yields a database session."""
    with Session(engine) as session:
        yield session

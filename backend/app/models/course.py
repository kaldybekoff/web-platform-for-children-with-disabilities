from datetime import datetime

from sqlmodel import Field, SQLModel


class Course(SQLModel, table=True):
    """Course table."""

    __tablename__ = "courses"

    id: int | None = Field(default=None, primary_key=True)
    title: str = Field()
    description: str = Field(default="")
    level: str = Field(default="beginner")  # e.g. beginner, intermediate, advanced
    teacher_id: int = Field(foreign_key="users.id")
    image_url: str | None = Field(default=None)
    created_at: datetime = Field(default_factory=datetime.utcnow)

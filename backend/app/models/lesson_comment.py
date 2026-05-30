from datetime import datetime

from sqlmodel import Field, SQLModel


class LessonComment(SQLModel, table=True):
    """Comments on lessons. parent_id=None means top-level question; set to answer another comment."""

    __tablename__ = "lesson_comments"

    id: int | None = Field(default=None, primary_key=True)
    lesson_id: int = Field(foreign_key="lessons.id", index=True)
    user_id: int = Field(foreign_key="users.id")
    parent_id: int | None = Field(default=None, foreign_key="lesson_comments.id", index=True)
    content: str = Field()
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

from datetime import datetime

from sqlmodel import Field, SQLModel


class Notification(SQLModel, table=True):
    """In-app notification for a user."""

    __tablename__ = "notifications"

    id: int | None = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="users.id", index=True)
    # "comment_reply" | "new_lesson"
    type: str = Field()
    title: str = Field()
    body: str = Field()
    # optional deep-link data
    lesson_id: int | None = Field(default=None, foreign_key="lessons.id")
    is_read: bool = Field(default=False)
    created_at: datetime = Field(default_factory=datetime.utcnow)

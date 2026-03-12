from datetime import datetime

from sqlmodel import Field, SQLModel


class Lesson(SQLModel, table=True):
    """Lesson table, belongs to a course."""

    __tablename__ = "lessons"

    id: int | None = Field(default=None, primary_key=True)
    title: str = Field()
    content: str = Field(default="")
    course_id: int = Field(foreign_key="courses.id")
    order: int = Field(default=0)
    
    # Video and accessibility fields
    video_url: str | None = Field(default=None)
    subtitle_url: str | None = Field(default=None)
    has_sign_language: bool = Field(default=False)
    duration_seconds: int | None = Field(default=None)
    
    # Demo lesson flag - demo lessons are sample content for new users
    is_demo: bool = Field(default=False)
    
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

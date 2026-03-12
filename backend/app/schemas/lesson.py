from datetime import datetime

from pydantic import BaseModel


class LessonCreate(BaseModel):
    """Request body for creating a lesson."""

    title: str
    content: str = ""
    course_id: int
    order: int = 0
    video_url: str | None = None
    subtitle_url: str | None = None
    has_sign_language: bool = False
    duration_seconds: int | None = None
    is_demo: bool = False


class LessonUpdate(BaseModel):
    """Request body for updating a lesson."""

    title: str | None = None
    content: str | None = None
    order: int | None = None
    video_url: str | None = None
    subtitle_url: str | None = None
    has_sign_language: bool | None = None
    duration_seconds: int | None = None
    is_demo: bool | None = None


class LessonResponse(BaseModel):
    """Lesson in API responses."""

    id: int
    title: str
    content: str
    course_id: int
    order: int
    video_url: str | None = None
    subtitle_url: str | None = None
    has_sign_language: bool = False
    duration_seconds: int | None = None
    is_demo: bool = False
    created_at: datetime | None = None
    updated_at: datetime | None = None

    class Config:
        from_attributes = True

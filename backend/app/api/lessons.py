"""Lessons API. List by course; CRUD for teachers (own course) or admin."""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select

from app.api.deps import CurrentUser, require_teacher_or_admin
from app.db.session import get_session
from app.models.course import Course
from app.models.lesson import Lesson
from app.models.user import User
from app.schemas.lesson import LessonCreate, LessonResponse, LessonUpdate

router = APIRouter(tags=["lessons"])


def lesson_to_response(lesson: Lesson) -> LessonResponse:
    return LessonResponse(
        id=lesson.id,
        title=lesson.title,
        content=lesson.content,
        course_id=lesson.course_id,
        order=lesson.order,
        video_url=lesson.video_url,
        subtitle_url=lesson.subtitle_url,
        has_sign_language=lesson.has_sign_language,
        duration_seconds=lesson.duration_seconds,
        created_at=lesson.created_at,
        updated_at=lesson.updated_at,
    )


def _can_manage_lesson(user: User, course: Course) -> bool:
    """True if user can add/edit/delete lessons in this course."""
    return user.role == "admin" or course.teacher_id == user.id


@router.get("/courses/{course_id}/lessons", response_model=list[LessonResponse])
def list_lessons_by_course(
    course_id: int,
    current_user: CurrentUser,
    session: Session = Depends(get_session),
):
    """List lessons for a course. Any authenticated user."""
    course = session.get(Course, course_id)
    if not course:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Course not found")
    lessons = session.exec(select(Lesson).where(Lesson.course_id == course_id).order_by(Lesson.order, Lesson.id)).all()
    return [lesson_to_response(le) for le in lessons]


@router.get("/lessons/{lesson_id}", response_model=LessonResponse)
def get_lesson(
    lesson_id: int,
    current_user: CurrentUser,
    session: Session = Depends(get_session),
):
    """Get a lesson by id. Any authenticated user."""
    lesson = session.get(Lesson, lesson_id)
    if not lesson:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Lesson not found")
    return lesson_to_response(lesson)


@router.post("/lessons", response_model=LessonResponse)
def create_lesson(
    body: LessonCreate,
    current_user: CurrentUser,
    session: Session = Depends(get_session),
):
    """Create a lesson. Teacher (own course) or admin only."""
    require_teacher_or_admin(current_user)
    course = session.get(Course, body.course_id)
    if not course:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Course not found")
    if not _can_manage_lesson(current_user, course):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not allowed to add lessons to this course")
    from datetime import datetime
    lesson = Lesson(
        title=body.title,
        content=body.content,
        course_id=body.course_id,
        order=body.order,
        video_url=body.video_url,
        subtitle_url=body.subtitle_url,
        has_sign_language=body.has_sign_language,
        duration_seconds=body.duration_seconds,
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow(),
    )
    session.add(lesson)
    session.commit()
    session.refresh(lesson)
    return lesson_to_response(lesson)


@router.patch("/lessons/{lesson_id}", response_model=LessonResponse)
def update_lesson(
    lesson_id: int,
    body: LessonUpdate,
    current_user: CurrentUser,
    session: Session = Depends(get_session),
):
    """Update a lesson. Teacher (own course) or admin only."""
    lesson = session.get(Lesson, lesson_id)
    if not lesson:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Lesson not found")
    course = session.get(Course, lesson.course_id)
    if not course or not _can_manage_lesson(current_user, course):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not allowed to update this lesson")
    from datetime import datetime
    if body.title is not None:
        lesson.title = body.title
    if body.content is not None:
        lesson.content = body.content
    if body.order is not None:
        lesson.order = body.order
    if body.video_url is not None:
        lesson.video_url = body.video_url
    if body.subtitle_url is not None:
        lesson.subtitle_url = body.subtitle_url
    if body.has_sign_language is not None:
        lesson.has_sign_language = body.has_sign_language
    if body.duration_seconds is not None:
        lesson.duration_seconds = body.duration_seconds
    lesson.updated_at = datetime.utcnow()
    session.add(lesson)
    session.commit()
    session.refresh(lesson)
    return lesson_to_response(lesson)


@router.delete("/lessons/{lesson_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_lesson(
    lesson_id: int,
    current_user: CurrentUser,
    session: Session = Depends(get_session),
):
    """Delete a lesson. Teacher (own course) or admin only."""
    lesson = session.get(Lesson, lesson_id)
    if not lesson:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Lesson not found")
    course = session.get(Course, lesson.course_id)
    if not course or not _can_manage_lesson(current_user, course):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not allowed to delete this lesson")
    session.delete(lesson)
    session.commit()

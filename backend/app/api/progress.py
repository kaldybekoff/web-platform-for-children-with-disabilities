"""Lesson progress API."""
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select

from app.api.deps import CurrentUser
from app.db.session import get_session
from app.models.lesson import Lesson
from app.models.lesson_progress import LessonProgress
from app.models.enrollment import Enrollment
from app.models.course import Course
from app.schemas.progress import LessonProgressResponse, MarkLessonComplete

router = APIRouter(tags=["progress"])


def _is_enrolled(user_id: int, course_id: int, session: Session) -> bool:
    enrollment = session.exec(
        select(Enrollment).where(
            Enrollment.student_id == user_id,
            Enrollment.course_id == course_id
        )
    ).first()
    return enrollment is not None


def _update_course_progress(student_id: int, course_id: int, session: Session) -> None:
    """Recalculate and update enrollment progress based on completed lessons."""
    # Get all lessons in the course
    lessons = session.exec(select(Lesson).where(Lesson.course_id == course_id)).all()
    if not lessons:
        return
    
    # Count completed lessons
    completed = 0
    for lesson in lessons:
        progress = session.exec(
            select(LessonProgress).where(
                LessonProgress.student_id == student_id,
                LessonProgress.lesson_id == lesson.id,
                LessonProgress.completed == True
            )
        ).first()
        if progress:
            completed += 1
    
    # Update enrollment progress
    enrollment = session.exec(
        select(Enrollment).where(
            Enrollment.student_id == student_id,
            Enrollment.course_id == course_id
        )
    ).first()
    
    if enrollment:
        enrollment.progress = (completed / len(lessons)) * 100
        session.add(enrollment)
        session.commit()


@router.post("/lessons/{lesson_id}/complete", response_model=LessonProgressResponse)
def mark_lesson_complete(
    lesson_id: int,
    body: MarkLessonComplete,
    current_user: CurrentUser,
    session: Session = Depends(get_session),
):
    """Mark a lesson as completed for the current user."""
    lesson = session.get(Lesson, lesson_id)
    if not lesson:
        raise HTTPException(status_code=404, detail="Lesson not found")
    
    # Check enrollment (students must be enrolled, teachers/admins can complete any)
    if current_user.role == "student" and not _is_enrolled(current_user.id, lesson.course_id, session):
        raise HTTPException(status_code=403, detail="Not enrolled in this course")
    
    # Get or create progress record
    progress = session.exec(
        select(LessonProgress).where(
            LessonProgress.student_id == current_user.id,
            LessonProgress.lesson_id == lesson_id
        )
    ).first()
    
    if not progress:
        progress = LessonProgress(
            student_id=current_user.id,
            lesson_id=lesson_id,
            created_at=datetime.utcnow()
        )
    
    progress.completed = True
    progress.completed_at = datetime.utcnow()
    progress.watch_time_seconds = body.watch_time_seconds
    
    session.add(progress)
    session.commit()
    session.refresh(progress)
    
    # Update overall course progress
    _update_course_progress(current_user.id, lesson.course_id, session)
    
    return LessonProgressResponse.model_validate(progress)


@router.get("/lessons/{lesson_id}/progress", response_model=LessonProgressResponse | None)
def get_lesson_progress(
    lesson_id: int,
    current_user: CurrentUser,
    session: Session = Depends(get_session),
):
    """Get current user's progress for a lesson."""
    lesson = session.get(Lesson, lesson_id)
    if not lesson:
        raise HTTPException(status_code=404, detail="Lesson not found")
    
    progress = session.exec(
        select(LessonProgress).where(
            LessonProgress.student_id == current_user.id,
            LessonProgress.lesson_id == lesson_id
        )
    ).first()
    
    if not progress:
        return None
    
    return LessonProgressResponse.model_validate(progress)


@router.get("/courses/{course_id}/my-progress", response_model=list[LessonProgressResponse])
def get_course_progress(
    course_id: int,
    current_user: CurrentUser,
    session: Session = Depends(get_session),
):
    """Get current user's progress for all lessons in a course."""
    course = session.get(Course, course_id)
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    
    # Get all lessons
    lessons = session.exec(select(Lesson).where(Lesson.course_id == course_id)).all()
    lesson_ids = [l.id for l in lessons]
    
    # Get progress for all lessons
    progress_list = session.exec(
        select(LessonProgress).where(
            LessonProgress.student_id == current_user.id,
            LessonProgress.lesson_id.in_(lesson_ids)
        )
    ).all()
    
    return [LessonProgressResponse.model_validate(p) for p in progress_list]

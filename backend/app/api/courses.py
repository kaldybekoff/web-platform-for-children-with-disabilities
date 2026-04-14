"""Course management API. Students can view; teachers can create/manage their own; admin can manage all."""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select

from app.api.deps import CurrentUser, require_teacher
from app.db.session import get_session
from app.models.course import Course
from app.models.lesson import Lesson
from app.models.lesson_progress import LessonProgress
from app.models.enrollment import Enrollment
from app.models.quiz import Quiz, Question, Answer, QuizAttempt
from app.models.user import User
from app.schemas.course import CourseCreate, CourseResponse, CourseUpdate

router = APIRouter(tags=["courses"])


def course_to_response(course: Course) -> CourseResponse:
    return CourseResponse(
        id=course.id,
        title=course.title,
        description=course.description,
        level=course.level,
        teacher_id=course.teacher_id,
        image_url=course.image_url,
        created_at=course.created_at,
    )


def _can_manage_course(user: User, course: Course) -> bool:
    """True if user can update/delete this course (owner teacher only)."""
    return user.role == "teacher" and course.teacher_id == user.id


@router.get("/courses", response_model=list[CourseResponse])
def list_courses(
    current_user: CurrentUser,
    session: Session = Depends(get_session),
):
    """List all courses. Any authenticated user."""
    courses = session.exec(select(Course).order_by(Course.created_at.desc())).all()
    return [course_to_response(c) for c in courses]


@router.get("/courses/{course_id}", response_model=CourseResponse)
def get_course(
    course_id: int,
    current_user: CurrentUser,
    session: Session = Depends(get_session),
):
    """Get a course by id. Any authenticated user."""
    course = session.get(Course, course_id)
    if not course:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Course not found")
    return course_to_response(course)


@router.post("/courses", response_model=CourseResponse)
def create_course(
    body: CourseCreate,
    current_user: CurrentUser,
    session: Session = Depends(get_session),
):
    """Create a course. Teacher only."""
    require_teacher(current_user)
    course = Course(
        title=body.title,
        description=body.description,
        level=body.level,
        image_url=body.image_url,
        teacher_id=current_user.id,
    )
    session.add(course)
    session.commit()
    session.refresh(course)
    return course_to_response(course)


@router.patch("/courses/{course_id}", response_model=CourseResponse)
def update_course(
    course_id: int,
    body: CourseUpdate,
    current_user: CurrentUser,
    session: Session = Depends(get_session),
):
    """Update a course. Owner (teacher) or admin only."""
    course = session.get(Course, course_id)
    if not course:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Course not found")
    if not _can_manage_course(current_user, course):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not allowed to update this course")
    if body.title is not None:
        course.title = body.title
    if body.description is not None:
        course.description = body.description
    if body.level is not None:
        course.level = body.level
    if body.image_url is not None:
        course.image_url = body.image_url
    session.add(course)
    session.commit()
    session.refresh(course)
    return course_to_response(course)


@router.delete("/courses/{course_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_course(
    course_id: int,
    current_user: CurrentUser,
    session: Session = Depends(get_session),
):
    """Delete a course. Owner (teacher) or admin only."""
    course = session.get(Course, course_id)
    if not course:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Course not found")
    if not _can_manage_course(current_user, course):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not allowed to delete this course")

    # Delete all dependent data in strict order, flushing each step
    lessons = session.exec(select(Lesson).where(Lesson.course_id == course_id)).all()
    for lesson in lessons:
        for lp in session.exec(select(LessonProgress).where(LessonProgress.lesson_id == lesson.id)).all():
            session.delete(lp)
        quiz = session.exec(select(Quiz).where(Quiz.lesson_id == lesson.id)).first()
        if quiz:
            for attempt in session.exec(select(QuizAttempt).where(QuizAttempt.quiz_id == quiz.id)).all():
                session.delete(attempt)
            for question in session.exec(select(Question).where(Question.quiz_id == quiz.id)).all():
                for answer in session.exec(select(Answer).where(Answer.question_id == question.id)).all():
                    session.delete(answer)
                session.delete(question)
            session.delete(quiz)
        session.delete(lesson)
    session.flush()  # commit lessons + their children first

    for enrollment in session.exec(select(Enrollment).where(Enrollment.course_id == course_id)).all():
        session.delete(enrollment)
    session.flush()  # commit enrollments before deleting course

    session.delete(course)
    session.commit()

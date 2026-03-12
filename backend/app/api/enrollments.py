"""Enrollments API. Students enroll; anyone can list their own enrollments."""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select

from app.api.deps import CurrentUser
from app.db.session import get_session
from app.models.course import Course
from app.models.enrollment import Enrollment
from app.schemas.enrollment import EnrollmentResponse, EnrollmentWithCourseResponse

router = APIRouter(tags=["enrollments"])


def enrollment_to_response(e: Enrollment) -> EnrollmentResponse:
    return EnrollmentResponse(
        id=e.id,
        student_id=e.student_id,
        course_id=e.course_id,
        progress=e.progress,
        created_at=e.created_at,
    )


@router.post("/courses/{course_id}/enroll", response_model=EnrollmentResponse)
def enroll_in_course(
    course_id: int,
    current_user: CurrentUser,
    session: Session = Depends(get_session),
):
    """Enroll the current user in a course. Students (and teachers) can enroll."""
    course = session.get(Course, course_id)
    if not course:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Course not found")
    existing = session.exec(
        select(Enrollment).where(
            Enrollment.student_id == current_user.id,
            Enrollment.course_id == course_id,
        )
    ).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Already enrolled in this course",
        )
    enrollment = Enrollment(
        student_id=current_user.id,
        course_id=course_id,
        progress=0.0,
    )
    session.add(enrollment)
    session.commit()
    session.refresh(enrollment)
    return enrollment_to_response(enrollment)


@router.get("/my-courses", response_model=list[EnrollmentWithCourseResponse])
def my_courses(
    current_user: CurrentUser,
    session: Session = Depends(get_session),
):
    """List current user's enrollments with course details."""
    enrollments = session.exec(
        select(Enrollment).where(Enrollment.student_id == current_user.id).order_by(Enrollment.created_at.desc())
    ).all()
    result = []
    for e in enrollments:
        course = session.get(Course, e.course_id)
        result.append(
            EnrollmentWithCourseResponse(
                id=e.id,
                student_id=e.student_id,
                course_id=e.course_id,
                progress=e.progress,
                created_at=e.created_at,
                course_title=course.title if course else "",
                course_level=course.level if course else "",
            )
        )
    return result

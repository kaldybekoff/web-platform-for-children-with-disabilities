"""Teacher API: stats, students list."""
from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select, func
from pydantic import BaseModel

from app.api.deps import CurrentUser, require_teacher_or_admin
from app.db.session import get_session
from app.models.user import User
from app.models.course import Course
from app.models.enrollment import Enrollment
from app.models.lesson import Lesson
from app.models.lesson_progress import LessonProgress
from app.schemas.user import UserResponse

router = APIRouter(prefix="/teacher", tags=["teacher"])


class TeacherStats(BaseModel):
    total_courses: int
    total_lessons: int
    total_students: int
    average_progress: float


class StudentWithProgress(BaseModel):
    id: int
    email: str
    first_name: str
    last_name: str
    course_id: int
    course_title: str
    progress: float
    enrolled_at: str

    class Config:
        from_attributes = True


class TeacherStudentsResponse(BaseModel):
    students: list[StudentWithProgress]
    total: int


@router.get("/stats", response_model=TeacherStats)
def get_teacher_stats(
    current_user: CurrentUser,
    session: Session = Depends(get_session),
):
    """Get statistics for current teacher's courses."""
    require_teacher_or_admin(current_user)
    
    # Get teacher's courses
    if current_user.role == "admin":
        courses = session.exec(select(Course)).all()
    else:
        courses = session.exec(select(Course).where(Course.teacher_id == current_user.id)).all()
    
    course_ids = [c.id for c in courses]
    
    if not course_ids:
        return TeacherStats(
            total_courses=0,
            total_lessons=0,
            total_students=0,
            average_progress=0.0
        )
    
    # Count lessons
    total_lessons = session.exec(
        select(func.count(Lesson.id)).where(Lesson.course_id.in_(course_ids))
    ).one()
    
    # Count unique students enrolled in teacher's courses
    enrollments = session.exec(
        select(Enrollment).where(Enrollment.course_id.in_(course_ids))
    ).all()
    
    unique_students = set(e.student_id for e in enrollments)
    total_students = len(unique_students)
    
    # Calculate average progress
    if enrollments:
        average_progress = sum(e.progress for e in enrollments) / len(enrollments)
    else:
        average_progress = 0.0
    
    return TeacherStats(
        total_courses=len(courses),
        total_lessons=total_lessons,
        total_students=total_students,
        average_progress=round(average_progress, 1)
    )


@router.get("/students", response_model=TeacherStudentsResponse)
def get_teacher_students(
    current_user: CurrentUser,
    session: Session = Depends(get_session),
):
    """Get list of students enrolled in teacher's courses."""
    require_teacher_or_admin(current_user)
    
    # Get teacher's courses
    if current_user.role == "admin":
        courses = session.exec(select(Course)).all()
    else:
        courses = session.exec(select(Course).where(Course.teacher_id == current_user.id)).all()
    
    course_ids = [c.id for c in courses]
    course_map = {c.id: c.title for c in courses}
    
    if not course_ids:
        return TeacherStudentsResponse(students=[], total=0)
    
    # Get enrollments with student info
    enrollments = session.exec(
        select(Enrollment).where(Enrollment.course_id.in_(course_ids))
    ).all()
    
    students = []
    for enrollment in enrollments:
        student = session.get(User, enrollment.student_id)
        if student:
            students.append(StudentWithProgress(
                id=student.id,
                email=student.email,
                first_name=student.first_name,
                last_name=student.last_name,
                course_id=enrollment.course_id,
                course_title=course_map.get(enrollment.course_id, ""),
                progress=enrollment.progress,
                enrolled_at=enrollment.created_at.isoformat()
            ))
    
    return TeacherStudentsResponse(
        students=students,
        total=len(students)
    )

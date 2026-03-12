"""Admin API: user management, platform stats."""
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlmodel import Session, select, func

from app.api.deps import CurrentUser, require_admin
from app.db.session import get_session
from app.models.user import User
from app.models.course import Course
from app.models.enrollment import Enrollment
from app.models.lesson import Lesson
from app.models.lesson_progress import LessonProgress
from app.schemas.user import UserResponse
from pydantic import BaseModel

router = APIRouter(prefix="/admin", tags=["admin"])


class AdminStats(BaseModel):
    total_users: int
    total_students: int
    total_teachers: int
    total_admins: int
    total_courses: int
    total_lessons: int
    total_enrollments: int
    completed_lessons: int


class UserListResponse(BaseModel):
    users: list[UserResponse]
    total: int
    page: int
    per_page: int


# ===== Stats =====

@router.get("/stats", response_model=AdminStats)
def get_admin_stats(
    current_user: CurrentUser,
    session: Session = Depends(get_session),
):
    """Get platform-wide statistics. Admin only."""
    require_admin(current_user)
    
    # Count users by role
    total_users = session.exec(select(func.count(User.id))).one()
    total_students = session.exec(select(func.count(User.id)).where(User.role == "student")).one()
    total_teachers = session.exec(select(func.count(User.id)).where(User.role == "teacher")).one()
    total_admins = session.exec(select(func.count(User.id)).where(User.role == "admin")).one()
    
    # Count content
    total_courses = session.exec(select(func.count(Course.id))).one()
    total_lessons = session.exec(select(func.count(Lesson.id))).one()
    total_enrollments = session.exec(select(func.count(Enrollment.id))).one()
    
    # Count completed lessons
    completed_lessons = session.exec(
        select(func.count(LessonProgress.id)).where(LessonProgress.completed == True)
    ).one()
    
    return AdminStats(
        total_users=total_users,
        total_students=total_students,
        total_teachers=total_teachers,
        total_admins=total_admins,
        total_courses=total_courses,
        total_lessons=total_lessons,
        total_enrollments=total_enrollments,
        completed_lessons=completed_lessons
    )


# ===== User Management =====

@router.get("/users", response_model=UserListResponse)
def list_users(
    current_user: CurrentUser,
    session: Session = Depends(get_session),
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    role: str | None = None,
    search: str | None = None,
):
    """List all users with pagination. Admin only."""
    require_admin(current_user)
    
    query = select(User)
    
    if role:
        query = query.where(User.role == role)
    
    if search:
        search_term = f"%{search}%"
        query = query.where(
            (User.email.ilike(search_term)) |
            (User.first_name.ilike(search_term)) |
            (User.last_name.ilike(search_term))
        )
    
    # Count total
    count_query = select(func.count()).select_from(query.subquery())
    total = session.exec(count_query).one()
    
    # Paginate
    offset = (page - 1) * per_page
    users = session.exec(query.offset(offset).limit(per_page).order_by(User.id.desc())).all()
    
    return UserListResponse(
        users=[UserResponse.model_validate(u) for u in users],
        total=total,
        page=page,
        per_page=per_page
    )


@router.get("/users/{user_id}", response_model=UserResponse)
def get_user(
    user_id: int,
    current_user: CurrentUser,
    session: Session = Depends(get_session),
):
    """Get user by ID. Admin only."""
    require_admin(current_user)
    
    user = session.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    return UserResponse.model_validate(user)


@router.delete("/users/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_user(
    user_id: int,
    current_user: CurrentUser,
    session: Session = Depends(get_session),
):
    """Delete user. Admin only."""
    require_admin(current_user)
    
    user = session.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Prevent admin from deleting themselves
    if user.id == current_user.id:
        raise HTTPException(status_code=400, detail="Cannot delete yourself")
    
    session.delete(user)
    session.commit()

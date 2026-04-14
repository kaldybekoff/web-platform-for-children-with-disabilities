from datetime import datetime
from collections import defaultdict

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlmodel import Session, select, func

from app.api.deps import CurrentUser, user_to_response
from app.db.session import get_session
from app.models.user import User
from app.models.enrollment import Enrollment
from app.models.course import Course
from app.models.lesson_progress import LessonProgress
from app.models.quiz import QuizAttempt
from app.schemas.user import UserResponse, UserUpdate, PasswordChange
from app.core.security import hash_password, verify_password

router = APIRouter(tags=["users"])


class UserAchievementStats(BaseModel):
    completed_lessons: int
    enrolled_courses: int
    completed_courses: int
    passed_quizzes: int
    perfect_quizzes: int


class StudyFriendResponse(BaseModel):
    id: int
    first_name: str
    last_name: str
    email: str
    role: str
    common_courses_count: int
    common_courses: list[str]


class StudyFriendsListResponse(BaseModel):
    friends: list[StudyFriendResponse]
    total: int


@router.get("/me", response_model=UserResponse)
def get_me(current_user: CurrentUser):
    """Return the current authenticated user."""
    return user_to_response(current_user)


@router.patch("/me", response_model=UserResponse)
def update_me(
    body: UserUpdate,
    current_user: CurrentUser,
    session: Session = Depends(get_session),
):
    """Update current user's first_name, last_name, email."""
    if body.email is not None:
        other = session.exec(select(User).where(User.email == body.email, User.id != current_user.id)).first()
        if other:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already in use",
            )
        current_user.email = body.email
    if body.first_name is not None:
        current_user.first_name = body.first_name
    if body.last_name is not None:
        current_user.last_name = body.last_name
    current_user.updated_at = datetime.utcnow()
    session.add(current_user)
    session.commit()
    session.refresh(current_user)
    return user_to_response(current_user)


@router.post("/me/password", status_code=status.HTTP_200_OK)
def change_password(
    body: PasswordChange,
    current_user: CurrentUser,
    session: Session = Depends(get_session),
):
    """Change current user's password. Requires current password verification."""
    if not verify_password(body.current_password, current_user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Current password is incorrect",
        )
    
    current_user.password_hash = hash_password(body.new_password)
    current_user.updated_at = datetime.utcnow()
    session.add(current_user)
    session.commit()
    
    return {"message": "Password changed successfully"}


@router.get("/me/achievements", response_model=UserAchievementStats)
def get_my_achievements(
    current_user: CurrentUser,
    session: Session = Depends(get_session),
):
    """Get current user's achievement statistics."""
    user_id = current_user.id
    
    completed_lessons = session.exec(
        select(func.count(LessonProgress.id)).where(
            LessonProgress.student_id == user_id,
            LessonProgress.completed == True
        )
    ).one()
    
    enrolled_courses = session.exec(
        select(func.count(Enrollment.id)).where(
            Enrollment.student_id == user_id
        )
    ).one()
    
    completed_courses = session.exec(
        select(func.count(Enrollment.id)).where(
            Enrollment.student_id == user_id,
            Enrollment.progress >= 100
        )
    ).one()
    
    passed_quizzes = session.exec(
        select(func.count(func.distinct(QuizAttempt.quiz_id))).where(
            QuizAttempt.student_id == user_id,
            QuizAttempt.passed == True
        )
    ).one()
    
    perfect_quizzes = session.exec(
        select(func.count(func.distinct(QuizAttempt.quiz_id))).where(
            QuizAttempt.student_id == user_id,
            QuizAttempt.score == 100
        )
    ).one()
    
    return UserAchievementStats(
        completed_lessons=completed_lessons,
        enrolled_courses=enrolled_courses,
        completed_courses=completed_courses,
        passed_quizzes=passed_quizzes,
        perfect_quizzes=perfect_quizzes,
    )


@router.get("/me/study-friends", response_model=StudyFriendsListResponse)
def get_study_friends(
    current_user: CurrentUser,
    session: Session = Depends(get_session),
):
    """Get users who share enrolled courses with the current user."""
    user_id = current_user.id
    
    my_enrollments = session.exec(
        select(Enrollment.course_id).where(Enrollment.student_id == user_id)
    ).all()
    
    if not my_enrollments:
        return StudyFriendsListResponse(friends=[], total=0)
    
    my_course_ids = set(my_enrollments)
    
    other_enrollments = session.exec(
        select(Enrollment.student_id, Enrollment.course_id).where(
            Enrollment.course_id.in_(my_course_ids),
            Enrollment.student_id != user_id
        )
    ).all()
    
    if not other_enrollments:
        return StudyFriendsListResponse(friends=[], total=0)
    
    user_courses: dict[int, list[int]] = defaultdict(list)
    for student_id, course_id in other_enrollments:
        user_courses[student_id].append(course_id)
    
    other_user_ids = list(user_courses.keys())
    users = session.exec(
        select(User).where(User.id.in_(other_user_ids))
    ).all()
    user_map = {u.id: u for u in users}
    
    course_ids_needed = set()
    for cids in user_courses.values():
        course_ids_needed.update(cids)
    
    courses = session.exec(
        select(Course).where(Course.id.in_(course_ids_needed))
    ).all()
    course_map = {c.id: c.title for c in courses}
    
    friends: list[StudyFriendResponse] = []
    for uid, course_ids in user_courses.items():
        user = user_map.get(uid)
        if not user:
            continue
        course_titles = [course_map.get(cid, "") for cid in course_ids if course_map.get(cid)]
        friends.append(StudyFriendResponse(
            id=user.id,
            first_name=user.first_name,
            last_name=user.last_name,
            email=user.email,
            role=user.role,
            common_courses_count=len(course_ids),
            common_courses=course_titles,
        ))
    
    friends.sort(key=lambda f: f.common_courses_count, reverse=True)
    
    return StudyFriendsListResponse(friends=friends, total=len(friends))

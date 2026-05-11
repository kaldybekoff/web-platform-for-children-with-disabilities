"""Standalone admin service built on starlette-admin.

This package is intentionally separate from the public API (`app.api.*`). It
reuses the existing SQLModel models, settings and DB engine, and is served by a
dedicated ASGI app (`app.admin_app`) on its own subdomain.
"""
from starlette.middleware import Middleware
from starlette.middleware.sessions import SessionMiddleware
from starlette_admin.contrib.sqla import Admin, ModelView

from app.admin.auth import AdminAuth
from app.admin.views import CourseView, NewsView, UserView
from app.core.config import settings
from app.db.session import engine
from app.models import (
    Answer,
    Course,
    Enrollment,
    Lesson,
    LessonProgress,
    News,
    Question,
    Quiz,
    QuizAttempt,
    SuccessPost,
    SuccessPostLike,
    User,
)


def create_admin() -> Admin:
    """Build the configured starlette-admin instance."""
    admin = Admin(
        engine,
        title="QazEdu Admin",
        auth_provider=AdminAuth(),
        middlewares=[Middleware(SessionMiddleware, secret_key=settings.secret_key)],
    )

    admin.add_view(UserView(User, label="Пользователи", icon="fa fa-users"))
    admin.add_view(CourseView(Course, label="Курсы", icon="fa fa-book"))
    admin.add_view(ModelView(Lesson, label="Уроки", icon="fa fa-chalkboard-teacher"))
    admin.add_view(NewsView(News, label="Новости", icon="fa fa-newspaper"))
    admin.add_view(ModelView(Enrollment, label="Записи на курсы", icon="fa fa-user-graduate"))
    admin.add_view(ModelView(Quiz, label="Тесты", icon="fa fa-question-circle"))
    admin.add_view(ModelView(Question, label="Вопросы", icon="fa fa-question"))
    admin.add_view(ModelView(Answer, label="Ответы", icon="fa fa-check"))
    admin.add_view(ModelView(QuizAttempt, label="Попытки тестов", icon="fa fa-list-check"))
    admin.add_view(ModelView(LessonProgress, label="Прогресс уроков", icon="fa fa-chart-line"))
    admin.add_view(ModelView(SuccessPost, label="Посты сообщества", icon="fa fa-star"))
    admin.add_view(ModelView(SuccessPostLike, label="Лайки постов", icon="fa fa-heart"))

    return admin

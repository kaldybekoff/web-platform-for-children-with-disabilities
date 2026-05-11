"""Customised model views for the admin service.

Models without special needs are registered with the plain ``ModelView`` in
``app.admin``; only the ones below need tweaks (hiding secrets, password
handling, custom actions, nicer columns).
"""
import secrets
import string
from datetime import datetime
from typing import Any

from starlette.requests import Request
from starlette_admin import EnumField, PasswordField
from starlette_admin.actions import action, row_action
from starlette_admin.contrib.sqla import ModelView
from starlette_admin.exceptions import FormValidationError

from app.core.security import hash_password
from app.models.news import News
from app.models.user import User

_ROLE_CHOICES = [
    ("student", "Студент"),
    ("teacher", "Учитель"),
    ("admin", "Администратор"),
]


def _generate_password(length: int = 12) -> str:
    alphabet = string.ascii_letters + string.digits
    return "".join(secrets.choice(alphabet) for _ in range(length))


class UserView(ModelView):
    """Users — hide password hashes/tokens, set a plaintext password on create/edit."""

    fields = [
        "id",
        "email",
        "first_name",
        "last_name",
        EnumField("role", label="Роль", choices=_ROLE_CHOICES, required=True),
        PasswordField(
            "password",
            label="Пароль",
            help_text="Обязательно при создании. При редактировании — заполните, чтобы сменить пароль.",
            exclude_from_list=True,
            exclude_from_detail=True,
        ),
        "is_verified",
        "google_id",
        "created_at",
        "updated_at",
    ]
    searchable_fields = ["email", "first_name", "last_name"]
    sortable_fields = ["id", "email", "role", "is_verified", "created_at"]
    exclude_fields_from_create = ["id", "is_verified", "google_id", "created_at", "updated_at"]
    exclude_fields_from_edit = ["id", "google_id", "created_at", "updated_at"]
    row_actions = ["view", "edit", "reset_password", "delete"]

    async def _populate_obj(
        self,
        request: Request,
        obj: Any,
        data: dict[str, Any],
        is_edit: bool = False,
    ) -> Any:
        # Same as the base implementation, but "password" is virtual: it is not a
        # model column, so hash it into password_hash instead of setattr-ing it.
        for field in self.get_fields_list(request, request.state.action):
            if field.name == "password":
                continue
            setattr(obj, field.name, data.get(field.name, None))

        password = (data.get("password") or "").strip()
        if password:
            obj.password_hash = hash_password(password)
        elif not is_edit:
            raise FormValidationError({"password": "Укажите пароль для нового пользователя"})

        if not is_edit:
            # Admin-created accounts are trusted — no email verification needed.
            obj.is_verified = True
        return obj

    @row_action(
        name="reset_password",
        text="Сбросить пароль",
        confirmation="Сгенерировать новый временный пароль для этого пользователя?",
        icon_class="fa fa-key",
        submit_btn_text="Да, сбросить",
        submit_btn_class="btn-danger",
    )
    async def reset_password(self, request: Request, pk: Any) -> str:
        session = request.state.session
        user = session.get(User, int(pk))
        if not user:
            return "Пользователь не найден"
        new_password = _generate_password()
        user.password_hash = hash_password(new_password)
        user.updated_at = datetime.utcnow()
        session.commit()
        return f"Новый пароль для {user.email}: {new_password} — передайте его пользователю."


class CourseView(ModelView):
    fields = ["id", "title", "description", "level", "teacher_id", "image_url", "created_at"]
    searchable_fields = ["title", "description"]
    sortable_fields = ["id", "title", "level", "created_at"]


class NewsView(ModelView):
    fields = [
        "id",
        "title_ru",
        "title_kz",
        "content_ru",
        "content_kz",
        "media_url",
        "media_type",
        "is_published",
        "author_id",
        "created_at",
        "updated_at",
    ]
    exclude_fields_from_list = ["content_ru", "content_kz"]
    searchable_fields = ["title_ru", "title_kz"]
    sortable_fields = ["id", "is_published", "created_at"]
    actions = ["publish", "unpublish", "delete"]

    async def _set_published(self, request: Request, pks: list[Any], value: bool) -> str:
        session = request.state.session
        changed = 0
        for pk in pks:
            news = session.get(News, int(pk))
            if news:
                news.is_published = value
                news.updated_at = datetime.utcnow()
                changed += 1
        session.commit()
        verb = "опубликовано" if value else "снято с публикации"
        return f"Новостей {verb}: {changed}"

    @action(
        name="publish",
        text="Опубликовать",
        confirmation="Опубликовать выбранные новости?",
        icon_class="fa fa-eye",
        submit_btn_text="Да, опубликовать",
        submit_btn_class="btn-success",
    )
    async def publish(self, request: Request, pks: list[Any]) -> str:
        return await self._set_published(request, pks, True)

    @action(
        name="unpublish",
        text="Снять с публикации",
        confirmation="Снять выбранные новости с публикации?",
        icon_class="fa fa-eye-slash",
        submit_btn_text="Да, снять",
        submit_btn_class="btn-warning",
    )
    async def unpublish(self, request: Request, pks: list[Any]) -> str:
        return await self._set_published(request, pks, False)

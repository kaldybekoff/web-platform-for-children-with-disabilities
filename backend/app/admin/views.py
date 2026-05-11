"""Customised model views for the admin service.

Models without special needs are registered with the plain ``ModelView`` in
``app.admin``; only the ones below need tweaks (hiding secrets, password
handling, nicer columns).
"""
from typing import Any

from starlette.requests import Request
from starlette_admin import EnumField, PasswordField
from starlette_admin.contrib.sqla import ModelView
from starlette_admin.exceptions import FormValidationError

from app.core.security import hash_password

_ROLE_CHOICES = [
    ("student", "Студент"),
    ("teacher", "Учитель"),
    ("admin", "Администратор"),
]


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

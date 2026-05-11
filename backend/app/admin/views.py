"""Customised model views for the admin service.

Models without special needs are registered with the plain ``ModelView`` in
``app.admin``; only the ones below need tweaks (hiding secrets, nicer columns).
"""
from starlette_admin.contrib.sqla import ModelView


class UserView(ModelView):
    """Users — never expose password hashes or recovery tokens."""

    fields = [
        "id",
        "email",
        "first_name",
        "last_name",
        "role",
        "is_verified",
        "google_id",
        "created_at",
        "updated_at",
    ]
    searchable_fields = ["email", "first_name", "last_name"]
    sortable_fields = ["id", "email", "role", "is_verified", "created_at"]
    exclude_fields_from_create = ["created_at", "updated_at"]
    exclude_fields_from_edit = ["created_at", "updated_at"]


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

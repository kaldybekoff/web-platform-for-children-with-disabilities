"""ASGI entrypoint for the standalone admin service.

Run with:  uvicorn app.admin_app:app --host 0.0.0.0 --port 8001

It mounts starlette-admin at /admin and reuses the same database/models as the
main API. Intended to be served on its own subdomain (e.g. admin.qazedu.kz).
"""
from starlette.applications import Starlette
from starlette.responses import JSONResponse, RedirectResponse
from starlette.routing import Route

from app.admin import create_admin
from app.core.config import settings
from app.db.session import create_db_and_tables


async def _root(request):
    return RedirectResponse(url="/admin")


async def _health(request):
    return JSONResponse({"status": "ok"})


app = Starlette(routes=[Route("/", _root), Route("/health", _health)])

# Local development on SQLite: make sure tables exist (Postgres uses Alembic).
if "sqlite" in settings.database_url:
    create_db_and_tables()

create_admin().mount_to(app)

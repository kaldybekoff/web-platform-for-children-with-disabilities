from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text
from sqlmodel import Session

from app.core.config import settings
from app.api import auth, users, courses, lessons, enrollments, quizzes, progress, admin, teacher
from app.db.session import engine, create_db_and_tables
from app.core.seed import run_seeds

app = FastAPI(
    title="QazEdu Special API",
    description="Backend for QazEdu Special education platform",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins.split(","),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/api")
app.include_router(users.router, prefix="/api")
app.include_router(courses.router, prefix="/api")
app.include_router(lessons.router, prefix="/api")
app.include_router(enrollments.router, prefix="/api")
app.include_router(quizzes.router, prefix="/api")
app.include_router(progress.router, prefix="/api")
app.include_router(admin.router, prefix="/api")
app.include_router(teacher.router, prefix="/api")


@app.on_event("startup")
def on_startup():
    """Initialize database and seed admin user on startup."""
    if "sqlite" in settings.database_url:
        create_db_and_tables()
    
    # Seed admin user (creates only if doesn't exist)
    with Session(engine) as session:
        run_seeds(session)


@app.get("/health")
def health():
    return {"status": "ok"}


@app.get("/health/db")
def health_db():
    """Verify database connectivity (e.g. Neon)."""
    try:
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        return {"database": "connected"}
    except Exception as e:
        raise HTTPException(status_code=503, detail=f"Database unreachable: {e}")

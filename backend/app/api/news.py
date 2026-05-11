"""News API: read-only endpoints for authenticated users.

News are created/edited in the separate admin service (starlette-admin), so this
router no longer exposes any write endpoints.
"""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlmodel import Session, func, select

from app.api.deps import CurrentUser
from app.db.session import get_session
from app.models.news import News
from app.schemas.news import NewsListResponse, NewsResponse

router = APIRouter(prefix="/news", tags=["news"])


@router.get("", response_model=NewsListResponse)
def list_news(
    current_user: CurrentUser,
    session: Session = Depends(get_session),
    limit: int = Query(10, ge=1, le=50),
    offset: int = Query(0, ge=0),
):
    """Get list of published news. Available to all authenticated users."""
    query = select(News).where(News.is_published == True).order_by(News.created_at.desc())

    total = session.exec(select(func.count()).select_from(query.subquery())).one()
    news = session.exec(query.offset(offset).limit(limit)).all()

    return NewsListResponse(
        news=[NewsResponse.model_validate(n) for n in news],
        total=total,
    )


@router.get("/{news_id}", response_model=NewsResponse)
def get_news(
    news_id: int,
    current_user: CurrentUser,
    session: Session = Depends(get_session),
):
    """Get a single published news item by ID."""
    news = session.get(News, news_id)
    if not news or not news.is_published:
        raise HTTPException(status_code=404, detail="News not found")

    return NewsResponse.model_validate(news)

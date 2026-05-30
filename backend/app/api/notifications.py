"""Notifications API — in-app notification feed."""
from datetime import datetime

from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel
from sqlmodel import Session, select, func

from app.api.deps import CurrentUser
from app.db.session import get_session
from app.models.notification import Notification

router = APIRouter(prefix="/notifications", tags=["notifications"])


class NotificationResponse(BaseModel):
    id: int
    type: str
    title: str
    body: str
    lesson_id: int | None
    is_read: bool
    created_at: str


class NotificationListResponse(BaseModel):
    notifications: list[NotificationResponse]
    total: int
    unread_count: int


def _to_resp(n: Notification) -> NotificationResponse:
    return NotificationResponse(
        id=n.id,  # type: ignore[arg-type]
        type=n.type,
        title=n.title,
        body=n.body,
        lesson_id=n.lesson_id,
        is_read=n.is_read,
        created_at=n.created_at.isoformat(),
    )


@router.get("", response_model=NotificationListResponse)
def list_notifications(
    current_user: CurrentUser,
    session: Session = Depends(get_session),
    limit: int = Query(20, ge=1, le=50),
    offset: int = Query(0, ge=0),
):
    """Get paginated notifications for the current user, newest first."""
    base = select(Notification).where(Notification.user_id == current_user.id)
    total = session.exec(select(func.count()).select_from(base.subquery())).one()
    unread_count = session.exec(
        select(func.count()).select_from(
            select(Notification).where(
                Notification.user_id == current_user.id,
                Notification.is_read == False,  # noqa: E712
            ).subquery()
        )
    ).one()
    items = session.exec(
        base.order_by(Notification.created_at.desc()).offset(offset).limit(limit)
    ).all()
    return NotificationListResponse(
        notifications=[_to_resp(n) for n in items],
        total=total,
        unread_count=unread_count,
    )


@router.get("/unread-count")
def unread_count(
    current_user: CurrentUser,
    session: Session = Depends(get_session),
):
    """Lightweight endpoint — just the unread count for the bell badge."""
    count = session.exec(
        select(func.count()).select_from(
            select(Notification).where(
                Notification.user_id == current_user.id,
                Notification.is_read == False,  # noqa: E712
            ).subquery()
        )
    ).one()
    return {"count": count}


@router.post("/{notification_id}/read", response_model=NotificationResponse)
def mark_read(
    notification_id: int,
    current_user: CurrentUser,
    session: Session = Depends(get_session),
):
    """Mark a single notification as read."""
    n = session.get(Notification, notification_id)
    if not n or n.user_id != current_user.id:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Notification not found")
    n.is_read = True
    session.add(n)
    session.commit()
    session.refresh(n)
    return _to_resp(n)


@router.post("/read-all")
def mark_all_read(
    current_user: CurrentUser,
    session: Session = Depends(get_session),
):
    """Mark all notifications as read."""
    items = session.exec(
        select(Notification).where(
            Notification.user_id == current_user.id,
            Notification.is_read == False,  # noqa: E712
        )
    ).all()
    for n in items:
        n.is_read = True
        session.add(n)
    session.commit()
    return {"marked": len(items)}


# ---------------------------------------------------------------------------
# Internal helper — called from other routers (comments, lessons)
# ---------------------------------------------------------------------------

def create_notification(
    session: Session,
    *,
    user_id: int,
    type: str,
    title: str,
    body: str,
    lesson_id: int | None = None,
) -> Notification | None:
    """Create and persist a notification. Does NOT commit — caller must commit.

    Returns None if an identical notification already exists within the last
    5 minutes (dedup guard against double-submits / retries).
    """
    from datetime import timedelta
    cutoff = datetime.utcnow() - timedelta(minutes=5)
    existing = session.exec(
        select(Notification).where(
            Notification.user_id == user_id,
            Notification.type == type,
            Notification.lesson_id == lesson_id,
            Notification.body == body,
            Notification.created_at >= cutoff,
        )
    ).first()
    if existing:
        return None

    n = Notification(
        user_id=user_id,
        type=type,
        title=title,
        body=body,
        lesson_id=lesson_id,
        is_read=False,
        created_at=datetime.utcnow(),
    )
    session.add(n)
    return n

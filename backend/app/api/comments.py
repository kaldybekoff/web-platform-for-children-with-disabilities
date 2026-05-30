"""Lesson comments API."""
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, Request, status
from pydantic import BaseModel
from sqlmodel import Session, select

from app.api.deps import CurrentUser
from app.core.limiter import limiter
from app.db.session import get_session
from app.models.lesson import Lesson
from app.models.lesson_comment import LessonComment
from app.models.user import User

router = APIRouter(tags=["comments"])


class CommentCreate(BaseModel):
    content: str
    parent_id: int | None = None


class CommentResponse(BaseModel):
    id: int
    lesson_id: int
    user_id: int
    parent_id: int | None
    content: str
    author_name: str
    author_role: str
    created_at: str
    replies: list["CommentResponse"] = []

    model_config = {"from_attributes": True}


def _build(comment: LessonComment, author: User, replies: list[CommentResponse]) -> CommentResponse:
    name = f"{author.first_name} {author.last_name}".strip() or author.email
    return CommentResponse(
        id=comment.id,  # type: ignore[arg-type]
        lesson_id=comment.lesson_id,
        user_id=comment.user_id,
        parent_id=comment.parent_id,
        content=comment.content,
        author_name=name,
        author_role=author.role,
        created_at=comment.created_at.isoformat(),
        replies=replies,
    )


@router.get("/lessons/{lesson_id}/comments", response_model=list[CommentResponse])
def list_comments(
    lesson_id: int,
    current_user: CurrentUser,
    session: Session = Depends(get_session),
):
    """Return top-level comments with nested replies for a lesson."""
    lesson = session.get(Lesson, lesson_id)
    if not lesson:
        raise HTTPException(status_code=404, detail="Lesson not found")

    all_comments = session.exec(
        select(LessonComment).where(LessonComment.lesson_id == lesson_id)
        .order_by(LessonComment.created_at)
    ).all()

    users: dict[int, User] = {}
    for c in all_comments:
        if c.user_id not in users:
            u = session.get(User, c.user_id)
            if u:
                users[c.user_id] = u

    # Build replies map first, then top-level
    replies_map: dict[int, list[CommentResponse]] = {}
    for c in reversed(all_comments):
        if c.parent_id is not None:
            author = users.get(c.user_id)
            if not author:
                continue
            resp = _build(c, author, [])
            replies_map.setdefault(c.parent_id, []).insert(0, resp)

    result = []
    for c in all_comments:
        if c.parent_id is None:
            author = users.get(c.user_id)
            if not author:
                continue
            result.append(_build(c, author, replies_map.get(c.id, [])))  # type: ignore[arg-type]
    return result


@router.post("/lessons/{lesson_id}/comments", response_model=CommentResponse, status_code=201)
@limiter.limit("20/minute")
def create_comment(
    lesson_id: int,
    request: Request,
    body: CommentCreate,
    current_user: CurrentUser,
    session: Session = Depends(get_session),
):
    """Post a comment or reply on a lesson."""
    lesson = session.get(Lesson, lesson_id)
    if not lesson:
        raise HTTPException(status_code=404, detail="Lesson not found")
    if not body.content.strip():
        raise HTTPException(status_code=400, detail="Content cannot be empty")
    if body.parent_id is not None:
        parent = session.get(LessonComment, body.parent_id)
        if not parent or parent.lesson_id != lesson_id:
            raise HTTPException(status_code=400, detail="Invalid parent comment")

    comment = LessonComment(
        lesson_id=lesson_id,
        user_id=current_user.id,  # type: ignore[arg-type]
        parent_id=body.parent_id,
        content=body.content.strip(),
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow(),
    )
    session.add(comment)
    session.commit()
    session.refresh(comment)
    return _build(comment, current_user, [])


@router.delete("/comments/{comment_id}", status_code=204)
def delete_comment(
    comment_id: int,
    current_user: CurrentUser,
    session: Session = Depends(get_session),
):
    """Delete own comment (or any comment if admin)."""
    comment = session.get(LessonComment, comment_id)
    if not comment:
        raise HTTPException(status_code=404, detail="Comment not found")
    if comment.user_id != current_user.id and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Not allowed")

    # Delete replies first
    replies = session.exec(select(LessonComment).where(LessonComment.parent_id == comment_id)).all()
    for r in replies:
        session.delete(r)
    session.delete(comment)
    session.commit()

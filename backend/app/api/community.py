"""Community API: Success posts CRUD."""
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlmodel import Session, select, func

from app.api.deps import CurrentUser
from app.db.session import get_session
from app.models.success_post import SuccessPost, SuccessPostLike
from app.models.user import User
from app.schemas.success_post import SuccessPostCreate, SuccessPostResponse, SuccessPostListResponse

router = APIRouter(prefix="/community", tags=["community"])


def _build_post_response(post: SuccessPost, author: User, liked_by_me: bool) -> SuccessPostResponse:
    """Build response with author name."""
    author_name = f"{author.first_name} {author.last_name}".strip() or author.email
    return SuccessPostResponse(
        id=post.id,
        user_id=post.user_id,
        author_name=author_name,
        content=post.content,
        likes_count=post.likes_count,
        liked_by_me=liked_by_me,
        created_at=post.created_at,
    )


@router.get("/posts", response_model=SuccessPostListResponse)
def list_success_posts(
    current_user: CurrentUser,
    session: Session = Depends(get_session),
    limit: int = Query(20, ge=1, le=50),
    offset: int = Query(0, ge=0),
):
    """Get list of success posts. Available to all authenticated users."""
    query = select(SuccessPost).order_by(SuccessPost.created_at.desc())
    
    total = session.exec(select(func.count()).select_from(query.subquery())).one()
    posts = session.exec(query.offset(offset).limit(limit)).all()
    
    post_responses = []
    for post in posts:
        author = session.get(User, post.user_id)
        liked = session.exec(
            select(SuccessPostLike).where(
                SuccessPostLike.post_id == post.id,
                SuccessPostLike.user_id == current_user.id
            )
        ).first()
        post_responses.append(_build_post_response(post, author, liked is not None))
    
    return SuccessPostListResponse(posts=post_responses, total=total)


@router.post("/posts", response_model=SuccessPostResponse, status_code=status.HTTP_201_CREATED)
def create_success_post(
    body: SuccessPostCreate,
    current_user: CurrentUser,
    session: Session = Depends(get_session),
):
    """Create a new success post."""
    if not body.content.strip():
        raise HTTPException(status_code=400, detail="Content cannot be empty")
    
    post = SuccessPost(
        user_id=current_user.id,
        content=body.content.strip(),
        likes_count=0,
        created_at=datetime.utcnow(),
    )
    session.add(post)
    session.commit()
    session.refresh(post)
    
    return _build_post_response(post, current_user, False)


@router.post("/posts/{post_id}/like", response_model=SuccessPostResponse)
def like_post(
    post_id: int,
    current_user: CurrentUser,
    session: Session = Depends(get_session),
):
    """Like or unlike a success post (toggle)."""
    post = session.get(SuccessPost, post_id)
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    
    existing_like = session.exec(
        select(SuccessPostLike).where(
            SuccessPostLike.post_id == post_id,
            SuccessPostLike.user_id == current_user.id
        )
    ).first()
    
    if existing_like:
        session.delete(existing_like)
        post.likes_count = max(0, post.likes_count - 1)
        liked_by_me = False
    else:
        like = SuccessPostLike(
            post_id=post_id,
            user_id=current_user.id,
            created_at=datetime.utcnow(),
        )
        session.add(like)
        post.likes_count += 1
        liked_by_me = True
    
    session.add(post)
    session.commit()
    session.refresh(post)
    
    author = session.get(User, post.user_id)
    return _build_post_response(post, author, liked_by_me)


@router.delete("/posts/{post_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_success_post(
    post_id: int,
    current_user: CurrentUser,
    session: Session = Depends(get_session),
):
    """Delete own success post."""
    post = session.get(SuccessPost, post_id)
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    
    if post.user_id != current_user.id and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Can only delete your own posts")
    
    likes = session.exec(select(SuccessPostLike).where(SuccessPostLike.post_id == post_id)).all()
    for like in likes:
        session.delete(like)
    
    session.delete(post)
    session.commit()

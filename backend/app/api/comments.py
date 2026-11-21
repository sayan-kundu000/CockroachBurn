from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import asc
from backend.app.core.database import get_db
from backend.app.models.models import Comment, Ticket, User
from backend.app.schemas.schemas import CommentCreate, CommentResponse
from backend.app.api.deps import get_current_user, check_project_access
from backend.app.api.websockets import manager
from backend.app.core.config import settings

router = APIRouter(prefix="/comments", tags=["Comments"])

@router.get("/ticket/{ticket_id}", response_model=List[CommentResponse])
def get_ticket_comments(
    ticket_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    ticket = db.query(Ticket).filter(Ticket.id == ticket_id).first()
    if not ticket:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Ticket not found")

    check_project_access(ticket.project_id, current_user, db)

    # Return top-level comments with replies attached
    comments = db.query(Comment).filter(
        Comment.ticket_id == ticket_id,
        Comment.parent_id == None
    ).order_by(asc(Comment.created_at)).all()

    return comments


@router.post("/ticket/{ticket_id}", response_model=CommentResponse, status_code=status.HTTP_201_CREATED)
async def create_comment(
    ticket_id: int,
    comment_in: CommentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    ticket = db.query(Ticket).filter(Ticket.id == ticket_id).first()
    if not ticket:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Ticket not found")

    check_project_access(ticket.project_id, current_user, db, require_write=True)

    if comment_in.parent_id:
        parent = db.query(Comment).filter(
            Comment.id == comment_in.parent_id,
            Comment.ticket_id == ticket_id
        ).first()
        if not parent:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Parent comment not found")

    comment = Comment(
        content=comment_in.content,
        ticket_id=ticket_id,
        author_id=current_user.id,
        parent_id=comment_in.parent_id
    )
    db.add(comment)
    db.commit()
    db.refresh(comment)

    # Broadcast WebSocket update
    await manager.broadcast_to_project(ticket.project_id, {
        "event": "COMMENT_ADDED",
        "ticket_id": ticket.id,
        "comment_id": comment.id
    })

    return comment


@router.delete("/{comment_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_comment(
    comment_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    comment = db.query(Comment).filter(Comment.id == comment_id).first()
    if not comment:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Comment not found")

    ticket = db.query(Ticket).filter(Ticket.id == comment.ticket_id).first()
    project = check_project_access(ticket.project_id, current_user, db, require_write=True)

    is_author = comment.author_id == current_user.id
    is_owner = project.owner_id == current_user.id
    is_admin = current_user.role == settings.ROLE_ADMIN

    if not (is_author or is_owner or is_admin):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized to delete this comment")

    ticket_id = ticket.id
    project_id = project.id

    db.delete(comment)
    db.commit()

    # Broadcast WebSocket update
    await manager.broadcast_to_project(project_id, {
        "event": "COMMENT_DELETED",
        "ticket_id": ticket_id,
        "comment_id": comment_id
    })

    return None


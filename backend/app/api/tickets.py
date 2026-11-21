from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status, Response
from fastapi.responses import PlainTextResponse
from sqlalchemy.orm import Session
from sqlalchemy import or_, desc, asc
from backend.app.core.database import get_db
from backend.app.models.models import Ticket, Project, User, Comment, Attachment
from backend.app.schemas.schemas import (
    TicketCreate, TicketUpdate, TicketStatusUpdate, TicketResponse, TicketDetailResponse
)
from backend.app.api.deps import get_current_user, check_project_access
from backend.app.api.websockets import manager
from backend.app.core.config import settings

router = APIRouter(prefix="/tickets", tags=["Tickets"])

VALID_STATUSES = ["Backlog", "To Do", "In Progress", "In Review", "Done"]
VALID_PRIORITIES = ["Low", "Medium", "High", "Urgent"]
VALID_TYPES = ["Bug", "Task", "Feature"]

def ticket_to_response_dict(t: Ticket, db: Session) -> dict:
    comments_count = db.query(Comment).filter(Comment.ticket_id == t.id).count()
    return {
        "id": t.id,
        "key": t.key,
        "ticket_number": t.ticket_number,
        "title": t.title,
        "description": t.description,
        "type": t.type,
        "status": t.status,
        "priority": t.priority,
        "order_index": t.order_index,
        "estimated_hours": t.estimated_hours,
        "project_id": t.project_id,
        "reporter_id": t.reporter_id,
        "assignee_id": t.assignee_id,
        "created_at": t.created_at,
        "updated_at": t.updated_at,
        "reporter": t.reporter,
        "assignee": t.assignee,
        "attachments": t.attachments or [],
        "comments_count": comments_count
    }


@router.get("/export/{project_id}")
def export_tickets(
    project_id: int,
    format: str = Query("json", pattern="^(json|csv)$"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    project = check_project_access(project_id, current_user, db)
    tickets = db.query(Ticket).filter(Ticket.project_id == project.id).order_by(asc(Ticket.ticket_number)).all()

    if format == "csv":
        import io, csv
        output = io.StringIO()
        writer = csv.writer(output)
        writer.writerow(["Key", "Title", "Type", "Status", "Priority", "Assignee", "Reporter", "Estimated Hours", "Created At"])
        for t in tickets:
            writer.writerow([
                t.key,
                t.title,
                t.type,
                t.status,
                t.priority,
                t.assignee.full_name if t.assignee else "Unassigned",
                t.reporter.full_name if t.reporter else "",
                t.estimated_hours or "",
                t.created_at.isoformat() if t.created_at else ""
            ])
        return Response(
            content=output.getvalue(),
            media_type="text/csv",
            headers={"Content-Disposition": f"attachment; filename={project.key}_tickets.csv"}
        )

    # JSON export
    data = [ticket_to_response_dict(t, db) for t in tickets]
    return data


@router.get("", response_model=List[TicketResponse])
def get_tickets(
    project_id: int = Query(...),
    status: Optional[str] = Query(None),
    priority: Optional[str] = Query(None),
    type: Optional[str] = Query(None),
    assignee_id: Optional[int] = Query(None),
    search: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Verify access to project
    check_project_access(project_id, current_user, db)

    query = db.query(Ticket).filter(Ticket.project_id == project_id)

    if isinstance(status, str) and status:
        query = query.filter(Ticket.status == status)
    if isinstance(priority, str) and priority:
        query = query.filter(Ticket.priority == priority)
    if isinstance(type, str) and type:
        query = query.filter(Ticket.type == type)
    if isinstance(assignee_id, int):
        query = query.filter(Ticket.assignee_id == assignee_id)
    if isinstance(search, str) and search.strip():
        search_pattern = f"%{search.strip()}%"
        query = query.filter(
            or_(
                Ticket.title.ilike(search_pattern),
                Ticket.key.ilike(search_pattern),
                Ticket.description.ilike(search_pattern)
            )
        )

    # Order by order_index asc, then id asc
    tickets = query.order_by(asc(Ticket.order_index), asc(Ticket.id)).all()
    return [ticket_to_response_dict(t, db) for t in tickets]


@router.post("", response_model=TicketResponse, status_code=status.HTTP_201_CREATED)
async def create_ticket(
    ticket_in: TicketCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    project = check_project_access(ticket_in.project_id, current_user, db, require_write=True)

    # Next ticket number for project
    last_ticket = db.query(Ticket).filter(
        Ticket.project_id == project.id
    ).order_by(desc(Ticket.ticket_number)).first()

    next_number = (last_ticket.ticket_number + 1) if last_ticket else 1
    key = f"{project.key}-{next_number}"

    # Calculate max order index in target status
    max_order_ticket = db.query(Ticket).filter(
        Ticket.project_id == project.id,
        Ticket.status == ticket_in.status
    ).order_by(desc(Ticket.order_index)).first()

    next_order = (max_order_ticket.order_index + 1000.0) if max_order_ticket else 1000.0

    # Verify assignee if provided
    if ticket_in.assignee_id:
        assignee = db.query(User).filter(User.id == ticket_in.assignee_id).first()
        if not assignee:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Assignee user not found")

    ticket = Ticket(
        key=key,
        ticket_number=next_number,
        title=ticket_in.title,
        description=ticket_in.description,
        type=ticket_in.type if ticket_in.type in VALID_TYPES else "Bug",
        status=ticket_in.status if ticket_in.status in VALID_STATUSES else "To Do",
        priority=ticket_in.priority if ticket_in.priority in VALID_PRIORITIES else "Medium",
        order_index=next_order,
        estimated_hours=ticket_in.estimated_hours,
        project_id=project.id,
        reporter_id=current_user.id,
        assignee_id=ticket_in.assignee_id
    )

    db.add(ticket)
    db.commit()
    db.refresh(ticket)

    response_data = ticket_to_response_dict(ticket, db)

    # Broadcast WebSocket update
    await manager.broadcast_to_project(project.id, {
        "event": "TICKET_CREATED",
        "ticket": {
            "id": ticket.id,
            "key": ticket.key,
            "title": ticket.title,
            "status": ticket.status,
            "priority": ticket.priority,
            "type": ticket.type,
            "project_id": ticket.project_id
        }
    })

    return response_data


@router.get("/{ticket_id}", response_model=TicketDetailResponse)
def get_ticket_detail(
    ticket_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    ticket = db.query(Ticket).filter(Ticket.id == ticket_id).first()
    if not ticket:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Ticket not found")

    check_project_access(ticket.project_id, current_user, db)

    # Fetch top-level comments (parent_id is None)
    top_comments = db.query(Comment).filter(
        Comment.ticket_id == ticket.id,
        Comment.parent_id == None
    ).order_by(asc(Comment.created_at)).all()

    res = ticket_to_response_dict(ticket, db)
    res["comments"] = top_comments
    return res


@router.put("/{ticket_id}", response_model=TicketResponse)
async def update_ticket(
    ticket_id: int,
    ticket_in: TicketUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    ticket = db.query(Ticket).filter(Ticket.id == ticket_id).first()
    if not ticket:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Ticket not found")

    check_project_access(ticket.project_id, current_user, db, require_write=True)

    if ticket_in.title is not None:
        ticket.title = ticket_in.title
    if ticket_in.description is not None:
        ticket.description = ticket_in.description
    if ticket_in.type is not None and ticket_in.type in VALID_TYPES:
        ticket.type = ticket_in.type
    if ticket_in.status is not None and ticket_in.status in VALID_STATUSES:
        ticket.status = ticket_in.status
    if ticket_in.priority is not None and ticket_in.priority in VALID_PRIORITIES:
        ticket.priority = ticket_in.priority
    if ticket_in.order_index is not None:
        ticket.order_index = ticket_in.order_index
    if ticket_in.estimated_hours is not None:
        ticket.estimated_hours = ticket_in.estimated_hours
    if ticket_in.assignee_id is not None:
        if ticket_in.assignee_id > 0:
            assignee = db.query(User).filter(User.id == ticket_in.assignee_id).first()
            if not assignee:
                raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Assignee not found")
            ticket.assignee_id = ticket_in.assignee_id
        else:
            ticket.assignee_id = None

    db.commit()
    db.refresh(ticket)

    response_data = ticket_to_response_dict(ticket, db)

    # Broadcast WebSocket update
    await manager.broadcast_to_project(ticket.project_id, {
        "event": "TICKET_UPDATED",
        "ticket": {
            "id": ticket.id,
            "key": ticket.key,
            "title": ticket.title,
            "status": ticket.status,
            "priority": ticket.priority,
            "type": ticket.type,
            "order_index": ticket.order_index,
            "assignee_id": ticket.assignee_id
        }
    })

    return response_data


@router.patch("/{ticket_id}/status", response_model=TicketResponse)
async def update_ticket_status(
    ticket_id: int,
    status_in: TicketStatusUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    ticket = db.query(Ticket).filter(Ticket.id == ticket_id).first()
    if not ticket:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Ticket not found")

    check_project_access(ticket.project_id, current_user, db, require_write=True)

    if status_in.status not in VALID_STATUSES:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Invalid status: {status_in.status}")

    ticket.status = status_in.status
    if status_in.order_index is not None:
        ticket.order_index = status_in.order_index

    db.commit()
    db.refresh(ticket)

    response_data = ticket_to_response_dict(ticket, db)

    # Broadcast WebSocket update
    await manager.broadcast_to_project(ticket.project_id, {
        "event": "TICKET_MOVED",
        "ticket": {
            "id": ticket.id,
            "key": ticket.key,
            "status": ticket.status,
            "order_index": ticket.order_index
        }
    })

    return response_data


@router.delete("/{ticket_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_ticket(
    ticket_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    ticket = db.query(Ticket).filter(Ticket.id == ticket_id).first()
    if not ticket:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Ticket not found")

    project = check_project_access(ticket.project_id, current_user, db, require_write=True)

    # Only Reporter, Project Owner, or Admin can delete
    is_owner = project.owner_id == current_user.id
    is_reporter = ticket.reporter_id == current_user.id
    is_admin = current_user.role == settings.ROLE_ADMIN

    if not (is_owner or is_reporter or is_admin):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not authorized to delete this ticket"
        )

    project_id = ticket.project_id
    ticket_id_val = ticket.id

    db.delete(ticket)
    db.commit()

    # Broadcast WebSocket update
    await manager.broadcast_to_project(project_id, {
        "event": "TICKET_DELETED",
        "ticket_id": ticket_id_val
    })

    return None

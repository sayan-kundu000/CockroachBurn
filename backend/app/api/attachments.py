import os
import uuid
from typing import List
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, status
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from backend.app.core.database import get_db
from backend.app.models.models import Attachment, Ticket, User
from backend.app.schemas.schemas import AttachmentResponse
from backend.app.api.deps import get_current_user, check_project_access
from backend.app.api.websockets import manager
from backend.app.core.config import settings

router = APIRouter(prefix="/attachments", tags=["Attachments"])

ALLOWED_IMAGE_TYPES = {"image/jpeg", "image/png", "image/gif", "image/webp", "image/svg+xml", "application/pdf"}
MAX_FILE_SIZE = 15 * 1024 * 1024  # 15 MB

@router.post("/ticket/{ticket_id}", response_model=AttachmentResponse, status_code=status.HTTP_201_CREATED)
async def upload_attachment(
    ticket_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    ticket = db.query(Ticket).filter(Ticket.id == ticket_id).first()
    if not ticket:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Ticket not found")

    check_project_access(ticket.project_id, current_user, db, require_write=True)

    # Sanitize and generate unique filename
    ext = os.path.splitext(file.filename)[1].lower()
    unique_filename = f"{uuid.uuid4().hex}{ext}"
    destination_path = os.path.join(settings.UPLOAD_DIR, unique_filename)

    # Save content to disk
    contents = await file.read()
    file_size = len(contents)

    if file_size > MAX_FILE_SIZE:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="File exceeds maximum size of 15MB")

    with open(destination_path, "wb") as f:
        f.write(contents)

    content_type = file.content_type or "application/octet-stream"

    attachment = Attachment(
        filename=unique_filename,
        original_name=file.filename or "unnamed_attachment",
        file_path=f"/api/attachments/file/{unique_filename}",
        file_size=file_size,
        content_type=content_type,
        ticket_id=ticket.id,
        uploaded_by_id=current_user.id
    )
    db.add(attachment)
    db.commit()
    db.refresh(attachment)

    # Broadcast WebSocket update
    await manager.broadcast_to_project(ticket.project_id, {
        "event": "ATTACHMENT_UPLOADED",
        "ticket_id": ticket.id,
        "attachment_id": attachment.id,
        "filename": attachment.original_name
    })

    return attachment


@router.get("/file/{filename}")
def serve_attachment(filename: str):
    # Prevent path traversal
    safe_filename = os.path.basename(filename)
    file_path = os.path.join(settings.UPLOAD_DIR, safe_filename)

    if not os.path.isfile(file_path):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="File not found")

    return FileResponse(file_path)


@router.delete("/{attachment_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_attachment(
    attachment_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    attachment = db.query(Attachment).filter(Attachment.id == attachment_id).first()
    if not attachment:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Attachment not found")

    ticket = db.query(Ticket).filter(Ticket.id == attachment.ticket_id).first()
    project = check_project_access(ticket.project_id, current_user, db, require_write=True)

    is_uploader = attachment.uploaded_by_id == current_user.id
    is_owner = project.owner_id == current_user.id
    is_admin = current_user.role == settings.ROLE_ADMIN

    if not (is_uploader or is_owner or is_admin):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized to delete this attachment")

    file_path = os.path.join(settings.UPLOAD_DIR, attachment.filename)
    if os.path.isfile(file_path):
        try:
            os.remove(file_path)
        except Exception:
            pass

    ticket_id = ticket.id
    project_id = project.id

    db.delete(attachment)
    db.commit()

    # Broadcast WebSocket update
    await manager.broadcast_to_project(project_id, {
        "event": "ATTACHMENT_DELETED",
        "ticket_id": ticket_id,
        "attachment_id": attachment_id
    })

    return None


from typing import Optional, Dict, Any, List
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session
from backend.app.core.database import get_db
from backend.app.models.models import Ticket, User
from backend.app.api.deps import get_current_user, check_project_access
from backend.app.services.bugmardini_ai import bugmardini_ai

router = APIRouter(prefix="/bugmardini", tags=["Bugmardini AI"])

class AnalyzeBugRequest(BaseModel):
    ticket_id: Optional[int] = None
    title: Optional[str] = None
    description: Optional[str] = None
    error_logs: Optional[str] = None
    programming_lang: Optional[str] = "python"

class BugmardiniChatRequest(BaseModel):
    query: str
    ticket_id: Optional[int] = None
    context: Optional[Dict[str, Any]] = None

@router.post("/analyze")
def analyze_issue(
    payload: AnalyzeBugRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    title = payload.title or ""
    description = payload.description or ""
    error_logs = payload.error_logs or ""

    # If ticket_id provided, enrich from database
    if payload.ticket_id:
        ticket = db.query(Ticket).filter(Ticket.id == payload.ticket_id).first()
        if not ticket:
            raise HTTPException(status_code=404, detail="Ticket not found")
        
        check_project_access(ticket.project_id, current_user, db)
        title = ticket.title
        description = ticket.description or ""
        
        # Include ticket comments context if available
        if ticket.comments:
            comment_text = "\n".join([f"Comment by {c.author.full_name}: {c.content}" for c in ticket.comments])
            description += f"\n\nContext from discussion:\n{comment_text}"

    if not title.strip():
        raise HTTPException(status_code=400, detail="Title or ticket_id is required for analysis")

    analysis = bugmardini_ai.analyze_bug(
        title=title,
        description=description,
        error_logs=error_logs,
        programming_lang=payload.programming_lang or "python"
    )
    
    return {
        "status": "success",
        "agent": "Bugmardini AI",
        "persona": bugmardini_ai.persona,
        "voice": bugmardini_ai.voice_type,
        "analysis": analysis
    }

@router.post("/chat")
def chat_with_bugmardini(
    payload: BugmardiniChatRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if not payload.query.strip():
        raise HTTPException(status_code=400, detail="Query cannot be empty")

    context = payload.context or {}
    if payload.ticket_id:
        ticket = db.query(Ticket).filter(Ticket.id == payload.ticket_id).first()
        if ticket:
            context["ticket_key"] = ticket.key
            context["ticket_title"] = ticket.title

    result = bugmardini_ai.chat_follow_up(payload.query, context)
    return {
        "status": "success",
        "agent": "Bugmardini AI",
        "answer": result["answer"],
        "voice_script": result["voice_script"]
    }


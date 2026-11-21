import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent.parent))

import pytest
from backend.app.core.database import SessionLocal
from backend.app.models.models import User, Project, Ticket, Comment
from backend.app.api.auth import login, register
from backend.app.api.projects import get_user_projects, create_project
from backend.app.api.tickets import get_tickets, ticket_to_response_dict
from backend.app.schemas.schemas import LoginRequest, ProjectCreate, UserCreate

def test_seeded_users():
    db = SessionLocal()
    try:
        users = db.query(User).all()
        usernames = [u.username for u in users]
        assert "admin" in usernames
        assert "developer" in usernames
        assert "viewer" in usernames
        print(f"Users found: {usernames}")
    finally:
        db.close()

def test_login_logic():
    db = SessionLocal()
    try:
        req = LoginRequest(username_or_email="admin", password="Password123!")
        result = login(req, db)
        assert result["access_token"] is not None
        assert result["user"].username == "admin"
        assert result["user"].role == "Admin"
        print("Login logic OK! Token generated.")
    finally:
        db.close()

def test_projects_query():
    db = SessionLocal()
    try:
        admin = db.query(User).filter(User.username == "admin").first()
        projects = get_user_projects(db, admin)
        assert len(projects) >= 2
        keys = [p["key"] for p in projects]
        assert "ALPHA" in keys
        print(f"Projects found for admin: {keys}")
    finally:
        db.close()

def test_tickets_query():
    db = SessionLocal()
    try:
        admin = db.query(User).filter(User.username == "admin").first()
        alpha = db.query(Project).filter(Project.key == "ALPHA").first()
        tickets = get_tickets(project_id=alpha.id, db=db, current_user=admin)
        assert len(tickets) >= 5
        print(f"Retrieved {len(tickets)} tickets for ALPHA project.")
        
        # Verify ticket structure
        t0 = tickets[0]
        assert "key" in t0
        assert "status" in t0
        assert "priority" in t0
        assert "reporter" in t0
    finally:
        db.close()

def test_bugmardini_ai():
    from backend.app.services.bugmardini_ai import bugmardini_ai
    
    # Test Race Condition bug analysis
    res = bugmardini_ai.analyze_bug("Race condition in token refresh under concurrent API bursts")
    assert res["category"] == "Concurrency & Token Race Condition"
    assert "teller" in res["simple_explanation"].lower() or "bank" in res["simple_explanation"].lower()
    assert "code_before" in res
    assert "code_after" in res
    assert "voice_script" in res
    assert len(res["voice_script"]) > 50
    print("Bugmardini AI analysis verified successfully!")

    # Test Chat follow-up
    chat_res = bugmardini_ai.chat_follow_up("Can you explain this simpler?")
    assert "simple" in chat_res["answer"].lower() or "kitchen" in chat_res["answer"].lower()
    assert "voice_script" in chat_res
    print("Bugmardini AI conversational follow-up verified successfully!")

if __name__ == "__main__":
    test_seeded_users()
    test_login_logic()
    test_projects_query()
    test_tickets_query()
    print("ALL BACKEND BUSINESS LOGIC TESTS PASSED SUCCESSFULLY!")
    test_bugmardini_ai()
    print("ALL BACKEND BUSINESS LOGIC & BUGMARDINI AI TESTS PASSED SUCCESSFULLY!")

import pytest
from fastapi.testclient import TestClient
from backend.app.main import app

client = TestClient(app)

def test_health_check():
    response = client.get("/api/health")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"

def test_login_success():
    response = client.post("/api/auth/login", json={
        "username_or_email": "admin",
        "password": "Password123!"
    })
    assert response.status_code == 200
    data = response.json()
    assert "access_token" == "access_token" in data
    assert data["user"]["username"] == "admin"
    assert data["user"]["role"] == "Admin"

def test_login_invalid_password():
    response = client.post("/api/auth/login", json={
        "username_or_email": "admin",
        "password": "WrongPassword"
    })
    assert response.status_code == 401

def test_get_projects_authenticated():
    # Login as admin
    login_res = client.post("/api/auth/login", json={
        "username_or_email": "admin",
        "password": "Password123!"
    })
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Get projects
    response = client.get("/api/projects", headers=headers)
    assert response.status_code == 200
    projects = response.json()
    assert len(projects) >= 2
    assert any(p["key"] == "ALPHA" for p in projects)

def test_get_tickets_and_filter():
    login_res = client.post("/api/auth/login", json={
        "username_or_email": "admin",
        "password": "Password123!"
    })
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # First get project ALPHA
    projects_res = client.get("/api/projects", headers=headers)
    alpha_proj = next(p for p in projects_res.json() if p["key"] == "ALPHA")

    # Get tickets
    tickets_res = client.get(f"/api/tickets?project_id={alpha_proj['id']}", headers=headers)
    assert tickets_res.status_code == 200
    tickets = tickets_res.json()
    assert len(tickets) >= 5

    # Filter by status "In Progress"
    filtered_res = client.get(f"/api/tickets?project_id={alpha_proj['id']}&status=In Progress", headers=headers)
    assert filtered_res.status_code == 200
    filtered_tickets = filtered_res.json()
    assert all(t["status"] == "In Progress" for t in filtered_tickets)

    # Search keyword
    search_res = client.get(f"/api/tickets?project_id={alpha_proj['id']}&search=token", headers=headers)
    assert search_res.status_code == 200
    assert len(search_res.json()) >= 1

def test_update_ticket_status_kanban():
    login_res = client.post("/api/auth/login", json={
        "username_or_email": "developer",
        "password": "Password123!"
    })
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    projects_res = client.get("/api/projects", headers=headers)
    alpha_proj = next(p for p in projects_res.json() if p["key"] == "ALPHA")
    tickets_res = client.get(f"/api/tickets?project_id={alpha_proj['id']}", headers=headers)
    first_ticket = tickets_res.json()[0]

    # Move status
    move_res = client.patch(
        f"/api/tickets/{first_ticket['id']}/status",
        json={"status": "Done", "order_index": 5000.0},
        headers=headers
    )
    assert move_res.status_code == 200
    assert move_res.json()["status"] == "Done"

def test_add_and_get_comment():
    login_res = client.post("/api/auth/login", json={
        "username_or_email": "developer",
        "password": "Password123!"
    })
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    projects_res = client.get("/api/projects", headers=headers)
    alpha_proj = next(p for p in projects_res.json() if p["key"] == "ALPHA")
    tickets_res = client.get(f"/api/tickets?project_id={alpha_proj['id']}", headers=headers)
    first_ticket = tickets_res.json()[0]

    # Post comment
    comment_res = client.post(
        f"/api/comments/ticket/{first_ticket['id']}",
        json={"content": "Unit test verified automated comment."},
        headers=headers
    )
    assert comment_res.status_code == 201
    assert comment_res.json()["content"] == "Unit test verified automated comment."

def test_role_based_access_viewer_cannot_create_ticket():
    # Login as viewer
    login_res = client.post("/api/auth/login", json={
        "username_or_email": "viewer",
        "password": "Password123!"
    })
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    projects_res = client.get("/api/projects", headers=headers)
    alpha_proj = next(p for p in projects_res.json() if p["key"] == "ALPHA")

    # Viewer tries to create ticket -> forbidden!
    create_res = client.post(
        "/api/tickets",
        json={
            "project_id": alpha_proj["id"],
            "title": "Unauthorized ticket by viewer",
            "type": "Bug",
            "status": "To Do",
            "priority": "Medium"
        },
        headers=headers
    )
    assert create_res.status_code == 403


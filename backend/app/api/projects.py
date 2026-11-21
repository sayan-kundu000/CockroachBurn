from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from backend.app.core.database import get_db
from backend.app.models.models import Project, ProjectMember, User, Ticket
from backend.app.schemas.schemas import (
    ProjectCreate, ProjectUpdate, ProjectResponse, ProjectDetailResponse,
    ProjectMemberAdd, ProjectMemberResponse
)
from backend.app.api.deps import get_current_user, require_role, check_project_access
from backend.app.core.config import settings

router = APIRouter(prefix="/projects", tags=["Projects"])

@router.get("", response_model=List[ProjectResponse])
def get_user_projects(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role == settings.ROLE_ADMIN:
        projects = db.query(Project).all()
    else:
        # Projects owned or where user is a member
        member_proj_ids = db.query(ProjectMember.project_id).filter(ProjectMember.user_id == current_user.id).subquery()
        projects = db.query(Project).filter(
            (Project.owner_id == current_user.id) | (Project.id.in_(member_proj_ids))
        ).all()

    # Populate counts
    result = []
    for p in projects:
        members_count = db.query(ProjectMember).filter(ProjectMember.project_id == p.id).count()
        tickets_count = db.query(Ticket).filter(Ticket.project_id == p.id).count()
        p_dict = {
            "id": p.id,
            "name": p.name,
            "key": p.key,
            "description": p.description,
            "owner_id": p.owner_id,
            "created_at": p.created_at,
            "owner": p.owner,
            "members_count": members_count,
            "tickets_count": tickets_count
        }
        result.append(p_dict)
    return result


@router.post("", response_model=ProjectResponse, status_code=status.HTTP_201_CREATED)
def create_project(
    project_in: ProjectCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role([settings.ROLE_ADMIN, settings.ROLE_DEVELOPER]))
):
    key = project_in.key.upper().strip()
    if db.query(Project).filter(Project.key == key).first():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Project with key '{key}' already exists"
        )

    project = Project(
        name=project_in.name,
        key=key,
        description=project_in.description,
        owner_id=current_user.id
    )
    db.add(project)
    db.flush()

    # Add owner as admin member
    owner_member = ProjectMember(
        project_id=project.id,
        user_id=current_user.id,
        role=settings.ROLE_ADMIN
    )
    db.add(owner_member)
    db.commit()
    db.refresh(project)

    return {
        "id": project.id,
        "name": project.name,
        "key": project.key,
        "description": project.description,
        "owner_id": project.owner_id,
        "created_at": project.created_at,
        "owner": current_user,
        "members_count": 1,
        "tickets_count": 0
    }


@router.get("/{project_id}", response_model=ProjectDetailResponse)
def get_project_details(
    project_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    project = check_project_access(project_id, current_user, db)
    members_count = db.query(ProjectMember).filter(ProjectMember.project_id == project.id).count()
    tickets_count = db.query(Ticket).filter(Ticket.project_id == project.id).count()
    members = db.query(ProjectMember).filter(ProjectMember.project_id == project.id).all()

    return {
        "id": project.id,
        "name": project.name,
        "key": project.key,
        "description": project.description,
        "owner_id": project.owner_id,
        "created_at": project.created_at,
        "owner": project.owner,
        "members_count": members_count,
        "tickets_count": tickets_count,
        "members": members
    }


@router.put("/{project_id}", response_model=ProjectResponse)
def update_project(
    project_id: int,
    project_in: ProjectUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    project = check_project_access(project_id, current_user, db, require_write=True)
    if current_user.role != settings.ROLE_ADMIN and project.owner_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only project owner or Admin can update project settings")

    if project_in.name is not None:
        project.name = project_in.name
    if project_in.description is not None:
        project.description = project_in.description

    db.commit()
    db.refresh(project)

    members_count = db.query(ProjectMember).filter(ProjectMember.project_id == project.id).count()
    tickets_count = db.query(Ticket).filter(Ticket.project_id == project.id).count()

    return {
        "id": project.id,
        "name": project.name,
        "key": project.key,
        "description": project.description,
        "owner_id": project.owner_id,
        "created_at": project.created_at,
        "owner": project.owner,
        "members_count": members_count,
        "tickets_count": tickets_count
    }


@router.delete("/{project_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_project(
    project_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    project = check_project_access(project_id, current_user, db, require_write=True)
    if current_user.role != settings.ROLE_ADMIN and project.owner_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only project owner or Admin can delete project")

    db.delete(project)
    db.commit()
    return None


@router.post("/{project_id}/members", response_model=ProjectMemberResponse)
def add_project_member(
    project_id: int,
    member_in: ProjectMemberAdd,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    project = check_project_access(project_id, current_user, db, require_write=True)
    if current_user.role != settings.ROLE_ADMIN and project.owner_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only project owner or Admin can add members")

    user_to_add = db.query(User).filter(User.id == member_in.user_id).first()
    if not user_to_add:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User to add does not exist")

    existing = db.query(ProjectMember).filter(
        ProjectMember.project_id == project_id,
        ProjectMember.user_id == member_in.user_id
    ).first()

    if existing:
        existing.role = member_in.role
        db.commit()
        db.refresh(existing)
        return existing

    member = ProjectMember(
        project_id=project_id,
        user_id=member_in.user_id,
        role=member_in.role
    )
    db.add(member)
    db.commit()
    db.refresh(member)
    return member


@router.delete("/{project_id}/members/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
def remove_project_member(
    project_id: int,
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    project = check_project_access(project_id, current_user, db, require_write=True)
    if current_user.role != settings.ROLE_ADMIN and project.owner_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only project owner or Admin can remove members")

    member = db.query(ProjectMember).filter(
        ProjectMember.project_id == project_id,
        ProjectMember.user_id == user_id
    ).first()

    if not member:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Member not found in project")

    db.delete(member)
    db.commit()
    return None


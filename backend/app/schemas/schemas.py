from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, EmailStr, Field

# --- User Schemas ---
class UserBase(BaseModel):
    email: str
    username: str
    full_name: str
    role: str = "Developer"  # Admin, Developer, Viewer

class UserCreate(UserBase):
    password: str

class UserUpdateRole(BaseModel):
    role: str

class UserSimpleResponse(BaseModel):
    id: int
    email: str
    username: str
    full_name: str
    role: str
    avatar_color: Optional[str] = "#3b82f6"

    class Config:
        from_attributes = True

class UserResponse(UserSimpleResponse):
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True


# --- Auth Schemas ---
class Token(BaseModel):
    access_token: str
    token_type: str
    user: UserResponse

class TokenData(BaseModel):
    user_id: Optional[int] = None

class LoginRequest(BaseModel):
    username_or_email: str
    password: str


# --- Project Member Schemas ---
class ProjectMemberAdd(BaseModel):
    user_id: int
    role: str = "Developer"

class ProjectMemberResponse(BaseModel):
    id: int
    user_id: int
    project_id: int
    role: str
    joined_at: datetime
    user: UserSimpleResponse

    class Config:
        from_attributes = True


# --- Attachment Schemas ---
class AttachmentResponse(BaseModel):
    id: int
    filename: str
    original_name: str
    file_path: str
    file_size: int
    content_type: str
    ticket_id: int
    uploaded_by_id: int
    created_at: datetime
    uploaded_by: Optional[UserSimpleResponse] = None

    class Config:
        from_attributes = True


# --- Comment Schemas ---
class CommentCreate(BaseModel):
    content: str
    parent_id: Optional[int] = None

class CommentResponse(BaseModel):
    id: int
    content: str
    ticket_id: int
    author_id: int
    parent_id: Optional[int] = None
    created_at: datetime
    updated_at: datetime
    author: UserSimpleResponse
    replies: List['CommentResponse'] = []

    class Config:
        from_attributes = True


# --- Ticket Schemas ---
class TicketBase(BaseModel):
    title: str
    description: Optional[str] = None
    type: str = "Bug"       # Bug, Task, Feature
    status: str = "To Do"   # Backlog, To Do, In Progress, In Review, Done
    priority: str = "Medium" # Low, Medium, High, Urgent
    estimated_hours: Optional[float] = None
    assignee_id: Optional[int] = None

class TicketCreate(TicketBase):
    project_id: int

class TicketUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    type: Optional[str] = None
    status: Optional[str] = None
    priority: Optional[str] = None
    order_index: Optional[float] = None
    estimated_hours: Optional[float] = None
    assignee_id: Optional[int] = None

class TicketStatusUpdate(BaseModel):
    status: str
    order_index: Optional[float] = None

class TicketResponse(BaseModel):
    id: int
    key: str
    ticket_number: int
    title: str
    description: Optional[str] = None
    type: str
    status: str
    priority: str
    order_index: float
    estimated_hours: Optional[float] = None
    project_id: int
    reporter_id: int
    assignee_id: Optional[int] = None
    created_at: datetime
    updated_at: datetime
    reporter: UserSimpleResponse
    assignee: Optional[UserSimpleResponse] = None
    attachments: List[AttachmentResponse] = []
    comments_count: Optional[int] = 0

    class Config:
        from_attributes = True

class TicketDetailResponse(TicketResponse):
    comments: List[CommentResponse] = []

    class Config:
        from_attributes = True


# --- Project Schemas ---
class ProjectBase(BaseModel):
    name: str
    key: str = Field(..., max_length=10, min_length=2)
    description: Optional[str] = None

class ProjectCreate(ProjectBase):
    pass

class ProjectUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None

class ProjectResponse(BaseModel):
    id: int
    name: str
    key: str
    description: Optional[str] = None
    owner_id: int
    created_at: datetime
    owner: UserSimpleResponse
    members_count: Optional[int] = 0
    tickets_count: Optional[int] = 0

    class Config:
        from_attributes = True

class ProjectDetailResponse(ProjectResponse):
    members: List[ProjectMemberResponse] = []

    class Config:
        from_attributes = True

import os
from typing import List
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    PROJECT_NAME: str = "Bug Tracker / Issue Tracker (Jira-like)"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api"
    SECRET_KEY: str = os.getenv("SECRET_KEY", "super-secret-bug-tracker-jwt-key-for-development-change-in-prod-2026")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days
    
    # Database: SQLite default, or set DATABASE_URL=postgresql://user:pass@localhost:5432/bugtracker
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./bugtracker.db")
    
    # Uploads directory
    UPLOAD_DIR: str = os.getenv("UPLOAD_DIR", os.path.abspath(os.path.join(os.path.dirname(__file__), "../../uploads")))
    
    # CORS
    BACKEND_CORS_ORIGINS: List[str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "*"
    ]
    
    # Roles
    ROLE_ADMIN: str = "Admin"
    ROLE_DEVELOPER: str = "Developer"
    ROLE_VIEWER: str = "Viewer"

    model_config = SettingsConfigDict(case_sensitive=True)

settings = Settings()
os.makedirs(settings.UPLOAD_DIR, exist_ok=True)

@echo off
echo ========================================================
echo Starting BugTracker Backend (FastAPI + SQLAlchemy)
echo API Docs: http://localhost:8000/docs
echo WebSockets: ws://localhost:8000/api/ws/project/{id}
echo ========================================================
backend\.venv\Scripts\python.exe -m uvicorn backend.app.main:app --host 0.0.0.0 --port 8000 --reload
pause


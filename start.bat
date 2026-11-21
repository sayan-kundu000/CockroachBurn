@echo off
echo ========================================================
echo   Launching BugTracker / Issue Tracker Full-Stack System
echo ========================================================
echo.
echo Starting Backend API server on http://localhost:8000 ...
start "BugTracker Backend (FastAPI)" cmd /k "backend\.venv\Scripts\python.exe -m uvicorn backend.app.main:app --host 127.0.0.1 --port 8000 --reload"

echo Starting Frontend Dev server on http://localhost:3000 ...
start "BugTracker Frontend (Vite React)" cmd /k "cd frontend && npm run dev"

echo.
echo ========================================================
echo Services launched!
echo.
echo - Frontend Web UI:  http://localhost:3000
echo - Backend API Docs: http://localhost:8000/docs (or http://localhost:3000/docs)
echo.
echo Demo Accounts:
echo   Admin:     admin     / Password123!
echo   Developer: developer / Password123!
echo   Viewer:    viewer    / Password123!
echo ========================================================
pause


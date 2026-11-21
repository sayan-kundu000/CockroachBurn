@echo off
echo Seeding BugTracker Database...
backend\.venv\Scripts\python.exe backend/app/seed.py
pause


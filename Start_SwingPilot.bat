@echo off
cd /d "%~dp0"
title SwingPilot Offline Visual Library
python --version >nul 2>&1
if errorlevel 1 (
  echo Python was not found. Install Python 3 and try again.
  pause
  exit /b 1
)
python -c "import flask" >nul 2>&1
if errorlevel 1 (
  echo Installing the required Flask package...
  python -m pip install -r requirements.txt
  if errorlevel 1 (
    echo Package installation failed. Check internet access for this one-time setup.
    pause
    exit /b 1
  )
)
start "" http://127.0.0.1:8765
python app.py
pause

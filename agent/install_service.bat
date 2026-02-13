@echo off
echo ========================================
echo IT Monitor Agent - Service Installer
echo ========================================
echo.

REM Check for administrator privileges
net session >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Please run this script as Administrator!
    echo Right-click and select "Run as administrator"
    pause
    exit /b 1
)

REM Set variables
set AGENT_DIR=%~dp0
set TASK_NAME=ITMonitorAgent

echo Agent Directory: %AGENT_DIR%
echo.

REM Detect mode: .exe or .py
if exist "%AGENT_DIR%agent.exe" (
    set AGENT_CMD="%AGENT_DIR%agent.exe"
    echo Mode: EXE (standalone)
) else (
    REM Check Python installation
    python --version >nul 2>&1
    if %errorlevel% neq 0 (
        echo ERROR: agent.exe not found and Python is not installed!
        echo Either build agent.exe or install Python 3.8+ from https://python.org
        pause
        exit /b 1
    )
    echo Mode: Python script
    echo Installing Python dependencies...
    python -m pip install -r "%AGENT_DIR%requirements.txt" --quiet
    echo Dependencies installed.
    set AGENT_CMD=python "%AGENT_DIR%agent.py"
)
echo.

REM Check config.json exists
if not exist "%AGENT_DIR%config.json" (
    echo WARNING: config.json not found! A default will be created on first run.
    echo Please edit config.json to set your server URL and department.
    echo.
)

REM Create a scheduled task that runs at startup
echo Creating Windows Scheduled Task: %TASK_NAME%
schtasks /delete /tn "%TASK_NAME%" /f >nul 2>&1
schtasks /create /tn "%TASK_NAME%" /tr "%AGENT_CMD%" /sc onlogon /rl highest /f

if %errorlevel% equ 0 (
    echo.
    echo ========================================
    echo SUCCESS! Agent has been installed.
    echo ========================================
    echo.
    echo The agent will start automatically when the user logs in.
    echo.
    echo To start it now, run:
    echo   %AGENT_CMD%
    echo.
    echo Configuration: %AGENT_DIR%config.json
    echo Logs:          %AGENT_DIR%logs\agent.log
    echo.
    echo To uninstall, run uninstall_service.bat
    echo.
) else (
    echo ERROR: Failed to create scheduled task.
)

pause

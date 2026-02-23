@echo off
setlocal

set SILENT=0
if /I "%~1"=="/silent" set SILENT=1

if "%SILENT%"=="1" goto :NO_BANNER
echo ========================================
echo IT Monitor Agent - Service Installer
echo ========================================
echo.
:NO_BANNER

REM Check for administrator privileges
net session >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Please run this script as Administrator!
    if "%SILENT%"=="0" (
        echo Right-click and select "Run as administrator"
        pause
    )
    exit /b 1
)

REM Set variables
set AGENT_DIR=%~dp0
set TASK_NAME=ITMonitorAgent

echo Agent Directory: %AGENT_DIR%
echo.

REM Detect mode: .exe or .py
if exist "%AGENT_DIR%agent.exe" goto :MODE_EXE
goto :MODE_PYTHON

:MODE_EXE
set "AGENT_CMD=%AGENT_DIR%agent.exe"
echo Mode: EXE (standalone - no Python needed)
goto :INSTALL

:MODE_PYTHON
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: agent.exe not found and Python is not installed!
    if "%SILENT%"=="0" (
        echo Either build agent.exe or install Python 3.8+ from https://python.org
        pause
    )
    exit /b 1
)
echo Mode: Python script
if exist "%AGENT_DIR%requirements.txt" (
    echo Installing Python dependencies...
    python -m pip install -r "%AGENT_DIR%requirements.txt" --quiet
    echo Dependencies installed.
)
set "AGENT_CMD=python "%AGENT_DIR%agent.py""
goto :INSTALL

:INSTALL
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
schtasks /create /tn "%TASK_NAME%" /tr "\"%AGENT_CMD%\"" /sc onlogon /rl highest /f

if %errorlevel% neq 0 (
    echo ERROR: Failed to create scheduled task.
    if "%SILENT%"=="0" pause
    exit /b 1
)

echo.
echo ========================================
echo SUCCESS! Agent has been installed.
echo ========================================
echo.
echo The agent will start automatically when the user logs in.
echo.
echo To start it now, run:
echo   "%AGENT_CMD%"
echo.
echo Configuration: %AGENT_DIR%config.json
echo Logs:          %AGENT_DIR%logs\agent.log
echo.
echo To uninstall, run uninstall_service.bat
echo.

if "%SILENT%"=="0" pause
exit /b 0

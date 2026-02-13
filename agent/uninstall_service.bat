@echo off
echo ========================================
echo IT Monitor Agent - Uninstaller
echo ========================================
echo.

net session >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Please run this script as Administrator!
    pause
    exit /b 1
)

set TASK_NAME=ITMonitorAgent

REM Stop any running agent process
echo Stopping agent process...
taskkill /f /im agent.exe >nul 2>&1
taskkill /f /fi "WINDOWTITLE eq IT Monitor Agent" >nul 2>&1

echo Removing scheduled task: %TASK_NAME%
schtasks /delete /tn "%TASK_NAME%" /f

if %errorlevel% equ 0 (
    echo.
    echo ========================================
    echo Agent has been uninstalled successfully.
    echo ========================================
    echo.
    echo Note: Log files and offline reports are kept in:
    echo   %~dp0logs\
    echo   %~dp0offline_reports\
    echo You can delete them manually if needed.
) else (
    echo.
    echo Task not found or already removed.
)

pause

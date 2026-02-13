@echo off
echo ========================================
echo IT Monitor Agent - Build EXE
echo ========================================
echo.

REM Check Python
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Python is not installed or not in PATH!
    pause
    exit /b 1
)

REM Install dependencies
echo Installing dependencies...
pip install -r requirements.txt --quiet
pip install pyinstaller --quiet
echo.

REM Clean previous build
echo Cleaning previous build...
if exist "dist" rmdir /s /q dist
if exist "build" rmdir /s /q build
if exist "agent.spec" del agent.spec
echo.

REM Build EXE
echo Building agent.exe...
pyinstaller --onefile --noconsole --name agent --clean --hidden-import pystray._win32 --hidden-import PIL agent.py

if %errorlevel% neq 0 (
    echo.
    echo ERROR: Build failed!
    pause
    exit /b 1
)

echo.
echo ========================================
echo Build successful!
echo ========================================
echo.

REM Create distribution folder
set DIST_DIR=dist\it-monitor-agent
echo Creating distribution package: %DIST_DIR%
if not exist "%DIST_DIR%" mkdir "%DIST_DIR%"

REM Generate icon files
echo Generating icon files...
python generate_icon.py

copy dist\agent.exe "%DIST_DIR%\" >nul
copy config.json "%DIST_DIR%\" >nul
copy install_service.bat "%DIST_DIR%\" >nul
copy uninstall_service.bat "%DIST_DIR%\" >nul
copy icon_green.ico "%DIST_DIR%\" >nul
copy icon_yellow.ico "%DIST_DIR%\" >nul
copy icon_red.ico "%DIST_DIR%\" >nul
copy icon_gray.ico "%DIST_DIR%\" >nul

echo.
echo Distribution package ready at: %DIST_DIR%\
echo.
echo Contents:
echo   agent.exe            - Agent program (no Python needed)
echo   config.json          - Configuration (edit before install)
echo   install_service.bat  - Install as Windows service
echo   uninstall_service.bat - Uninstall service
echo.
echo Next steps:
echo   1. Edit config.json (set server_url and department)
echo   2. Copy the folder to target computers
echo   3. Run install_service.bat as Administrator
echo.

pause

"""
IT Monitor Agent - Self Update
Checks for new versions and auto-updates the agent executable.
"""

import os
import sys
import json
import time
import shutil
import logging
import zipfile
import tempfile
import subprocess
import requests

logger = logging.getLogger("ITMonitorAgent")

VERSION_FILE = "version.json"


def get_base_dir():
    """Get the base directory."""
    if getattr(sys, 'frozen', False):
        return os.path.dirname(sys.executable)
    else:
        return os.path.dirname(os.path.abspath(__file__))


def get_current_version():
    """Read current version from version.json."""
    base_dir = get_base_dir()
    version_path = os.path.join(base_dir, VERSION_FILE)
    try:
        if os.path.exists(version_path):
            with open(version_path, "r", encoding="utf-8") as f:
                data = json.load(f)
            return data.get("version", "unknown")
    except Exception as e:
        logger.error(f"Error reading version file: {e}")
    return "unknown"


def save_current_version(version):
    """Save current version to version.json."""
    base_dir = get_base_dir()
    version_path = os.path.join(base_dir, VERSION_FILE)
    try:
        data = {"version": version, "updated_at": time.strftime("%Y-%m-%d %H:%M:%S")}
        with open(version_path, "w", encoding="utf-8") as f:
            json.dump(data, f, indent=2)
        logger.info(f"Version saved: {version}")
    except Exception as e:
        logger.error(f"Error saving version file: {e}")


def check_for_update(server_url):
    """
    Check if a new version is available.
    Returns dict with 'available' (bool), 'version', 'download_url' or None.
    """
    try:
        url = f"{server_url}/api/agent/version"
        resp = requests.get(url, timeout=10)
        if resp.status_code != 200:
            logger.warning(f"Version check failed: HTTP {resp.status_code}")
            return None

        info = resp.json()
        remote_version = info.get("version", "unknown")
        current_version = get_current_version()
        download_url = info.get("download_url")

        logger.info(f"Version check: current={current_version}, latest={remote_version}")

        if remote_version == "unknown" or not download_url:
            return {"available": False, "version": remote_version, "download_url": None}

        if remote_version != current_version:
            return {
                "available": True,
                "version": remote_version,
                "download_url": download_url,
                "current": current_version,
            }
        else:
            return {"available": False, "version": remote_version, "download_url": None}

    except requests.exceptions.ConnectionError:
        return None
    except Exception as e:
        logger.error(f"Update check error: {e}")
        return None


def download_and_update(download_url, new_version):
    """
    Download the update zip, extract, and replace files.
    Returns True if update was applied and restart is needed.
    """
    base_dir = get_base_dir()
    is_exe = getattr(sys, 'frozen', False)

    if not is_exe:
        logger.info("Running as Python script - skipping self-update (dev mode)")
        return False

    try:
        logger.info(f"Downloading update from: {download_url}")

        # Download to temp file
        tmp_dir = tempfile.mkdtemp(prefix="itmon_update_")
        zip_path = os.path.join(tmp_dir, "update.zip")

        resp = requests.get(download_url, timeout=120, stream=True)
        resp.raise_for_status()

        with open(zip_path, "wb") as f:
            for chunk in resp.iter_content(chunk_size=8192):
                f.write(chunk)

        logger.info(f"Downloaded {os.path.getsize(zip_path)} bytes")

        # Extract zip
        extract_dir = os.path.join(tmp_dir, "extracted")
        with zipfile.ZipFile(zip_path, "r") as zf:
            zf.extractall(extract_dir)

        logger.info(f"Extracted to {extract_dir}")

        # Find agent.exe in extracted files
        new_exe = None
        for root, dirs, files in os.walk(extract_dir):
            for f in files:
                if f.lower() == "agent.exe":
                    new_exe = os.path.join(root, f)
                    break
            if new_exe:
                break

        if not new_exe:
            logger.error("agent.exe not found in update package")
            shutil.rmtree(tmp_dir, ignore_errors=True)
            return False

        # Current exe path
        current_exe = sys.executable
        backup_exe = current_exe + ".bak"

        # Create update batch script that:
        # 1. Waits for current process to exit
        # 2. Replaces the exe
        # 3. Copies other files (icons, etc.)
        # 4. Starts the new exe
        # 5. Cleans up
        bat_path = os.path.join(base_dir, "_update.bat")
        bat_content = f'''@echo off
echo IT Monitor Agent - Updating...
timeout /t 3 /nobreak >nul

REM Backup old exe
if exist "{backup_exe}" del /f "{backup_exe}"
move /y "{current_exe}" "{backup_exe}"

REM Copy new exe
copy /y "{new_exe}" "{current_exe}"

REM Copy icon files if they exist
for %%f in ("{extract_dir}\\*.ico") do (
    copy /y "%%f" "{base_dir}\\"
)

REM Start new agent
start "" "{current_exe}"

REM Cleanup
timeout /t 5 /nobreak >nul
if exist "{backup_exe}" del /f "{backup_exe}"
rmdir /s /q "{tmp_dir}" 2>nul
del /f "%~f0" 2>nul
'''

        with open(bat_path, "w", encoding="utf-8") as f:
            f.write(bat_content)

        # Save new version before restarting
        save_current_version(new_version)

        logger.info(f"Update prepared. Launching updater and exiting...")

        # Launch the batch script and exit
        subprocess.Popen(
            ["cmd", "/c", bat_path],
            creationflags=subprocess.CREATE_NO_WINDOW,
            close_fds=True,
        )

        return True  # Signal that we need to exit

    except Exception as e:
        logger.error(f"Update failed: {e}", exc_info=True)
        return False


def auto_update(server_url):
    """
    Full auto-update flow: check + download + apply.
    Returns True if agent should exit for restart.
    """
    result = check_for_update(server_url)
    if not result:
        return False

    if not result.get("available"):
        return False

    logger.info(f"New version available: {result['version']} (current: {result.get('current', 'unknown')})")

    return download_and_update(result["download_url"], result["version"])

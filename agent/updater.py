"""
Enhanced Auto-Update Module for IT Monitor Agent
Supports both ZIP and Installer-based installations
"""

import os
import sys
import json
import logging
import requests
import subprocess
import tempfile
import shutil
from pathlib import Path

logger = logging.getLogger(__name__)


def get_install_type():
    """
    Detect installation type:
    - 'installer': Installed via Inno Setup (in Program Files)
    - 'portable': Manual installation (anywhere else)
    """
    exe_path = Path(sys.executable if getattr(sys, 'frozen', False) else __file__)
    install_dir = exe_path.parent
    
    # Check if installed in Program Files
    program_files = [
        Path(os.environ.get('ProgramFiles', 'C:\\Program Files')),
        Path(os.environ.get('ProgramFiles(x86)', 'C:\\Program Files (x86)'))
    ]
    
    for pf in program_files:
        try:
            if install_dir.is_relative_to(pf):
                return 'installer'
        except (ValueError, AttributeError):
            # Python < 3.9 doesn't have is_relative_to
            if str(install_dir).startswith(str(pf)):
                return 'installer'
    
    return 'portable'


def get_current_version():
    """Get current agent version from version file or default"""
    base_dir = Path(sys.executable).parent if getattr(sys, 'frozen', False) else Path(__file__).parent
    version_file = base_dir / 'version.txt'
    
    if version_file.exists():
        try:
            return version_file.read_text().strip()
        except Exception as e:
            logger.warning(f"Failed to read version file: {e}")
    
    return "unknown"


def check_for_updates(server_url):
    """
    Check GitHub releases for new version
    Returns: (has_update, latest_version, download_url, is_installer)
    """
    try:
        # Get latest release from GitHub API
        api_url = "https://api.github.com/repos/Kittisayst/it-help/releases/latest"
        response = requests.get(api_url, timeout=10)
        
        if response.status_code != 200:
            logger.warning(f"Failed to check updates: HTTP {response.status_code}")
            return False, None, None, False
        
        release = response.json()
        latest_version = release.get('tag_name', '').replace('agent-v', '')
        current_version = get_current_version()
        
        logger.info(f"Current version: {current_version}, Latest version: {latest_version}")
        
        # Compare versions (simple string comparison for now)
        if latest_version and latest_version != current_version:
            install_type = get_install_type()
            
            # Find appropriate download asset
            for asset in release.get('assets', []):
                asset_name = asset.get('name', '')
                
                # Prefer installer for installer-based installations
                if install_type == 'installer' and asset_name.endswith('.exe') and 'Setup' in asset_name:
                    return True, latest_version, asset['browser_download_url'], True
                
                # Use ZIP for portable installations
                elif install_type == 'portable' and asset_name.endswith('.zip'):
                    return True, latest_version, asset['browser_download_url'], False
            
            # Fallback: use ZIP if no installer found
            for asset in release.get('assets', []):
                if asset.get('name', '').endswith('.zip'):
                    return True, latest_version, asset['browser_download_url'], False
        
        return False, None, None, False
        
    except Exception as e:
        logger.error(f"Error checking for updates: {e}")
        return False, None, None, False


def download_update(download_url, is_installer=False):
    """
    Download update file to temp directory
    Returns: path to downloaded file or None
    """
    try:
        logger.info(f"Downloading update from {download_url}")
        
        response = requests.get(download_url, stream=True, timeout=60)
        response.raise_for_status()
        
        # Create temp file with appropriate extension
        suffix = '.exe' if is_installer else '.zip'
        temp_file = tempfile.NamedTemporaryFile(delete=False, suffix=suffix)
        
        # Download with progress
        total_size = int(response.headers.get('content-length', 0))
        downloaded = 0
        
        with open(temp_file.name, 'wb') as f:
            for chunk in response.iter_content(chunk_size=8192):
                if chunk:
                    f.write(chunk)
                    downloaded += len(chunk)
                    if total_size > 0:
                        progress = (downloaded / total_size) * 100
                        if downloaded % (1024 * 1024) == 0:  # Log every MB
                            logger.info(f"Download progress: {progress:.1f}%")
        
        logger.info(f"Download completed: {temp_file.name}")
        return temp_file.name
        
    except Exception as e:
        logger.error(f"Failed to download update: {e}")
        return None


def apply_update_installer(installer_path):
    """
    Apply update using installer (silent install)
    Returns: True if update initiated successfully
    """
    try:
        logger.info(f"Running installer: {installer_path}")
        
        # Run installer silently with /VERYSILENT /SUPPRESSMSGBOXES /NORESTART
        subprocess.Popen([
            installer_path,
            '/VERYSILENT',
            '/SUPPRESSMSGBOXES',
            '/NORESTART',
            '/CLOSEAPPLICATIONS',
            '/RESTARTAPPLICATIONS'
        ])
        
        logger.info("Installer started, agent will be updated and restarted by installer")
        return True
        
    except Exception as e:
        logger.error(f"Failed to run installer: {e}")
        return False


def apply_update_portable(zip_path):
    """
    Apply update for portable installation
    Returns: True if update should trigger restart
    """
    try:
        import zipfile
        
        base_dir = Path(sys.executable).parent if getattr(sys, 'frozen', False) else Path(__file__).parent
        logger.info(f"Extracting update to {base_dir}")
        
        # Create backup of current exe
        current_exe = base_dir / 'agent.exe'
        backup_exe = base_dir / 'agent.exe.backup'
        
        if current_exe.exists():
            shutil.copy2(current_exe, backup_exe)
            logger.info(f"Created backup: {backup_exe}")
        
        # Extract update
        with zipfile.ZipFile(zip_path, 'r') as zip_ref:
            zip_ref.extractall(base_dir)
        
        logger.info("Update extracted successfully")
        
        # Create update marker file
        marker_file = base_dir / 'update_pending.txt'
        marker_file.write_text('restart_required')
        
        return True
        
    except Exception as e:
        logger.error(f"Failed to apply portable update: {e}")
        
        # Restore backup if update failed
        try:
            if backup_exe.exists() and current_exe.exists():
                shutil.copy2(backup_exe, current_exe)
                logger.info("Restored from backup after failed update")
        except Exception as restore_error:
            logger.error(f"Failed to restore backup: {restore_error}")
        
        return False


def auto_update(server_url):
    """
    Main auto-update function
    Returns: True if agent should restart
    """
    try:
        logger.info("Checking for updates...")
        
        has_update, latest_version, download_url, is_installer = check_for_updates(server_url)
        
        if not has_update:
            logger.info("No updates available")
            return False
        
        logger.info(f"Update available: v{latest_version} ({'installer' if is_installer else 'portable'})")
        
        # Download update
        update_file = download_update(download_url, is_installer)
        if not update_file:
            return False
        
        # Apply update based on type
        if is_installer:
            success = apply_update_installer(update_file)
            # Installer will handle restart, so we exit
            if success:
                logger.info("Update installer started, exiting agent...")
                sys.exit(0)
            return False
        else:
            success = apply_update_portable(update_file)
            # Clean up temp file
            try:
                os.unlink(update_file)
            except:
                pass
            return success
        
    except Exception as e:
        logger.error(f"Auto-update failed: {e}")
        return False


def save_version(version):
    """Save current version to version file"""
    try:
        base_dir = Path(sys.executable).parent if getattr(sys, 'frozen', False) else Path(__file__).parent
        version_file = base_dir / 'version.txt'
        version_file.write_text(version)
        logger.info(f"Saved version: {version}")
    except Exception as e:
        logger.error(f"Failed to save version: {e}")

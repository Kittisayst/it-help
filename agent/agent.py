"""
IT Monitor Agent
Runs in background and sends system metrics to the IT Monitor server.
Supports running as .py script or .exe (PyInstaller).
"""

import sys
import os
import time
import json
import logging
import threading
import shutil
import requests


def get_base_dir():
    """Get the base directory - works for both .py and .exe (PyInstaller)."""
    if getattr(sys, 'frozen', False):
        # Running as .exe (PyInstaller)
        return os.path.dirname(sys.executable)
    else:
        # Running as .py script
        return os.path.dirname(os.path.abspath(__file__))


BASE_DIR = get_base_dir()

def is_running_from_program_files():
    """Return True when agent is installed under Program Files."""
    program_files = [
        os.environ.get('ProgramFiles', 'C:\\Program Files'),
        os.environ.get('ProgramFiles(x86)', 'C:\\Program Files (x86)'),
    ]
    base_dir_norm = os.path.normcase(os.path.abspath(BASE_DIR))
    for pf in program_files:
        if not pf:
            continue
        pf_norm = os.path.normcase(os.path.abspath(pf))
        if base_dir_norm.startswith(pf_norm):
            return True
    return False


def get_config_path():
    """Get writable config path (AppData for installed mode, BASE_DIR for portable mode)."""
    if is_running_from_program_files():
        app_data = os.environ.get('APPDATA', os.path.expanduser('~\\AppData\\Roaming'))
        config_dir = os.path.join(app_data, 'ITMonitorAgent')
        return os.path.join(config_dir, 'config.json')
    return os.path.join(BASE_DIR, 'config.json')


# Add agent directory to path (for .py mode)
sys.path.insert(0, BASE_DIR)


def load_config():
    """Load configuration from config.json (external, editable file)."""
    config_path = get_config_path()
    legacy_config_path = os.path.join(BASE_DIR, "config.json")
    defaults = {
        "server_url": "http://localhost:3000",
        "api_key": "it-monitor-secret-key-2024",
        "report_interval": 30,
        "department": "General",
        "top_processes_count": 15,
        "event_log_count": 20,
        "collect_software": True,
        "max_retries": 3,
        "retry_delay": 5,
    }

    # Migration path: installed builds used to keep config in Program Files.
    if config_path != legacy_config_path and not os.path.exists(config_path) and os.path.exists(legacy_config_path):
        try:
            os.makedirs(os.path.dirname(config_path), exist_ok=True)
            shutil.copy2(legacy_config_path, config_path)
            print(f"Migrated config.json to writable path: {config_path}")
        except Exception as e:
            print(f"Warning: Could not migrate config.json: {e}")

    if os.path.exists(config_path):
        try:
            with open(config_path, "r", encoding="utf-8") as f:
                user_config = json.load(f)
            defaults.update(user_config)
        except Exception as e:
            print(f"Warning: Could not load config.json: {e}. Using defaults.")
    else:
        # Create default config.json if it doesn't exist
        try:
            os.makedirs(os.path.dirname(config_path), exist_ok=True)
            with open(config_path, "w", encoding="utf-8") as f:
                json.dump(defaults, f, indent=2, ensure_ascii=False)
            print(f"Created default config.json at {config_path}")
        except Exception as e:
            print(f"Warning: Could not create config.json: {e}")

    return defaults


CONFIG = load_config()

from collectors import (
    collect_cpu,
    collect_memory,
    collect_disk,
    collect_network,
    collect_os_info,
    collect_processes,
    collect_event_logs,
    collect_software,
    collect_antivirus,
    collect_printers,
    collect_windows_license,
    collect_office_license,
    collect_startup,
    collect_shared_folders,
    collect_usb_devices,
    collect_windows_update,
    collect_services,
)

# Remote actions
from remote_actions import execute_command
from server_messages import process_server_messages

# Self-update
from updater import auto_update, get_current_version

# System tray (optional - gracefully skip if not available)
tray = None
try:
    from tray import AgentTray, TRAY_AVAILABLE
except ImportError:
    TRAY_AVAILABLE = False

# Setup logging - use AppData for logs when installed in Program Files
def get_log_directory():
    """Get appropriate log directory based on installation location."""
    # Check if running in Program Files (need admin rights)
    program_files = [
        os.environ.get('ProgramFiles', 'C:\\Program Files'),
        os.environ.get('ProgramFiles(x86)', 'C:\\Program Files (x86)')
    ]
    
    is_in_program_files = False
    for pf in program_files:
        if BASE_DIR.startswith(pf):
            is_in_program_files = True
            break
    
    if is_in_program_files:
        # Use AppData for logs when installed in Program Files
        app_data = os.environ.get('APPDATA', os.path.expanduser('~\\AppData\\Roaming'))
        log_dir = os.path.join(app_data, 'ITMonitorAgent', 'logs')
    else:
        # Use local logs folder for portable installations
        log_dir = os.path.join(BASE_DIR, "logs")
    
    return log_dir

log_dir = get_log_directory()

# Try to create log directory, fallback to temp if failed
try:
    os.makedirs(log_dir, exist_ok=True)
except PermissionError:
    # Fallback to temp directory
    import tempfile
    temp_dir = tempfile.gettempdir()
    log_dir = os.path.join(temp_dir, 'ITMonitorAgent', 'logs')
    os.makedirs(log_dir, exist_ok=True)
    print(f"Using temp logs directory: {log_dir}")

from logging.handlers import RotatingFileHandler

log_formatter = logging.Formatter("%(asctime)s [%(levelname)s] %(message)s")

logger = logging.getLogger("ITMonitorAgent")
logger.setLevel(logging.INFO)

# Rotating file handler: 5MB per file, keep 3 backups
file_handler = RotatingFileHandler(
    os.path.join(log_dir, "agent.log"),
    maxBytes=5 * 1024 * 1024,
    backupCount=3,
    encoding="utf-8",
)
file_handler.setFormatter(log_formatter)
logger.addHandler(file_handler)

# Console handler
console_handler = logging.StreamHandler()
console_handler.setFormatter(log_formatter)
logger.addHandler(console_handler)

logger.info(f"Agent started, logs directory: {log_dir}")


def collect_all_data():
    """Collect all system data from all collectors."""
    global tray
    data = {}

    collectors = [
        ("OS Info", collect_os_info, {}),
        ("CPU", collect_cpu, {}),
        ("Memory", collect_memory, {}),
        ("Disk", collect_disk, {}),
        ("Network", collect_network, {}),
        ("Processes", collect_processes, {"top_count": CONFIG.get("top_processes_count", 15)}),
        ("Event Logs", collect_event_logs, {"max_count": CONFIG.get("event_log_count", 20)}),
        ("Antivirus", collect_antivirus, {}),
        ("Printers", collect_printers, {}),
        ("Windows License", collect_windows_license, {}),
        ("Office License", collect_office_license, {}),
        ("Startup Programs", collect_startup, {}),
        ("Shared Folders", collect_shared_folders, {}),
        ("USB Devices", collect_usb_devices, {}),
        ("Windows Update", collect_windows_update, {}),
        ("Services", collect_services, {}),
    ]

    if CONFIG.get("collect_software", True):
        collectors.append(("Software", collect_software, {}))

    for name, collector, kwargs in collectors:
        try:
            result = collector(**kwargs)
            data.update(result)
            logger.debug(f"Collected {name} data")
        except Exception as e:
            logger.error(f"Error collecting {name}: {e}")

    data["department"] = CONFIG.get("department", "General")

    # Update tray with latest data
    if tray:
        tray.update_status(tray.STATUS_RUNNING, data)

    return data


def send_report(data):
    """Send collected data to the IT Monitor server."""
    global tray
    url = f"{CONFIG['server_url']}/api/agent/report"
    headers = {
        "Content-Type": "application/json",
        "x-api-key": CONFIG["api_key"],
    }

    if tray:
        tray.update_status(tray.STATUS_SENDING)

    for attempt in range(CONFIG.get("max_retries", 3)):
        try:
            response = requests.post(url, json=data, headers=headers, timeout=10)
            if response.status_code == 200:
                result = response.json()
                logger.info(
                    f"Report sent successfully. Computer ID: {result.get('computerId', 'N/A')}, "
                    f"Alerts: {result.get('alerts', [])}"
                )
                if tray:
                    tray.on_report_sent(True)
                return True
            else:
                logger.warning(
                    f"Server returned status {response.status_code}: {response.text[:200]}"
                )
        except requests.exceptions.ConnectionError:
            logger.warning(
                f"Cannot connect to server (attempt {attempt + 1}/{CONFIG.get('max_retries', 3)})"
            )
        except requests.exceptions.Timeout:
            logger.warning(
                f"Request timeout (attempt {attempt + 1}/{CONFIG.get('max_retries', 3)})"
            )
        except Exception as e:
            logger.error(f"Error sending report: {e}")

        if attempt < CONFIG.get("max_retries", 3) - 1:
            time.sleep(CONFIG.get("retry_delay", 5))

    logger.error("Failed to send report after all retries")
    if tray:
        tray.on_report_sent(False)
    return False


def get_offline_dir():
    """Get writable offline reports directory."""
    if is_running_from_program_files():
        app_data = os.environ.get('APPDATA', os.path.expanduser('~\\AppData\\Roaming'))
        return os.path.join(app_data, 'ITMonitorAgent', 'offline_reports')
    return os.path.join(BASE_DIR, "offline_reports")


def save_offline_report(data):
    """Save report locally when server is unreachable."""
    offline_dir = get_offline_dir()
    os.makedirs(offline_dir, exist_ok=True)

    filename = f"report_{int(time.time())}.json"
    filepath = os.path.join(offline_dir, filename)

    try:
        with open(filepath, "w") as f:
            json.dump(data, f)
        logger.info(f"Saved offline report: {filename}")
    except Exception as e:
        logger.error(f"Failed to save offline report: {e}")


def send_offline_reports():
    """Try to send any saved offline reports."""
    offline_dir = get_offline_dir()
    if not os.path.exists(offline_dir):
        return

    files = sorted(os.listdir(offline_dir))
    for filename in files[:10]:  # Send max 10 at a time
        filepath = os.path.join(offline_dir, filename)
        try:
            with open(filepath, "r") as f:
                data = json.load(f)

            if send_report(data):
                os.remove(filepath)
                logger.info(f"Sent and removed offline report: {filename}")
            else:
                break  # Server still unreachable
        except Exception as e:
            logger.error(f"Error processing offline report {filename}: {e}")


def poll_commands():
    """Poll server for pending commands and execute them."""
    import socket
    url = f"{CONFIG['server_url']}/api/agent/commands"
    headers = {
        "Content-Type": "application/json",
        "x-api-key": CONFIG["api_key"],
    }
    params = {"hostname": socket.gethostname()}

    try:
        resp = requests.get(url, headers=headers, params=params, timeout=10)
        if resp.status_code != 200:
            return

        commands = resp.json()
        if not commands:
            return

        logger.info(f"Received {len(commands)} pending command(s)")

        for cmd in commands:
            cmd_id = cmd.get("id")
            action = cmd.get("action")
            cmd_params = cmd.get("params")

            logger.info(f"Executing command {cmd_id}: {action}")

            result = execute_command(action, cmd_params)

            # Report result back to server
            try:
                result_url = f"{CONFIG['server_url']}/api/agent/commands/{cmd_id}/result"
                requests.post(
                    result_url,
                    json=result,
                    headers=headers,
                    timeout=10,
                )
                logger.info(f"Command {cmd_id} result sent: success={result.get('success')}")
            except Exception as e:
                logger.error(f"Failed to send command result: {e}")

    except requests.exceptions.ConnectionError:
        pass  # Server unreachable, skip silently
    except Exception as e:
        logger.error(f"Error polling commands: {e}")


# Flag to control the agent loop
_running = True
_loop_count = 0
_UPDATE_CHECK_INTERVAL = 10  # Check for updates every N cycles


def stop_agent():
    """Stop the agent gracefully."""
    global _running
    _running = False
    logger.info("Agent stopping...")
    os._exit(0)


def agent_loop():
    """Main agent loop (runs in background thread when tray is active)."""
    global _running, _loop_count

    while _running:
        try:
            # Send any offline reports first
            send_offline_reports()

            # Poll for remote commands
            poll_commands()

            # Check for server messages
            try:
                process_server_messages(CONFIG["server_url"], CONFIG["api_key"])
            except Exception as e:
                logger.debug(f"Error processing server messages: {e}")

            # Check for self-update periodically
            _loop_count += 1
            if _loop_count % _UPDATE_CHECK_INTERVAL == 1:
                try:
                    should_restart = auto_update(CONFIG["server_url"])
                    if should_restart:
                        logger.info("Update applied - agent will restart")
                        os._exit(0)
                except Exception as e:
                    logger.error(f"Auto-update error: {e}")

            # Collect data
            logger.info("Collecting system data...")
            data = collect_all_data()

            # Send report
            success = send_report(data)

            if not success:
                save_offline_report(data)

        except Exception as e:
            logger.error(f"Unexpected error in main loop: {e}")
            if tray:
                tray.update_status(tray.STATUS_ERROR)

        # Wait for next interval
        logger.info(f"Next report in {CONFIG['report_interval']}s")
        time.sleep(CONFIG["report_interval"])


def main():
    """Main entry point."""
    global tray

    logger.info("=" * 50)
    logger.info("IT Monitor Agent Starting")
    logger.info(f"Version: {get_current_version()}")
    logger.info(f"Server URL: {CONFIG['server_url']}")
    logger.info(f"Report Interval: {CONFIG['report_interval']}s")
    logger.info(f"Department: {CONFIG.get('department', 'General')}")
    logger.info(f"Running as: {'EXE' if getattr(sys, 'frozen', False) else 'Python script'}")
    logger.info(f"System Tray: {'Enabled' if TRAY_AVAILABLE else 'Disabled'}")
    logger.info("=" * 50)

    if TRAY_AVAILABLE:
        # Create tray icon
        tray = AgentTray(config=CONFIG, on_quit=stop_agent)

        # Run agent loop in background thread
        agent_thread = threading.Thread(target=agent_loop, daemon=True)
        agent_thread.start()

        # Run tray in main thread (required by Windows)
        logger.info("System tray icon started")
        tray.run()
    else:
        # No tray - run agent loop directly
        logger.info("Running without system tray (pystray not installed)")
        agent_loop()


if __name__ == "__main__":
    main()

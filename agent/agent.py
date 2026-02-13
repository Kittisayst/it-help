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

# Add agent directory to path (for .py mode)
sys.path.insert(0, BASE_DIR)


def load_config():
    """Load configuration from config.json (external, editable file)."""
    config_path = os.path.join(BASE_DIR, "config.json")
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
)

# Setup logging
log_dir = os.path.join(BASE_DIR, "logs")
os.makedirs(log_dir, exist_ok=True)

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    handlers=[
        logging.FileHandler(os.path.join(log_dir, "agent.log")),
        logging.StreamHandler(),
    ],
)
logger = logging.getLogger("ITMonitorAgent")


def collect_all_data():
    """Collect all system data from all collectors."""
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
    return data


def send_report(data):
    """Send collected data to the IT Monitor server."""
    url = f"{CONFIG['server_url']}/api/agent/report"
    headers = {
        "Content-Type": "application/json",
        "x-api-key": CONFIG["api_key"],
    }

    for attempt in range(CONFIG.get("max_retries", 3)):
        try:
            response = requests.post(url, json=data, headers=headers, timeout=10)
            if response.status_code == 200:
                result = response.json()
                logger.info(
                    f"Report sent successfully. Computer ID: {result.get('computerId', 'N/A')}, "
                    f"Alerts: {result.get('alerts', [])}"
                )
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
    return False


def save_offline_report(data):
    """Save report locally when server is unreachable."""
    offline_dir = os.path.join(BASE_DIR, "offline_reports")
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
    offline_dir = os.path.join(BASE_DIR, "offline_reports")
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


def main():
    """Main agent loop."""
    logger.info("=" * 50)
    logger.info("IT Monitor Agent Starting")
    logger.info(f"Server URL: {CONFIG['server_url']}")
    logger.info(f"Report Interval: {CONFIG['report_interval']}s")
    logger.info(f"Department: {CONFIG.get('department', 'General')}")
    logger.info(f"Running as: {'EXE' if getattr(sys, 'frozen', False) else 'Python script'}")
    logger.info("=" * 50)

    while True:
        try:
            # Send any offline reports first
            send_offline_reports()

            # Collect data
            logger.info("Collecting system data...")
            data = collect_all_data()

            # Send report
            success = send_report(data)

            if not success:
                save_offline_report(data)

        except Exception as e:
            logger.error(f"Unexpected error in main loop: {e}")

        # Wait for next interval
        logger.info(f"Next report in {CONFIG['report_interval']}s")
        time.sleep(CONFIG["report_interval"])


if __name__ == "__main__":
    main()

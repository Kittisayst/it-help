"""
Windows Services Collector
Collects information about Windows services.
"""

import subprocess
import logging

logger = logging.getLogger("ITMonitorAgent")


def collect_services():
    """
    Collect Windows services information.
    Returns list of services with name, display name, status, and startup type.
    """
    try:
        # Get services using PowerShell
        ps_script = """
Get-Service | Select-Object Name, DisplayName, Status, StartType | 
ConvertTo-Json -Compress
"""
        result = subprocess.run(
            ["powershell", "-NoProfile", "-Command", ps_script],
            capture_output=True,
            text=True,
            timeout=15,
            creationflags=subprocess.CREATE_NO_WINDOW,
        )

        if result.returncode != 0:
            logger.error(f"PowerShell services query failed: {result.stderr}")
            return []

        import json
        services = json.loads(result.stdout)
        
        # Ensure it's a list
        if not isinstance(services, list):
            services = [services]

        # Filter to important services only (running or auto-start)
        important = []
        for svc in services:
            if svc.get("Status") == "Running" or svc.get("StartType") in ["Automatic", "AutomaticDelayedStart"]:
                important.append({
                    "name": svc.get("Name", ""),
                    "displayName": svc.get("DisplayName", ""),
                    "status": svc.get("Status", "Unknown"),
                    "startType": svc.get("StartType", "Unknown"),
                })

        logger.info(f"Collected {len(important)} important services")
        return important

    except subprocess.TimeoutExpired:
        logger.error("Services collection timed out")
        return []
    except Exception as e:
        logger.error(f"Error collecting services: {e}")
        return []

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

        # Parse JSON
        import json
        try:
            services = json.loads(result.stdout)
        except json.JSONDecodeError:
            logger.error("Failed to decode services JSON")
            return []
        
        # Ensure it's a list
        if not isinstance(services, list):
            if services:
                services = [services]
            else:
                return []

        # Convert to dictionary format
        service_data = []
        for svc in services:
            if not isinstance(svc, dict):
                continue
            service_data.append({
                "name": svc.get("Name", ""),
                "displayName": svc.get("DisplayName", ""),
                "status": str(svc.get("Status", "Unknown")),
                "startType": str(svc.get("StartType", "Unknown")),
            })

        return {"services": service_data}

    except subprocess.TimeoutExpired:
        logger.error("Services collection timed out")
        return []
    except Exception as e:
        logger.error(f"Error collecting services: {e}")
        return []

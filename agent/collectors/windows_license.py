"""Collect Windows activation/license information."""
import sys
import subprocess


def collect_windows_license():
    """Collect Windows license status, edition, and partial product key."""
    if sys.platform != "win32":
        return {"windows_license": {}}

    info = {
        "edition": "",
        "status": "Unknown",
        "partial_key": "",
        "license_type": "",
    }

    try:
        # Get license status using slmgr
        result = subprocess.run(
            ["cscript", "//nologo", "C:\\Windows\\System32\\slmgr.vbs", "/dli"],
            capture_output=True, text=True, timeout=15,
            creationflags=subprocess.CREATE_NO_WINDOW,
        )
        output = result.stdout

        for line in output.splitlines():
            line = line.strip()
            if "Name:" in line or "ชื่อ:" in line:
                info["edition"] = line.split(":", 1)[-1].strip()
            elif "License Status:" in line or "สถานะสิทธิ์การใช้งาน:" in line:
                status = line.split(":", 1)[-1].strip()
                info["status"] = status
            elif "Partial Product Key:" in line:
                info["partial_key"] = line.split(":", 1)[-1].strip()
            elif "Description:" in line:
                info["license_type"] = line.split(":", 1)[-1].strip()

        # Fallback: get edition from systeminfo if not found
        if not info["edition"]:
            try:
                import platform
                info["edition"] = platform.platform()
            except Exception:
                pass

        # Determine simple status
        status_lower = info["status"].lower()
        if "licensed" in status_lower or "ลิขสิทธิ์" in status_lower:
            info["is_activated"] = True
        else:
            info["is_activated"] = False

    except subprocess.TimeoutExpired:
        info["status"] = "Timeout"
        info["is_activated"] = False
    except Exception as e:
        info["status"] = f"Error: {str(e)[:100]}"
        info["is_activated"] = False

    return {"windows_license": info}

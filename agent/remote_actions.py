"""
IT Monitor Agent - Remote Actions
Executes commands received from the IT Monitor server.
"""

import os
import subprocess
import logging
import time
import shutil
import signal

logger = logging.getLogger("ITMonitorAgent")

# Allowed actions and their handlers
ALLOWED_ACTIONS = [
    "restart",
    "shutdown",
    "lock",
    "logoff",
    "clear_temp",
    "kill_process",
    "run_powershell",
    "ping",
    "traceroute",
    "ipconfig",
    "disk_cleanup",
    "flush_dns",
    "gpupdate",
    "sfc_scan",
    "service_start",
    "service_stop",
    "service_restart",
    "screenshot",
]


def execute_command(action, params=None):
    """
    Execute a remote command and return the result.
    Returns dict with 'success' (bool) and 'output' (str).
    """
    if action not in ALLOWED_ACTIONS:
        return {"success": False, "output": f"Unknown action: {action}"}

    try:
        handler = HANDLERS.get(action)
        if handler:
            return handler(params)
        return {"success": False, "output": f"No handler for action: {action}"}
    except Exception as e:
        logger.error(f"Remote action '{action}' failed: {e}")
        return {"success": False, "output": f"Error: {str(e)[:500]}"}


def _run_cmd(cmd, timeout=60):
    """Run a system command and return output."""
    try:
        result = subprocess.run(
            cmd,
            capture_output=True,
            text=True,
            timeout=timeout,
            shell=True,
            encoding="utf-8",
            errors="replace",
        )
        output = result.stdout.strip()
        if result.stderr:
            output += "\n" + result.stderr.strip()
        return output[:2000]
    except subprocess.TimeoutExpired:
        return "Command timed out"
    except Exception as e:
        return f"Error: {str(e)[:500]}"


# === Action Handlers ===

def action_restart(params):
    """Restart the computer."""
    delay = 10
    if params:
        try:
            import json
            p = json.loads(params) if isinstance(params, str) else params
            delay = int(p.get("delay", 10))
        except Exception:
            pass

    logger.info(f"Remote action: RESTART in {delay} seconds")
    output = _run_cmd(f"shutdown /r /t {delay} /c \"IT Monitor: Remote restart requested\"")
    return {"success": True, "output": f"Restart scheduled in {delay}s. {output}"}


def action_shutdown(params):
    """Shutdown the computer."""
    delay = 10
    if params:
        try:
            import json
            p = json.loads(params) if isinstance(params, str) else params
            delay = int(p.get("delay", 10))
        except Exception:
            pass

    logger.info(f"Remote action: SHUTDOWN in {delay} seconds")
    output = _run_cmd(f"shutdown /s /t {delay} /c \"IT Monitor: Remote shutdown requested\"")
    return {"success": True, "output": f"Shutdown scheduled in {delay}s. {output}"}


def action_lock(params):
    """Lock the workstation."""
    logger.info("Remote action: LOCK screen")
    import ctypes
    ctypes.windll.user32.LockWorkStation()
    return {"success": True, "output": "Workstation locked"}


def action_logoff(params):
    """Log off the current user."""
    logger.info("Remote action: LOGOFF")
    output = _run_cmd("shutdown /l")
    return {"success": True, "output": f"Logoff initiated. {output}"}


def action_clear_temp(params):
    """Clear temporary files."""
    logger.info("Remote action: CLEAR TEMP")
    cleared = 0
    errors = 0
    total_size = 0

    temp_dirs = [
        os.environ.get("TEMP", ""),
        os.environ.get("TMP", ""),
        os.path.join(os.environ.get("SYSTEMROOT", "C:\\Windows"), "Temp"),
    ]

    for temp_dir in temp_dirs:
        if not temp_dir or not os.path.exists(temp_dir):
            continue
        try:
            for item in os.listdir(temp_dir):
                item_path = os.path.join(temp_dir, item)
                try:
                    if os.path.isfile(item_path):
                        total_size += os.path.getsize(item_path)
                        os.remove(item_path)
                        cleared += 1
                    elif os.path.isdir(item_path):
                        size = sum(
                            os.path.getsize(os.path.join(dp, f))
                            for dp, dn, fn in os.walk(item_path)
                            for f in fn
                        )
                        total_size += size
                        shutil.rmtree(item_path, ignore_errors=True)
                        cleared += 1
                except PermissionError:
                    errors += 1
                except Exception:
                    errors += 1
        except Exception:
            pass

    size_mb = total_size / (1024 * 1024)
    return {
        "success": True,
        "output": f"Cleared {cleared} items ({size_mb:.1f} MB). {errors} items skipped (in use).",
    }


def action_kill_process(params):
    """Kill a process by name or PID."""
    if not params:
        return {"success": False, "output": "Missing params: need 'name' or 'pid'"}

    import json
    try:
        p = json.loads(params) if isinstance(params, str) else params
    except Exception:
        return {"success": False, "output": "Invalid params format"}

    pid = p.get("pid")
    name = p.get("name")

    if pid:
        logger.info(f"Remote action: KILL process PID={pid}")
        output = _run_cmd(f"taskkill /PID {pid} /F")
        return {"success": True, "output": output}
    elif name:
        logger.info(f"Remote action: KILL process name={name}")
        # Sanitize name
        safe_name = name.replace('"', '').replace("&", "").replace("|", "")
        output = _run_cmd(f'taskkill /IM "{safe_name}" /F')
        return {"success": True, "output": output}
    else:
        return {"success": False, "output": "Need 'name' or 'pid' in params"}


def action_run_powershell(params):
    """Run a PowerShell command/script."""
    if not params:
        return {"success": False, "output": "Missing params: need 'script'"}

    import json
    try:
        p = json.loads(params) if isinstance(params, str) else params
    except Exception:
        return {"success": False, "output": "Invalid params format"}

    script = p.get("script", "")
    if not script:
        return {"success": False, "output": "Empty script"}

    # Limit script length for safety
    if len(script) > 2000:
        return {"success": False, "output": "Script too long (max 2000 chars)"}

    logger.info(f"Remote action: RUN POWERSHELL ({len(script)} chars)")
    output = _run_cmd(
        f'powershell -ExecutionPolicy Bypass -Command "{script}"',
        timeout=120,
    )
    return {"success": True, "output": output}


def action_ping(params):
    """Ping a host."""
    if not params:
        return {"success": False, "output": "Missing params: need 'host'"}

    import json
    try:
        p = json.loads(params) if isinstance(params, str) else params
    except Exception:
        return {"success": False, "output": "Invalid params format"}

    host = p.get("host", "8.8.8.8")
    count = min(int(p.get("count", 4)), 10)

    # Sanitize host
    safe_host = host.replace('"', '').replace("&", "").replace("|", "").replace(";", "")

    logger.info(f"Remote action: PING {safe_host}")
    output = _run_cmd(f"ping -n {count} {safe_host}", timeout=30)
    return {"success": True, "output": output}


def action_traceroute(params):
    """Traceroute to a host."""
    if not params:
        return {"success": False, "output": "Missing params: need 'host'"}

    import json
    try:
        p = json.loads(params) if isinstance(params, str) else params
    except Exception:
        return {"success": False, "output": "Invalid params format"}

    host = p.get("host", "8.8.8.8")
    safe_host = host.replace('"', '').replace("&", "").replace("|", "").replace(";", "")

    logger.info(f"Remote action: TRACEROUTE {safe_host}")
    output = _run_cmd(f"tracert -d -w 1000 {safe_host}", timeout=60)
    return {"success": True, "output": output}


def action_ipconfig(params):
    """Get network configuration."""
    logger.info("Remote action: IPCONFIG")
    output = _run_cmd("ipconfig /all", timeout=15)
    return {"success": True, "output": output}


def action_disk_cleanup(params):
    """Run disk cleanup utility."""
    logger.info("Remote action: DISK CLEANUP")
    # Run cleanmgr silently with predefined settings
    output = _run_cmd("cleanmgr /sagerun:1", timeout=120)
    return {"success": True, "output": f"Disk cleanup initiated. {output}"}


def action_flush_dns(params):
    """Flush DNS resolver cache."""
    logger.info("Remote action: FLUSH DNS")
    output = _run_cmd("ipconfig /flushdns", timeout=15)
    return {"success": True, "output": output}


def action_gpupdate(params):
    """Force Group Policy update."""
    logger.info("Remote action: GPUPDATE")
    output = _run_cmd("gpupdate /force", timeout=60)
    return {"success": True, "output": output}


def action_sfc_scan(params):
    """Run System File Checker."""
    logger.info("Remote action: SFC SCAN (this may take a while)")
    output = _run_cmd("sfc /scannow", timeout=600)
    return {"success": True, "output": output}


def action_service_start(params):
    """Start a Windows service."""
    if not params:
        return {"success": False, "output": "Missing params: need 'service_name'"}

    import json
    try:
        p = json.loads(params) if isinstance(params, str) else params
    except Exception:
        return {"success": False, "output": "Invalid params format"}

    service_name = p.get("service_name", "")
    if not service_name:
        return {"success": False, "output": "Missing service_name"}

    logger.info(f"Remote action: START SERVICE {service_name}")
    output = _run_cmd(f"net start \"{service_name}\"", timeout=30)
    return {"success": True, "output": output}


def action_service_stop(params):
    """Stop a Windows service."""
    if not params:
        return {"success": False, "output": "Missing params: need 'service_name'"}

    import json
    try:
        p = json.loads(params) if isinstance(params, str) else params
    except Exception:
        return {"success": False, "output": "Invalid params format"}

    service_name = p.get("service_name", "")
    if not service_name:
        return {"success": False, "output": "Missing service_name"}

    logger.info(f"Remote action: STOP SERVICE {service_name}")
    output = _run_cmd(f"net stop \"{service_name}\"", timeout=30)
    return {"success": True, "output": output}


def action_service_restart(params):
    """Restart a Windows service."""
    if not params:
        return {"success": False, "output": "Missing params: need 'service_name'"}

    import json
    try:
        p = json.loads(params) if isinstance(params, str) else params
    except Exception:
        return {"success": False, "output": "Invalid params format"}

    service_name = p.get("service_name", "")
    if not service_name:
        return {"success": False, "output": "Missing service_name"}

    logger.info(f"Remote action: RESTART SERVICE {service_name}")
    output_stop = _run_cmd(f"net stop \"{service_name}\"", timeout=30)
    time.sleep(2)
    output_start = _run_cmd(f"net start \"{service_name}\"", timeout=30)
    return {"success": True, "output": f"STOP:\n{output_stop}\n\nSTART:\n{output_start}"}


def action_screenshot(params):
    """Capture screenshot and return as base64."""
    try:
        import io
        import base64
        from PIL import ImageGrab
        
        # Capture all screens
        screenshot = ImageGrab.grab(all_screens=True)
        
        # Convert to bytes
        buffer = io.BytesIO()
        screenshot.save(buffer, format='PNG')
        img_bytes = buffer.getvalue()
        
        # Encode to base64
        img_base64 = base64.b64encode(img_bytes).decode('utf-8')
        
        return {
            "success": True,
            "output": "Screenshot captured successfully",
            "screenshot": img_base64
        }
        
    except ImportError:
        return {
            "success": False,
            "output": "PIL/Pillow library not installed. Install with: pip install pillow"
        }
    except Exception as e:
        return {
            "success": False,
            "output": f"Screenshot failed: {str(e)}"
        }


# Handler map
HANDLERS = {
    "restart": action_restart,
    "shutdown": action_shutdown,
    "lock": action_lock,
    "logoff": action_logoff,
    "clear_temp": action_clear_temp,
    "kill_process": action_kill_process,
    "run_powershell": action_run_powershell,
    "ping": action_ping,
    "traceroute": action_traceroute,
    "ipconfig": action_ipconfig,
    "disk_cleanup": action_disk_cleanup,
    "flush_dns": action_flush_dns,
    "gpupdate": action_gpupdate,
    "sfc_scan": action_sfc_scan,
    "service_start": action_service_start,
    "service_stop": action_service_stop,
    "service_restart": action_service_restart,
    "screenshot": action_screenshot,
}

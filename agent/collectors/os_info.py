import platform
import socket
import psutil
import time


def collect_os_info():
    """Collect operating system information."""
    boot_time = psutil.boot_time()
    uptime = time.time() - boot_time

    return {
        "hostname": socket.gethostname(),
        "os_version": f"{platform.system()} {platform.release()} ({platform.version()})",
        "os_info": {
            "system": platform.system(),
            "release": platform.release(),
            "version": platform.version(),
            "architecture": platform.machine(),
            "processor": platform.processor(),
            "hostname": socket.gethostname(),
        },
        "uptime": round(uptime, 0),
    }

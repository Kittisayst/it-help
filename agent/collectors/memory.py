import psutil


def collect_memory():
    """Collect RAM usage information."""
    mem = psutil.virtual_memory()
    return {
        "ram_total": round(mem.total / (1024 ** 3), 2),
        "ram_used": round(mem.used / (1024 ** 3), 2),
        "ram_usage": mem.percent,
    }

import psutil


def collect_processes(top_count=15):
    """Collect top processes by CPU and memory usage."""
    processes = []

    for proc in psutil.process_iter(["pid", "name", "cpu_percent", "memory_info"]):
        try:
            info = proc.info
            mem_mb = (info["memory_info"].rss / (1024 ** 2)) if info["memory_info"] else 0
            processes.append({
                "name": info["name"] or "unknown",
                "cpu": info["cpu_percent"] or 0,
                "memory": round(mem_mb, 1),
            })
        except (psutil.NoSuchProcess, psutil.AccessDenied, psutil.ZombieProcess):
            continue

    processes.sort(key=lambda x: x["cpu"] + x["memory"], reverse=True)

    return {
        "top_processes": processes[:top_count],
    }

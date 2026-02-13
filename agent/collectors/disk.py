import psutil


def collect_disk():
    """Collect disk usage for all partitions."""
    partitions = psutil.disk_partitions()
    details = []
    total_all = 0
    used_all = 0

    for part in partitions:
        try:
            usage = psutil.disk_usage(part.mountpoint)
            total_gb = round(usage.total / (1024 ** 3), 2)
            used_gb = round(usage.used / (1024 ** 3), 2)
            total_all += usage.total
            used_all += usage.used
            details.append({
                "device": part.device,
                "mountpoint": part.mountpoint,
                "total": total_gb,
                "used": used_gb,
                "percent": usage.percent,
            })
        except (PermissionError, OSError):
            continue

    total_gb = round(total_all / (1024 ** 3), 2) if total_all else 0
    used_gb = round(used_all / (1024 ** 3), 2) if used_all else 0
    usage_pct = round((used_all / total_all) * 100, 1) if total_all else 0

    return {
        "disk_total": total_gb,
        "disk_used": used_gb,
        "disk_usage": usage_pct,
        "disk_details": details,
    }

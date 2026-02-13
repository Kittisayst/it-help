import psutil


def collect_cpu():
    """Collect CPU usage, cores, speed, and temperature."""
    usage = psutil.cpu_percent(interval=1)
    cores = psutil.cpu_count(logical=True)
    freq = psutil.cpu_freq()
    speed = f"{freq.current:.0f} MHz" if freq else "N/A"

    temp = None
    try:
        temps = psutil.sensors_temperatures()
        if temps:
            for name, entries in temps.items():
                if entries:
                    temp = entries[0].current
                    break
    except (AttributeError, Exception):
        pass

    return {
        "cpu_usage": usage,
        "cpu_cores": cores,
        "cpu_speed": speed,
        "cpu_temp": temp,
    }

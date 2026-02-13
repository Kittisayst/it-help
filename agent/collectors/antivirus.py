import sys


def collect_antivirus():
    """Collect antivirus status using WMI."""
    if sys.platform != "win32":
        return {"antivirus_status": "N/A (not Windows)"}

    try:
        import wmi

        c = wmi.WMI(namespace="root\\SecurityCenter2")
        products = c.AntiVirusProduct()

        if products:
            names = [p.displayName for p in products if p.displayName]
            status = ", ".join(names) if names else "Unknown"
            return {"antivirus_status": status}
        else:
            return {"antivirus_status": "No antivirus detected"}

    except ImportError:
        return {"antivirus_status": "WMI not available"}
    except Exception as e:
        return {"antivirus_status": f"Error: {str(e)[:100]}"}

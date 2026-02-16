"""Collect USB devices information."""
import sys


def collect_usb_devices():
    """Collect list of connected USB devices."""
    if sys.platform != "win32":
        return {"usb_devices": []}

    devices = []

    try:
        import wmi
        c = wmi.WMI()

        for usb in c.Win32_USBControllerDevice():
            try:
                device = usb.Dependent
                # Get the actual device object
                dep_path = device.replace("\\\\", "\\").replace('"', '')
                # Query the PnP device
            except Exception:
                continue

        # Better approach: query PnP devices with USB
        for device in c.Win32_PnPEntity():
            try:
                device_id = device.DeviceID or ""
                if not device_id.startswith("USB\\"):
                    continue

                name = device.Name or device.Description or "Unknown USB Device"
                status = device.Status or "Unknown"
                manufacturer = device.Manufacturer or ""

                devices.append({
                    "name": name,
                    "status": status,
                    "manufacturer": manufacturer,
                    "device_id": device_id[:80],
                })
            except Exception:
                continue

    except ImportError:
        pass
    except Exception:
        pass

    return {"usb_devices": devices}

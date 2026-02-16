"""Collect installed printers information."""
import sys


def collect_printers():
    """Collect list of installed printers and default printer."""
    if sys.platform != "win32":
        return {"printers": []}

    printers = []
    default_printer = ""

    try:
        import win32print

        default_printer = win32print.GetDefaultPrinter()

        for printer in win32print.EnumPrinters(
            win32print.PRINTER_ENUM_LOCAL | win32print.PRINTER_ENUM_CONNECTIONS
        ):
            flags, desc, name, comment = printer
            is_network = bool(flags & win32print.PRINTER_ENUM_CONNECTIONS)

            # Get printer status
            try:
                handle = win32print.OpenPrinter(name)
                info = win32print.GetPrinter(handle, 2)
                win32print.ClosePrinter(handle)
                status = info.get("Status", 0)
                port = info.get("pPortName", "")
                driver = info.get("pDriverName", "")
            except Exception:
                status = 0
                port = ""
                driver = ""

            status_text = "Ready"
            if status != 0:
                status_map = {
                    0x00000001: "Paused",
                    0x00000002: "Error",
                    0x00000004: "Pending Deletion",
                    0x00000008: "Paper Jam",
                    0x00000010: "Paper Out",
                    0x00000020: "Manual Feed",
                    0x00000040: "Paper Problem",
                    0x00000080: "Offline",
                    0x00000200: "Not Available",
                    0x00000400: "No Toner",
                }
                for code, text in status_map.items():
                    if status & code:
                        status_text = text
                        break

            printers.append({
                "name": name,
                "is_default": name == default_printer,
                "is_network": is_network,
                "status": status_text,
                "port": port,
                "driver": driver,
            })
    except ImportError:
        pass
    except Exception:
        pass

    return {
        "printers": printers,
        "default_printer": default_printer,
    }

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

def collect_print_history():
    """
    Collect recent print jobs from Windows Event Logs.
    Requires 'Microsoft-Windows-PrintService/Operational' to be enabled.
    """
    if sys.platform != "win32":
        return []
        
    try:
        import win32evtlog
        import xml.etree.ElementTree as ET
        
        server = 'localhost'
        logtype = 'Microsoft-Windows-PrintService/Operational'
        
        # Try to open the log
        try:
            handle = win32evtlog.EvtOpenLog(None, logtype, win32evtlog.EvtOpenChannelConfig)
            win32evtlog.CloseEventLog(handle)
        except Exception:
            # Log might be disabled or inaccessible
            return []

        # Query recent events (ID 307 - Document printed)
        # We limit to last 50 events for efficiency
        query = "Event[System[EventID=307]]"
        flags = win32evtlog.EvtQueryChannelName | win32evtlog.EvtQueryReverseOrder
        
        results = win32evtlog.EvtQuery(logtype, flags, query)
        events = win32evtlog.EvtNext(results, 50)
        
        print_history = []
        for event in events:
            xml = win32evtlog.EvtRender(event, win32evtlog.EvtRenderEventXml)
            root = ET.fromstring(xml)
            
            # Namespace for Event XML
            ns = {'ns': 'http://schemas.microsoft.com/win/2004/08/events/event'}
            
            event_data = {}
            for data in root.findall('.//ns:Data', ns):
                name = data.get('Name')
                event_data[name] = data.text
            
            # Event ID 307 data fields:
            # Param1: Document Name
            # Param2: User
            # Param3: Computer
            # Param4: Printer Name
            # Param5: Port
            # Param8: Pages
            
            system_time = root.find('.//ns:TimeCreated', ns).get('SystemTime')
            
            print_history.append({
                "document": event_data.get("Param1", "Unknown"),
                "user": event_data.get("Param2", "Unknown"),
                "printer": event_data.get("Param4", "Unknown"),
                "pages": event_data.get("Param8", "0"),
                "timestamp": system_time
            })
            
        return print_history
    except Exception:
        return []

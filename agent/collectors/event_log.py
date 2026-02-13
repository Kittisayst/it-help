import sys


def collect_event_logs(max_count=20):
    """Collect recent Windows Event Log errors and warnings."""
    if sys.platform != "win32":
        return {"event_logs": []}

    logs = []
    try:
        import win32evtlog
        import win32evtlogutil

        server = "localhost"
        log_types = ["Application", "System"]

        for log_type in log_types:
            try:
                hand = win32evtlog.OpenEventLog(server, log_type)
                flags = (
                    win32evtlog.EVENTLOG_BACKWARDS_READ
                    | win32evtlog.EVENTLOG_SEQUENTIAL_READ
                )
                total = 0

                while total < max_count:
                    events = win32evtlog.ReadEventLog(hand, flags, 0)
                    if not events:
                        break

                    for event in events:
                        if total >= max_count:
                            break

                        event_type = event.EventType
                        if event_type in (1, 2):  # Error=1, Warning=2
                            level = "Error" if event_type == 1 else "Warning"
                            try:
                                msg = win32evtlogutil.SafeFormatMessage(event, log_type)
                                msg = msg[:200] if msg else "No message"
                            except Exception:
                                msg = "Could not read message"

                            logs.append({
                                "level": level,
                                "source": event.SourceName or "Unknown",
                                "message": msg,
                                "time": event.TimeGenerated.Format() if event.TimeGenerated else "Unknown",
                            })
                            total += 1

                win32evtlog.CloseEventLog(hand)
            except Exception:
                continue

    except ImportError:
        pass
    except Exception:
        pass

    return {"event_logs": logs}

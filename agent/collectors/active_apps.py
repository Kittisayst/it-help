"""
Active Application Tracker
Tracks time spent in foreground applications.
"""
import time
import logging
import threading
import sys

logger = logging.getLogger("ITMonitorAgent")

# Global storage for app usage time (app_name -> seconds)
_app_usage = {}
_last_check_time = 0
_tracking_active = False
_lock = threading.Lock()

def get_foreground_app():
    """Get the name of the foreground application executable."""
    if sys.platform != "win32":
        return None
        
    try:
        import win32gui
        import win32process
        import psutil
        
        # Get handle to foreground window
        hwnd = win32gui.GetForegroundWindow()
        if not hwnd:
            return "Idle"
            
        # Get process ID from handle
        _, pid = win32process.GetWindowThreadProcessId(hwnd)
        
        # Get process name
        process = psutil.Process(pid)
        return process.name()
    except Exception:
        return "Unknown"

def _tracker_loop():
    """Background loop to poll foreground app every 5 seconds."""
    global _last_check_time, _tracking_active
    
    _last_check_time = time.time()
    while _tracking_active:
        try:
            current_app = get_foreground_app()
            now = time.time()
            elapsed = now - _last_check_time
            _last_check_time = now
            
            if current_app:
                with _lock:
                    _app_usage[current_app] = _app_usage.get(current_app, 0) + elapsed
                    
        except Exception as e:
            logger.debug(f"Tracker loop error: {e}")
            
        time.sleep(5)

def start_tracking():
    """Start the background tracking thread."""
    global _tracking_active
    if not _tracking_active:
        _tracking_active = True
        thread = threading.Thread(target=_tracker_loop, daemon=True)
        thread.start()
        logger.info("Active application tracking started")

def collect_app_usage():
    """
    Collect accumulated app usage and reset the counters.
    Returns: dict {app_name: seconds}
    """
    global _app_usage
    with _lock:
        report_data = _app_usage.copy()
        _app_usage = {} # Reset for next interval
        
    return {"app_usage": report_data}

from .cpu import collect_cpu
from .memory import collect_memory
from .disk import collect_disk
from .network import collect_network
from .os_info import collect_os_info
from .processes import collect_processes
from .event_log import collect_event_logs
from .software import collect_software
from .antivirus import collect_antivirus
from .printers import collect_printers
from .windows_license import collect_windows_license
from .office_license import collect_office_license
from .startup import collect_startup
from .shared_folders import collect_shared_folders
from .usb_devices import collect_usb_devices
from .windows_update import collect_windows_update
from .services import collect_services
from .printers import collect_services as _, collect_print_history  # Fix: use the history function
from .active_apps import start_tracking, collect_app_usage

__all__ = [
    "collect_cpu",
    "collect_memory",
    "collect_disk",
    "collect_network",
    "collect_os_info",
    "collect_processes",
    "collect_event_logs",
    "collect_software",
    "collect_antivirus",
    "collect_printers",
    "collect_windows_license",
    "collect_office_license",
    "collect_startup",
    "collect_shared_folders",
    "collect_usb_devices",
    "collect_windows_update",
    "collect_services",
    "collect_print_history",
    "start_tracking",
    "collect_app_usage",
]

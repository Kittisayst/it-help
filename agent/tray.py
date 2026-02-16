"""
IT Monitor Agent - System Tray Icon
Shows agent status in Windows system tray with context menu.
"""

import sys
import os
import threading
import socket

try:
    from PIL import Image, ImageDraw, ImageFont
    PIL_AVAILABLE = True
except ImportError:
    PIL_AVAILABLE = False

try:
    import pystray
    from pystray import MenuItem, Menu
    TRAY_AVAILABLE = True
except ImportError:
    TRAY_AVAILABLE = False


class AgentTray:
    """System tray icon for IT Monitor Agent."""

    STATUS_RUNNING = "running"
    STATUS_SENDING = "sending"
    STATUS_ERROR = "error"
    STATUS_OFFLINE = "offline"

    def __init__(self, config, on_quit=None):
        self.config = config
        self.on_quit = on_quit
        self.status = self.STATUS_RUNNING
        self.last_report_time = "N/A"
        self.last_report_success = None
        self.report_count = 0
        self.icon = None
        self._last_data = {}
        self._base_dir = self._get_base_dir()
        self._icon_cache = {}

    def _get_base_dir(self):
        """Get base directory - works for both .py and .exe."""
        if getattr(sys, 'frozen', False):
            return os.path.dirname(sys.executable)
        return os.path.dirname(os.path.abspath(__file__))

    def _load_ico_file(self, color):
        """Try to load .ico file from disk."""
        ico_path = os.path.join(self._base_dir, f"icon_{color}.ico")
        if os.path.exists(ico_path):
            try:
                return Image.open(ico_path)
            except Exception:
                pass
        return None

    def _create_icon_pillow(self, color="green"):
        """Create icon using Pillow (fallback if .ico files not found)."""
        if not PIL_AVAILABLE:
            return None

        colors = {
            "green": "#22c55e",
            "yellow": "#eab308",
            "red": "#ef4444",
            "gray": "#6b7280",
        }
        bg_color = colors.get(color, colors["gray"])

        img = Image.new("RGBA", (64, 64), (0, 0, 0, 0))
        draw = ImageDraw.Draw(img)

        # Draw rounded rectangle background
        draw.rounded_rectangle([2, 2, 62, 62], radius=12, fill=bg_color)

        # Draw "IT" text
        try:
            font = ImageFont.truetype("arial.ttf", 28)
        except (OSError, IOError):
            font = ImageFont.load_default()

        bbox = draw.textbbox((0, 0), "IT", font=font)
        text_w = bbox[2] - bbox[0]
        text_h = bbox[3] - bbox[1]
        x = (64 - text_w) // 2
        y = (64 - text_h) // 2 - 2
        draw.text((x, y), "IT", fill="white", font=font)

        return img

    def get_icon_image(self, color="green"):
        """Get icon image - tries .ico file first, then Pillow fallback."""
        if color in self._icon_cache:
            return self._icon_cache[color]

        # Try .ico file first
        img = self._load_ico_file(color)

        # Fallback to Pillow-generated icon
        if img is None:
            img = self._create_icon_pillow(color)

        if img is not None:
            self._icon_cache[color] = img

        return img

    def get_status_color(self):
        """Get icon color based on current status."""
        if self.status == self.STATUS_ERROR:
            return "red"
        elif self.status == self.STATUS_OFFLINE:
            return "yellow"
        elif self.status == self.STATUS_SENDING:
            return "yellow"
        return "green"

    def get_tooltip(self):
        """Get tooltip text for tray icon."""
        status_text = {
            self.STATUS_RUNNING: "Running",
            self.STATUS_SENDING: "Sending...",
            self.STATUS_ERROR: "Error",
            self.STATUS_OFFLINE: "Offline",
        }
        return f"IT Monitor Agent - {status_text.get(self.status, 'Unknown')}"

    def update_status(self, status, data=None):
        """Update tray icon status and data."""
        self.status = status
        if data:
            self._last_data = data
        if self.icon:
            new_img = self.get_icon_image(self.get_status_color())
            if new_img:
                self.icon.icon = new_img
            self.icon.title = self.get_tooltip()

    def on_report_sent(self, success):
        """Called after a report is sent."""
        import time
        self.last_report_success = success
        self.last_report_time = time.strftime("%H:%M:%S")
        if success:
            self.report_count += 1
            self.update_status(self.STATUS_RUNNING)
        else:
            self.update_status(self.STATUS_OFFLINE)

    def _get_system_info_text(self):
        """Get current system info for display."""
        lines = []
        data = self._last_data

        hostname = data.get("hostname", socket.gethostname())
        lines.append(f"Computer: {hostname}")
        lines.append(f"Department: {self.config.get('department', 'N/A')}")
        lines.append(f"Server: {self.config.get('server_url', 'N/A')}")
        lines.append("")

        cpu = data.get("cpu_usage", "N/A")
        lines.append(f"CPU: {cpu}%")

        ram_used = data.get("ram_used", 0)
        ram_total = data.get("ram_total", 0)
        ram_pct = data.get("ram_usage", 0)
        lines.append(f"RAM: {ram_used}/{ram_total} GB ({ram_pct}%)")

        disk_used = data.get("disk_used", 0)
        disk_total = data.get("disk_total", 0)
        disk_pct = data.get("disk_usage", 0)
        lines.append(f"Disk: {disk_used}/{disk_total} GB ({disk_pct}%)")

        ip = data.get("ip_address", "N/A")
        lines.append(f"IP: {ip}")

        lines.append("")
        lines.append(f"Last Report: {self.last_report_time}")
        lines.append(f"Reports Sent: {self.report_count}")
        status = "Connected" if self.last_report_success else "Disconnected"
        if self.last_report_success is None:
            status = "Waiting..."
        lines.append(f"Status: {status}")

        return "\n".join(lines)

    def _show_info(self, icon, item):
        """Show system info in a message box (runs in separate thread to avoid blocking)."""
        def _show():
            try:
                import ctypes
                info = self._get_system_info_text()
                ctypes.windll.user32.MessageBoxW(
                    0, info, "IT Monitor Agent - System Info",
                    0x40 | 0x00010000  # MB_ICONINFORMATION | MB_SETFOREGROUND
                )
            except Exception:
                pass
        threading.Thread(target=_show, daemon=True).start()

    def _open_logs(self, icon, item):
        """Open logs folder."""
        try:
            log_dir = os.path.join(self._base_dir, "logs")
            os.makedirs(log_dir, exist_ok=True)
            os.startfile(log_dir)
        except Exception:
            pass

    def _open_config(self, icon, item):
        """Open config.json in default editor."""
        try:
            config_path = os.path.join(self._base_dir, "config.json")
            if os.path.exists(config_path):
                os.startfile(config_path)
        except Exception:
            pass

    def _quit(self, icon, item):
        """Quit the agent."""
        icon.stop()
        if self.on_quit:
            self.on_quit()

    def build_menu(self):
        """Build the tray context menu."""
        return Menu(
            MenuItem("IT Monitor Agent", None, enabled=False),
            Menu.SEPARATOR,
            MenuItem("System Info", self._show_info),
            MenuItem("Open Logs", self._open_logs),
            MenuItem("Open Config", self._open_config),
            Menu.SEPARATOR,
            MenuItem("Quit Agent", self._quit),
        )

    def run(self):
        """Start the tray icon (blocking - run in main thread or own thread)."""
        if not TRAY_AVAILABLE:
            return

        icon_img = self.get_icon_image("green")
        if icon_img is None:
            # Last resort: create a minimal 16x16 green image
            if PIL_AVAILABLE:
                icon_img = Image.new("RGBA", (16, 16), "#22c55e")
            else:
                return

        self.icon = pystray.Icon(
            name="ITMonitorAgent",
            icon=icon_img,
            title=self.get_tooltip(),
            menu=self.build_menu(),
        )
        self.icon.run()

    def run_detached(self):
        """Start the tray icon in a background thread."""
        if not TRAY_AVAILABLE:
            return
        thread = threading.Thread(target=self.run, daemon=True)
        thread.start()
        return thread

    def stop(self):
        """Stop the tray icon."""
        if self.icon:
            self.icon.stop()

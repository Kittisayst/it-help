"""
IT Monitor Agent - System Tray Icon
Shows agent status in Windows system tray with context menu.
"""

import sys
import os
import threading
import socket
import webbrowser

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

    def _send_message_to_it(self, icon, item):
        """Open a dialog to send a message to IT support."""
        def _send():
            import ctypes
            import logging
            import socket
            logger = logging.getLogger("ITMonitorAgent")
            
            try:
                logger.info("=== Send Message to IT: STARTED ===")
                
                # Use PowerShell for Unicode-safe input dialog
                import subprocess
                import tempfile
                
                tmp = tempfile.NamedTemporaryFile(mode='w', suffix='.txt', delete=False, prefix='itmsg_')
                tmp_path = tmp.name
                tmp.close()
                
                ps_script = f'''
Add-Type -AssemblyName System.Windows.Forms
Add-Type -AssemblyName System.Drawing

$form = New-Object System.Windows.Forms.Form
$form.Text = "IT Monitor - Send Message"
$form.Size = New-Object System.Drawing.Size(450, 250)
$form.StartPosition = "CenterScreen"
$form.TopMost = $true
$form.Font = New-Object System.Drawing.Font("Segoe UI", 10)

$label = New-Object System.Windows.Forms.Label
$label.Text = "Type your message to IT Support:"
$label.Location = New-Object System.Drawing.Point(15, 15)
$label.Size = New-Object System.Drawing.Size(400, 25)
$form.Controls.Add($label)

$textBox = New-Object System.Windows.Forms.TextBox
$textBox.Location = New-Object System.Drawing.Point(15, 45)
$textBox.Size = New-Object System.Drawing.Size(400, 100)
$textBox.Multiline = $true
$textBox.ScrollBars = "Vertical"
$form.Controls.Add($textBox)

$okBtn = New-Object System.Windows.Forms.Button
$okBtn.Text = "OK"
$okBtn.Location = New-Object System.Drawing.Point(130, 160)
$okBtn.Size = New-Object System.Drawing.Size(80, 30)
$okBtn.DialogResult = [System.Windows.Forms.DialogResult]::OK
$form.Controls.Add($okBtn)
$form.AcceptButton = $okBtn

$cancelBtn = New-Object System.Windows.Forms.Button
$cancelBtn.Text = "Cancel"
$cancelBtn.Location = New-Object System.Drawing.Point(230, 160)
$cancelBtn.Size = New-Object System.Drawing.Size(80, 30)
$cancelBtn.DialogResult = [System.Windows.Forms.DialogResult]::Cancel
$form.Controls.Add($cancelBtn)
$form.CancelButton = $cancelBtn

$result = $form.ShowDialog()
if ($result -eq [System.Windows.Forms.DialogResult]::OK) {{
    [System.IO.File]::WriteAllText("{tmp_path.replace(chr(92), '/')}", $textBox.Text, [System.Text.Encoding]::UTF8)
}}
'''
                ps_tmp = tempfile.NamedTemporaryFile(mode='w', suffix='.ps1', delete=False, prefix='itmsg_', encoding='utf-8')
                ps_tmp.write(ps_script)
                ps_path = ps_tmp.name
                ps_tmp.close()
                
                logger.info(f"Launching PowerShell dialog: {ps_path}")
                subprocess.run(
                    ["powershell", "-ExecutionPolicy", "Bypass", "-File", ps_path],
                    timeout=120,
                )
                
                # Read message
                message = ""
                try:
                    if os.path.exists(tmp_path) and os.path.getsize(tmp_path) > 0:
                        with open(tmp_path, "r", encoding="utf-8-sig") as f:
                            message = f.read().strip()
                        logger.info(f"Message read: '{message[:50]}...'")
                except Exception as e:
                    logger.error(f"Read error: {e}")
                
                # Cleanup
                for p in [ps_path, tmp_path]:
                    try:
                        if os.path.exists(p):
                            os.remove(p)
                    except Exception:
                        pass

                if not message:
                    logger.info("No message - user cancelled or empty")
                    return

                logger.info(f"Sending message: '{message[:50]}...'")

                import requests
                url = f"{self.config.get('server_url', 'http://localhost:3000')}/api/agent/message"
                payload = {
                    "hostname": socket.gethostname(),
                    "department": self.config.get("department", "General"),
                    "message": message,
                    "ip_address": self._last_data.get("ip_address", ""),
                }
                headers = {
                    "Content-Type": "application/json",
                    "x-api-key": self.config.get("api_key", ""),
                }
                logger.info(f"Sending to {url}")

                try:
                    resp = requests.post(url, json=payload, headers=headers, timeout=10)
                    logger.info(f"Server response: {resp.status_code}")
                    if resp.status_code == 200:
                        ctypes.windll.user32.MessageBoxW(
                            0, "Message sent to IT successfully!",
                            "IT Monitor", 0x40 | 0x00010000
                        )
                        logger.info("SUCCESS")
                    else:
                        ctypes.windll.user32.MessageBoxW(
                            0, f"Send failed: Server responded {resp.status_code}",
                            "IT Monitor", 0x10 | 0x00010000
                        )
                        logger.error(f"Server error {resp.status_code}: {resp.text[:200]}")
                except Exception as e:
                    ctypes.windll.user32.MessageBoxW(
                        0, f"Send failed: {str(e)[:200]}",
                        "IT Monitor", 0x10 | 0x00010000
                    )
                    logger.error(f"Request error: {e}", exc_info=True)

            except Exception as e:
                logger.error(f"FATAL ERROR in Send Message: {e}", exc_info=True)
                try:
                    ctypes.windll.user32.MessageBoxW(
                        0, f"Error: {str(e)[:200]}",
                        "IT Monitor - Error", 0x10 | 0x00010000
                    )
                except:
                    pass

        threading.Thread(target=_send, daemon=True).start()

    def _open_logs(self, icon, item):
        """Open logs folder."""
        try:
            log_dir = os.path.join(self._base_dir, "logs")
            os.makedirs(log_dir, exist_ok=True)
            os.startfile(log_dir)
        except Exception:
            pass

    def _open_config(self, icon, item):
        """Open config file."""
        try:
            config_path = os.path.join(self._base_dir, "config.json")
            os.startfile(config_path)
        except Exception:
            pass

    def _open_programs_page(self, icon, item):
        """Open programs page on server."""
        try:
            server_url = self.config.get("server_url", "http://localhost:3000").rstrip("/")
            webbrowser.open(f"{server_url}/programs")
        except Exception:
            pass

    def _is_autostart_enabled(self):
        """Check if agent is set to auto-start."""
        try:
            import winreg
            key = winreg.OpenKey(
                winreg.HKEY_CURRENT_USER,
                r"Software\Microsoft\Windows\CurrentVersion\Run",
                0,
                winreg.KEY_READ
            )
            try:
                winreg.QueryValueEx(key, "ITMonitorAgent")
                winreg.CloseKey(key)
                return True
            except FileNotFoundError:
                winreg.CloseKey(key)
                return False
        except Exception:
            return False

    def _toggle_autostart(self, icon, item):
        """Toggle auto-start on Windows login."""
        def _toggle():
            import ctypes
            import logging
            logger = logging.getLogger("ITMonitorAgent")
            
            try:
                import winreg
                import sys
                
                key = winreg.OpenKey(
                    winreg.HKEY_CURRENT_USER,
                    r"Software\Microsoft\Windows\CurrentVersion\Run",
                    0,
                    winreg.KEY_SET_VALUE | winreg.KEY_READ
                )
                
                if self._is_autostart_enabled():
                    winreg.DeleteValue(key, "ITMonitorAgent")
                    winreg.CloseKey(key)
                    ctypes.windll.user32.MessageBoxW(
                        0,
                        "Auto-start disabled.\nAgent will not start automatically on login.",
                        "IT Monitor",
                        0x40 | 0x00010000
                    )
                    logger.info("Auto-start disabled")
                else:
                    if getattr(sys, 'frozen', False):
                        exe_path = sys.executable
                    else:
                        exe_path = os.path.join(self._base_dir, "agent.exe")
                    
                    winreg.SetValueEx(key, "ITMonitorAgent", 0, winreg.REG_SZ, f'"{exe_path}"')
                    winreg.CloseKey(key)
                    ctypes.windll.user32.MessageBoxW(
                        0,
                        "Auto-start enabled.\nAgent will start automatically on login.",
                        "IT Monitor",
                        0x40 | 0x00010000
                    )
                    logger.info(f"Auto-start enabled: {exe_path}")
                
                if self.icon:
                    self.icon.menu = self.build_menu()
                    
            except Exception as e:
                logger.error(f"Toggle auto-start error: {e}")
                ctypes.windll.user32.MessageBoxW(
                    0,
                    f"Failed to toggle auto-start:\n{str(e)[:200]}",
                    "IT Monitor - Error",
                    0x10 | 0x00010000
                )
        
        threading.Thread(target=_toggle, daemon=True).start()

    def _check_update(self, icon, item):
        """Manually check for agent update."""
        def _do_check():
            import ctypes
            import logging
            logger = logging.getLogger("ITMonitorAgent")

            try:
                from self_update import check_for_update, download_and_update, get_current_version

                result = check_for_update(self.config.get("server_url", "http://localhost:3000"))
                if not result:
                    ctypes.windll.user32.MessageBoxW(
                        0, "Could not check for updates.\nServer may be unreachable.",
                        "IT Monitor - Update", 0x30 | 0x00010000
                    )
                    return

                if not result.get("available"):
                    ctypes.windll.user32.MessageBoxW(
                        0, f"You are running the latest version.\n\nCurrent: {get_current_version()}\nLatest: {result.get('version', 'unknown')}",
                        "IT Monitor - Update", 0x40 | 0x00010000
                    )
                    return

                answer = ctypes.windll.user32.MessageBoxW(
                    0,
                    f"New version available!\n\nCurrent: {result.get('current', 'unknown')}\nNew: {result['version']}\n\nDownload and install now?",
                    "IT Monitor - Update",
                    0x04 | 0x20 | 0x00010000  # MB_YESNO | MB_ICONQUESTION | MB_TOPMOST
                )

                if answer == 6:  # IDYES
                    should_restart = download_and_update(result["download_url"], result["version"])
                    if should_restart:
                        logger.info("Manual update applied - restarting")
                        os._exit(0)
                    else:
                        ctypes.windll.user32.MessageBoxW(
                            0, "Update failed or not applicable in dev mode.",
                            "IT Monitor - Update", 0x30 | 0x00010000
                        )

            except Exception as e:
                logger.error(f"Manual update check error: {e}")
                ctypes.windll.user32.MessageBoxW(
                    0, f"Update check failed:\n{str(e)[:200]}",
                    "IT Monitor - Error", 0x10 | 0x00010000
                )

        threading.Thread(target=_do_check, daemon=True).start()

    def _quit(self, icon, item):
        """Quit the agent."""
        if self.icon:
            self.icon.stop()
        os._exit(0)

    def build_menu(self):
        """Build the context menu for the tray icon."""
        return Menu(
            MenuItem("IT Monitor Agent", None, enabled=False),
            Menu.SEPARATOR,
            MenuItem("System Info", self._show_info),
            MenuItem("Send Message to IT", self._send_message_to_it),
            Menu.SEPARATOR,
            MenuItem("Auto-start on Login", self._toggle_autostart, checked=lambda item: self._is_autostart_enabled()),
            MenuItem("Check for Update", self._check_update),
            Menu.SEPARATOR,
            MenuItem("Open Logs", self._open_logs),
            MenuItem("Open Config", self._open_config),
            MenuItem("Programs List", self._open_programs_page),
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

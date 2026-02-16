"""Collect startup programs information."""
import sys


def collect_startup():
    """Collect list of programs that run at startup."""
    if sys.platform != "win32":
        return {"startup_programs": []}

    programs = []

    try:
        import winreg

        # Registry locations for startup programs
        startup_keys = [
            (winreg.HKEY_LOCAL_MACHINE, r"SOFTWARE\Microsoft\Windows\CurrentVersion\Run"),
            (winreg.HKEY_LOCAL_MACHINE, r"SOFTWARE\WOW6432Node\Microsoft\Windows\CurrentVersion\Run"),
            (winreg.HKEY_CURRENT_USER, r"SOFTWARE\Microsoft\Windows\CurrentVersion\Run"),
        ]

        for hive, key_path in startup_keys:
            try:
                key = winreg.OpenKey(hive, key_path, 0, winreg.KEY_READ)
                i = 0
                while True:
                    try:
                        name, value, _ = winreg.EnumValue(key, i)
                        hive_name = "HKLM" if hive == winreg.HKEY_LOCAL_MACHINE else "HKCU"
                        programs.append({
                            "name": name,
                            "command": value,
                            "location": f"{hive_name}\\...\\Run",
                        })
                        i += 1
                    except OSError:
                        break
                winreg.CloseKey(key)
            except FileNotFoundError:
                continue
            except Exception:
                continue

    except Exception:
        pass

    return {"startup_programs": programs}

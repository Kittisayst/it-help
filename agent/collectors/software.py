import sys


def collect_software():
    """Collect list of installed software from Windows registry."""
    if sys.platform != "win32":
        return {"software": []}

    software_list = []

    try:
        import winreg

        reg_paths = [
            r"SOFTWARE\Microsoft\Windows\CurrentVersion\Uninstall",
            r"SOFTWARE\WOW6432Node\Microsoft\Windows\CurrentVersion\Uninstall",
        ]

        for reg_path in reg_paths:
            try:
                key = winreg.OpenKey(winreg.HKEY_LOCAL_MACHINE, reg_path)
                for i in range(winreg.QueryInfoKey(key)[0]):
                    try:
                        subkey_name = winreg.EnumKey(key, i)
                        subkey = winreg.OpenKey(key, subkey_name)

                        try:
                            name = winreg.QueryValueEx(subkey, "DisplayName")[0]
                        except FileNotFoundError:
                            continue

                        try:
                            version = winreg.QueryValueEx(subkey, "DisplayVersion")[0]
                        except FileNotFoundError:
                            version = "N/A"

                        if name and name.strip():
                            software_list.append({
                                "name": name.strip(),
                                "version": str(version).strip(),
                            })

                        winreg.CloseKey(subkey)
                    except (OSError, WindowsError):
                        continue

                winreg.CloseKey(key)
            except (OSError, WindowsError):
                continue

    except Exception:
        pass

    software_list.sort(key=lambda x: x["name"].lower())

    seen = set()
    unique = []
    for sw in software_list:
        key = sw["name"].lower()
        if key not in seen:
            seen.add(key)
            unique.append(sw)

    return {"software": unique}

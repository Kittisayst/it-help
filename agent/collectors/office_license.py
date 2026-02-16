"""Collect Microsoft Office activation/license information."""
import sys
import subprocess
import os


def collect_office_license():
    """Collect MS Office version and license status."""
    if sys.platform != "win32":
        return {"office_license": {}}

    info = {
        "installed": False,
        "version": "",
        "products": [],
    }

    # Common Office installation paths for OSPP.VBS
    ospp_paths = [
        r"C:\Program Files\Microsoft Office\Office16\OSPP.VBS",
        r"C:\Program Files\Microsoft Office\Office15\OSPP.VBS",
        r"C:\Program Files\Microsoft Office\Office14\OSPP.VBS",
        r"C:\Program Files (x86)\Microsoft Office\Office16\OSPP.VBS",
        r"C:\Program Files (x86)\Microsoft Office\Office15\OSPP.VBS",
        r"C:\Program Files (x86)\Microsoft Office\Office14\OSPP.VBS",
    ]

    # Also check Click-to-Run paths
    c2r_paths = [
        r"C:\Program Files\Microsoft Office\root\Office16\OSPP.VBS",
        r"C:\Program Files (x86)\Microsoft Office\root\Office16\OSPP.VBS",
    ]

    ospp_path = None
    for path in c2r_paths + ospp_paths:
        if os.path.exists(path):
            ospp_path = path
            break

    if ospp_path is None:
        # Try to detect Office via registry
        try:
            import winreg
            office_versions = {
                "16.0": "Office 2016/2019/2021/365",
                "15.0": "Office 2013",
                "14.0": "Office 2010",
            }
            for ver, name in office_versions.items():
                try:
                    key = winreg.OpenKey(
                        winreg.HKEY_LOCAL_MACHINE,
                        rf"SOFTWARE\Microsoft\Office\{ver}\Common\InstallRoot"
                    )
                    winreg.CloseKey(key)
                    info["installed"] = True
                    info["version"] = name
                    break
                except FileNotFoundError:
                    continue
        except Exception:
            pass

        if not info["installed"]:
            return {"office_license": info}

    if ospp_path:
        info["installed"] = True

        # Determine version from path
        if "Office16" in ospp_path:
            info["version"] = "Office 2016/2019/2021/365"
        elif "Office15" in ospp_path:
            info["version"] = "Office 2013"
        elif "Office14" in ospp_path:
            info["version"] = "Office 2010"

        try:
            result = subprocess.run(
                ["cscript", "//nologo", ospp_path, "/dstatus"],
                capture_output=True, text=True, timeout=30,
                creationflags=subprocess.CREATE_NO_WINDOW,
            )
            output = result.stdout

            current_product = {}
            for line in output.splitlines():
                line = line.strip()
                if not line:
                    if current_product.get("name"):
                        info["products"].append(current_product)
                    current_product = {}
                    continue

                if "PRODUCT ID" in line.upper() or "SKU ID" in line.upper():
                    pass
                elif "LICENSE NAME" in line.upper() or line.startswith("LICENSE NAME"):
                    current_product["name"] = line.split(":", 1)[-1].strip()
                elif "LICENSE DESCRIPTION" in line.upper():
                    current_product["description"] = line.split(":", 1)[-1].strip()
                elif "LICENSE STATUS" in line.upper():
                    status = line.split(":", 1)[-1].strip()
                    current_product["status"] = status
                    current_product["is_activated"] = "licensed" in status.lower()
                elif "LAST 5" in line.upper() or "PARTIAL" in line.upper():
                    current_product["partial_key"] = line.split(":", 1)[-1].strip()

            if current_product.get("name"):
                info["products"].append(current_product)

        except subprocess.TimeoutExpired:
            info["products"] = [{"name": "Timeout", "status": "Could not check"}]
        except Exception as e:
            info["products"] = [{"name": "Error", "status": str(e)[:100]}]

    return {"office_license": info}

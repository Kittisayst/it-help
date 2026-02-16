"""Collect shared folders information."""
import sys
import subprocess


def collect_shared_folders():
    """Collect list of shared folders on this computer."""
    if sys.platform != "win32":
        return {"shared_folders": []}

    folders = []

    try:
        result = subprocess.run(
            ["net", "share"],
            capture_output=True, text=True, timeout=10,
            creationflags=subprocess.CREATE_NO_WINDOW,
        )

        lines = result.stdout.splitlines()
        # Skip header lines (first 4 lines) and footer
        data_started = False
        for line in lines:
            if "---" in line:
                data_started = True
                continue
            if not data_started:
                continue
            if not line.strip() or "command completed" in line.lower():
                continue

            # Parse: ShareName  Resource  Remark
            parts = line.split()
            if len(parts) >= 1:
                name = parts[0]
                # Skip system shares (ending with $)
                is_hidden = name.endswith("$")
                resource = parts[1] if len(parts) >= 2 else ""
                remark = " ".join(parts[2:]) if len(parts) >= 3 else ""

                folders.append({
                    "name": name,
                    "path": resource,
                    "remark": remark,
                    "is_hidden": is_hidden,
                })

    except Exception:
        pass

    return {"shared_folders": folders}

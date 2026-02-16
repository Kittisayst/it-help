"""Collect Windows Update information."""
import sys
import subprocess


def collect_windows_update():
    """Collect Windows Update status and recent updates."""
    if sys.platform != "win32":
        return {"windows_update": {}}

    info = {
        "recent_updates": [],
        "pending_count": 0,
    }

    try:
        # Get recent installed updates using PowerShell
        result = subprocess.run(
            [
                "powershell", "-NoProfile", "-Command",
                "Get-HotFix | Sort-Object -Property InstalledOn -Descending -ErrorAction SilentlyContinue | "
                "Select-Object -First 10 HotFixID, Description, InstalledOn | "
                "ForEach-Object { $_.HotFixID + '|' + $_.Description + '|' + ($_.InstalledOn -f 'yyyy-MM-dd') }"
            ],
            capture_output=True, text=True, timeout=30,
            creationflags=subprocess.CREATE_NO_WINDOW,
        )

        for line in result.stdout.splitlines():
            line = line.strip()
            if not line:
                continue
            parts = line.split("|")
            if len(parts) >= 2:
                info["recent_updates"].append({
                    "id": parts[0].strip(),
                    "description": parts[1].strip(),
                    "installed_on": parts[2].strip() if len(parts) >= 3 else "",
                })

    except subprocess.TimeoutExpired:
        info["recent_updates"] = [{"id": "Timeout", "description": "Could not check"}]
    except Exception:
        pass

    try:
        # Check for pending updates using COM (Windows Update Agent)
        result = subprocess.run(
            [
                "powershell", "-NoProfile", "-Command",
                "$UpdateSession = New-Object -ComObject Microsoft.Update.Session; "
                "$UpdateSearcher = $UpdateSession.CreateUpdateSearcher(); "
                "$SearchResult = $UpdateSearcher.Search('IsInstalled=0'); "
                "$SearchResult.Updates.Count"
            ],
            capture_output=True, text=True, timeout=60,
            creationflags=subprocess.CREATE_NO_WINDOW,
        )
        count = result.stdout.strip()
        if count.isdigit():
            info["pending_count"] = int(count)
    except Exception:
        pass

    return {"windows_update": info}

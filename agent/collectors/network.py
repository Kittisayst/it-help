import socket
import psutil
import uuid


def collect_network():
    """Collect network information including IP and MAC address."""
    ip_address = "unknown"
    mac_address = "unknown"

    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(("8.8.8.8", 80))
        ip_address = s.getsockname()[0]
        s.close()
    except Exception:
        try:
            ip_address = socket.gethostbyname(socket.gethostname())
        except Exception:
            pass

    try:
        mac = uuid.getnode()
        mac_address = ":".join(
            f"{(mac >> i) & 0xFF:02x}" for i in range(40, -1, -8)
        )
    except Exception:
        pass

    net_info = {}
    try:
        addrs = psutil.net_if_addrs()
        for iface, addr_list in addrs.items():
            for addr in addr_list:
                if addr.family == socket.AF_INET and addr.address != "127.0.0.1":
                    net_info[iface] = addr.address
    except Exception:
        pass

    net_up = True
    try:
        socket.create_connection(("8.8.8.8", 53), timeout=3)
    except OSError:
        net_up = False

    return {
        "ip_address": ip_address,
        "mac_address": mac_address,
        "network_up": net_up,
        "network_info": net_info,
    }

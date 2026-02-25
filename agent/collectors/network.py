import socket
import psutil
import uuid
import time

# Global counters for bandwidth calculation
_last_io_counters = None
_last_check_time = 0


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
        "bandwidth_usage": collect_bandwidth_usage()
    }

def collect_bandwidth_usage():
    """Calculate bytes sent/received since last check."""
    global _last_io_counters, _last_check_time
    
    try:
        current_io = psutil.net_io_counters()
        now = time.time()
        
        if _last_io_counters is None:
            # First run - store current values and return zeros
            _last_io_counters = current_io
            _last_check_time = now
            return {"sent_bytes": 0, "recv_bytes": 0, "duration": 0}
            
        elapsed = now - _last_check_time
        sent_bytes = current_io.bytes_sent - _last_io_counters.bytes_sent
        recv_bytes = current_io.bytes_recv - _last_io_counters.bytes_recv
        
        # Handle counter reset (rare)
        if sent_bytes < 0: sent_bytes = 0
        if recv_bytes < 0: recv_bytes = 0
        
        _last_io_counters = current_io
        _last_check_time = now
        
        return {
            "sent_bytes": sent_bytes,
            "recv_bytes": recv_bytes,
            "duration": round(elapsed, 2)
        }
    except Exception:
        return {"sent_bytes": 0, "recv_bytes": 0, "duration": 0}

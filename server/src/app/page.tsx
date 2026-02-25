"use client";

import { useEffect, useState } from "react";
import {
  Monitor,
  Wifi,
  WifiOff,
  AlertTriangle,
  Cpu,
  HardDrive,
  MemoryStick,
} from "lucide-react";
import { MetricCard } from "@/components/metric-card";
import { StatusBadge } from "@/components/status-badge";
import { useSocket } from "@/hooks/use-socket";
import { useBrowserNotifications } from "@/hooks/use-browser-notifications";

interface DashboardData {
  totalComputers: number;
  online: number;
  offline: number;
  warning: number;
  avgCpu: number;
  avgRam: number;
  avgDisk: number;
  unresolvedAlerts: number;
  recentAlerts: Array<{
    id: string;
    type: string;
    severity: string;
    message: string;
    createdAt: string;
    computer: { hostname: string; ipAddress: string };
  }>;
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const { on, emit } = useSocket();
  const { requestPermission, showNotification } = useBrowserNotifications();

  const fetchData = async () => {
    try {
      const res = await fetch("/api/dashboard");
      const json = await res.json();
      setData(json);
    } catch (err) {
      console.error("Failed to fetch dashboard:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // Fallback polling (slower since we have socket)
    const interval = setInterval(fetchData, 30000);

    // Join dashboard room for real-time updates
    emit("join:dashboard");

    const offUpdated = on("computer:updated", () => fetchData());
    const offAlert = on("alert:new", (payload: { hostname: string; alerts: string[] }) => {
      fetchData();
      // Show browser notification for new alerts
      requestPermission().then((granted) => {
        if (granted) {
          showNotification(`New Alert: ${payload.hostname}`, {
            body: payload.alerts.join(", "),
            tag: `alert-${payload.hostname}`,
          });
        }
      });
    });

    return () => {
      clearInterval(interval);
      offUpdated();
      offAlert();
    };
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin w-8 h-8 border-2 border-accent border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-20">
        <Monitor className="w-16 h-16 text-muted mx-auto mb-4" />
        <h2 className="text-xl font-semibold">No Data Available</h2>
        <p className="text-muted mt-2">Waiting for agents to connect...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Dashboard Overview</h1>
        <p className="text-muted text-sm mt-1">Real-time monitoring of all computers in the network</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Total Computers"
          value={data.totalComputers}
          icon={Monitor}
          color="text-accent"
          subtitle={`${data.online} online`}
        />
        <MetricCard
          title="Online"
          value={data.online}
          icon={Wifi}
          color="text-emerald-400"
          subtitle={`${data.warning} warning`}
        />
        <MetricCard
          title="Offline"
          value={data.offline}
          icon={WifiOff}
          color="text-red-400"
        />
        <MetricCard
          title="Active Alerts"
          value={data.unresolvedAlerts}
          icon={AlertTriangle}
          color={data.unresolvedAlerts > 0 ? "text-amber-400" : "text-emerald-400"}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <MetricCard
          title="Avg CPU Usage"
          value={`${data.avgCpu.toFixed(1)}%`}
          icon={Cpu}
          color={data.avgCpu > 80 ? "text-red-400" : data.avgCpu > 60 ? "text-amber-400" : "text-emerald-400"}
        />
        <MetricCard
          title="Avg RAM Usage"
          value={`${data.avgRam.toFixed(1)}%`}
          icon={MemoryStick}
          color={data.avgRam > 80 ? "text-red-400" : data.avgRam > 60 ? "text-amber-400" : "text-emerald-400"}
        />
        <MetricCard
          title="Avg Disk Usage"
          value={`${data.avgDisk.toFixed(1)}%`}
          icon={HardDrive}
          color={data.avgDisk > 80 ? "text-red-400" : data.avgDisk > 60 ? "text-amber-400" : "text-emerald-400"}
        />
      </div>

      <div className="bg-card border border-border rounded-xl p-6">
        <h2 className="text-lg font-semibold mb-4">Recent Alerts</h2>
        {data.recentAlerts.length === 0 ? (
          <p className="text-muted text-sm py-4 text-center">No active alerts</p>
        ) : (
          <div className="space-y-3">
            {data.recentAlerts.map((alert) => (
              <div
                key={alert.id}
                className={`flex items-center justify-between p-3 rounded-lg border ${
                  alert.severity === "critical"
                    ? "border-red-500/30 bg-red-500/5"
                    : "border-amber-500/30 bg-amber-500/5"
                }`}
              >
                <div className="flex items-center gap-3">
                  <AlertTriangle
                    className={`w-4 h-4 ${
                      alert.severity === "critical" ? "text-red-400" : "text-amber-400"
                    }`}
                  />
                  <div>
                    <p className="text-sm font-medium">{alert.message}</p>
                    <p className="text-xs text-muted mt-0.5">
                      {alert.computer.hostname} ({alert.computer.ipAddress})
                    </p>
                  </div>
                </div>
                <StatusBadge status={alert.severity === "critical" ? "offline" : "warning"} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

import {
  Cpu,
  MemoryStick,
  HardDrive,
  Clock,
  Wifi,
  Settings,
  AlertTriangle,
  Save,
} from "lucide-react";
import { UsageBar } from "@/components/usage-bar";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { ComputerDetail } from "./types";
import { useState, useEffect } from "react";

function formatUptime(seconds: number): string {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  if (days > 0) return `${days}d ${hours}h ${mins}m`;
  if (hours > 0) return `${hours}h ${mins}m`;
  return `${mins}m`;
}

function formatGB(bytes: number): string {
  return `${bytes.toFixed(1)} GB`;
}

export function OverviewTab({ computer }: { computer: ComputerDetail }) {
  const report = computer.lastReport;
  const [thresholds, setThresholds] = useState({
    cpuThreshold: 90,
    ramThreshold: 85,
    diskThreshold: 90,
    eventLogErrors: true,
  });
  const [editingThresholds, setEditingThresholds] = useState(false);

  useEffect(() => {
    fetch(`/api/computers/${computer.id}/thresholds`)
      .then((res) => res.json())
      .then(setThresholds);
  }, [computer.id]);

  const saveThresholds = async () => {
    try {
      const res = await fetch(`/api/computers/${computer.id}/thresholds`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(thresholds),
      });
      if (res.ok) {
        setEditingThresholds(false);
      }
    } catch (err) {
      console.error("Failed to save thresholds:", err);
    }
  };

  const chartData = [...computer.history].reverse().map((h) => ({
    time: new Date(h.createdAt).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }),
    CPU: h.cpuUsage,
    RAM: h.ramUsage,
    Disk: h.diskUsage,
  }));

  return (
    <div className="space-y-6">
      {/* System Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-card border border-border rounded-xl p-4">
          <div className="flex items-center gap-2 text-muted text-sm mb-2">
            <Settings className="w-4 h-4" />
            OS
          </div>
          <p className="font-medium text-sm">{computer.osVersion || "N/A"}</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-4">
          <div className="flex items-center gap-2 text-muted text-sm mb-2">
            <Clock className="w-4 h-4" />
            Uptime
          </div>
          <p className="font-medium text-sm">{report?.uptime ? formatUptime(report.uptime) : "N/A"}</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-4">
          <div className="flex items-center gap-2 text-muted text-sm mb-2">
            <Wifi className="w-4 h-4" />
            Network
          </div>
          <p className="font-medium text-sm">{report?.networkUp ? "Connected" : "Disconnected"}</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-4">
          <div className="flex items-center gap-2 text-muted text-sm mb-2">
            <AlertTriangle className="w-4 h-4" />
            Antivirus
          </div>
          <p className="font-medium text-sm">{report?.antivirusStatus || "N/A"}</p>
        </div>
      </div>

      {/* Usage Bars */}
      {report && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-card border border-border rounded-xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <Cpu className="w-5 h-5 text-accent" />
              <h3 className="font-semibold">CPU</h3>
            </div>
            <UsageBar label="Usage" value={report.cpuUsage} />
            <div className="mt-3 text-xs text-muted space-y-1">
              {report.cpuCores && <p>Cores: {report.cpuCores}</p>}
              {report.cpuSpeed && <p>Speed: {report.cpuSpeed}</p>}
              {report.cpuTemp && <p>Temp: {report.cpuTemp}°C</p>}
            </div>
          </div>
          <div className="bg-card border border-border rounded-xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <MemoryStick className="w-5 h-5 text-purple-400" />
              <h3 className="font-semibold">Memory</h3>
            </div>
            <UsageBar label="Usage" value={report.ramUsage} />
            <div className="mt-3 text-xs text-muted">
              <p>{formatGB(report.ramUsed)} / {formatGB(report.ramTotal)}</p>
            </div>
          </div>
          <div className="bg-card border border-border rounded-xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <HardDrive className="w-5 h-5 text-amber-400" />
              <h3 className="font-semibold">Disk</h3>
            </div>
            <UsageBar label="Usage" value={report.diskUsage} />
            <div className="mt-3 text-xs text-muted">
              <p>{formatGB(report.diskUsed)} / {formatGB(report.diskTotal)}</p>
            </div>
          </div>
        </div>
      )}

      {/* Threshold Settings */}
      <div className="bg-card border border-border rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            <h3 className="font-semibold">Alert Thresholds</h3>
          </div>
          {!editingThresholds ? (
            <button
              onClick={() => setEditingThresholds(true)}
              className="text-sm text-accent hover:text-accent/80"
            >
              Edit
            </button>
          ) : (
            <div className="flex gap-2">
              <button
                onClick={() => setEditingThresholds(false)}
                className="text-sm text-muted hover:text-foreground"
              >
                Cancel
              </button>
              <button
                onClick={saveThresholds}
                className="flex items-center gap-1 text-sm text-accent hover:text-accent/80"
              >
                <Save className="w-3 h-3" />
                Save
              </button>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">CPU Alert (%)</label>
            <input
              type="number"
              min="50"
              max="100"
              disabled={!editingThresholds}
              value={thresholds.cpuThreshold}
              onChange={(e) => setThresholds({ ...thresholds, cpuThreshold: Number(e.target.value) })}
              className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm disabled:opacity-50"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">RAM Alert (%)</label>
            <input
              type="number"
              min="50"
              max="100"
              disabled={!editingThresholds}
              value={thresholds.ramThreshold}
              onChange={(e) => setThresholds({ ...thresholds, ramThreshold: Number(e.target.value) })}
              className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm disabled:opacity-50"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Disk Alert (%)</label>
            <input
              type="number"
              min="50"
              max="100"
              disabled={!editingThresholds}
              value={thresholds.diskThreshold}
              onChange={(e) => setThresholds({ ...thresholds, diskThreshold: Number(e.target.value) })}
              className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm disabled:opacity-50"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Event Log Errors</label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                disabled={!editingThresholds}
                checked={thresholds.eventLogErrors}
                onChange={(e) => setThresholds({ ...thresholds, eventLogErrors: e.target.checked })}
                className="w-4 h-4 rounded border-border disabled:opacity-50"
              />
              <span className="text-sm">Alert on errors</span>
            </label>
          </div>
        </div>
      </div>

      {/* History Chart */}
      {chartData.length > 1 && (
        <div className="bg-card border border-border rounded-xl p-6">
          <h3 className="font-semibold mb-4">Usage History</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="time" stroke="#64748b" fontSize={12} />
              <YAxis stroke="#64748b" fontSize={12} domain={[0, 100]} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#1e293b",
                  border: "1px solid #334155",
                  borderRadius: "8px",
                  color: "#e2e8f0",
                }}
              />
              <Legend />
              <Line type="monotone" dataKey="CPU" stroke="#3b82f6" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="RAM" stroke="#a855f7" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="Disk" stroke="#f59e0b" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Alerts */}
      {computer.alerts.length > 0 && (
        <div className="bg-card border border-border rounded-xl p-6">
          <h3 className="font-semibold mb-4">Recent Alerts</h3>
          <div className="space-y-2">
            {computer.alerts.slice(0, 10).map((alert) => (
              <div
                key={alert.id}
                className={`flex items-center justify-between p-3 rounded-lg border text-sm ${
                  alert.resolved
                    ? "border-border bg-border/20 opacity-50"
                    : alert.severity === "critical"
                    ? "border-red-500/30 bg-red-500/5"
                    : "border-amber-500/30 bg-amber-500/5"
                }`}
              >
                <div className="flex items-center gap-2">
                  <AlertTriangle className={`w-4 h-4 ${
                    alert.resolved ? "text-muted" :
                    alert.severity === "critical" ? "text-red-400" : "text-amber-400"
                  }`} />
                  <span>{alert.message}</span>
                </div>
                <span className="text-xs text-muted">
                  {new Date(alert.createdAt).toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

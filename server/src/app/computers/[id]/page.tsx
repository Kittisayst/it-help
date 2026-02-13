"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Cpu,
  MemoryStick,
  HardDrive,
  Clock,
  Wifi,
  Monitor,
  AlertTriangle,
  Settings,
  List,
} from "lucide-react";
import { StatusBadge } from "@/components/status-badge";
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

interface ComputerDetail {
  id: string;
  hostname: string;
  ipAddress: string;
  macAddress: string | null;
  osVersion: string | null;
  department: string | null;
  label: string | null;
  status: "online" | "offline" | "warning";
  lastSeenAt: string;
  createdAt: string;
  lastReport: {
    cpuUsage: number;
    cpuCores: number | null;
    cpuSpeed: string | null;
    cpuTemp: number | null;
    ramTotal: number;
    ramUsed: number;
    ramUsage: number;
    diskTotal: number;
    diskUsed: number;
    diskUsage: number;
    diskDetails: Array<{ device: string; total: number; used: number; percent: number }> | null;
    networkUp: boolean;
    networkInfo: Record<string, string> | null;
    osInfo: Record<string, string> | null;
    uptime: number | null;
    topProcesses: Array<{ name: string; cpu: number; memory: number }> | null;
    eventLogs: Array<{ level: string; source: string; message: string; time: string }> | null;
    software: Array<{ name: string; version: string }> | null;
    antivirusStatus: string | null;
  } | null;
  history: Array<{
    cpuUsage: number;
    ramUsage: number;
    diskUsage: number;
    createdAt: string;
  }>;
  alerts: Array<{
    id: string;
    type: string;
    severity: string;
    message: string;
    resolved: boolean;
    createdAt: string;
  }>;
}

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

export default function ComputerDetailPage() {
  const params = useParams();
  const [computer, setComputer] = useState<ComputerDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"overview" | "processes" | "events" | "software">("overview");

  const fetchComputer = async () => {
    try {
      const res = await fetch(`/api/computers/${params.id}`);
      if (!res.ok) throw new Error("Not found");
      const json = await res.json();
      setComputer(json);
    } catch (err) {
      console.error("Failed to fetch computer:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComputer();
    const interval = setInterval(fetchComputer, 15000);
    return () => clearInterval(interval);
  }, [params.id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin w-8 h-8 border-2 border-accent border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!computer) {
    return (
      <div className="text-center py-20">
        <Monitor className="w-16 h-16 text-muted mx-auto mb-4" />
        <h2 className="text-xl font-semibold">Computer not found</h2>
        <Link href="/computers" className="text-accent text-sm mt-2 inline-block">
          Back to computers
        </Link>
      </div>
    );
  }

  const chartData = [...computer.history].reverse().map((h) => ({
    time: new Date(h.createdAt).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }),
    CPU: h.cpuUsage,
    RAM: h.ramUsage,
    Disk: h.diskUsage,
  }));

  const report = computer.lastReport;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link
          href="/computers"
          className="p-2 bg-card border border-border rounded-lg hover:bg-border/50 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold">{computer.hostname}</h1>
            <StatusBadge status={computer.status} />
          </div>
          <p className="text-muted text-sm mt-1">
            {computer.ipAddress} | {computer.department || "General"} | Last seen: {new Date(computer.lastSeenAt).toLocaleString()}
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-border pb-0">
        {[
          { key: "overview", label: "Overview", icon: Monitor },
          { key: "processes", label: "Processes", icon: Cpu },
          { key: "events", label: "Event Logs", icon: AlertTriangle },
          { key: "software", label: "Software", icon: List },
        ].map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key as typeof tab)}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors -mb-px ${
              tab === t.key
                ? "border-accent text-accent"
                : "border-transparent text-muted hover:text-foreground"
            }`}
          >
            <t.icon className="w-4 h-4" />
            {t.label}
          </button>
        ))}
      </div>

      {tab === "overview" && (
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
      )}

      {tab === "processes" && (
        <div className="bg-card border border-border rounded-xl p-6">
          <h3 className="font-semibold mb-4">Top Processes</h3>
          {report?.topProcesses && report.topProcesses.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-muted">
                    <th className="text-left py-3 px-4">Process Name</th>
                    <th className="text-right py-3 px-4">CPU %</th>
                    <th className="text-right py-3 px-4">Memory (MB)</th>
                  </tr>
                </thead>
                <tbody>
                  {report.topProcesses.map((proc, i) => (
                    <tr key={i} className="border-b border-border/50 hover:bg-border/20">
                      <td className="py-3 px-4 font-mono">{proc.name}</td>
                      <td className={`py-3 px-4 text-right font-mono ${proc.cpu > 50 ? "text-red-400" : ""}`}>
                        {proc.cpu.toFixed(1)}%
                      </td>
                      <td className="py-3 px-4 text-right font-mono">{proc.memory.toFixed(1)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-muted text-center py-8">No process data available</p>
          )}
        </div>
      )}

      {tab === "events" && (
        <div className="bg-card border border-border rounded-xl p-6">
          <h3 className="font-semibold mb-4">Windows Event Logs</h3>
          {report?.eventLogs && report.eventLogs.length > 0 ? (
            <div className="space-y-2">
              {report.eventLogs.map((log, i) => (
                <div
                  key={i}
                  className={`p-3 rounded-lg border text-sm ${
                    log.level === "Error" || log.level === "Critical"
                      ? "border-red-500/30 bg-red-500/5"
                      : "border-amber-500/30 bg-amber-500/5"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className={`font-medium ${
                      log.level === "Error" || log.level === "Critical" ? "text-red-400" : "text-amber-400"
                    }`}>
                      [{log.level}] {log.source}
                    </span>
                    <span className="text-xs text-muted">{log.time}</span>
                  </div>
                  <p className="text-muted text-xs">{log.message}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted text-center py-8">No event logs available</p>
          )}
        </div>
      )}

      {tab === "software" && (
        <div className="bg-card border border-border rounded-xl p-6">
          <h3 className="font-semibold mb-4">Installed Software</h3>
          {report?.software && report.software.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-muted">
                    <th className="text-left py-3 px-4">Name</th>
                    <th className="text-left py-3 px-4">Version</th>
                  </tr>
                </thead>
                <tbody>
                  {report.software.map((sw, i) => (
                    <tr key={i} className="border-b border-border/50 hover:bg-border/20">
                      <td className="py-2 px-4">{sw.name}</td>
                      <td className="py-2 px-4 font-mono text-muted">{sw.version}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-muted text-center py-8">No software data available</p>
          )}
        </div>
      )}
    </div>
  );
}

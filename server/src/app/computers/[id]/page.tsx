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
  Printer,
  KeyRound,
  Play,
  FolderOpen,
  Usb,
  Download,
  Terminal,
  Power,
  Lock,
  Trash2,
  RefreshCw,
  Loader2,
  Cog,
  Camera,
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
  tags: string | null;
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
    printers: Array<{ name: string; is_default: boolean; is_network: boolean; status: string; port: string; driver: string }> | null;
    windowsLicense: { edition: string; status: string; partial_key: string; is_activated: boolean; license_type: string } | null;
    officeLicense: { installed: boolean; version: string; products: Array<{ name: string; status: string; is_activated: boolean; partial_key: string }> } | null;
    startupPrograms: Array<{ name: string; command: string; location: string }> | null;
    sharedFolders: Array<{ name: string; path: string; remark: string; is_hidden: boolean }> | null;
    usbDevices: Array<{ name: string; status: string; manufacturer: string }> | null;
    windowsUpdate: { recent_updates: Array<{ id: string; description: string; installed_on: string }>; pending_count: number } | null;
    services: Array<{ name: string; displayName: string; status: string; startType: string }> | null;
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
  const [tab, setTab] = useState<"overview" | "processes" | "events" | "software" | "printers" | "licenses" | "startup" | "services" | "system" | "actions">("overview");
  const [commands, setCommands] = useState<Array<{ id: string; action: string; params: string | null; status: string; result: string | null; createdAt: string; executedAt: string | null }>>([]);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [customScript, setCustomScript] = useState("");
  const [pingHost, setPingHost] = useState("8.8.8.8");
  const [killTarget, setKillTarget] = useState("");
  const [editingLabel, setEditingLabel] = useState(false);
  const [editingTags, setEditingTags] = useState(false);
  const [labelValue, setLabelValue] = useState("");
  const [tagsValue, setTagsValue] = useState("");
  const [serverMessage, setServerMessage] = useState("");
  const [screenshot, setScreenshot] = useState<string | null>(null);
  const [screenshotLoading, setScreenshotLoading] = useState(false);

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

  const fetchCommands = async () => {
    if (!params.id) return;
    try {
      const res = await fetch(`/api/commands?computerId=${params.id}`);
      if (res.ok) {
        const json = await res.json();
        setCommands(json);
      }
    } catch (err) {
      console.error("Failed to fetch commands:", err);
    }
  };

  const sendCommand = async (action: string, cmdParams?: Record<string, unknown>) => {
    if (!computer) return;
    setActionLoading(action);
    try {
      const res = await fetch("/api/commands", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          computerId: computer.id,
          action,
          params: cmdParams || null,
        }),
      });
      if (res.ok) {
        fetchCommands();
      }
    } catch (err) {
      console.error("Failed to send command:", err);
    } finally {
      setTimeout(() => setActionLoading(null), 1000);
    }
  };

  const saveLabel = async () => {
    if (!computer) return;
    try {
      const res = await fetch(`/api/computers/${computer.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ label: labelValue }),
      });
      if (res.ok) {
        setEditingLabel(false);
        fetchComputer();
      }
    } catch (err) {
      console.error("Failed to save label:", err);
    }
  };

  const saveTags = async () => {
    if (!computer) return;
    try {
      const res = await fetch(`/api/computers/${computer.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tags: tagsValue }),
      });
      if (res.ok) {
        setEditingTags(false);
        fetchComputer();
      }
    } catch (err) {
      console.error("Failed to save tags:", err);
    }
  };

  const sendServerMessage = async () => {
    if (!computer || !serverMessage.trim()) return;
    try {
      const res = await fetch("/api/server-messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          computerId: computer.id,
          message: serverMessage,
        }),
      });
      if (res.ok) {
        setServerMessage("");
        alert("ຂໍ້ຄວາມຖືກສົ່ງແລ້ວ! Agent ຈະໄດ້ຮັບໃນ cycle ຕໍ່ໄປ.");
      }
    } catch (err) {
      console.error("Failed to send server message:", err);
      alert("ສົ່ງຂໍ້ຄວາມບໍ່ສຳເລັດ");
    }
  };

  const captureScreenshot = async () => {
    if (!computer) return;
    setScreenshotLoading(true);
    try {
      const res = await fetch("/api/commands", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          computerId: computer.id,
          action: "screenshot",
          params: null,
        }),
      });
      
      if (res.ok) {
        const command = await res.json();
        const commandId = command.id;
        
        // Poll for result
        const pollInterval = setInterval(async () => {
          const cmdRes = await fetch(`/api/commands?computerId=${computer.id}`);
          const commands = await cmdRes.json();
          const cmd = commands.find((c: any) => c.id === commandId);
          
          if (cmd && cmd.status === "completed") {
            clearInterval(pollInterval);
            setScreenshotLoading(false);
            
            if (cmd.result) {
              try {
                const result = JSON.parse(cmd.result);
                console.log("Screenshot result:", result);
                if (result.screenshot) {
                  setScreenshot(result.screenshot);
                  console.log("Screenshot set successfully, length:", result.screenshot.length);
                } else {
                  console.error("No screenshot in result:", result);
                  alert("Screenshot failed: " + (result.output || "Unknown error"));
                }
              } catch (e) {
                console.error("Parse error:", e);
                alert("Failed to parse screenshot result: " + cmd.result);
              }
            } else {
              console.error("No result in command:", cmd);
              alert("Command completed but no result returned");
            }
          }
        }, 2000);
        
        // Timeout after 30 seconds
        setTimeout(() => {
          clearInterval(pollInterval);
          setScreenshotLoading(false);
        }, 30000);
      }
    } catch (err) {
      console.error("Failed to capture screenshot:", err);
      setScreenshotLoading(false);
      alert("ບໍ່ສາມາດຖ່າຍຮູບໜ້າຈໍໄດ້");
    }
  };

  useEffect(() => {
    fetchComputer();
    const interval = setInterval(fetchComputer, 15000);
    return () => clearInterval(interval);
  }, [params.id]);

  useEffect(() => {
    if (tab === "actions") {
      fetchCommands();
      const interval = setInterval(fetchCommands, 5000);
      return () => clearInterval(interval);
    }
  }, [tab, params.id]);

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
          <div className="flex items-center gap-3 mt-2">
            {editingLabel ? (
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={labelValue}
                  onChange={(e) => setLabelValue(e.target.value)}
                  placeholder="Add label/note..."
                  className="px-3 py-1 text-sm bg-background border border-border rounded"
                  autoFocus
                />
                <button onClick={saveLabel} className="px-3 py-1 text-xs bg-accent text-white rounded hover:bg-accent/90">Save</button>
                <button onClick={() => setEditingLabel(false)} className="px-3 py-1 text-xs bg-card border border-border rounded hover:bg-border/50">Cancel</button>
              </div>
            ) : (
              <button
                onClick={() => {
                  setLabelValue(computer.label || "");
                  setEditingLabel(true);
                }}
                className="text-sm text-muted hover:text-foreground"
              >
                {computer.label ? `📝 ${computer.label}` : "+ Add label"}
              </button>
            )}
            {editingTags ? (
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={tagsValue}
                  onChange={(e) => setTagsValue(e.target.value)}
                  placeholder="Tags (comma separated)..."
                  className="px-3 py-1 text-sm bg-background border border-border rounded"
                  autoFocus
                />
                <button onClick={saveTags} className="px-3 py-1 text-xs bg-accent text-white rounded hover:bg-accent/90">Save</button>
                <button onClick={() => setEditingTags(false)} className="px-3 py-1 text-xs bg-card border border-border rounded hover:bg-border/50">Cancel</button>
              </div>
            ) : (
              <button
                onClick={() => {
                  setTagsValue(computer.tags || "");
                  setEditingTags(true);
                }}
                className="text-sm text-muted hover:text-foreground"
              >
                {computer.tags ? `🏷️ ${computer.tags}` : "+ Add tags"}
              </button>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={captureScreenshot}
            disabled={screenshotLoading}
            className="flex items-center gap-2 px-4 py-2 bg-blue-500/20 text-blue-400 border border-blue-500/30 rounded-lg text-sm font-medium hover:bg-blue-500/30 transition-colors disabled:opacity-50"
            title="ຖ່າຍຮູບໜ້າຈໍ"
          >
            {screenshotLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Camera className="w-4 h-4" />
            )}
            ຖ່າຍຮູບໜ້າຈໍ
          </button>
          <button
            onClick={() => {
              const rdpContent = `full address:s:${computer.ipAddress}\nprompt for credentials:i:1\nadministrative session:i:1`;
              const blob = new Blob([rdpContent], { type: 'application/x-rdp' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `${computer.hostname}.rdp`;
              document.body.appendChild(a);
              a.click();
              document.body.removeChild(a);
              URL.revokeObjectURL(url);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-accent text-white rounded-lg text-sm font-medium hover:bg-accent/90 transition-colors"
            title="Download RDP file to connect"
          >
            <Monitor className="w-4 h-4" />
            Connect RDP
          </button>
        </div>
      </div>

      {/* Screenshot Display */}
      {screenshot && (
        <div className="bg-card border border-border rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold">ຮູບໜ້າຈໍ (Screenshot)</h3>
            <button
              onClick={() => setScreenshot(null)}
              className="text-xs text-muted hover:text-foreground"
            >
              ປິດ
            </button>
          </div>
          <div className="bg-background rounded-lg overflow-hidden">
            <img
              src={`data:image/png;base64,${screenshot}`}
              alt="Screenshot"
              className="w-full h-auto"
            />
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 border-b border-border pb-0">
        {[
          { key: "overview", label: "Overview", icon: Monitor },
          { key: "processes", label: "Processes", icon: Cpu },
          { key: "events", label: "Event Logs", icon: AlertTriangle },
          { key: "software", label: "Software", icon: List },
          { key: "printers", label: "Printers", icon: Printer },
          { key: "licenses", label: "Licenses", icon: KeyRound },
          { key: "startup", label: "Startup", icon: Play },
          { key: "services", label: "Services", icon: Cog },
          { key: "system", label: "System", icon: Settings },
          { key: "actions", label: "Remote Actions", icon: Terminal },
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

      {tab === "printers" && (
        <div className="bg-card border border-border rounded-xl p-6">
          <h3 className="font-semibold mb-4">Installed Printers</h3>
          {report?.printers && report.printers.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-muted">
                    <th className="text-left py-3 px-4">Name</th>
                    <th className="text-left py-3 px-4">Status</th>
                    <th className="text-left py-3 px-4">Port</th>
                    <th className="text-left py-3 px-4">Type</th>
                  </tr>
                </thead>
                <tbody>
                  {report.printers.map((p, i) => (
                    <tr key={i} className="border-b border-border/50 hover:bg-border/20">
                      <td className="py-3 px-4">
                        <span className="font-medium">{p.name}</span>
                        {p.is_default && (
                          <span className="ml-2 text-xs bg-accent/10 text-accent px-1.5 py-0.5 rounded">Default</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`text-xs px-2 py-0.5 rounded ${p.status === "Ready" ? "bg-emerald-500/10 text-emerald-400" : "bg-amber-500/10 text-amber-400"}`}>
                          {p.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-mono text-muted text-xs">{p.port}</td>
                      <td className="py-3 px-4 text-xs text-muted">{p.is_network ? "Network" : "Local"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-muted text-center py-8">No printer data available</p>
          )}
        </div>
      )}

      {tab === "licenses" && (
        <div className="space-y-6">
          {/* Windows License */}
          <div className="bg-card border border-border rounded-xl p-6">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <KeyRound className="w-4 h-4" />
              Windows License
            </h3>
            {report?.windowsLicense ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-muted mb-1">Edition</p>
                  <p className="text-sm font-medium">{report.windowsLicense.edition || "N/A"}</p>
                </div>
                <div>
                  <p className="text-xs text-muted mb-1">Status</p>
                  <span className={`text-sm font-medium px-2 py-0.5 rounded ${report.windowsLicense.is_activated ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-400"}`}>
                    {report.windowsLicense.is_activated ? "Activated" : report.windowsLicense.status}
                  </span>
                </div>
                <div>
                  <p className="text-xs text-muted mb-1">Partial Key</p>
                  <p className="text-sm font-mono">{report.windowsLicense.partial_key || "N/A"}</p>
                </div>
                <div>
                  <p className="text-xs text-muted mb-1">License Type</p>
                  <p className="text-sm">{report.windowsLicense.license_type || "N/A"}</p>
                </div>
              </div>
            ) : (
              <p className="text-muted text-center py-4">No Windows license data</p>
            )}
          </div>

          {/* Office License */}
          <div className="bg-card border border-border rounded-xl p-6">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <KeyRound className="w-4 h-4" />
              Microsoft Office
            </h3>
            {report?.officeLicense?.installed ? (
              <div>
                <p className="text-sm mb-3">Version: <span className="font-medium">{report.officeLicense.version}</span></p>
                {report.officeLicense.products.length > 0 ? (
                  <div className="space-y-2">
                    {report.officeLicense.products.map((p, i) => (
                      <div key={i} className="flex items-center justify-between p-3 rounded-lg border border-border">
                        <div>
                          <p className="text-sm font-medium">{p.name}</p>
                          {p.partial_key && <p className="text-xs text-muted font-mono mt-0.5">Key: {p.partial_key}</p>}
                        </div>
                        <span className={`text-xs px-2 py-0.5 rounded ${p.is_activated ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-400"}`}>
                          {p.is_activated ? "Activated" : p.status}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted text-sm">No product details available</p>
                )}
              </div>
            ) : (
              <p className="text-muted text-center py-4">Microsoft Office not installed</p>
            )}
          </div>
        </div>
      )}

      {tab === "startup" && (
        <div className="bg-card border border-border rounded-xl p-6">
          <h3 className="font-semibold mb-4">Startup Programs</h3>
          {report?.startupPrograms && report.startupPrograms.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-muted">
                    <th className="text-left py-3 px-4">Name</th>
                    <th className="text-left py-3 px-4">Command</th>
                    <th className="text-left py-3 px-4">Location</th>
                  </tr>
                </thead>
                <tbody>
                  {report.startupPrograms.map((p, i) => (
                    <tr key={i} className="border-b border-border/50 hover:bg-border/20">
                      <td className="py-3 px-4 font-medium">{p.name}</td>
                      <td className="py-3 px-4 font-mono text-xs text-muted max-w-xs truncate">{p.command}</td>
                      <td className="py-3 px-4 text-xs text-muted">{p.location}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-muted text-center py-8">No startup program data available</p>
          )}
        </div>
      )}

      {tab === "system" && (
        <div className="space-y-6">
          {/* Shared Folders */}
          <div className="bg-card border border-border rounded-xl p-6">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <FolderOpen className="w-4 h-4" />
              Shared Folders
            </h3>
            {report?.sharedFolders && report.sharedFolders.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border text-muted">
                      <th className="text-left py-3 px-4">Name</th>
                      <th className="text-left py-3 px-4">Path</th>
                      <th className="text-left py-3 px-4">Type</th>
                    </tr>
                  </thead>
                  <tbody>
                    {report.sharedFolders.map((f, i) => (
                      <tr key={i} className="border-b border-border/50 hover:bg-border/20">
                        <td className="py-3 px-4 font-medium">{f.name}</td>
                        <td className="py-3 px-4 font-mono text-xs text-muted">{f.path}</td>
                        <td className="py-3 px-4 text-xs">{f.is_hidden ? "Hidden" : "Visible"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-muted text-center py-4">No shared folders</p>
            )}
          </div>

          {/* USB Devices */}
          <div className="bg-card border border-border rounded-xl p-6">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <Usb className="w-4 h-4" />
              USB Devices
            </h3>
            {report?.usbDevices && report.usbDevices.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border text-muted">
                      <th className="text-left py-3 px-4">Device</th>
                      <th className="text-left py-3 px-4">Manufacturer</th>
                      <th className="text-left py-3 px-4">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {report.usbDevices.map((d, i) => (
                      <tr key={i} className="border-b border-border/50 hover:bg-border/20">
                        <td className="py-3 px-4">{d.name}</td>
                        <td className="py-3 px-4 text-muted">{d.manufacturer || "N/A"}</td>
                        <td className="py-3 px-4">
                          <span className={`text-xs px-2 py-0.5 rounded ${d.status === "OK" ? "bg-emerald-500/10 text-emerald-400" : "bg-amber-500/10 text-amber-400"}`}>
                            {d.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-muted text-center py-4">No USB devices detected</p>
            )}
          </div>

          {/* Windows Update */}
          <div className="bg-card border border-border rounded-xl p-6">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <Download className="w-4 h-4" />
              Windows Update
              {report?.windowsUpdate?.pending_count ? (
                <span className="text-xs bg-amber-500/10 text-amber-400 px-2 py-0.5 rounded">
                  {report.windowsUpdate.pending_count} pending
                </span>
              ) : null}
            </h3>
            {report?.windowsUpdate?.recent_updates && report.windowsUpdate.recent_updates.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border text-muted">
                      <th className="text-left py-3 px-4">Update ID</th>
                      <th className="text-left py-3 px-4">Description</th>
                      <th className="text-left py-3 px-4">Installed</th>
                    </tr>
                  </thead>
                  <tbody>
                    {report.windowsUpdate.recent_updates.map((u, i) => (
                      <tr key={i} className="border-b border-border/50 hover:bg-border/20">
                        <td className="py-3 px-4 font-mono text-xs">{u.id}</td>
                        <td className="py-3 px-4">{u.description}</td>
                        <td className="py-3 px-4 text-xs text-muted">{u.installed_on}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-muted text-center py-4">No update data available</p>
            )}
          </div>
        </div>
      )}

      {/* Services Tab */}
      {tab === "services" && (
        <div className="space-y-6">
          <div className="bg-card border border-border rounded-xl p-6">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <Cog className="w-4 h-4" />
              Windows Services
            </h3>
            {report?.services && Array.isArray(report.services) && report.services.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border text-muted">
                      <th className="text-left py-3 px-4">Service Name</th>
                      <th className="text-left py-3 px-4">Display Name</th>
                      <th className="text-left py-3 px-4">Status</th>
                      <th className="text-left py-3 px-4">Startup Type</th>
                      <th className="text-left py-3 px-4">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {report.services.map((svc: any, i: number) => (
                      <tr key={i} className="border-b border-border/50 hover:bg-border/20">
                        <td className="py-3 px-4 font-mono text-xs">{svc.name}</td>
                        <td className="py-3 px-4">{svc.displayName}</td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            svc.status === "Running" 
                              ? "bg-emerald-500/20 text-emerald-400" 
                              : "bg-red-500/20 text-red-400"
                          }`}>
                            {svc.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-sm text-muted">{svc.startType}</td>
                        <td className="py-3 px-4">
                          <div className="flex gap-2">
                            {svc.status === "Running" ? (
                              <>
                                <button
                                  onClick={() => sendCommand("service_stop", { service_name: svc.name })}
                                  disabled={actionLoading !== null}
                                  className="px-3 py-1 text-xs bg-red-500/20 text-red-400 border border-red-500/30 rounded hover:bg-red-500/30 transition-colors disabled:opacity-50"
                                >
                                  Stop
                                </button>
                                <button
                                  onClick={() => sendCommand("service_restart", { service_name: svc.name })}
                                  disabled={actionLoading !== null}
                                  className="px-3 py-1 text-xs bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded hover:bg-amber-500/30 transition-colors disabled:opacity-50"
                                >
                                  Restart
                                </button>
                              </>
                            ) : (
                              <button
                                onClick={() => sendCommand("service_start", { service_name: svc.name })}
                                disabled={actionLoading !== null}
                                className="px-3 py-1 text-xs bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded hover:bg-emerald-500/30 transition-colors disabled:opacity-50"
                              >
                                Start
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-muted text-center py-4">No services data available</p>
            )}
          </div>
        </div>
      )}

      {/* Remote Actions Tab */}
      {tab === "actions" && (
        <div className="space-y-6">
          {/* Quick Actions */}
          <div className="bg-card border border-border rounded-xl p-6">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <Terminal className="w-4 h-4" />
              Quick Actions
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { action: "restart", label: "Restart PC", icon: RefreshCw, color: "text-amber-400 border-amber-500/30 hover:bg-amber-500/10" },
                { action: "shutdown", label: "Shutdown", icon: Power, color: "text-red-400 border-red-500/30 hover:bg-red-500/10" },
                { action: "lock", label: "Lock Screen", icon: Lock, color: "text-blue-400 border-blue-500/30 hover:bg-blue-500/10" },
                { action: "logoff", label: "Log Off", icon: Power, color: "text-purple-400 border-purple-500/30 hover:bg-purple-500/10" },
                { action: "clear_temp", label: "Clear Temp", icon: Trash2, color: "text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/10" },
                { action: "flush_dns", label: "Flush DNS", icon: RefreshCw, color: "text-cyan-400 border-cyan-500/30 hover:bg-cyan-500/10" },
                { action: "gpupdate", label: "GP Update", icon: RefreshCw, color: "text-orange-400 border-orange-500/30 hover:bg-orange-500/10" },
                { action: "ipconfig", label: "IP Config", icon: Wifi, color: "text-teal-400 border-teal-500/30 hover:bg-teal-500/10" },
              ].map((a) => (
                <button
                  key={a.action}
                  onClick={() => {
                    if (a.action === "restart" || a.action === "shutdown") {
                      if (!confirm(`Are you sure you want to ${a.label} this computer?`)) return;
                    }
                    sendCommand(a.action);
                  }}
                  disabled={actionLoading !== null}
                  className={`flex items-center gap-2 p-3 rounded-lg border transition-colors ${a.color} ${actionLoading === a.action ? "opacity-50" : ""}`}
                >
                  {actionLoading === a.action ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <a.icon className="w-4 h-4" />
                  )}
                  <span className="text-sm font-medium">{a.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Network Diagnostics */}
          <div className="bg-card border border-border rounded-xl p-6">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <Wifi className="w-4 h-4" />
              Network Diagnostics
            </h3>
            <div className="flex gap-3 items-end">
              <div className="flex-1">
                <label className="text-xs text-muted mb-1 block">Host / IP</label>
                <input
                  type="text"
                  value={pingHost}
                  onChange={(e) => setPingHost(e.target.value)}
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm"
                  placeholder="8.8.8.8"
                />
              </div>
              <button
                onClick={() => sendCommand("ping", { host: pingHost })}
                disabled={actionLoading !== null}
                className="px-4 py-2 bg-accent/20 text-accent border border-accent/30 rounded-lg text-sm hover:bg-accent/30 transition-colors"
              >
                Ping
              </button>
              <button
                onClick={() => sendCommand("traceroute", { host: pingHost })}
                disabled={actionLoading !== null}
                className="px-4 py-2 bg-accent/20 text-accent border border-accent/30 rounded-lg text-sm hover:bg-accent/30 transition-colors"
              >
                Traceroute
              </button>
            </div>
          </div>

          {/* Kill Process */}
          <div className="bg-card border border-border rounded-xl p-6">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <Cpu className="w-4 h-4" />
              Kill Process
            </h3>
            <div className="flex gap-3 items-end">
              <div className="flex-1">
                <label className="text-xs text-muted mb-1 block">Process name (e.g. notepad.exe) or PID</label>
                <input
                  type="text"
                  value={killTarget}
                  onChange={(e) => setKillTarget(e.target.value)}
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm"
                  placeholder="process.exe or PID"
                />
              </div>
              <button
                onClick={() => {
                  if (!killTarget.trim()) return;
                  const isNum = /^\d+$/.test(killTarget.trim());
                  sendCommand("kill_process", isNum ? { pid: parseInt(killTarget) } : { name: killTarget.trim() });
                  setKillTarget("");
                }}
                disabled={actionLoading !== null || !killTarget.trim()}
                className="px-4 py-2 bg-red-500/20 text-red-400 border border-red-500/30 rounded-lg text-sm hover:bg-red-500/30 transition-colors"
              >
                Kill
              </button>
            </div>
          </div>

          {/* Send Message to Agent */}
          <div className="bg-card border border-border rounded-xl p-6">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <Terminal className="w-4 h-4" />
              ສົ່ງຂໍ້ຄວາມຫາ Agent
            </h3>
            <textarea
              value={serverMessage}
              onChange={(e) => setServerMessage(e.target.value)}
              className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm h-24 resize-y"
              placeholder="ພິມຂໍ້ຄວາມທີ່ຕ້ອງການສົ່ງຫາຜູ້ໃຊ້ເຄື່ອງນີ້... (ຮອງຮັບພາສາລາວ)"
            />
            <div className="flex justify-end mt-3">
              <button
                onClick={sendServerMessage}
                disabled={!serverMessage.trim()}
                className="px-4 py-2 bg-blue-500/20 text-blue-400 border border-blue-500/30 rounded-lg text-sm hover:bg-blue-500/30 transition-colors disabled:opacity-50"
              >
                ສົ່ງຂໍ້ຄວາມ
              </button>
            </div>
          </div>

          {/* Run PowerShell */}
          <div className="bg-card border border-border rounded-xl p-6">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <Terminal className="w-4 h-4" />
              Run PowerShell Script
            </h3>
            <textarea
              value={customScript}
              onChange={(e) => setCustomScript(e.target.value)}
              className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm font-mono h-24 resize-y"
              placeholder="Get-Process | Sort-Object CPU -Descending | Select -First 10"
            />
            <div className="flex justify-end mt-3">
              <button
                onClick={() => {
                  if (!customScript.trim()) return;
                  sendCommand("run_powershell", { script: customScript.trim() });
                }}
                disabled={actionLoading !== null || !customScript.trim()}
                className="px-4 py-2 bg-accent/20 text-accent border border-accent/30 rounded-lg text-sm hover:bg-accent/30 transition-colors"
              >
                Execute
              </button>
            </div>
          </div>

          {/* Command History */}
          <div className="bg-card border border-border rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Command History
              </h3>
              <button
                onClick={fetchCommands}
                className="text-xs text-muted hover:text-foreground transition-colors"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            </div>
            {commands.length === 0 ? (
              <p className="text-muted text-center py-4 text-sm">No commands sent yet</p>
            ) : (
              <div className="space-y-3 max-h-[500px] overflow-y-auto">
                {commands.map((cmd) => (
                  <div
                    key={cmd.id}
                    className={`p-3 rounded-lg border ${
                      cmd.status === "completed"
                        ? "border-emerald-500/20 bg-emerald-500/5"
                        : cmd.status === "failed"
                        ? "border-red-500/20 bg-red-500/5"
                        : cmd.status === "executing"
                        ? "border-amber-500/20 bg-amber-500/5"
                        : "border-border bg-background"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">{cmd.action}</span>
                        <span className={`text-xs px-2 py-0.5 rounded ${
                          cmd.status === "completed"
                            ? "bg-emerald-500/10 text-emerald-400"
                            : cmd.status === "failed"
                            ? "bg-red-500/10 text-red-400"
                            : cmd.status === "executing"
                            ? "bg-amber-500/10 text-amber-400"
                            : "bg-blue-500/10 text-blue-400"
                        }`}>
                          {cmd.status}
                        </span>
                      </div>
                      <span className="text-xs text-muted">
                        {new Date(cmd.createdAt).toLocaleString()}
                      </span>
                    </div>
                    {cmd.params && (
                      <p className="text-xs text-muted mt-1 font-mono truncate">
                        Params: {cmd.params}
                      </p>
                    )}
                    {cmd.result && (
                      <pre className="text-xs text-muted mt-2 p-2 bg-background rounded border border-border overflow-x-auto max-h-40 whitespace-pre-wrap">
                        {cmd.result}
                      </pre>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

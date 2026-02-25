"use client";

import { useState, useEffect } from "react";
import {
  Terminal,
  Power,
  Lock,
  Trash2,
  RefreshCw,
  Wifi,
  Cpu,
  Clock,
  Loader2,
} from "lucide-react";
import { ComputerDetail, CommandItem } from "./types";

interface ActionsTabProps {
  computer: ComputerDetail;
}

export function ActionsTab({ computer }: ActionsTabProps) {
  const [commands, setCommands] = useState<CommandItem[]>([]);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [customScript, setCustomScript] = useState("");
  const [pingHost, setPingHost] = useState("8.8.8.8");
  const [killTarget, setKillTarget] = useState("");
  const [serverMessage, setServerMessage] = useState("");

  const fetchCommands = async () => {
    try {
      const res = await fetch(`/api/commands?computerId=${computer.id}`);
      if (res.ok) {
        const json = await res.json();
        setCommands(json);
      }
    } catch (err) {
      console.error("Failed to fetch commands:", err);
    }
  };

  const sendCommand = async (action: string, cmdParams?: Record<string, unknown>) => {
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

  const sendServerMessage = async () => {
    if (!serverMessage.trim()) return;
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

  useEffect(() => {
    fetchCommands();
    const interval = setInterval(fetchCommands, 5000);
    return () => clearInterval(interval);
  }, [computer.id]);

  return (
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
  );
}

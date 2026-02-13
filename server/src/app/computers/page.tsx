"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Monitor, Search, RefreshCw } from "lucide-react";
import { StatusBadge } from "@/components/status-badge";
import { UsageBar } from "@/components/usage-bar";

interface ComputerItem {
  id: string;
  hostname: string;
  ipAddress: string;
  osVersion: string | null;
  department: string | null;
  status: "online" | "offline" | "warning";
  lastSeenAt: string;
  lastReport: {
    cpuUsage: number;
    ramUsage: number;
    diskUsage: number;
    uptime: number | null;
  } | null;
  unresolvedAlerts: number;
}

export default function ComputersPage() {
  const [computers, setComputers] = useState<ComputerItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");

  const fetchComputers = async () => {
    try {
      const res = await fetch("/api/computers");
      const json = await res.json();
      setComputers(json);
    } catch (err) {
      console.error("Failed to fetch computers:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComputers();
    const interval = setInterval(fetchComputers, 10000);
    return () => clearInterval(interval);
  }, []);

  const filtered = computers.filter((c) => {
    const matchSearch =
      c.hostname.toLowerCase().includes(search.toLowerCase()) ||
      c.ipAddress.includes(search) ||
      (c.department || "").toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === "all" || c.status === filterStatus;
    return matchSearch && matchStatus;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin w-8 h-8 border-2 border-accent border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Computers</h1>
          <p className="text-muted text-sm mt-1">{computers.length} computers registered</p>
        </div>
        <button
          onClick={fetchComputers}
          className="flex items-center gap-2 px-4 py-2 bg-card border border-border rounded-lg hover:bg-border/50 transition-colors text-sm"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
          <input
            type="text"
            placeholder="Search by hostname, IP, or department..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-card border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent/50 text-foreground placeholder:text-muted"
          />
        </div>
        <div className="flex gap-2">
          {["all", "online", "warning", "offline"].map((status) => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={`px-4 py-2 rounded-lg text-sm font-medium capitalize transition-colors ${
                filterStatus === status
                  ? "bg-accent text-white"
                  : "bg-card border border-border text-muted hover:text-foreground"
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-20">
          <Monitor className="w-16 h-16 text-muted mx-auto mb-4" />
          <h2 className="text-xl font-semibold">No computers found</h2>
          <p className="text-muted mt-2">
            {search ? "Try a different search term" : "Waiting for agents to connect..."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((computer) => (
            <Link
              key={computer.id}
              href={`/computers/${computer.id}`}
              className="bg-card border border-border rounded-xl p-5 hover:border-accent/40 transition-all group"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    computer.status === "online" ? "bg-emerald-500/10" :
                    computer.status === "warning" ? "bg-amber-500/10" : "bg-red-500/10"
                  }`}>
                    <Monitor className={`w-5 h-5 ${
                      computer.status === "online" ? "text-emerald-400" :
                      computer.status === "warning" ? "text-amber-400" : "text-red-400"
                    }`} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm group-hover:text-accent transition-colors">
                      {computer.hostname}
                    </h3>
                    <p className="text-xs text-muted">{computer.ipAddress}</p>
                  </div>
                </div>
                <StatusBadge status={computer.status} />
              </div>

              {computer.lastReport ? (
                <div className="space-y-3">
                  <UsageBar label="CPU" value={computer.lastReport.cpuUsage} />
                  <UsageBar label="RAM" value={computer.lastReport.ramUsage} />
                  <UsageBar label="Disk" value={computer.lastReport.diskUsage} />
                </div>
              ) : (
                <p className="text-xs text-muted text-center py-4">No data yet</p>
              )}

              <div className="flex items-center justify-between mt-4 pt-3 border-t border-border">
                <span className="text-xs text-muted">
                  {computer.department || "General"}
                </span>
                {computer.unresolvedAlerts > 0 && (
                  <span className="text-xs bg-red-500/15 text-red-400 px-2 py-0.5 rounded-full">
                    {computer.unresolvedAlerts} alerts
                  </span>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

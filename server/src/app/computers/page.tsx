"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { Monitor, Search, RefreshCw, Download, ChevronLeft, ChevronRight } from "lucide-react";
import { StatusBadge } from "@/components/status-badge";
import { UsageBar } from "@/components/usage-bar";
import { useSocket } from "@/hooks/use-socket";

interface ComputerItem {
  id: string;
  hostname: string;
  ipAddress: string;
  osVersion: string | null;
  department: string | null;
  group: string | null;
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
  const [filterDepartment, setFilterDepartment] = useState<string>("all");
  const [filterGroup, setFilterGroup] = useState<string>("all");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const { on, emit } = useSocket();

  const fetchComputers = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      params.set("page", String(page));
      params.set("limit", "30");
      if (search) params.set("search", search);
      if (filterDepartment !== "all") params.set("department", filterDepartment);
      if (filterGroup !== "all") params.set("group", filterGroup);
      const res = await fetch(`/api/computers?${params}`);
      const json = await res.json();
      setComputers(json.data);
      setTotal(json.total);
      setTotalPages(json.totalPages);
    } catch (err) {
      console.error("Failed to fetch computers:", err);
    } finally {
      setLoading(false);
    }
  }, [page, search, filterDepartment, filterGroup]);

  useEffect(() => {
    fetchComputers();
    const interval = setInterval(fetchComputers, 30000);

    emit("join:dashboard");
    const off = on("computer:updated", () => fetchComputers());

    return () => {
      clearInterval(interval);
      off();
    };
  }, [fetchComputers]);

  // Reset to page 1 when filters change
  useEffect(() => { setPage(1); }, [search, filterDepartment, filterGroup]);

  // Client-side status filter (status is computed server-side, not filterable via query)
  const filtered = filterStatus === "all"
    ? computers
    : computers.filter((c) => c.status === filterStatus);

  const departments = Array.from(new Set(computers.map(c => c.department || "General")));
  const groups = Array.from(new Set(computers.map(c => c.group || "General")));

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
          <p className="text-muted text-sm mt-1">{total} computers registered</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => window.open(`/api/computers/export?status=${filterStatus}`, "_blank")}
            className="flex items-center gap-2 px-4 py-2 bg-card border border-border rounded-lg hover:bg-border/50 transition-colors text-sm"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </button>
          <button
            onClick={fetchComputers}
            className="flex items-center gap-2 px-4 py-2 bg-card border border-border rounded-lg hover:bg-border/50 transition-colors text-sm"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
        </div>
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
        <select
          value={filterDepartment}
          onChange={(e) => setFilterDepartment(e.target.value)}
          className="px-4 py-2.5 bg-card border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent/50 text-foreground"
        >
          <option value="all">All Departments</option>
          {departments.map((dept) => (
            <option key={dept} value={dept}>{dept}</option>
          ))}
        </select>
        <select
          value={filterGroup}
          onChange={(e) => setFilterGroup(e.target.value)}
          className="px-4 py-2.5 bg-card border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent/50 text-foreground"
        >
          <option value="all">All Groups</option>
          {groups.map((group) => (
            <option key={group} value={group}>{group}</option>
          ))}
        </select>
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

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-2">
          <p className="text-sm text-muted">
            Page {page} of {totalPages} ({total} total)
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="flex items-center gap-1 px-3 py-2 bg-card border border-border rounded-lg text-sm hover:bg-border/50 transition-colors disabled:opacity-40"
            >
              <ChevronLeft className="w-4 h-4" />
              Previous
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="flex items-center gap-1 px-3 py-2 bg-card border border-border rounded-lg text-sm hover:bg-border/50 transition-colors disabled:opacity-40"
            >
              Next
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

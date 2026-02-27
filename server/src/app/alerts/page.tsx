"use client";

import { useEffect, useState } from "react";
import {
    AlertTriangle,
    CheckCircle,
    RefreshCw,
    Download,
    ChevronLeft,
    ChevronRight,
    Loader2,
} from "lucide-react";
import { useSocket } from "@/hooks/use-socket";
import { useQuery, useQueryClient } from "@tanstack/react-query";

interface AlertItem {
    id: string;
    type: string;
    severity: string;
    message: string;
    resolved: boolean;
    resolvedAt: string | null;
    createdAt: string;
    computer: {
        hostname: string;
        ipAddress: string;
        department: string | null;
    };
}

export default function AlertsPage() {
    const [filter, setFilter] = useState<"all" | "active" | "resolved">(
        "active",
    );
    const [selectedAlerts, setSelectedAlerts] = useState<Set<string>>(
        new Set(),
    );
    const [page, setPage] = useState(1);
    const { on, emit } = useSocket();
    const queryClient = useQueryClient();

    const { data, isLoading, isFetching, refetch } = useQuery({
        queryKey: ["alerts", { page, filter }],
        queryFn: async () => {
            const params = new URLSearchParams();
            params.set("page", String(page));
            params.set("limit", "30");
            if (filter !== "all")
                params.set("resolved", filter === "active" ? "false" : "true");
            const res = await fetch(`/api/alerts?${params}`);
            if (!res.ok) throw new Error("Failed to fetch");
            return res.json();
        },
        staleTime: 30000,
    });

    useEffect(() => {
        emit("join:dashboard");
        const off = on("alert:new", () => {
            queryClient.invalidateQueries({ queryKey: ["alerts"] });
        });

        return () => {
            off();
        };
    }, [emit, on, queryClient]);

    // Reset to page 1 when filter changes
    useEffect(() => {
        setPage(1);
    }, [filter]);

    const alerts: AlertItem[] = data?.data || [];
    const total = data?.total || 0;
    const totalPages = data?.totalPages || 1;

    const resolveAlert = async (id: string) => {
        try {
            await fetch(`/api/alerts/${id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ resolved: true }),
            });
            queryClient.invalidateQueries({ queryKey: ["alerts"] });
        } catch (err) {
            console.error("Failed to resolve alert:", err);
        }
    };

    const resolveSelected = async () => {
        if (selectedAlerts.size === 0) return;
        try {
            await Promise.all(
                Array.from(selectedAlerts).map((id) =>
                    fetch(`/api/alerts/${id}`, {
                        method: "PATCH",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ resolved: true }),
                    }),
                ),
            );
            setSelectedAlerts(new Set());
            queryClient.invalidateQueries({ queryKey: ["alerts"] });
        } catch (err) {
            console.error("Failed to resolve selected alerts:", err);
        }
    };

    const clearAlerts = async () => {
        const scope =
            filter === "all"
                ? "all"
                : filter === "active"
                  ? "active"
                  : "resolved";
        const confirmText =
            scope === "all"
                ? "ລ້າງການແຈ້ງເຕືອນທັງໝົດ?"
                : scope === "active"
                  ? "ລ້າງການແຈ້ງເຕືອນທີ່ກຳລັງເກີດຂຶ້ນທັງໝົດ?"
                  : "ລ້າງການແຈ້ງເຕືອນທີ່ແກ້ໄຂແລ້ວທັງໝົດ?";

        if (!confirm(confirmText)) return;

        try {
            await fetch(`/api/alerts?scope=${scope}`, { method: "DELETE" });
            setSelectedAlerts(new Set());
            queryClient.invalidateQueries({ queryKey: ["alerts"] });
        } catch (err) {
            console.error("Failed to clear alerts:", err);
        }
    };
    const toggleAlert = (id: string) => {
        const newSelected = new Set(selectedAlerts);
        if (newSelected.has(id)) {
            newSelected.delete(id);
        } else {
            newSelected.add(id);
        }
        setSelectedAlerts(newSelected);
    };

    const toggleAll = () => {
        if (selectedAlerts.size === alerts.length) {
            setSelectedAlerts(new Set());
        } else {
            setSelectedAlerts(new Set(alerts.map((a) => a.id)));
        }
    };

    const filteredAlerts = alerts; // Already filtered by server

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-full">
                <Loader2 className="w-8 h-8 animate-spin text-accent" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">ການແຈ້ງເຕືອນ</h1>
                    <p className="text-muted text-sm mt-1">
                        ຕິດຕາມການແຈ້ງເຕືອນ ແລະ ຄຳເຕືອນຂອງລະບົບ
                    </p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={clearAlerts}
                        className="flex items-center gap-2 px-4 py-2 bg-red-500/10 text-red-400 border border-red-500/20 rounded-lg hover:bg-red-500/20 transition-colors text-sm"
                    >
                        ລ້າງຂໍ້ມູນ
                    </button>
                    <button
                        onClick={() => {
                            const param =
                                filter === "all"
                                    ? ""
                                    : filter === "active"
                                      ? "?resolved=false"
                                      : "?resolved=true";
                            window.open(`/api/alerts/export${param}`, "_blank");
                        }}
                        className="flex items-center gap-2 px-4 py-2 bg-card border border-border rounded-lg hover:bg-border/50 transition-colors text-sm"
                    >
                        <Download className="w-4 h-4" />
                        ສົ່ງອອກ CSV
                    </button>
                    <button
                        onClick={() => refetch()}
                        className="flex items-center gap-2 px-4 py-2 bg-card border border-border rounded-lg hover:bg-border/50 transition-colors text-sm disabled:opacity-50"
                        disabled={isFetching}
                    >
                        <RefreshCw
                            className={`w-4 h-4 ${isFetching ? "animate-spin" : ""}`}
                        />
                        ໂຫຼດໃໝ່
                    </button>
                </div>
            </div>

            <div className="flex items-center justify-between">
                <div className="flex gap-2">
                    {(["active", "resolved", "all"] as const).map((f) => (
                        <button
                            key={f}
                            onClick={() => setFilter(f)}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                                filter === f
                                    ? "bg-accent text-white"
                                    : "bg-card border border-border text-muted hover:text-foreground"
                            }`}
                        >
                            {f === "active"
                                ? "ກຳລັງເກີດຂຶ້ນ"
                                : f === "resolved"
                                  ? "ແກ້ໄຂແລ້ວ"
                                  : "ທັງໝົດ"}
                        </button>
                    ))}
                </div>
                {selectedAlerts.size > 0 && (
                    <div className="flex items-center gap-2">
                        <span className="text-sm text-muted">
                            ເລືອກແລ້ວ {selectedAlerts.size} ລາຍການ
                        </span>
                        <button
                            onClick={resolveSelected}
                            className="flex items-center gap-2 px-4 py-2 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-lg hover:bg-emerald-500/30 transition-colors text-sm font-medium"
                        >
                            <CheckCircle className="w-4 h-4" />
                            ແກ້ໄຂລາຍການທີ່ເລືອກ
                        </button>
                    </div>
                )}
            </div>

            {filteredAlerts.length === 0 ? (
                <div className="text-center py-20">
                    <CheckCircle className="w-16 h-16 text-emerald-400 mx-auto mb-4" />
                    <h2 className="text-xl font-semibold">ບໍ່ມີການແຈ້ງເຕືອນ</h2>
                    <p className="text-muted mt-2">
                        ລະບົບທັງໝົດເຮັດວຽກເປັນປົກກະຕິ
                    </p>
                </div>
            ) : (
                <div className="space-y-3">
                    <div className="flex items-center gap-2 px-4 py-2 bg-card border border-border rounded-lg">
                        <input
                            type="checkbox"
                            checked={
                                selectedAlerts.size === filteredAlerts.length &&
                                filteredAlerts.length > 0
                            }
                            onChange={toggleAll}
                            className="w-4 h-4 rounded border-border"
                        />
                        <span className="text-sm text-muted">ເລືອກທັງໝົດ</span>
                    </div>
                    {filteredAlerts.map((alert) => (
                        <div
                            key={alert.id}
                            className={`flex items-center justify-between p-4 rounded-xl border ${
                                alert.resolved
                                    ? "border-border bg-card opacity-60"
                                    : alert.severity === "critical"
                                      ? "border-red-500/30 bg-red-500/5"
                                      : "border-amber-500/30 bg-amber-500/5"
                            }`}
                        >
                            <div className="flex items-center gap-3">
                                <input
                                    type="checkbox"
                                    checked={selectedAlerts.has(alert.id)}
                                    onChange={() => toggleAlert(alert.id)}
                                    className="w-4 h-4 rounded border-border"
                                />
                                <AlertTriangle
                                    className={`w-5 h-5 shrink-0 ${
                                        alert.resolved
                                            ? "text-muted"
                                            : alert.severity === "critical"
                                              ? "text-red-400"
                                              : "text-amber-400"
                                    }`}
                                />
                                <div>
                                    <p className="font-medium text-sm">
                                        {alert.message}
                                    </p>
                                    <p className="text-xs text-muted mt-1">
                                        {alert.computer.hostname} (
                                        {alert.computer.ipAddress}) |{" "}
                                        {alert.computer.department || "ທົ່ວໄປ"}{" "}
                                        |{" "}
                                        {new Date(
                                            alert.createdAt,
                                        ).toLocaleString()}
                                    </p>
                                </div>
                            </div>
                            {!alert.resolved && (
                                <button
                                    onClick={() => resolveAlert(alert.id)}
                                    className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-lg text-xs font-medium hover:bg-emerald-500/20 transition-colors shrink-0 ml-4"
                                >
                                    <CheckCircle className="w-3.5 h-3.5" />
                                    ແກ້ໄຂແລ້ວ
                                </button>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex items-center justify-between pt-2">
                    <p className="text-sm text-muted">
                        ໜ້າ {page} ຈາກ {totalPages} (ທັງໝົດ {total} ລາຍການ)
                    </p>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setPage((p) => Math.max(1, p - 1))}
                            disabled={page <= 1}
                            className="flex items-center gap-1 px-3 py-2 bg-card border border-border rounded-lg text-sm hover:bg-border/50 transition-colors disabled:opacity-40"
                        >
                            <ChevronLeft className="w-4 h-4" />
                            ກ່ອນໜ້າ
                        </button>
                        <button
                            onClick={() =>
                                setPage((p) => Math.min(totalPages, p + 1))
                            }
                            disabled={page >= totalPages}
                            className="flex items-center gap-1 px-3 py-2 bg-card border border-border rounded-lg text-sm hover:bg-border/50 transition-colors disabled:opacity-40"
                        >
                            ຖັດໄປ
                            <ChevronRight className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

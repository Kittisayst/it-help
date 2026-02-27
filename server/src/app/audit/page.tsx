"use client";

import { useEffect, useState, useCallback } from "react";
import { Search, ChevronLeft, ChevronRight } from "lucide-react";

interface AuditLogItem {
    id: string;
    action: string;
    details: string | null;
    ipAddress: string | null;
    userAgent: string | null;
    createdAt: string;
    userId: string | null;
    computerId: string | null;
}

export default function AuditPage() {
    const [logs, setLogs] = useState<AuditLogItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [total, setTotal] = useState(0);
    const [totalPages, setTotalPages] = useState(1);
    const [search, setSearch] = useState("");
    const [actionFilter, setActionFilter] = useState("");

    const fetchLogs = useCallback(async () => {
        try {
            const params = new URLSearchParams();
            params.set("page", String(page));
            params.set("limit", "50");
            if (search) params.set("search", search);
            if (actionFilter) params.set("action", actionFilter);

            const res = await fetch(`/api/audit?${params}`);
            const json = await res.json();
            setLogs(json.data);
            setTotal(json.total);
            setTotalPages(json.totalPages);
        } catch (err) {
            console.error("Failed to fetch audit logs:", err);
        } finally {
            setLoading(false);
        }
    }, [page, search, actionFilter]);

    useEffect(() => {
        fetchLogs();
    }, [fetchLogs]);

    // Reset to page 1 when filters change
    useEffect(() => {
        setPage(1);
    }, [search, actionFilter]);

    const actions = Array.from(new Set(logs.map((l) => l.action)));

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
                    <h1 className="text-2xl font-bold">
                        ບັນທຶກເຫດການລະບົບ (Audit Log)
                    </h1>
                    <p className="text-muted text-sm mt-1">
                        ການດຳເນີນການຂອງຜູ້ດູແລ ແລະ ເຫດການລະບົບ
                    </p>
                </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
                    <input
                        type="text"
                        placeholder="ຄົ້ນຫາຕາມການດຳເນີນການ, ລາຍລະອຽດ ຫຼື IP..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 bg-card border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent/50 text-foreground placeholder:text-muted"
                    />
                </div>
                <select
                    value={actionFilter}
                    onChange={(e) => setActionFilter(e.target.value)}
                    className="px-4 py-2.5 bg-card border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent/50 text-foreground"
                >
                    <option value="">ການດຳເນີນການທັງໝົດ</option>
                    {actions.map((action) => (
                        <option key={action} value={action}>
                            {action}
                        </option>
                    ))}
                </select>
            </div>

            {logs.length === 0 ? (
                <div className="text-center py-20">
                    <p className="text-muted">ບໍ່ພົບຂໍ້ມູນບັນທຶກເຫດການລະບົບ</p>
                </div>
            ) : (
                <div className="space-y-2">
                    {logs.map((log) => (
                        <div
                            key={log.id}
                            className="bg-card border border-border rounded-lg p-4"
                        >
                            <div className="flex items-start justify-between">
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-2">
                                        <span className="px-2 py-1 bg-accent/10 text-accent text-xs font-medium rounded">
                                            {log.action}
                                        </span>
                                        {log.userId && (
                                            <span className="text-xs text-muted">
                                                ໂດຍລະຫັດຜູ້ໃຊ້: {log.userId}
                                            </span>
                                        )}
                                        {log.computerId && (
                                            <span className="text-xs text-muted">
                                                ໃນລະຫັດຄອມພິວເຕີ:{" "}
                                                {log.computerId}
                                            </span>
                                        )}
                                    </div>
                                    {log.details && (
                                        <p className="text-sm text-foreground mb-2">
                                            {log.details}
                                        </p>
                                    )}
                                    <div className="text-xs text-muted">
                                        <span>
                                            {new Date(
                                                log.createdAt,
                                            ).toLocaleString()}
                                        </span>
                                        {log.ipAddress && (
                                            <span className="ml-3">
                                                IP: {log.ipAddress}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
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

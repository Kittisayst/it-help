"use client";

import { useState } from "react";
import {
    History,
    Search,
    ChevronLeft,
    ChevronRight,
    Loader2,
    Calendar,
    User,
    Monitor,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";

interface AuditLogItem {
    id: string;
    action: string;
    details: string | null;
    createdAt: string;
    user?: {
        name: string | null;
        email: string | null;
    };
    computer?: {
        hostname: string;
    };
}

export default function AuditLogsPage() {
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState("");

    const { data, isLoading, isError } = useQuery({
        queryKey: ["audit-logs", { page, search }],
        queryFn: async () => {
            const params = new URLSearchParams();
            params.set("page", String(page));
            params.set("limit", "50");
            if (search) params.set("search", search);
            const res = await fetch(`/api/audit-logs?${params}`);
            if (!res.ok) throw new Error("Failed to fetch audit logs");
            return res.json();
        },
    });

    const logs: AuditLogItem[] = data?.data || [];
    const total = data?.total || 0;
    const totalPages = data?.totalPages || 1;

    if (isError) {
        return (
            <div className="flex flex-col items-center justify-center h-full py-20 text-center">
                <p className="text-red-400 font-medium">
                    ບໍ່ສາມາດໂຫຼດຂໍ້ມູນບັນທຶກການກວດສອບໄດ້
                </p>
                <button
                    onClick={() => window.location.reload()}
                    className="mt-4 px-4 py-2 bg-card border border-border rounded-lg text-sm hover:bg-border/50"
                >
                    ລອງໃໝ່
                </button>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-2">
                        <History className="w-6 h-6 text-accent" />
                        ບັນທຶກການກວດສອບ (Audit Logs)
                    </h1>
                    <p className="text-muted text-sm mt-1">
                        ຕິດຕາມການດຳເນີນການດ້ານບໍລິຫານ ແລະ ການປ່ຽນແປງຂອງລະບົບ
                    </p>
                </div>
            </div>

            <div className="bg-card border border-border rounded-xl overflow-hidden">
                <div className="p-4 border-b border-border bg-card/50">
                    <div className="relative max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
                        <input
                            type="text"
                            placeholder="ຄົ້ນຫາຕາມການດຳເນີນການ, ຜູ້ໃຊ້, ຫຼື ຊື່ເຄື່ອງ..."
                            value={search}
                            onChange={(e) => {
                                setSearch(e.target.value);
                                setPage(1);
                            }}
                            className="w-full pl-10 pr-4 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-accent"
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="bg-muted/50 border-b border-border text-muted">
                                <th className="text-left py-3 px-6 font-medium">
                                    ເວລາ
                                </th>
                                <th className="text-left py-3 px-6 font-medium">
                                    ຜູ້ໃຊ້
                                </th>
                                <th className="text-left py-3 px-6 font-medium">
                                    ການດຳເນີນການ
                                </th>
                                <th className="text-left py-3 px-6 font-medium">
                                    ອຸປະກອນ
                                </th>
                                <th className="text-left py-3 px-6 font-medium">
                                    ລາຍລະອຽດ
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {isLoading ? (
                                <tr>
                                    <td
                                        colSpan={5}
                                        className="py-20 text-center"
                                    >
                                        <Loader2 className="w-8 h-8 animate-spin text-accent mx-auto" />
                                    </td>
                                </tr>
                            ) : logs.length === 0 ? (
                                <tr>
                                    <td
                                        colSpan={5}
                                        className="py-20 text-center text-muted"
                                    >
                                        ບໍ່ພົບຂໍ້ມູນບັນທຶກທີ່ກົງກັບການຄົ້ນຫາຂອງທ່ານ
                                    </td>
                                </tr>
                            ) : (
                                logs.map((log) => (
                                    <tr
                                        key={log.id}
                                        className="border-b border-border/50 hover:bg-border/10 transition-colors"
                                    >
                                        <td className="py-4 px-6 whitespace-nowrap text-muted text-xs">
                                            <div className="flex items-center gap-2">
                                                <Calendar className="w-3.5 h-3.5" />
                                                {new Date(
                                                    log.createdAt,
                                                ).toLocaleString()}
                                            </div>
                                        </td>
                                        <td className="py-4 px-6 font-medium">
                                            <div className="flex items-center gap-2">
                                                <User className="w-3.5 h-3.5 text-muted" />
                                                {log.user?.name || "ລະບົບ"}
                                            </div>
                                        </td>
                                        <td className="py-4 px-6">
                                            <span className="px-2 py-0.5 bg-accent/10 text-accent rounded-full text-xs font-medium">
                                                {log.action}
                                            </span>
                                        </td>
                                        <td className="py-4 px-6">
                                            {log.computer ? (
                                                <div className="flex items-center gap-2 text-xs">
                                                    <Monitor className="w-3.5 h-3.5 text-muted" />
                                                    {log.computer.hostname}
                                                </div>
                                            ) : (
                                                <span className="text-muted text-xs">
                                                    -
                                                </span>
                                            )}
                                        </td>
                                        <td
                                            className="py-4 px-6 text-muted text-xs max-w-xs truncate"
                                            title={log.details || ""}
                                        >
                                            {log.details || "-"}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {totalPages > 1 && (
                    <div className="p-4 border-t border-border flex items-center justify-between">
                        <p className="text-xs text-muted">
                            ສະແດງ {(page - 1) * 50 + 1} ຫາ{" "}
                            {Math.min(page * 50, total)} ຈາກທັງໝົດ {total}{" "}
                            ລາຍການ
                        </p>
                        <div className="flex gap-2">
                            <button
                                onClick={() =>
                                    setPage((p) => Math.max(1, p - 1))
                                }
                                disabled={page <= 1}
                                className="p-2 border border-border rounded hover:bg-border/50 disabled:opacity-50 transition-colors"
                            >
                                <ChevronLeft className="w-4 h-4" />
                            </button>
                            <button
                                onClick={() =>
                                    setPage((p) => Math.min(totalPages, p + 1))
                                }
                                disabled={page >= totalPages}
                                className="p-2 border border-border rounded hover:bg-border/50 disabled:opacity-50 transition-colors"
                            >
                                <ChevronRight className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

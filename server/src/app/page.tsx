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
        const offAlert = on(
            "alert:new",
            (payload: { hostname: string; alerts: string[] }) => {
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
            },
        );

        return () => {
            clearInterval(interval);
            offUpdated();
            offAlert();
        };
    }, []);

    if (loading) {
        return (
            <div className="space-y-6 animate-pulse">
                <div className="h-8 w-64 bg-zinc-800 rounded mb-2" />
                <div className="h-4 w-96 bg-zinc-800 rounded mb-6" />

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {[1, 2, 3, 4].map((i) => (
                        <div
                            key={i}
                            className="h-28 bg-zinc-900 border border-zinc-800 rounded-xl"
                        />
                    ))}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    {[1, 2, 3].map((i) => (
                        <div
                            key={i}
                            className="h-24 bg-zinc-900 border border-zinc-800 rounded-xl"
                        />
                    ))}
                </div>

                <div className="bg-zinc-900 border border-zinc-800 rounded-xl h-64" />
            </div>
        );
    }

    if (!data) {
        return (
            <div className="text-center py-20">
                <Monitor className="w-16 h-16 text-muted mx-auto mb-4" />
                <h2 className="text-xl font-semibold">ບໍ່ມີຂໍ້ມູນ</h2>
                <p className="text-muted mt-2">
                    ກະລຸນາລໍຖ້າການເຊື່ອມຕໍ່ຈາກ Agent...
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold">ພາບລວມແຜງຄວບຄຸມ</h1>
                <p className="text-muted text-sm mt-1">
                    ການຕິດຕາມຄອມພິວເຕີທັງໝົດໃນເຄືອຂ່າຍແບບລຽບທາມ (Real-time)
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <MetricCard
                    title="ຄອມພິວເຕີທັງໝົດ"
                    value={data.totalComputers}
                    icon={Monitor}
                    color="text-accent"
                    subtitle={`${data.online} ອອນລາຍ`}
                />
                <MetricCard
                    title="ອອນລາຍ (Online)"
                    value={data.online}
                    icon={Wifi}
                    color="text-emerald-400"
                    subtitle={`${data.warning} ຄຳເຕືອນ`}
                />
                <MetricCard
                    title="ອັອຟລາຍ (Offline)"
                    value={data.offline}
                    icon={WifiOff}
                    color="text-red-400"
                />
                <MetricCard
                    title="ການແຈ້ງເຕືອນທີ່ຍັງບໍ່ທັນແກ້ໄຂ"
                    value={data.unresolvedAlerts}
                    icon={AlertTriangle}
                    color={
                        data.unresolvedAlerts > 0
                            ? "text-amber-400"
                            : "text-emerald-400"
                    }
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <MetricCard
                    title="ການໃຊ້ CPU ສະເລ່ຍ"
                    value={`${data.avgCpu.toFixed(1)}%`}
                    icon={Cpu}
                    color={
                        data.avgCpu > 80
                            ? "text-red-400"
                            : data.avgCpu > 60
                              ? "text-amber-400"
                              : "text-emerald-400"
                    }
                />
                <MetricCard
                    title="ການໃຊ້ RAM ສະເລ່ຍ"
                    value={`${data.avgRam.toFixed(1)}%`}
                    icon={MemoryStick}
                    color={
                        data.avgRam > 80
                            ? "text-red-400"
                            : data.avgRam > 60
                              ? "text-amber-400"
                              : "text-emerald-400"
                    }
                />
                <MetricCard
                    title="ການໃຊ້ Disk ສະເລ່ຍ"
                    value={`${data.avgDisk.toFixed(1)}%`}
                    icon={HardDrive}
                    color={
                        data.avgDisk > 80
                            ? "text-red-400"
                            : data.avgDisk > 60
                              ? "text-amber-400"
                              : "text-emerald-400"
                    }
                />
            </div>

            <div className="bg-card border border-border rounded-xl p-6">
                <h2 className="text-lg font-semibold mb-4">
                    ການແຈ້ງເຕືອນຫຼ້າສຸດ
                </h2>
                {data.recentAlerts.length === 0 ? (
                    <p className="text-muted text-sm py-4 text-center">
                        ບໍ່ມີການແຈ້ງເຕືອນໃນເວລານີ້
                    </p>
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
                                            alert.severity === "critical"
                                                ? "text-red-400"
                                                : "text-amber-400"
                                        }`}
                                    />
                                    <div>
                                        <p className="text-sm font-medium">
                                            {alert.message}
                                        </p>
                                        <p className="text-xs text-muted mt-0.5">
                                            {alert.computer.hostname} (
                                            {alert.computer.ipAddress})
                                        </p>
                                    </div>
                                </div>
                                <StatusBadge
                                    status={
                                        alert.severity === "critical"
                                            ? "offline"
                                            : "warning"
                                    }
                                />
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

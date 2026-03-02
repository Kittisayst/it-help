"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
    LayoutDashboard,
    Monitor,
    AlertTriangle,
    MessageSquare,
    Activity,
    AppWindow,
    FileText,
    LayoutGrid,
    Network,
    LogOut,
} from "lucide-react";
import { useSession, signOut } from "next-auth/react";
import { useEffect, useState } from "react";
import { useSocket } from "@/hooks/use-socket";

const navItems = [
    { href: "/", label: "ແຜງຄວບຄຸມ", icon: LayoutDashboard, badge: null },
    { href: "/computers", label: "ຄອມພິວເຕີ", icon: Monitor, badge: "computers" },
    { href: "/alerts", label: "ການແຈ້ງເຕືອນ", icon: AlertTriangle, badge: "alerts" },
    { href: "/messages", label: "ຂໍ້ຄວາມ", icon: MessageSquare, badge: "messages" },
    { href: "/programs", label: "ໂປຣແກຣມ", icon: AppWindow, badge: null },
    { href: "/network-devices", label: "ອຸປະກອນເຄືອຂ່າຍ", icon: Network, badge: "networkDevices" },
    { href: "/management", label: "ການຈັດການ", icon: LayoutGrid, badge: null },
    { href: "/audit-logs", label: "ປະຫວັດການເຄື່ອນໄຫວ", icon: FileText, badge: null },
];

interface Stats {
    computers: number;
    alerts: number;
    messages: number;
    networkDevices: number;
    unreadMessages: number;
    activeAlerts: number;
}

export function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
    const pathname = usePathname();
    const { data: session } = useSession();
    const { on } = useSocket();
    const [stats, setStats] = useState<Stats>({
        computers: 0,
        alerts: 0,
        messages: 0,
        networkDevices: 0,
        unreadMessages: 0,
        activeAlerts: 0,
    });

    const fetchStats = async () => {
        try {
            const res = await fetch("/api/stats");
            const data = await res.json();
            setStats(data);
        } catch (error) {
            console.error("Failed to fetch stats:", error);
        }
    };

    useEffect(() => {
        fetchStats();
        const interval = setInterval(fetchStats, 30000); // Refresh every 30 seconds

        // Real-time updates via socket.io
        const offAlert = on("alert:new", () => fetchStats());
        const offMessage = on("message:new", () => fetchStats());
        const offComputer = on("computer:updated", () => fetchStats());

        return () => {
            clearInterval(interval);
            offAlert();
            offMessage();
            offComputer();
        };
    }, [on]);

    const getBadgeCount = (badgeKey: string | null) => {
        if (!badgeKey) return null;
        
        switch (badgeKey) {
            case "computers":
                return stats.computers;
            case "alerts":
                return stats.activeAlerts; // Show active alerts (24h)
            case "messages":
                return stats.unreadMessages; // Show unread messages
            case "networkDevices":
                return stats.networkDevices;
            default:
                return null;
        }
    };

    return (
        <aside className="w-64 h-full bg-card border-r border-border flex flex-col shrink-0">
            <div className="p-6 border-b border-border">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-accent rounded-lg flex items-center justify-center">
                        <Activity className="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <h1 className="text-lg font-bold text-foreground">
                            IT Monitor
                        </h1>
                        <p className="text-xs text-muted">ເຄືອຂ່າຍວິທະຍາໄລ</p>
                    </div>
                </div>
            </div>

            <nav className="flex-1 p-4 space-y-1">
                {navItems.map((item) => {
                    const isActive =
                        pathname === item.href ||
                        (item.href !== "/" && pathname.startsWith(item.href));
                    const Icon = item.icon;

                    const badgeCount = getBadgeCount(item.badge);
                    const showBadge = badgeCount !== null && badgeCount > 0;

                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            onClick={onNavigate}
                            className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                                isActive
                                    ? "bg-accent text-accent-foreground"
                                    : "text-muted hover:text-foreground hover:bg-border/50"
                            }`}
                        >
                            <Icon className="w-5 h-5" />
                            <span className="flex-1">{item.label}</span>
                            {showBadge && (
                                <span
                                    className={`px-2 py-0.5 text-xs font-semibold rounded-full ${
                                        isActive
                                            ? "bg-white/20 text-white"
                                            : item.badge === "messages"
                                            ? "bg-blue-500 text-white"
                                            : item.badge === "alerts"
                                            ? "bg-red-500 text-white"
                                            : "bg-accent/20 text-accent"
                                    }`}
                                >
                                    {badgeCount > 99 ? "99+" : badgeCount}
                                </span>
                            )}
                        </Link>
                    );
                })}
            </nav>

            <div className="p-4 border-t border-border space-y-2">
                <div className="px-4 py-2 text-xs text-muted">
                    <p>{session?.user?.name || "IT Help Desk"}</p>
                    <p className="mt-1 font-mono">v1.0.0</p>
                </div>
                <button
                    onClick={() => signOut({ callbackUrl: "/login" })}
                    className="flex items-center gap-3 w-full px-4 py-2.5 rounded-lg text-sm font-medium text-muted hover:text-red-400 hover:bg-red-500/10 transition-colors"
                >
                    <LogOut className="w-4 h-4" />
                    ອອກຈາກລະບົບ
                </button>
            </div>
        </aside>
    );
}

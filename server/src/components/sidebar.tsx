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
    LogOut,
} from "lucide-react";
import { useSession, signOut } from "next-auth/react";

const navItems = [
    { href: "/", label: "ແຜງຄວບຄຸມ", icon: LayoutDashboard },
    { href: "/computers", label: "ຄອມພິວເຕີ", icon: Monitor },
    { href: "/alerts", label: "ການແຈ້ງເຕືອນ", icon: AlertTriangle },
    { href: "/messages", label: "ຂໍ້ຄວາມ", icon: MessageSquare },
    { href: "/programs", label: "ໂປຣແກຣມ", icon: AppWindow },
    { href: "/management", label: "ການຈັດການ", icon: LayoutGrid },
    { href: "/audit-logs", label: "ປະຫວັດການເຄື່ອນໄຫວ", icon: FileText },
];

export function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
    const pathname = usePathname();
    const { data: session } = useSession();

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
                            {item.label}
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

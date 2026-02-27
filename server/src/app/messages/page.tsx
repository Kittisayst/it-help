"use client";

import { useEffect, useState, useCallback } from "react";
import {
    MessageSquare,
    CheckCircle,
    RefreshCw,
    Trash2,
    Mail,
    MailOpen,
    Monitor,
    ChevronLeft,
    ChevronRight,
} from "lucide-react";
import { useSocket } from "@/hooks/use-socket";

interface MessageItem {
    id: string;
    hostname: string;
    department: string | null;
    ipAddress: string | null;
    message: string;
    read: boolean;
    readAt: string | null;
    createdAt: string;
    computer: {
        id: string;
        hostname: string;
        department: string | null;
    } | null;
}

export default function MessagesPage() {
    const [messages, setMessages] = useState<MessageItem[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<"all" | "unread" | "read">("all");
    const [page, setPage] = useState(1);
    const [total, setTotal] = useState(0);
    const [totalPages, setTotalPages] = useState(1);
    const { on, emit } = useSocket();

    const fetchMessages = useCallback(async () => {
        try {
            const params = new URLSearchParams();
            params.set("page", String(page));
            params.set("limit", "30");
            if (filter === "unread") params.set("unread", "true");
            const res = await fetch(`/api/messages?${params}`);
            const json = await res.json();
            let filtered = json.data || [];
            if (filter === "read") {
                filtered = filtered.filter((m: MessageItem) => m.read);
            }
            setMessages(filtered);
            setTotal(json.total);
            setTotalPages(json.totalPages);
            setUnreadCount(json.unreadCount || 0);
        } catch (err) {
            console.error("Failed to fetch messages:", err);
        } finally {
            setLoading(false);
        }
    }, [page, filter]);

    useEffect(() => {
        fetchMessages();
        const interval = setInterval(fetchMessages, 30000);

        emit("join:dashboard");
        const off = on("alert:new", () => fetchMessages());

        return () => {
            clearInterval(interval);
            off();
        };
    }, [fetchMessages]);

    // Reset to page 1 when filter changes
    useEffect(() => {
        setPage(1);
    }, [filter]);

    const markAsRead = async (id: string) => {
        try {
            await fetch(`/api/messages/${id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ read: true }),
            });
            fetchMessages();
        } catch (err) {
            console.error("Failed to mark message as read:", err);
        }
    };

    const markAllAsRead = async () => {
        try {
            const unread = messages.filter((m) => !m.read);
            await Promise.all(
                unread.map((m) =>
                    fetch(`/api/messages/${m.id}`, {
                        method: "PATCH",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ read: true }),
                    }),
                ),
            );
            fetchMessages();
        } catch (err) {
            console.error("Failed to mark all as read:", err);
        }
    };

    const deleteMessage = async (id: string) => {
        try {
            await fetch(`/api/messages/${id}`, { method: "DELETE" });
            fetchMessages();
        } catch (err) {
            console.error("Failed to delete message:", err);
        }
    };

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
                    <h1 className="text-2xl font-bold flex items-center gap-2">
                        <MessageSquare className="w-6 h-6" />
                        ຂໍ້ຄວາມ (Messages)
                        {unreadCount > 0 && (
                            <span className="bg-accent text-white text-xs font-bold px-2 py-0.5 rounded-full">
                                {unreadCount}
                            </span>
                        )}
                    </h1>
                    <p className="text-muted text-sm mt-1">
                        ຂໍ້ຄວາມຈາກເຄື່ອງຂອງພະນັກງານ
                    </p>
                </div>
                <div className="flex gap-2">
                    {unreadCount > 0 && (
                        <button
                            onClick={markAllAsRead}
                            className="flex items-center gap-2 px-4 py-2 bg-accent/10 text-accent border border-accent/20 rounded-lg hover:bg-accent/20 transition-colors text-sm"
                        >
                            <CheckCircle className="w-4 h-4" />
                            ໝາຍວ່າອ່ານທັງໝົດແລ້ວ
                        </button>
                    )}
                    <button
                        onClick={fetchMessages}
                        className="flex items-center gap-2 px-4 py-2 bg-card border border-border rounded-lg hover:bg-border/50 transition-colors text-sm"
                    >
                        <RefreshCw className="w-4 h-4" />
                        ໂຫຼດໃໝ່
                    </button>
                </div>
            </div>

            <div className="flex gap-2">
                {(["all", "unread", "read"] as const).map((f) => (
                    <button
                        key={f}
                        onClick={() => setFilter(f)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                            filter === f
                                ? "bg-accent text-white"
                                : "bg-card border border-border text-muted hover:text-foreground"
                        }`}
                    >
                        {f === "all"
                            ? "ທັງໝົດ"
                            : f === "unread"
                              ? "ທີ່ຍັງບໍ່ທັນອ່ານ"
                              : "ອ່ານແລ້ວ"}
                        {f === "unread" && unreadCount > 0 && (
                            <span className="ml-1.5 bg-white/20 px-1.5 py-0.5 rounded text-xs">
                                {unreadCount}
                            </span>
                        )}
                    </button>
                ))}
            </div>

            {messages.length === 0 ? (
                <div className="text-center py-20">
                    <MessageSquare className="w-16 h-16 text-muted/30 mx-auto mb-4" />
                    <h2 className="text-xl font-semibold">ບໍ່ມີຂໍ້ຄວາມ</h2>
                    <p className="text-muted mt-2">
                        {filter === "unread"
                            ? "ອ່ານຂໍ້ຄວາມທັງໝົດແລ້ວ"
                            : "ຍັງບໍ່ມີຂໍ້ຄວາມຈາກພະນັກງານເທື່ອ"}
                    </p>
                </div>
            ) : (
                <div className="space-y-3">
                    {messages.map((msg) => (
                        <div
                            key={msg.id}
                            className={`flex items-start justify-between p-4 rounded-xl border transition-colors ${
                                msg.read
                                    ? "border-border bg-card opacity-70"
                                    : "border-accent/30 bg-accent/5"
                            }`}
                        >
                            <div className="flex items-start gap-3 flex-1 min-w-0">
                                {msg.read ? (
                                    <MailOpen className="w-5 h-5 text-muted shrink-0 mt-0.5" />
                                ) : (
                                    <Mail className="w-5 h-5 text-accent shrink-0 mt-0.5" />
                                )}
                                <div className="flex-1 min-w-0">
                                    <p
                                        className={`text-sm ${msg.read ? "" : "font-semibold"}`}
                                    >
                                        {msg.message}
                                    </p>
                                    <div className="flex items-center gap-2 mt-2 text-xs text-muted flex-wrap">
                                        <span className="flex items-center gap-1">
                                            <Monitor className="w-3 h-3" />
                                            {msg.hostname}
                                        </span>
                                        {msg.ipAddress && (
                                            <span>({msg.ipAddress})</span>
                                        )}
                                        {msg.department && (
                                            <span className="bg-card border border-border px-1.5 py-0.5 rounded">
                                                {msg.department}
                                            </span>
                                        )}
                                        <span>
                                            {new Date(
                                                msg.createdAt,
                                            ).toLocaleString()}
                                        </span>
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center gap-1 shrink-0 ml-4">
                                {!msg.read && (
                                    <button
                                        onClick={() => markAsRead(msg.id)}
                                        className="p-2 text-accent hover:bg-accent/10 rounded-lg transition-colors"
                                        title="ໝາຍວ່າອ່ານແລ້ວ"
                                    >
                                        <CheckCircle className="w-4 h-4" />
                                    </button>
                                )}
                                <button
                                    onClick={() => deleteMessage(msg.id)}
                                    className="p-2 text-muted hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                                    title="ລົບ"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
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

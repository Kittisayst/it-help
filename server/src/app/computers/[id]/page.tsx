"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
    ArrowLeft,
    Cpu,
    Monitor,
    AlertTriangle,
    Settings,
    List,
    Printer,
    KeyRound,
    Play,
    Terminal,
    Loader2,
    Cog,
    Camera,
    Download,
    FileText,
    Activity,
    History,
} from "lucide-react";
import { exportToPDF } from "./export-pdf";
import { StatusBadge } from "@/components/status-badge";
import { useSocket } from "@/hooks/use-socket";
import { ComputerDetail } from "./types";
import { OverviewTab } from "./overview-tab";
import { ActionsTab } from "./actions-tab";
import {
    ProcessesTab,
    EventsTab,
    SoftwareTab,
    PrintersTab,
    LicensesTab,
    StartupTab,
    ServicesTab,
    SystemTab,
    UsageTab,
    PrintHistoryTab,
    ScreenshotsTab,
} from "./data-tabs";

import { ThresholdsTab } from "./thresholds-tab";

type TabKey =
    | "overview"
    | "processes"
    | "events"
    | "software"
    | "printers"
    | "licenses"
    | "startup"
    | "services"
    | "system"
    | "usage"
    | "print_history"
    | "screenshots"
    | "actions"
    | "thresholds";

export default function ComputerDetailPage() {
    const params = useParams();
    const [computer, setComputer] = useState<ComputerDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [tab, setTab] = useState<TabKey>("overview");
    const [editingLabel, setEditingLabel] = useState(false);
    const [editingTags, setEditingTags] = useState(false);
    const [labelValue, setLabelValue] = useState("");
    const [tagsValue, setTagsValue] = useState("");
    const [screenshot, setScreenshot] = useState<string | null>(null);
    const [screenshotLoading, setScreenshotLoading] = useState(false);
    const [actionLoading, setActionLoading] = useState<string | null>(null);

    const fetchComputer = async () => {
        try {
            const res = await fetch(`/api/computers/${params.id}`);
            if (!res.ok) throw new Error("Not found");
            const json = await res.json();
            setComputer(json);
        } catch (err) {
            console.error("Failed to fetch computer:", err);
        } finally {
            setLoading(false);
        }
    };

    const sendCommand = async (
        action: string,
        cmdParams?: Record<string, unknown>,
    ) => {
        if (!computer) return;
        setActionLoading(action);
        try {
            await fetch("/api/commands", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    computerId: computer.id,
                    action,
                    params: cmdParams || null,
                }),
            });
        } catch (err) {
            console.error("Failed to send command:", err);
        } finally {
            setTimeout(() => setActionLoading(null), 1000);
        }
    };

    const saveLabel = async () => {
        if (!computer) return;
        try {
            const res = await fetch(`/api/computers/${computer.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ label: labelValue }),
            });
            if (res.ok) {
                setEditingLabel(false);
                fetchComputer();
            }
        } catch (err) {
            console.error("Failed to save label:", err);
        }
    };

    const saveTags = async () => {
        if (!computer) return;
        try {
            const res = await fetch(`/api/computers/${computer.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ tags: tagsValue }),
            });
            if (res.ok) {
                setEditingTags(false);
                fetchComputer();
            }
        } catch (err) {
            console.error("Failed to save tags:", err);
        }
    };

    const captureScreenshot = async () => {
        if (!computer) return;
        setScreenshotLoading(true);
        try {
            const res = await fetch("/api/commands", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    computerId: computer.id,
                    action: "screenshot",
                    params: null,
                }),
            });

            if (res.ok) {
                const command = await res.json();
                const commandId = command.id;

                const pollInterval = setInterval(async () => {
                    const cmdRes = await fetch(
                        `/api/commands?computerId=${computer.id}`,
                    );
                    const cmds = await cmdRes.json();
                    const cmd = cmds.find(
                        (c: {
                            id: string;
                            status: string;
                            result: string | null;
                        }) => c.id === commandId,
                    );

                    if (cmd && cmd.status === "completed") {
                        clearInterval(pollInterval);
                        setScreenshotLoading(false);
                        if (cmd.result) {
                            try {
                                const result = JSON.parse(cmd.result);
                                if (result.screenshot) {
                                    setScreenshot(result.screenshot);
                                } else {
                                    alert(
                                        "Screenshot failed: " +
                                            (result.output || "Unknown error"),
                                    );
                                }
                            } catch {
                                alert("Failed to parse screenshot result");
                            }
                        }
                    }
                }, 2000);

                setTimeout(() => {
                    clearInterval(pollInterval);
                    setScreenshotLoading(false);
                }, 30000);
            }
        } catch {
            setScreenshotLoading(false);
            alert("ບໍ່ສາມາດຖ່າຍຮູບໜ້າຈໍໄດ້");
        }
    };

    const { on, emit } = useSocket();

    useEffect(() => {
        fetchComputer();
        const interval = setInterval(fetchComputer, 30000);

        return () => clearInterval(interval);
    }, [params.id]);

    // Socket.io live updates
    useEffect(() => {
        if (!computer) return;
        emit("join:computer", computer.id);

        const offReport = on("report:new", () => fetchComputer());

        return () => {
            emit("leave:computer", computer.id);
            offReport();
        };
    }, [computer?.id]);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="animate-spin w-8 h-8 border-2 border-accent border-t-transparent rounded-full" />
            </div>
        );
    }

    if (!computer) {
        return (
            <div className="text-center py-20">
                <Monitor className="w-16 h-16 text-muted mx-auto mb-4" />
                <h2 className="text-xl font-semibold">ບໍ່ພົບຂໍ້ມູນຄອມພິວເຕີ</h2>
                <Link
                    href="/computers"
                    className="text-accent text-sm mt-2 inline-block"
                >
                    ກັບຄືນໄປໜ້າລາຍຊື່ຄອມພິວເຕີ
                </Link>
            </div>
        );
    }

    const report = computer.lastReport;

    const renderTab = () => {
        switch (tab) {
            case "overview":
                return <OverviewTab computer={computer} />;
            case "processes":
                return <ProcessesTab report={report} />;
            case "events":
                return <EventsTab report={report} />;
            case "software":
                return <SoftwareTab report={report} />;
            case "printers":
                return <PrintersTab report={report} />;
            case "licenses":
                return <LicensesTab report={report} />;
            case "startup":
                return <StartupTab report={report} />;
            case "services":
                return (
                    <ServicesTab
                        report={report}
                        sendCommand={sendCommand}
                        actionLoading={actionLoading}
                    />
                );
            case "system":
                return <SystemTab report={report} />;
            case "usage":
                return <UsageTab report={report} />;
            case "print_history":
                return <PrintHistoryTab report={report} />;
            case "screenshots":
                return (
                    <ScreenshotsTab
                        computerId={computer.id}
                        sendCommand={sendCommand}
                        actionLoading={actionLoading}
                    />
                );
            case "actions":
                return <ActionsTab computer={computer} />;
            case "thresholds":
                return <ThresholdsTab computerId={computer.id} />;
            default:
                return null;
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Link
                    href="/computers"
                    className="p-2 bg-card border border-border rounded-lg hover:bg-border/50 transition-colors"
                >
                    <ArrowLeft className="w-5 h-5" />
                </Link>
                <div className="flex-1">
                    <div className="flex items-center gap-3">
                        <h1 className="text-2xl font-bold">
                            {computer.hostname}
                        </h1>
                        <StatusBadge status={computer.status} />
                    </div>
                    <p className="text-muted text-sm mt-1">
                        {computer.ipAddress} | {computer.department || "ທົ່ວໄປ"}{" "}
                        | ເຫັນຫຼ້າສຸດ:{" "}
                        {new Date(computer.lastSeenAt).toLocaleString()}
                    </p>
                    <div className="flex items-center gap-3 mt-2">
                        {editingLabel ? (
                            <div className="flex items-center gap-2">
                                <input
                                    type="text"
                                    value={labelValue}
                                    onChange={(e) =>
                                        setLabelValue(e.target.value)
                                    }
                                    placeholder="ເພີ່ມປ້າຍຊື່/ໝາຍເຫດ..."
                                    className="px-3 py-1 text-sm bg-background border border-border rounded"
                                    autoFocus
                                />
                                <button
                                    onClick={saveLabel}
                                    className="px-3 py-1 text-xs bg-accent text-white rounded hover:bg-accent/90"
                                >
                                    ບັນທຶກ
                                </button>
                                <button
                                    onClick={() => setEditingLabel(false)}
                                    className="px-3 py-1 text-xs bg-card border border-border rounded hover:bg-border/50"
                                >
                                    ຍົກເລີກ
                                </button>
                            </div>
                        ) : (
                            <button
                                onClick={() => {
                                    setLabelValue(computer.label || "");
                                    setEditingLabel(true);
                                }}
                                className="text-sm text-muted hover:text-foreground"
                            >
                                {computer.label
                                    ? `📝 ${computer.label}`
                                    : "+ ເພີ່ມປ້າຍຊື່"}
                            </button>
                        )}
                        {editingTags ? (
                            <div className="flex items-center gap-2">
                                <input
                                    type="text"
                                    value={tagsValue}
                                    onChange={(e) =>
                                        setTagsValue(e.target.value)
                                    }
                                    placeholder="ແທັກ (ຂັ້ນດ້ວຍຈຸດ)..."
                                    className="px-3 py-1 text-sm bg-background border border-border rounded"
                                    autoFocus
                                />
                                <button
                                    onClick={saveTags}
                                    className="px-3 py-1 text-xs bg-accent text-white rounded hover:bg-accent/90"
                                >
                                    ບັນທຶກ
                                </button>
                                <button
                                    onClick={() => setEditingTags(false)}
                                    className="px-3 py-1 text-xs bg-card border border-border rounded hover:bg-border/50"
                                >
                                    ຍົກເລີກ
                                </button>
                            </div>
                        ) : (
                            <button
                                onClick={() => {
                                    setTagsValue(computer.tags || "");
                                    setEditingTags(true);
                                }}
                                className="text-sm text-muted hover:text-foreground"
                            >
                                {computer.tags
                                    ? `🏷️ ${computer.tags}`
                                    : "+ ເພີ່ມແທັກ"}
                            </button>
                        )}
                    </div>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={captureScreenshot}
                        disabled={screenshotLoading}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-500/20 text-blue-400 border border-blue-500/30 rounded-lg text-sm font-medium hover:bg-blue-500/30 transition-colors disabled:opacity-50"
                        title="ຖ່າຍຮູບໜ້າຈໍ"
                    >
                        {screenshotLoading ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                            <Camera className="w-4 h-4" />
                        )}
                        ຖ່າຍຮູບໜ້າຈໍ
                    </button>
                    <button
                        onClick={() => {
                            const rdpContent = `full address:s:${computer.ipAddress}\nprompt for credentials:i:1\nadministrative session:i:1`;
                            const blob = new Blob([rdpContent], {
                                type: "application/x-rdp",
                            });
                            const url = URL.createObjectURL(blob);
                            const a = document.createElement("a");
                            a.href = url;
                            a.download = `${computer.hostname}.rdp`;
                            document.body.appendChild(a);
                            a.click();
                            document.body.removeChild(a);
                            URL.revokeObjectURL(url);
                        }}
                        className="flex items-center gap-2 px-4 py-2 bg-accent text-white rounded-lg text-sm font-medium hover:bg-accent/90 transition-colors"
                        title="Download RDP file to connect"
                    >
                        <Monitor className="w-4 h-4" />
                        Connect RDP
                    </button>
                    <button
                        onClick={() => {
                            window.open(
                                `/api/computers/${computer.id}/export`,
                                "_blank",
                            );
                        }}
                        className="flex items-center gap-2 px-4 py-2 bg-card border border-border rounded-lg text-sm font-medium hover:bg-border/50 transition-colors"
                        title="Export computer details as CSV"
                    >
                        <Download className="w-4 h-4" />
                        CSV
                    </button>
                    <button
                        onClick={() => exportToPDF(computer)}
                        className="flex items-center gap-2 px-4 py-2 bg-card border border-border rounded-lg text-sm font-medium hover:bg-border/50 transition-colors"
                        title="Export health report as PDF"
                    >
                        <FileText className="w-4 h-4" />
                        PDF
                    </button>
                </div>
            </div>

            {/* Screenshot Display */}
            {screenshot && (
                <div className="bg-card border border-border rounded-xl p-4">
                    <div className="flex items-center justify-between mb-3">
                        <h3 className="font-semibold">ຮູບໜ້າຈໍ (Screenshot)</h3>
                        <button
                            onClick={() => setScreenshot(null)}
                            className="text-xs text-muted hover:text-foreground"
                        >
                            ປິດ
                        </button>
                    </div>
                    <div className="bg-background rounded-lg overflow-hidden">
                        <img
                            src={`data:image/png;base64,${screenshot}`}
                            alt="Screenshot"
                            className="w-full h-auto"
                        />
                    </div>
                </div>
            )}

            {/* Tabs */}
            <div className="flex gap-2 border-b border-border pb-0 overflow-x-auto">
                {[
                    { key: "overview", label: "ພາບລວມ", icon: Monitor },
                    { key: "processes", label: "ໂປຣເຊສ", icon: Cpu },
                    {
                        key: "events",
                        label: "ບັນທຶກເຫດການ",
                        icon: AlertTriangle,
                    },
                    { key: "software", label: "ຊອບແວ", icon: List },
                    { key: "printers", label: "ເຄື່ອງພິມ", icon: Printer },
                    { key: "licenses", label: "ລິຂະສິດ", icon: KeyRound },
                    { key: "startup", label: "ໂປຣແກຣມເລີ່ມຕົ້ນ", icon: Play },
                    { key: "services", label: "ເຊີວິດ", icon: Cog },
                    { key: "usage", label: "ສະຖິຕິການໃຊ້ງານ", icon: Activity },
                    {
                        key: "print_history",
                        label: "ປະຫວັດການພິມ",
                        icon: History,
                    },
                    { key: "screenshots", label: "ຮູບໜ້າຈໍ", icon: Camera },
                    { key: "system", label: "ລະບົບ", icon: Settings },
                    {
                        key: "thresholds",
                        label: "ກຳນົດເກນ (Thresholds)",
                        icon: AlertTriangle,
                    },
                    {
                        key: "actions",
                        label: "ການສັ່ງການທາງໄກ",
                        icon: Terminal,
                    },
                ].map((t) => (
                    <button
                        key={t.key}
                        onClick={() => setTab(t.key as TabKey)}
                        className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors -mb-px whitespace-nowrap ${
                            tab === t.key
                                ? "border-accent text-accent"
                                : "border-transparent text-muted hover:text-foreground"
                        }`}
                    >
                        <t.icon className="w-4 h-4" />
                        {t.label}
                    </button>
                ))}
            </div>

            {renderTab()}
        </div>
    );
}

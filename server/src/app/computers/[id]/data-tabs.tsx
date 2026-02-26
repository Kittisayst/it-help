import {
    KeyRound,
    FolderOpen,
    Usb,
    Download,
    Cog,
    History,
    Activity,
    Clock,
    Printer,
} from "lucide-react";
import { ReportData } from "./types";

interface DataTabProps {
    report: ReportData | null;
    sendCommand: (action: string, params?: Record<string, unknown>) => void;
    actionLoading: string | null;
}

export function ProcessesTab({ report }: { report: ReportData | null }) {
    return (
        <div className="bg-card border border-border rounded-xl p-6">
            <h3 className="font-semibold mb-4">Top Processes</h3>
            {report?.topProcesses && report.topProcesses.length > 0 ? (
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-border text-muted">
                                <th className="text-left py-3 px-4">
                                    Process Name
                                </th>
                                <th className="text-right py-3 px-4">CPU %</th>
                                <th className="text-right py-3 px-4">
                                    Memory (MB)
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {report.topProcesses.map((proc, i) => (
                                <tr
                                    key={i}
                                    className="border-b border-border/50 hover:bg-border/20"
                                >
                                    <td className="py-3 px-4 font-mono">
                                        {proc.name}
                                    </td>
                                    <td
                                        className={`py-3 px-4 text-right font-mono ${proc.cpu > 50 ? "text-red-400" : ""}`}
                                    >
                                        {proc.cpu.toFixed(1)}%
                                    </td>
                                    <td className="py-3 px-4 text-right font-mono">
                                        {proc.memory.toFixed(1)}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            ) : (
                <p className="text-muted text-center py-8">
                    No process data available
                </p>
            )}
        </div>
    );
}

export function EventsTab({ report }: { report: ReportData | null }) {
    return (
        <div className="bg-card border border-border rounded-xl p-6">
            <h3 className="font-semibold mb-4">Windows Event Logs</h3>
            {report?.eventLogs && report.eventLogs.length > 0 ? (
                <div className="space-y-2">
                    {report.eventLogs.map((log, i) => (
                        <div
                            key={i}
                            className={`p-3 rounded-lg border text-sm ${
                                log.level === "Error" ||
                                log.level === "Critical"
                                    ? "border-red-500/30 bg-red-500/5"
                                    : "border-amber-500/30 bg-amber-500/5"
                            }`}
                        >
                            <div className="flex items-center justify-between mb-1">
                                <span
                                    className={`font-medium ${
                                        log.level === "Error" ||
                                        log.level === "Critical"
                                            ? "text-red-400"
                                            : "text-amber-400"
                                    }`}
                                >
                                    [{log.level}] {log.source}
                                </span>
                                <span className="text-xs text-muted">
                                    {log.time}
                                </span>
                            </div>
                            <p className="text-muted text-xs">{log.message}</p>
                        </div>
                    ))}
                </div>
            ) : (
                <p className="text-muted text-center py-8">
                    No event logs available
                </p>
            )}
        </div>
    );
}

export function SoftwareTab({ report }: { report: ReportData | null }) {
    return (
        <div className="bg-card border border-border rounded-xl p-6">
            <h3 className="font-semibold mb-4">Installed Software</h3>
            {report?.software && report.software.length > 0 ? (
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-border text-muted">
                                <th className="text-left py-3 px-4">Name</th>
                                <th className="text-left py-3 px-4">Version</th>
                            </tr>
                        </thead>
                        <tbody>
                            {report.software.map((sw, i) => (
                                <tr
                                    key={i}
                                    className="border-b border-border/50 hover:bg-border/20"
                                >
                                    <td className="py-2 px-4">{sw.name}</td>
                                    <td className="py-2 px-4 font-mono text-muted">
                                        {sw.version}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            ) : (
                <p className="text-muted text-center py-8">
                    No software data available
                </p>
            )}
        </div>
    );
}

export function PrintersTab({ report }: { report: ReportData | null }) {
    return (
        <div className="bg-card border border-border rounded-xl p-6">
            <h3 className="font-semibold mb-4">Installed Printers</h3>
            {report?.printers && report.printers.length > 0 ? (
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-border text-muted">
                                <th className="text-left py-3 px-4">Name</th>
                                <th className="text-left py-3 px-4">Status</th>
                                <th className="text-left py-3 px-4">Port</th>
                                <th className="text-left py-3 px-4">Type</th>
                            </tr>
                        </thead>
                        <tbody>
                            {report.printers.map((p, i) => (
                                <tr
                                    key={i}
                                    className="border-b border-border/50 hover:bg-border/20"
                                >
                                    <td className="py-3 px-4">
                                        <span className="font-medium">
                                            {p.name}
                                        </span>
                                        {p.is_default && (
                                            <span className="ml-2 text-xs bg-accent/10 text-accent px-1.5 py-0.5 rounded">
                                                Default
                                            </span>
                                        )}
                                    </td>
                                    <td className="py-3 px-4">
                                        <span
                                            className={`text-xs px-2 py-0.5 rounded ${p.status === "Ready" ? "bg-emerald-500/10 text-emerald-400" : "bg-amber-500/10 text-amber-400"}`}
                                        >
                                            {p.status}
                                        </span>
                                    </td>
                                    <td className="py-3 px-4 font-mono text-muted text-xs">
                                        {p.port}
                                    </td>
                                    <td className="py-3 px-4 text-xs text-muted">
                                        {p.is_network ? "Network" : "Local"}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            ) : (
                <p className="text-muted text-center py-8">
                    No printer data available
                </p>
            )}
        </div>
    );
}

export function LicensesTab({ report }: { report: ReportData | null }) {
    return (
        <div className="space-y-6">
            {/* Windows License */}
            <div className="bg-card border border-border rounded-xl p-6">
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                    <KeyRound className="w-4 h-4" />
                    Windows License
                </h3>
                {report?.windowsLicense ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <p className="text-xs text-muted mb-1">Edition</p>
                            <p className="text-sm font-medium">
                                {report.windowsLicense.edition || "N/A"}
                            </p>
                        </div>
                        <div>
                            <p className="text-xs text-muted mb-1">Status</p>
                            <span
                                className={`text-sm font-medium px-2 py-0.5 rounded ${report.windowsLicense.is_activated ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-400"}`}
                            >
                                {report.windowsLicense.is_activated
                                    ? "Activated"
                                    : report.windowsLicense.status}
                            </span>
                        </div>
                        <div>
                            <p className="text-xs text-muted mb-1">
                                Partial Key
                            </p>
                            <p className="text-sm font-mono">
                                {report.windowsLicense.partial_key || "N/A"}
                            </p>
                        </div>
                        <div>
                            <p className="text-xs text-muted mb-1">
                                License Type
                            </p>
                            <p className="text-sm">
                                {report.windowsLicense.license_type || "N/A"}
                            </p>
                        </div>
                    </div>
                ) : (
                    <p className="text-muted text-center py-4">
                        No Windows license data
                    </p>
                )}
            </div>

            {/* Office License */}
            <div className="bg-card border border-border rounded-xl p-6">
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                    <KeyRound className="w-4 h-4" />
                    Microsoft Office
                </h3>
                {report?.officeLicense?.installed ? (
                    <div>
                        <p className="text-sm mb-3">
                            Version:{" "}
                            <span className="font-medium">
                                {report.officeLicense.version}
                            </span>
                        </p>
                        {report.officeLicense.products.length > 0 ? (
                            <div className="space-y-2">
                                {report.officeLicense.products.map((p, i) => (
                                    <div
                                        key={i}
                                        className="flex items-center justify-between p-3 rounded-lg border border-border"
                                    >
                                        <div>
                                            <p className="text-sm font-medium">
                                                {p.name}
                                            </p>
                                            {p.partial_key && (
                                                <p className="text-xs text-muted font-mono mt-0.5">
                                                    Key: {p.partial_key}
                                                </p>
                                            )}
                                        </div>
                                        <span
                                            className={`text-xs px-2 py-0.5 rounded ${p.is_activated ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-400"}`}
                                        >
                                            {p.is_activated
                                                ? "Activated"
                                                : p.status}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-muted text-sm">
                                No product details available
                            </p>
                        )}
                    </div>
                ) : (
                    <p className="text-muted text-center py-4">
                        Microsoft Office not installed
                    </p>
                )}
            </div>
        </div>
    );
}

export function StartupTab({ report }: { report: ReportData | null }) {
    return (
        <div className="bg-card border border-border rounded-xl p-6">
            <h3 className="font-semibold mb-4">Startup Programs</h3>
            {report?.startupPrograms && report.startupPrograms.length > 0 ? (
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-border text-muted">
                                <th className="text-left py-3 px-4">Name</th>
                                <th className="text-left py-3 px-4">Command</th>
                                <th className="text-left py-3 px-4">
                                    Location
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {report.startupPrograms.map((p, i) => (
                                <tr
                                    key={i}
                                    className="border-b border-border/50 hover:bg-border/20"
                                >
                                    <td className="py-3 px-4 font-medium">
                                        {p.name}
                                    </td>
                                    <td className="py-3 px-4 font-mono text-xs text-muted max-w-xs truncate">
                                        {p.command}
                                    </td>
                                    <td className="py-3 px-4 text-xs text-muted">
                                        {p.location}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            ) : (
                <p className="text-muted text-center py-8">
                    No startup program data available
                </p>
            )}
        </div>
    );
}

export function ServicesTab({
    report,
    sendCommand,
    actionLoading,
}: DataTabProps) {
    return (
        <div className="space-y-6">
            <div className="bg-card border border-border rounded-xl p-6">
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                    <Cog className="w-4 h-4" />
                    Windows Services
                </h3>
                {report?.services &&
                Array.isArray(report.services) &&
                report.services.length > 0 ? (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-border text-muted">
                                    <th className="text-left py-3 px-4">
                                        Service Name
                                    </th>
                                    <th className="text-left py-3 px-4">
                                        Display Name
                                    </th>
                                    <th className="text-left py-3 px-4">
                                        Status
                                    </th>
                                    <th className="text-left py-3 px-4">
                                        Startup Type
                                    </th>
                                    <th className="text-left py-3 px-4">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {report.services.map((svc: any, i: number) => (
                                    <tr
                                        key={i}
                                        className="border-b border-border/50 hover:bg-border/20"
                                    >
                                        <td className="py-3 px-4 font-mono text-xs">
                                            {svc.name}
                                        </td>
                                        <td className="py-3 px-4">
                                            {svc.displayName}
                                        </td>
                                        <td className="py-3 px-4">
                                            <span
                                                className={`px-2 py-1 rounded text-xs font-medium ${
                                                    svc.status === "Running"
                                                        ? "bg-emerald-500/20 text-emerald-400"
                                                        : "bg-red-500/20 text-red-400"
                                                }`}
                                            >
                                                {svc.status}
                                            </span>
                                        </td>
                                        <td className="py-3 px-4 text-sm text-muted">
                                            {svc.startType}
                                        </td>
                                        <td className="py-3 px-4">
                                            <div className="flex gap-2">
                                                {svc.status === "Running" ? (
                                                    <>
                                                        <button
                                                            onClick={() =>
                                                                sendCommand(
                                                                    "service_stop",
                                                                    {
                                                                        service_name:
                                                                            svc.name,
                                                                    },
                                                                )
                                                            }
                                                            disabled={
                                                                actionLoading !==
                                                                null
                                                            }
                                                            className="px-3 py-1 text-xs bg-red-500/20 text-red-400 border border-red-500/30 rounded hover:bg-red-500/30 transition-colors disabled:opacity-50"
                                                        >
                                                            Stop
                                                        </button>
                                                        <button
                                                            onClick={() =>
                                                                sendCommand(
                                                                    "service_restart",
                                                                    {
                                                                        service_name:
                                                                            svc.name,
                                                                    },
                                                                )
                                                            }
                                                            disabled={
                                                                actionLoading !==
                                                                null
                                                            }
                                                            className="px-3 py-1 text-xs bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded hover:bg-amber-500/30 transition-colors disabled:opacity-50"
                                                        >
                                                            Restart
                                                        </button>
                                                    </>
                                                ) : (
                                                    <button
                                                        onClick={() =>
                                                            sendCommand(
                                                                "service_start",
                                                                {
                                                                    service_name:
                                                                        svc.name,
                                                                },
                                                            )
                                                        }
                                                        disabled={
                                                            actionLoading !==
                                                            null
                                                        }
                                                        className="px-3 py-1 text-xs bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded hover:bg-emerald-500/30 transition-colors disabled:opacity-50"
                                                    >
                                                        Start
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <p className="text-muted text-center py-4">
                        No services data available
                    </p>
                )}
            </div>
        </div>
    );
}

export function SystemTab({ report }: { report: ReportData | null }) {
    return (
        <div className="space-y-6">
            {/* Shared Folders */}
            <div className="bg-card border border-border rounded-xl p-6">
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                    <FolderOpen className="w-4 h-4" />
                    Shared Folders
                </h3>
                {report?.sharedFolders && report.sharedFolders.length > 0 ? (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-border text-muted">
                                    <th className="text-left py-3 px-4">
                                        Name
                                    </th>
                                    <th className="text-left py-3 px-4">
                                        Path
                                    </th>
                                    <th className="text-left py-3 px-4">
                                        Type
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {report.sharedFolders.map((f, i) => (
                                    <tr
                                        key={i}
                                        className="border-b border-border/50 hover:bg-border/20"
                                    >
                                        <td className="py-3 px-4 font-medium">
                                            {f.name}
                                        </td>
                                        <td className="py-3 px-4 font-mono text-xs text-muted">
                                            {f.path}
                                        </td>
                                        <td className="py-3 px-4 text-xs">
                                            {f.is_hidden ? "Hidden" : "Visible"}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <p className="text-muted text-center py-4">
                        No shared folders
                    </p>
                )}
            </div>

            {/* USB Devices */}
            <div className="bg-card border border-border rounded-xl p-6">
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                    <Usb className="w-4 h-4" />
                    USB Devices
                </h3>
                {report?.usbDevices && report.usbDevices.length > 0 ? (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-border text-muted">
                                    <th className="text-left py-3 px-4">
                                        Device
                                    </th>
                                    <th className="text-left py-3 px-4">
                                        Manufacturer
                                    </th>
                                    <th className="text-left py-3 px-4">
                                        Status
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {report.usbDevices.map((d, i) => (
                                    <tr
                                        key={i}
                                        className="border-b border-border/50 hover:bg-border/20"
                                    >
                                        <td className="py-3 px-4">{d.name}</td>
                                        <td className="py-3 px-4 text-muted">
                                            {d.manufacturer || "N/A"}
                                        </td>
                                        <td className="py-3 px-4">
                                            <span
                                                className={`text-xs px-2 py-0.5 rounded ${d.status === "OK" ? "bg-emerald-500/10 text-emerald-400" : "bg-amber-500/10 text-amber-400"}`}
                                            >
                                                {d.status}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <p className="text-muted text-center py-4">
                        No USB devices detected
                    </p>
                )}
            </div>

            {/* Windows Update */}
            <div className="bg-card border border-border rounded-xl p-6">
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                    <Download className="w-4 h-4" />
                    Windows Update
                    {report?.windowsUpdate?.pending_count ? (
                        <span className="text-xs bg-amber-500/10 text-amber-400 px-2 py-0.5 rounded">
                            {report.windowsUpdate.pending_count} pending
                        </span>
                    ) : null}
                </h3>
                {report?.windowsUpdate?.recent_updates &&
                report.windowsUpdate.recent_updates.length > 0 ? (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-border text-muted">
                                    <th className="text-left py-3 px-4">
                                        Update ID
                                    </th>
                                    <th className="text-left py-3 px-4">
                                        Description
                                    </th>
                                    <th className="text-left py-3 px-4">
                                        Installed
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {report.windowsUpdate.recent_updates.map(
                                    (u, i) => (
                                        <tr
                                            key={i}
                                            className="border-b border-border/50 hover:bg-border/20"
                                        >
                                            <td className="py-3 px-4 font-mono text-xs">
                                                {u.id}
                                            </td>
                                            <td className="py-3 px-4">
                                                {u.description}
                                            </td>
                                            <td className="py-3 px-4 text-xs text-muted">
                                                {u.installed_on}
                                            </td>
                                        </tr>
                                    ),
                                )}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <p className="text-muted text-center py-4">
                        No update data available
                    </p>
                )}
            </div>
        </div>
    );
}

export function UsageTab({ report }: { report: ReportData | null }) {
    const formatBytes = (bytes: number) => {
        if (bytes === 0) return "0 B";
        const k = 1024;
        const sizes = ["B", "KB", "MB", "GB", "TB"];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
    };

    const formatDuration = (seconds: number) => {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = Math.floor(seconds % 60);
        if (h > 0) return `${h}h ${m}m`;
        if (m > 0) return `${m}m ${s}s`;
        return `${s}s`;
    };

    return (
        <div className="space-y-6">
            {/* Bandwidth Usage */}
            <div className="bg-card border border-border rounded-xl p-6">
                <h3 className="font-semibold mb-6 flex items-center gap-2">
                    <Activity className="w-4 h-4 text-accent" />
                    Network Bandwidth (Last Interval)
                </h3>
                {report?.bandwidthUsage ? (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="p-4 rounded-lg bg-emerald-500/5 border border-emerald-500/10">
                            <p className="text-xs text-muted mb-1 flex items-center gap-1">
                                <Download className="w-3 h-3" /> Download
                            </p>
                            <p className="text-2xl font-bold text-emerald-400">
                                {formatBytes(report.bandwidthUsage.recv_bytes)}
                            </p>
                        </div>
                        <div className="p-4 rounded-lg bg-blue-500/5 border border-blue-500/10">
                            <p className="text-xs text-muted mb-1 flex items-center gap-1">
                                <Activity className="w-3 h-3 rotate-180" />{" "}
                                Upload
                            </p>
                            <p className="text-2xl font-bold text-blue-400">
                                {formatBytes(report.bandwidthUsage.sent_bytes)}
                            </p>
                        </div>
                        <div className="p-4 rounded-lg bg-border/20 border border-border/50">
                            <p className="text-xs text-muted mb-1 flex items-center gap-1">
                                <Clock className="w-3 h-3" /> Interval
                            </p>
                            <p className="text-2xl font-bold">
                                {report.bandwidthUsage.duration}s
                            </p>
                        </div>
                    </div>
                ) : (
                    <p className="text-muted text-center py-4">
                        No bandwidth data available
                    </p>
                )}
            </div>

            {/* App Usage Tracking */}
            <div className="bg-card border border-border rounded-xl p-6">
                <h3 className="font-semibold mb-6 flex items-center gap-2">
                    <Clock className="w-4 h-4 text-accent" />
                    Application Usage (Time Spent)
                </h3>
                {report?.appUsage && Object.keys(report.appUsage).length > 0 ? (
                    <div className="space-y-4">
                        {Object.entries(report.appUsage)
                            .sort(([, a], [, b]) => b - a)
                            .map(([app, seconds], i) => {
                                const totalSeconds = Object.values(
                                    report.appUsage!,
                                ).reduce((sum, s) => sum + s, 0);
                                const percent = (seconds / totalSeconds) * 100;
                                return (
                                    <div key={i} className="space-y-1">
                                        <div className="flex justify-between text-sm">
                                            <span className="font-medium truncate max-w-[70%]">
                                                {app}
                                            </span>
                                            <span className="text-muted">
                                                {formatDuration(seconds)}
                                            </span>
                                        </div>
                                        <div className="h-2 bg-border/30 rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-accent transition-all duration-500"
                                                style={{ width: `${percent}%` }}
                                            />
                                        </div>
                                    </div>
                                );
                            })}
                    </div>
                ) : (
                    <p className="text-muted text-center py-8">
                        No application usage data available
                    </p>
                )}
            </div>
        </div>
    );
}

export function PrintHistoryTab({ report }: { report: ReportData | null }) {
    return (
        <div className="bg-card border border-border rounded-xl p-6">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
                <History className="w-4 h-4 text-accent" />
                Recent Print Jobs
            </h3>
            {report?.printHistory && report.printHistory.length > 0 ? (
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-border text-muted">
                                <th className="text-left py-3 px-4">
                                    Document
                                </th>
                                <th className="text-left py-3 px-4">Printer</th>
                                <th className="text-left py-3 px-4">User</th>
                                <th className="text-left py-3 px-4">Pages</th>
                                <th className="text-right py-3 px-4">Time</th>
                            </tr>
                        </thead>
                        <tbody>
                            {report.printHistory.map((job, i) => (
                                <tr
                                    key={i}
                                    className="border-b border-border/50 hover:bg-border/20"
                                >
                                    <td
                                        className="py-3 px-4 font-medium max-w-xs truncate"
                                        title={job.document}
                                    >
                                        {job.document}
                                    </td>
                                    <td className="py-3 px-4 text-xs">
                                        {job.printer}
                                    </td>
                                    <td className="py-3 px-4 text-xs">
                                        {job.user}
                                    </td>
                                    <td className="py-3 px-4">
                                        <span className="px-2 py-0.5 rounded-full bg-accent/10 text-accent text-xs">
                                            {job.pages} pages
                                        </span>
                                    </td>
                                    <td className="py-3 px-4 text-right text-xs text-muted">
                                        {new Date(
                                            job.timestamp,
                                        ).toLocaleString()}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            ) : (
                <div className="text-center py-12">
                    <Printer className="w-12 h-12 text-muted/30 mx-auto mb-3" />
                    <p className="text-muted">No print history detected</p>
                    <p className="text-xs text-muted/50 mt-1 max-w-xs mx-auto">
                        Note: Print logging must be enabled on the target
                        Windows machine to collect this data.
                    </p>
                </div>
            )}
        </div>
    );
}

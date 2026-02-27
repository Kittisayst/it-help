import React from "react";
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
    Image,
    Trash2,
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
            <h3 className="font-semibold mb-4">ໂປຣເຊສທີ່ໃຊ້ຊັບພະຍາກອນສູງສຸດ</h3>
            {report?.topProcesses && report.topProcesses.length > 0 ? (
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-border text-muted">
                                <th className="text-left py-3 px-4">
                                    ຊື່ໂປຣເຊສ
                                </th>
                                <th className="text-right py-3 px-4">CPU %</th>
                                <th className="text-right py-3 px-4">
                                    ໜ່ວຍຄວາມຈຳ (MB)
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
                <p className="text-muted text-center py-8">ບໍ່ມີຂໍ້ມູນໂປຣເຊສ</p>
            )}
        </div>
    );
}

export function EventsTab({ report }: { report: ReportData | null }) {
    return (
        <div className="bg-card border border-border rounded-xl p-6">
            <h3 className="font-semibold mb-4">
                ບັນທຶກເຫດການ Windows (Event Logs)
            </h3>
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
                    ບໍ່ມີຂໍ້ມູນບັນທຶກເຫດການ
                </p>
            )}
        </div>
    );
}

export function SoftwareTab({ report }: { report: ReportData | null }) {
    return (
        <div className="bg-card border border-border rounded-xl p-6">
            <h3 className="font-semibold mb-4">ຊອບແວທີ່ຕິດຕັ້ງແລ້ວ</h3>
            {report?.software && report.software.length > 0 ? (
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-border text-muted">
                                <th className="text-left py-3 px-4">ຊື່</th>
                                <th className="text-left py-3 px-4">ເວີຊັນ</th>
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
                <p className="text-muted text-center py-8">ບໍ່ມີຂໍ້ມູນຊອບແວ</p>
            )}
        </div>
    );
}

export function PrintersTab({ report }: { report: ReportData | null }) {
    return (
        <div className="bg-card border border-border rounded-xl p-6">
            <h3 className="font-semibold mb-4">ເຄື່ອງພິມທີ່ຕິດຕັ້ງແລ້ວ</h3>
            {report?.printers && report.printers.length > 0 ? (
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-border text-muted">
                                <th className="text-left py-3 px-4">ຊື່</th>
                                <th className="text-left py-3 px-4">ສະຖານະ</th>
                                <th className="text-left py-3 px-4">
                                    ພອດ (Port)
                                </th>
                                <th className="text-left py-3 px-4">ປະເພດ</th>
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
                                                ຄ່າເລີ່ມຕົ້ນ
                                            </span>
                                        )}
                                    </td>
                                    <td className="py-3 px-4">
                                        <span
                                            className={`text-xs px-2 py-0.5 rounded ${p.status === "Ready" ? "bg-emerald-500/10 text-emerald-400" : "bg-amber-500/10 text-amber-400"}`}
                                        >
                                            {p.status === "Ready"
                                                ? "ພ້ອມໃຊ້ງານ"
                                                : p.status}
                                        </span>
                                    </td>
                                    <td className="py-3 px-4 font-mono text-muted text-xs">
                                        {p.port}
                                    </td>
                                    <td className="py-3 px-4 text-xs text-muted">
                                        {p.is_network ? "ເຄືອຂ່າຍ" : "ທ້ອງຖິ່ນ"}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            ) : (
                <p className="text-muted text-center py-8">
                    ບໍ່ມີຂໍ້ມູນເຄື່ອງພິມ
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
                    ລິຂະສິດ Windows
                </h3>
                {report?.windowsLicense ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <p className="text-xs text-muted mb-1">
                                ລຸ້ນ (Edition)
                            </p>
                            <p className="text-sm font-medium">
                                {report.windowsLicense.edition || "ບໍ່ມີຂໍ້ມູນ"}
                            </p>
                        </div>
                        <div>
                            <p className="text-xs text-muted mb-1">ສະຖານະ</p>
                            <span
                                className={`text-sm font-medium px-2 py-0.5 rounded ${report.windowsLicense.is_activated ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-400"}`}
                            >
                                {report.windowsLicense.is_activated
                                    ? "ເປີດໃຊ້ງານແລ້ວ"
                                    : report.windowsLicense.status}
                            </span>
                        </div>
                        <div>
                            <p className="text-xs text-muted mb-1">
                                ຄີບາງສ່ວນ (Partial Key)
                            </p>
                            <p className="text-sm font-mono">
                                {report.windowsLicense.partial_key ||
                                    "ບໍ່ມີຂໍ້ມູນ"}
                            </p>
                        </div>
                        <div>
                            <p className="text-xs text-muted mb-1">
                                ປະເພດລິຂະສິດ
                            </p>
                            <p className="text-sm">
                                {report.windowsLicense.license_type ||
                                    "ບໍ່ມີຂໍ້ມູນ"}
                            </p>
                        </div>
                    </div>
                ) : (
                    <p className="text-muted text-center py-4">
                        ບໍ່ມີຂໍ້ມູນລິຂະສິດ Windows
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
                            ເວີຊັນ:{" "}
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
                                                    ຄີ: {p.partial_key}
                                                </p>
                                            )}
                                        </div>
                                        <span
                                            className={`text-xs px-2 py-0.5 rounded ${p.is_activated ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-400"}`}
                                        >
                                            {p.is_activated
                                                ? "ເປີດໃຊ້ງານແລ້ວ"
                                                : p.status}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-muted text-sm">
                                ບໍ່ມີຂໍ້ມູນລາຍລະອຽດຜະລິດຕະພັນ
                            </p>
                        )}
                    </div>
                ) : (
                    <p className="text-muted text-center py-4">
                        ຍັງບໍ່ໄດ້ຕິດຕັ້ງ Microsoft Office
                    </p>
                )}
            </div>
        </div>
    );
}

export function StartupTab({ report }: { report: ReportData | null }) {
    return (
        <div className="bg-card border border-border rounded-xl p-6">
            <h3 className="font-semibold mb-4">ໂປຣແກຣມທີ່ເລີ່ມຕົ້ນພ້ອມລະບົບ</h3>
            {report?.startupPrograms && report.startupPrograms.length > 0 ? (
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-border text-muted">
                                <th className="text-left py-3 px-4">ຊື່</th>
                                <th className="text-left py-3 px-4">ຄຳສັ່ງ</th>
                                <th className="text-left py-3 px-4">
                                    ທີ່ຢູ່ (Location)
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
                    ບໍ່ມີຂໍ້ມູນໂປຣແກຣມເລີ່ມຕົ້ນ
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
                    ເຊີວິດ Windows (Services)
                </h3>
                {report?.services &&
                Array.isArray(report.services) &&
                report.services.length > 0 ? (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-border text-muted">
                                    <th className="text-left py-3 px-4">
                                        ຊື່ເຊີວິດ
                                    </th>
                                    <th className="text-left py-3 px-4">
                                        ຊື່ທີ່ສະແດງ
                                    </th>
                                    <th className="text-left py-3 px-4">
                                        ສະຖານະ
                                    </th>
                                    <th className="text-left py-3 px-4">
                                        ປະເພດການເລີ່ມຕົ້ນ
                                    </th>
                                    <th className="text-left py-3 px-4">
                                        ການຈັດການ
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
                                                {svc.status === "Running"
                                                    ? "ກຳນົດເຮັດວຽກ"
                                                    : "ຢຸດເຮັດວຽກ"}
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
                                                            ຢຸດ
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
                                                            ເລີ່ມໃໝ່
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
                                                        ເລີ່ມ
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
                        ບໍ່ມີຂໍ້ມູນເຊີວິດ
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
                    ໂຟນເດີທີ່ແບ່ງປັນ (Shared Folders)
                </h3>
                {report?.sharedFolders && report.sharedFolders.length > 0 ? (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-border text-muted">
                                    <th className="text-left py-3 px-4">ຊື່</th>
                                    <th className="text-left py-3 px-4">
                                        ເສັ້ນທາງ (Path)
                                    </th>
                                    <th className="text-left py-3 px-4">
                                        ປະເພດ
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
                                            {f.is_hidden
                                                ? "ຊ່ອນ (Hidden)"
                                                : "ສະແດງ (Visible)"}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <p className="text-muted text-center py-4">
                        ບໍ່ມີໂຟນເດີທີ່ແບ່ງປັນ
                    </p>
                )}
            </div>

            {/* USB Devices */}
            <div className="bg-card border border-border rounded-xl p-6">
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                    <Usb className="w-4 h-4" />
                    ອຸປະກອນ USB
                </h3>
                {report?.usbDevices && report.usbDevices.length > 0 ? (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-border text-muted">
                                    <th className="text-left py-3 px-4">
                                        ອຸປະກອນ
                                    </th>
                                    <th className="text-left py-3 px-4">
                                        ຜູ້ຜະລິດ
                                    </th>
                                    <th className="text-left py-3 px-4">
                                        ສະຖານະ
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
                                            {d.manufacturer || "ບໍ່ມີຂໍ້ມູນ"}
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
                        ບໍ່ພົບອຸປະກອນ USB
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
                            {report.windowsUpdate.pending_count} ລໍຖ້າດຳເນີນການ
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
                                        ໄອດີອັບເດດ
                                    </th>
                                    <th className="text-left py-3 px-4">
                                        ລາຍລະອຽດ
                                    </th>
                                    <th className="text-left py-3 px-4">
                                        ຕິດຕັ້ງແລ້ວ
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
                        ບໍ່ມີຂໍ້ມູນການອັບເດດ
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
                    ປະລິມານການໃຊ້ງານເຄືອຂ່າຍ (ຮອບຫຼ້າສຸດ)
                </h3>
                {report?.bandwidthUsage ? (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="p-4 rounded-lg bg-emerald-500/5 border border-emerald-500/10">
                            <p className="text-xs text-muted mb-1 flex items-center gap-1">
                                <Download className="w-3 h-3" /> ດາວໂຫຼດ
                            </p>
                            <p className="text-2xl font-bold text-emerald-400">
                                {formatBytes(report.bandwidthUsage.recv_bytes)}
                            </p>
                        </div>
                        <div className="p-4 rounded-lg bg-blue-500/5 border border-blue-500/10">
                            <p className="text-xs text-muted mb-1 flex items-center gap-1">
                                <Activity className="w-3 h-3 rotate-180" />{" "}
                                ອັບໂຫຼດ
                            </p>
                            <p className="text-2xl font-bold text-blue-400">
                                {formatBytes(report.bandwidthUsage.sent_bytes)}
                            </p>
                        </div>
                        <div className="p-4 rounded-lg bg-border/20 border border-border/50">
                            <p className="text-xs text-muted mb-1 flex items-center gap-1">
                                <Clock className="w-3 h-3" /> ໄລຍະເວລາ
                            </p>
                            <p className="text-2xl font-bold">
                                {report.bandwidthUsage.duration}s
                            </p>
                        </div>
                    </div>
                ) : (
                    <p className="text-muted text-center py-4">
                        ບໍ່ມີຂໍ້ມູນການໃຊ້ເຄືອຂ່າຍ
                    </p>
                )}
            </div>

            {/* App Usage Tracking */}
            <div className="bg-card border border-border rounded-xl p-6">
                <h3 className="font-semibold mb-6 flex items-center gap-2">
                    <Clock className="w-4 h-4 text-accent" />
                    ການໃຊ້ງານແອັບພລິເຄຊັນ (ໄລຍະເວລາ)
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
                        ບໍ່ມີຂໍ້ມູນການໃຊ້ງານແອັບພລິເຄຊັນ
                    </p>
                )}
            </div>
        </div>
    );
}

export function PrintHistoryTab({ report }: { report: ReportData | null }) {
    if (!report?.printHistory || report.printHistory.length === 0) {
        return (
            <div className="bg-card border border-border rounded-xl p-12 text-center text-muted">
                <History className="w-12 h-12 mx-auto mb-4 opacity-20" />
                <p>ບໍ່ພົບປະຫວັດການພິມ</p>
                <p className="text-xs opacity-50 mt-2 max-w-xs mx-auto">
                    ໝາຍເຫດ: ຕ້ອງເປີດການບັນທຶກການພິມ (Print logging) ໃນເຄື່ອງ
                    Windows ເພື່ອເກັບກຳຂໍ້ມູນນີ້.
                </p>
            </div>
        );
    }

    return (
        <div className="bg-card border border-border rounded-xl p-6">
            <h3 className="font-semibold mb-4">ປະຫວັດການພິມຫຼ້າສຸດ</h3>
            <div className="overflow-x-auto">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="border-b border-border text-muted">
                            <th className="text-left py-3 px-4">ເອກະສານ</th>
                            <th className="text-left py-3 px-4">ຜູ້ໃຊ້</th>
                            <th className="text-left py-3 px-4">ເຄື່ອງພິມ</th>
                            <th className="text-right py-3 px-4">ຈຳນວນໜ້າ</th>
                            <th className="text-right py-3 px-4">ເວລາ</th>
                        </tr>
                    </thead>
                    <tbody>
                        {report.printHistory.map((job, i) => (
                            <tr
                                key={i}
                                className="border-b border-border/50 hover:bg-border/20"
                            >
                                <td
                                    className="py-3 px-4 max-w-[200px] truncate"
                                    title={job.document}
                                >
                                    {job.document}
                                </td>
                                <td className="py-3 px-4">{job.user}</td>
                                <td className="py-3 px-4">{job.printer}</td>
                                <td className="py-3 px-4 text-right">
                                    <span className="px-2 py-0.5 rounded-full bg-accent/10 text-accent text-xs">
                                        {job.pages}
                                    </span>
                                </td>
                                <td className="py-3 px-4 text-right text-muted-foreground whitespace-nowrap">
                                    {new Date(job.timestamp).toLocaleString()}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

export function ScreenshotsTab({
    computerId,
    sendCommand,
    actionLoading,
}: {
    computerId: string;
    sendCommand: (action: string) => void;
    actionLoading: string | null;
}) {
    const [screenshots, setScreenshots] = React.useState<any[]>([]);
    const [loading, setLoading] = React.useState(true);
    const [selectedImage, setSelectedImage] = React.useState<string | null>(
        null,
    );

    const fetchScreenshots = async () => {
        try {
            const res = await fetch(`/api/computers/${computerId}/screenshots`);
            if (res.ok) {
                const data = await res.json();
                setScreenshots(data);
            }
        } catch (err) {
            console.error("Failed to fetch screenshots:", err);
        } finally {
            setLoading(false);
        }
    };

    const deleteScreenshot = async (id: string) => {
        if (!confirm("ທ່ານແນ່ໃຈບໍ່ວ່າຕ້ອງການລົບຮູບໜ້າຈໍນີ້?")) return;
        try {
            const res = await fetch(`/api/screenshots/${id}`, {
                method: "DELETE",
            });
            if (res.ok) {
                setScreenshots(screenshots.filter((s) => s.id !== id));
            }
        } catch (err) {
            console.error("Failed to delete screenshot:", err);
        }
    };

    const clearAll = async () => {
        if (
            !confirm(
                "ທ່ານແນ່ໃຈບໍ່ວ່າຕ້ອງການລົບປະຫວັດຮູບໜ້າຈໍທັງໝົດຂອງຄອມພິວເຕີເຄື່ອງນີ້?",
            )
        )
            return;
        try {
            const res = await fetch(
                `/api/computers/${computerId}/screenshots`,
                {
                    method: "DELETE",
                },
            );
            if (res.ok) {
                setScreenshots([]);
            }
        } catch (err) {
            console.error("Failed to clear screenshots:", err);
        }
    };

    React.useEffect(() => {
        fetchScreenshots();
        // Polling for new screenshots if action is pending
        let interval: any;
        if (actionLoading === "screenshot") {
            interval = setInterval(fetchScreenshots, 3000);
        }
        return () => clearInterval(interval);
    }, [computerId, actionLoading]);

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h3 className="font-semibold px-1">ປະຫວັດຮູບໜ້າຈໍ</h3>
                <div className="flex gap-2">
                    <button
                        onClick={() => sendCommand("screenshot")}
                        disabled={actionLoading === "screenshot"}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-lg text-sm font-medium hover:bg-blue-500/20 transition-colors disabled:opacity-50"
                    >
                        {actionLoading === "screenshot" ? (
                            <Activity className="w-4 h-4 animate-spin" />
                        ) : (
                            <Image className="w-4 h-4" />
                        )}
                        ຖ່າຍຮູບດຽວນີ້
                    </button>
                    {screenshots.length > 0 && (
                        <button
                            onClick={clearAll}
                            className="flex items-center gap-2 px-4 py-2 bg-red-500/10 text-red-400 border border-red-500/20 rounded-lg text-sm font-medium hover:bg-red-500/20 transition-colors"
                        >
                            <Trash2 className="w-4 h-4" />
                            ລົບທັງໝົດ
                        </button>
                    )}
                </div>
            </div>

            {loading ? (
                <div className="bg-card border border-border rounded-xl p-12 text-center">
                    <div className="animate-spin w-8 h-8 border-2 border-accent border-t-transparent rounded-full mx-auto" />
                </div>
            ) : screenshots.length === 0 ? (
                <div className="bg-card border border-border rounded-xl p-12 text-center text-muted">
                    <Image className="w-12 h-12 mx-auto mb-4 opacity-20" />
                    <p>ຍັງບໍ່ທັນມີຮູບໜ້າຈໍ</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {screenshots.map((ss) => (
                        <div
                            key={ss.id}
                            className="group relative bg-card border border-border rounded-xl overflow-hidden hover:border-accent/50 transition-colors"
                        >
                            <div
                                className="aspect-video cursor-zoom-in"
                                onClick={() => setSelectedImage(ss.imagePath)}
                            >
                                <img
                                    src={ss.imagePath}
                                    alt="User Screen"
                                    className="w-full h-full object-cover"
                                />
                            </div>
                            <div className="p-3 flex items-center justify-between bg-card/80 backdrop-blur-sm border-t border-border">
                                <p className="text-xs text-muted-foreground">
                                    {new Date(ss.createdAt).toLocaleString()}
                                </p>
                                <button
                                    onClick={() => deleteScreenshot(ss.id)}
                                    className="p-1.5 text-red-400 hover:bg-red-500/20 rounded-lg transition-colors"
                                    title="ລົບຮູບໜ້າຈໍ"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Lightbox */}
            {selectedImage && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm cursor-zoom-out"
                    onClick={() => setSelectedImage(null)}
                >
                    <div className="relative max-w-7xl w-full h-full flex items-center justify-center">
                        <img
                            src={selectedImage}
                            alt="Screenshot Full"
                            className="max-w-full max-h-full object-contain shadow-2xl"
                        />
                        <button
                            onClick={() => setSelectedImage(null)}
                            className="absolute top-0 right-0 p-4 text-white hover:text-accent"
                        >
                            <Trash2 className="w-6 h-6 rotate-45" />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

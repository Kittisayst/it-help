import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { ComputerDetail } from "./types";

export const exportToPDF = (computer: ComputerDetail) => {
    const doc = new jsPDF();
    const report = computer.lastReport;
    const now = new Date().toLocaleString();

    // Header
    doc.setFontSize(20);
    doc.setTextColor(40, 44, 52);
    doc.text("IT Assets - Health Report", 14, 22);

    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Generated on: ${now}`, 14, 28);
    doc.text(`Asset ID: ${computer.id}`, 14, 33);

    // Basic Info Table
    doc.setFontSize(14);
    doc.setTextColor(40, 44, 52);
    doc.text("1. Basic Information", 14, 45);

    autoTable(doc, {
        startY: 48,
        head: [["Field", "Value"]],
        body: [
            ["Hostname", computer.hostname],
            ["IP Address", computer.ipAddress],
            ["MAC Address", computer.macAddress || "N/A"],
            ["OS Version", computer.osVersion || "N/A"],
            ["Department", computer.department || "General"],
            ["Label/Note", computer.label || "-"],
        ],
        theme: "striped",
        headStyles: { fillColor: [79, 70, 229] }, // Accent color
    });

    if (report) {
        const finalY = (doc as any).lastAutoTable.finalY + 10;

        // System Metrics
        doc.setFontSize(14);
        doc.text("2. System Health Metrics", 14, finalY);

        autoTable(doc, {
            startY: finalY + 3,
            head: [["Metric", "Usage", "Details"]],
            body: [
                ["CPU Usage", `${report.cpuUsage.toFixed(1)}%`, `${report.cpuCores || "?"} Cores @ ${report.cpuSpeed || "N/A"}`],
                ["RAM Usage", `${report.ramUsage.toFixed(1)}%`, `${(report.ramUsed / 1024 / 1024 / 1024).toFixed(2)} / ${(report.ramTotal / 1024 / 1024 / 1024).toFixed(2)} GB`],
                ["Disk Usage", `${report.diskUsage.toFixed(1)}%`, `${(report.diskUsed / 1024 / 1024 / 1024).toFixed(2)} / ${(report.diskTotal / 1024 / 1024 / 1024).toFixed(2)} GB`],
                ["Uptime", report.uptime ? `${Math.floor(report.uptime / 86400)}d ${Math.floor((report.uptime % 86400) / 3600)}h` : "N/A", "-"],
            ],
            theme: "grid",
            headStyles: { fillColor: [16, 185, 129] }, // Emerald color
        });

        // Top Processes
        if (report.topProcesses && report.topProcesses.length > 0) {
            const procY = (doc as any).lastAutoTable.finalY + 10;
            doc.setFontSize(14);
            doc.text("3. Top Processes (CPU Intensive)", 14, procY);

            autoTable(doc, {
                startY: procY + 3,
                head: [["Process Name", "CPU %", "Memory (MB)"]],
                body: report.topProcesses.slice(0, 10).map(p => [
                    p.name,
                    `${p.cpu.toFixed(1)}%`,
                    p.memory.toFixed(1)
                ]),
                theme: "striped",
            });
        }
    }

    // Alerts
    if (computer.alerts && computer.alerts.length > 0) {
        const alertsY = (doc as any).lastAutoTable.finalY + 10;
        if (alertsY > 250) doc.addPage();

        doc.setFontSize(14);
        doc.text("4. Recent Alerts", 14, (doc as any).lastAutoTable.finalY > 250 ? 22 : alertsY);

        autoTable(doc, {
            startY: (doc as any).lastAutoTable.finalY > 250 ? 25 : alertsY + 3,
            head: [["Date", "Severity", "Message", "Status"]],
            body: computer.alerts.slice(0, 10).map(a => [
                new Date(a.createdAt).toLocaleDateString(),
                a.severity.toUpperCase(),
                a.message,
                a.resolved ? "Resolved" : "Active"
            ]),
            headStyles: { fillColor: [239, 68, 68] }, // Red color
        });
    }

    // Footer
    const pageCount = (doc as any).internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(150);
        doc.text(
            `Page ${i} of ${pageCount} - Private & Confidential - IT Monitoring System`,
            doc.internal.pageSize.getWidth() / 2,
            doc.internal.pageSize.getHeight() - 10,
            { align: "center" }
        );
    }

    doc.save(`${computer.hostname}_health_report_${new Date().toISOString().split("T")[0]}.pdf`);
};

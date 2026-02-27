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
    doc.text("ບົດລາຍງານສຸຂະພາບອຸປະກອນ IT", 14, 22);

    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`ສ້າງເມື່ອ: ${now}`, 14, 28);
    doc.text(`ໄອດີອຸປະກອນ: ${computer.id}`, 14, 33);

    // Basic Info Table
    doc.setFontSize(14);
    doc.setTextColor(40, 44, 52);
    doc.text("1. ຂໍ້ມູນເບື້ອງຕົ້ນ", 14, 45);

    autoTable(doc, {
        startY: 48,
        head: [["ຫົວຂໍ້", "ຂໍ້ມູນ"]],
        body: [
            ["ຊື່ເຄື່ອງ (Hostname)", computer.hostname],
            ["ໄອພີ (IP Address)", computer.ipAddress],
            ["ແມັກ (MAC Address)", computer.macAddress || "ບໍ່ມີຂໍ້ມູນ"],
            ["ລຸ້ນ OS (OS Version)", computer.osVersion || "ບໍ່ມີຂໍ້ມູນ"],
            ["ພະແນກ (Department)", computer.department || "ທົ່ວໄປ"],
            ["ປ້າຍຊື່/ໝາຍເຫດ", computer.label || "-"],
        ],
        theme: "striped",
        headStyles: { fillColor: [79, 70, 229] }, // Accent color
    });

    if (report) {
        const finalY = (doc as any).lastAutoTable.finalY + 10;

        // System Metrics
        doc.setFontSize(14);
        doc.text("2. ຕົວຊີ້ວັດສຸຂະພາບລະບົບ", 14, finalY);

        autoTable(doc, {
            startY: finalY + 3,
            head: [["ຕົວຊີ້ວັດ", "ການໃຊ້ງານ", "ລາຍລະອຽດ"]],
            body: [
                ["ການໃຊ້ງານ CPU", `${report.cpuUsage.toFixed(1)}%`, `${report.cpuCores || "?"} ຄໍ @ ${report.cpuSpeed || "ບໍ່ມີຂໍ້ມູນ"}`],
                ["ການໃຊ້ງານ RAM", `${report.ramUsage.toFixed(1)}%`, `${(report.ramUsed / 1024 / 1024 / 1024).toFixed(2)} / ${(report.ramTotal / 1024 / 1024 / 1024).toFixed(2)} GB`],
                ["ການໃຊ້ງານ Disk", `${report.diskUsage.toFixed(1)}%`, `${(report.diskUsed / 1024 / 1024 / 1024).toFixed(2)} / ${(report.diskTotal / 1024 / 1024 / 1024).toFixed(2)} GB`],
                ["ໄລຍະເວລາເປີດເຄື່ອງ", report.uptime ? `${Math.floor(report.uptime / 86400)}ວ ${Math.floor((report.uptime % 86400) / 3600)}ຊ` : "ບໍ່ມີຂໍ້ມູນ", "-"],
            ],
            theme: "grid",
            headStyles: { fillColor: [16, 185, 129] }, // Emerald color
        });

        // Top Processes
        if (report.topProcesses && report.topProcesses.length > 0) {
            const procY = (doc as any).lastAutoTable.finalY + 10;
            doc.setFontSize(14);
            doc.text("3. ໂປຣເຊສທີ່ໃຊ້ CPU ສູງສຸດ", 14, procY);

            autoTable(doc, {
                startY: procY + 3,
                head: [["ຊື່ໂປຣເຊສ", "CPU %", "ໜ່ວຍຄວາມຈຳ (MB)"]],
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
        doc.text("4. ການແຈ້ງເຕືອນຫຼ້າສຸດ", 14, (doc as any).lastAutoTable.finalY > 250 ? 22 : alertsY);

        autoTable(doc, {
            startY: (doc as any).lastAutoTable.finalY > 250 ? 25 : alertsY + 3,
            head: [["ວັນທີ", "ລະດັບ", "ຂໍ້ຄວາມ", "ສະຖານະ"]],
            body: computer.alerts.slice(0, 10).map(a => [
                new Date(a.createdAt).toLocaleDateString(),
                a.severity.toUpperCase(),
                a.message,
                a.resolved ? "ແກ້ໄຂແລ້ວ" : "ຍັງບໍ່ໄດ້ແກ້ໄຂ"
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
            `ໜ້າ ${i} ຈາກ ${pageCount} - ເອກະສານລັບ - ລະບົບຕິດຕາມອຸປະກອນ IT`,
            doc.internal.pageSize.getWidth() / 2,
            doc.internal.pageSize.getHeight() - 10,
            { align: "center" }
        );
    }

    doc.save(`${computer.hostname}_health_report_${new Date().toISOString().split("T")[0]}.pdf`);
};

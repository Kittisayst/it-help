import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const computer = await prisma.computer.findUnique({
      where: { id },
      include: {
        reports: {
          orderBy: { createdAt: "desc" },
          take: 120,
        },
        alerts: {
          orderBy: { createdAt: "desc" },
          take: 50,
        },
      },
    });

    if (!computer) {
      return NextResponse.json({ error: "Computer not found" }, { status: 404 });
    }

    const now = new Date();
    const diffMin = (now.getTime() - new Date(computer.lastSeenAt).getTime()) / 1000 / 60;
    let status: "online" | "offline" | "warning" = "offline";
    if (diffMin < 2) status = "online";
    else if (diffMin < 5) status = "warning";

    const lastReport = computer.reports[0] || null;

    return NextResponse.json({
      id: computer.id,
      hostname: computer.hostname,
      ipAddress: computer.ipAddress,
      macAddress: computer.macAddress,
      osVersion: computer.osVersion,
      department: computer.department,
      label: computer.label,
      status,
      lastSeenAt: computer.lastSeenAt,
      createdAt: computer.createdAt,
      lastReport: lastReport
        ? {
            cpuUsage: lastReport.cpuUsage,
            cpuCores: lastReport.cpuCores,
            cpuSpeed: lastReport.cpuSpeed,
            cpuTemp: lastReport.cpuTemp,
            ramTotal: lastReport.ramTotal,
            ramUsed: lastReport.ramUsed,
            ramUsage: lastReport.ramUsage,
            diskTotal: lastReport.diskTotal,
            diskUsed: lastReport.diskUsed,
            diskUsage: lastReport.diskUsage,
            diskDetails: lastReport.diskDetails ? JSON.parse(lastReport.diskDetails) : null,
            networkUp: lastReport.networkUp,
            networkInfo: lastReport.networkInfo ? JSON.parse(lastReport.networkInfo) : null,
            osInfo: lastReport.osInfo ? JSON.parse(lastReport.osInfo) : null,
            uptime: lastReport.uptime,
            topProcesses: lastReport.topProcesses ? JSON.parse(lastReport.topProcesses) : null,
            eventLogs: lastReport.eventLogs ? JSON.parse(lastReport.eventLogs) : null,
            software: lastReport.software ? JSON.parse(lastReport.software) : null,
            antivirusStatus: lastReport.antivirusStatus,
            printers: lastReport.printers ? JSON.parse(lastReport.printers) : null,
            windowsLicense: lastReport.windowsLicense ? JSON.parse(lastReport.windowsLicense) : null,
            officeLicense: lastReport.officeLicense ? JSON.parse(lastReport.officeLicense) : null,
            startupPrograms: lastReport.startupPrograms ? JSON.parse(lastReport.startupPrograms) : null,
            sharedFolders: lastReport.sharedFolders ? JSON.parse(lastReport.sharedFolders) : null,
            usbDevices: lastReport.usbDevices ? JSON.parse(lastReport.usbDevices) : null,
            windowsUpdate: lastReport.windowsUpdate ? JSON.parse(lastReport.windowsUpdate) : null,
          }
        : null,
      history: computer.reports.map((r) => ({
        cpuUsage: r.cpuUsage,
        ramUsage: r.ramUsage,
        diskUsage: r.diskUsage,
        createdAt: r.createdAt,
      })),
      alerts: computer.alerts.map((a) => ({
        id: a.id,
        type: a.type,
        severity: a.severity,
        message: a.message,
        resolved: a.resolved,
        createdAt: a.createdAt,
      })),
    });
  } catch (error) {
    console.error("Get computer error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const data = await request.json();

    const computer = await prisma.computer.update({
      where: { id },
      data: {
        label: data.label,
        department: data.department,
      },
    });

    return NextResponse.json(computer);
  } catch (error) {
    console.error("Update computer error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await prisma.computer.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete computer error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

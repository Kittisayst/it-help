import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    const computers = await prisma.computer.findMany({
      include: {
        reports: {
          orderBy: { createdAt: "desc" },
          take: 1,
        },
      },
    });

    const now = new Date();
    let online = 0;
    let offline = 0;
    let warning = 0;
    let totalCpu = 0;
    let totalRam = 0;
    let totalDisk = 0;
    let reportCount = 0;

    computers.forEach((c) => {
      const diffMin = (now.getTime() - new Date(c.lastSeenAt).getTime()) / 1000 / 60;
      if (diffMin < 2) online++;
      else if (diffMin < 5) warning++;
      else offline++;

      const lastReport = c.reports[0];
      if (lastReport) {
        totalCpu += lastReport.cpuUsage;
        totalRam += lastReport.ramUsage;
        totalDisk += lastReport.diskUsage;
        reportCount++;
      }
    });

    const unresolvedAlerts = await prisma.alert.count({
      where: { resolved: false },
    });

    const recentAlerts = await prisma.alert.findMany({
      where: { resolved: false },
      include: {
        computer: {
          select: { hostname: true, ipAddress: true },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 10,
    });

    return NextResponse.json({
      totalComputers: computers.length,
      online,
      offline,
      warning,
      avgCpu: reportCount > 0 ? totalCpu / reportCount : 0,
      avgRam: reportCount > 0 ? totalRam / reportCount : 0,
      avgDisk: reportCount > 0 ? totalDisk / reportCount : 0,
      unresolvedAlerts,
      recentAlerts,
    });
  } catch (error) {
    console.error("Dashboard error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

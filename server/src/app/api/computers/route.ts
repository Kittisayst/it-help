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
        alerts: {
          where: { resolved: false },
          orderBy: { createdAt: "desc" },
          take: 5,
        },
      },
      orderBy: { lastSeenAt: "desc" },
    });

    const result = computers.map((c) => {
      const lastReport = c.reports[0] || null;
      const now = new Date();
      const diffMin = (now.getTime() - new Date(c.lastSeenAt).getTime()) / 1000 / 60;
      let status: "online" | "offline" | "warning" = "offline";
      if (diffMin < 2) status = "online";
      else if (diffMin < 5) status = "warning";

      return {
        id: c.id,
        hostname: c.hostname,
        ipAddress: c.ipAddress,
        macAddress: c.macAddress,
        osVersion: c.osVersion,
        department: c.department,
        label: c.label,
        status,
        lastSeenAt: c.lastSeenAt,
        createdAt: c.createdAt,
        lastReport: lastReport
          ? {
              cpuUsage: lastReport.cpuUsage,
              ramUsage: lastReport.ramUsage,
              diskUsage: lastReport.diskUsage,
              uptime: lastReport.uptime,
            }
          : null,
        unresolvedAlerts: c.alerts.length,
      };
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("List computers error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

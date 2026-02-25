import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "50", 10)));
    const search = searchParams.get("search") || "";
    const department = searchParams.get("department") || "";
    const group = searchParams.get("group") || "";

    const where: Record<string, unknown> = {};
    if (search) {
      where.OR = [
        { hostname: { contains: search } },
        { ipAddress: { contains: search } },
        { department: { contains: search } },
        { group: { contains: search } },
        { label: { contains: search } },
      ];
    }
    if (department && department !== "all") {
      where.department = department;
    }
    if (group && group !== "all") {
      where.group = group;
    }

    const [computers, total] = await Promise.all([
      prisma.computer.findMany({
        where,
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
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.computer.count({ where }),
    ]);

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
        group: c.group,
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

    return NextResponse.json({
      data: result,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error("List computers error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

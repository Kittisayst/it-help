import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const department = searchParams.get("department");

    const where: Record<string, unknown> = {};
    if (status) where.status = status;
    if (department) where.department = department;

    const computers = await prisma.computer.findMany({
      where,
      include: {
        _count: {
          select: { alerts: { where: { resolved: false } } },
        },
      },
      orderBy: { hostname: "asc" },
    });

    // Generate CSV
    const headers = [
      "Hostname",
      "IP Address",
      "MAC Address",
      "OS Version",
      "Department",
      "Tags",
      "Status",
      "Last Seen",
      "Active Alerts",
    ];

    const rows = computers.map((c) => {
      const minutesSinceLastSeen = (Date.now() - new Date(c.lastSeenAt).getTime()) / 1000 / 60;
      const status = minutesSinceLastSeen > 5 ? "offline" : c._count.alerts > 0 ? "warning" : "online";
      
      return [
        c.hostname,
        c.ipAddress,
        c.macAddress || "",
        c.osVersion || "",
        c.department || "",
        c.tags || "",
        status,
        new Date(c.lastSeenAt).toLocaleString(),
        c._count.alerts.toString(),
      ];
    });

    const csv = [
      headers.join(","),
      ...rows.map((row) =>
        row.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(",")
      ),
    ].join("\n");

    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="computers-${new Date().toISOString().split("T")[0]}.csv"`,
      },
    });
  } catch (error) {
    console.error("Export computers error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

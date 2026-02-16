import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const resolved = searchParams.get("resolved");
    const severity = searchParams.get("severity");

    const where: Record<string, unknown> = {};
    if (resolved === "false") where.resolved = false;
    if (resolved === "true") where.resolved = true;
    if (severity) where.severity = severity;

    const alerts = await prisma.alert.findMany({
      where,
      include: {
        computer: {
          select: { hostname: true, ipAddress: true, department: true },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 1000, // Limit to last 1000 alerts
    });

    // Generate CSV
    const headers = [
      "Created At",
      "Computer",
      "IP Address",
      "Department",
      "Type",
      "Severity",
      "Message",
      "Resolved",
      "Resolved At",
    ];

    const rows = alerts.map((a) => [
      new Date(a.createdAt).toLocaleString(),
      a.computer.hostname,
      a.computer.ipAddress,
      a.computer.department || "",
      a.type,
      a.severity,
      a.message,
      a.resolved ? "Yes" : "No",
      a.resolvedAt ? new Date(a.resolvedAt).toLocaleString() : "",
    ]);

    const csv = [
      headers.join(","),
      ...rows.map((row) =>
        row.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(",")
      ),
    ].join("\n");

    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="alerts-${new Date().toISOString().split("T")[0]}.csv"`,
      },
    });
  } catch (error) {
    console.error("Export alerts error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

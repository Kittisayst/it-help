import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const resolved = searchParams.get("resolved");
    const limit = parseInt(searchParams.get("limit") || "100");

    const where: Record<string, unknown> = {};
    if (resolved === "false") where.resolved = false;
    if (resolved === "true") where.resolved = true;

    const alerts = await prisma.alert.findMany({
      where,
      include: {
        computer: {
          select: { hostname: true, ipAddress: true, department: true },
        },
      },
      orderBy: { createdAt: "desc" },
      take: limit,
    });

    return NextResponse.json(alerts);
  } catch (error) {
    console.error("List alerts error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

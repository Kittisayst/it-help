import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "50", 10)));
    const resolved = searchParams.get("resolved");
    const search = searchParams.get("search") || "";

    const where: Record<string, unknown> = {};
    if (resolved === "false") where.resolved = false;
    if (resolved === "true") where.resolved = true;
    if (search) {
      where.OR = [
        { message: { contains: search } },
        { type: { contains: search } },
        { computer: { hostname: { contains: search } } },
      ];
    }

    const [alerts, total] = await Promise.all([
      prisma.alert.findMany({
        where,
        include: {
          computer: {
            select: { hostname: true, ipAddress: true, department: true },
          },
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.alert.count({ where }),
    ]);

    return NextResponse.json({
      data: alerts,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error("List alerts error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const scope = searchParams.get("scope") || "all";

    const where: Record<string, unknown> = {};
    if (scope === "active") where.resolved = false;
    if (scope === "resolved") where.resolved = true;

    const result = await prisma.alert.deleteMany({ where });
    return NextResponse.json({ success: true, deletedCount: result.count });
  } catch (error) {
    console.error("Clear alerts error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

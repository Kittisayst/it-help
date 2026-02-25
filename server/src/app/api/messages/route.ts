import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "50", 10)));
    const unreadOnly = searchParams.get("unread") === "true";
    const search = searchParams.get("search") || "";

    const where: Record<string, unknown> = {};
    if (unreadOnly) where.read = false;
    if (search) {
      where.OR = [
        { content: { contains: search } },
        { computer: { hostname: { contains: search } } },
      ];
    }

    const [messages, total, unreadCount] = await Promise.all([
      prisma.message.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          computer: {
            select: {
              id: true,
              hostname: true,
              department: true,
            },
          },
        },
      }),
      prisma.message.count({ where }),
      prisma.message.count({ where: { read: false } }),
    ]);

    return NextResponse.json({
      data: messages,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      unreadCount,
    });
  } catch (error) {
    console.error("List messages error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

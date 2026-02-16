import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const unreadOnly = searchParams.get("unread") === "true";
    const limit = parseInt(searchParams.get("limit") || "50");

    const where = unreadOnly ? { read: false } : {};

    const messages = await prisma.message.findMany({
      where,
      orderBy: { createdAt: "desc" },
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
    });

    const unreadCount = await prisma.message.count({
      where: { read: false },
    });

    return NextResponse.json({ messages, unreadCount });
  } catch (error) {
    console.error("List messages error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

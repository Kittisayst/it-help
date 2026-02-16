import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// POST /api/commands - Admin creates a command for a computer
export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    const { computerId, action, params } = data;

    if (!computerId || !action) {
      return NextResponse.json(
        { error: "Missing computerId or action" },
        { status: 400 }
      );
    }

    const computer = await prisma.computer.findUnique({
      where: { id: computerId },
    });

    if (!computer) {
      return NextResponse.json(
        { error: "Computer not found" },
        { status: 404 }
      );
    }

    const command = await prisma.command.create({
      data: {
        computerId,
        action,
        params: params ? JSON.stringify(params) : null,
        status: "pending",
      },
    });

    return NextResponse.json(command);
  } catch (error) {
    console.error("Create command error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// GET /api/commands - List commands (with optional filters)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const computerId = searchParams.get("computerId");
    const status = searchParams.get("status");

    const where: Record<string, unknown> = {};
    if (computerId) where.computerId = computerId;
    if (status) where.status = status;

    const commands = await prisma.command.findMany({
      where,
      include: {
        computer: {
          select: { hostname: true, ipAddress: true },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    return NextResponse.json(commands);
  } catch (error) {
    console.error("List commands error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

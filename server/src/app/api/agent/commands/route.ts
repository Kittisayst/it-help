import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// GET /api/agent/commands?hostname=XXX - Agent polls for pending commands
export async function GET(request: NextRequest) {
  try {
    const apiKey = request.headers.get("x-api-key");
    if (!apiKey) {
      return NextResponse.json({ error: "Missing API key" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const hostname = searchParams.get("hostname");

    if (!hostname) {
      return NextResponse.json(
        { error: "Missing hostname" },
        { status: 400 }
      );
    }

    // Find computer by hostname
    const computer = await prisma.computer.findUnique({
      where: { hostname },
    });

    if (!computer) {
      return NextResponse.json([]);
    }

    // Get pending commands
    const commands = await prisma.command.findMany({
      where: {
        computerId: computer.id,
        status: "pending",
      },
      orderBy: { createdAt: "asc" },
    });

    // Mark them as "executing" so they aren't fetched again
    for (const cmd of commands) {
      await prisma.command.update({
        where: { id: cmd.id },
        data: { status: "executing" },
      });
    }

    return NextResponse.json(commands);
  } catch (error) {
    console.error("Agent poll commands error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

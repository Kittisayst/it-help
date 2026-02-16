import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// POST /api/agent/commands/[id]/result - Agent reports command execution result
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const apiKey = request.headers.get("x-api-key");
    if (!apiKey) {
      return NextResponse.json({ error: "Missing API key" }, { status: 401 });
    }

    const { id } = await params;
    const data = await request.json();
    const { success, output } = data;

    const command = await prisma.command.findUnique({
      where: { id },
    });

    if (!command) {
      return NextResponse.json(
        { error: "Command not found" },
        { status: 404 }
      );
    }

    await prisma.command.update({
      where: { id },
      data: {
        status: success ? "completed" : "failed",
        result: output ? output.substring(0, 5000) : null,
        executedAt: new Date(),
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Command result error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

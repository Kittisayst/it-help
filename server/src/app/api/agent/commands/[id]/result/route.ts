import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { validateAgentKey, unauthorizedResponse } from "@/lib/agent-auth";
import { emitToComputer } from "@/lib/socket";

// POST /api/agent/commands/[id]/result - Agent reports command execution result
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const computer = await validateAgentKey(request);
    if (!computer) {
      return unauthorizedResponse();
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

    const updated = await prisma.command.update({
      where: { id },
      data: {
        status: success ? "completed" : "failed",
        result: output ? output.substring(0, 5000) : null,
        executedAt: new Date(),
      },
    });

    emitToComputer(command.computerId, "command:result", updated);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Command result error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

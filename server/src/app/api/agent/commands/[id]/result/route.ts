import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { validateAgentKey, unauthorizedResponse } from "@/lib/agent-auth";
import { emitToComputer } from "@/lib/socket";
import { CommandResultSchema } from "@/lib/schemas";
import { isRateLimited, rateLimitResponse } from "@/lib/rate-limit";

// POST /api/agent/commands/[id]/result - Agent reports command execution result
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const ip = request.headers.get("x-forwarded-for") || "unknown";
  if (isRateLimited(ip, 60)) { // Commands can be more frequent during bursts
    return rateLimitResponse();
  }
  try {
    const computer = await validateAgentKey(request);
    if (!computer) {
      return unauthorizedResponse();
    }

    const { id } = await params;
    const json = await request.json();
    const result = CommandResultSchema.safeParse(json);

    if (!result.success) {
      return NextResponse.json(
        { error: "Invalid payload", details: result.error.format() },
        { status: 400 }
      );
    }

    const { success, output } = result.data;

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

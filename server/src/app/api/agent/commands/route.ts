import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { validateAgentByHostname, unauthorizedResponse } from "@/lib/agent-auth";

// GET /api/agent/commands?hostname=XXX - Agent polls for pending commands
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const hostname = searchParams.get("hostname");

    if (!hostname) {
      return NextResponse.json(
        { error: "Missing hostname" },
        { status: 400 }
      );
    }

    const computer = await validateAgentByHostname(request, hostname);
    if (!computer) {
      return unauthorizedResponse();
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

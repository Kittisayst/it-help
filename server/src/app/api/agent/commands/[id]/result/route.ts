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

    const { success, output, screenshot } = result.data;

    const command = await prisma.command.findUnique({
      where: { id },
    });

    if (!command) {
      return NextResponse.json(
        { error: "Command not found" },
        { status: 404 }
      );
    }

    // Handle screenshot saving
    let imagePath: string | null = null;
    if (success && screenshot && command.action === "screenshot") {
      try {
        const fs = await import("fs/promises");
        const path = await import("path");
        const crypto = await import("crypto");

        const buffer = Buffer.from(screenshot, "base64");
        const filename = `${command.computerId}_${Date.now()}_${crypto.randomBytes(4).toString("hex")}.png`;
        const uploadDir = path.join(process.cwd(), "public", "screenshots");

        await fs.mkdir(uploadDir, { recursive: true });
        await fs.writeFile(path.join(uploadDir, filename), buffer);

        imagePath = `/screenshots/${filename}`;

        // Create screenshot record
        await prisma.screenshot.create({
          data: {
            computerId: command.computerId,
            imagePath: imagePath,
          },
        });
      } catch (e) {
        console.error("Screenshot saving failed:", e);
      }
    }

    const updated = await prisma.command.update({
      where: { id },
      data: {
        status: success ? "completed" : "failed",
        result: imagePath || (output ? output.substring(0, 5000) : null),
        executedAt: new Date(),
      },
    });

    emitToComputer(command.computerId, "command:result", updated);
    if (imagePath) emitToComputer(command.computerId, "screenshot:new", { computerId: command.computerId, imagePath });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Command result error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

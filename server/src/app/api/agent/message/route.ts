import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { validateAgentByHostname, unauthorizedResponse } from "@/lib/agent-auth";
import { AgentMessageSchema } from "@/lib/schemas";
import { isRateLimited, rateLimitResponse } from "@/lib/rate-limit";

export async function POST(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for") || "unknown";
  if (isRateLimited(ip)) {
    return rateLimitResponse();
  }
  try {
    const json = await request.json();
    const result = AgentMessageSchema.safeParse(json);

    if (!result.success) {
      return NextResponse.json(
        { error: "Invalid payload", details: result.error.format() },
        { status: 400 }
      );
    }

    const { hostname, department, message, ip_address } = result.data;

    // Validate agent key against hostname
    const computer = await validateAgentByHostname(request, hostname);
    const computerId = computer?.id || null;

    const msg = await prisma.message.create({
      data: {
        computerId,
        hostname,
        department: department || "General",
        ipAddress: ip_address || "",
        message,
      },
    });

    return NextResponse.json({
      success: true,
      messageId: msg.id,
    });
  } catch (error) {
    console.error("Message API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

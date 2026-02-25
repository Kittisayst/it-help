import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { validateAgentByHostname, unauthorizedResponse } from "@/lib/agent-auth";

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    const { hostname, department, message, ip_address } = data;

    if (!hostname || !message) {
      return NextResponse.json(
        { error: "Missing hostname or message" },
        { status: 400 }
      );
    }

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

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function POST(request: NextRequest) {
  try {
    const apiKey = request.headers.get("x-api-key");
    if (!apiKey) {
      return NextResponse.json({ error: "Missing API key" }, { status: 401 });
    }

    const data = await request.json();
    const { hostname, department, message, ip_address } = data;

    if (!hostname || !message) {
      return NextResponse.json(
        { error: "Missing hostname or message" },
        { status: 400 }
      );
    }

    // Find computer by hostname (optional link)
    let computerId: string | null = null;
    try {
      const computer = await prisma.computer.findUnique({
        where: { hostname },
      });
      if (computer) {
        computerId = computer.id;
      }
    } catch {
      // Computer not found, continue without linking
    }

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

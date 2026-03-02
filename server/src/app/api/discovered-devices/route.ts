import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const showAll = searchParams.get("showAll") === "true";
    const onlyUnsaved = searchParams.get("onlyUnsaved") === "true";
    const recentHours = parseInt(searchParams.get("recentHours") || "24");

    const where: Record<string, unknown> = {};

    // Filter by saved status
    if (onlyUnsaved) {
      where.isSaved = false;
    }

    // Filter by recent devices
    if (!showAll) {
      const cutoffTime = new Date();
      cutoffTime.setHours(cutoffTime.getHours() - recentHours);
      where.lastSeenAt = { gte: cutoffTime };
    }

    const devices = await prisma.discoveredDevice.findMany({
      where,
      orderBy: { lastSeenAt: "desc" },
    });

    return NextResponse.json({
      data: devices,
      total: devices.length,
    });
  } catch (error) {
    console.error("Get discovered devices error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Mark devices as saved
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { deviceIds } = body;

    if (!deviceIds || !Array.isArray(deviceIds)) {
      return NextResponse.json(
        { error: "ກະລຸນາໃສ່ deviceIds" },
        { status: 400 }
      );
    }

    await prisma.discoveredDevice.updateMany({
      where: { id: { in: deviceIds } },
      data: { isSaved: true },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Mark devices as saved error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

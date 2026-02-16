import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { sendLineNotify } from "@/lib/line-notify";

// GET /api/settings/notify - Get notification config
export async function GET() {
  try {
    let config = await prisma.notifyConfig.findUnique({
      where: { id: "default" },
    });

    if (!config) {
      config = await prisma.notifyConfig.create({
        data: { id: "default" },
      });
    }

    // Mask the token for security
    const masked = {
      ...config,
      lineToken: config.lineToken
        ? config.lineToken.substring(0, 6) + "..." + config.lineToken.slice(-4)
        : "",
      hasToken: !!config.lineToken,
    };

    return NextResponse.json(masked);
  } catch (error) {
    console.error("Get notify config error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST /api/settings/notify - Update notification config
export async function POST(request: NextRequest) {
  try {
    const data = await request.json();

    const updateData: Record<string, unknown> = {};

    if (typeof data.enabled === "boolean") updateData.enabled = data.enabled;
    if (typeof data.lineToken === "string" && data.lineToken.trim()) {
      updateData.lineToken = data.lineToken.trim();
    }
    if (typeof data.cpuThreshold === "number") updateData.cpuThreshold = data.cpuThreshold;
    if (typeof data.ramThreshold === "number") updateData.ramThreshold = data.ramThreshold;
    if (typeof data.diskThreshold === "number") updateData.diskThreshold = data.diskThreshold;
    if (typeof data.notifyOffline === "boolean") updateData.notifyOffline = data.notifyOffline;
    if (typeof data.notifyEventLog === "boolean") updateData.notifyEventLog = data.notifyEventLog;
    if (typeof data.cooldownMinutes === "number") updateData.cooldownMinutes = data.cooldownMinutes;

    const config = await prisma.notifyConfig.upsert({
      where: { id: "default" },
      update: updateData,
      create: { id: "default", ...updateData },
    });

    return NextResponse.json({ success: true, config });
  } catch (error) {
    console.error("Update notify config error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PUT /api/settings/notify - Test LINE notification
export async function PUT() {
  try {
    const config = await prisma.notifyConfig.findUnique({
      where: { id: "default" },
    });

    if (!config || !config.lineToken) {
      return NextResponse.json(
        { error: "LINE token not configured" },
        { status: 400 }
      );
    }

    const success = await sendLineNotify(
      config.lineToken,
      "\n🧪 IT Monitor - Test Notification\nThis is a test message from IT Monitor Server."
    );

    if (success) {
      return NextResponse.json({ success: true, message: "Test notification sent!" });
    } else {
      return NextResponse.json(
        { error: "Failed to send. Check your LINE token." },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error("Test notify error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

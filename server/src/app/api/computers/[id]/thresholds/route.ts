import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// GET /api/computers/[id]/thresholds - Get thresholds for a computer
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const threshold = await prisma.alertThreshold.findUnique({
      where: { computerId: id },
    });

    if (!threshold) {
      // Return defaults if not set
      return NextResponse.json({
        cpuThreshold: 90,
        ramThreshold: 85,
        diskThreshold: 90,
        eventLogErrors: true,
      });
    }

    return NextResponse.json({
      cpuThreshold: threshold.cpuThreshold,
      ramThreshold: threshold.ramThreshold,
      diskThreshold: threshold.diskThreshold,
      eventLogErrors: threshold.eventLogErrors,
    });
  } catch (error) {
    console.error("Get thresholds error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PUT /api/computers/[id]/thresholds - Update thresholds for a computer
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const data = await request.json();
    const { cpuThreshold, ramThreshold, diskThreshold, eventLogErrors } = data;

    const threshold = await prisma.alertThreshold.upsert({
      where: { computerId: id },
      update: {
        cpuThreshold: cpuThreshold ?? 90,
        ramThreshold: ramThreshold ?? 85,
        diskThreshold: diskThreshold ?? 90,
        eventLogErrors: eventLogErrors ?? true,
      },
      create: {
        computerId: id,
        cpuThreshold: cpuThreshold ?? 90,
        ramThreshold: ramThreshold ?? 85,
        diskThreshold: diskThreshold ?? 90,
        eventLogErrors: eventLogErrors ?? true,
      },
    });

    const session = await getServerSession(authOptions);
    if (session) {
      await prisma.auditLog.create({
        data: {
          userId: (session.user as any)?.id,
          action: "UPDATE_THRESHOLDS",
          details: `Updated thresholds: CPU(${threshold.cpuThreshold}%), RAM(${threshold.ramThreshold}%), Disk(${threshold.diskThreshold}%)`,
          computerId: id,
        },
      });
    }

    return NextResponse.json({
      cpuThreshold: threshold.cpuThreshold,
      ramThreshold: threshold.ramThreshold,
      diskThreshold: threshold.diskThreshold,
      eventLogErrors: threshold.eventLogErrors,
    });
  } catch (error) {
    console.error("Update thresholds error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

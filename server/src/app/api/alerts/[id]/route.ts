import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const data = await request.json();

    const alert = await prisma.alert.update({
      where: { id },
      data: {
        resolved: data.resolved ?? true,
        resolvedAt: data.resolved ? new Date() : null,
      },
      include: { computer: true },
    });

    const session = await getServerSession(authOptions);
    if (session && data.resolved) {
      await prisma.auditLog.create({
        data: {
          userId: (session.user as any)?.id,
          action: "RESOLVE_ALERT",
          details: `Resolved alert: ${alert.message}`,
          computerId: alert.computerId,
        },
      });
    }

    return NextResponse.json(alert);
  } catch (error) {
    console.error("Update alert error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

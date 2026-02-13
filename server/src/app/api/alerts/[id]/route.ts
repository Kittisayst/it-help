import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

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
    });

    return NextResponse.json(alert);
  } catch (error) {
    console.error("Update alert error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

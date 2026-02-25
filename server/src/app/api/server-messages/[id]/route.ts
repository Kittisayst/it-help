import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { delivered } = await request.json();

    const message = await prisma.serverMessage.update({
      where: { id },
      data: {
        delivered,
        deliveredAt: delivered ? new Date() : null,
      },
    });

    return NextResponse.json(message);
  } catch (error) {
    console.error("Update server message error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

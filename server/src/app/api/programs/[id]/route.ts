import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const name = body.name ? String(body.name).trim() : undefined;
    const description = body.description ? String(body.description).trim() : undefined;
    const programPath = body.programPath ? String(body.programPath).trim() : undefined;
    const imageUrl = body.imageUrl === "" ? null : body.imageUrl ? String(body.imageUrl).trim() : undefined;
    const downloadUrl =
      body.downloadUrl === "" ? null : body.downloadUrl ? String(body.downloadUrl).trim() : undefined;

    const program = await prisma.program.update({
      where: { id },
      data: {
        ...(name !== undefined ? { name } : {}),
        ...(description !== undefined ? { description } : {}),
        ...(programPath !== undefined ? { programPath } : {}),
        ...(imageUrl !== undefined ? { imageUrl } : {}),
        ...(downloadUrl !== undefined ? { downloadUrl } : {}),
      },
    });

    return NextResponse.json(program);
  } catch (error) {
    console.error("Update program error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await prisma.program.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete program error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

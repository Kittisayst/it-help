import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    const programs = await prisma.program.findMany({
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(programs);
  } catch (error) {
    console.error("List programs error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const name = String(body.name || "").trim();
    const description = String(body.description || "").trim();
    const programPath = String(body.programPath || "").trim();
    const imageUrl = body.imageUrl ? String(body.imageUrl).trim() : null;
    const downloadUrl = body.downloadUrl ? String(body.downloadUrl).trim() : null;

    if (!name || !description || !programPath) {
      return NextResponse.json(
        { error: "name, description and programPath are required" },
        { status: 400 }
      );
    }

    const program = await prisma.program.create({
      data: {
        name,
        description,
        programPath,
        imageUrl,
        downloadUrl,
      },
    });

    return NextResponse.json(program, { status: 201 });
  } catch (error) {
    console.error("Create program error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import fs from "fs/promises";
import path from "path";

export const runtime = "nodejs";

function sanitizeFileName(name: string) {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_");
}

function toPublicDownloadUrl(downloadUrl: string | null, programPath: string) {
  if (downloadUrl) {
    if (downloadUrl.startsWith("http://") || downloadUrl.startsWith("https://") || downloadUrl.startsWith("/")) {
      return downloadUrl;
    }
    return `/${downloadUrl}`;
  }

  const filename = path.basename(programPath || "");
  if (filename) {
    return `/downloads/programs/${filename}`;
  }

  return null;
}

export async function GET() {
  try {
    const programs = await prisma.program.findMany({
      orderBy: { createdAt: "desc" },
    });

    const normalized = programs.map((p) => ({
      ...p,
      downloadUrl: toPublicDownloadUrl(p.downloadUrl, p.programPath),
    }));

    return NextResponse.json(normalized);
  } catch (error) {
    console.error("List programs error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, description, imageUrl, fileName } = body;

    if (!name || !description || !fileName) {
      return NextResponse.json(
        { error: "name, description and fileName are required" },
        { status: 400 }
      );
    }

    // Verify file exists in public/downloads/programs
    const programsDir = path.join(process.cwd(), "public", "downloads", "programs");
    const absoluteFilePath = path.join(programsDir, fileName);
    
    try {
      await fs.access(absoluteFilePath);
    } catch {
      return NextResponse.json(
        { error: "File not found in public/downloads/programs" },
        { status: 404 }
      );
    }

    // programPath and downloadUrl are the same (relative to public folder)
    const programPath = absoluteFilePath;
    const downloadUrl = `/downloads/programs/${fileName}`;

    const program = await prisma.program.create({
      data: {
        name,
        description,
        programPath,
        imageUrl: imageUrl || null,
        downloadUrl,
      },
    });

    return NextResponse.json(program, { status: 201 });
  } catch (error) {
    console.error("Create program error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

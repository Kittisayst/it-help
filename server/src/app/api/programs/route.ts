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
    const formData = await request.formData();
    const name = String(formData.get("name") || "").trim();
    const description = String(formData.get("description") || "").trim();
    const imageUrlRaw = String(formData.get("imageUrl") || "").trim();
    const imageUrl = imageUrlRaw ? imageUrlRaw : null;
    const file = formData.get("programFile");

    if (!name || !description || !(file instanceof File)) {
      return NextResponse.json(
        { error: "name, description and program file are required" },
        { status: 400 }
      );
    }

    if (!file.name) {
      return NextResponse.json({ error: "Invalid program file" }, { status: 400 });
    }

    const uploadsDir = path.join(process.cwd(), "public", "downloads", "programs");
    await fs.mkdir(uploadsDir, { recursive: true });

    const safeName = sanitizeFileName(file.name);
    const storedName = `${Date.now()}-${safeName}`;
    const absoluteFilePath = path.join(uploadsDir, storedName);
    const fileBuffer = Buffer.from(await file.arrayBuffer());
    await fs.writeFile(absoluteFilePath, fileBuffer);

    const programPath = absoluteFilePath;
    const downloadUrl = `/downloads/programs/${storedName}`;

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

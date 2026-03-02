import { NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";

export const runtime = "nodejs";

export async function GET() {
  try {
    const programsDir = path.join(process.cwd(), "public", "downloads", "programs");
    
    // Create directory if it doesn't exist
    try {
      await fs.mkdir(programsDir, { recursive: true });
    } catch (error) {
      // Directory might already exist
    }

    const files = await fs.readdir(programsDir);
    
    // Filter for program files only
    const programFiles = files.filter((file) => {
      const ext = path.extname(file).toLowerCase();
      return [".exe", ".msi", ".zip", ".rar", ".7z", ".bat", ".cmd"].includes(ext);
    });

    // Get file stats
    const filesWithStats = await Promise.all(
      programFiles.map(async (file) => {
        const filePath = path.join(programsDir, file);
        const stats = await fs.stat(filePath);
        return {
          name: file,
          size: stats.size,
          modifiedAt: stats.mtime,
        };
      })
    );

    // Sort by modified date (newest first)
    filesWithStats.sort((a, b) => b.modifiedAt.getTime() - a.modifiedAt.getTime());

    return NextResponse.json(filesWithStats);
  } catch (error) {
    console.error("List program files error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

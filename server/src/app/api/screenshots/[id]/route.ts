import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import fs from "fs/promises";
import path from "path";

// DELETE /api/screenshots/[id] - Delete a specific screenshot
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await getServerSession(authOptions);
    if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const { id } = await params;

        const screenshot = await prisma.screenshot.findUnique({
            where: { id },
        });

        if (!screenshot) {
            return NextResponse.json({ error: "Screenshot not found" }, { status: 404 });
        }

        // Delete file
        try {
            const filePath = path.join(process.cwd(), "public", screenshot.imagePath);
            await fs.unlink(filePath);
        } catch (e) {
            console.warn(`Failed to delete file: ${screenshot.imagePath}`, e);
        }

        // Delete record
        await prisma.screenshot.delete({
            where: { id },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Delete screenshot error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

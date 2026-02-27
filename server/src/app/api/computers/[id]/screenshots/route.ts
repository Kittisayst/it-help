import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import fs from "fs/promises";
import path from "path";

// GET /api/computers/[id]/screenshots - List screenshots for a computer
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await getServerSession(authOptions);
    if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const { id } = await params;
        const screenshots = await prisma.screenshot.findMany({
            where: { computerId: id },
            orderBy: { createdAt: "desc" },
        });

        return NextResponse.json(screenshots);
    } catch (error) {
        console.error("Fetch screenshots error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

// DELETE /api/computers/[id]/screenshots - Delete all screenshots for a computer
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

        // Find all screenshots to delete files
        const screenshots = await prisma.screenshot.findMany({
            where: { computerId: id },
        });

        for (const ss of screenshots) {
            try {
                const filePath = path.join(process.cwd(), "public", ss.imagePath);
                await fs.unlink(filePath);
            } catch (e) {
                console.warn(`Failed to delete file: ${ss.imagePath}`, e);
            }
        }

        await prisma.screenshot.deleteMany({
            where: { computerId: id },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Delete screenshots error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "50", 10)));
    const action = searchParams.get("action") || "";
    const search = searchParams.get("search") || "";

    const where: Record<string, unknown> = {};
    if (action) where.action = action;
    if (search) {
      where.OR = [
        { action: { contains: search } },
        { details: { contains: search } },
        { ipAddress: { contains: search } },
      ];
    }

    // Use raw SQL to bypass TypeScript issues
    const offset = (page - 1) * limit;
    
    let whereClause = "WHERE 1=1";
    const params: any[] = [];
    
    if (action) {
      whereClause += " AND action = ?";
      params.push(action);
    }
    if (search) {
      whereClause += " AND (action LIKE ? OR details LIKE ? OR ipAddress LIKE ?)";
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm, searchTerm);
    }
    
    const [logs, totalResult] = await Promise.all([
      prisma.$queryRawUnsafe(
        `SELECT id, action, details, ipAddress, userAgent, createdAt, userId, computerId 
         FROM audit_log ${whereClause} 
         ORDER BY createdAt DESC 
         LIMIT ? OFFSET ?`,
        ...params,
        limit,
        offset
      ),
      prisma.$queryRawUnsafe(
        `SELECT COUNT(*) as count FROM audit_log ${whereClause}`,
        ...params
      )
    ]);

    const total = Number((totalResult as any[])[0]?.count || 0);

    return NextResponse.json({
      data: logs,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error("List audit logs error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

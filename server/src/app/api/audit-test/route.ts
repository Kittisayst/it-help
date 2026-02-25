import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    // Try raw query to check if table exists
    const result = await prisma.$queryRaw`SHOW TABLES LIKE 'audit_log'`;
    
    return NextResponse.json({ 
      message: "Audit log table check",
      result 
    });
  } catch (error) {
    console.error("Audit test error:", error);
    return NextResponse.json({ 
      error: "Internal server error",
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}

import { prisma } from "@/lib/db";
import { headers } from "next/headers";

function generateId(): string {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

interface AuditLogOptions {
  userId?: string;
  action: string;
  details?: string;
  computerId?: string;
}

export async function logAudit(options: AuditLogOptions) {
  try {
    const headersList = await headers();
    const ipAddress = headersList.get("x-forwarded-for") || 
                    headersList.get("x-real-ip") || 
                    "unknown";
    const userAgent = headersList.get("user-agent") || "unknown";

    const id = generateId();
    await prisma.$executeRaw`
      INSERT INTO audit_log (id, userId, action, details, ipAddress, userAgent, computerId, createdAt)
      VALUES (${id}, ${options.userId}, ${options.action}, ${options.details}, ${ipAddress}, ${userAgent}, ${options.computerId}, NOW())
    `;
  } catch (error) {
    console.error("Failed to log audit:", error);
    // Don't throw error to avoid breaking main functionality
  }
}

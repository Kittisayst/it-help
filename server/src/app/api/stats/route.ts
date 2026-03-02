import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    const [
      computersCount,
      alertsCount,
      messagesCount,
      networkDevicesCount,
      unreadMessagesCount,
      activeAlertsCount,
    ] = await Promise.all([
      // Total computers
      prisma.computer.count(),
      
      // Total alerts (last 7 days)
      prisma.alert.count({
        where: {
          createdAt: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          },
        },
      }),
      
      // Total messages (last 7 days)
      prisma.message.count({
        where: {
          createdAt: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          },
        },
      }),
      
      // Total network devices
      prisma.networkDevice.count(),
      
      // Unread messages
      prisma.message.count({
        where: { read: false },
      }),
      
      // Active alerts (last 24 hours)
      prisma.alert.count({
        where: {
          createdAt: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000),
          },
        },
      }),
    ]);

    return NextResponse.json({
      computers: computersCount,
      alerts: alertsCount,
      messages: messagesCount,
      networkDevices: networkDevicesCount,
      unreadMessages: unreadMessagesCount,
      activeAlerts: activeAlertsCount,
    });
  } catch (error) {
    console.error("Get stats error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

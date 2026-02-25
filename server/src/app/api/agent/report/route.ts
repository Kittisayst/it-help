import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { unauthorizedResponse } from "@/lib/agent-auth";
import { emitToDashboard, emitToComputer } from "@/lib/socket";
import { AgentReportSchema } from "@/lib/schemas";
import { isRateLimited, rateLimitResponse } from "@/lib/rate-limit";

export async function POST(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for") || "unknown";
  if (isRateLimited(ip)) {
    return rateLimitResponse();
  }
  try {
    const apiKey = request.headers.get("x-api-key");
    if (!apiKey) {
      return unauthorizedResponse("Missing API key");
    }

    const json = await request.json();
    const result = AgentReportSchema.safeParse(json);

    if (!result.success) {
      return NextResponse.json(
        { error: "Invalid payload", details: result.error.format() },
        { status: 400 }
      );
    }

    const data = result.data;
    const { hostname, ip_address, mac_address, os_version, department } = data;

    // Find or create computer
    let computer = await prisma.computer.findUnique({ where: { hostname } });

    if (!computer) {
      // New computer — register with this API key
      computer = await prisma.computer.create({
        data: {
          hostname,
          ipAddress: ip_address || "unknown",
          macAddress: mac_address,
          osVersion: os_version,
          department: department || "General",
          apiKey,
        },
      });
    } else {
      // Existing computer — validate API key matches
      if (computer.apiKey !== apiKey) {
        return unauthorizedResponse("API key mismatch for this computer");
      }
      computer = await prisma.computer.update({
        where: { id: computer.id },
        data: {
          ipAddress: ip_address || computer.ipAddress,
          macAddress: mac_address || computer.macAddress,
          osVersion: os_version || computer.osVersion,
          department: department || computer.department,
          lastSeenAt: new Date(),
        },
      });
    }

    // Create report
    const report = await prisma.report.create({
      data: {
        computerId: computer.id,
        cpuUsage: data.cpu_usage || 0,
        cpuCores: data.cpu_cores,
        cpuSpeed: data.cpu_speed,
        cpuTemp: data.cpu_temp,
        ramTotal: data.ram_total || 0,
        ramUsed: data.ram_used || 0,
        ramUsage: data.ram_usage || 0,
        diskTotal: data.disk_total || 0,
        diskUsed: data.disk_used || 0,
        diskUsage: data.disk_usage || 0,
        diskDetails: data.disk_details ? JSON.stringify(data.disk_details) : null,
        networkUp: data.network_up !== false,
        networkInfo: data.network_info ? JSON.stringify(data.network_info) : null,
        osInfo: data.os_info ? JSON.stringify(data.os_info) : null,
        uptime: data.uptime,
        topProcesses: data.top_processes ? JSON.stringify(data.top_processes) : null,
        eventLogs: data.event_logs ? JSON.stringify(data.event_logs) : null,
        software: data.software ? JSON.stringify(data.software) : null,
        antivirusStatus: data.antivirus_status,
        printers: data.printers ? JSON.stringify(data.printers) : null,
        windowsLicense: data.windows_license ? JSON.stringify(data.windows_license) : null,
        officeLicense: data.office_license ? JSON.stringify(data.office_license) : null,
        startupPrograms: data.startup_programs ? JSON.stringify(data.startup_programs) : null,
        sharedFolders: data.shared_folders ? JSON.stringify(data.shared_folders) : null,
        usbDevices: data.usb_devices ? JSON.stringify(data.usb_devices) : null,
        windowsUpdate: data.windows_update ? JSON.stringify(data.windows_update) : null,
        services: data.services ? JSON.stringify(data.services) : null,
      },
    });

    // Get custom thresholds for this computer (fallback to defaults)
    const threshold = await prisma.alertThreshold.findUnique({
      where: { computerId: computer.id },
    });

    const cpuThreshold = threshold?.cpuThreshold ?? 90;
    const ramThreshold = threshold?.ramThreshold ?? 85;
    const diskThreshold = threshold?.diskThreshold ?? 90;
    const checkEventLogErrors = threshold?.eventLogErrors ?? true;

    // Check thresholds and create alerts (deduplicated by computer + type)
    const alerts: string[] = [];

    const upsertAlert = async (
      type: string,
      triggered: boolean,
      severity: "warning" | "critical",
      message: string
    ) => {
      if (triggered) {
        alerts.push(type.toUpperCase());
        const existing = await prisma.alert.findFirst({
          where: {
            computerId: computer.id,
            type,
            resolved: false,
          },
          orderBy: { createdAt: "desc" },
        });

        if (existing) {
          await prisma.alert.update({
            where: { id: existing.id },
            data: {
              message,
              severity,
              createdAt: new Date(),
            },
          });
        } else {
          await prisma.alert.create({
            data: {
              computerId: computer.id,
              type,
              severity,
              message,
            },
          });
        }
      } else {
        // Automatically resolve old alert of same type when issue is gone
        await prisma.alert.updateMany({
          where: {
            computerId: computer.id,
            type,
            resolved: false,
          },
          data: {
            resolved: true,
            resolvedAt: new Date(),
          },
        });
      }
    };

    await upsertAlert(
      "cpu_high",
      data.cpu_usage > cpuThreshold,
      "critical",
      `CPU usage is ${data.cpu_usage.toFixed(1)}% on ${hostname}`
    );

    await upsertAlert(
      "ram_high",
      data.ram_usage > ramThreshold,
      data.ram_usage > 95 ? "critical" : "warning",
      `RAM usage is ${data.ram_usage.toFixed(1)}% on ${hostname}`
    );

    await upsertAlert(
      "disk_high",
      data.disk_usage > diskThreshold,
      data.disk_usage > 95 ? "critical" : "warning",
      `Disk usage is ${data.disk_usage.toFixed(1)}% on ${hostname}`
    );

    if (checkEventLogErrors && data.event_logs && Array.isArray(data.event_logs)) {
      const errors = data.event_logs.filter(
        (log: { level: string }) => log.level === "Error" || log.level === "Critical"
      );
      await upsertAlert(
        "event_log_error",
        errors.length > 0,
        "warning",
        `${errors.length} error(s) found in Windows Event Log on ${hostname}`
      );
    } else {
      await upsertAlert(
        "event_log_error",
        false,
        "warning",
        `0 error(s) found in Windows Event Log on ${hostname}`
      );
    }

    // Clean up old reports (keep last 24 hours)
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    await prisma.report.deleteMany({
      where: {
        computerId: computer.id,
        createdAt: { lt: oneDayAgo },
      },
    });

    // Emit real-time updates
    emitToDashboard("computer:updated", {
      id: computer.id,
      hostname: computer.hostname,
      status: "online",
      cpuUsage: data.cpu_usage || 0,
      ramUsage: data.ram_usage || 0,
      diskUsage: data.disk_usage || 0,
      lastSeenAt: new Date().toISOString(),
    });

    emitToComputer(computer.id, "report:new", {
      reportId: report.id,
      computerId: computer.id,
    });

    if (alerts.length > 0) {
      emitToDashboard("alert:new", {
        computerId: computer.id,
        hostname: computer.hostname,
        alerts,
      });
    }

    return NextResponse.json({
      success: true,
      computerId: computer.id,
      reportId: report.id,
      alerts,
    });
  } catch (error) {
    console.error("Agent report error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

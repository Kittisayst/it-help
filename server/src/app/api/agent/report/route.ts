import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { unauthorizedResponse } from "@/lib/agent-auth";
import { emitToDashboard, emitToComputer } from "@/lib/socket";

export async function POST(request: NextRequest) {
  try {
    const apiKey = request.headers.get("x-api-key");
    if (!apiKey) {
      return unauthorizedResponse("Missing API key");
    }

    const data = await request.json();
    const { hostname, ip_address, mac_address, os_version, department, ...metrics } = data;

    if (!hostname) {
      return NextResponse.json({ error: "Missing hostname" }, { status: 400 });
    }

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
        cpuUsage: metrics.cpu_usage || 0,
        cpuCores: metrics.cpu_cores,
        cpuSpeed: metrics.cpu_speed,
        cpuTemp: metrics.cpu_temp,
        ramTotal: metrics.ram_total || 0,
        ramUsed: metrics.ram_used || 0,
        ramUsage: metrics.ram_usage || 0,
        diskTotal: metrics.disk_total || 0,
        diskUsed: metrics.disk_used || 0,
        diskUsage: metrics.disk_usage || 0,
        diskDetails: metrics.disk_details ? JSON.stringify(metrics.disk_details) : null,
        networkUp: metrics.network_up !== false,
        networkInfo: metrics.network_info ? JSON.stringify(metrics.network_info) : null,
        osInfo: metrics.os_info ? JSON.stringify(metrics.os_info) : null,
        uptime: metrics.uptime,
        topProcesses: metrics.top_processes ? JSON.stringify(metrics.top_processes) : null,
        eventLogs: metrics.event_logs ? JSON.stringify(metrics.event_logs) : null,
        software: metrics.software ? JSON.stringify(metrics.software) : null,
        antivirusStatus: metrics.antivirus_status,
        printers: metrics.printers ? JSON.stringify(metrics.printers) : null,
        windowsLicense: metrics.windows_license ? JSON.stringify(metrics.windows_license) : null,
        officeLicense: metrics.office_license ? JSON.stringify(metrics.office_license) : null,
        startupPrograms: metrics.startup_programs ? JSON.stringify(metrics.startup_programs) : null,
        sharedFolders: metrics.shared_folders ? JSON.stringify(metrics.shared_folders) : null,
        usbDevices: metrics.usb_devices ? JSON.stringify(metrics.usb_devices) : null,
        windowsUpdate: metrics.windows_update ? JSON.stringify(metrics.windows_update) : null,
        services: metrics.services ? JSON.stringify(metrics.services) : null,
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
      metrics.cpu_usage > cpuThreshold,
      "critical",
      `CPU usage is ${metrics.cpu_usage.toFixed(1)}% on ${hostname}`
    );

    await upsertAlert(
      "ram_high",
      metrics.ram_usage > ramThreshold,
      metrics.ram_usage > 95 ? "critical" : "warning",
      `RAM usage is ${metrics.ram_usage.toFixed(1)}% on ${hostname}`
    );

    await upsertAlert(
      "disk_high",
      metrics.disk_usage > diskThreshold,
      metrics.disk_usage > 95 ? "critical" : "warning",
      `Disk usage is ${metrics.disk_usage.toFixed(1)}% on ${hostname}`
    );

    if (checkEventLogErrors && metrics.event_logs && Array.isArray(metrics.event_logs)) {
      const errors = metrics.event_logs.filter(
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
      cpuUsage: metrics.cpu_usage || 0,
      ramUsage: metrics.ram_usage || 0,
      diskUsage: metrics.disk_usage || 0,
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

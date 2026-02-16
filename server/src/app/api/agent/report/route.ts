import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function POST(request: NextRequest) {
  try {
    const apiKey = request.headers.get("x-api-key");
    if (!apiKey) {
      return NextResponse.json({ error: "Missing API key" }, { status: 401 });
    }

    const data = await request.json();
    const { hostname, ip_address, mac_address, os_version, department, ...metrics } = data;

    if (!hostname) {
      return NextResponse.json({ error: "Missing hostname" }, { status: 400 });
    }

    // Find or create computer
    let computer = await prisma.computer.findUnique({ where: { hostname } });

    if (!computer) {
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

    // Check thresholds and create alerts
    const alerts: string[] = [];

    if (metrics.cpu_usage > 90) {
      alerts.push("CPU");
      await prisma.alert.create({
        data: {
          computerId: computer.id,
          type: "cpu_high",
          severity: "critical",
          message: `CPU usage is ${metrics.cpu_usage.toFixed(1)}% on ${hostname}`,
        },
      });
    }

    if (metrics.ram_usage > 85) {
      alerts.push("RAM");
      await prisma.alert.create({
        data: {
          computerId: computer.id,
          type: "ram_high",
          severity: metrics.ram_usage > 95 ? "critical" : "warning",
          message: `RAM usage is ${metrics.ram_usage.toFixed(1)}% on ${hostname}`,
        },
      });
    }

    if (metrics.disk_usage > 90) {
      alerts.push("DISK");
      await prisma.alert.create({
        data: {
          computerId: computer.id,
          type: "disk_high",
          severity: metrics.disk_usage > 95 ? "critical" : "warning",
          message: `Disk usage is ${metrics.disk_usage.toFixed(1)}% on ${hostname}`,
        },
      });
    }

    if (metrics.event_logs && Array.isArray(metrics.event_logs)) {
      const errors = metrics.event_logs.filter(
        (log: { level: string }) => log.level === "Error" || log.level === "Critical"
      );
      if (errors.length > 0) {
        alerts.push("EVENT_LOG");
        await prisma.alert.create({
          data: {
            computerId: computer.id,
            type: "event_log_error",
            severity: "warning",
            message: `${errors.length} error(s) found in Windows Event Log on ${hostname}`,
          },
        });
      }
    }

    // Clean up old reports (keep last 24 hours)
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    await prisma.report.deleteMany({
      where: {
        computerId: computer.id,
        createdAt: { lt: oneDayAgo },
      },
    });

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

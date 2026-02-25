import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const computer = await prisma.computer.findUnique({
      where: { id },
      include: {
        reports: {
          orderBy: { createdAt: "desc" },
          take: 1,
        },
        alerts: {
          orderBy: { createdAt: "desc" },
          take: 20,
        },
      },
    });

    if (!computer) {
      return NextResponse.json({ error: "Computer not found" }, { status: 404 });
    }

    const lastReport = computer.reports[0];
    
    // Generate CSV content
    const csv = [
      'Computer Details Report',
      '',
      `Generated: ${new Date().toLocaleString()}`,
      '',
      '=== Basic Information ===',
      `Hostname: ${computer.hostname}`,
      `IP Address: ${computer.ipAddress}`,
      `MAC Address: ${computer.macAddress || 'N/A'}`,
      `OS Version: ${computer.osVersion || 'N/A'}`,
      `Department: ${computer.department}`,
      `Group: ${computer.group || 'General'}`,
      `Label: ${computer.label || 'N/A'}`,
      `Status: ${computer.lastSeenAt ? 
        ((Date.now() - new Date(computer.lastSeenAt).getTime()) / 1000 / 60 < 2 ? 'Online' :
         (Date.now() - new Date(computer.lastSeenAt).getTime()) / 1000 / 60 < 5 ? 'Warning' : 'Offline') : 'Unknown'}`,
      `Last Seen: ${computer.lastSeenAt?.toLocaleString() || 'N/A'}`,
      `Created: ${computer.createdAt.toLocaleString()}`,
      '',
      '=== System Metrics ===',
    ];

    if (lastReport) {
      csv.push(
        `CPU Usage: ${lastReport.cpuUsage.toFixed(1)}%`,
        `CPU Cores: ${lastReport.cpuCores || 'N/A'}`,
        `CPU Speed: ${lastReport.cpuSpeed || 'N/A'}`,
        `CPU Temperature: ${lastReport.cpuTemp ? `${lastReport.cpuTemp}°C` : 'N/A'}`,
        '',
        `Memory Usage: ${lastReport.ramUsage.toFixed(1)}%`,
        `Memory Used: ${(lastReport.ramUsed / 1024 / 1024 / 1024).toFixed(2)} GB`,
        `Memory Total: ${(lastReport.ramTotal / 1024 / 1024 / 1024).toFixed(2)} GB`,
        '',
        `Disk Usage: ${lastReport.diskUsage.toFixed(1)}%`,
        `Disk Used: ${(lastReport.diskUsed / 1024 / 1024 / 1024).toFixed(2)} GB`,
        `Disk Total: ${(lastReport.diskTotal / 1024 / 1024 / 1024).toFixed(2)} GB`,
        '',
        `Network Status: ${lastReport.networkUp ? 'Connected' : 'Disconnected'}`,
        `Uptime: ${lastReport.uptime ? `${Math.floor(lastReport.uptime / 86400)}d ${Math.floor((lastReport.uptime % 86400) / 3600)}h` : 'N/A'}`,
        '',
        '=== Antivirus Status ===',
        lastReport.antivirusStatus || 'N/A',
        ''
      );

      // Add top processes
      if (lastReport.topProcesses) {
        try {
          const processes = JSON.parse(lastReport.topProcesses);
          csv.push('=== Top Processes ===');
          csv.push('Process Name,CPU%,Memory%');
          processes.slice(0, 10).forEach((proc: any) => {
            csv.push(`"${proc.name || 'N/A'}",${proc.cpu || 0},${proc.memory || 0}`);
          });
          csv.push('');
        } catch (e) {
          csv.push('=== Top Processes ===');
          csv.push('Error parsing process data');
          csv.push('');
        }
      }

      // Add software list
      if (lastReport.software) {
        try {
          const software = JSON.parse(lastReport.software);
          csv.push('=== Installed Software ===');
          csv.push('Software Name,Version,Install Date');
          software.slice(0, 20).forEach((app: any) => {
            csv.push(`"${app.name || 'N/A'}","${app.version || 'N/A'}","${app.installDate || 'N/A'}"`);
          });
          csv.push('');
        } catch (e) {
          csv.push('=== Installed Software ===');
          csv.push('Error parsing software data');
          csv.push('');
        }
      }
    } else {
      csv.push('No system data available');
      csv.push('');
    }

    // Add recent alerts
    csv.push('=== Recent Alerts ===');
    csv.push('Date,Type,Severity,Message,Status');
    computer.alerts.forEach(alert => {
      csv.push(`"${alert.createdAt.toLocaleString()}","${alert.type}","${alert.severity}","${alert.message.replace(/"/g, '""')}","${alert.resolved ? 'Resolved' : 'Active'}"`);
    });

    const csvContent = csv.join('\n');

    return new NextResponse(csvContent, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="${computer.hostname}_details_${new Date().toISOString().split('T')[0]}.csv"`,
      },
    });
  } catch (error) {
    console.error("Export computer error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

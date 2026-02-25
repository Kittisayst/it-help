export interface ComputerDetail {
  id: string;
  hostname: string;
  ipAddress: string;
  macAddress: string | null;
  osVersion: string | null;
  department: string | null;
  label: string | null;
  tags: string | null;
  status: "online" | "offline" | "warning";
  lastSeenAt: string;
  createdAt: string;
  lastReport: ReportData | null;
  history: Array<{
    cpuUsage: number;
    ramUsage: number;
    diskUsage: number;
    createdAt: string;
  }>;
  alerts: Array<{
    id: string;
    type: string;
    severity: string;
    message: string;
    resolved: boolean;
    createdAt: string;
  }>;
}

export interface ReportData {
  cpuUsage: number;
  cpuCores: number | null;
  cpuSpeed: string | null;
  cpuTemp: number | null;
  ramTotal: number;
  ramUsed: number;
  ramUsage: number;
  diskTotal: number;
  diskUsed: number;
  diskUsage: number;
  diskDetails: Array<{ device: string; total: number; used: number; percent: number }> | null;
  networkUp: boolean;
  networkInfo: Record<string, string> | null;
  osInfo: Record<string, string> | null;
  uptime: number | null;
  topProcesses: Array<{ name: string; cpu: number; memory: number }> | null;
  eventLogs: Array<{ level: string; source: string; message: string; time: string }> | null;
  software: Array<{ name: string; version: string }> | null;
  antivirusStatus: string | null;
  printers: Array<{ name: string; is_default: boolean; is_network: boolean; status: string; port: string; driver: string }> | null;
  windowsLicense: { edition: string; status: string; partial_key: string; is_activated: boolean; license_type: string } | null;
  officeLicense: { installed: boolean; version: string; products: Array<{ name: string; status: string; is_activated: boolean; partial_key: string }> } | null;
  startupPrograms: Array<{ name: string; command: string; location: string }> | null;
  sharedFolders: Array<{ name: string; path: string; remark: string; is_hidden: boolean }> | null;
  usbDevices: Array<{ name: string; status: string; manufacturer: string }> | null;
  windowsUpdate: { recent_updates: Array<{ id: string; description: string; installed_on: string }>; pending_count: number } | null;
  services: Array<{ name: string; displayName: string; status: string; startType: string }> | null;
}

export interface CommandItem {
  id: string;
  action: string;
  params: string | null;
  status: string;
  result: string | null;
  createdAt: string;
  executedAt: string | null;
}

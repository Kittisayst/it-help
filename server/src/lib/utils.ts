import { type ClassValue, clsx } from "clsx";

export function cn(...inputs: ClassValue[]) {
  return inputs.filter(Boolean).join(" ");
}

export function formatBytes(bytes: number, decimals = 2): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
}

export function formatUptime(seconds: number): string {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  if (days > 0) return `${days}d ${hours}h ${mins}m`;
  if (hours > 0) return `${hours}h ${mins}m`;
  return `${mins}m`;
}

export function getStatusColor(status: "online" | "offline" | "warning"): string {
  switch (status) {
    case "online": return "text-emerald-500";
    case "offline": return "text-red-500";
    case "warning": return "text-amber-500";
  }
}

export function getStatusBg(status: "online" | "offline" | "warning"): string {
  switch (status) {
    case "online": return "bg-emerald-500/10 border-emerald-500/20";
    case "offline": return "bg-red-500/10 border-red-500/20";
    case "warning": return "bg-amber-500/10 border-amber-500/20";
  }
}

export function getComputerStatus(lastSeenAt: Date): "online" | "offline" | "warning" {
  const now = new Date();
  const diff = now.getTime() - new Date(lastSeenAt).getTime();
  const minutes = diff / 1000 / 60;
  if (minutes < 2) return "online";
  if (minutes < 5) return "warning";
  return "offline";
}

export const API_KEY_HEADER = "x-api-key";
export const MASTER_API_KEY = process.env.MASTER_API_KEY || "it-monitor-secret-key-2024";

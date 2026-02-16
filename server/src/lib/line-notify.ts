import { prisma } from "@/lib/db";

const LINE_NOTIFY_API = "https://notify-api.line.me/api/notify";

// In-memory cooldown tracker: { "type:computerId": lastNotifyTime }
const cooldownMap = new Map<string, number>();

export interface NotifyConfig {
  lineToken: string;
  enabled: boolean;
  cpuThreshold: number;
  ramThreshold: number;
  diskThreshold: number;
  notifyOffline: boolean;
  notifyEventLog: boolean;
  cooldownMinutes: number;
}

export async function getNotifyConfig(): Promise<NotifyConfig | null> {
  try {
    const config = await prisma.notifyConfig.findUnique({
      where: { id: "default" },
    });
    if (!config || !config.enabled || !config.lineToken) return null;
    return config;
  } catch {
    return null;
  }
}

export async function sendLineNotify(
  token: string,
  message: string
): Promise<boolean> {
  try {
    const res = await fetch(LINE_NOTIFY_API, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({ message }),
    });

    if (res.ok) {
      console.log("[LINE Notify] Message sent successfully");
      return true;
    } else {
      const text = await res.text();
      console.error(`[LINE Notify] Failed: ${res.status} ${text}`);
      return false;
    }
  } catch (error) {
    console.error("[LINE Notify] Error:", error);
    return false;
  }
}

function isCooldownActive(key: string, cooldownMinutes: number): boolean {
  const last = cooldownMap.get(key);
  if (!last) return false;
  const elapsed = (Date.now() - last) / 1000 / 60;
  return elapsed < cooldownMinutes;
}

function setCooldown(key: string) {
  cooldownMap.set(key, Date.now());
}

/**
 * Check alert conditions and send LINE notifications.
 * Called from the report route after creating alerts.
 */
export async function notifyOnAlert(
  hostname: string,
  computerId: string,
  alerts: string[],
  metrics: {
    cpu_usage?: number;
    ram_usage?: number;
    disk_usage?: number;
  }
) {
  const config = await getNotifyConfig();
  if (!config) return;

  const messages: string[] = [];

  for (const alertType of alerts) {
    const cooldownKey = `${alertType}:${computerId}`;

    if (isCooldownActive(cooldownKey, config.cooldownMinutes)) {
      continue;
    }

    let msg = "";
    switch (alertType) {
      case "CPU":
        if (metrics.cpu_usage && metrics.cpu_usage >= config.cpuThreshold) {
          msg = `⚠️ CPU High: ${metrics.cpu_usage.toFixed(1)}% on ${hostname}`;
        }
        break;
      case "RAM":
        if (metrics.ram_usage && metrics.ram_usage >= config.ramThreshold) {
          msg = `⚠️ RAM High: ${metrics.ram_usage.toFixed(1)}% on ${hostname}`;
        }
        break;
      case "DISK":
        if (metrics.disk_usage && metrics.disk_usage >= config.diskThreshold) {
          msg = `⚠️ Disk High: ${metrics.disk_usage.toFixed(1)}% on ${hostname}`;
        }
        break;
      case "EVENT_LOG":
        if (config.notifyEventLog) {
          msg = `⚠️ Error events found in Windows Event Log on ${hostname}`;
        }
        break;
    }

    if (msg) {
      messages.push(msg);
      setCooldown(cooldownKey);
    }
  }

  if (messages.length > 0) {
    const fullMessage = `\n🖥️ IT Monitor Alert\n${messages.join("\n")}`;
    await sendLineNotify(config.lineToken, fullMessage);
  }
}

/**
 * Send offline notification for a computer.
 */
export async function notifyOffline(hostname: string, computerId: string) {
  const config = await getNotifyConfig();
  if (!config || !config.notifyOffline) return;

  const cooldownKey = `offline:${computerId}`;
  if (isCooldownActive(cooldownKey, config.cooldownMinutes)) return;

  setCooldown(cooldownKey);
  await sendLineNotify(
    config.lineToken,
    `\n🖥️ IT Monitor Alert\n🔴 Computer OFFLINE: ${hostname}`
  );
}

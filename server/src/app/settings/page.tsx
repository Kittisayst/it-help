"use client";

import { useEffect, useState } from "react";
import {
  Bell,
  Save,
  TestTube,
  Loader2,
  CheckCircle,
  XCircle,
} from "lucide-react";

interface NotifySettings {
  enabled: boolean;
  lineToken: string;
  hasToken: boolean;
  cpuThreshold: number;
  ramThreshold: number;
  diskThreshold: number;
  notifyOffline: boolean;
  notifyEventLog: boolean;
  cooldownMinutes: number;
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<NotifySettings>({
    enabled: false,
    lineToken: "",
    hasToken: false,
    cpuThreshold: 90,
    ramThreshold: 85,
    diskThreshold: 90,
    notifyOffline: true,
    notifyEventLog: false,
    cooldownMinutes: 15,
  });
  const [newToken, setNewToken] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const fetchSettings = async () => {
    try {
      const res = await fetch("/api/settings/notify");
      if (res.ok) {
        const data = await res.json();
        setSettings(data);
      }
    } catch (err) {
      console.error("Failed to fetch settings:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const showMessage = (type: "success" | "error", text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 4000);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload: Record<string, unknown> = {
        enabled: settings.enabled,
        cpuThreshold: settings.cpuThreshold,
        ramThreshold: settings.ramThreshold,
        diskThreshold: settings.diskThreshold,
        notifyOffline: settings.notifyOffline,
        notifyEventLog: settings.notifyEventLog,
        cooldownMinutes: settings.cooldownMinutes,
      };

      if (newToken.trim()) {
        payload.lineToken = newToken.trim();
      }

      const res = await fetch("/api/settings/notify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        showMessage("success", "Settings saved successfully!");
        setNewToken("");
        fetchSettings();
      } else {
        showMessage("error", "Failed to save settings");
      }
    } catch {
      showMessage("error", "Error saving settings");
    } finally {
      setSaving(false);
    }
  };

  const handleTest = async () => {
    setTesting(true);
    try {
      const res = await fetch("/api/settings/notify", { method: "PUT" });
      const data = await res.json();
      if (res.ok) {
        showMessage("success", "Test notification sent! Check your LINE.");
      } else {
        showMessage("error", data.error || "Test failed");
      }
    } catch {
      showMessage("error", "Error sending test notification");
    } finally {
      setTesting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin w-8 h-8 border-2 border-accent border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-muted text-sm mt-1">Configure notifications and system preferences</p>
      </div>

      {/* Status Message */}
      {message && (
        <div
          className={`flex items-center gap-2 p-3 rounded-lg border ${
            message.type === "success"
              ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
              : "border-red-500/30 bg-red-500/10 text-red-400"
          }`}
        >
          {message.type === "success" ? (
            <CheckCircle className="w-4 h-4" />
          ) : (
            <XCircle className="w-4 h-4" />
          )}
          <span className="text-sm">{message.text}</span>
        </div>
      )}

      {/* LINE Notify Config */}
      <div className="bg-card border border-border rounded-xl p-6 space-y-5">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Bell className="w-5 h-5" />
            LINE Notify
          </h2>
          <label className="flex items-center gap-2 cursor-pointer">
            <span className="text-sm text-muted">
              {settings.enabled ? "Enabled" : "Disabled"}
            </span>
            <button
              onClick={() => setSettings({ ...settings, enabled: !settings.enabled })}
              className={`relative w-11 h-6 rounded-full transition-colors ${
                settings.enabled ? "bg-emerald-500" : "bg-border"
              }`}
            >
              <span
                className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
                  settings.enabled ? "translate-x-5" : ""
                }`}
              />
            </button>
          </label>
        </div>

        <div className="space-y-4">
          {/* Token */}
          <div>
            <label className="text-sm font-medium mb-1 block">LINE Notify Token</label>
            {settings.hasToken && (
              <p className="text-xs text-muted mb-1">
                Current: {settings.lineToken}
              </p>
            )}
            <input
              type="password"
              value={newToken}
              onChange={(e) => setNewToken(e.target.value)}
              placeholder={settings.hasToken ? "Enter new token to replace" : "Paste your LINE Notify token"}
              className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm"
            />
            <p className="text-xs text-muted mt-1">
              Get token from{" "}
              <a
                href="https://notify-bot.line.me/my/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-accent hover:underline"
              >
                notify-bot.line.me
              </a>
            </p>
          </div>

          {/* Thresholds */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium mb-1 block">CPU Threshold (%)</label>
              <input
                type="number"
                min={50}
                max={100}
                value={settings.cpuThreshold}
                onChange={(e) =>
                  setSettings({ ...settings, cpuThreshold: parseInt(e.target.value) || 90 })
                }
                className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm"
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">RAM Threshold (%)</label>
              <input
                type="number"
                min={50}
                max={100}
                value={settings.ramThreshold}
                onChange={(e) =>
                  setSettings({ ...settings, ramThreshold: parseInt(e.target.value) || 85 })
                }
                className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm"
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Disk Threshold (%)</label>
              <input
                type="number"
                min={50}
                max={100}
                value={settings.diskThreshold}
                onChange={(e) =>
                  setSettings({ ...settings, diskThreshold: parseInt(e.target.value) || 90 })
                }
                className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm"
              />
            </div>
          </div>

          {/* Toggles */}
          <div className="space-y-3">
            <label className="flex items-center justify-between cursor-pointer">
              <span className="text-sm">Notify when computer goes offline</span>
              <button
                onClick={() => setSettings({ ...settings, notifyOffline: !settings.notifyOffline })}
                className={`relative w-11 h-6 rounded-full transition-colors ${
                  settings.notifyOffline ? "bg-emerald-500" : "bg-border"
                }`}
              >
                <span
                  className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
                    settings.notifyOffline ? "translate-x-5" : ""
                  }`}
                />
              </button>
            </label>
            <label className="flex items-center justify-between cursor-pointer">
              <span className="text-sm">Notify on Windows Event Log errors</span>
              <button
                onClick={() => setSettings({ ...settings, notifyEventLog: !settings.notifyEventLog })}
                className={`relative w-11 h-6 rounded-full transition-colors ${
                  settings.notifyEventLog ? "bg-emerald-500" : "bg-border"
                }`}
              >
                <span
                  className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
                    settings.notifyEventLog ? "translate-x-5" : ""
                  }`}
                />
              </button>
            </label>
          </div>

          {/* Cooldown */}
          <div>
            <label className="text-sm font-medium mb-1 block">
              Cooldown (minutes between same alerts)
            </label>
            <input
              type="number"
              min={1}
              max={120}
              value={settings.cooldownMinutes}
              onChange={(e) =>
                setSettings({ ...settings, cooldownMinutes: parseInt(e.target.value) || 15 })
              }
              className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm max-w-[200px]"
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-2 border-t border-border">
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2 bg-accent text-white rounded-lg text-sm font-medium hover:bg-accent/90 transition-colors disabled:opacity-50"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Save Settings
          </button>
          <button
            onClick={handleTest}
            disabled={testing || !settings.hasToken}
            className="flex items-center gap-2 px-4 py-2 bg-background border border-border rounded-lg text-sm font-medium hover:bg-border/50 transition-colors disabled:opacity-50"
          >
            {testing ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <TestTube className="w-4 h-4" />
            )}
            Send Test
          </button>
        </div>
      </div>
    </div>
  );
}

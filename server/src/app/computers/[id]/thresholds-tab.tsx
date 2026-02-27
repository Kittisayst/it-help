"use client";

import { useState, useEffect } from "react";
import {
    AlertTriangle,
    Cpu,
    HardDrive,
    Save,
    Loader2,
    Check,
} from "lucide-react";
import { toast } from "sonner";

interface ThresholdsTabProps {
    computerId: string;
}

interface Thresholds {
    cpuThreshold: number;
    ramThreshold: number;
    diskThreshold: number;
    eventLogErrors: boolean;
}

export function ThresholdsTab({ computerId }: ThresholdsTabProps) {
    const [thresholds, setThresholds] = useState<Thresholds | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        const fetchThresholds = async () => {
            try {
                const res = await fetch(
                    `/api/computers/${computerId}/thresholds`,
                );
                if (!res.ok) throw new Error("Failed to fetch thresholds");
                const data = await res.json();
                setThresholds(data);
            } catch (err) {
                console.error(err);
                toast.error("ບໍ່ສາມາດໂຫຼດຂໍ້ມູນເກນການແຈ້ງເຕືອນໄດ້");
            } finally {
                setLoading(false);
            }
        };

        fetchThresholds();
    }, [computerId]);

    const handleSave = async () => {
        if (!thresholds) return;
        setSaving(true);
        try {
            const res = await fetch(`/api/computers/${computerId}/thresholds`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(thresholds),
            });
            if (!res.ok) throw new Error("Failed to update thresholds");
            toast.success("ອັບເດດເກນການແຈ້ງເຕືອນສຳເລັດແລ້ວ");
        } catch (err) {
            console.error(err);
            toast.error("ອັບເດດເກນການແຈ້ງເຕືອນບໍ່ສຳເລັດ");
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <Loader2 className="w-8 h-8 animate-spin text-accent" />
            </div>
        );
    }

    if (!thresholds) return null;

    return (
        <div className="space-y-6">
            <div className="bg-card border border-border rounded-xl p-6">
                <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 bg-amber-500/10 rounded-lg">
                        <AlertTriangle className="w-5 h-5 text-amber-500" />
                    </div>
                    <div>
                        <h3 className="font-semibold text-lg">
                            ກຳນົດເກນການແຈ້ງເຕືອນ (Alert Thresholds)
                        </h3>
                        <p className="text-muted text-sm">
                            ປັບແຕ່ງລະດັບການແຈ້ງເຕືອນສຳລັບຄອມພິວເຕີເຄື່ອງນີ້
                        </p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* CPU Threshold */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <label className="flex items-center gap-2 text-sm font-medium">
                                <Cpu className="w-4 h-4 text-accent" />
                                ເກນການໃຊ້ງານ CPU (%)
                            </label>
                            <span className="text-sm font-mono font-bold text-accent">
                                {thresholds.cpuThreshold}%
                            </span>
                        </div>
                        <input
                            type="range"
                            min="1"
                            max="100"
                            value={thresholds.cpuThreshold}
                            onChange={(e) =>
                                setThresholds({
                                    ...thresholds,
                                    cpuThreshold: parseInt(e.target.value),
                                })
                            }
                            className="w-full h-2 bg-border rounded-lg appearance-none cursor-pointer accent-accent"
                        />
                        <p className="text-xs text-muted">
                            ແຈ້ງເຕືອນລະດັບວິກິດເມື່ອການໃຊ້ງານ CPU ສູງກວ່າຄ່ານີ້.
                        </p>
                    </div>

                    {/* RAM Threshold */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <label className="flex items-center gap-2 text-sm font-medium">
                                <Cpu className="w-4 h-4 text-emerald-400" />
                                ເກນການໃຊ້ງານ RAM (%)
                            </label>
                            <span className="text-sm font-mono font-bold text-emerald-400">
                                {thresholds.ramThreshold}%
                            </span>
                        </div>
                        <input
                            type="range"
                            min="1"
                            max="100"
                            value={thresholds.ramThreshold}
                            onChange={(e) =>
                                setThresholds({
                                    ...thresholds,
                                    ramThreshold: parseInt(e.target.value),
                                })
                            }
                            className="w-full h-2 bg-border rounded-lg appearance-none cursor-pointer accent-emerald-500"
                        />
                        <p className="text-xs text-muted">
                            Triggers a warning alert at this level, and critical
                            above 95%.
                        </p>
                    </div>

                    {/* Disk Threshold */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <label className="flex items-center gap-2 text-sm font-medium">
                                <HardDrive className="w-4 h-4 text-blue-400" />
                                ເກນການໃຊ້ງານພື້ນທີ່ຈັດເກັບ (Disk %)
                            </label>
                            <span className="text-sm font-mono font-bold text-blue-400">
                                {thresholds.diskThreshold}%
                            </span>
                        </div>
                        <input
                            type="range"
                            min="1"
                            max="100"
                            value={thresholds.diskThreshold}
                            onChange={(e) =>
                                setThresholds({
                                    ...thresholds,
                                    diskThreshold: parseInt(e.target.value),
                                })
                            }
                            className="w-full h-2 bg-border rounded-lg appearance-none cursor-pointer accent-blue-500"
                        />
                        <p className="text-xs text-muted">
                            ແຈ້ງເຕືອນລະດັບເຕືອນໄພເມື່ອຮອດລະດັບນີ້, ແລະ
                            ວິກິດເມື່ອສູງກວ່າ 95%.
                        </p>
                    </div>

                    {/* Event Log toggle */}
                    <div className="flex items-center justify-between p-4 bg-background border border-border rounded-lg">
                        <div className="space-y-0.5">
                            <label className="text-sm font-medium">
                                ຕິດຕາມບັນທຶກເຫດການ (Monitor Event Logs)
                            </label>
                            <p className="text-xs text-muted">
                                ແຈ້ງເຕືອນເມື່ອພົບເຫດການ Windows ລະດັບ Critical
                                ຫຼື Error
                            </p>
                        </div>
                        <button
                            onClick={() =>
                                setThresholds({
                                    ...thresholds,
                                    eventLogErrors: !thresholds.eventLogErrors,
                                })
                            }
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                                thresholds.eventLogErrors
                                    ? "bg-accent"
                                    : "bg-border"
                            }`}
                        >
                            <span
                                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                    thresholds.eventLogErrors
                                        ? "translate-x-6"
                                        : "translate-x-1"
                                }`}
                            />
                        </button>
                    </div>
                </div>

                <div className="mt-8 pt-6 border-t border-border flex justify-end">
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="flex items-center gap-2 px-6 py-2 bg-accent text-white rounded-lg hover:bg-accent/90 transition-colors disabled:opacity-50"
                    >
                        {saving ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                            <Save className="w-4 h-4" />
                        )}
                        ບັນທຶກການປ່ຽນແປງ
                    </button>
                </div>
            </div>
        </div>
    );
}

"use client";

import { useEffect, useState } from "react";
import { AppWindow, Download, Plus, RefreshCw, Trash2 } from "lucide-react";

interface ProgramItem {
    id: string;
    imageUrl: string | null;
    name: string;
    description: string;
    programPath: string;
    downloadUrl: string | null;
    createdAt: string;
}

function toHref(url: string | null) {
    if (!url) return "#";
    if (
        url.startsWith("http://") ||
        url.startsWith("https://") ||
        url.startsWith("/")
    )
        return url;
    return `/${url}`;
}

export default function ProgramsPage() {
    const [programs, setPrograms] = useState<ProgramItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [programFile, setProgramFile] = useState<File | null>(null);
    const [fileInputKey, setFileInputKey] = useState(0);
    const [imageUrl, setImageUrl] = useState("");

    const fetchPrograms = async () => {
        try {
            const res = await fetch("/api/programs");
            const json = await res.json();
            setPrograms(Array.isArray(json) ? json : []);
        } catch (error) {
            console.error("Failed to fetch programs:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPrograms();
    }, []);

    const createProgram = async () => {
        if (!name.trim() || !description.trim() || !programFile) {
            alert("ກະລຸນາປ້ອນຊື່, ລາຍລະອຽດ ແລະ ເລືອກໄຟລ໌ໂປຣແກຣມ");
            return;
        }

        setSaving(true);
        try {
            const formData = new FormData();
            formData.append("name", name);
            formData.append("description", description);
            formData.append("imageUrl", imageUrl);
            formData.append("programFile", programFile);

            const res = await fetch("/api/programs", {
                method: "POST",
                body: formData,
            });

            if (!res.ok) {
                const err = await res.json();
                alert(err.error || "ບໍ່ສາມາດສ້າງໂປຣແກຣມໄດ້");
                return;
            }

            setName("");
            setDescription("");
            setProgramFile(null);
            setFileInputKey((k) => k + 1);
            setImageUrl("");
            fetchPrograms();
        } catch (error) {
            console.error("Create program error:", error);
            alert("ບໍ່ສາມາດສ້າງໂປຣແກຣມໄດ້");
        } finally {
            setSaving(false);
        }
    };

    const deleteProgram = async (id: string) => {
        if (!confirm("ທ່ານແນ່ໃຈບໍ່ວ່າຕ້ອງການລົບໂປຣແກຣມນີ້?")) return;

        try {
            await fetch(`/api/programs/${id}`, { method: "DELETE" });
            fetchPrograms();
        } catch (error) {
            console.error("Delete program error:", error);
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
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-2">
                        <AppWindow className="w-6 h-6" />
                        ໂປຣແກຣມ (Programs)
                    </h1>
                    <p className="text-muted text-sm mt-1">
                        ຈັດການລາຍຊື່ຊອບແວສຳລັບຜູ້ໃຊ້ Agent
                    </p>
                </div>
                <button
                    onClick={fetchPrograms}
                    className="flex items-center gap-2 px-4 py-2 bg-card border border-border rounded-lg hover:bg-border/50 transition-colors text-sm"
                >
                    <RefreshCw className="w-4 h-4" />
                    ໂຫຼດໃໝ່
                </button>
            </div>

            <div className="p-4 rounded-xl bg-card border border-border space-y-3">
                <h2 className="font-semibold">ເພີ່ມໂປຣແກຣມ (Add Program)</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <input
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="ຊື່ໂປຣແກຣມ"
                        className="px-3 py-2 bg-background border border-border rounded-lg text-sm"
                    />
                    <input
                        key={fileInputKey}
                        type="file"
                        accept=".exe,.msi,.zip,.rar,.7z,.bat,.cmd"
                        onChange={(e) =>
                            setProgramFile(e.target.files?.[0] || null)
                        }
                        className="px-3 py-2 bg-background border border-border rounded-lg text-sm"
                    />
                    <input
                        value={imageUrl}
                        onChange={(e) => setImageUrl(e.target.value)}
                        placeholder="ໄອຢູແອລຮູບພາບ (Image URL)"
                        className="px-3 py-2 bg-background border border-border rounded-lg text-sm"
                    />
                    <div className="px-3 py-2 bg-background border border-border rounded-lg text-sm text-muted">
                        ໄອຢູແອລດາວໂຫຼດ: ສ້າງໂດຍອັດຕະໂນມັດໂດຍເຊີບເວີ
                    </div>
                </div>
                <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="ລາຍລະອຽດ"
                    rows={3}
                    className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm"
                />
                <button
                    onClick={createProgram}
                    disabled={saving}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-accent text-white rounded-lg text-sm font-medium hover:bg-accent/90 disabled:opacity-50"
                >
                    <Plus className="w-4 h-4" />
                    {saving ? "ກຳລັງບັນທຶກ..." : "ເພີ່ມໂປຣແກຣມ"}
                </button>
            </div>

            {programs.length === 0 ? (
                <div className="text-center py-16 text-muted">
                    ຍັງບໍ່ມີໂປຣແກຣມເທື່ອ
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {programs.map((program) => (
                        <div
                            key={program.id}
                            className="p-4 rounded-xl bg-card border border-border flex gap-4"
                        >
                            <div className="w-16 h-16 rounded-lg bg-background border border-border overflow-hidden shrink-0">
                                {program.imageUrl ? (
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <img
                                        src={program.imageUrl}
                                        alt={program.name}
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-muted text-xs">
                                        ບໍ່ມີຮູບພາບ
                                    </div>
                                )}
                            </div>

                            <div className="flex-1 min-w-0">
                                <h3 className="font-semibold truncate">
                                    {program.name}
                                </h3>
                                <p className="text-sm text-muted mt-1 line-clamp-2">
                                    {program.description}
                                </p>
                                <p className="text-xs text-muted mt-2 break-all">
                                    ທີ່ຢູ່ໄຟລ໌: {program.programPath}
                                </p>

                                <div className="flex items-center gap-2 mt-3">
                                    <a
                                        href={
                                            toHref(program.downloadUrl) ||
                                            program.programPath
                                        }
                                        target="_blank"
                                        rel="noreferrer"
                                        className="inline-flex items-center gap-1 px-3 py-1.5 text-xs bg-accent text-white rounded hover:bg-accent/90"
                                    >
                                        <Download className="w-3.5 h-3.5" />
                                        ດາວໂຫຼດ
                                    </a>
                                    <button
                                        onClick={() =>
                                            deleteProgram(program.id)
                                        }
                                        className="inline-flex items-center gap-1 px-3 py-1.5 text-xs bg-red-500/10 text-red-400 border border-red-500/20 rounded hover:bg-red-500/20"
                                    >
                                        <Trash2 className="w-3.5 h-3.5" />
                                        ລົບ
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

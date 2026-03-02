"use client";

import { useEffect, useState } from "react";
import { AppWindow, Download, Plus, RefreshCw, Trash2, FolderOpen } from "lucide-react";

interface ProgramItem {
    id: string;
    imageUrl: string | null;
    name: string;
    description: string;
    programPath: string;
    downloadUrl: string | null;
    createdAt: string;
}

interface ProgramFile {
    name: string;
    size: number;
    modifiedAt: string;
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
    const [selectedFileName, setSelectedFileName] = useState("");
    const [imageUrl, setImageUrl] = useState("");
    
    // File browser state
    const [availableFiles, setAvailableFiles] = useState<ProgramFile[]>([]);
    const [showFileBrowser, setShowFileBrowser] = useState(false);
    const [loadingFiles, setLoadingFiles] = useState(false);

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

    const fetchAvailableFiles = async () => {
        setLoadingFiles(true);
        try {
            const res = await fetch("/api/programs/files");
            const json = await res.json();
            setAvailableFiles(Array.isArray(json) ? json : []);
        } catch (error) {
            console.error("Failed to fetch files:", error);
        } finally {
            setLoadingFiles(false);
        }
    };

    useEffect(() => {
        fetchPrograms();
    }, []);

    const createProgram = async () => {
        if (!name.trim() || !description.trim() || !selectedFileName) {
            alert("ກະລຸນາປ້ອນຊື່, ລາຍລະອຽດ ແລະ ເລືອກໄຟລ່ໂປຣແກຣມ");
            return;
        }

        setSaving(true);
        try {
            const res = await fetch("/api/programs", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name,
                    description,
                    imageUrl: imageUrl || null,
                    fileName: selectedFileName,
                }),
            });

            if (!res.ok) {
                const err = await res.json();
                alert(err.error || "ບໍ່ສາມາດສ້າງໂປຣແກຣມໄດ້");
                return;
            }

            setName("");
            setDescription("");
            setSelectedFileName("");
            setImageUrl("");
            fetchPrograms();
        } catch (error) {
            console.error("Create program error:", error);
            alert("ບໍ່ສາມາດສ້າງໂປຣແກຣມໄດ້");
        } finally {
            setSaving(false);
        }
    };

    const openFileBrowser = () => {
        setShowFileBrowser(true);
        fetchAvailableFiles();
    };

    const selectFile = (fileName: string) => {
        setSelectedFileName(fileName);
        setShowFileBrowser(false);
    };

    const formatFileSize = (bytes: number) => {
        if (bytes < 1024) return bytes + " B";
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
        return (bytes / (1024 * 1024)).toFixed(1) + " MB";
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
                    <div className="relative">
                        <button
                            type="button"
                            onClick={openFileBrowser}
                            className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-left flex items-center justify-between hover:bg-border/50 transition-colors"
                        >
                            <span className={selectedFileName ? "text-foreground" : "text-muted"}>
                                {selectedFileName || "ເລືອກໄຟລ່ຈາກ public/downloads/programs"}
                            </span>
                            <FolderOpen className="w-4 h-4 text-muted" />
                        </button>
                    </div>
                    <input
                        value={imageUrl}
                        onChange={(e) => setImageUrl(e.target.value)}
                        placeholder="ໄອຢູແອລຮູບພາບ (Image URL)"
                        className="px-3 py-2 bg-background border border-border rounded-lg text-sm"
                    />
                    <div className="px-3 py-2 bg-background border border-border rounded-lg text-sm text-muted">
                        ໄອຢູແອລດາວໂຫຼດ: ສ້າງອັດຕະໂນມັດຈາກ fileName
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

            {/* File Browser Modal */}
            {showFileBrowser && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-card border border-border rounded-xl w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
                        <div className="flex items-center justify-between p-4 border-b border-border">
                            <h2 className="text-lg font-semibold text-foreground">
                                ເລືອກໄຟລ່ຈາກ public/downloads/programs
                            </h2>
                            <button
                                onClick={() => setShowFileBrowser(false)}
                                className="p-1 text-muted hover:text-foreground"
                            >
                                ✕
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-4">
                            {loadingFiles ? (
                                <div className="text-center py-12">
                                    <div className="animate-spin w-8 h-8 border-2 border-accent border-t-transparent rounded-full mx-auto" />
                                    <p className="text-muted text-sm mt-3">ກຳລັງໂຫຼດລາຍການໄຟລ່...</p>
                                </div>
                            ) : availableFiles.length === 0 ? (
                                <div className="text-center py-12">
                                    <FolderOpen className="w-12 h-12 text-muted mx-auto mb-3" />
                                    <p className="text-muted">ບໍ່ມີໄຟລ່ໃນໂຟລເດີ</p>
                                    <p className="text-xs text-muted mt-1">
                                        ກະລຸນາ copy ໄຟລ່ໂປຣແກຣມໄປທີ່ public/downloads/programs
                                    </p>
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    {availableFiles.map((file) => (
                                        <button
                                            key={file.name}
                                            onClick={() => selectFile(file.name)}
                                            className="w-full p-3 bg-background border border-border rounded-lg hover:bg-border/50 transition-colors text-left"
                                        >
                                            <div className="flex items-center justify-between">
                                                <div className="flex-1 min-w-0">
                                                    <p className="font-medium text-foreground truncate">
                                                        {file.name}
                                                    </p>
                                                    <p className="text-xs text-muted mt-1">
                                                        {formatFileSize(file.size)} · {new Date(file.modifiedAt).toLocaleString("lo-LA")}
                                                    </p>
                                                </div>
                                                <FolderOpen className="w-4 h-4 text-muted ml-2" />
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="flex items-center justify-end gap-3 p-4 border-t border-border">
                            <button
                                onClick={() => setShowFileBrowser(false)}
                                className="px-4 py-2 text-sm text-muted hover:text-foreground transition-colors"
                            >
                                ຍົກເລີກ
                            </button>
                            <button
                                onClick={fetchAvailableFiles}
                                className="flex items-center gap-2 px-4 py-2 bg-accent text-white rounded-lg text-sm hover:bg-accent/90 transition-colors"
                            >
                                <RefreshCw className="w-4 h-4" />
                                Refresh
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

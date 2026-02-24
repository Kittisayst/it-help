"use client";

import { useEffect, useMemo, useState } from "react";
import { AppWindow, Download } from "lucide-react";

interface ProgramItem {
  id: string;
  imageUrl: string | null;
  name: string;
  description: string;
  programPath: string;
  downloadUrl: string | null;
}

function toHref(url: string | null) {
  if (!url) return "#";
  if (url.startsWith("http://") || url.startsWith("https://") || url.startsWith("/")) return url;
  return `/${url}`;
}

export default function AgentProgramsPage() {
  const [programs, setPrograms] = useState<ProgramItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [extensionFilter, setExtensionFilter] = useState("all");

  const extensionOptions = useMemo(() => {
    const exts = new Set<string>();
    programs.forEach((program) => {
      const source = program.downloadUrl || program.programPath || "";
      const filename = source.split("/").pop() || "";
      const dotIndex = filename.lastIndexOf(".");
      if (dotIndex > 0 && dotIndex < filename.length - 1) {
        exts.add(filename.slice(dotIndex + 1).toLowerCase());
      }
    });
    return Array.from(exts).sort();
  }, [programs]);

  const filteredPrograms = useMemo(() => {
    const q = search.trim().toLowerCase();
    return programs.filter((program) => {
      const textMatch =
        q.length === 0 ||
        program.name.toLowerCase().includes(q) ||
        program.description.toLowerCase().includes(q);

      if (!textMatch) return false;
      if (extensionFilter === "all") return true;

      const source = program.downloadUrl || program.programPath || "";
      const filename = source.split("/").pop() || "";
      return filename.toLowerCase().endsWith(`.${extensionFilter}`);
    });
  }, [programs, search, extensionFilter]);

  useEffect(() => {
    const run = async () => {
      try {
        const res = await fetch("/api/programs");
        const json = await res.json();
        setPrograms(Array.isArray(json) ? json : []);
      } catch (error) {
        console.error("Failed to load programs:", error);
      } finally {
        setLoading(false);
      }
    };

    run();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin w-8 h-8 border-2 border-accent border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <AppWindow className="w-6 h-6" />
          Programs Download Center
        </h1>
        <p className="text-muted text-sm mt-1">Choose a program and click download.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search program name or description"
          className="md:col-span-2 px-3 py-2 bg-card border border-border rounded-lg text-sm"
        />
        <select
          value={extensionFilter}
          onChange={(e) => setExtensionFilter(e.target.value)}
          className="px-3 py-2 bg-card border border-border rounded-lg text-sm"
        >
          <option value="all">All file types</option>
          {extensionOptions.map((ext) => (
            <option key={ext} value={ext}>
              .{ext}
            </option>
          ))}
        </select>
      </div>

      {filteredPrograms.length === 0 ? (
        <div className="text-center py-16 text-muted">No programs available</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredPrograms.map((program) => (
            <div key={program.id} className="p-4 rounded-xl bg-card border border-border">
              <div className="w-full aspect-video rounded-lg bg-background border border-border overflow-hidden mb-3">
                {program.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={program.imageUrl} alt={program.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-xs text-muted">No image</div>
                )}
              </div>

              <h3 className="font-semibold">{program.name}</h3>
              <p className="text-sm text-muted mt-1 min-h-10">{program.description}</p>

              <a
                href={toHref(program.downloadUrl)}
                target="_blank"
                rel="noreferrer"
                className="mt-3 inline-flex items-center gap-2 px-3 py-2 text-sm bg-accent text-white rounded-lg hover:bg-accent/90"
              >
                <Download className="w-4 h-4" />
                Download
              </a>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

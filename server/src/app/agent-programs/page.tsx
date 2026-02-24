"use client";

import { useEffect, useState } from "react";
import { AppWindow, Download } from "lucide-react";

interface ProgramItem {
  id: string;
  imageUrl: string | null;
  name: string;
  description: string;
  programPath: string;
  downloadUrl: string | null;
}

export default function AgentProgramsPage() {
  const [programs, setPrograms] = useState<ProgramItem[]>([]);
  const [loading, setLoading] = useState(true);

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

      {programs.length === 0 ? (
        <div className="text-center py-16 text-muted">No programs available</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {programs.map((program) => (
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
                href={program.downloadUrl || "#"}
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

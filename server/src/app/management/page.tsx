"use client";

import { useState } from "react";
import {
    LayoutGrid,
    Tag,
    Plus,
    Trash2,
    Loader2,
    Save,
    ChevronRight,
    Monitor,
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export default function GroupsManagementPage() {
    const queryClient = useQueryClient();
    const [newGroup, setNewGroup] = useState("");
    const [newTag, setNewTag] = useState("");

    const { data: computers, isLoading: loadingComputers } = useQuery({
        queryKey: ["computers", { limit: 1000 }],
        queryFn: async () => {
            const res = await fetch("/api/computers?limit=1000");
            if (!res.ok) throw new Error("Failed to fetch computers");
            return res.json();
        },
    });

    // Extract unique departments and tags from computers
    const departments = Array.from(
        new Set((computers?.data || []).map((c: any) => c.department)),
    )
        .filter(Boolean)
        .sort() as string[];
    const allTags = Array.from(
        new Set(
            (computers?.data || []).flatMap((c: any) =>
                (c.tags || "").split(",").map((t: string) => t.trim()),
            ),
        ),
    )
        .filter(Boolean)
        .sort() as string[];

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-2">
                        <LayoutGrid className="w-6 h-6 text-accent" />
                        Asset Management
                    </h1>
                    <p className="text-muted text-sm mt-1">
                        Manage departments, groups, and global tags
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Departments/Groups */}
                <div className="bg-card border border-border rounded-xl p-6">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="font-semibold flex items-center gap-2">
                            <Monitor className="w-4 h-4 text-emerald-400" />
                            Departments
                        </h3>
                        <span className="text-xs text-muted">
                            {departments.length} active
                        </span>
                    </div>

                    <div className="space-y-3 mb-6 max-h-[400px] overflow-y-auto pr-2">
                        {loadingComputers ? (
                            <Loader2 className="w-6 h-6 animate-spin mx-auto py-10" />
                        ) : departments.length === 0 ? (
                            <p className="text-sm text-muted italic text-center py-4">
                                No departments found
                            </p>
                        ) : (
                            departments.map((dept) => (
                                <div
                                    key={dept}
                                    className="flex items-center justify-between p-3 bg-background border border-border rounded-lg group"
                                >
                                    <span className="text-sm font-medium">
                                        {dept}
                                    </span>
                                    <div className="flex items-center gap-3">
                                        <span className="text-xs text-muted">
                                            {
                                                (computers?.data || []).filter(
                                                    (c: any) =>
                                                        c.department === dept,
                                                ).length
                                            }{" "}
                                            assets
                                        </span>
                                        <ChevronRight className="w-4 h-4 text-muted group-hover:text-accent transition-colors" />
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    <div className="pt-4 border-t border-border">
                        <p className="text-xs text-muted mb-3">
                            Note: Departments are automatically created when
                            reported by an agent or assigned to a computer.
                        </p>
                    </div>
                </div>

                {/* Global Tags */}
                <div className="bg-card border border-border rounded-xl p-6">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="font-semibold flex items-center gap-2">
                            <Tag className="w-4 h-4 text-accent" />
                            System Tags
                        </h3>
                        <span className="text-xs text-muted">
                            {allTags.length} unique tags
                        </span>
                    </div>

                    <div className="flex flex-wrap gap-2 mb-8">
                        {loadingComputers ? (
                            <Loader2 className="w-6 h-6 animate-spin mx-auto py-10" />
                        ) : allTags.length === 0 ? (
                            <p className="text-sm text-muted italic text-center py-4 w-full">
                                No tags assigned to assets
                            </p>
                        ) : (
                            allTags.map((tag) => (
                                <span
                                    key={tag}
                                    className="px-3 py-1.5 bg-accent/10 border border-accent/20 text-accent rounded-full text-xs font-medium flex items-center gap-2"
                                >
                                    {tag}
                                    <span className="text-[10px] opacity-60">
                                        (
                                        {
                                            (computers?.data || []).filter(
                                                (c: any) =>
                                                    (c.tags || "").includes(
                                                        tag,
                                                    ),
                                            ).length
                                        }
                                        )
                                    </span>
                                </span>
                            ))
                        )}
                    </div>

                    <div className="pt-4 border-t border-border">
                        <h4 className="text-xs font-semibold text-muted uppercase tracking-wider mb-4">
                            How to manage
                        </h4>
                        <p className="text-xs text-muted leading-relaxed">
                            Tags are assigned per asset in the Computer Detail
                            page. They allow you to categorize and filter assets
                            (e.g., "Critical", "VIP", "Workstation"). Use the
                            filter on the Computers list page to search by these
                            tags.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}

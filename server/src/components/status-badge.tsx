interface StatusBadgeProps {
  status: "online" | "offline" | "warning";
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const config = {
    online: { label: "Online", bg: "bg-emerald-500/15", text: "text-emerald-400", dot: "bg-emerald-400" },
    offline: { label: "Offline", bg: "bg-red-500/15", text: "text-red-400", dot: "bg-red-400" },
    warning: { label: "Warning", bg: "bg-amber-500/15", text: "text-amber-400", dot: "bg-amber-400" },
  };

  const c = config[status];

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${c.bg} ${c.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${c.dot} animate-pulse`} />
      {c.label}
    </span>
  );
}

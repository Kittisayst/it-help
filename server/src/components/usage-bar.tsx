interface UsageBarProps {
  label: string;
  value: number;
  max?: number;
  showPercent?: boolean;
}

export function UsageBar({ label, value, max = 100, showPercent = true }: UsageBarProps) {
  const percent = Math.min((value / max) * 100, 100);
  const color =
    percent > 90 ? "bg-red-500" : percent > 70 ? "bg-amber-500" : "bg-emerald-500";

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted">{label}</span>
        {showPercent && (
          <span className={`font-mono font-medium ${percent > 90 ? "text-red-400" : percent > 70 ? "text-amber-400" : "text-emerald-400"}`}>
            {percent.toFixed(1)}%
          </span>
        )}
      </div>
      <div className="h-2 bg-border rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${color}`}
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}

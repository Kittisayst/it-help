import { type LucideIcon } from "lucide-react";

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  color?: string;
  trend?: "up" | "down" | "stable";
}

export function MetricCard({ title, value, subtitle, icon: Icon, color = "text-accent" }: MetricCardProps) {
  return (
    <div className="bg-card border border-border rounded-xl p-5 hover:border-accent/30 transition-colors">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-muted font-medium">{title}</p>
          <p className={`text-3xl font-bold mt-2 ${color}`}>{value}</p>
          {subtitle && <p className="text-xs text-muted mt-1">{subtitle}</p>}
        </div>
        <div className={`p-3 rounded-lg bg-border/30 ${color}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
    </div>
  );
}

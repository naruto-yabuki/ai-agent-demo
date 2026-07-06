import { LucideIcon } from "lucide-react";

interface KpiCardProps {
  label: string;
  value: string;
  sub?: string;
  icon?: LucideIcon;
  tone?: "default" | "positive" | "warning" | "danger";
}

const toneStyles: Record<NonNullable<KpiCardProps["tone"]>, string> = {
  default: "text-[var(--navy)] bg-blue-50",
  positive: "text-emerald-700 bg-emerald-50",
  warning: "text-amber-700 bg-amber-50",
  danger: "text-red-700 bg-red-50",
};

export default function KpiCard({ label, value, sub, icon: Icon, tone = "default" }: KpiCardProps) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium text-slate-500">{label}</p>
        {Icon && (
          <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${toneStyles[tone]}`}>
            <Icon size={16} />
          </div>
        )}
      </div>
      <p className="mt-2 text-2xl font-bold text-slate-900">{value}</p>
      {sub && <p className="mt-1 text-xs text-slate-500">{sub}</p>}
    </div>
  );
}

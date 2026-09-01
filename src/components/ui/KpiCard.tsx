import { cn } from "@/lib/utils";

interface KpiCardProps {
  title: string;
  value: string;
  subtitle?: string;
  icon: React.ReactNode;
  iconBg?: string;
  trend?: "up" | "down" | "neutral";
}

export default function KpiCard({
  title,
  value,
  subtitle,
  icon,
  iconBg = "bg-indigo-100",
  trend,
}: KpiCardProps) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 flex items-start gap-4 shadow-sm">
      <div className={cn("p-3 rounded-xl shrink-0", iconBg)}>{icon}</div>
      <div className="min-w-0">
        <p className="text-sm text-gray-500 truncate">{title}</p>
        <p className="text-2xl font-bold text-gray-800 mt-0.5 truncate">
          {value}
        </p>
        {subtitle && (
          <p
            className={cn(
              "text-xs mt-1",
              trend === "up" && "text-green-600",
              trend === "down" && "text-red-600",
              !trend && "text-gray-400",
            )}
          >
            {trend === "up" && "▲ "}
            {trend === "down" && "▼ "}
            {subtitle}
          </p>
        )}
      </div>
    </div>
  );
}

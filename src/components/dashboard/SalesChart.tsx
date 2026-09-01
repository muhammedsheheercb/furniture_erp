"use client";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { IChartData } from "@/types";
import { formatCurrency } from "@/lib/utils";
import { useLanguage } from "../../context/LanguageContext";

interface SalesChartProps {
  data: IChartData[];
}

const fmt = (v: number) =>
  v >= 1000 ? `OMR ${(v / 1000).toFixed(1)}K` : `OMR ${v}`;

export default function SalesChart({ data }: SalesChartProps) {
  const { t } = useLanguage();
  return (
    <div className="card p-6">
      <h3 className="section-title mb-6">{t("monthlyOverview")}</h3>
      <ResponsiveContainer width="100%" height={320}>
        <BarChart
          data={data}
          margin={{ top: 4, right: 16, left: 0, bottom: 0 }}
          barCategoryGap="30%"
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis
            dataKey="month"
            tick={{ fontSize: 12, fill: "#6b7280" }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tickFormatter={fmt}
            tick={{ fontSize: 10, fill: "#9ca3af" }}
            axisLine={false}
            tickLine={false}
            width={80}
          />
          <Tooltip
            formatter={
              ((val: unknown, name: unknown) => [
                formatCurrency(Number(val)),
                String(name).charAt(0).toUpperCase() + String(name).slice(1),
              ]) as never
            }
            contentStyle={{
              borderRadius: "10px",
              border: "1px solid #e5e7eb",
              fontSize: "13px",
            }}
            cursor={{ fill: "#f9fafb" }}
          />
          <Legend wrapperStyle={{ fontSize: "13px", paddingTop: "16px" }} />
          <Bar
            dataKey="sales"
            name="Total Sales"
            fill="#6366f1"
            radius={[4, 4, 0, 0]}
          />
          <Bar
            dataKey="purchases"
            name="Purchases"
            fill="#f59e0b"
            radius={[4, 4, 0, 0]}
          />
          <Bar
            dataKey="expenses"
            name="Expenses"
            fill="#ef4444"
            radius={[4, 4, 0, 0]}
          />
          <Bar
            dataKey="revenue"
            name="Net Profit"
            fill="#10b981"
            radius={[4, 4, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

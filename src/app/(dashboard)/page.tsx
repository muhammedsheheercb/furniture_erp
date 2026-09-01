"use client";
import { useEffect, useState, useCallback } from "react";
import {
  ShoppingBag,
  ShoppingCart,
  TrendingUp,
  Users,
  Package,
  Truck,
  Receipt,
  ArrowUpRight,
  ArrowDownRight,
  FileText,
  DollarSign,
  BarChart2,
} from "lucide-react";
import SalesChart from "@/components/dashboard/SalesChart";
import Spinner from "@/components/ui/Spinner";
import Modal from "@/components/ui/Modal";
import { IKpiData, IChartData } from "@/types";
import { formatCurrency } from "@/lib/utils";
import { motion } from "framer-motion";

import { useDateFilter } from "@/context/DateFilterContext";
import { useLanguage } from "../../context/LanguageContext";

const YEARS = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i);

const kpiConfig = [
  {
    key: "totalSales",
    label: "Total Sales",
    icon: ShoppingBag,
    color: "#2980B9",
    bg: "#EBF5FB",
    border: "#AED6F1",
  },
  {
    key: "totalPurchases",
    label: "Total Purchases",
    icon: ShoppingCart,
    color: "#CA6F1E",
    bg: "#FEF5E7",
    border: "#FAD7A0",
  },
  {
    key: "totalExpenses",
    label: "Total Expenses",
    icon: Receipt,
    color: "#C0392B",
    bg: "#FDEDEC",
    border: "#F5B7B1",
  },
  {
    key: "totalRevenue",
    label: "Net Profit",
    icon: TrendingUp,
    color: "#1E8449",
    bg: "#EAFAF1",
    border: "#A9DFBF",
  },
  {
    key: "totalReceivable",
    label: "Receivable",
    icon: ArrowUpRight,
    color: "#6C3483",
    bg: "#F4ECF7",
    border: "#D7BDE2",
  },
  {
    key: "totalPayable",
    label: "Payable",
    icon: ArrowDownRight,
    color: "#C0392B",
    bg: "#FDEDEC",
    border: "#F5B7B1",
  },
  {
    key: "totalCustomers",
    label: "Customers",
    icon: Users,
    color: "#1A5276",
    bg: "#EAF2FF",
    border: "#AED6F1",
  },
  {
    key: "totalItems",
    label: "Items",
    icon: Package,
    color: "#6E2FA1",
    bg: "#F5EEF8",
    border: "#D2B4DE",
  },
  {
    key: "totalSuppliers",
    label: "Suppliers",
    icon: Truck,
    color: "#117A65",
    bg: "#E8F8F5",
    border: "#A2D9CE",
  },
];

export default function DashboardPage() {
  const { t } = useLanguage();
  const { startDate, endDate, setStartDate, setEndDate, clearDates } =
    useDateFilter();
  const [kpi, setKpi] = useState<IKpiData | null>(null);
  const [chart, setChart] = useState<IChartData[]>([]);
  const [year, setYear] = useState(new Date().getFullYear());
  const [loading, setLoading] = useState(true);
  const [popupType, setPopupType] = useState<"sales" | "purchases" | null>(
    null,
  );

  const load = useCallback(async () => {
    setLoading(true);
    try {
      let url = `/api/dashboard?year=${year}`;
      if (startDate) url += `&startDate=${startDate}`;
      if (endDate) url += `&endDate=${endDate}`;
      const res = await fetch(url);
      const data = await res.json();
      if (data.success) {
        setKpi(data.kpi);
        setChart(data.chartData);
      }
    } catch (err) {
      console.error("Dashboard load error:", err);
    } finally {
      setLoading(false);
    }
  }, [year, startDate, endDate]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      {/* Page header */}
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        style={{
          display: "flex",
          alignItems: "flex-end",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 16,
        }}
      >
        <div>
          <h1
            style={{
              fontSize: 24,
              fontWeight: 800,
              color: "#1A1210",
              margin: 0,
              letterSpacing: "-0.02em",
            }}
          >
            {t("dashboard")}
          </h1>
          <p style={{ fontSize: 13, color: "#7A6055", margin: "4px 0 0" }}>
            {t("diamondHomeFurnitureBusinessOverview")}
          </p>
        </div>

        {/* Date filters */}
        <div
          style={{
            display: "flex",
            alignItems: "flex-end",
            gap: 10,
            flexWrap: "wrap",
          }}
        >
          {(["Start Date", "End Date"] as const).map((label, i) => (
            <div
              key={label}
              style={{ display: "flex", flexDirection: "column", gap: 4 }}
            >
              <label
                style={{
                  fontSize: 11,
                  color: "#7A6055",
                  fontWeight: 600,
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                }}
              >
                {label}
              </label>
              <input
                type="date"
                value={i === 0 ? startDate : endDate}
                onChange={(e) =>
                  i === 0
                    ? setStartDate(e.target.value)
                    : setEndDate(e.target.value)
                }
                style={{
                  border: "1.5px solid #E5DDD5",
                  borderRadius: 8,
                  padding: "6px 12px",
                  fontSize: 12,
                  outline: "none",
                  background: "#fff",
                  color: "#1A1210",
                }}
              />
            </div>
          ))}
          {(startDate || endDate) && (
            <button
              onClick={clearDates}
              style={{
                background: "none",
                border: "1.5px solid #E5DDD5",
                borderRadius: 8,
                color: "#C9A84C",
                fontSize: 12,
                cursor: "pointer",
                fontWeight: 600,
                padding: "6px 12px",
                marginBottom: 0,
              }}
            >
              {t("clear")}
            </button>
          )}
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <label
              style={{
                fontSize: 11,
                color: "#7A6055",
                fontWeight: 600,
                textTransform: "uppercase",
                letterSpacing: "0.06em",
              }}
            >
              {t("year")}
            </label>
            <select
              value={year}
              onChange={(e) => setYear(Number(e.target.value))}
              style={{
                border: "1.5px solid #E5DDD5",
                borderRadius: 8,
                padding: "6px 12px",
                fontSize: 12,
                outline: "none",
                background: "#fff",
                color: "#1A1210",
                cursor: "pointer",
                minWidth: 90,
              }}
            >
              {YEARS.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </div>
        </div>
      </motion.div>

      {loading ? (
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            height: 240,
          }}
        >
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 16,
            }}
          >
            <Spinner size="lg" />
            <p style={{ fontSize: 13, color: "#A89080" }}>
              {t("loadingDashboard")}
            </p>
          </div>
        </div>
      ) : (
        <>
          {/* KPI grid */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
              gap: 14,
            }}
          >
            {kpiConfig.map(
              ({ key, label, icon: Icon, color, bg, border }, idx) => {
                const val = kpi ? Number(kpi[key as keyof IKpiData]) : 0;
                const isCurrency = [
                  "totalSales",
                  "totalPurchases",
                  "totalExpenses",
                  "totalRevenue",
                  "totalReceivable",
                  "totalPayable",
                ].includes(key);
                const displayVal = isCurrency
                  ? formatCurrency(val).replace("OMR", "").trim()
                  : String(val);
                const isRevenue = key === "totalRevenue";
                const revenueColor = isRevenue
                  ? val < 0
                    ? "#C0392B"
                    : "#1E8449"
                  : color;

                const clickable =
                  key === "totalSales" || key === "totalPurchases";
                return (
                  <motion.div
                    key={key}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    whileHover={{
                      y: -2,
                      boxShadow: `0 8px 24px rgba(44,24,16,0.1)`,
                    }}
                    onClick={() => {
                      if (key === "totalSales") setPopupType("sales");
                      else if (key === "totalPurchases")
                        setPopupType("purchases");
                    }}
                    style={{
                      background: "#fff",
                      border: `1px solid ${border}`,
                      borderRadius: 14,
                      padding: "18px 16px",
                      display: "flex",
                      alignItems: "center",
                      gap: 14,
                      boxShadow: "0 1px 4px rgba(44,24,16,0.04)",
                      cursor: clickable ? "pointer" : "default",
                      transition: "all 0.2s ease",
                    }}
                  >
                    <div
                      style={{
                        background: bg,
                        borderRadius: 12,
                        padding: 10,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                      }}
                    >
                      <Icon size={20} color={color} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p
                        style={{
                          fontSize: 11,
                          color: "#A89080",
                          margin: 0,
                          fontWeight: 600,
                          textTransform: "uppercase",
                          letterSpacing: "0.05em",
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        }}
                      >
                        {label}
                      </p>
                      <p
                        style={{
                          fontSize: 20,
                          fontWeight: 800,
                          color: isRevenue ? revenueColor : "#1A1210",
                          margin: "4px 0 0",
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          display: "flex",
                          alignItems: "center",
                          gap: 4,
                        }}
                      >
                        {isCurrency && (
                          <img
                            src="/images/money.webp"
                            alt=""
                            style={{
                              width: 18,
                              height: 18,
                              objectFit: "contain",
                            }}
                          />
                        )}
                        {displayVal}
                      </p>
                      {clickable && (
                        <p
                          style={{
                            fontSize: 10,
                            color: "#C9A84C",
                            margin: "3px 0 0",
                            fontWeight: 600,
                          }}
                        >
                          {t("clickForBreakdown")}
                        </p>
                      )}
                    </div>
                  </motion.div>
                );
              },
            )}
          </div>

          {/* Chart */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            style={{
              background: "#fff",
              borderRadius: 16,
              border: "1px solid #E5DDD5",
              padding: "24px",
              boxShadow: "0 1px 4px rgba(44,24,16,0.04)",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                marginBottom: 20,
              }}
            >
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 10,
                  background: "#F7F4F0",
                  border: "1px solid #E5DDD5",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <BarChart2 size={18} color="#8B5E3C" />
              </div>
              <div>
                <h3
                  style={{
                    margin: 0,
                    fontSize: 15,
                    fontWeight: 700,
                    color: "#1A1210",
                  }}
                >
                  {t("monthlyOverview")}
                </h3>
                <p style={{ margin: 0, fontSize: 12, color: "#A89080" }}>
                  {t("salesPurchasesExpenses")}
                  {year}
                </p>
              </div>
            </div>
            <SalesChart data={chart} />
          </motion.div>

          {/* Breakdown Modal */}
          <Modal
            open={!!popupType}
            onClose={() => setPopupType(null)}
            title={
              popupType === "sales" ? "Sales Breakdown" : "Purchases Breakdown"
            }
          >
            {popupType && kpi && (
              <div
                style={{ display: "flex", flexDirection: "column", gap: 12 }}
              >
                {[
                  {
                    label: "Cash",
                    val:
                      popupType === "sales"
                        ? kpi.cashSales || 0
                        : kpi.cashPurchases || 0,
                    bg: "#EAFAF1",
                    color: "#1E8449",
                    border: "#A9DFBF",
                  },
                  {
                    label: "Bank / Online",
                    val:
                      popupType === "sales"
                        ? kpi.bankSales || 0
                        : kpi.bankPurchases || 0,
                    bg: "#EBF5FB",
                    color: "#2980B9",
                    border: "#AED6F1",
                  },
                  {
                    label: "Credit",
                    val:
                      popupType === "sales"
                        ? kpi.creditSales || 0
                        : kpi.creditPurchases || 0,
                    bg: "#FEF5E7",
                    color: "#CA6F1E",
                    border: "#FAD7A0",
                  },
                ].map(({ label, val, bg, color, border }) => (
                  <div
                    key={label}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      padding: "14px 16px",
                      background: bg,
                      borderRadius: 12,
                      border: `1px solid ${border}`,
                    }}
                  >
                    <span style={{ fontWeight: 700, color, fontSize: 14 }}>
                      {label}
                    </span>
                    <span style={{ fontWeight: 800, color, fontSize: 16 }}>
                      {formatCurrency(val)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </Modal>
        </>
      )}
    </div>
  );
}

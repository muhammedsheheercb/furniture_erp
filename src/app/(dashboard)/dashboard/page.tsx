"use client";
import { 
  DollarSign, 
  ShoppingBag, 
  Clock, 
  AlertTriangle, 
  ArrowUpRight, 
  ArrowDownRight,
  Package,
  Users,
  BarChart3 as BarChartIcon
} from "lucide-react";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle,
  CardDescription
} from "@/components/ui/card";
import { useEffect, useState } from "react";
import axios from "axios";
import CurrencySymbol from "@/components/ui/CurrencySymbol";
import { useLanguage } from "@/context/LanguageContext";

export default function DashboardPage() {
  const { t } = useLanguage();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await axios.get("/api/dashboard");
        if (res.data.success) {
          setData(res.data);
        }
      } catch (err) {
        console.error("Dashboard fetch error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#C9A84C]"></div>
      </div>
    );
  }

  const kpis = [
    { label: t("total_sales"), value: data?.kpi?.totalSales?.toLocaleString() || 0, icon: DollarSign, trend: "+12%", trendUp: true, isCurrency: true },
    { label: t("total_purchases"), value: data?.kpi?.totalPurchases?.toLocaleString() || 0, icon: ShoppingBag, trend: "+8.2%", trendUp: true, isCurrency: true },
    { label: t("revenue"), value: data?.kpi?.totalRevenue?.toLocaleString() || 0, icon: ArrowUpRight, trend: "+2%", trendUp: true, isCurrency: true },
    { label: t("total_items"), value: data?.kpi?.totalItems || 0, icon: Package, trend: "+3", trendUp: true },
    { label: t("total_customers"), value: data?.kpi?.totalCustomers || 0, icon: Users, trend: "+5", trendUp: true },
    { label: t("total_suppliers"), value: data?.kpi?.totalSuppliers || 0, icon: Package, trend: "+1", trendUp: true },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div>
        <h2 className="text-3xl font-extrabold text-[#1A1210] tracking-tight">{t("business_overview")}</h2>
        <p className="text-[#7A6055] mt-1">{t("dashboard_subtitle")}</p>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {kpis.map((kpi, i) => (
          <Card key={i} className="border-[#E5DDD5] shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-[#7A6055] uppercase tracking-wider">
                {kpi.label}
              </CardTitle>
              <div className="h-10 w-10 rounded-lg bg-[#FAF8F6] flex items-center justify-center text-[#C9A84C]">
                <kpi.icon size={20} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-[#1A1210]">
                {kpi.isCurrency && <CurrencySymbol />} {kpi.value}
              </div>
              <p className={`text-xs mt-1 flex items-center gap-1 ${kpi.trendUp ? 'text-emerald-600' : 'text-rose-600'}`}>
                {kpi.trend} <span className="text-[#A89080]">from last period</span>
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sales Trend Chart Placeholder */}
        <Card className="border-[#E5DDD5]">
          <CardHeader>
            <CardTitle className="text-[#1A1210]">Sales Trend</CardTitle>
            <CardDescription>Monthly revenue trends</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px] flex items-center justify-center bg-[#FAF8F6] rounded-md border border-dashed border-[#E5DDD5] m-6 mt-0">
             <div className="text-center text-[#A89080]">
               <BarChartIcon className="mx-auto mb-2 opacity-20" size={48} />
               <p>Chart Visuals based on {data?.chartData?.length || 0} months</p>
             </div>
          </CardContent>
        </Card>

        {/* Recent Items */}
        <Card className="border-[#E5DDD5]">
          <CardHeader>
            <CardTitle className="text-[#1A1210]">Inventory Summary</CardTitle>
            <CardDescription>Current stock levels and value</CardDescription>
          </CardHeader>
          <CardContent>
             <div className="space-y-4">
                <div className="flex items-center justify-between p-3 rounded-lg bg-[#FAF8F6]">
                   <span className="text-sm font-medium">Total Stock Volume</span>
                   <span className="font-bold">{data?.kpi?.totalStock?.toLocaleString() || 0} units</span>
                </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-[#A89080]">Total Receivables</span>
                    <span className="font-bold text-rose-600"><CurrencySymbol /> {data?.kpi?.totalReceivable?.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-[#A89080]">Total Payables</span>
                    <span className="font-bold text-amber-600"><CurrencySymbol /> {data?.kpi?.totalPayable?.toLocaleString()}</span>
                  </div>
             </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}


function BarChart3(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3 3v18h18" />
      <path d="M18 17V9" />
      <path d="M13 17V5" />
      <path d="M8 17v-3" />
    </svg>
  )
}

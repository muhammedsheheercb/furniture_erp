"use client";
import { 
  DollarSign, 
  ShoppingBag, 
  ArrowUpRight, 
  ArrowDownRight,
  TrendingUp,
  CreditCard,
  Wallet,
  PieChart,
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
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  Cell
} from "recharts";
import { motion, AnimatePresence } from "framer-motion";

export default function DashboardPage() {
  const { t } = useLanguage();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [expandedCard, setExpandedCard] = useState<string | null>(null);

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
    { 
      id: "sales",
      label: t("total_sales"), 
      value: data?.kpi?.totalSales || 0, 
      icon: DollarSign, 
      color: "#C9A84C",
      details: [
        { label: t("cash_sale"), value: data?.kpi?.cashSales || 0, icon: Wallet },
        { label: t("bank_upi_sale"), value: data?.kpi?.bankSales || 0, icon: CreditCard },
        { label: t("credit_sale"), value: data?.kpi?.creditSales || 0, icon: ArrowUpRight },
      ]
    },
    { 
      id: "purchases",
      label: t("total_purchases"), 
      value: data?.kpi?.totalPurchases || 0, 
      icon: ShoppingBag, 
      color: "#7A6055",
      details: [
        { label: t("cash_purchase"), value: data?.kpi?.cashPurchases || 0, icon: Wallet },
        { label: t("bank_upi_purchase"), value: data?.kpi?.bankPurchases || 0, icon: CreditCard },
        { label: t("credit_purchase"), value: data?.kpi?.creditPurchases || 0, icon: ArrowDownRight },
      ]
    },
    { 
      id: "expenses",
      label: t("total_expenses"), 
      value: data?.kpi?.totalExpenses || 0, 
      icon: ArrowDownRight, 
      color: "#E63946" 
    },
    { 
      id: "revenue",
      label: t("total_revenue"), 
      value: data?.kpi?.totalRevenue || 0, 
      icon: TrendingUp, 
      color: "#2A9D8F" 
    },
  ];

  const toggleExpand = (id: string) => {
    if (expandedCard === id) {
      setExpandedCard(null);
    } else {
      setExpandedCard(id);
    }
  };

  return (
    <div className="space-y-6 md:space-y-8 animate-in fade-in duration-500 pb-10 px-1 md:px-0">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-extrabold text-[#1A1210] tracking-tight">{t("business_overview")}</h2>
          <p className="text-sm md:text-base text-[#7A6055] mt-1">{t("dashboard_subtitle")}</p>
        </div>
        <div className="bg-white px-3 py-1.5 md:px-4 md:py-2 rounded-xl border border-[#E5DDD5] shadow-sm flex items-center gap-2 w-fit">
           <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></div>
           <span className="text-xs md:text-sm font-medium text-[#1A1210]">Live Updates</span>
        </div>
      </div>

      {/* Main KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        {kpis.map((kpi) => (
          <motion.div
            key={kpi.id}
            layout
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="h-full"
          >
            <Card 
              className={`border-[#E5DDD5] shadow-sm hover:shadow-md transition-all cursor-pointer overflow-hidden relative h-full ${expandedCard === kpi.id ? 'ring-2 ring-[#C9A84C] ring-offset-2' : ''}`}
              onClick={() => kpi.details ? toggleExpand(kpi.id) : null}
            >
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-[10px] md:text-sm font-semibold text-[#7A6055] uppercase tracking-wider">
                  {kpi.label}
                </CardTitle>
                <div 
                  className="h-8 w-8 md:h-10 md:w-10 rounded-lg md:rounded-xl flex items-center justify-center text-white shadow-sm"
                  style={{ backgroundColor: kpi.color }}
                >
                  <kpi.icon size={16} className="md:w-5 md:h-5" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-xl md:text-2xl font-black text-[#1A1210] mb-1">
                  <CurrencySymbol /> {kpi.value.toLocaleString()}
                </div>
                
                {kpi.details && (
                  <div className="flex items-center text-[10px] md:text-xs text-[#A89080] font-medium">
                    {expandedCard === kpi.id ? 'Click to collapse' : 'Click to see breakdown'}
                    <motion.div
                      animate={{ rotate: expandedCard === kpi.id ? 180 : 0 }}
                      className="ml-1"
                    >
                      <ArrowDownRight size={10} className="md:w-3 md:h-3" />
                    </motion.div>
                  </div>
                )}

                <AnimatePresence>
                  {expandedCard === kpi.id && kpi.details && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="mt-4 pt-4 border-t border-[#F0EBE6] space-y-2 md:space-y-3"
                    >
                      {kpi.details.map((detail, idx) => (
                        <div key={idx} className="flex items-center justify-between bg-[#FAF8F6] p-2 rounded-lg">
                          <div className="flex items-center gap-2">
                            <div className="h-6 w-6 md:h-7 md:w-7 rounded-md bg-white border border-[#E5DDD5] flex items-center justify-center text-[#7A6055]">
                              <detail.icon size={12} className="md:w-3.5 md:h-3.5" />
                            </div>
                            <span className="text-xs md:text-sm font-medium text-[#7A6055]">{detail.label}</span>
                          </div>
                          <span className="text-xs md:text-sm font-bold text-[#1A1210]">
                            <CurrencySymbol /> {detail.value.toLocaleString()}
                          </span>
                        </div>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </CardContent>
              
              {/* Decorative background element */}
              <div 
                className="absolute -right-4 -bottom-4 opacity-[0.03] pointer-events-none"
                style={{ color: kpi.color }}
              >
                <kpi.icon size={80} className="md:w-[100px] md:h-[100px]" strokeWidth={1} />
              </div>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sales & Purchases Trend Chart */}
        <Card className="border-[#E5DDD5] lg:col-span-2 shadow-sm overflow-hidden bg-white">
          <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <CardTitle className="text-[#1A1210] text-lg md:text-xl font-bold">Financial Performance</CardTitle>
              <CardDescription className="text-xs md:text-sm">Monthly comparison of sales, purchases and expenses</CardDescription>
            </div>
            <div className="flex items-center gap-3">
               <div className="flex items-center gap-1.5 text-[10px] md:text-xs font-semibold text-[#7A6055]">
                  <div className="h-2.5 w-2.5 md:h-3 md:w-3 rounded-sm bg-[#C9A84C]"></div>
                  Sales
               </div>
               <div className="flex items-center gap-1.5 text-[10px] md:text-xs font-semibold text-[#7A6055]">
                  <div className="h-2.5 w-2.5 md:h-3 md:w-3 rounded-sm bg-[#7A6055]"></div>
                  Purchases
               </div>
            </div>
          </CardHeader>
          <CardContent className="h-[300px] md:h-[400px] pt-4 px-2 md:px-6">
             <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={data?.chartData || []}
                  margin={{ top: 5, right: 10, left: 0, bottom: 5 }}
                  barGap={4}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F0EBE6" />
                  <XAxis 
                    dataKey="month" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#7A6055', fontSize: 10, fontWeight: 500 }}
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#7A6055', fontSize: 10 }}
                    tickFormatter={(value) => `₹${value >= 1000 ? (value / 1000).toFixed(0) + 'k' : value}`}
                    width={40}
                  />
                  <Tooltip 
                    cursor={{ fill: '#FAF8F6' }}
                    contentStyle={{ 
                      borderRadius: '12px', 
                      border: '1px solid #E5DDD5',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                      padding: '8px',
                      fontSize: '12px'
                    }}
                  />
                  <Bar 
                    dataKey="sales" 
                    name="Sales" 
                    fill="#C9A84C" 
                    radius={[2, 2, 0, 0]} 
                  />
                  <Bar 
                    dataKey="purchases" 
                    name="Purchases" 
                    fill="#7A6055" 
                    radius={[2, 2, 0, 0]} 
                  />
                </BarChart>
             </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Secondary KPI Cards */}
        <div className="space-y-4 md:space-y-6">
          <Card className="border-[#E5DDD5] shadow-sm bg-gradient-to-br from-white to-[#FAF8F6]">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm md:text-base font-bold text-[#1A1210] flex items-center gap-2">
                <PieChart className="text-[#C9A84C]" size={16} />
                Inventory Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 md:space-y-4">
                <div className="flex items-center justify-between p-3 md:p-4 rounded-xl bg-white border border-[#E5DDD5] shadow-sm">
                   <div>
                     <p className="text-[10px] font-semibold text-[#A89080] uppercase tracking-wider">Total Stock</p>
                     <p className="text-lg md:text-xl font-black text-[#1A1210]">{data?.kpi?.totalStock?.toLocaleString() || 0} <span className="text-xs font-medium text-[#7A6055]">Units</span></p>
                   </div>
                   <div className="h-8 w-8 md:h-10 md:w-10 rounded-full bg-[#FAF8F6] flex items-center justify-center text-[#C9A84C]">
                      <BarChartIcon size={16} className="md:w-5 md:h-5" />
                   </div>
                </div>
                
                <div className="grid grid-cols-2 gap-2 md:gap-3">
                  <div className="p-2 md:p-3 rounded-xl bg-emerald-50 border border-emerald-100">
                    <p className="text-[9px] md:text-[10px] font-bold text-emerald-700 uppercase">Receivable</p>
                    <p className="text-xs md:text-sm font-black text-emerald-900 truncate">
                      <CurrencySymbol /> {data?.kpi?.totalReceivable?.toLocaleString()}
                    </p>
                  </div>
                  <div className="p-2 md:p-3 rounded-xl bg-rose-50 border border-rose-100">
                    <p className="text-[9px] md:text-[10px] font-bold text-rose-700 uppercase">Payable</p>
                    <p className="text-xs md:text-sm font-black text-rose-900 truncate">
                      <CurrencySymbol /> {data?.kpi?.totalPayable?.toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-2 gap-3 md:gap-4">
             <Card className="border-[#E5DDD5] shadow-sm flex flex-col items-center justify-center p-3 md:p-4 text-center">
                <div className="h-8 w-8 md:h-10 md:w-10 rounded-full bg-[#FAF8F6] flex items-center justify-center text-[#7A6055] mb-2">
                  <BarChartIcon size={16} className="md:w-5 md:h-5" />
                </div>
                <p className="text-[9px] md:text-[10px] font-bold text-[#A89080] uppercase tracking-wider">{t("total_items")}</p>
                <p className="text-base md:text-lg font-black text-[#1A1210]">{data?.kpi?.totalItems || 0}</p>
             </Card>
             <Card className="border-[#E5DDD5] shadow-sm flex flex-col items-center justify-center p-3 md:p-4 text-center">
                <div className="h-8 w-8 md:h-10 md:w-10 rounded-full bg-[#FAF8F6] flex items-center justify-center text-[#7A6055] mb-2">
                  <BarChartIcon size={16} className="md:w-5 md:h-5" />
                </div>
                <p className="text-[9px] md:text-[10px] font-bold text-[#A89080] uppercase tracking-wider">{t("total_customers")}</p>
                <p className="text-base md:text-lg font-black text-[#1A1210]">{data?.kpi?.totalCustomers || 0}</p>
             </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

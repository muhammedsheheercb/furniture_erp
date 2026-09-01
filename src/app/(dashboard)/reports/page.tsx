"use client";
import {
  BarChart3,
  PieChart,
  TrendingUp,
  Download,
  Calendar as CalendarIcon,
  ChevronRight,
  FileText,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { useLanguage } from "../../../context/LanguageContext";

export default async function ReportsPage() {
  const { t } = useLanguage();
  const reportCards = [
    {
      title: "Profit & Loss",
      description: "Monthly revenue vs expenses summary",
      icon: TrendingUp,
    },
    {
      title: "Inventory Valuation",
      description: "Current stock value at cost price",
      icon: BarChart3,
    },
    {
      title: "Sales Performance",
      description: "Best selling products and categories",
      icon: PieChart,
    },
    {
      title: "Outstanding Aging",
      description: "Receivables aging (0-30, 30-60, 60+ days)",
      icon: CalendarIcon,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-extrabold text-[#1A1210]">
            {t("businessReports")}
          </h2>
          <p className="text-[#7A6055]">
            {t("analyzeYourPerformanceAndFinancial")}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="border-[#E5DDD5]">
            <Download size={18} className="me-2" /> {t("exportAllCsv")}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {reportCards.map((report, i) => (
          <Card
            key={i}
            className="border-[#E5DDD5] hover:border-[#C9A84C] transition-all cursor-pointer group"
          >
            <CardHeader className="flex flex-row items-center justify-between pb-4">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-xl bg-[#FAF8F6] flex items-center justify-center text-[#8B5E3C] group-hover:bg-[#C9A84C] group-hover:text-white transition-colors">
                  <report.icon size={24} />
                </div>
                <div>
                  <CardTitle className="text-[#1A1210]">
                    {report.title}
                  </CardTitle>
                  <CardDescription>{report.description}</CardDescription>
                </div>
              </div>
              <ChevronRight className="text-[#A89080] group-hover:text-[#C9A84C] transition-colors" />
            </CardHeader>
            <CardContent>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 text-[10px] uppercase font-bold tracking-wider"
                >
                  <FileText size={12} className="me-1" /> {t("pdf")}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 text-[10px] uppercase font-bold tracking-wider"
                >
                  <Download size={12} className="me-1" /> {t("csv")}
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border-[#E5DDD5]">
        <CardHeader>
          <CardTitle>{t("recentGeneratedReports")}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map((_, i) => (
              <div
                key={i}
                className="flex items-center justify-between p-3 rounded-lg border border-transparent hover:border-[#E5DDD5] hover:bg-[#FAF8F6] transition-all"
              >
                <div className="flex items-center gap-3">
                  <FileText size={20} className="text-[#A89080]" />
                  <div>
                    <p className="text-sm font-semibold text-[#1A1210]">
                      {t("salesreportapril2026pdf")}
                    </p>
                    <p className="text-[10px] text-[#A89080] uppercase font-bold tracking-widest">
                      {t("generated2HoursAgo24")}
                    </p>
                  </div>
                </div>
                <Button variant="ghost" size="icon" className="text-[#C9A84C]">
                  <Download size={18} />
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

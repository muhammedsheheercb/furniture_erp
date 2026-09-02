"use client";
import { useEffect, useState, use } from "react";
import { useSession } from "next-auth/react";
import axios from "axios";
import { format } from "date-fns";
import { ArrowLeft, Filter, RefreshCcw } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/Badge";
import Link from "next/link";
import CurrencySymbol from "@/components/ui/CurrencySymbol";
import { useLanguage } from "../../../../context/LanguageContext";

export default function PurchaserDetailsPage(props: { params: Promise<{ id: string }> }) {
  const params = use(props.params);
  const { t } = useLanguage();
  const [purchaser, setPurchaser] = useState<any>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [filterType, setFilterType] = useState("all");

  const fetchPurchaser = async () => {
    try {
      const res = await axios.get(`/api/purchasers/${params.id}`);
      if (res.data.success) {
        setPurchaser(res.data.data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      const query = new URLSearchParams({ purchaserId: params.id });
      if (startDate) query.append("startDate", startDate);
      if (endDate) query.append("endDate", endDate);
      query.append("limit", "1000");

      const [purRes, expRes] = await Promise.all([
        axios.get(`/api/purchases?${query.toString()}`),
        axios.get(`/api/expenses?${query.toString()}`),
      ]);

      let combined: any[] = [];
      if (purRes.data.success) {
        combined = [
          ...combined,
          ...purRes.data.data.map((p: any) => ({ ...p, _type: "purchase" })),
        ];
      }
      if (expRes.data.success) {
        combined = [
          ...combined,
          ...expRes.data.data.map((e: any) => ({ ...e, _type: "expense" })),
        ];
      }

      combined.sort(
        (a, b) =>
          new Date(b.date || b.createdAt).getTime() -
          new Date(a.date || a.createdAt).getTime(),
      );

      setTransactions(combined);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPurchaser();
    fetchTransactions();
  }, [params.id]);

  const handleFilter = () => {
    fetchTransactions();
  };

  const handleReset = () => {
    setStartDate("");
    setEndDate("");
    setFilterType("all");
    setTimeout(() => {
      fetchTransactions();
    }, 100);
  };

  if (!purchaser) return <div className="p-10 text-center">{t("loading")}...</div>;

  const filteredTransactions = transactions.filter(
    (t) => filterType === "all" || t._type === filterType
  );

  const totalAmount = filteredTransactions.reduce(
    (sum, t) => sum + (t._type === "purchase" ? t.total : t.amount),
    0
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/purchasers">
          <Button variant="outline" size="icon" className="border-[#E5DDD5]">
            <ArrowLeft size={16} />
          </Button>
        </Link>
        <div>
          <h2 className="text-2xl font-extrabold text-[#1A1210]">
            {purchaser.name}
          </h2>
          <p className="text-[#7A6055]">{purchaser.mobile || t("noMobile")}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-[#E5DDD5] md:col-span-1">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-[#7A6055] uppercase">
              {t("totalTransactions") || "Total Transactions Amount"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-[#1A1210]">
              <CurrencySymbol /> {totalAmount.toLocaleString()}
            </div>
            <p className="text-xs text-[#A89080] mt-1">{filteredTransactions.length} {t("transactions") || "Transactions"}</p>
          </CardContent>
        </Card>

        <Card className="border-[#E5DDD5] md:col-span-3">
          <CardHeader className="pb-2 border-b border-[#E5DDD5] bg-[#FAF8F6]">
            <div className="flex flex-wrap gap-4 items-center">
              <div className="flex items-center gap-2">
                <Filter size={16} className="text-[#7A6055]" />
                <span className="text-sm font-bold text-[#7A6055]">{t("filterByDate")}</span>
              </div>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-auto border-[#E5DDD5]"
              />
              <span className="text-[#A89080]">{t("to")}</span>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-auto border-[#E5DDD5]"
              />
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="h-10 px-3 rounded-md border border-[#E5DDD5] bg-[#FAF8F6] text-sm text-[#1A1210] outline-none focus:ring-2 focus:ring-[#C9A84C]/20 transition-all"
              >
                <option value="all">{t("allTransactions") || "All Transactions"}</option>
                <option value="purchase">{t("purchases") || "Purchases"}</option>
                <option value="expense">{t("expenses") || "Expenses"}</option>
              </select>
              <Button onClick={handleFilter} className="bg-[#2C1810] text-white hover:bg-[#1A0F0A]">
                {t("apply")}
              </Button>
              <Button onClick={handleReset} variant="outline" className="border-[#E5DDD5]">
                <RefreshCcw size={16} className="me-2" /> {t("reset")}
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="flex items-center justify-center py-20">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#C9A84C]"></div>
              </div>
            ) : (
              <div className="overflow-x-auto max-h-[500px]">
                <table className="w-full text-start border-collapse">
                  <thead className="sticky top-0 bg-[#FAF8F6] z-10">
                    <tr className="border-b border-[#E5DDD5]">
                      <th className="py-3 px-4 text-xs font-bold text-[#7A6055] uppercase">{t("date")}</th>
                      <th className="py-3 px-4 text-xs font-bold text-[#7A6055] uppercase">{t("type")}</th>
                      <th className="py-3 px-4 text-xs font-bold text-[#7A6055] uppercase">{t("reference")}</th>
                      <th className="py-3 px-4 text-xs font-bold text-[#7A6055] uppercase">{t("details")}</th>
                      <th className="py-3 px-4 text-xs font-bold text-[#7A6055] uppercase text-end">{t("amount")}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#F0EBE5]">
                    {filteredTransactions.length > 0 ? (
                      filteredTransactions.map((txn) => (
                        <tr key={txn._id} className="hover:bg-[#FAF8F6]">
                          <td className="py-3 px-4 text-sm">
                            {format(new Date(txn.date || txn.createdAt), "dd MMM yyyy")}
                          </td>
                          <td className="py-3 px-4 text-sm font-semibold">
                            {txn._type === "purchase" ? (
                              <span className="px-2 py-1 bg-emerald-50 text-emerald-600 rounded-full text-xs">
                                {t("purchase")}
                              </span>
                            ) : (
                              <span className="px-2 py-1 bg-rose-50 text-rose-600 rounded-full text-xs">
                                {t("expense")}
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-sm font-mono text-[#1A1210]">
                            {txn._type === "purchase" ? txn.purchaseNumber : txn.expenseNumber}
                          </td>
                          <td className="py-3 px-4 text-sm">
                            <div className="font-semibold text-[#1A1210]">
                              {txn._type === "purchase" ? txn.supplierName : txn.title}
                            </div>
                            <div className="text-xs text-[#7A6055] mt-0.5">
                              {txn._type === "purchase" ? "Supplier" : txn.category}
                            </div>
                          </td>
                          <td className="py-3 px-4 text-sm font-bold text-[#1A1210] text-end">
                            <CurrencySymbol /> {(txn._type === "purchase" ? txn.total : txn.amount).toLocaleString()}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={5} className="py-10 text-center text-[#7A6055]">
                          {t("noData")}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

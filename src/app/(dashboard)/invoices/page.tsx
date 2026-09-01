"use client";
import { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "sonner";
import {
  Receipt,
  Printer,
  Search,
  CheckCircle2,
  Download,
  Wallet,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/Input";
import { formatDate, formatCurrency } from "@/lib/utils";
import CurrencySymbol from "@/components/ui/CurrencySymbol";
import UpdateBalanceModal from "@/components/sales/UpdateBalanceModal";
import { useDateFilter } from "@/context/DateFilterContext";
import Pagination from "@/components/ui/Pagination";
import { generateInvoicePDF } from "@/lib/pdf-utils";
import { useLanguage } from "../../../context/LanguageContext";

// ── helpers ───────────────────────────────────────────────────────────────────
function printSale(item: any) {
  generateInvoicePDF({
    number: item.saleNumber,
    customerOrSupplier: item.customerName,
    customerOrSupplierNumber: item.customerNumber,
    date: item.date,
    paymentType: item.paymentType,
    items: item.items,
    subtotal: item.subtotal,
    tax: item.tax,
    discount: item.discount,
    total: item.total,
    type: "Sale",
    isTaxInvoice: item.isTaxInvoice,
    advancePaid: item.advancePaid,
    customerMobile: item.customerMobile,
    customerAddress: item.customerAddress,
    deliveryAddress: item.deliveryAddress,
    deliveryDate: item.deliveryDate,
    createdBy: item.createdBy?.name,
  });
}

export default function InvoicesPage() {
  const { t } = useLanguage();
  const { startDate, endDate } = useDateFilter();
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 10;
  const [balanceSale, setBalanceSale] = useState<any | null>(null);
  const [balanceModalOpen, setBalanceModalOpen] = useState(false);

  const fetchInvoices = async () => {
    setLoading(true);
    try {
      // Invoices are delivered sales
      const params = new URLSearchParams({
        status: "invoiced",
        search,
        page: page.toString(),
        limit: limit.toString(),
        ...(startDate && { startDate }),
        ...(endDate && { endDate }),
      });
      const res = await axios.get(`/api/sales?${params}`);
      if (res.data.success) {
        setInvoices(res.data.data);
        setTotalPages(res.data.totalPages || 1);
        setTotal(res.data.total || 0);
      }
    } catch (err) {
      toast.error("Failed to load invoices");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setPage(1);
  }, [search, startDate, endDate]);
  useEffect(() => {
    fetchInvoices();
  }, [search, startDate, endDate, page]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-extrabold text-[#1A1210]">
            {t("invoices")}
          </h2>
          <p className="text-[#7A6055]">{t("viewAndPrintInvoicesFor")}</p>
        </div>
      </div>

      <UpdateBalanceModal
        open={balanceModalOpen}
        onClose={() => {
          setBalanceModalOpen(false);
          setBalanceSale(null);
        }}
        onSuccess={() => fetchInvoices()}
        sale={balanceSale}
      />

      <Card className="border-[#E5DDD5]">
        <CardHeader className="p-4 border-b border-[#E5DDD5]">
          <div className="relative flex-1 max-w-md">
            <Search
              className="absolute start-3 top-1/2 -translate-y-1/2 text-[#A89080]"
              size={18}
            />
            <Input
              placeholder={t("searchInvoices")}
              className="ps-10 border-[#E5DDD5] bg-[#FAF8F6]"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="py-20 text-center text-[#7A6055]">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#C9A84C] mx-auto mb-4"></div>
              {t("loadingInvoices")}
            </div>
          ) : invoices.length === 0 ? (
            <div className="py-20 text-center text-[#7A6055]">
              <Receipt size={48} className="mx-auto mb-4 opacity-20" />
              <p>{t("noDeliveredOrdersFoundTo")}</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-start border-collapse">
                <thead>
                  <tr className="bg-[#FAF8F6] border-b border-[#E5DDD5]">
                    <th className="py-4 px-6 text-xs font-bold text-[#7A6055] uppercase">
                      {t("invoice")}
                    </th>
                    <th className="py-4 px-6 text-xs font-bold text-[#7A6055] uppercase">
                      {t("customer")}
                    </th>
                    <th className="py-4 px-6 text-xs font-bold text-[#7A6055] uppercase text-end">
                      {t("total")}
                    </th>
                    <th className="py-4 px-6 text-xs font-bold text-[#7A6055] uppercase text-end">
                      {t("balance")}
                    </th>
                    <th className="py-4 px-6 text-xs font-bold text-[#7A6055] uppercase text-center">
                      {t("paymentStatus")}
                    </th>
                    <th className="py-4 px-6 text-xs font-bold text-[#7A6055] uppercase text-center">
                      {t("orderStatus")}
                    </th>
                    <th className="py-4 px-6 text-xs font-bold text-[#7A6055] uppercase text-end">
                      {t("actions")}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F0EBE5]">
                  {invoices.map((inv) => (
                    <tr
                      key={inv._id}
                      className="hover:bg-[#FAF8F6] transition-colors group"
                    >
                      <td className="py-4 px-6 font-mono text-sm text-[#1A1210]">
                        {inv.saleNumber}
                      </td>
                      <td className="py-4 px-6">
                        <div className="text-sm font-semibold text-[#1A1210]">
                          {inv.customerName}
                        </div>
                        <div className="text-[10px] text-[#A89080]">
                          {formatDate(inv.date)}
                        </div>
                      </td>
                      <td className="py-4 px-6 text-sm font-bold text-[#1A1210] text-end">
                        <CurrencySymbol /> {inv.total.toLocaleString()}
                      </td>
                      <td className="py-4 px-6 text-sm text-rose-600 font-semibold text-end">
                        <CurrencySymbol />{" "}
                        {(inv.total - (inv.advancePaid || 0)).toLocaleString()}
                      </td>
                      <td className="py-4 px-6 text-center">
                        {(() => {
                          const balance = inv.total - (inv.advancePaid || 0);
                          if (balance <= 0) {
                            return (
                              <Badge className="bg-emerald-50 text-emerald-600 border-emerald-100 text-[10px] uppercase font-bold">
                                {t("orderClose")}
                              </Badge>
                            );
                          }
                          return (
                            <Badge className="bg-amber-50 text-amber-600 border-amber-100 text-[10px] uppercase font-bold">
                              {t("balanceAmountPending")}
                            </Badge>
                          );
                        })()}
                      </td>
                      <td className="py-4 px-6 text-center">
                        {(() => {
                          if (
                            inv.deliveryStatus === "delivered" ||
                            inv.status === "invoiced"
                          ) {
                            return (
                              <Badge className="bg-emerald-50 text-emerald-600 border-emerald-100 text-[10px] uppercase font-bold">
                                {t("delivered")}
                              </Badge>
                            );
                          }

                          if (
                            inv.productionStatus === "finished" ||
                            inv.status === "delivered"
                          ) {
                            return (
                              <Badge className="bg-blue-50 text-blue-600 border-blue-100 text-[10px] uppercase font-bold">
                                {t("deliveryPending")}
                              </Badge>
                            );
                          }

                          if (inv.productionStatus === "processing") {
                            return (
                              <Badge className="bg-amber-50 text-amber-600 border-amber-100 text-[10px] uppercase font-bold">
                                {t("productionPending")}
                              </Badge>
                            );
                          }

                          return (
                            <Badge className="bg-gray-50 text-gray-600 border-gray-100 text-[10px] uppercase font-bold">
                              {t("waitingForProduction")}
                            </Badge>
                          );
                        })()}
                      </td>
                      <td className="py-4 px-6 text-end">
                        <div className="flex justify-end gap-2">
                          {inv.total - (inv.advancePaid || 0) > 0 && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-[#C9A84C]"
                              title={t("updateBalance")}
                              onClick={() => {
                                setBalanceSale(inv);
                                setBalanceModalOpen(true);
                              }}
                            >
                              <Wallet size={16} />
                            </Button>
                          )}
                          <Button
                            variant="outline"
                            size="sm"
                            className="border-[#E5DDD5] text-[#7A6055]"
                            onClick={() => printSale(inv)}
                          >
                            <Printer size={14} className="me-1" /> {t("print")}
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {totalPages > 1 && (
            <div className="border-t border-[#E5DDD5]">
              <Pagination
                page={page}
                totalPages={totalPages}
                total={total}
                limit={limit}
                onPageChange={setPage}
              />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

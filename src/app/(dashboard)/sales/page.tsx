"use client";
import {
  Plus,
  Search,
  Printer,
  ClipboardList,
  Trash2,
  Wallet,
  Receipt,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import axios from "axios";
import { toast } from "sonner";
import { format } from "date-fns";
import { useDateFilter } from "@/context/DateFilterContext";

import SaleModal from "@/components/sales/SaleModal";
import UpdateBalanceModal from "@/components/sales/UpdateBalanceModal";
import ConfirmModal from "@/components/ui/ConfirmModal";
import CurrencySymbol from "@/components/ui/CurrencySymbol";
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

// ── page ──────────────────────────────────────────────────────────────────────
export default function SalesPage() {
  const { t } = useLanguage();
  const { data: session } = useSession();
  const { startDate, endDate } = useDateFilter();
  const isAdmin = session?.user?.role === "admin";
  const perms = (session?.user?.permissions as any)?.sales;
  const canCreate = isAdmin || perms?.create;
  const canEdit = isAdmin || perms?.edit;
  const canDelete = isAdmin || perms?.delete;

  const [activeTab, setActiveTab] = useState("convert");
  const [sales, setSales] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 10;
  const [modalOpen, setModalOpen] = useState(false);
  const [editSale, setEditSale] = useState<any | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [balanceSale, setBalanceSale] = useState<any | null>(null);
  const [balanceModalOpen, setBalanceModalOpen] = useState(false);
  const [quotations, setQuotations] = useState<any[]>([]);
  const [loadingQuotes, setLoadingQuotes] = useState(false);

  // ── fetch ─────────────────────────────────────────────────────────────────
  const fetchSales = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        search,
        ...(startDate && { startDate }),
        ...(endDate && { endDate }),
        page: page.toString(),
        limit: limit.toString(),
      });
      const res = await axios.get(`/api/sales?${params}`);
      if (res.data.success) {
        setSales(res.data.data);
        setTotalPages(res.data.totalPages || 1);
        setTotal(res.data.total || 0);
      }
    } catch {
      toast.error("Failed to load sales");
    } finally {
      setLoading(false);
    }
  };

  const fetchQuotes = async () => {
    setLoadingQuotes(true);
    try {
      const res = await axios.get(
        `/api/quotations?search=${search}&status=sale&converted=false`,
      );
      if (res.data.success) setQuotations(res.data.data);
    } catch {
      // silent
    } finally {
      setLoadingQuotes(false);
    }
  };

  useEffect(() => {
    setPage(1);
  }, [search, startDate, endDate]);
  useEffect(() => {
    fetchSales();
    fetchQuotes();
  }, [search, startDate, endDate, page]);

  // ── submit sale ───────────────────────────────────────────────────────────
  const handleSubmitSale = async (data: any) => {
    setSaving(true);
    try {
      if (editSale?._id) {
        const res = await axios.put(`/api/sales/${editSale._id}`, data);
        if (res.data.success) {
          toast.success("Order updated");
          printSale(res.data.data);
          setModalOpen(false);
          setEditSale(null);
          fetchSales();
        }
      } else {
        const res = await axios.post("/api/sales", {
          ...data,
          quotationId: editSale?.quotationId,
        });
        if (res.data.success) {
          toast.success("Sale order created");
          printSale(res.data.data);
          setModalOpen(false);
          setEditSale(null);
          fetchSales();
          fetchQuotes();
        }
      }
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Failed to save order");
    } finally {
      setSaving(false);
    }
  };

  // ── delete ────────────────────────────────────────────────────────────────
  const handleConfirmDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try {
      const res = await axios.delete(`/api/sales/${deleteId}`);
      if (res.data.success) {
        toast.success("Order deleted");
        setDeleteId(null);
        fetchSales();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Failed to delete order");
    } finally {
      setDeleting(false);
    }
  };

  // ── render ────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-extrabold text-[#1A1210]">
            {t("sales")}
          </h2>
          <p className="text-[#7A6055]">
            {t("manageQuotationsDirectSalesAnd")}
          </p>
        </div>
        <div className="flex gap-2">
          {canCreate && (
            <Button
              className="bg-[#1B3A2D] hover:bg-[#163222] text-white font-bold"
              onClick={() => {
                setEditSale(null);
                setModalOpen(true);
              }}
            >
              <Plus size={16} className="me-2" /> {t("directSalesBill")}
            </Button>
          )}
        </div>
      </div>

      {/* Modals */}
      <SaleModal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditSale(null);
        }}
        onSubmit={handleSubmitSale}
        sale={editSale}
        loading={saving}
      />

      <ConfirmModal
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleConfirmDelete}
        title={t("deleteSaleOrder")}
        message={t("areYouSureYouWant")}
        loading={deleting}
      />

      <UpdateBalanceModal
        open={balanceModalOpen}
        onClose={() => {
          setBalanceModalOpen(false);
          setBalanceSale(null);
        }}
        onSuccess={() => fetchSales()}
        sale={balanceSale}
      />

      {/* Tabs */}
      <Tabs
        defaultValue="convert"
        className="w-full"
        onValueChange={setActiveTab}
      >
        <TabsList className="bg-[#FAF8F6] border border-[#E5DDD5] p-1 h-12">
          <TabsTrigger
            value="convert"
            className="data-[state=active]:bg-white data-[state=active]:text-[#C9A84C] data-[state=active]:shadow-sm px-6"
          >
            {t("readyToConvert")}
          </TabsTrigger>
          <TabsTrigger
            value="orders"
            className="data-[state=active]:bg-white data-[state=active]:text-[#C9A84C] data-[state=active]:shadow-sm px-6"
          >
            {t("activeSalesOrders")}
          </TabsTrigger>
          <TabsTrigger
            value="invoices"
            className="data-[state=active]:bg-white data-[state=active]:text-[#C9A84C] data-[state=active]:shadow-sm px-6"
          >
            {t("invoices")}
          </TabsTrigger>
        </TabsList>

        <Card className="mt-6 border-[#E5DDD5]">
          <CardHeader className="p-4 border-b border-[#E5DDD5]">
            <div className="relative">
              <Search
                className="absolute start-3 top-1/2 -translate-y-1/2 text-[#A89080]"
                size={18}
              />
              <Input
                placeholder={`Search ${activeTab}...`}
                className="ps-10 border-[#E5DDD5] bg-[#FAF8F6]"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="flex items-center justify-center py-20">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#C9A84C]" />
              </div>
            ) : (
              <>
                {/* ── Ready to Convert ──────────────────────────────── */}
                <TabsContent value="convert" className="m-0">
                  <div className="overflow-x-auto">
                    <table className="w-full text-start border-collapse">
                      <thead>
                        <tr className="bg-[#FAF8F6] border-b border-[#E5DDD5]">
                          <th className="py-4 px-6 text-xs font-bold text-[#7A6055] uppercase">
                            {t("quote")}
                          </th>
                          <th className="py-4 px-6 text-xs font-bold text-[#7A6055] uppercase">
                            {t("customer")}
                          </th>
                          <th className="py-4 px-6 text-xs font-bold text-[#7A6055] uppercase">
                            {t("total")}
                          </th>
                          <th className="py-4 px-6 text-xs font-bold text-[#7A6055] uppercase text-center">
                            {t("status")}
                          </th>
                          <th className="py-4 px-6 text-xs font-bold text-[#7A6055] uppercase text-end">
                            {t("actions")}
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#F0EBE5]">
                        {quotations.length === 0 ? (
                          <tr>
                            <td
                              colSpan={5}
                              className="py-10 text-center text-[#7A6055]"
                            >
                              {t("noQuotationsReadyForConversion")}
                            </td>
                          </tr>
                        ) : (
                          quotations.map((q) => (
                            <tr
                              key={q._id}
                              className="hover:bg-[#FAF8F6] transition-colors"
                            >
                              <td className="py-4 px-6 font-mono text-sm text-[#1A1210]">
                                {q.quotationNumber}
                              </td>
                              <td className="py-4 px-6">
                                <div className="text-sm font-semibold text-[#1A1210]">
                                  {q.customerName}
                                </div>
                                <div className="text-[10px] text-[#A89080]">
                                  {format(new Date(q.date), "dd MMM yyyy")}
                                </div>
                              </td>
                              <td className="py-4 px-6 text-sm font-bold text-[#1A1210]">
                                <CurrencySymbol /> {q.total.toLocaleString()}
                              </td>
                              <td className="py-4 px-6 text-center">
                                <Badge className="bg-indigo-50 text-indigo-600 border-indigo-100 text-[10px] uppercase">
                                  {t("quotation")}
                                </Badge>
                              </td>
                              <td className="py-4 px-6 text-end">
                                {canCreate && (
                                  <Button
                                    size="sm"
                                    className="h-8 bg-[#2C1810] hover:bg-[#1A0F0A] text-white px-3 text-xs"
                                    onClick={() => {
                                      setEditSale({
                                        customerId:
                                          q.customerId?._id || q.customerId,
                                        customerName: q.customerName,
                                        customerNumber:
                                          q.customerId?.customerNumber || "",
                                        customerMobile: q.customerMobile || "",
                                        customerAddress:
                                          q.customerAddress || "",
                                        items: q.items.map((it: any) => ({
                                          itemId: it.itemId,
                                          itemNumber: it.itemNumber,
                                          itemName: it.itemName,
                                          quantity: it.quantity,
                                          price: it.price,
                                          discount: it.discount,
                                          color: it.color,
                                          material: it.material,
                                          size: it.size,
                                          subtotal: it.subtotal,
                                          taxAmount: it.taxAmount,
                                          total: it.total,
                                          dimensions: it.dimensions,
                                          bom: it.bom,
                                        })),
                                        subtotal: q.subtotal,
                                        tax: q.tax,
                                        discount: q.discount,
                                        total: q.total,
                                        quotationId: q._id,
                                        isConversion: true,
                                      });
                                      setModalOpen(true);
                                    }}
                                  >
                                    {t("convertToSale")}
                                  </Button>
                                )}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </TabsContent>

                {/* ── Active Sales Orders ───────────────────────────── */}
                <TabsContent value="orders" className="m-0">
                  <div className="overflow-x-auto">
                    <table className="w-full text-start border-collapse">
                      <thead>
                        <tr className="bg-[#FAF8F6] border-b border-[#E5DDD5]">
                          <th className="py-4 px-6 text-xs font-bold text-[#7A6055] uppercase">
                            {t("order")}
                          </th>
                          <th className="py-4 px-6 text-xs font-bold text-[#7A6055] uppercase">
                            {t("customer")}
                          </th>
                          <th className="py-4 px-6 text-xs font-bold text-[#7A6055] uppercase">
                            {t("total")}
                          </th>
                          <th className="py-4 px-6 text-xs font-bold text-[#7A6055] uppercase">
                            {t("advance")}
                          </th>
                          <th className="py-4 px-6 text-xs font-bold text-[#7A6055] uppercase">
                            {t("balance")}
                          </th>
                          <th className="py-4 px-6 text-xs font-bold text-[#7A6055] uppercase text-center">
                            {t("payment")}
                          </th>
                          <th className="py-4 px-6 text-xs font-bold text-[#7A6055] uppercase text-center">
                            {t("orderStatus")}
                          </th>
                          <th className="py-4 px-6 text-xs font-bold text-[#7A6055] uppercase text-center">
                            {t("salesPerson")}
                          </th>
                          <th className="py-4 px-6 text-xs font-bold text-[#7A6055] uppercase text-end">
                            {t("actions")}
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#F0EBE5]">
                        {(() => {
                          const activeOrders = sales
                            .filter((item) => {
                              const bal = item.total - (item.advancePaid || 0);
                              const delivered =
                                item.deliveryStatus === "delivered" ||
                                item.status === "invoiced";
                              return bal > 0 || !delivered;
                            })
                            .sort(
                              (a, b) =>
                                new Date(b.date || b.createdAt).getTime() -
                                new Date(a.date || a.createdAt).getTime(),
                            );

                          if (activeOrders.length === 0) {
                            return (
                              <tr>
                                <td
                                  colSpan={8}
                                  className="py-10 text-center text-[#7A6055]"
                                >
                                  {t("noActiveSalesOrders")}
                                </td>
                              </tr>
                            );
                          }

                          return activeOrders.map((item) => {
                            const bal = item.total - (item.advancePaid || 0);
                            const delivered =
                              item.deliveryStatus === "delivered" ||
                              item.status === "invoiced";

                            return (
                              <tr
                                key={item._id}
                                className="hover:bg-[#FAF8F6] transition-colors"
                              >
                                {/* Order # */}
                                <td className="py-4 px-6 font-mono text-sm text-[#1A1210]">
                                  {item.saleNumber}
                                </td>

                                {/* Customer */}
                                <td className="py-4 px-6">
                                  <div className="text-sm font-semibold text-[#1A1210]">
                                    {item.customerName}
                                  </div>
                                  <div className="text-[10px] text-[#A89080]">
                                    {item.customerNumber && (
                                      <span className="me-2 font-mono">
                                        {item.customerNumber}
                                      </span>
                                    )}
                                    {format(
                                      new Date(item.date || item.createdAt),
                                      "dd MMM yyyy",
                                    )}
                                  </div>
                                </td>

                                {/* Total */}
                                <td className="py-4 px-6 text-sm font-bold text-[#1A1210]">
                                  <CurrencySymbol />{" "}
                                  {item.total.toLocaleString()}
                                </td>

                                {/* Advance */}
                                <td className="py-4 px-6 text-sm text-emerald-700 font-semibold">
                                  <CurrencySymbol />{" "}
                                  {(item.advancePaid || 0).toLocaleString()}
                                </td>

                                {/* Balance */}
                                <td className="py-4 px-6 text-sm font-bold">
                                  <span
                                    className={
                                      bal > 0
                                        ? "text-rose-600"
                                        : "text-emerald-600"
                                    }
                                  >
                                    <CurrencySymbol />{" "}
                                    {Math.max(0, bal).toLocaleString()}
                                  </span>
                                </td>

                                {/* Payment status */}
                                <td className="py-4 px-6 text-center">
                                  {bal <= 0 ? (
                                    <Badge className="bg-emerald-50 text-emerald-700 border-emerald-100 text-[10px] uppercase font-bold">
                                      {t("paid")}
                                    </Badge>
                                  ) : (
                                    <Badge className="bg-amber-50 text-amber-700 border-amber-100 text-[10px] uppercase font-bold">
                                      {t("balancePending")}
                                    </Badge>
                                  )}
                                </td>

                                {/* Order status */}
                                <td className="py-4 px-6 text-center">
                                  {delivered ? (
                                    <Badge className="bg-emerald-50 text-emerald-700 border-emerald-100 text-[10px] uppercase font-bold">
                                      {t("delivered")}
                                    </Badge>
                                  ) : item.productionStatus === "finished" ||
                                    item.status === "delivered" ? (
                                    <Badge className="bg-blue-50 text-blue-700 border-blue-100 text-[10px] uppercase font-bold">
                                      {t("deliveryPending")}
                                    </Badge>
                                  ) : item.productionStatus === "processing" ? (
                                    <Badge className="bg-amber-50 text-amber-700 border-amber-100 text-[10px] uppercase font-bold">
                                      {t("inProduction")}
                                    </Badge>
                                  ) : (
                                    <Badge className="bg-gray-50 text-gray-600 border-gray-100 text-[10px] uppercase font-bold">
                                      {t("pending")}
                                    </Badge>
                                  )}
                                </td>

                                {/* Created By */}
                                <td className="py-4 px-6 text-center">
                                  <span className="text-xs font-semibold text-indigo-600 bg-indigo-50 px-2 py-1 rounded">
                                    {item.createdBy?.name || "—"}
                                  </span>
                                </td>

                                {/* Actions */}
                                <td className="py-4 px-6">
                                  <div className="flex justify-end items-center gap-1">
                                    {/* Print */}
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      title={t("printInvoice")}
                                      className="h-8 w-8 text-[#7A6055] hover:text-[#1A1210] hover:bg-[#F0EBE5]"
                                      onClick={() => printSale(item)}
                                    >
                                      <Printer size={15} />
                                    </Button>

                                    {/* Receive balance payment */}
                                    {canEdit && bal > 0 && (
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        title={t("receivePayment")}
                                        className="h-8 w-8 text-[#C9A84C] hover:text-amber-700 hover:bg-amber-50"
                                        onClick={() => {
                                          setBalanceSale(item);
                                          setBalanceModalOpen(true);
                                        }}
                                      >
                                        <Wallet size={15} />
                                      </Button>
                                    )}

                                    {/* Delete (only if not fully completed) */}
                                    {canDelete &&
                                      item.status !== "delivered" &&
                                      item.status !== "invoiced" && (
                                        <Button
                                          variant="ghost"
                                          size="icon"
                                          title={t("deleteOrder")}
                                          className="h-8 w-8 text-rose-400 hover:text-rose-600 hover:bg-rose-50"
                                          onClick={() => setDeleteId(item._id)}
                                        >
                                          <Trash2 size={15} />
                                        </Button>
                                      )}
                                  </div>
                                </td>
                              </tr>
                            );
                          });
                        })()}
                      </tbody>
                    </table>
                  </div>
                </TabsContent>

                {/* ── Invoices ──────────────────────────────────────── */}
                <TabsContent value="invoices" className="m-0">
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
                          <th className="py-4 px-6 text-xs font-bold text-[#7A6055] uppercase">
                            {t("total")}
                          </th>
                          <th className="py-4 px-6 text-xs font-bold text-[#7A6055] uppercase text-center">
                            {t("status")}
                          </th>
                          <th className="py-4 px-6 text-xs font-bold text-[#7A6055] uppercase text-center">
                            {t("date")}
                          </th>
                          <th className="py-4 px-6 text-xs font-bold text-[#7A6055] uppercase text-center">
                            {t("salesPerson")}
                          </th>
                          <th className="py-4 px-6 text-xs font-bold text-[#7A6055] uppercase text-end">
                            {t("print")}
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#F0EBE5]">
                        {(() => {
                          const invoices = sales
                            .filter((item) => {
                              const bal = item.total - (item.advancePaid || 0);
                              const delivered =
                                item.deliveryStatus === "delivered" ||
                                item.status === "invoiced";
                              return bal <= 0 && delivered;
                            })
                            .sort(
                              (a, b) =>
                                new Date(b.date || b.createdAt).getTime() -
                                new Date(a.date || a.createdAt).getTime(),
                            );

                          if (invoices.length === 0) {
                            return (
                              <tr>
                                <td
                                  colSpan={6}
                                  className="py-10 text-center text-[#7A6055]"
                                >
                                  {t("noCompletedInvoicesYet")}
                                </td>
                              </tr>
                            );
                          }

                          return invoices.map((item) => (
                            <tr
                              key={item._id}
                              className="hover:bg-[#FAF8F6] transition-colors"
                            >
                              <td className="py-4 px-6 font-mono text-sm text-[#1A1210]">
                                {item.saleNumber}
                              </td>
                              <td className="py-4 px-6">
                                <div className="text-sm font-semibold text-[#1A1210]">
                                  {item.customerName}
                                </div>
                                {item.customerNumber && (
                                  <div className="text-[10px] font-mono text-[#A89080]">
                                    {item.customerNumber}
                                  </div>
                                )}
                              </td>
                              <td className="py-4 px-6 text-sm font-bold text-[#1A1210]">
                                <CurrencySymbol /> {item.total.toLocaleString()}
                              </td>
                              <td className="py-4 px-6 text-center">
                                <Badge className="bg-emerald-50 text-emerald-700 border-emerald-100 text-[10px] uppercase font-bold">
                                  {t("paidAmpDelivered")}
                                </Badge>
                              </td>
                              <td className="py-4 px-6 text-center text-sm text-[#7A6055]">
                                {format(
                                  new Date(item.date || item.createdAt),
                                  "dd MMM yyyy",
                                )}
                              </td>
                              <td className="py-4 px-6 text-center">
                                <span className="text-xs font-semibold text-indigo-600 bg-indigo-50 px-2 py-1 rounded">
                                  {item.createdBy?.name || "—"}
                                </span>
                              </td>
                              <td className="py-4 px-6 text-end">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  title={t("printInvoice")}
                                  className="h-8 w-8 text-[#7A6055] hover:text-[#1A1210] hover:bg-[#F0EBE5]"
                                  onClick={() => printSale(item)}
                                >
                                  <Printer size={16} />
                                </Button>
                              </td>
                            </tr>
                          ));
                        })()}
                      </tbody>
                    </table>
                  </div>
                </TabsContent>
              </>
            )}

            {!loading && totalPages > 1 && activeTab !== "convert" && (
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
      </Tabs>
    </div>
  );
}

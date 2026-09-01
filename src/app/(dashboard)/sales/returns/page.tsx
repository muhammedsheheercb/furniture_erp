"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import {
  Undo2,
  Plus,
  Search,
  Calendar,
  User,
  Hash,
  ChevronRight,
  RefreshCcw,
  AlertCircle,
  Trash2,
  FileText,
  MessageSquare,
} from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";
import Badge from "@/components/ui/Badge";
import { useDateFilter } from "@/context/DateFilterContext";
import { useSession } from "next-auth/react";
import Pagination from "@/components/ui/Pagination";
import { useLanguage } from "../../../../context/LanguageContext";

export default function SalesReturnsPage() {
  const { t } = useLanguage();
  const { startDate, endDate } = useDateFilter();
  const { data: session } = useSession();
  const isAdmin =
    session?.user?.role === "admin" || session?.user?.role === "owner";

  const [returns, setReturns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 10;

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedSale, setSelectedSale] = useState<any>(null);
  const [salesSearch, setSalesSearch] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searchingSales, setSearchingSales] = useState(false);
  const [returnItems, setReturnItems] = useState<any[]>([]);
  const [reason, setReason] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setPage(1);
  }, [startDate, endDate, searchTerm]);

  const fetchReturns = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        search: searchTerm,
        ...(startDate && { startDate }),
        ...(endDate && { endDate }),
      });
      const res = await axios.get(`/api/sales/returns?${params}`);
      if (res.data.success) {
        setReturns(res.data.data);
        setTotalPages(res.data.totalPages || 1);
        setTotal(res.data.total || 0);
      }
    } catch (err) {
      console.error("Failed to fetch returns", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      fetchReturns();
    }, 300);
    return () => clearTimeout(delayDebounce);
  }, [startDate, endDate, page, searchTerm]);

  const handleSearchSales = async () => {
    if (!salesSearch.trim()) return;
    setSearchingSales(true);
    try {
      const res = await axios.get(`/api/sales?search=${salesSearch}`);
      if (res.data.success) setSearchResults(res.data.data);
    } catch (err) {
      console.error("Failed to search sales", err);
    } finally {
      setSearchingSales(false);
    }
  };

  const selectSale = async (sale: any) => {
    setSelectedSale(sale);
    try {
      const res = await axios.get(`/api/sales/returns?saleId=${sale._id}`);
      const existingReturns = res.data.success ? res.data.data : [];

      const returnedQtyMap: Record<string, number> = {};
      existingReturns.forEach((ret: any) => {
        ret.items.forEach((item: any) => {
          const key = item.itemId ? item.itemId.toString() : item.itemName;
          returnedQtyMap[key] = (returnedQtyMap[key] || 0) + item.quantity;
        });
      });

      const itemsWithRemaining = sale.items.map((it: any) => {
        const key = it.itemId ? it.itemId.toString() : it.itemName;
        const alreadyReturned = returnedQtyMap[key] || 0;
        const maxQty = Math.max(0, it.quantity - alreadyReturned);
        return {
          itemId: it.itemId,
          itemName: it.itemName,
          price: it.price,
          purchasedQty: it.quantity,
          alreadyReturned: alreadyReturned,
          maxQty: maxQty,
          quantity: 0,
        };
      });

      setReturnItems(itemsWithRemaining);
    } catch (err) {
      console.error("Failed to load return history for sale", err);
      setReturnItems(
        sale.items.map((it: any) => ({
          itemId: it.itemId,
          itemName: it.itemName,
          price: it.price,
          purchasedQty: it.quantity,
          alreadyReturned: 0,
          maxQty: it.quantity,
          quantity: 0,
        })),
      );
    }
  };

  const handleReturnQtyChange = (index: number, val: number) => {
    const updated = [...returnItems];
    updated[index].quantity = Math.min(updated[index].maxQty, Math.max(0, val));
    setReturnItems(updated);
  };

  const handleSubmitReturn = async () => {
    const itemsToReturn = returnItems.filter((it) => it.quantity > 0);
    if (itemsToReturn.length === 0) {
      alert("Please specify quantity for at least one item");
      return;
    }
    if (!reason.trim()) {
      alert("Please provide a reason for the return");
      return;
    }

    for (const it of itemsToReturn) {
      if (it.quantity > it.maxQty) {
        alert(`Cannot return more than ${it.maxQty} units of ${it.itemName}`);
        return;
      }
    }

    setSubmitting(true);
    try {
      const combinedReason = notes.trim() ? `${reason}: ${notes}` : reason;
      const res = await axios.post("/api/sales/returns", {
        saleId: selectedSale._id,
        items: itemsToReturn.map((it) => ({
          itemId: it.itemId,
          itemName: it.itemName,
          quantity: it.quantity,
          price: it.price,
          total: it.quantity * it.price,
        })),
        reason: combinedReason,
      });

      if (res.data.success) {
        setIsModalOpen(false);
        fetchReturns();
        resetForm();
      }
    } catch (err: any) {
      alert(err.response?.data?.error || "Failed to submit return");
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setSelectedSale(null);
    setReturnItems([]);
    setReason("");
    setNotes("");
    setSalesSearch("");
    setSearchResults([]);
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-[#1A1210] flex items-center gap-3">
            <Undo2 className="text-[#8B5E3C]" /> {t("salesReturns")}
          </h1>
          <p className="text-[#7A6055]">
            {t("manageProductReturnsAndRefunds")}
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-6 py-3 bg-[#2C1810] text-[#F7F4F0] rounded-xl hover:bg-[#1A1210] transition-all shadow-lg hover:shadow-xl active:scale-95 font-semibold"
        >
          <Plus size={20} /> {t("newReturn")}
        </button>
      </div>

      {/* Stats/Filters */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-[#E5DDD5]">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-indigo-50 rounded-xl text-indigo-600">
              <RefreshCcw size={24} />
            </div>
            <div>
              <p className="text-sm text-[#7A6055]">{t("totalReturns")}</p>
              <h3 className="text-2xl font-bold text-[#1A1210]">{total}</h3>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-[#E5DDD5] md:col-span-2">
          <div className="relative">
            <Search
              className="absolute start-4 top-1/2 -translate-y-1/2 text-[#A89080]"
              size={20}
            />
            <input
              type="text"
              placeholder={t("searchByCustomerSaleOr")}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full ps-12 pe-4 py-3 bg-[#F7F4F0] border-none rounded-xl focus:ring-2 focus:ring-[#8B5E3C] text-[#1A1210]"
            />
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-[#E5DDD5] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-[#FAF8F6] border-b border-[#E5DDD5]">
              <tr>
                <th className="px-6 py-4 text-start text-xs font-bold text-[#8B5E3C] uppercase tracking-wider">
                  {t("returnDetails")}
                </th>
                <th className="px-6 py-4 text-start text-xs font-bold text-[#8B5E3C] uppercase tracking-wider">
                  {t("customer")}
                </th>
                <th className="px-6 py-4 text-start text-xs font-bold text-[#8B5E3C] uppercase tracking-wider">
                  {t("originalSale")}
                </th>
                <th className="px-6 py-4 text-start text-xs font-bold text-[#8B5E3C] uppercase tracking-wider">
                  {t("amount")}
                </th>
                <th className="px-6 py-4 text-start text-xs font-bold text-[#8B5E3C] uppercase tracking-wider">
                  {t("reason")}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5DDD5]">
              {loading ? (
                Array(5)
                  .fill(0)
                  .map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      <td
                        colSpan={5}
                        className="px-6 py-4 h-16 bg-[#F7F4F0]/50"
                      ></td>
                    </tr>
                  ))
              ) : returns.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-6 py-12 text-center text-[#A89080]"
                  >
                    {t("noReturnsFound")}
                  </td>
                </tr>
              ) : (
                returns.map((ret) => (
                  <tr
                    key={ret._id}
                    className="hover:bg-[#FAF8F6] transition-colors group"
                  >
                    <td className="px-6 py-4">
                      <div className="font-bold text-[#1A1210]">
                        {ret.returnNumber}
                      </div>
                      <div className="text-xs text-[#A89080] flex items-center gap-1 mt-1">
                        <Calendar size={12} /> {formatDate(ret.date)}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-[#1A1210] font-medium">
                      {ret.customerName}
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-xs font-mono bg-indigo-50 text-indigo-600 px-2 py-1 rounded-md">
                        {ret.saleNumber}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-bold text-rose-600">
                      {formatCurrency(ret.totalAmount)}
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-[#7A6055] italic max-w-xs truncate">
                        {ret.reason}
                      </p>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {!loading && totalPages > 1 && (
          <div className="border-t border-[#E5DDD5] px-2 py-4">
            <Pagination
              page={page}
              totalPages={totalPages}
              total={total}
              limit={limit}
              onPageChange={setPage}
            />
          </div>
        )}
      </div>

      {/* New Return Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-3xl w-full max-w-3xl max-h-[90vh] overflow-hidden shadow-2xl flex flex-col border border-[#E5DDD5]">
            <div className="p-6 border-b border-[#E5DDD5] flex justify-between items-center bg-[#FAF8F6]">
              <h2 className="text-xl font-bold text-[#1A1210] flex items-center gap-2">
                <Undo2 size={24} className="text-[#8B5E3C]" />{" "}
                {t("createSalesReturn")}
              </h2>
              <button
                onClick={() => {
                  setIsModalOpen(false);
                  resetForm();
                }}
                className="text-[#A89080] hover:text-[#1A1210] p-2 hover:bg-[#F7F4F0] rounded-full transition-colors"
              >
                <Plus className="rotate-45" size={24} />
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1 space-y-6 custom-scrollbar">
              {!selectedSale ? (
                <div className="space-y-4">
                  <label className="text-sm font-bold text-[#8B5E3C] uppercase tracking-wider block">
                    {t("findSaleRecord")}
                  </label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Search
                        className="absolute start-4 top-1/2 -translate-y-1/2 text-[#A89080]"
                        size={20}
                      />
                      <input
                        type="text"
                        placeholder={t("enterSaleOrCustomerName")}
                        value={salesSearch}
                        onChange={(e) => setSalesSearch(e.target.value)}
                        onKeyDown={(e) =>
                          e.key === "Enter" && handleSearchSales()
                        }
                        className="w-full ps-12 pe-4 py-3 bg-[#F7F4F0] border border-[#E5DDD5] rounded-xl focus:ring-2 focus:ring-[#8B5E3C] text-[#1A1210]"
                      />
                    </div>
                    <button
                      onClick={handleSearchSales}
                      disabled={searchingSales}
                      className="px-6 py-3 bg-[#8B5E3C] text-white rounded-xl hover:bg-[#704A2F] disabled:opacity-50 transition-colors"
                    >
                      {searchingSales ? "Searching..." : "Search"}
                    </button>
                  </div>

                  <div className="space-y-2 mt-4">
                    {searchResults.map((sale) => (
                      <div
                        key={sale._id}
                        onClick={() => selectSale(sale)}
                        className="p-4 bg-white border border-[#E5DDD5] rounded-xl hover:border-[#8B5E3C] hover:bg-[#FAF8F6] cursor-pointer transition-all flex justify-between items-center group shadow-sm"
                      >
                        <div>
                          <div className="font-bold text-[#1A1210]">
                            {sale.saleNumber}
                          </div>
                          <div className="text-sm text-[#7A6055]">
                            {sale.customerName} • {formatDate(sale.date)}
                          </div>
                        </div>
                        <div className="text-end flex items-center gap-4">
                          <span className="font-bold text-[#1A1210]">
                            {formatCurrency(sale.total)}
                          </span>
                          <ChevronRight
                            size={20}
                            className="text-[#A89080] group-hover:translate-x-1 transition-transform"
                          />
                        </div>
                      </div>
                    ))}
                    {salesSearch &&
                      searchResults.length === 0 &&
                      !searchingSales && (
                        <div className="text-center py-8 text-[#A89080]">
                          {t("noMatchingSalesFound")}
                        </div>
                      )}
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Selected Sale Info */}
                  <div className="p-4 bg-indigo-50 rounded-2xl border border-indigo-100 flex justify-between items-center">
                    <div>
                      <p className="text-xs text-indigo-400 uppercase font-bold">
                        {t("selectedSale")}
                      </p>
                      <h4 className="font-bold text-indigo-900">
                        {selectedSale.saleNumber} — {selectedSale.customerName}
                      </h4>
                    </div>
                    <button
                      onClick={() => setSelectedSale(null)}
                      className="text-indigo-600 hover:text-indigo-800 text-sm font-semibold underline"
                    >
                      {t("change")}
                    </button>
                  </div>

                  {/* Return Items Selection */}
                  <div className="space-y-3">
                    <label className="text-sm font-bold text-[#8B5E3C] uppercase tracking-wider block">
                      {t("selectItemsToReturn")}
                    </label>
                    <div className="bg-[#FAF8F6] rounded-2xl overflow-hidden border border-[#E5DDD5]">
                      <table className="w-full text-sm">
                        <thead className="bg-[#F2EBE5] text-[#8B5E3C]">
                          <tr>
                            <th className="px-4 py-3 text-start">{t("item")}</th>
                            <th className="px-4 py-3 text-center">
                              {t("purchased")}
                            </th>
                            <th className="px-4 py-3 text-center">
                              {t("alreadyReturned")}
                            </th>
                            <th className="px-4 py-3 text-center">
                              {t("available")}
                            </th>
                            <th className="px-4 py-3 text-center">
                              {t("returnQty")}
                            </th>
                            <th className="px-4 py-3 text-end">
                              {t("price")}
                            </th>
                            <th className="px-4 py-3 text-end">
                              {t("total")}
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#E5DDD5]">
                          {returnItems.filter((it) => it.maxQty > 0).length ===
                          0 ? (
                            <tr>
                              <td
                                colSpan={7}
                                className="px-4 py-8 text-center text-[#A89080] font-semibold"
                              >
                                {t("allItemsInThisSale")}
                              </td>
                            </tr>
                          ) : (
                            returnItems
                              .map((it, idx) => ({ ...it, originalIdx: idx }))
                              .filter((it) => it.maxQty > 0)
                              .map((it) => {
                                const idx = it.originalIdx;
                                return (
                                  <tr
                                    key={idx}
                                    className={
                                      it.quantity > 0 ? "bg-white" : ""
                                    }
                                  >
                                    <td className="px-4 py-3 font-medium text-[#1A1210]">
                                      {it.itemName}
                                    </td>
                                    <td className="px-4 py-3 text-center text-[#7A6055]">
                                      {it.purchasedQty}
                                    </td>
                                    <td className="px-4 py-3 text-center text-rose-600 font-semibold">
                                      {it.alreadyReturned}
                                    </td>
                                    <td className="px-4 py-3 text-center text-indigo-600 font-semibold">
                                      {it.maxQty}
                                    </td>
                                    <td className="px-4 py-3 text-center">
                                      <input
                                        type="number"
                                        min="0"
                                        max={it.maxQty}
                                        value={it.quantity}
                                        onChange={(e) =>
                                          handleReturnQtyChange(
                                            idx,
                                            parseInt(e.target.value) || 0,
                                          )
                                        }
                                        className="w-16 px-2 py-1 bg-white border border-[#E5DDD5] rounded-md text-center focus:ring-1 focus:ring-[#8B5E3C] outline-none"
                                      />
                                    </td>
                                    <td className="px-4 py-3 text-end text-[#1A1210]">
                                      {formatCurrency(it.price)}
                                    </td>
                                    <td className="px-4 py-3 text-end font-bold text-[#1A1210]">
                                      {formatCurrency(it.quantity * it.price)}
                                    </td>
                                  </tr>
                                );
                              })
                          )}
                        </tbody>
                        <tfoot className="bg-[#F2EBE5]">
                          <tr>
                            <td
                              colSpan={6}
                              className="px-4 py-3 font-bold text-[#8B5E3C]"
                            >
                              {t("totalReturnAmount")}
                            </td>
                            <td className="px-4 py-3 text-end font-black text-[#1A1210] text-lg">
                              {formatCurrency(
                                returnItems.reduce(
                                  (acc, it) => acc + it.quantity * it.price,
                                  0,
                                ),
                              )}
                            </td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  </div>

                  {/* Reason Selection */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-[#8B5E3C] uppercase tracking-wider flex items-center gap-2">
                        <RefreshCcw size={16} /> {t("returnReason")}
                      </label>
                      <select
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        className="w-full px-4 py-3 bg-[#F7F4F0] border border-[#E5DDD5] rounded-xl focus:ring-2 focus:ring-[#8B5E3C] text-[#1A1210] outline-none"
                      >
                        <option value="">{t("selectAReason")}</option>
                        <option value="Damaged">{t("damaged")}</option>
                        <option value="Other">{t("other")}</option>
                      </select>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-bold text-[#8B5E3C] uppercase tracking-wider flex items-center gap-2">
                        <MessageSquare size={16} /> {t("additionalNotes")}
                      </label>
                      <input
                        type="text"
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder={t("additionalDetailsHere")}
                        className="w-full px-4 py-3 bg-[#F7F4F0] border border-[#E5DDD5] rounded-xl focus:ring-2 focus:ring-[#8B5E3C] text-[#1A1210] outline-none"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {selectedSale && (
              <div className="p-6 bg-[#FAF8F6] border-t border-[#E5DDD5] flex gap-3">
                <button
                  onClick={() => {
                    setIsModalOpen(false);
                    resetForm();
                  }}
                  className="flex-1 px-6 py-4 border border-[#E5DDD5] text-[#7A6055] rounded-2xl hover:bg-[#F2EBE5] transition-colors font-bold"
                >
                  {t("cancel")}
                </button>
                <button
                  onClick={handleSubmitReturn}
                  disabled={submitting}
                  className="flex-[2] px-6 py-4 bg-rose-600 text-white rounded-2xl hover:bg-rose-700 disabled:opacity-50 transition-all font-bold shadow-lg shadow-rose-200"
                >
                  {submitting ? "Processing..." : "Confirm Return"}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

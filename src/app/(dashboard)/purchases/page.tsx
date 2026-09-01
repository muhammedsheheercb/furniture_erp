"use client";
import {
  Plus,
  Search,
  CheckCircle2,
  Edit,
  Trash2,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import axios from "axios";
import { toast } from "sonner";
import { format } from "date-fns";
import { useDateFilter } from "@/context/DateFilterContext";

import PurchaseModal from "@/components/purchases/PurchaseModal";
import ConfirmModal from "@/components/ui/ConfirmModal";
import CurrencySymbol from "@/components/ui/CurrencySymbol";
import Pagination from "@/components/ui/Pagination";
import { useLanguage } from "../../../context/LanguageContext";

export default function PurchasesPage() {
  const { t } = useLanguage();
  const { data: session } = useSession();
  const { startDate, endDate } = useDateFilter();
  const isAdmin = session?.user?.role === "admin";
  const perms = (session?.user?.permissions as any)?.purchases;
  const canCreate = isAdmin || perms?.create;
  const canEdit = isAdmin || perms?.edit;
  const canDelete = isAdmin || perms?.delete;

  const [purchases, setPurchases] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editPurchase, setEditPurchase] = useState<any | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 10;

  const fetchPurchases = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        search,
        ...(startDate && { startDate }),
        ...(endDate && { endDate }),
        page: page.toString(),
        limit: limit.toString(),
      });
      const res = await axios.get(`/api/purchases?${params}`);
      if (res.data.success) {
        setPurchases(res.data.data);
        setTotalPages(res.data.totalPages || 1);
        setTotal(res.data.total || 0);
      }
    } catch (err) {
      console.error("Purchases fetch error:", err);
      toast.error("Failed to load purchases");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setPage(1);
  }, [search, startDate, endDate]);

  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      fetchPurchases();
    }, 300);
    return () => clearTimeout(delayDebounce);
  }, [search, startDate, endDate, page]);

  const handleSubmitPurchase = async (data: any) => {
    setSaving(true);
    try {
      if (editPurchase) {
        const res = await axios.put(`/api/purchases/${editPurchase._id}`, data);
        if (res.data.success) {
          toast.success("Purchase order updated");
          setModalOpen(false);
          setEditPurchase(null);
          fetchPurchases();
        }
      } else {
        const res = await axios.post("/api/purchases", data);
        if (res.data.success) {
          toast.success("Purchase order created");
          setModalOpen(false);
          fetchPurchases();
        }
      }
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Failed to save order");
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (po: any) => {
    setEditPurchase(po);
    setModalOpen(true);
  };

  const handleDelete = (id: string) => {
    setDeleteId(id);
  };

  const handleConfirmDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try {
      const res = await axios.delete(`/api/purchases/${deleteId}`);
      if (res.data.success) {
        toast.success("Order deleted successfully");
        setDeleteId(null);
        fetchPurchases();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Failed to delete order");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-extrabold text-[#1A1210]">
            {t("purchaseOrders")}
          </h2>
          <p className="text-[#7A6055]">{t("procureRawMaterialsAndTrack")}</p>
        </div>
        {canCreate && (
          <Button
            className="bg-[#2C1810] hover:bg-[#1A0F0A] text-white"
            onClick={() => {
              setEditPurchase(null);
              setModalOpen(true);
            }}
          >
            <Plus size={18} className="me-2" /> {t("createPo")}
          </Button>
        )}
      </div>

      <PurchaseModal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditPurchase(null);
        }}
        onSubmit={handleSubmitPurchase}
        purchase={editPurchase}
        loading={saving}
      />

      <ConfirmModal
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleConfirmDelete}
        title={t("deletePurchaseOrder")}
        message={t("areYouSureYouWant")}
        loading={deleting}
      />

      <Card className="border-[#E5DDD5]">
        <CardHeader className="p-4 border-b border-[#E5DDD5]">
          <div className="relative">
            <Search
              className="absolute start-3 top-1/2 -translate-y-1/2 text-[#A89080]"
              size={18}
            />
            <Input
              placeholder={t("searchByPoNumberOr")}
              className="ps-10 border-[#E5DDD5] bg-[#FAF8F6]"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#C9A84C]"></div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-start border-collapse">
                <thead>
                  <tr className="bg-[#FAF8F6] border-b border-[#E5DDD5]">
                    <th className="py-4 px-6 text-xs font-bold text-[#7A6055] uppercase tracking-wider">
                      {t("poNumber")}
                    </th>
                    <th className="py-4 px-6 text-xs font-bold text-[#7A6055] uppercase tracking-wider">
                      {t("supplier")}
                    </th>
                    <th className="py-4 px-6 text-xs font-bold text-[#7A6055] uppercase tracking-wider">
                      {t("orderDate")}
                    </th>
                    <th className="py-4 px-6 text-xs font-bold text-[#7A6055] uppercase tracking-wider">
                      {t("amount")}
                    </th>
                    <th className="py-4 px-6 text-xs font-bold text-[#7A6055] uppercase tracking-wider">
                      {t("status")}
                    </th>
                    <th className="py-4 px-6 text-xs font-bold text-[#7A6055] uppercase tracking-wider">
                      {t("createdBy")}
                    </th>
                    <th className="py-4 px-6 text-xs font-bold text-[#7A6055] uppercase tracking-wider text-end">
                      {t("actions")}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F0EBE5]">
                  {purchases.length > 0 ? (
                    purchases.map((po) => (
                      <tr
                        key={po._id}
                        className="hover:bg-[#FAF8F6] transition-colors group"
                      >
                        <td className="py-4 px-6 font-mono text-sm text-[#1A1210]">
                          {po.purchaseNumber}
                        </td>
                        <td className="py-4 px-6 font-semibold text-[#1A1210]">
                          {po.supplierName}
                        </td>
                        <td className="py-4 px-6 text-sm text-[#7A6055]">
                          {format(new Date(po.date), "dd MMM yyyy")}
                        </td>
                        <td className="py-4 px-6 text-sm font-bold text-[#1A1210]">
                          <CurrencySymbol /> {po.total.toLocaleString()}
                        </td>
                        <td className="py-4 px-6">
                          <Badge className="bg-emerald-50 text-emerald-600 border-emerald-100">
                            <span className="flex items-center gap-1">
                              <CheckCircle2 size={12} /> {t("received")}
                            </span>
                          </Badge>
                        </td>
                        <td className="py-4 px-6">
                          <span className="text-xs font-semibold text-indigo-600 bg-indigo-50 px-2 py-1 rounded">
                            {po.createdBy?.name || "—"}
                          </span>
                        </td>
                        <td className="py-4 px-6 text-end">
                          <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            {canEdit && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="text-[#7A6055]"
                                onClick={() => handleEdit(po)}
                              >
                                <Edit size={16} />
                              </Button>
                            )}
                            {canDelete && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="text-rose-500"
                                onClick={() => handleDelete(po._id)}
                              >
                                <Trash2 size={16} />
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-[#C9A84C]"
                            >
                              <ChevronRight size={16} />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td
                        colSpan={6}
                        className="py-10 text-center text-[#7A6055]"
                      >
                        {t("noPurchaseOrdersFound")}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {!loading && totalPages > 1 && (
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

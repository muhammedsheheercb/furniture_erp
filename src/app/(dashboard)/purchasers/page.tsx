"use client";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import axios from "axios";
import { toast } from "sonner";
import {
  Plus,
  Search,
  Phone,
  Edit,
  Trash2,
  ExternalLink,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";

import PurchaserModal from "@/components/purchasers/PurchaserModal";
import ConfirmModal from "@/components/ui/ConfirmModal";
import CurrencySymbol from "@/components/ui/CurrencySymbol";
import { useLanguage } from "../../../context/LanguageContext";

export default function PurchasersPage() {
  const { t } = useLanguage();
  const { data: session } = useSession();
  const isAdmin = session?.user?.role === "admin";
  const perms = (session?.user?.permissions as any)?.purchases; // using purchases perms
  const canCreate = isAdmin || perms?.create;
  const canEdit = isAdmin || perms?.edit;
  const canDelete = isAdmin || perms?.delete;

  const [purchasers, setPurchasers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editPurchaser, setEditPurchaser] = useState<any | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchPurchasers = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        search,
        withStats: "true"
      });
      const res = await axios.get(`/api/purchasers?${params}`);
      if (res.data.success) {
        setPurchasers(res.data.data);
      }
    } catch (err) {
      console.error("Purchasers fetch error:", err);
      toast.error("Failed to load purchasers");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPurchasers();
  }, [search]);

  const handleSubmitPurchaser = async (data: any) => {
    setSaving(true);
    try {
      if (editPurchaser) {
        const res = await axios.put(`/api/purchasers/${editPurchaser._id}`, data);
        if (res.data.success) {
          toast.success("Purchaser updated successfully");
          setModalOpen(false);
          setEditPurchaser(null);
          fetchPurchasers();
        }
      } else {
        const res = await axios.post("/api/purchasers", data);
        if (res.data.success) {
          toast.success("Purchaser created successfully");
          setModalOpen(false);
          fetchPurchasers();
        }
      }
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Failed to save purchaser");
    } finally {
      setSaving(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try {
      const res = await axios.delete(`/api/purchasers/${deleteId}`);
      if (res.data.success) {
        toast.success("Purchaser deleted successfully");
        setDeleteId(null);
        fetchPurchasers();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Failed to delete purchaser");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-extrabold text-[#1A1210]">
            {t("purchasers") || "Purchasers"}
          </h2>
          <p className="text-[#7A6055]">{t("managePurchasers") || "Manage purchasers and view their purchase history"}</p>
        </div>
        {canCreate && (
          <Button
            className="bg-[#2C1810] hover:bg-[#1A0F0A] text-white"
            onClick={() => {
              setEditPurchaser(null);
              setModalOpen(true);
            }}
          >
            <Plus size={18} className="me-2" /> {t("addPurchaser") || "Add Purchaser"}
          </Button>
        )}
      </div>

      <PurchaserModal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditPurchaser(null);
        }}
        onSubmit={handleSubmitPurchaser}
        purchaser={editPurchaser}
        loading={saving}
      />

      <ConfirmModal
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleConfirmDelete}
        title={t("deletePurchaser") || "Delete Purchaser"}
        message={t("areYouSureYouWant") || "Are you sure you want to delete this?"}
        loading={deleting}
      />

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="md:col-span-3 border-[#E5DDD5]">
          <CardHeader className="p-4 border-b border-[#E5DDD5]">
            <div className="relative">
              <Search
                className="absolute start-3 top-1/2 -translate-y-1/2 text-[#A89080]"
                size={18}
              />
              <Input
                placeholder={t("searchByNamePhoneOr") || "Search by name or mobile..."}
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
                      <th className="py-4 px-6 text-xs font-bold text-[#7A6055] uppercase">
                        {t("name")}
                      </th>
                      <th className="py-4 px-6 text-xs font-bold text-[#7A6055] uppercase">
                        {t("mobile")}
                      </th>
                      <th className="py-4 px-6 text-xs font-bold text-[#7A6055] uppercase">
                        {t("monthlyPurchases") || "Monthly Purchases"}
                      </th>
                      <th className="py-4 px-6 text-xs font-bold text-[#7A6055] uppercase text-end">
                        {t("actions")}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#F0EBE5]">
                    {purchasers.length > 0 ? (
                      purchasers.map((purchaser) => (
                        <tr
                          key={purchaser._id}
                          className="hover:bg-[#FAF8F6] transition-colors group"
                        >
                          <td className="py-4 px-6">
                            <div className="font-semibold text-[#1A1210]">
                              {purchaser.name}
                            </div>
                          </td>
                          <td className="py-4 px-6">
                            <div className="flex items-center gap-1.5 text-sm text-[#7A6055]">
                              <Phone size={12} /> {purchaser.mobile || "N/A"}
                            </div>
                          </td>
                          <td className="py-4 px-6 text-sm font-bold text-[#1A1210]">
                            <CurrencySymbol />{" "}
                            {(purchaser.monthlyTotal || 0).toLocaleString()}
                          </td>
                          <td className="py-4 px-6 text-end">
                            <div className="flex justify-end gap-2">
                              <Link href={`/purchasers/${purchaser._id}`}>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="text-[#3F51B5]"
                                  title={t("viewDetails") || "View Details"}
                                >
                                  <ExternalLink size={16} />
                                </Button>
                              </Link>
                              {canEdit && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="text-[#7A6055]"
                                  title={t("edit")}
                                  onClick={() => {
                                    setEditPurchaser(purchaser);
                                    setModalOpen(true);
                                  }}
                                >
                                  <Edit size={16} />
                                </Button>
                              )}
                              {canDelete && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="text-rose-500"
                                  title={t("delete")}
                                  onClick={() => setDeleteId(purchaser._id)}
                                >
                                  <Trash2 size={16} />
                                </Button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td
                          colSpan={4}
                          className="py-10 text-center text-[#7A6055]"
                        >
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

        <div className="space-y-4">
          <Card className="border-[#E5DDD5]">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-[#7A6055] uppercase">
                {t("quickSummary")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between items-center text-sm">
                <span className="text-[#A89080]">{t("totalPurchasers") || "Total Purchasers"}</span>
                <span className="font-bold">{purchasers.length}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

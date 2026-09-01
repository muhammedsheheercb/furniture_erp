"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import {
  Database,
  Plus,
  Search,
  AlertTriangle,
  Pencil,
  Trash2,
  X,
  Loader2,
  ChevronDown,
  ChevronRight,
  Layers,
  TrendingUp,
  TrendingDown,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import CurrencySymbol from "@/components/ui/CurrencySymbol";
import Pagination from "@/components/ui/Pagination";
import { format } from "date-fns";

// ─── types ────────────────────────────────────────────────────────────────────
interface Batch {
  purchaseId: string;
  purchaseNumber: string;
  batchNumber: string;
  purchaseDate: string;
  purchasePrice: number;
  quantity: number;
  createdAt: string;
}

interface Material {
  _id: string;
  name: string;
  code: string;
  category: string;
  unit: string;
  size: string;
  thickness: string;
  brand: string;
  currentStock: number;
  reorderLevel: number;
  lastPurchasePrice: number;
  batches: Batch[];
}

const CATEGORIES = [
  "plywood",
  "wood",
  "fabric",
  "foam",
  "hardware",
  "polish",
  "other",
];
const UNITS = ["Sheet", "Piece", "Meter", "Kg", "Sqft", "Liter"];

const EMPTY_FORM = {
  name: "",
  code: "",
  category: "plywood",
  unit: "Sheet",
  size: "",
  thickness: "",
  brand: "",
  currentStock: 0,
  reorderLevel: 10,
  lastPurchasePrice: 0,
};

// ─── helpers ──────────────────────────────────────────────────────────────────
function categoryColor(c: string) {
  const map: Record<string, string> = {
    plywood: "bg-amber-100 text-amber-800",
    wood: "bg-green-100 text-green-800",
    fabric: "bg-purple-100 text-purple-800",
    foam: "bg-blue-100 text-blue-800",
    hardware: "bg-gray-100 text-gray-800",
    polish: "bg-orange-100 text-orange-800",
    other: "bg-slate-100 text-slate-700",
  };
  return map[c] || map.other;
}

function fmtDate(d: string | undefined) {
  if (!d) return "—";
  try {
    return format(new Date(d), "dd MMM yyyy");
  } catch {
    return "—";
  }
}

// ─── material form modal ──────────────────────────────────────────────────────
function MaterialModal({
  initial,
  onClose,
  onSaved,
}: {
  initial?: Material | null;
  onClose: () => void;
  onSaved: (m: Material) => void;
}) {
  const { t } = useLanguage();
  const [form, setForm] = useState<typeof EMPTY_FORM>(
    initial
      ? {
          name: initial.name,
          code: initial.code,
          category: initial.category,
          unit: initial.unit,
          size: initial.size ?? "",
          thickness: initial.thickness ?? "",
          brand: initial.brand ?? "",
          currentStock: initial.currentStock,
          reorderLevel: initial.reorderLevel,
          lastPurchasePrice: initial.lastPurchasePrice,
        }
      : EMPTY_FORM,
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  function set(k: string, v: string | number) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      const url = initial ? `/api/materials/${initial._id}` : "/api/materials";
      const method = initial ? "PUT" : "POST";
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { code: _code, ...bodyWithoutCode } = form;
      const body = initial ? form : bodyWithoutCode;
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error || "Failed to save");
      onSaved(json.data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  const labelCls = "block text-xs font-semibold text-[#7A6055] mb-1";
  const selectCls =
    "w-full border border-[#E5DDD5] rounded-lg px-3 py-2 text-sm bg-white text-[#1A1210] focus:outline-none focus:ring-2 focus:ring-[#C9A84C]/40";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.45)" }}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#F0EBE5]">
          <h2 className="text-lg font-bold text-[#1A1210]">
            {initial ? "Edit Material" : "New Material"}
          </h2>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-[#F5F2EA] text-[#7A6055]"
          >
            <X size={20} />
          </button>
        </div>
        <form onSubmit={submit} className="p-6 space-y-4">
          {error && (
            <div className="text-sm text-rose-600 bg-rose-50 border border-rose-200 rounded-lg px-4 py-2">
              {error}
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>{t("materialName")}</label>
              <Input
                required
                value={form.name}
                onChange={(e) => set("name", e.target.value)}
                placeholder={t("18mmMarinePlywood")}
                className="border-[#E5DDD5]"
              />
            </div>
            <div>
              <label className={labelCls}>
                {t("code")}
                <span className="ms-1.5 text-[10px] font-normal text-[#A89080] bg-[#F5F2EA] px-1.5 py-0.5 rounded-full">
                  {initial ? "read-only" : "auto-generated"}
                </span>
              </label>
              <Input
                readOnly
                value={initial ? form.code : ""}
                placeholder={initial ? form.code : "e.g. PLY-001 (auto)"}
                className="border-[#E5DDD5] bg-[#F5F2EA] text-[#A89080] cursor-not-allowed font-mono text-xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>{t("category")}</label>
              <select
                value={form.category}
                onChange={(e) => set("category", e.target.value)}
                className={selectCls}
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c.charAt(0).toUpperCase() + c.slice(1)}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelCls}>{t("unit")}</label>
              <select
                value={form.unit}
                onChange={(e) => set("unit", e.target.value)}
                className={selectCls}
              >
                {UNITS.map((u) => (
                  <option key={u} value={u}>
                    {u}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>{t("size")}</label>
              <Input
                value={form.size}
                onChange={(e) => set("size", e.target.value)}
                placeholder={t("8x4Ft")}
                className="border-[#E5DDD5]"
              />
            </div>
            <div>
              <label className={labelCls}>{t("thickness")}</label>
              <Input
                value={form.thickness}
                onChange={(e) => set("thickness", e.target.value)}
                placeholder={t("18mm")}
                className="border-[#E5DDD5]"
              />
            </div>
          </div>

          <div>
            <label className={labelCls}>{t("brand")}</label>
            <Input
              value={form.brand}
              onChange={(e) => set("brand", e.target.value)}
              placeholder={t("greenply")}
              className="border-[#E5DDD5]"
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className={labelCls}>{t("currentStock")}</label>
              <Input
                type="number"
                min={0}
                value={form.currentStock}
                onChange={(e) => set("currentStock", Number(e.target.value))}
                className="border-[#E5DDD5]"
              />
            </div>
            <div>
              <label className={labelCls}>{t("reorderLevel")}</label>
              <Input
                type="number"
                min={0}
                value={form.reorderLevel}
                onChange={(e) => set("reorderLevel", Number(e.target.value))}
                className="border-[#E5DDD5]"
              />
            </div>
            <div>
              <label className={labelCls}>
                {t("lastPrice")}
                <CurrencySymbol className="w-3 h-3" />)
              </label>
              <Input
                type="number"
                min={0}
                step="0.01"
                value={form.lastPurchasePrice}
                onChange={(e) =>
                  set("lastPurchasePrice", Number(e.target.value))
                }
                className="border-[#E5DDD5]"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="border-[#E5DDD5]"
            >
              {t("cancel")}
            </Button>
            <Button
              type="submit"
              disabled={saving}
              className="bg-[#1B3A2D] hover:bg-[#163222] text-white"
            >
              {saving ? (
                <Loader2 size={16} className="animate-spin me-2" />
              ) : null}
              {initial ? "Update Material" : "Add Material"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── delete confirm ───────────────────────────────────────────────────────────
function DeleteConfirm({
  name,
  onCancel,
  onConfirm,
  deleting,
}: {
  name: string;
  onCancel: () => void;
  onConfirm: () => void;
  deleting: boolean;
}) {
  const { t } = useLanguage();
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.45)" }}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 space-y-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-rose-100 flex items-center justify-center text-rose-600 shrink-0">
            <Trash2 size={20} />
          </div>
          <div>
            <p className="font-bold text-[#1A1210]">{t("deleteMaterial")}</p>
            <p className="text-sm text-[#7A6055]">
              {t("areYouSureYouWant")}
              <span className="font-semibold">{name}</span>?
            </p>
          </div>
        </div>
        <div className="flex justify-end gap-2">
          <Button
            variant="outline"
            onClick={onCancel}
            className="border-[#E5DDD5]"
          >
            {t("cancel")}
          </Button>
          <Button
            onClick={onConfirm}
            disabled={deleting}
            className="bg-rose-600 hover:bg-rose-700 text-white"
          >
            {deleting ? (
              <Loader2 size={16} className="animate-spin me-2" />
            ) : null}
            {t("delete")}
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─── batch sub-row ────────────────────────────────────────────────────────────
function BatchRows({ batches, unit }: { batches: Batch[]; unit: string }) {
  const { t } = useLanguage();
  if (!batches || batches.length === 0) {
    return (
      <tr>
        <td colSpan={11} className="pb-3">
          <div className="mx-4 rounded-xl border border-dashed border-[#E5DDD5] bg-[#FAF8F6] py-5 text-center text-xs text-[#A89080]">
            {t("noPurchaseBatchesRecordedYet")}
          </div>
        </td>
      </tr>
    );
  }

  // cheapest & most-expensive price for relative indicator
  const prices = batches.map((b) => b.purchasePrice);
  const minP = Math.min(...prices);
  const maxP = Math.max(...prices);

  return (
    <tr>
      <td colSpan={11} className="pb-3 px-4">
        <div className="rounded-xl border border-[#E5DDD5] overflow-hidden bg-white">
          {/* sub-header */}
          <div className="flex items-center gap-2 px-4 py-2.5 bg-[#F5F2EA] border-b border-[#E5DDD5]">
            <Layers size={13} className="text-[#C9A84C]" />
            <span className="text-xs font-bold text-[#7A6055] uppercase tracking-wide">
              {t("purchaseBatchHistory")}
              {batches.length} {t("batch")}
              {batches.length > 1 ? "es" : ""}
            </span>
          </div>

          <table className="w-full text-xs">
            <thead>
              <tr className="bg-[#FAF8F6] border-b border-[#E5DDD5]">
                <th className="py-2 px-4 text-start font-semibold text-[#7A6055] uppercase tracking-wide">
                  #
                </th>
                <th className="py-2 px-4 text-start font-semibold text-[#7A6055] uppercase tracking-wide">
                  {t("batchNo")}
                </th>
                <th className="py-2 px-4 text-start font-semibold text-[#7A6055] uppercase tracking-wide">
                  {t("poNumber")}
                </th>
                <th className="py-2 px-4 text-start font-semibold text-[#7A6055] uppercase tracking-wide">
                  {t("purchaseDate")}
                </th>
                <th className="py-2 px-4 text-end font-semibold text-[#7A6055] uppercase tracking-wide">
                  {t("qty")}
                </th>
                <th className="py-2 px-4 text-end font-semibold text-[#7A6055] uppercase tracking-wide">
                  {t("price")}
                  {unit}
                </th>
                <th className="py-2 px-4 text-end font-semibold text-[#7A6055] uppercase tracking-wide">
                  {t("batchTotal")}
                </th>
                <th className="py-2 px-4 text-center font-semibold text-[#7A6055] uppercase tracking-wide">
                  {t("vsOthers")}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F5F2EA]">
              {/* newest first */}
              {[...batches].reverse().map((b, i) => {
                const isHigh = b.purchasePrice === maxP && prices.length > 1;
                const isLow = b.purchasePrice === minP && prices.length > 1;
                return (
                  <tr key={i} className="hover:bg-[#FAF8F6] transition-colors">
                    <td className="py-2.5 px-4 text-[#A89080]">
                      {batches.length - i}
                    </td>
                    <td className="py-2.5 px-4 font-mono text-[#1A1210]">
                      {b.batchNumber || (
                        <span className="text-[#C5B8B0] italic">—</span>
                      )}
                    </td>
                    <td className="py-2.5 px-4">
                      {b.purchaseNumber ? (
                        <span className="font-mono text-[#1B3A2D] font-semibold">
                          {b.purchaseNumber}
                        </span>
                      ) : (
                        <span className="text-[#C5B8B0] italic">—</span>
                      )}
                    </td>
                    <td className="py-2.5 px-4 text-[#7A6055]">
                      {fmtDate(b.purchaseDate || b.createdAt)}
                    </td>
                    <td className="py-2.5 px-4 text-end font-semibold text-[#1A1210]">
                      {b.quantity} {unit}
                    </td>
                    <td className="py-2.5 px-4 text-end font-bold text-[#1A1210]">
                      <CurrencySymbol className="w-3 h-3 me-1" />{" "}
                      {b.purchasePrice.toLocaleString("en-IN")}
                    </td>
                    <td className="py-2.5 px-4 text-end text-[#7A6055]">
                      <CurrencySymbol className="w-3 h-3 me-1" />{" "}
                      {(b.purchasePrice * b.quantity).toLocaleString("en-IN")}
                    </td>
                    <td className="py-2.5 px-4 text-center">
                      {prices.length === 1 ? (
                        <span className="text-[#A89080] italic text-[10px]">
                          {t("onlyBatch")}
                        </span>
                      ) : isHigh ? (
                        <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full bg-rose-50 text-rose-600 font-bold text-[10px]">
                          <TrendingUp size={10} /> {t("highest")}
                        </span>
                      ) : isLow ? (
                        <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full bg-green-50 text-green-700 font-bold text-[10px]">
                          <TrendingDown size={10} /> {t("lowest")}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full bg-[#FAF8F6] text-[#7A6055] font-bold text-[10px]">
                          {t("mid")}
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
            {batches.length > 1 && (
              <tfoot>
                <tr className="border-t-2 border-[#E5DDD5] bg-[#FAF8F6]">
                  <td
                    colSpan={4}
                    className="py-2 px-4 text-xs font-bold text-[#7A6055]"
                  >
                    {t("totalAcrossAllBatches")}
                  </td>
                  <td className="py-2 px-4 text-end text-xs font-bold text-[#1A1210]">
                    {batches.reduce((s, b) => s + b.quantity, 0)} {unit}
                  </td>
                  <td className="py-2 px-4 text-end text-xs text-[#7A6055]">
                    {t("avg")}
                    <CurrencySymbol className="w-3 h-3 me-1" />{" "}
                    {Math.round(
                      batches.reduce((s, b) => s + b.purchasePrice, 0) /
                        batches.length,
                    ).toLocaleString("en-IN")}
                  </td>
                  <td className="py-2 px-4 text-end text-xs font-bold text-[#1A1210]">
                    <CurrencySymbol className="w-3 h-3 me-1" />{" "}
                    {batches
                      .reduce((s, b) => s + b.purchasePrice * b.quantity, 0)
                      .toLocaleString("en-IN")}
                  </td>
                  <td />
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </td>
    </tr>
  );
}

import { useDateFilter } from "@/context/DateFilterContext";
import { useLanguage } from "../../../context/LanguageContext";

// ─── page ─────────────────────────────────────────────────────────────────────
export default function MaterialsPage() {
  const { t } = useLanguage();
  const { startDate, endDate } = useDateFilter();
  const { data: session } = useSession();
  const isAdmin = session?.user?.role === "admin";
  const perms = (session?.user?.permissions as any)?.items;
  const canCreate = isAdmin || perms?.create;
  const canEdit = isAdmin || perms?.edit;
  const canDelete = isAdmin || perms?.delete;

  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editItem, setEditItem] = useState<Material | null>(null);
  const [deleteItem, setDeleteItem] = useState<Material | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [serverTotalValue, setServerTotalValue] = useState(0);
  const [serverLowStockCount, setServerLowStockCount] = useState(0);
  const limit = 10;

  const fetchMaterials = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        search,
        ...(startDate && { startDate }),
        ...(endDate && { endDate }),
        page: page.toString(),
        limit: limit.toString(),
      });
      const res = await fetch(`/api/materials?${params}`);
      const json = await res.json();
      if (json.success) {
        setMaterials(json.data);
        setTotalPages(json.totalPages || 1);
        setTotal(json.total || 0);
        setServerTotalValue(json.totalValue || 0);
        setServerLowStockCount(json.lowStockCount || 0);
      }
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate, page, search]);

  useEffect(() => {
    setPage(1);
  }, [startDate, endDate, search]);

  useEffect(() => {
    const t = setTimeout(() => {
      fetchMaterials();
    }, 300);
    return () => clearTimeout(t);
  }, [startDate, endDate, page, search, fetchMaterials]);

  function toggleExpand(id: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function handleSaved(m: Material) {
    setMaterials((prev) => {
      const idx = prev.findIndex((x) => x._id === m._id);
      return idx >= 0
        ? prev.map((x) => (x._id === m._id ? m : x))
        : [m, ...prev];
    });
    setModalOpen(false);
    setEditItem(null);
  }

  async function handleDelete() {
    if (!deleteItem) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/materials/${deleteItem._id}`, {
        method: "DELETE",
      });
      const json = await res.json();
      if (json.success)
        setMaterials((prev) => prev.filter((x) => x._id !== deleteItem._id));
    } finally {
      setDeleting(false);
      setDeleteItem(null);
    }
  }

  const lowStock = serverLowStockCount;
  const totalValue = serverTotalValue;

  return (
    <div className="space-y-6">
      {/* header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-extrabold text-[#1A1210]">
            {t("rawMaterials")}
          </h2>
          <p className="text-[#7A6055]">
            {t("monitorInventoryAndTrackBatchwise")}
          </p>
        </div>
        {canCreate && (
          <Button
            onClick={() => {
              setEditItem(null);
              setModalOpen(true);
            }}
            className="bg-[#1B3A2D] hover:bg-[#163222] text-white"
          >
            <Plus size={18} className="me-2" /> {t("newMaterial")}
          </Button>
        )}
      </div>

      {/* stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card className="border-rose-200 bg-rose-50/50">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="h-12 w-12 rounded-full bg-rose-100 flex items-center justify-center text-rose-600">
              <AlertTriangle size={24} />
            </div>
            <div>
              <p className="text-xs font-bold text-rose-900 uppercase tracking-wide">
                {t("lowStock")}
              </p>
              <p className="text-2xl font-black text-rose-700">
                {String(lowStock).padStart(2, "0")} {t("items")}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-[#E5DDD5]">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="h-12 w-12 rounded-full bg-[#FAF8F6] flex items-center justify-center text-[#C9A84C]">
              <Database size={24} />
            </div>
            <div>
              <p className="text-xs font-bold text-[#7A6055] uppercase tracking-wide">
                {t("inventoryValue")}
              </p>
              <p className="text-2xl font-black text-[#1A1210]">
                <CurrencySymbol /> {totalValue.toLocaleString("en-IN")}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* table */}
      <Card className="border-[#E5DDD5]">
        <CardHeader className="p-4 border-b border-[#E5DDD5]">
          <div className="relative">
            <Search
              className="absolute start-3 top-1/2 -translate-y-1/2 text-[#A89080]"
              size={18}
            />
            <Input
              placeholder={t("searchByNameCodeCategory")}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="ps-10 border-[#E5DDD5] bg-[#FAF8F6]"
            />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-start border-collapse text-sm">
              <thead>
                <tr className="bg-[#FAF8F6] border-b border-[#E5DDD5]">
                  <th className="py-3 px-4 w-8" />
                  {[
                    "Material Name",
                    "Code",
                    "Category",
                    "Unit",
                    "Size",
                    "Thickness",
                    "Brand",
                    "Stock",
                    "Last Price",
                    "Batches",
                    "",
                  ].map((h) => (
                    <th
                      key={h}
                      className="py-3 px-4 text-xs font-bold text-[#7A6055] uppercase tracking-wider whitespace-nowrap"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td
                      colSpan={12}
                      className="py-12 text-center text-[#7A6055]"
                    >
                      <Loader2 size={24} className="animate-spin mx-auto" />
                    </td>
                  </tr>
                ) : materials.length === 0 ? (
                  <tr>
                    <td
                      colSpan={12}
                      className="py-12 text-center text-[#A89080]"
                    >
                      {t("noMaterialsFoundClick")}
                      <strong>{t("newMaterial")}</strong> {t("toAddOne")}
                    </td>
                  </tr>
                ) : (
                  materials.map((mat) => {
                    const isOpen = expanded.has(mat._id);
                    const low = mat.currentStock <= mat.reorderLevel;
                    const batchCount = mat.batches?.length ?? 0;
                    const hasMulti = batchCount > 1;

                    return (
                      <React.Fragment key={mat._id}>
                        {/* ── main material row ── */}
                        <tr
                          className={`transition-colors border-b border-[#F0EBE5] ${isOpen ? "bg-[#F5F2EA]" : "hover:bg-[#FAF8F6]"}`}
                        >
                          {/* expand toggle */}
                          <td className="px-3 py-3 text-center">
                            <button
                              onClick={() => toggleExpand(mat._id)}
                              className={`p-1 rounded-lg transition-colors ${batchCount > 0 ? "hover:bg-[#E5DDD5] text-[#7A6055] cursor-pointer" : "text-[#D5CCC5] cursor-default"}`}
                              disabled={batchCount === 0}
                            >
                              {isOpen ? (
                                <ChevronDown
                                  size={15}
                                  className="text-[#C9A84C]"
                                />
                              ) : (
                                <ChevronRight size={15} />
                              )}
                            </button>
                          </td>

                          <td className="py-3 px-4 font-semibold text-[#1A1210] whitespace-nowrap">
                            {mat.name}
                          </td>
                          <td className="py-3 px-4 font-mono text-xs text-[#7A6055]">
                            {mat.code}
                          </td>
                          <td className="py-3 px-4">
                            <span
                              className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${categoryColor(mat.category)}`}
                            >
                              {mat.category}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-[#7A6055]">
                            {mat.unit}
                          </td>
                          <td className="py-3 px-4 text-[#7A6055]">
                            {mat.size || "—"}
                          </td>
                          <td className="py-3 px-4 text-[#7A6055]">
                            {mat.thickness || "—"}
                          </td>
                          <td className="py-3 px-4 text-[#7A6055]">
                            {mat.brand || "—"}
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-1.5">
                              <span
                                className={`font-bold ${low ? "text-rose-600" : "text-[#1A1210]"}`}
                              >
                                {mat.currentStock} {mat.unit}
                              </span>
                              {low && (
                                <AlertTriangle
                                  size={13}
                                  className="text-rose-500"
                                />
                              )}
                            </div>
                          </td>
                          <td className="py-3 px-4 text-[#7A6055] whitespace-nowrap">
                            <CurrencySymbol className="w-3 h-3 me-1" />{" "}
                            {mat.lastPurchasePrice.toLocaleString("en-IN")}/
                            {mat.unit}
                          </td>

                          {/* batch count badge */}
                          <td className="py-3 px-4">
                            {batchCount > 0 ? (
                              <button
                                onClick={() => toggleExpand(mat._id)}
                                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold transition-colors ${
                                  hasMulti
                                    ? "bg-[#1B3A2D] text-white hover:bg-[#163222]"
                                    : "bg-[#E8F0EC] text-[#1B3A2D] hover:bg-[#D0E4D8]"
                                }`}
                              >
                                <Layers size={11} />
                                {batchCount} {t("batch")}
                                {batchCount > 1 ? "es" : ""}
                              </button>
                            ) : (
                              <span className="text-xs text-[#C5B8B0] italic">
                                {t("noBatches")}
                              </span>
                            )}
                          </td>

                          {/* actions */}
                          <td className="py-3 px-4 text-end whitespace-nowrap">
                            {canEdit && (
                              <button
                                onClick={() => {
                                  setEditItem(mat);
                                  setModalOpen(true);
                                }}
                                className="p-1.5 rounded-lg hover:bg-[#E8F0EC] text-[#1B3A2D] me-1"
                                title={t("edit")}
                              >
                                <Pencil size={15} />
                              </button>
                            )}
                            {canDelete && (
                              <button
                                onClick={() => setDeleteItem(mat)}
                                className="p-1.5 rounded-lg hover:bg-rose-50 text-rose-500"
                                title={t("delete")}
                              >
                                <Trash2 size={15} />
                              </button>
                            )}
                          </td>
                        </tr>

                        {/* ── batch detail rows ── */}
                        {isOpen && (
                          <BatchRows
                            key={`${mat._id}-batches`}
                            batches={mat.batches ?? []}
                            unit={mat.unit}
                          />
                        )}
                      </React.Fragment>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
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

      {modalOpen && (
        <MaterialModal
          initial={editItem}
          onClose={() => {
            setModalOpen(false);
            setEditItem(null);
          }}
          onSaved={handleSaved}
        />
      )}

      {deleteItem && (
        <DeleteConfirm
          name={deleteItem.name}
          onCancel={() => setDeleteItem(null)}
          onConfirm={handleDelete}
          deleting={deleting}
        />
      )}
    </div>
  );
}

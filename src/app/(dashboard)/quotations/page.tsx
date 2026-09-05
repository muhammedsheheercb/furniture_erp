"use client";
import React, { useState, useEffect, useCallback, Fragment } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useDateFilter } from "@/context/DateFilterContext";
import {
  Plus,
  Search,
  FileText,
  Pencil,
  Trash2,
  ChevronDown,
  CheckCircle,
  XCircle,
  Clock,
  Truck,
  Package,
  Calendar,
  Eye,
  Check,
  X,
  UserPlus,
  Download,
  AlertTriangle,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "react-hot-toast";
import {
  IQuotation,
  IQuotationForm,
  IQuotationItem,
  UnitType,
  QuotationStatus,
  DeliveryStatus,
} from "@/types";
import Modal from "@/components/ui/Modal";
import ConfirmModal from "@/components/ui/ConfirmModal";
import Spinner from "@/components/ui/Spinner";
import Pagination from "@/components/ui/Pagination";
import { formatCurrency, formatDate } from "@/lib/utils";
import { generateQuotationPDF, generateInvoicePDF } from "@/lib/pdf-utils";
import CustomerModal from "@/components/customers/CustomerModal";
import SaleModal from "@/components/sales/SaleModal";
import QuotationItemModal from "@/components/quotations/QuotationItemModal";
import axios from "axios";
import { ICustomer } from "@/types";
import { useLanguage } from "../../../context/LanguageContext";

const LIMIT = 15;
const UNITS: UnitType[] = [
  "pcs",
  "meters",
  "sq.meters",
  "kg",
  "liters",
  "box",
  "set",
  "roll",
];

const unitLabel: Record<UnitType, string> = {
  pcs: "Pcs",
  meters: "Meters",
  "sq.meters": "Sq.M",
  kg: "KG",
  liters: "Liters",
  box: "Box",
  set: "Set",
  roll: "Roll",
};

function statusBadge(status: QuotationStatus) {
  const map: Record<
    QuotationStatus,
    { label: string; cls: string; icon: React.ReactNode }
  > = {
    quote: { label: "Quote", cls: "badge-quote", icon: <FileText size={11} /> },
    sale: { label: "Sale", cls: "badge-sale", icon: <CheckCircle size={11} /> },
    reject: {
      label: "Rejected",
      cls: "badge-reject",
      icon: <XCircle size={11} />,
    },
  };
  const { label, cls, icon } = map[status] || map.quote;
  return (
    <span
      className={cls}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 4,
        padding: "3px 10px",
        borderRadius: 20,
        fontSize: 11,
        fontWeight: 700,
      }}
    >
      {icon}
      {label}
    </span>
  );
}

function deliveryBadge(deliveryStatus: DeliveryStatus, deliveryDate?: string) {
  const isOverdue =
    deliveryDate &&
    new Date(deliveryDate) < new Date() &&
    deliveryStatus !== "delivered";
  const map: Record<
    DeliveryStatus,
    { label: string; bg: string; color: string; border: string }
  > = {
    pending: {
      label: "Pending",
      bg: "#FEF5E7",
      color: "#CA6F1E",
      border: "#FAD7A0",
    },
    delivered: {
      label: "Delivered",
      bg: "#EAFAF1",
      color: "#1E8449",
      border: "#A9DFBF",
    },
    partial: {
      label: "Partial",
      bg: "#EBF5FB",
      color: "#2980B9",
      border: "#AED6F1",
    },
  };
  const s = map[deliveryStatus] || map.pending;
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 4,
        padding: "3px 10px",
        borderRadius: 20,
        fontSize: 11,
        fontWeight: 700,
        background: isOverdue ? "#FDEDEC" : s.bg,
        color: isOverdue ? "#C0392B" : s.color,
        border: `1px solid ${isOverdue ? "#F5B7B1" : s.border}`,
      }}
    >
      <Truck size={11} />
      {isOverdue ? "Overdue" : s.label}
    </span>
  );
}

const emptyForm = (): IQuotationForm => ({
  customerName: "",
  customerMobile: "",
  customerAddress: "",
  items: [],
  subtotal: 0,
  tax: 0,
  discount: 0,
  total: 0,
  status: "quote",
  deliveryStatus: "pending",
  deliveryDate: "",
  notes: "",
  validUntil: "",
  date: new Date().toISOString().split("T")[0] ?? "",
});

function calcTotals(items: IQuotationItem[], taxPct: number, discPct: number) {
  const subtotal = items.reduce(
    (s, i) =>
      s +
      (i.subtotal || Math.max(0, i.price * i.quantity - (i.discount || 0))),
    0,
  );
  const taxAmt = items.reduce(
    (s, i) =>
      s +
      (i.taxAmount ||
        Math.max(0, i.price * i.quantity - (i.discount || 0)) * 0.05),
    0,
  );
  const discAmt = discPct || 0;
  return { subtotal, taxAmt, total: Math.round(subtotal + taxAmt - discAmt) };
}

export default function QuotationsPage() {
  const { t } = useLanguage();
  const router = useRouter();
  const { data: session, status } = useSession();
  const isAdmin =
    session?.user?.role === "admin" || session?.user?.role === "owner";
  const perms = (session?.user?.permissions as any)?.quotations;
  const canCreate = isAdmin || perms?.create;
  const canEdit = isAdmin || perms?.edit;
  const canDelete = isAdmin || perms?.delete;
  const canView = isAdmin || perms?.view;

  const { startDate, endDate } = useDateFilter();

  if (status === "loading")
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Spinner />
      </div>
    );

  if (!canView) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <XCircle size={48} className="text-rose-500" />
        <h2 className="text-2xl font-bold text-[#1A1210]">
          {t("accessDenied")}
        </h2>
        <p className="text-[#7A6055]">{t("youDontHavePermissionTo")}</p>
        <button
          onClick={() => router.push("/")}
          className="px-6 py-2 bg-[#2C1810] text-white rounded-lg"
        >
          {t("goHome")}
        </button>
      </div>
    );
  }

  const [quotations, setQuotations] = useState<IQuotation[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [deliveryFilter, setDeliveryFilter] = useState("");

  const [modalOpen, setModalOpen] = useState(false);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [editingQuotation, setEditingQuotation] = useState<IQuotation | null>(
    null,
  );
  const [viewingQuotation, setViewingQuotation] = useState<IQuotation | null>(
    null,
  );
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState<IQuotationForm>(emptyForm());
  const [taxPct, setTaxPct] = useState(0);
  const [discPct, setDiscPct] = useState(0);

  const [customers, setCustomers] = useState<ICustomer[]>([]);
  const [customerModalOpen, setCustomerModalOpen] = useState(false);
  const [fetchingCustomers, setFetchingCustomers] = useState(false);

  const [saleModalOpen, setSaleModalOpen] = useState(false);
  const [convertingQuotation, setConvertingQuotation] =
    useState<IQuotation | null>(null);

  const [itemModalOpen, setItemModalOpen] = useState(false);
  const [editingItemIdx, setEditingItemIdx] = useState<number | null>(null);

  const [statusConfirm, setStatusConfirm] = useState<{
    id: string;
    status: QuotationStatus;
  } | null>(null);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(LIMIT),
        search,
        ...(statusFilter && { status: statusFilter }),
        ...(deliveryFilter && { deliveryStatus: deliveryFilter }),
        ...(startDate && { startDate }),
        ...(endDate && { endDate }),
      });
      const res = await fetch(`/api/quotations?${params}`);
      const data = await res.json();
      if (data.success) {
        setQuotations(data.data);
        setTotal(data.total);
        setTotalPages(data.totalPages);
      }
    } finally {
      setLoading(false);
    }
  }, [page, search, statusFilter, deliveryFilter, startDate, endDate]);

  const fetchCustomers = async () => {
    setFetchingCustomers(true);
    try {
      const res = await axios.get("/api/customers?limit=1000");
      if (res.data.success) setCustomers(res.data.data);
    } catch (err) {
      console.error("Failed to fetch customers", err);
    } finally {
      setFetchingCustomers(false);
    }
  };

  useEffect(() => {
    load();
    fetchCustomers();
  }, [load]);
  useEffect(() => {
    setPage(1);
  }, [search, statusFilter, deliveryFilter]);

  const recalc = (items: IQuotationItem[], tp: number, dp: number) => {
    const { subtotal, taxAmt, total } = calcTotals(items, tp, dp);
    setForm((f) => ({ ...f, items, subtotal, total, tax: taxAmt, discount: dp }));
  };

  const updateItem = (
    idx: number,
    key: keyof IQuotationItem,
    val: string | number,
  ) => {
    const items = form.items.map((it, i) => {
      if (i !== idx) return it;
      const updated = { ...it, [key]: val } as any;
      updated.subtotal = Math.max(0, updated.price * updated.quantity - (updated.discount || 0));
      updated.taxAmount = updated.subtotal * 0.05;
      updated.total = updated.subtotal + updated.taxAmount;
      return updated;
    });
    recalc(items, taxPct, discPct);
  };

  const addItem = () => {
    setEditingItemIdx(null);
    setItemModalOpen(true);
  };

  const addBlankItem = () => {
    const newItem: IQuotationItem = {
      itemName: "",
      description: "",
      unit: "pcs",
      quantity: 1,
      price: 0,
      discount: 0,
      color: "",
      material: "",
      size: "",
      subtotal: 0,
      taxAmount: 0,
      total: 0,
    };
    recalc([...form.items, newItem], taxPct, discPct);
  };

  const handleItemModalSubmit = (item: IQuotationItem) => {
    if (editingItemIdx !== null) {
      const items = form.items.map((it, i) =>
        i === editingItemIdx ? item : it,
      );
      recalc(items, taxPct, discPct);
    } else {
      recalc([...form.items, item], taxPct, discPct);
    }
  };

  const removeItem = (idx: number) =>
    recalc(
      form.items.filter((_, i) => i !== idx),
      taxPct,
      discPct,
    );

  const openCreate = () => {
    setEditingQuotation(null);
    setForm(emptyForm());
    setTaxPct(0);
    setDiscPct(0);
    setModalOpen(true);
  };

  const openEdit = (q: IQuotation) => {
    setEditingQuotation(q);
    setTaxPct(q.tax || 0);
    setDiscPct(q.discount || 0);

    const rawCustId =
      typeof q.customerId === "object"
        ? (q.customerId as any)?._id
        : q.customerId;
    const foundCust = customers.find(
      (c) =>
        (rawCustId && String(c._id) === String(rawCustId)) ||
        (q.customerName &&
          c.name?.toLowerCase().trim() ===
          q.customerName.toLowerCase().trim()) ||
        (q.customerMobile && c.mobile?.trim() === q.customerMobile.trim()),
    );
    const resolvedCustomerId =
      foundCust?._id || (typeof rawCustId === "string" ? rawCustId : "");

    setForm({
      customerId: resolvedCustomerId,
      customerName: q.customerName || foundCust?.name || "",
      customerMobile: q.customerMobile || foundCust?.mobile || "",
      customerAddress: q.customerAddress || foundCust?.address || "",
      items: q.items.map((it: any) => ({
        ...it,
        subtotal:
          it.subtotal ||
          Math.max(0, it.price * it.quantity - (it.discount || 0)),
        taxAmount:
          it.taxAmount ||
          Math.max(0, it.price * it.quantity - (it.discount || 0)) * 0.05,
        total:
          it.total ||
          Math.max(0, it.price * it.quantity - (it.discount || 0)) * 1.05,
      })),
      subtotal: q.subtotal,
      tax: q.tax,
      discount: q.discount,
      total: q.total,
      status: q.status,
      deliveryStatus: q.deliveryStatus,
      deliveryDate: q.deliveryDate ? q.deliveryDate.split("T")[0] : "",
      notes: q.notes || "",
      validUntil: q.validUntil ? q.validUntil.split("T")[0] : "",
      date: q.date
        ? (new Date(q.date).toISOString().split("T")[0] ?? "")
        : (new Date().toISOString().split("T")[0] ?? ""),
    });
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.customerName.trim())
      return toast.error("Customer name is required");
    if (!form.customerMobile?.trim())
      return toast.error("Mobile number is required");
    
    if (!form.date) return toast.error("Date is required");
    if (!form.validUntil) return toast.error("Valid Until date is required");
    if (form.items.length === 0)
      return toast.error("Please add at least one product");

    if (form.items.some((i) => !i.itemName.trim()))
      return toast.error("All products must have a name");
    if (form.items.some((i) => (i.price || 0) <= 0))
      return toast.error("All products must have a valid price (> 0)");

    // If reject is clicked, we might want to just delete it, but the user said
    // "reject click the quation remove this form" -> maybe delete from DB?
    // Let's handle status updates in a separate function.

    setSaving(true);
    try {
      const url = editingQuotation
        ? `/api/quotations/${editingQuotation._id}`
        : "/api/quotations";
      const method = editingQuotation ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, tax: taxPct, discount: discPct }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(
          editingQuotation ? "Quotation updated" : "Quotation created",
        );
        setModalOpen(false);
        load();
        // Automatically download PDF after saving
        if (data.data) {
          // Add a tiny delay to ensure everything is settled before PDF generation
          setTimeout(() => {
            generateQuotationPDF({
              ...data.data,
              createdBy: session?.user?.name,
            });
          }, 500);
        }
      } else {
        toast.error(data.error || "Failed to save");
      }
    } finally {
      setSaving(false);
    }
  };

  const handleStatusUpdate = async () => {
    if (!statusConfirm) return;
    const { id, status } = statusConfirm;

    setUpdatingStatus(true);
    try {
      if (status === "reject") {
        const res = await fetch(`/api/quotations/${id}`, { method: "DELETE" });
        if ((await res.json()).success) {
          toast.success("Quotation removed");
          load();
        }
      } else if (status === "sale") {
        const q = quotations.find((qt) => qt._id === id);
        if (q) {
          const valRes = await axios.get(`/api/quotations/${id}/validate-stock`);
          if (valRes.data.success) {
            setConvertingQuotation(q);
            setSaleModalOpen(true);
          }
        }
      } else {
        const res = await fetch(`/api/quotations/${id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status }),
        });
        if ((await res.json()).success) {
          toast.success(`Quotation marked as ${status}`);
          load();
        }
      }
      setStatusConfirm(null);
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Failed to update status");
      setStatusConfirm(null);
      load();
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleSaleSubmit = async (data: any) => {
    try {
      const payload = {
        ...data,
        quotationId: convertingQuotation?._id,
      };
      const res = await axios.post("/api/sales", payload);
      if (res.data.success) {
        toast.success("Sale created and Production started!");

        // Generate PDF
        const saleData = res.data.data;
        generateInvoicePDF({
          number: saleData.saleNumber,
          customerOrSupplier: saleData.customerName,
          customerOrSupplierNumber: saleData.customerNumber,
          date: saleData.date,
          paymentType: saleData.paymentType,
          items: saleData.items,
          subtotal: saleData.subtotal,
          tax: saleData.tax,
          discount: saleData.discount,
          total: saleData.total,
          type: "Sale",
          isTaxInvoice: saleData.isTaxInvoice,
          advancePaid: saleData.advancePaid,
          customerMobile: saleData.customerMobile,
          customerAddress: saleData.customerAddress,
          deliveryAddress: saleData.deliveryAddress,
          deliveryDate: saleData.deliveryDate,
        });

        setSaleModalOpen(false);
        setConvertingQuotation(null);
        load();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Failed to create sale");
    }
  };

  const handleCreateCustomer = async (data: any) => {
    try {
      const res = await axios.post("/api/customers", data);
      if (res.data.success) {
        toast.success("Customer created");
        setCustomerModalOpen(false);
        fetchCustomers();
        const newCust = res.data.data;
        setForm((f) => ({
          ...f,
          customerId: newCust._id,
          customerName: newCust.name,
          customerMobile: newCust.mobile || "",
          customerAddress: newCust.address || "",
        }));
      }
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Failed to create customer");
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/quotations/${deleteId}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Deleted");
        setDeleteId(null);
        load();
      } else toast.error(data.error || "Failed");
    } finally {
      setDeleting(false);
    }
  };

  const statusCounts = {
    all: total,
    quote: quotations.filter((q) => q.status === "quote").length,
    sale: quotations.filter((q) => q.status === "sale").length,
    reject: quotations.filter((q) => q.status === "reject").length,
  };

  return (
    <div className="page-container">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        style={{
          display: "flex",
          alignItems: "flex-end",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 12,
        }}
      >
        <div>
          <h1
            style={{
              fontSize: 24,
              fontWeight: 800,
              color: "#1A1210",
              margin: 0,
            }}
          >
            {t("quotations")}
          </h1>
          <p style={{ fontSize: 13, color: "#7A6055", margin: "4px 0 0" }}>
            {t("manageFurnitureQuotationsSalesAnd")}
          </p>
        </div>
        {canCreate && (
          <motion.button
            whileHover={{ scale: 1.02, y: -1 }}
            whileTap={{ scale: 0.98 }}
            onClick={openCreate}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "10px 20px",
              borderRadius: 10,
              border: "none",
              background: "linear-gradient(135deg, #2C1810, #5C3D2E)",
              color: "#fff",
              fontSize: 14,
              fontWeight: 600,
              cursor: "pointer",
              boxShadow: "0 4px 16px rgba(44,24,16,0.2)",
            }}
          >
            <Plus size={17} /> {t("newQuotation")}
          </motion.button>
        )}
      </motion.div>

      {/* Stats row */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit,minmax(160px,1fr))",
          gap: 12,
        }}
      >
        {[
          {
            label: "Total",
            value: total,
            color: "#2C1810",
            bg: "#F7F4F0",
            border: "#E5DDD5",
          },
          {
            label: "Active Quotes",
            value: quotations.filter((q) => q.status === "quote").length,
            color: "#2980B9",
            bg: "#EBF5FB",
            border: "#AED6F1",
          },
          {
            label: "Converted Sales",
            value: quotations.filter((q) => q.status === "sale").length,
            color: "#1E8449",
            bg: "#EAFAF1",
            border: "#A9DFBF",
          },
          {
            label: "Rejected",
            value: quotations.filter((q) => q.status === "reject").length,
            color: "#C0392B",
            bg: "#FDEDEC",
            border: "#F5B7B1",
          },
        ].map(({ label, value, color, bg, border }) => (
          <motion.div
            key={label}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            style={{
              background: bg,
              border: `1px solid ${border}`,
              borderRadius: 12,
              padding: "16px 20px",
            }}
          >
            <p
              style={{
                fontSize: 12,
                color: "#7A6055",
                margin: 0,
                fontWeight: 500,
              }}
            >
              {label}
            </p>
            <p
              style={{
                fontSize: 24,
                fontWeight: 800,
                color,
                margin: "4px 0 0",
              }}
            >
              {value}
            </p>
          </motion.div>
        ))}
      </div>

      {/* Filters */}
      <div className="filter-bar">
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            background: "#fff",
            border: "1.5px solid #E5DDD5",
            borderRadius: 10,
            padding: "0 14px",
            height: 40,
            flex: "1 1 240px",
            maxWidth: 320,
          }}
        >
          <Search size={15} color="#A89080" />
          <input
            placeholder={t("searchByCustomerOrNumber")}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              border: "none",
              outline: "none",
              fontSize: 13,
              color: "#1A1210",
              background: "transparent",
              flex: 1,
            }}
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          style={{
            border: "1.5px solid #E5DDD5",
            borderRadius: 10,
            padding: "0 12px",
            height: 40,
            fontSize: 13,
            color: "#1A1210",
            background: "#fff",
            cursor: "pointer",
            outline: "none",
          }}
        >
          <option value="">{t("allStatuses")}</option>
          <option value="quote">{t("quote")}</option>
          <option value="sale">{t("sale")}</option>
          <option value="reject">{t("rejected")}</option>
        </select>
      </div>

      {/* Table */}
      <div className="table-wrapper">
        <table className="w-full">
          <thead>
            <tr>
              <th className="th">{t("quote")}</th>
              <th className="th">{t("customer")}</th>
              <th className="th">{t("date")}</th>
              <th className="th">{t("items")}</th>
              <th className="th text-end">{t("subtotal")}</th>
              <th className="th text-end">{t("discount")}</th>
              <th className="th text-end">{t("total")}</th>
              <th className="th text-center">{t("status")}</th>
              <th className="th text-center">{t("salesPerson")}</th>
              <th className="th text-end">{t("actions")}</th>
            </tr>
          </thead>
          <tbody className="divide-y" style={{ borderColor: "#F0EAE3" }}>
            {loading ? (
              <tr>
                <td
                  colSpan={7}
                  style={{ textAlign: "center", padding: "48px 0" }}
                >
                  <Spinner />
                </td>
              </tr>
            ) : quotations.length === 0 ? (
              <tr>
                <td
                  colSpan={7}
                  style={{ textAlign: "center", padding: "64px 0" }}
                >
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      gap: 12,
                    }}
                  >
                    <FileText size={36} color="#E5DDD5" />
                    <p style={{ color: "#A89080", fontSize: 14, margin: 0 }}>
                      {t("noQuotationsFound")}
                    </p>
                    {canCreate && (
                      <button
                        onClick={openCreate}
                        style={{
                          marginTop: 4,
                          padding: "8px 18px",
                          borderRadius: 8,
                          background: "#2C1810",
                          border: "none",
                          color: "#fff",
                          fontSize: 13,
                          fontWeight: 600,
                          cursor: "pointer",
                        }}
                      >
                        {t("createFirstQuotation")}
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ) : (
              quotations.map((q, idx) => (
                <React.Fragment key={q._id}>
                  <motion.tr
                    className="tr-hover"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.03 }}
                  >
                    <td className="td">
                      <span
                        style={{
                          fontFamily: "monospace",
                          fontSize: 12,
                          color: "#7A6055",
                          fontWeight: 600,
                        }}
                      >
                        {q.quotationNumber}
                      </span>
                    </td>
                    <td className="td">
                      <div
                        style={{
                          fontWeight: 600,
                          color: "#1A1210",
                          fontSize: 13,
                        }}
                      >
                        {q.customerName}
                      </div>
                      {q.customerMobile && (
                        <div style={{ fontSize: 11, color: "#A89080" }}>
                          {q.customerMobile}
                        </div>
                      )}
                    </td>
                    <td className="td" style={{ fontSize: 12, color: "#7A6055" }}>
                      {formatDate(q.date)}
                    </td>
                    <td className="td">
                      <span
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 4,
                          background: "#F7F4F0",
                          border: "1px solid #E5DDD5",
                          borderRadius: 20,
                          padding: "2px 10px",
                          fontSize: 11,
                          fontWeight: 600,
                          color: "#5C3D2E",
                        }}
                      >
                        <Package size={10} /> {q.items.length} {t("items")}
                      </span>
                    </td>
                    <td className="td text-end">
                      <span style={{ color: "#7A6055", fontSize: 13 }}>
                        {formatCurrency(q.subtotal)}
                      </span>
                    </td>
                    <td className="td text-end">
                      {(q.discount || 0) > 0 ? (
                        <span
                          style={{
                            color: "#C0392B",
                            fontWeight: 600,
                            fontSize: 12,
                          }}
                        >
                          -
                          {formatCurrency(q.discount || 0)}
                          <br />

                        </span>
                      ) : (
                        <span style={{ color: "#A89080", fontSize: 12 }}>—</span>
                      )}
                    </td>
                    <td className="td text-end">
                      <span
                        style={{
                          fontWeight: 700,
                          color: "#2C1810",
                          fontSize: 14,
                        }}
                      >
                        {formatCurrency(q.total)}
                      </span>
                    </td>
                    <td className="td text-center">{statusBadge(q.status)}</td>
                    <td className="td text-center">
                      <span
                        style={{
                          fontSize: 11,
                          fontWeight: 700,
                          color: "#2980B9",
                          background: "#EBF5FB",
                          padding: "3px 10px",
                          borderRadius: 20,
                        }}
                      >
                        {q.createdBy?.name || "—"}
                      </span>
                    </td>

                    <td className="td text-end">
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "flex-end",
                          gap: 4,
                        }}
                      >
                        <button
                          onClick={() => {
                            setViewingQuotation(q);
                            setViewModalOpen(true);
                          }}
                          style={{
                            padding: "6px",
                            borderRadius: 8,
                            border: "1px solid #E5DDD5",
                            background: "#fff",
                            cursor: "pointer",
                            color: "#7A6055",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            transition: "all 0.15s",
                          }}
                          title="View Quotation"
                        >
                          <Eye size={16} />
                        </button>

                        {canEdit && q.status === "quote" && (
                          <button
                            onClick={() => openEdit(q)}
                            style={{
                              padding: "6px",
                              borderRadius: 8,
                              border: "1px solid #E5DDD5",
                              background: "#fff",
                              cursor: "pointer",
                              color: "#7A6055",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              transition: "all 0.15s",
                            }}
                            title="Edit Quotation"
                          >
                            <Pencil size={16} />
                          </button>
                        )}

                        {q.status === "quote" && (
                          <>
                            <button
                              onClick={() =>
                                setStatusConfirm({ id: q._id, status: "sale" })
                              }
                              style={{
                                padding: "6px",
                                borderRadius: 8,
                                border: "1px solid #A9DFBF",
                                background: "#EAFAF1",
                                cursor: "pointer",
                                color: "#1E8449",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                transition: "all 0.15s",
                              }}
                              title={t("acceptConvert")}
                            >
                              <Check size={16} />
                            </button>
                            <button
                              onClick={() =>
                                setStatusConfirm({ id: q._id, status: "reject" })
                              }
                              style={{
                                padding: "6px",
                                borderRadius: 8,
                                border: "1px solid #F5B7B1",
                                background: "#FDEDEC",
                                cursor: "pointer",
                                color: "#C0392B",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                transition: "all 0.15s",
                              }}
                              title={t("rejectRemove")}
                            >
                              <X size={16} />
                            </button>
                          </>
                        )}
                        {canDelete && (
                          <button
                            onClick={() => setDeleteId(q._id)}
                            style={{
                              padding: "6px",
                              borderRadius: 8,
                              border: "1px solid #E5DDD5",
                              background: "#fff",
                              cursor: "pointer",
                              color: "#7A6055",
                              display: "flex",
                              alignItems: "center",
                              transition: "all 0.15s",
                            }}
                            onMouseEnter={(e) => {
                              (e.currentTarget as HTMLElement).style.background =
                                "#FDEDEC";
                              (e.currentTarget as HTMLElement).style.color =
                                "#C0392B";
                              (e.currentTarget as HTMLElement).style.borderColor =
                                "#F5B7B1";
                            }}
                            onMouseLeave={(e) => {
                              (e.currentTarget as HTMLElement).style.background =
                                "#fff";
                              (e.currentTarget as HTMLElement).style.color =
                                "#7A6055";
                              (e.currentTarget as HTMLElement).style.borderColor =
                                "#E5DDD5";
                            }}
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    </td>
                  </motion.tr>
                  {q.validationError && (
                    <tr>
                      <td colSpan={10} style={{ padding: 0 }}>
                        <div
                          style={{
                            background: "#FEF2F2",
                            color: "#B91C1C",
                            padding: "8px 16px",
                            fontSize: 12,
                            borderBottom: "1px solid #FEE2E2",
                            display: "flex",
                            alignItems: "center",
                            gap: 6
                          }}
                        >
                          <AlertTriangle size={14} />
                          {q.validationError}
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))
            )}
          </tbody>
        </table>
        <div style={{ borderTop: "1px solid #F0EAE3", padding: "0 8px" }}>
          <Pagination
            page={page}
            totalPages={totalPages}
            total={total}
            limit={LIMIT}
            onPageChange={setPage}
          />
        </div>
      </div>

      {/* Create / Edit Modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingQuotation ? "Edit Quotation" : "New Quotation"}
        size="screen"
      >
        <form
          onSubmit={handleSubmit}
          style={{ display: "flex", flexDirection: "column", gap: 20 }}
        >
          {/* Customer */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 14 }}>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
                gap: 14,
              }}
            >
              <div>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    marginBottom: 6,
                  }}
                >
                  <label
                    style={{
                      fontSize: 12,
                      fontWeight: 600,
                      color: "#5A4035",
                      display: "block",
                      letterSpacing: "0.04em",
                      margin: 0,
                    }}
                  >
                    {t("selectCustomer")}
                  </label>
                  <button
                    type="button"
                    onClick={() => setCustomerModalOpen(true)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 4,
                      background: "none",
                      border: "none",
                      color: "#C9A84C",
                      fontSize: 11,
                      fontWeight: 700,
                      cursor: "pointer",
                      padding: 0,
                    }}
                  >
                    <UserPlus size={12} /> {t("new")}
                  </button>
                </div>
                <select
                  value={form.customerId || ""}
                  onChange={(e) => {
                    const c = customers.find((x) => x._id === e.target.value);
                    setForm((f) => ({
                      ...f,
                      customerId: e.target.value,
                      customerName: c?.name || f.customerName,
                      customerMobile: c?.mobile || f.customerMobile,
                      customerAddress: c?.address || f.customerAddress,
                    }));
                  }}
                  style={{
                    width: "100%",
                    height: 40,
                    border: "1.5px solid #E5DDD5",
                    borderRadius: 8,
                    padding: "0 12px",
                    fontSize: 13,
                    color: "#1A1210",
                    outline: "none",
                    background: "#FAF8F6",
                    cursor: "pointer",
                  }}
                >
                  <option value="">{t("selectExistingCustomer")}</option>
                  {customers.map((c) => (
                    <option key={c._id} value={c._id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label
                  style={{
                    fontSize: 12,
                    fontWeight: 600,
                    color: "#5A4035",
                    display: "block",
                    marginBottom: 6,
                    letterSpacing: "0.04em",
                  }}
                >
                  {t("customerName")}
                </label>
                <input
                  value={form.customerName}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, customerName: e.target.value }))
                  }
                  required
                  style={{
                    width: "100%",
                    height: 40,
                    border: "1.5px solid #E5DDD5",
                    borderRadius: 8,
                    padding: "0 12px",
                    fontSize: 13,
                    color: "#1A1210",
                    outline: "none",
                    background: "#FAF8F6",
                  }}
                  placeholder={t("customerName")}
                />
              </div>
              <div>
                <label
                  style={{
                    fontSize: 12,
                    fontWeight: 600,
                    color: "#5A4035",
                    display: "block",
                    marginBottom: 6,
                    letterSpacing: "0.04em",
                  }}
                >
                  {t("mobile")}
                </label>
                <input
                  value={form.customerMobile}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, customerMobile: e.target.value }))
                  }
                  required
                  style={{
                    width: "100%",
                    height: 40,
                    border: "1.5px solid #E5DDD5",
                    borderRadius: 8,
                    padding: "0 12px",
                    fontSize: 13,
                    color: "#1A1210",
                    outline: "none",
                    background: "#FAF8F6",
                  }}
                  placeholder={t("mobileNumber")}
                />
              </div>
              <div style={{ gridColumn: "1 / -1" }}>
                <label
                  style={{
                    fontSize: 12,
                    fontWeight: 600,
                    color: "#5A4035",
                    display: "block",
                    marginBottom: 6,
                    letterSpacing: "0.04em",
                  }}
                >
                  {t("customerAddress")}
                </label>
                <textarea
                  value={form.customerAddress}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, customerAddress: e.target.value }))
                  }
                  style={{
                    width: "100%",
                    height: 60,
                    border: "1.5px solid #E5DDD5",
                    borderRadius: 8,
                    padding: "10px 12px",
                    fontSize: 13,
                    color: "#1A1210",
                    outline: "none",
                    background: "#FAF8F6",
                    resize: "none",
                  }}
                  placeholder={t("customerAddress")}
                />
              </div>
              <div>
                <label
                  style={{
                    fontSize: 12,
                    fontWeight: 600,
                    color: "#5A4035",
                    display: "block",
                    marginBottom: 6,
                    letterSpacing: "0.04em",
                  }}
                >
                  {t("date")}
                </label>
                <input
                  type="date"
                  value={form.date}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, date: e.target.value }))
                  }
                  required
                  style={{
                    width: "100%",
                    height: 40,
                    border: "1.5px solid #E5DDD5",
                    borderRadius: 8,
                    padding: "0 12px",
                    fontSize: 13,
                    color: "#1A1210",
                    outline: "none",
                    background: "#FAF8F6",
                  }}
                />
              </div>
              <div>
                <label
                  style={{
                    fontSize: 12,
                    fontWeight: 600,
                    color: "#5A4035",
                    display: "block",
                    marginBottom: 6,
                    letterSpacing: "0.04em",
                  }}
                >
                  {t("validUntil")}
                </label>
                <input
                  type="date"
                  value={form.validUntil}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, validUntil: e.target.value }))
                  }
                  required
                  style={{
                    width: "100%",
                    height: 40,
                    border: "1.5px solid #E5DDD5",
                    borderRadius: 8,
                    padding: "0 12px",
                    fontSize: 13,
                    color: "#1A1210",
                    outline: "none",
                    background: "#FAF8F6",
                  }}
                />
              </div>
            </div>
          </div>

          {/* Status */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 14 }}>
            <div>
              <label
                style={{
                  fontSize: 12,
                  fontWeight: 600,
                  color: "#5A4035",
                  display: "block",
                  marginBottom: 6,
                  letterSpacing: "0.04em",
                }}
              >
                {t("status")}
              </label>
              <select
                value={form.status}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    status: e.target.value as QuotationStatus,
                  }))
                }
                style={{
                  width: "100%",
                  height: 40,
                  border: "1.5px solid #E5DDD5",
                  borderRadius: 8,
                  padding: "0 12px",
                  fontSize: 13,
                  color: "#1A1210",
                  outline: "none",
                  background: "#FAF8F6",
                  cursor: "pointer",
                }}
              >
                <option value="quote">{t("quote")}</option>
                <option value="sale">{t("sale")}</option>
                <option value="reject">{t("rejected")}</option>
              </select>
            </div>
          </div>

          {/* Items */}
          <div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: 10,
              }}
            >
              <label
                style={{
                  fontSize: 12,
                  fontWeight: 700,
                  color: "#5A4035",
                  letterSpacing: "0.04em",
                }}
              >
                {t("productDetails")}
              </label>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>

                <button
                  type="button"
                  onClick={addItem}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    padding: "5px 12px",
                    borderRadius: 8,
                    border: "1.5px solid #2C1810",
                    background: "#2C1810",
                    fontSize: 12,
                    fontWeight: 600,
                    color: "#fff",
                    cursor: "pointer",
                  }}
                >
                  <Plus size={13} /> {t("addProduct")}
                </button>
              </div>
            </div>

            {form.items.length === 0 && (
              <div
                style={{
                  padding: "30px",
                  border: "2px dashed #E5DDD5",
                  borderRadius: 12,
                  textAlign: "center",
                  background: "#FAF8F6",
                  marginBottom: 20,
                }}
              >
                <p style={{ color: "#7A6055", fontSize: 13, marginBottom: 12 }}>
                  {t("noProductsAddedToThis")}
                </p>
                <div
                  style={{ display: "flex", justifyContent: "center", gap: 10 }}
                >
                  <button
                    type="button"
                    onClick={addBlankItem}
                    style={{
                      fontSize: 12,
                      color: "#C9A84C",
                      fontWeight: 700,
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                    }}
                  >
                    {t("addBlankRow")}
                  </button>
                  <span style={{ color: "#E5DDD5" }}>|</span>
                  <button
                    type="button"
                    onClick={addItem}
                    style={{
                      fontSize: 12,
                      color: "#C9A84C",
                      fontWeight: 700,
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                    }}
                  >
                    {t("selectFromProducts")}
                  </button>
                </div>
              </div>
            )}

            {/* Item headers - hidden on mobile */}
            <div
              className="hidden md:grid"
              style={{
                gridTemplateColumns: "1.5fr 1fr 90px 130px 80px 130px 130px 130px 40px",
                gap: 8,
                marginBottom: 6,
                padding: "0 4px",
              }}
            >
              {["Product", "Color", "Qty", "Price", "Discount", "Subtotal", "VAT(5%)", "Total", ""].map(
                (h) => (
                  <div
                    key={h}
                    style={{
                      fontSize: 10,
                      fontWeight: 700,
                      color: "#A89080",
                      textTransform: "uppercase",
                      letterSpacing: "0.06em",
                      textAlign: ["Qty", "Price", "Discount", "Subtotal", "VAT(5%)", "Total"].includes(h)
                        ? "right"
                        : "left",
                    }}
                  >
                    {h}
                  </div>
                ),
              )}
            </div>

            {form.items.map((item, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
                  gap: 8,
                  marginBottom: 12,
                  padding: 12,
                  background: "#FAF8F6",
                  borderRadius: 10,
                  border: "1px solid #E5DDD5",
                  position: "relative",
                }}
                className="md:!grid md:!grid-cols-[1.5fr_1fr_90px_130px_80px_130px_130px_130px_40px] md:!bg-transparent md:!border-none md:!p-0 md:!gap-2 md:!mb-2"
              >
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 4,
                    gridColumn: "span 2",
                  }}
                  className="md:!col-span-1"
                >
                  <label
                    className="md:hidden"
                    style={{ fontSize: 10, fontWeight: 700, color: "#A89080" }}
                  >
                    {t("productName")}
                  </label>
                  <input
                    value={item.itemName}
                    onChange={(e) =>
                      updateItem(idx, "itemName", e.target.value)
                    }
                    placeholder={t("productName")}
                    style={{
                      width: "100%",
                      height: 36,
                      border: "1.5px solid #E5DDD5",
                      borderRadius: 7,
                      padding: "0 10px",
                      fontSize: 13,
                      color: "#1A1210",
                      outline: "none",
                      background: "#fff",
                    }}
                  />
                </div>
                {(["color"] as const).map((field) => (
                  <div
                    key={field}
                    style={{ display: "flex", flexDirection: "column", gap: 4 }}
                  >
                    <label
                      className="md:hidden"
                      style={{
                        fontSize: 10,
                        fontWeight: 700,
                        color: "#A89080",
                      }}
                    >
                      {field.toUpperCase()}
                    </label>
                    <input
                      value={item[field] || ""}
                      onChange={(e) => updateItem(idx, field, e.target.value)}
                      placeholder={
                        field.charAt(0).toUpperCase() + field.slice(1)
                      }
                      style={{
                        height: 36,
                        border: "1.5px solid #E5DDD5",
                        borderRadius: 7,
                        padding: "0 10px",
                        fontSize: 12,
                        color: "#1A1210",
                        outline: "none",
                        background: "#fff",
                        width: "100%",
                      }}
                    />
                  </div>
                ))}
                {(["quantity", "price", "discount"] as const).map((field) => (
                  <div
                    key={field}
                    style={{ display: "flex", flexDirection: "column", gap: 4 }}
                  >
                    <label
                      className="md:hidden"
                      style={{
                        fontSize: 10,
                        fontWeight: 700,
                        color: "#A89080",
                      }}
                    >
                      {field.toUpperCase()}
                    </label>
                    <input
                      type="number"
                      value={item[field]}
                      onChange={(e) =>
                        updateItem(idx, field, parseFloat(e.target.value) || 0)
                      }
                      min={0}
                      step={field === "quantity" ? "0.01" : "0.001"}
                      style={{
                        height: 36,
                        border: "1.5px solid #E5DDD5",
                        borderRadius: 7,
                        padding: "0 8px",
                        fontSize: 12,
                        color: "#1A1210",
                        outline: "none",
                        background: "#fff",
                        width: "100%",
                        textAlign: "right",
                      }}
                    />
                  </div>
                ))}
                <div
                  style={{ display: "flex", flexDirection: "column", gap: 4 }}
                >
                  <label
                    className="md:hidden"
                    style={{ fontSize: 10, fontWeight: 700, color: "#A89080" }}
                  >
                    {t("subtotal")}
                  </label>
                  <div
                    style={{
                      height: 36,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "flex-end",
                      fontSize: 12,
                      fontWeight: 700,
                      color: "#7A6055",
                      paddingRight: 4,
                    }}
                  >
                    {item.subtotal?.toFixed(3)}
                  </div>
                </div>
                <div
                  style={{ display: "flex", flexDirection: "column", gap: 4 }}
                >
                  <label
                    className="md:hidden"
                    style={{ fontSize: 10, fontWeight: 700, color: "#A89080" }}
                  >
                    VAT (5%)
                  </label>
                  <div
                    style={{
                      height: 36,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "flex-end",
                      fontSize: 12,
                      fontWeight: 700,
                      color: "#7A6055",
                      paddingRight: 4,
                    }}
                  >
                    {item.taxAmount?.toFixed(3)}
                  </div>
                </div>
                <div
                  style={{ display: "flex", flexDirection: "column", gap: 4 }}
                >
                  <label
                    className="md:hidden"
                    style={{ fontSize: 10, fontWeight: 700, color: "#A89080" }}
                  >
                    {t("total")}
                  </label>
                  <div
                    style={{
                      height: 36,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "flex-end",
                      fontSize: 12,
                      fontWeight: 700,
                      color: "#2C1810",
                      paddingRight: 4,
                    }}
                  >
                    {item.total.toFixed(3)}
                  </div>
                </div>
                <div
                  style={{
                    position: "absolute",
                    top: -10,
                    right: -10,
                    display: "flex",
                    gap: 4,
                    zIndex: 1,
                  }}
                  className="md:!static md:!flex md:!flex-col md:!gap-1"
                >
                  <button
                    type="button"
                    onClick={() => {
                      setEditingItemIdx(idx);
                      setItemModalOpen(true);
                    }}
                    style={{
                      height: 24,
                      width: 24,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      border: "1.5px solid #AED6F1",
                      borderRadius: "50%",
                      background: "#EBF5FB",
                      color: "#2980B9",
                      cursor: "pointer",
                    }}
                    title={t("editItemDetails")}
                    className="md:!h-9 md:!w-[30px] md:!rounded-lg"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="11"
                      height="11"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                    </svg>
                  </button>
                  <button
                    type="button"
                    onClick={() => removeItem(idx)}
                    disabled={form.items.length === 1}
                    style={{
                      height: 24,
                      width: 24,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      border: "1.5px solid #F5B7B1",
                      borderRadius: "50%",
                      background: "#FDEDEC",
                      color: "#C0392B",
                      cursor: "pointer",
                      opacity: form.items.length === 1 ? 0.3 : 1,
                    }}
                    className="md:!h-9 md:!w-[30px] md:!rounded-lg md:!mt-0"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Totals */}
          <div
            style={{
              background: "#F7F4F0",
              border: "1px solid #E5DDD5",
              borderRadius: 12,
              padding: "16px 20px",
              display: "flex",
              flexDirection: "column",
              gap: 10,
              alignItems: "flex-end",
            }}
          >
            <div
              style={{
                display: "flex",
                gap: 16,
                alignItems: "center",
                flexWrap: "wrap",
                justifyContent: "flex-end",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <label
                  style={{ fontSize: 12, fontWeight: 600, color: "#7A6055" }}
                >
                  {t("disc")}
                </label>
                <input
                  type="number"
                  value={discPct}
                  onChange={(e) => {
                    const v = parseFloat(e.target.value) || 0;
                    setDiscPct(v);
                    recalc(form.items, taxPct, v);
                  }}
                  min={0}
                  style={{
                    width: 60,
                    height: 32,
                    border: "1.5px solid #E5DDD5",
                    borderRadius: 7,
                    padding: "0 8px",
                    fontSize: 12,
                    outline: "none",
                    background: "#fff",
                  }}
                />
              </div>
            </div>
            {(() => {
              const grossTotal = form.items.reduce(
                (s, i) => s + i.price * i.quantity,
                0,
              );
              const itemDiscountTotal = form.items.reduce(
                (s, i) => s + (i.discount || 0),
                0,
              );
              const globalDiscountAmt = discPct || 0;
              const totalDiscount = itemDiscountTotal + globalDiscountAmt;
              const taxAmt = form.items.reduce((s, i) => s + (i.taxAmount || 0), 0);

              return (
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "140px 120px",
                    gap: "6px 16px",
                    textAlign: "right",
                  }}
                >
                  <span
                    style={{ fontSize: 12, color: "#7A6055", fontWeight: 500 }}
                  >
                    {t("grossTotal")}
                  </span>
                  <span
                    style={{ fontSize: 13, fontWeight: 600, color: "#2C1810" }}
                  >
                    {formatCurrency(grossTotal)}
                  </span>

                  {itemDiscountTotal > 0 && (
                    <>
                      <span
                        style={{
                          fontSize: 12,
                          color: "#C0392B",
                          fontWeight: 500,
                        }}
                      >
                        {t("itemDiscounts")}
                      </span>
                      <span
                        style={{
                          fontSize: 13,
                          fontWeight: 600,
                          color: "#C0392B",
                        }}
                      >
                        -{formatCurrency(itemDiscountTotal)}
                      </span>
                    </>
                  )}

                  <span
                    style={{
                      fontSize: 12,
                      color: "#7A6055",
                      fontWeight: 500,
                      borderTop: "1px dashed #E5DDD5",
                      paddingTop: 4,
                    }}
                  >
                    {t("subtotal")}
                  </span>
                  <span
                    style={{
                      fontSize: 13,
                      fontWeight: 700,
                      color: "#2C1810",
                      borderTop: "1px dashed #E5DDD5",
                      paddingTop: 4,
                    }}
                  >
                    {formatCurrency(form.subtotal)}
                  </span>

                  {taxAmt > 0 && (
                    <>
                      <span
                        style={{
                          fontSize: 12,
                          color: "#7A6055",
                          fontWeight: 500,
                        }}
                      >
                        VAT (5%)
                      </span>
                      <span
                        style={{
                          fontSize: 13,
                          fontWeight: 600,
                          color: "#2C1810",
                        }}
                      >
                        {formatCurrency(taxAmt)}
                      </span>
                    </>
                  )}

                  {discPct > 0 && (
                    <>
                      <span
                        style={{
                          fontSize: 12,
                          color: "#C0392B",
                          fontWeight: 500,
                        }}
                      >
                        {t("extraDiscount")}

                      </span>
                      <span
                        style={{
                          fontSize: 13,
                          fontWeight: 600,
                          color: "#C0392B",
                        }}
                      >
                        -{formatCurrency(globalDiscountAmt)}
                      </span>
                    </>
                  )}

                  {totalDiscount > 0 && (
                    <>
                      <span
                        style={{
                          fontSize: 12,
                          fontWeight: 700,
                          color: "#C0392B",
                          background: "#FDEDEC",
                          padding: "2px 6px",
                          borderRadius: 4,
                        }}
                      >
                        {t("totalDiscount")}
                      </span>
                      <span
                        style={{
                          fontSize: 14,
                          fontWeight: 800,
                          color: "#C0392B",
                          background: "#FDEDEC",
                          padding: "2px 6px",
                          borderRadius: 4,
                        }}
                      >
                        {formatCurrency(totalDiscount)}
                      </span>
                    </>
                  )}

                  <span
                    style={{
                      fontSize: 14,
                      fontWeight: 800,
                      color: "#1A1210",
                      borderTop: "2px solid #E5DDD5",
                      paddingTop: 8,
                      marginTop: 4,
                    }}
                  >
                    {t("grandTotal")}
                  </span>
                  <span
                    style={{
                      fontSize: 18,
                      fontWeight: 900,
                      color: "#2C1810",
                      borderTop: "2px solid #E5DDD5",
                      paddingTop: 8,
                      marginTop: 4,
                    }}
                  >
                    {formatCurrency(form.total)}
                  </span>
                </div>
              );
            })()}
          </div>

          {/* Notes */}
          <div>
            <label
              style={{
                fontSize: 12,
                fontWeight: 600,
                color: "#5A4035",
                display: "block",
                marginBottom: 6,
                letterSpacing: "0.04em",
              }}
            >
              {t("notes")}
            </label>
            <textarea
              value={form.notes}
              onChange={(e) =>
                setForm((f) => ({ ...f, notes: e.target.value }))
              }
              rows={2}
              style={{
                width: "100%",
                border: "1.5px solid #E5DDD5",
                borderRadius: 8,
                padding: "10px 12px",
                fontSize: 13,
                color: "#1A1210",
                outline: "none",
                background: "#FAF8F6",
                resize: "vertical",
              }}
              placeholder={t("additionalNotesForTheCustomer")}
            />
          </div>

          {/* Actions */}
          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              gap: 10,
              paddingTop: 4,
              borderTop: "1px solid #F0EAE3",
            }}
          >
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              style={{
                padding: "10px 20px",
                borderRadius: 10,
                border: "1.5px solid #E5DDD5",
                background: "#fff",
                fontSize: 14,
                fontWeight: 600,
                color: "#7A6055",
                cursor: "pointer",
              }}
            >
              {t("cancel")}
            </button>
            <button
              type="submit"
              disabled={saving}
              style={{
                padding: "10px 24px",
                borderRadius: 10,
                border: "none",
                background: saving
                  ? "#E5DDD5"
                  : "linear-gradient(135deg, #2C1810, #5C3D2E)",
                fontSize: 14,
                fontWeight: 700,
                color: "#fff",
                cursor: saving ? "not-allowed" : "pointer",
                boxShadow: saving ? "none" : "0 4px 14px rgba(44,24,16,0.2)",
              }}
            >
              {saving
                ? "Saving…"
                : editingQuotation
                  ? "Update & Print Quotation"
                  : "Save & Print Quotation"}
            </button>
          </div>
        </form>
      </Modal>

      {/* View Modal */}
      <Modal
        open={viewModalOpen}
        onClose={() => setViewModalOpen(false)}
        title={`Quotation ${viewingQuotation?.quotationNumber}`}
        size="screen"
      >
        {viewingQuotation && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {/* Header info */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 12,
                background: "#F7F4F0",
                borderRadius: 10,
                padding: 16,
                border: "1px solid #E5DDD5",
              }}
            >
              <div>
                <div
                  style={{
                    fontSize: 11,
                    color: "#A89080",
                    fontWeight: 600,
                    marginBottom: 4,
                    textTransform: "uppercase",
                    letterSpacing: "0.06em",
                  }}
                >
                  {t("customer")}
                </div>
                <div
                  style={{ fontSize: 14, fontWeight: 700, color: "#1A1210" }}
                >
                  {viewingQuotation.customerName}
                </div>
                {viewingQuotation.customerMobile && (
                  <div style={{ fontSize: 12, color: "#7A6055" }}>
                    {viewingQuotation.customerMobile}
                  </div>
                )}
              </div>
              <div>
                <div
                  style={{
                    fontSize: 11,
                    color: "#A89080",
                    fontWeight: 600,
                    marginBottom: 4,
                    textTransform: "uppercase",
                    letterSpacing: "0.06em",
                  }}
                >
                  {t("dates")}
                </div>
                <div style={{ fontSize: 12, color: "#7A6055" }}>
                  {t("quoted")}
                  {formatDate(viewingQuotation.date)}
                </div>
                {viewingQuotation.deliveryDate && (
                  <div style={{ fontSize: 12, color: "#7A6055" }}>
                    {t("delivery")}
                    {formatDate(viewingQuotation.deliveryDate)}
                  </div>
                )}
              </div>
              <div>
                <div
                  style={{
                    fontSize: 11,
                    color: "#A89080",
                    fontWeight: 600,
                    marginBottom: 6,
                    textTransform: "uppercase",
                    letterSpacing: "0.06em",
                  }}
                >
                  {t("status")}
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  {statusBadge(viewingQuotation.status)}
                  {deliveryBadge(
                    viewingQuotation.deliveryStatus,
                    viewingQuotation.deliveryDate,
                  )}
                </div>
              </div>
              <div>
                <div
                  style={{
                    fontSize: 11,
                    color: "#A89080",
                    fontWeight: 600,
                    marginBottom: 4,
                    textTransform: "uppercase",
                    letterSpacing: "0.06em",
                  }}
                >
                  {t("total")}
                </div>
                <div
                  style={{ fontSize: 20, fontWeight: 800, color: "#2C1810" }}
                >
                  {formatCurrency(viewingQuotation.total)}
                </div>
              </div>
              <div>
                <div
                  style={{
                    fontSize: 11,
                    color: "#A89080",
                    fontWeight: 600,
                    marginBottom: 4,
                    textTransform: "uppercase",
                    letterSpacing: "0.06em",
                  }}
                >
                  {t("salesPerson")}
                </div>
                <div
                  style={{ fontSize: 13, fontWeight: 700, color: "#2980B9" }}
                >
                  {viewingQuotation.createdBy?.name || "—"}
                </div>
              </div>
            </div>

            {/* Items table */}
            <div
              style={{
                border: "1px solid #E5DDD5",
                borderRadius: 10,
                overflow: "hidden",
              }}
            >
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ background: "#F7F4F0" }}>
                    {["Item", "Color", "Qty", "Price", "Discount", "Subtotal", "VAT (5%)", "Total"].map(
                      (h) => (
                        <th
                          key={h}
                          style={{
                            padding: "8px 12px",
                            fontSize: 10,
                            fontWeight: 700,
                            color: "#A89080",
                            textTransform: "uppercase",
                            letterSpacing: "0.06em",
                            textAlign: h === "Item" ? "left" : "right",
                          }}
                        >
                          {h}
                        </th>
                      ),
                    )}
                  </tr>
                </thead>
                <tbody>
                  {viewingQuotation.items.map((item, i) => (
                    <tr key={i} style={{ borderTop: "1px solid #F0EAE3" }}>
                      <td style={{ padding: "10px 12px" }}>
                        <div
                          style={{
                            fontSize: 13,
                            fontWeight: 600,
                            color: "#1A1210",
                          }}
                        >
                          {item.itemName}
                        </div>
                      </td>
                      <td
                        style={{
                          padding: "10px 12px",
                          textAlign: "right",
                          fontSize: 12,
                          color: "#7A6055",
                        }}
                      >
                        {item.color || "—"}
                      </td>
                      <td
                        style={{
                          padding: "10px 12px",
                          textAlign: "right",
                          fontSize: 13,
                          fontWeight: 600,
                          color: "#1A1210",
                        }}
                      >
                        {item.quantity}
                      </td>
                      <td
                        style={{
                          padding: "10px 12px",
                          textAlign: "right",
                          fontSize: 12,
                          color: "#7A6055",
                        }}
                      >
                        {item.price.toFixed(3)}
                      </td>
                      <td
                        style={{
                          padding: "10px 12px",
                          textAlign: "right",
                          fontSize: 12,
                          color: "#7A6055",
                        }}
                      >
                        {item.discount}
                      </td>
                      <td
                        style={{
                          padding: "10px 12px",
                          textAlign: "right",
                          fontSize: 13,
                          fontWeight: 600,
                          color: "#1A1210",
                        }}
                      >
                        {formatCurrency(item.subtotal || 0)}
                      </td>
                      <td
                        style={{
                          padding: "10px 12px",
                          textAlign: "right",
                          fontSize: 12,
                          color: "#7A6055",
                        }}
                      >
                        {formatCurrency(item.taxAmount || 0)}
                      </td>
                      <td
                        style={{
                          padding: "10px 12px",
                          textAlign: "right",
                          fontSize: 13,
                          fontWeight: 700,
                          color: "#2C1810",
                        }}
                      >
                        {formatCurrency(item.total)}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr
                    style={{
                      borderTop: "2px solid #E5DDD5",
                      background: "#FBF9F7",
                    }}
                  >
                    <td
                      colSpan={7}
                      style={{
                        padding: "10px 12px",
                        textAlign: "right",
                        fontSize: 13,
                        fontWeight: 800,
                        color: "#1A1210",
                      }}
                    >
                      {t("total")}
                    </td>
                    <td
                      style={{
                        padding: "10px 12px",
                        textAlign: "right",
                        fontSize: 15,
                        fontWeight: 800,
                        color: "#2C1810",
                      }}
                    >
                      {formatCurrency(viewingQuotation.total)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {viewingQuotation.notes && (
              <div
                style={{
                  background: "#FEF5E7",
                  border: "1px solid #FAD7A0",
                  borderRadius: 8,
                  padding: "10px 14px",
                }}
              >
                <div
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    color: "#CA6F1E",
                    marginBottom: 4,
                    textTransform: "uppercase",
                  }}
                >
                  {t("notes")}
                </div>
                <div style={{ fontSize: 13, color: "#7A6055" }}>
                  {viewingQuotation.notes}
                </div>
              </div>
            )}

            {/* View Actions */}
            <div
              style={{
                display: "flex",
                gap: 10,
                borderTop: "1px solid #F0EAE3",
                paddingTop: 16,
              }}
            >
              {viewingQuotation.status === "quote" && (
                <>
                  <button
                    onClick={() => {
                      setViewModalOpen(false);
                      setStatusConfirm({
                        id: viewingQuotation._id,
                        status: "sale",
                      });
                    }}
                    style={{
                      flex: 1,
                      height: 40,
                      background: "#EAFAF1",
                      border: "1px solid #A9DFBF",
                      color: "#1E8449",
                      borderRadius: 8,
                      fontWeight: 700,
                      fontSize: 13,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 6,
                    }}
                  >
                    <Check size={16} /> {t("acceptConvert")}
                  </button>
                  <button
                    onClick={() => {
                      setViewModalOpen(false);
                      setStatusConfirm({
                        id: viewingQuotation._id,
                        status: "reject",
                      });
                    }}
                    style={{
                      flex: 1,
                      height: 40,
                      background: "#FDEDEC",
                      border: "1px solid #F5B7B1",
                      color: "#C0392B",
                      borderRadius: 8,
                      fontWeight: 700,
                      fontSize: 13,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 6,
                    }}
                  >
                    <X size={16} /> {t("rejectRemove")}
                  </button>
                </>
              )}
              <button
                onClick={() =>
                  generateQuotationPDF({
                    ...viewingQuotation,
                    createdBy: viewingQuotation.createdBy?.name,
                  })
                }
                style={{
                  height: 40,
                  width: 40,
                  background: "#F7F4F0",
                  border: "1px solid #E5DDD5",
                  color: "#2C1810",
                  borderRadius: 8,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
                title={t("downloadPdf")}
              >
                <Download size={18} />
              </button>
            </div>
          </div>
        )}
      </Modal>

      <ConfirmModal
        open={!!statusConfirm}
        onClose={() => setStatusConfirm(null)}
        onConfirm={handleStatusUpdate}
        title={
          statusConfirm?.status === "sale"
            ? "Accept Quotation"
            : "Reject Quotation"
        }
        message={
          statusConfirm?.status === "sale"
            ? "Are you sure you want to accept this quotation and convert it to a sale? This will start the production process."
            : "Are you sure you want to reject and permanently remove this quotation?"
        }
        confirmLabel={statusConfirm?.status === "sale" ? "Accept" : "Reject"}
        loading={updatingStatus}
        variant={statusConfirm?.status === "sale" ? "success" : "danger"}
      />

      <ConfirmModal
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title={t("deleteQuotation")}
        message={t("areYouSureYouWant")}
        confirmLabel={t("delete")}
        loading={deleting}
      />

      <CustomerModal
        open={customerModalOpen}
        onClose={() => setCustomerModalOpen(false)}
        onSubmit={handleCreateCustomer}
      />

      <QuotationItemModal
        open={itemModalOpen}
        onClose={() => {
          setItemModalOpen(false);
          setEditingItemIdx(null);
        }}
        onSubmit={handleItemModalSubmit}
        editItem={editingItemIdx !== null ? form.items[editingItemIdx] : null}
      />

      <SaleModal
        open={saleModalOpen}
        onClose={() => setSaleModalOpen(false)}
        onSubmit={handleSaleSubmit}
        sale={
          convertingQuotation
            ? {
              customerId: convertingQuotation.customerId,
              customerName: convertingQuotation.customerName,
              customerNumber:
                customers.find(
                  (c) =>
                    c._id === (convertingQuotation.customerId as any)?._id ||
                    convertingQuotation.customerId,
                )?.customerNumber || "",
              customerMobile: convertingQuotation.customerMobile || "",
              customerAddress: convertingQuotation.customerAddress || "",
              items: convertingQuotation.items.map((it) => ({
                itemId: it.itemId,
                itemNumber: it.itemNumber,
                itemName: it.itemName,
                quantity: it.quantity,
                price: it.price,
                discount: it.discount,
                color: it.color,
                material: it.material,
                size: it.size,
                total: it.total,
                dimensions: it.dimensions,
                bom: it.bom,
                pricing: (it as any).pricing,
              })),
              subtotal: convertingQuotation.subtotal,
              tax: convertingQuotation.tax,
              discount: convertingQuotation.discount,
              total: convertingQuotation.total,
              isConversion: true,
            }
            : null
        }
      />
    </div>
  );
}

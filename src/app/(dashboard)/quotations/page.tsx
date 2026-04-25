"use client";
import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import {
  Plus, Search, FileText, Pencil, Trash2, ChevronDown,
  CheckCircle, XCircle, Clock, Truck, Package, Calendar, Eye
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "react-hot-toast";
import { IQuotation, IQuotationForm, IQuotationItem, UnitType, QuotationStatus, DeliveryStatus } from "@/types";
import Modal from "@/components/ui/Modal";
import ConfirmModal from "@/components/ui/ConfirmModal";
import Spinner from "@/components/ui/Spinner";
import Pagination from "@/components/ui/Pagination";
import { formatCurrency, formatDate } from "@/lib/utils";

const LIMIT = 15;
const UNITS: UnitType[] = ["pcs", "meters", "sq.meters", "kg", "liters", "box", "set", "roll"];

const unitLabel: Record<UnitType, string> = {
  pcs: "Pcs", meters: "Meters", "sq.meters": "Sq.M", kg: "KG",
  liters: "Liters", box: "Box", set: "Set", roll: "Roll"
};

function statusBadge(status: QuotationStatus) {
  const map: Record<QuotationStatus, { label: string; cls: string; icon: React.ReactNode }> = {
    quote: { label: "Quote", cls: "badge-quote", icon: <FileText size={11} /> },
    sale: { label: "Sale", cls: "badge-sale", icon: <CheckCircle size={11} /> },
    reject: { label: "Rejected", cls: "badge-reject", icon: <XCircle size={11} /> },
  };
  const { label, cls, icon } = map[status] || map.quote;
  return (
    <span className={cls} style={{
      display: "inline-flex", alignItems: "center", gap: 4,
      padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 700
    }}>
      {icon}{label}
    </span>
  );
}

function deliveryBadge(deliveryStatus: DeliveryStatus, deliveryDate?: string) {
  const isOverdue = deliveryDate && new Date(deliveryDate) < new Date() && deliveryStatus !== "delivered";
  const map: Record<DeliveryStatus, { label: string; bg: string; color: string; border: string }> = {
    pending: { label: "Pending", bg: "#FEF5E7", color: "#CA6F1E", border: "#FAD7A0" },
    delivered: { label: "Delivered", bg: "#EAFAF1", color: "#1E8449", border: "#A9DFBF" },
    partial: { label: "Partial", bg: "#EBF5FB", color: "#2980B9", border: "#AED6F1" },
  };
  const s = map[deliveryStatus] || map.pending;
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 4,
      padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 700,
      background: isOverdue ? "#FDEDEC" : s.bg,
      color: isOverdue ? "#C0392B" : s.color,
      border: `1px solid ${isOverdue ? "#F5B7B1" : s.border}`
    }}>
      <Truck size={11} />
      {isOverdue ? "Overdue" : s.label}
    </span>
  );
}

const emptyItem = (): IQuotationItem => ({
  itemName: "", description: "", unit: "pcs", quantity: 1, price: 0, discount: 0, total: 0
});

const emptyForm = (): IQuotationForm => ({
  customerName: "", customerMobile: "", items: [emptyItem()],
  subtotal: 0, tax: 0, discount: 0, total: 0,
  status: "quote", deliveryStatus: "pending",
  deliveryDate: "", notes: "", validUntil: "",
  date: new Date().toISOString().split("T")[0] ?? "",
});

function calcTotals(items: IQuotationItem[], taxPct: number, discPct: number) {
  const subtotal = items.reduce((s, i) => {
    const after = i.price * i.quantity * (1 - (i.discount || 0) / 100);
    return s + after;
  }, 0);
  const taxAmt = subtotal * (taxPct / 100);
  const discAmt = subtotal * (discPct / 100);
  return { subtotal, total: subtotal + taxAmt - discAmt };
}

export default function QuotationsPage() {
  const { data: session } = useSession();
  const isAdmin = session?.user?.role === "admin";
  const perms = (session?.user?.permissions as any)?.quotations;
  const canCreate = isAdmin || perms?.create;
  const canEdit = isAdmin || perms?.edit;
  const canDelete = isAdmin || perms?.delete;

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
  const [editingQuotation, setEditingQuotation] = useState<IQuotation | null>(null);
  const [viewingQuotation, setViewingQuotation] = useState<IQuotation | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState<IQuotationForm>(emptyForm());
  const [taxPct, setTaxPct] = useState(0);
  const [discPct, setDiscPct] = useState(0);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page), limit: String(LIMIT), search,
        ...(statusFilter && { status: statusFilter }),
        ...(deliveryFilter && { deliveryStatus: deliveryFilter }),
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
  }, [page, search, statusFilter, deliveryFilter]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { setPage(1); }, [search, statusFilter, deliveryFilter]);

  const recalc = (items: IQuotationItem[], tp: number, dp: number) => {
    const { subtotal, total } = calcTotals(items, tp, dp);
    setForm(f => ({ ...f, items, subtotal, total, tax: tp, discount: dp }));
  };

  const updateItem = (idx: number, key: keyof IQuotationItem, val: string | number) => {
    const items = form.items.map((it, i) => {
      if (i !== idx) return it;
      const updated = { ...it, [key]: val };
      updated.total = updated.price * updated.quantity * (1 - (updated.discount || 0) / 100);
      return updated;
    });
    recalc(items, taxPct, discPct);
  };

  const addItem = () => recalc([...form.items, emptyItem()], taxPct, discPct);
  const removeItem = (idx: number) => recalc(form.items.filter((_, i) => i !== idx), taxPct, discPct);

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
    setForm({
      customerName: q.customerName, customerMobile: q.customerMobile || "",
      items: q.items, subtotal: q.subtotal, tax: q.tax, discount: q.discount,
      total: q.total, status: q.status, deliveryStatus: q.deliveryStatus,
      deliveryDate: q.deliveryDate ? q.deliveryDate.split("T")[0] : "",
      notes: q.notes || "", validUntil: q.validUntil ? q.validUntil.split("T")[0] : "",
      date: q.date ? (new Date(q.date).toISOString().split("T")[0] ?? "") : (new Date().toISOString().split("T")[0] ?? ""),
    });
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.customerName.trim()) return toast.error("Customer name is required");
    if (form.items.length === 0) return toast.error("Add at least one item");
    if (form.items.some(i => !i.itemName.trim())) return toast.error("All items must have a name");

    setSaving(true);
    try {
      const url = editingQuotation ? `/api/quotations/${editingQuotation._id}` : "/api/quotations";
      const method = editingQuotation ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, tax: taxPct, discount: discPct }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(editingQuotation ? "Quotation updated" : "Quotation created");
        setModalOpen(false);
        load();
      } else {
        toast.error(data.error || "Failed to save");
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/quotations/${deleteId}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) { toast.success("Deleted"); setDeleteId(null); load(); }
      else toast.error(data.error || "Failed");
    } finally {
      setDeleting(false);
    }
  };

  const statusCounts = {
    all: total,
    quote: quotations.filter(q => q.status === "quote").length,
    sale: quotations.filter(q => q.status === "sale").length,
    reject: quotations.filter(q => q.status === "reject").length,
  };

  return (
    <div className="page-container">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}
      >
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: "#1A1210", margin: 0 }}>Quotations</h1>
          <p style={{ fontSize: 13, color: "#7A6055", margin: "4px 0 0" }}>
            Manage furniture quotations, sales, and delivery tracking
          </p>
        </div>
        {canCreate && (
          <motion.button
            whileHover={{ scale: 1.02, y: -1 }}
            whileTap={{ scale: 0.98 }}
            onClick={openCreate}
            style={{
              display: "flex", alignItems: "center", gap: 8,
              padding: "10px 20px", borderRadius: 10, border: "none",
              background: "linear-gradient(135deg, #2C1810, #5C3D2E)",
              color: "#fff", fontSize: 14, fontWeight: 600, cursor: "pointer",
              boxShadow: "0 4px 16px rgba(44,24,16,0.2)"
            }}
          >
            <Plus size={17} /> New Quotation
          </motion.button>
        )}
      </motion.div>

      {/* Stats row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(160px,1fr))", gap: 12 }}>
        {[
          { label: "Total", value: total, color: "#2C1810", bg: "#F7F4F0", border: "#E5DDD5" },
          { label: "Active Quotes", value: quotations.filter(q => q.status === "quote").length, color: "#2980B9", bg: "#EBF5FB", border: "#AED6F1" },
          { label: "Converted Sales", value: quotations.filter(q => q.status === "sale").length, color: "#1E8449", bg: "#EAFAF1", border: "#A9DFBF" },
          { label: "Rejected", value: quotations.filter(q => q.status === "reject").length, color: "#C0392B", bg: "#FDEDEC", border: "#F5B7B1" },
        ].map(({ label, value, color, bg, border }) => (
          <motion.div
            key={label}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            style={{
              background: bg, border: `1px solid ${border}`, borderRadius: 12,
              padding: "16px 20px"
            }}
          >
            <p style={{ fontSize: 12, color: "#7A6055", margin: 0, fontWeight: 500 }}>{label}</p>
            <p style={{ fontSize: 24, fontWeight: 800, color, margin: "4px 0 0" }}>{value}</p>
          </motion.div>
        ))}
      </div>

      {/* Filters */}
      <div className="filter-bar">
        <div style={{
          display: "flex", alignItems: "center", gap: 8,
          background: "#fff", border: "1.5px solid #E5DDD5", borderRadius: 10,
          padding: "0 14px", height: 40, flex: "1 1 240px", maxWidth: 320
        }}>
          <Search size={15} color="#A89080" />
          <input
            placeholder="Search by customer or number…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ border: "none", outline: "none", fontSize: 13, color: "#1A1210", background: "transparent", flex: 1 }}
          />
        </div>

        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          style={{
            border: "1.5px solid #E5DDD5", borderRadius: 10, padding: "0 12px",
            height: 40, fontSize: 13, color: "#1A1210", background: "#fff",
            cursor: "pointer", outline: "none"
          }}
        >
          <option value="">All Statuses</option>
          <option value="quote">Quote</option>
          <option value="sale">Sale</option>
          <option value="reject">Rejected</option>
        </select>

        <select
          value={deliveryFilter}
          onChange={e => setDeliveryFilter(e.target.value)}
          style={{
            border: "1.5px solid #E5DDD5", borderRadius: 10, padding: "0 12px",
            height: 40, fontSize: 13, color: "#1A1210", background: "#fff",
            cursor: "pointer", outline: "none"
          }}
        >
          <option value="">All Deliveries</option>
          <option value="pending">Pending</option>
          <option value="delivered">Delivered</option>
          <option value="partial">Partial</option>
        </select>
      </div>

      {/* Table */}
      <div className="table-wrapper">
        <table className="w-full">
          <thead>
            <tr>
              <th className="th">Quote #</th>
              <th className="th">Customer</th>
              <th className="th">Date</th>
              <th className="th">Items</th>
              <th className="th text-right">Total</th>
              <th className="th text-center">Status</th>
              <th className="th text-center">Delivery</th>
              <th className="th text-center">Delivery Date</th>
              <th className="th text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y" style={{ borderColor: "#F0EAE3" }}>
            {loading ? (
              <tr><td colSpan={9} style={{ textAlign: "center", padding: "48px 0" }}><Spinner /></td></tr>
            ) : quotations.length === 0 ? (
              <tr>
                <td colSpan={9} style={{ textAlign: "center", padding: "64px 0" }}>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
                    <FileText size={36} color="#E5DDD5" />
                    <p style={{ color: "#A89080", fontSize: 14, margin: 0 }}>No quotations found</p>
                    {canCreate && (
                      <button onClick={openCreate} style={{
                        marginTop: 4, padding: "8px 18px", borderRadius: 8,
                        background: "#2C1810", border: "none", color: "#fff",
                        fontSize: 13, fontWeight: 600, cursor: "pointer"
                      }}>Create First Quotation</button>
                    )}
                  </div>
                </td>
              </tr>
            ) : (
              quotations.map((q, idx) => (
                <motion.tr
                  key={q._id}
                  className="tr-hover"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.03 }}
                >
                  <td className="td">
                    <span style={{ fontFamily: "monospace", fontSize: 12, color: "#7A6055", fontWeight: 600 }}>
                      {q.quotationNumber}
                    </span>
                  </td>
                  <td className="td">
                    <div style={{ fontWeight: 600, color: "#1A1210", fontSize: 13 }}>{q.customerName}</div>
                    {q.customerMobile && (
                      <div style={{ fontSize: 11, color: "#A89080" }}>{q.customerMobile}</div>
                    )}
                  </td>
                  <td className="td" style={{ fontSize: 12, color: "#7A6055" }}>
                    {formatDate(q.date)}
                  </td>
                  <td className="td">
                    <span style={{
                      display: "inline-flex", alignItems: "center", gap: 4,
                      background: "#F7F4F0", border: "1px solid #E5DDD5",
                      borderRadius: 20, padding: "2px 10px", fontSize: 11, fontWeight: 600, color: "#5C3D2E"
                    }}>
                      <Package size={10} /> {q.items.length} items
                    </span>
                  </td>
                  <td className="td text-right">
                    <span style={{ fontWeight: 700, color: "#2C1810", fontSize: 14 }}>
                      {formatCurrency(q.total)}
                    </span>
                  </td>
                  <td className="td text-center">{statusBadge(q.status)}</td>
                  <td className="td text-center">{deliveryBadge(q.deliveryStatus, q.deliveryDate)}</td>
                  <td className="td text-center" style={{ fontSize: 12, color: "#7A6055" }}>
                    {q.deliveryDate ? (
                      <span style={{ display: "flex", alignItems: "center", gap: 4, justifyContent: "center" }}>
                        <Calendar size={11} />
                        {formatDate(q.deliveryDate)}
                      </span>
                    ) : "—"}
                  </td>
                  <td className="td text-right">
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 4 }}>
                      <button
                        onClick={() => { setViewingQuotation(q); setViewModalOpen(true); }}
                        style={{
                          padding: "6px", borderRadius: 8, border: "1px solid #E5DDD5",
                          background: "#fff", cursor: "pointer", color: "#7A6055",
                          display: "flex", alignItems: "center", transition: "all 0.15s"
                        }}
                        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "#F7F4F0"; (e.currentTarget as HTMLElement).style.color = "#2C1810"; }}
                        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "#fff"; (e.currentTarget as HTMLElement).style.color = "#7A6055"; }}
                      >
                        <Eye size={14} />
                      </button>
                      {canEdit && (
                        <button
                          onClick={() => openEdit(q)}
                          style={{
                            padding: "6px", borderRadius: 8, border: "1px solid #E5DDD5",
                            background: "#fff", cursor: "pointer", color: "#7A6055",
                            display: "flex", alignItems: "center", transition: "all 0.15s"
                          }}
                          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "#EBF5FB"; (e.currentTarget as HTMLElement).style.color = "#2980B9"; (e.currentTarget as HTMLElement).style.borderColor = "#AED6F1"; }}
                          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "#fff"; (e.currentTarget as HTMLElement).style.color = "#7A6055"; (e.currentTarget as HTMLElement).style.borderColor = "#E5DDD5"; }}
                        >
                          <Pencil size={14} />
                        </button>
                      )}
                      {canDelete && (
                        <button
                          onClick={() => setDeleteId(q._id)}
                          style={{
                            padding: "6px", borderRadius: 8, border: "1px solid #E5DDD5",
                            background: "#fff", cursor: "pointer", color: "#7A6055",
                            display: "flex", alignItems: "center", transition: "all 0.15s"
                          }}
                          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "#FDEDEC"; (e.currentTarget as HTMLElement).style.color = "#C0392B"; (e.currentTarget as HTMLElement).style.borderColor = "#F5B7B1"; }}
                          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "#fff"; (e.currentTarget as HTMLElement).style.color = "#7A6055"; (e.currentTarget as HTMLElement).style.borderColor = "#E5DDD5"; }}
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  </td>
                </motion.tr>
              ))
            )}
          </tbody>
        </table>
        <div style={{ borderTop: "1px solid #F0EAE3", padding: "0 8px" }}>
          <Pagination page={page} totalPages={totalPages} total={total} limit={LIMIT} onPageChange={setPage} />
        </div>
      </div>

      {/* Create / Edit Modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingQuotation ? "Edit Quotation" : "New Quotation"}
        size="xl"
      >
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {/* Customer */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: "#5A4035", display: "block", marginBottom: 6, letterSpacing: "0.04em" }}>
                CUSTOMER NAME *
              </label>
              <input
                value={form.customerName}
                onChange={e => setForm(f => ({ ...f, customerName: e.target.value }))}
                required
                style={{
                  width: "100%", height: 40, border: "1.5px solid #E5DDD5", borderRadius: 8,
                  padding: "0 12px", fontSize: 13, color: "#1A1210", outline: "none",
                  background: "#FAF8F6"
                }}
                placeholder="Customer name"
              />
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: "#5A4035", display: "block", marginBottom: 6, letterSpacing: "0.04em" }}>
                MOBILE
              </label>
              <input
                value={form.customerMobile}
                onChange={e => setForm(f => ({ ...f, customerMobile: e.target.value }))}
                style={{
                  width: "100%", height: 40, border: "1.5px solid #E5DDD5", borderRadius: 8,
                  padding: "0 12px", fontSize: 13, color: "#1A1210", outline: "none",
                  background: "#FAF8F6"
                }}
                placeholder="Mobile number"
              />
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: "#5A4035", display: "block", marginBottom: 6, letterSpacing: "0.04em" }}>
                DATE
              </label>
              <input
                type="date"
                value={form.date}
                onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
                style={{
                  width: "100%", height: 40, border: "1.5px solid #E5DDD5", borderRadius: 8,
                  padding: "0 12px", fontSize: 13, color: "#1A1210", outline: "none",
                  background: "#FAF8F6"
                }}
              />
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: "#5A4035", display: "block", marginBottom: 6, letterSpacing: "0.04em" }}>
                VALID UNTIL
              </label>
              <input
                type="date"
                value={form.validUntil}
                onChange={e => setForm(f => ({ ...f, validUntil: e.target.value }))}
                style={{
                  width: "100%", height: 40, border: "1.5px solid #E5DDD5", borderRadius: 8,
                  padding: "0 12px", fontSize: 13, color: "#1A1210", outline: "none",
                  background: "#FAF8F6"
                }}
              />
            </div>
          </div>

          {/* Status and Delivery */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14 }}>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: "#5A4035", display: "block", marginBottom: 6, letterSpacing: "0.04em" }}>
                STATUS
              </label>
              <select
                value={form.status}
                onChange={e => setForm(f => ({ ...f, status: e.target.value as QuotationStatus }))}
                style={{
                  width: "100%", height: 40, border: "1.5px solid #E5DDD5", borderRadius: 8,
                  padding: "0 12px", fontSize: 13, color: "#1A1210", outline: "none",
                  background: "#FAF8F6", cursor: "pointer"
                }}
              >
                <option value="quote">Quote</option>
                <option value="sale">Sale</option>
                <option value="reject">Rejected</option>
              </select>
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: "#5A4035", display: "block", marginBottom: 6, letterSpacing: "0.04em" }}>
                DELIVERY STATUS
              </label>
              <select
                value={form.deliveryStatus}
                onChange={e => setForm(f => ({ ...f, deliveryStatus: e.target.value as DeliveryStatus }))}
                style={{
                  width: "100%", height: 40, border: "1.5px solid #E5DDD5", borderRadius: 8,
                  padding: "0 12px", fontSize: 13, color: "#1A1210", outline: "none",
                  background: "#FAF8F6", cursor: "pointer"
                }}
              >
                <option value="pending">Pending</option>
                <option value="partial">Partial</option>
                <option value="delivered">Delivered</option>
              </select>
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: "#5A4035", display: "block", marginBottom: 6, letterSpacing: "0.04em" }}>
                DELIVERY DATE
              </label>
              <input
                type="date"
                value={form.deliveryDate}
                onChange={e => setForm(f => ({ ...f, deliveryDate: e.target.value }))}
                style={{
                  width: "100%", height: 40, border: "1.5px solid #E5DDD5", borderRadius: 8,
                  padding: "0 12px", fontSize: 13, color: "#1A1210", outline: "none",
                  background: "#FAF8F6"
                }}
              />
            </div>
          </div>

          {/* Items */}
          <div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
              <label style={{ fontSize: 12, fontWeight: 700, color: "#5A4035", letterSpacing: "0.04em" }}>
                FURNITURE ITEMS
              </label>
              <button
                type="button"
                onClick={addItem}
                style={{
                  display: "flex", alignItems: "center", gap: 6, padding: "5px 12px",
                  borderRadius: 8, border: "1.5px solid #E5DDD5", background: "#fff",
                  fontSize: 12, fontWeight: 600, color: "#2C1810", cursor: "pointer"
                }}
              >
                <Plus size={13} /> Add Item
              </button>
            </div>

            {/* Item headers */}
            <div style={{
              display: "grid",
              gridTemplateColumns: "2fr 80px 80px 80px 80px 80px 30px",
              gap: 8, marginBottom: 6, padding: "0 4px"
            }}>
              {["Item / Description", "Unit", "Qty", "Price", "Disc%", "Total", ""].map(h => (
                <div key={h} style={{ fontSize: 10, fontWeight: 700, color: "#A89080", textTransform: "uppercase", letterSpacing: "0.06em" }}>{h}</div>
              ))}
            </div>

            {form.items.map((item, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                style={{
                  display: "grid",
                  gridTemplateColumns: "2fr 80px 80px 80px 80px 80px 30px",
                  gap: 8, marginBottom: 8, alignItems: "start"
                }}
              >
                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  <input
                    value={item.itemName}
                    onChange={e => updateItem(idx, "itemName", e.target.value)}
                    placeholder="Item name *"
                    style={{
                      width: "100%", height: 36, border: "1.5px solid #E5DDD5", borderRadius: 7,
                      padding: "0 10px", fontSize: 13, color: "#1A1210", outline: "none",
                      background: "#FAF8F6"
                    }}
                  />
                  <input
                    value={item.description || ""}
                    onChange={e => updateItem(idx, "description", e.target.value)}
                    placeholder="Description (optional)"
                    style={{
                      width: "100%", height: 30, border: "1.5px solid #E5DDD5", borderRadius: 7,
                      padding: "0 10px", fontSize: 11, color: "#7A6055", outline: "none",
                      background: "#FAF8F6"
                    }}
                  />
                </div>
                <select
                  value={item.unit}
                  onChange={e => updateItem(idx, "unit", e.target.value)}
                  style={{
                    height: 36, border: "1.5px solid #E5DDD5", borderRadius: 7,
                    padding: "0 6px", fontSize: 12, color: "#1A1210", outline: "none",
                    background: "#FAF8F6", cursor: "pointer"
                  }}
                >
                  {UNITS.map(u => <option key={u} value={u}>{unitLabel[u]}</option>)}
                </select>
                {(["quantity", "price", "discount"] as const).map(field => (
                  <input
                    key={field}
                    type="number"
                    value={item[field]}
                    onChange={e => updateItem(idx, field, parseFloat(e.target.value) || 0)}
                    min={0}
                    step={field === "quantity" ? "0.01" : "0.001"}
                    style={{
                      height: 36, border: "1.5px solid #E5DDD5", borderRadius: 7,
                      padding: "0 8px", fontSize: 12, color: "#1A1210", outline: "none",
                      background: "#FAF8F6", width: "100%"
                    }}
                  />
                ))}
                <div style={{
                  height: 36, display: "flex", alignItems: "center",
                  fontSize: 12, fontWeight: 700, color: "#2C1810", paddingLeft: 4
                }}>
                  {item.total.toFixed(3)}
                </div>
                <button
                  type="button"
                  onClick={() => removeItem(idx)}
                  disabled={form.items.length === 1}
                  style={{
                    height: 36, width: 30, display: "flex", alignItems: "center", justifyContent: "center",
                    border: "1.5px solid #F5B7B1", borderRadius: 7, background: "#FDEDEC",
                    color: "#C0392B", cursor: "pointer", opacity: form.items.length === 1 ? 0.3 : 1
                  }}
                >
                  <Trash2 size={13} />
                </button>
              </motion.div>
            ))}
          </div>

          {/* Totals */}
          <div style={{
            background: "#F7F4F0", border: "1px solid #E5DDD5", borderRadius: 12,
            padding: "16px 20px", display: "flex", flexDirection: "column", gap: 10, alignItems: "flex-end"
          }}>
            <div style={{ display: "flex", gap: 16, alignItems: "center", flexWrap: "wrap", justifyContent: "flex-end" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: "#7A6055" }}>Tax %</label>
                <input
                  type="number"
                  value={taxPct}
                  onChange={e => { const v = parseFloat(e.target.value) || 0; setTaxPct(v); recalc(form.items, v, discPct); }}
                  min={0} max={100}
                  style={{ width: 60, height: 32, border: "1.5px solid #E5DDD5", borderRadius: 7, padding: "0 8px", fontSize: 12, outline: "none", background: "#fff" }}
                />
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: "#7A6055" }}>Disc %</label>
                <input
                  type="number"
                  value={discPct}
                  onChange={e => { const v = parseFloat(e.target.value) || 0; setDiscPct(v); recalc(form.items, taxPct, v); }}
                  min={0} max={100}
                  style={{ width: 60, height: 32, border: "1.5px solid #E5DDD5", borderRadius: 7, padding: "0 8px", fontSize: 12, outline: "none", background: "#fff" }}
                />
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "120px 120px", gap: "6px 16px", textAlign: "right" }}>
              <span style={{ fontSize: 12, color: "#7A6055", fontWeight: 500 }}>Subtotal</span>
              <span style={{ fontSize: 13, fontWeight: 600, color: "#2C1810" }}>{form.subtotal.toFixed(3)}</span>
              {taxPct > 0 && <>
                <span style={{ fontSize: 12, color: "#7A6055", fontWeight: 500 }}>Tax ({taxPct}%)</span>
                <span style={{ fontSize: 13, fontWeight: 600, color: "#2C1810" }}>{(form.subtotal * taxPct / 100).toFixed(3)}</span>
              </>}
              {discPct > 0 && <>
                <span style={{ fontSize: 12, color: "#C0392B", fontWeight: 500 }}>Discount ({discPct}%)</span>
                <span style={{ fontSize: 13, fontWeight: 600, color: "#C0392B" }}>-{(form.subtotal * discPct / 100).toFixed(3)}</span>
              </>}
              <span style={{ fontSize: 14, fontWeight: 800, color: "#1A1210", borderTop: "1px solid #E5DDD5", paddingTop: 6 }}>TOTAL</span>
              <span style={{ fontSize: 16, fontWeight: 800, color: "#2C1810", borderTop: "1px solid #E5DDD5", paddingTop: 6 }}>{form.total.toFixed(3)}</span>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: "#5A4035", display: "block", marginBottom: 6, letterSpacing: "0.04em" }}>
              NOTES
            </label>
            <textarea
              value={form.notes}
              onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
              rows={2}
              style={{
                width: "100%", border: "1.5px solid #E5DDD5", borderRadius: 8,
                padding: "10px 12px", fontSize: 13, color: "#1A1210", outline: "none",
                background: "#FAF8F6", resize: "vertical"
              }}
              placeholder="Additional notes for the customer…"
            />
          </div>

          {/* Actions */}
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, paddingTop: 4, borderTop: "1px solid #F0EAE3" }}>
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              style={{
                padding: "10px 20px", borderRadius: 10, border: "1.5px solid #E5DDD5",
                background: "#fff", fontSize: 14, fontWeight: 600, color: "#7A6055", cursor: "pointer"
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              style={{
                padding: "10px 24px", borderRadius: 10, border: "none",
                background: saving ? "#E5DDD5" : "linear-gradient(135deg, #2C1810, #5C3D2E)",
                fontSize: 14, fontWeight: 700, color: "#fff", cursor: saving ? "not-allowed" : "pointer",
                boxShadow: saving ? "none" : "0 4px 14px rgba(44,24,16,0.2)"
              }}
            >
              {saving ? "Saving…" : (editingQuotation ? "Update Quotation" : "Create Quotation")}
            </button>
          </div>
        </form>
      </Modal>

      {/* View Modal */}
      <Modal
        open={viewModalOpen}
        onClose={() => setViewModalOpen(false)}
        title={`Quotation ${viewingQuotation?.quotationNumber}`}
        size="xl"
      >
        {viewingQuotation && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {/* Header info */}
            <div style={{
              display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12,
              background: "#F7F4F0", borderRadius: 10, padding: 16, border: "1px solid #E5DDD5"
            }}>
              <div>
                <div style={{ fontSize: 11, color: "#A89080", fontWeight: 600, marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.06em" }}>Customer</div>
                <div style={{ fontSize: 14, fontWeight: 700, color: "#1A1210" }}>{viewingQuotation.customerName}</div>
                {viewingQuotation.customerMobile && <div style={{ fontSize: 12, color: "#7A6055" }}>{viewingQuotation.customerMobile}</div>}
              </div>
              <div>
                <div style={{ fontSize: 11, color: "#A89080", fontWeight: 600, marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.06em" }}>Dates</div>
                <div style={{ fontSize: 12, color: "#7A6055" }}>Quoted: {formatDate(viewingQuotation.date)}</div>
                {viewingQuotation.deliveryDate && <div style={{ fontSize: 12, color: "#7A6055" }}>Delivery: {formatDate(viewingQuotation.deliveryDate)}</div>}
              </div>
              <div>
                <div style={{ fontSize: 11, color: "#A89080", fontWeight: 600, marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.06em" }}>Status</div>
                <div style={{ display: "flex", gap: 8 }}>
                  {statusBadge(viewingQuotation.status)}
                  {deliveryBadge(viewingQuotation.deliveryStatus, viewingQuotation.deliveryDate)}
                </div>
              </div>
              <div>
                <div style={{ fontSize: 11, color: "#A89080", fontWeight: 600, marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.06em" }}>Total</div>
                <div style={{ fontSize: 20, fontWeight: 800, color: "#2C1810" }}>{formatCurrency(viewingQuotation.total)}</div>
              </div>
            </div>

            {/* Items table */}
            <div style={{ border: "1px solid #E5DDD5", borderRadius: 10, overflow: "hidden" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ background: "#F7F4F0" }}>
                    {["Item", "Unit", "Qty", "Price", "Disc%", "Total"].map(h => (
                      <th key={h} style={{ padding: "8px 12px", fontSize: 10, fontWeight: 700, color: "#A89080", textTransform: "uppercase", letterSpacing: "0.06em", textAlign: h === "Item" ? "left" : "right" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {viewingQuotation.items.map((item, i) => (
                    <tr key={i} style={{ borderTop: "1px solid #F0EAE3" }}>
                      <td style={{ padding: "10px 12px" }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: "#1A1210" }}>{item.itemName}</div>
                        {item.description && <div style={{ fontSize: 11, color: "#A89080" }}>{item.description}</div>}
                      </td>
                      <td style={{ padding: "10px 12px", textAlign: "right", fontSize: 12, color: "#7A6055" }}>{item.unit}</td>
                      <td style={{ padding: "10px 12px", textAlign: "right", fontSize: 13, fontWeight: 600, color: "#1A1210" }}>{item.quantity}</td>
                      <td style={{ padding: "10px 12px", textAlign: "right", fontSize: 12, color: "#7A6055" }}>{item.price.toFixed(3)}</td>
                      <td style={{ padding: "10px 12px", textAlign: "right", fontSize: 12, color: "#7A6055" }}>{item.discount}%</td>
                      <td style={{ padding: "10px 12px", textAlign: "right", fontSize: 13, fontWeight: 700, color: "#2C1810" }}>{formatCurrency(item.total)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr style={{ borderTop: "2px solid #E5DDD5", background: "#FBF9F7" }}>
                    <td colSpan={5} style={{ padding: "10px 12px", textAlign: "right", fontSize: 13, fontWeight: 800, color: "#1A1210" }}>TOTAL</td>
                    <td style={{ padding: "10px 12px", textAlign: "right", fontSize: 15, fontWeight: 800, color: "#2C1810" }}>{formatCurrency(viewingQuotation.total)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {viewingQuotation.notes && (
              <div style={{ background: "#FEF5E7", border: "1px solid #FAD7A0", borderRadius: 8, padding: "10px 14px" }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#CA6F1E", marginBottom: 4, textTransform: "uppercase" }}>Notes</div>
                <div style={{ fontSize: 13, color: "#7A6055" }}>{viewingQuotation.notes}</div>
              </div>
            )}
          </div>
        )}
      </Modal>

      <ConfirmModal
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Delete Quotation"
        message="Are you sure you want to delete this quotation? This action cannot be undone."
        confirmLabel="Delete"
        loading={deleting}
      />
    </div>
  );
}

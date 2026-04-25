"use client";
import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Plus, Search, Trash2, Pencil, Receipt, TrendingDown } from "lucide-react";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Badge from "@/components/ui/Badge";
import Pagination from "@/components/ui/Pagination";
import ConfirmModal from "@/components/ui/ConfirmModal";
import Spinner from "@/components/ui/Spinner";
import { useExpenses } from "@/hooks/useExpenses";
import { IExpense } from "@/types";
import { formatCurrency, formatDate } from "@/lib/utils";
import { useSession } from "next-auth/react";
import { motion } from "framer-motion";

const LIMIT = 10;

const CATEGORIES = [
  "Workshop & Labour",
  "Raw Materials",
  "Delivery & Transport",
  "Tools & Equipment",
  "Showroom Rent",
  "Workshop Rent",
  "Salaries & Wages",
  "Utilities",
  "Marketing & Advertising",
  "Office & Admin",
  "Repairs & Maintenance",
  "Others",
];

const categoryColors: Record<string, { bg: string; color: string; border: string }> = {
  "Workshop & Labour":    { bg: "#FEF5E7", color: "#CA6F1E", border: "#FAD7A0" },
  "Raw Materials":        { bg: "#EBF5FB", color: "#2980B9", border: "#AED6F1" },
  "Delivery & Transport": { bg: "#E8F8F5", color: "#117A65", border: "#A2D9CE" },
  "Tools & Equipment":    { bg: "#F4ECF7", color: "#6C3483", border: "#D7BDE2" },
  "Showroom Rent":        { bg: "#FDEDEC", color: "#C0392B", border: "#F5B7B1" },
  "Workshop Rent":        { bg: "#FDEDEC", color: "#C0392B", border: "#F5B7B1" },
  "Salaries & Wages":     { bg: "#EAFAF1", color: "#1E8449", border: "#A9DFBF" },
  "Utilities":            { bg: "#EBF5FB", color: "#1A5276", border: "#AED6F1" },
  "Marketing & Advertising":{ bg: "#FEF9E7", color: "#B7950B", border: "#F9E79F" },
  "Office & Admin":       { bg: "#F7F4F0", color: "#8B5E3C", border: "#E5DDD5" },
  "Repairs & Maintenance":{ bg: "#F0F3FF", color: "#2471A3", border: "#AED6F1" },
  "Others":               { bg: "#F7F4F0", color: "#7A6055", border: "#E5DDD5" },
};

export default function ExpensesPage() {
  const { expenses, total, totalPages, totalAmount, loading, fetchExpenses, deleteExpense } = useExpenses();

  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [category, setCategory] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const { data: session } = useSession();
  const isAdmin = session?.user?.role === "admin";
  const perms = (session?.user?.permissions as any)?.expenses;
  const canCreate = isAdmin || perms?.create;
  const canEdit   = isAdmin || perms?.edit;
  const canDelete = isAdmin || perms?.delete;

  const load = useCallback(() => {
    fetchExpenses({ search, page, limit: LIMIT, category, startDate, endDate });
  }, [search, page, category, startDate, endDate, fetchExpenses]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { setPage(1); }, [search, category, startDate, endDate]);

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    const ok = await deleteExpense(deleteId);
    setDeleting(false);
    if (ok) { setDeleteId(null); load(); }
  };

  return (
    <div className="page-container">

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}
      >
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: "#1A1210", margin: 0 }}>Expenses</h1>
          <p style={{ fontSize: 13, color: "#7A6055", margin: "4px 0 0" }}>
            {total} records — Total: {formatCurrency(totalAmount)}
          </p>
        </div>
        {canCreate && (
          <Link href="/expenses/new">
            <motion.button
              whileHover={{ scale: 1.02, y: -1 }} whileTap={{ scale: 0.98 }}
              style={{
                display: "flex", alignItems: "center", gap: 7,
                padding: "10px 20px", borderRadius: 10, border: "none",
                background: "linear-gradient(135deg, #C0392B, #E74C3C)",
                color: "#fff", fontSize: 14, fontWeight: 600, cursor: "pointer",
                boxShadow: "0 4px 14px rgba(192,57,43,0.25)"
              }}
            >
              <Plus size={16} /> Record Expense
            </motion.button>
          </Link>
        )}
      </motion.div>

      {/* Summary cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 12 }}>
        <div style={{
          background: "#FDEDEC", border: "1px solid #F5B7B1", borderRadius: 12, padding: "16px 20px",
          display: "flex", alignItems: "center", gap: 14
        }}>
          <div style={{
            width: 40, height: 40, borderRadius: 10, background: "#C0392B",
            display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0
          }}>
            <TrendingDown size={20} color="#fff" />
          </div>
          <div>
            <p style={{ fontSize: 11, color: "#C0392B", margin: 0, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em" }}>Total Expenses</p>
            <p style={{ fontSize: 20, fontWeight: 800, color: "#C0392B", margin: "3px 0 0" }}>{formatCurrency(totalAmount)}</p>
          </div>
        </div>
        <div style={{
          background: "#fff", border: "1px solid #E5DDD5", borderRadius: 12, padding: "16px 20px"
        }}>
          <p style={{ fontSize: 11, color: "#A89080", margin: 0, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em" }}>Records</p>
          <p style={{ fontSize: 20, fontWeight: 800, color: "#1A1210", margin: "3px 0 0" }}>{total}</p>
        </div>
      </div>

      {/* Filters */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
        <div style={{
          display: "flex", alignItems: "center", gap: 8,
          background: "#fff", border: "1.5px solid #E5DDD5", borderRadius: 10,
          padding: "0 14px", height: 40, flex: "1 1 220px", maxWidth: 300
        }}>
          <Search size={15} color="#A89080" />
          <input
            placeholder="Search title, category, ref…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ border: "none", outline: "none", fontSize: 13, color: "#1A1210", background: "transparent", flex: 1 }}
          />
        </div>
        <select
          value={category}
          onChange={e => setCategory(e.target.value)}
          style={{
            border: "1.5px solid #E5DDD5", borderRadius: 10, padding: "0 12px",
            height: 40, fontSize: 13, color: "#1A1210", background: "#fff", cursor: "pointer", outline: "none"
          }}
        >
          <option value="">All Categories</option>
          {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)}
          style={{ border: "1.5px solid #E5DDD5", borderRadius: 10, padding: "0 12px", height: 40, fontSize: 12, color: "#1A1210", background: "#fff", outline: "none" }}
        />
        <span style={{ color: "#A89080", fontSize: 12 }}>to</span>
        <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)}
          style={{ border: "1.5px solid #E5DDD5", borderRadius: 10, padding: "0 12px", height: 40, fontSize: 12, color: "#1A1210", background: "#fff", outline: "none" }}
        />
        {(startDate || endDate) && (
          <button onClick={() => { setStartDate(""); setEndDate(""); }} style={{
            background: "none", border: "none", color: "#C9A84C", fontSize: 12, cursor: "pointer", fontWeight: 600
          }}>Clear</button>
        )}
      </div>

      {/* Table */}
      <div className="table-wrapper">
        <table className="w-full">
          <thead>
            <tr>
              <th className="th">Expense #</th>
              <th className="th">Title</th>
              <th className="th text-center">Category</th>
              <th className="th">Date</th>
              <th className="th text-right">Amount</th>
              <th className="th text-center">Payment</th>
              {isAdmin && <th className="th text-right">By</th>}
              <th className="th text-right">Actions</th>
            </tr>
          </thead>
          <tbody style={{ borderColor: "#F0EAE3" }}>
            {loading ? (
              <tr><td colSpan={isAdmin ? 8 : 7} style={{ textAlign: "center", padding: "48px 0" }}><Spinner /></td></tr>
            ) : expenses.length === 0 ? (
              <tr>
                <td colSpan={isAdmin ? 8 : 7} style={{ textAlign: "center", padding: "48px 0", color: "#A89080", fontSize: 14 }}>
                  No expenses found
                </td>
              </tr>
            ) : expenses.map((e: IExpense, idx: number) => {
              const cc = categoryColors[e.category] || categoryColors["Others"];
              return (
                <motion.tr
                  key={e._id}
                  className="tr-hover"
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.025 }}
                  style={{ borderBottom: "1px solid #F0EAE3" }}
                >
                  <td className="td">
                    <span style={{ fontFamily: "monospace", fontSize: 11, color: "#A89080", fontWeight: 600 }}>{e.expenseNumber}</span>
                  </td>
                  <td className="td">
                    <div style={{ fontWeight: 600, color: "#1A1210", fontSize: 13 }}>{e.title}</div>
                    {e.reference && <div style={{ fontSize: 11, color: "#A89080" }}>Ref: {e.reference}</div>}
                    {e.description && <div style={{ fontSize: 11, color: "#A89080", fontStyle: "italic" }}>{e.description}</div>}
                  </td>
                  <td className="td text-center">
                    <span style={{
                      display: "inline-block", padding: "2px 10px", borderRadius: 20,
                      fontSize: 10, fontWeight: 700,
                      background: cc.bg, color: cc.color, border: `1px solid ${cc.border}`
                    }}>
                      {e.category}
                    </span>
                  </td>
                  <td className="td" style={{ fontSize: 12, color: "#7A6055" }}>{formatDate(e.date)}</td>
                  <td className="td text-right">
                    <span style={{ fontWeight: 800, color: "#C0392B", fontSize: 14 }}>{formatCurrency(e.amount)}</span>
                  </td>
                  <td className="td text-center">
                    <Badge
                      label={e.paymentType}
                      variant={e.paymentType === "cash" ? "success" : e.paymentType === "credit" ? "warning" : "info"}
                    />
                  </td>
                  {isAdmin && (
                    <td className="td text-right">
                      <span style={{ fontSize: 11, color: "#A89080" }}>{e.createdBy?.name || "Admin"}</span>
                    </td>
                  )}
                  <td className="td text-right">
                    <div style={{ display: "flex", justifyContent: "flex-end", gap: 4 }}>
                      {canEdit && (
                        <Link href={`/expenses/edit/${e._id}`}>
                          <button style={{
                            padding: "6px", borderRadius: 7, border: "1px solid #E5DDD5",
                            background: "#fff", cursor: "pointer", color: "#7A6055", display: "flex", transition: "all 0.15s"
                          }}
                          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "#EBF5FB"; (e.currentTarget as HTMLElement).style.color = "#2980B9"; }}
                          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "#fff"; (e.currentTarget as HTMLElement).style.color = "#7A6055"; }}
                          >
                            <Pencil size={13} />
                          </button>
                        </Link>
                      )}
                      {canDelete && (
                        <button onClick={() => setDeleteId(e._id)} style={{
                          padding: "6px", borderRadius: 7, border: "1px solid #E5DDD5",
                          background: "#fff", cursor: "pointer", color: "#7A6055", display: "flex", transition: "all 0.15s"
                        }}
                        onMouseEnter={ev => { (ev.currentTarget as HTMLElement).style.background = "#FDEDEC"; (ev.currentTarget as HTMLElement).style.color = "#C0392B"; }}
                        onMouseLeave={ev => { (ev.currentTarget as HTMLElement).style.background = "#fff"; (ev.currentTarget as HTMLElement).style.color = "#7A6055"; }}
                        >
                          <Trash2 size={13} />
                        </button>
                      )}
                    </div>
                  </td>
                </motion.tr>
              );
            })}
          </tbody>
        </table>
        <div style={{ borderTop: "1px solid #F0EAE3", padding: "0 8px" }}>
          <Pagination page={page} totalPages={totalPages} total={total} limit={LIMIT} onPageChange={setPage} />
        </div>
      </div>

      <ConfirmModal
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Delete Expense"
        message="Are you sure you want to delete this expense record?"
        confirmLabel="Delete"
        loading={deleting}
      />
    </div>
  );
}

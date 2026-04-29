"use client";
import React, { useEffect, useState, useCallback } from "react";
import { Plus, Search, ArrowUpDown, Pencil, Trash2, ChevronDown, ChevronUp, Package } from "lucide-react";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Badge from "@/components/ui/Badge";
import Pagination from "@/components/ui/Pagination";
import ConfirmModal from "@/components/ui/ConfirmModal";
import ItemModal from "@/components/items/ItemModal";
import Spinner from "@/components/ui/Spinner";
import { useItems } from "@/hooks/useItems";
import { IItem } from "@/types";
import { formatCurrency, formatDate } from "@/lib/utils";
import { useSession } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";

const LIMIT = 10;

const FURNITURE_CATEGORIES = [
  "All", "Sofa & Seating", "Beds & Mattresses", "Tables & Desks",
  "Wardrobes & Cabinets", "Chairs", "Outdoor Furniture",
  "Kids Furniture", "Office Furniture", "Shelving & Storage",
  "Raw Material - Wood", "Raw Material - Fabric", "Raw Material - Metal",
  "Raw Material - Foam", "Accessories & Hardware", "Other"
];

const unitColor: Record<string, { bg: string; color: string; border: string }> = {
  pcs:       { bg: "#EBF5FB", color: "#2980B9", border: "#AED6F1" },
  set:       { bg: "#F4ECF7", color: "#6C3483", border: "#D7BDE2" },
  meters:    { bg: "#E8F8F5", color: "#117A65", border: "#A2D9CE" },
  "sq.meters":{ bg: "#FEF5E7", color: "#CA6F1E", border: "#FAD7A0" },
  kg:        { bg: "#FDEDEC", color: "#C0392B", border: "#F5B7B1" },
  box:       { bg: "#EAFAF1", color: "#1E8449", border: "#A9DFBF" },
  roll:      { bg: "#EBF5FB", color: "#1A5276", border: "#AED6F1" },
  liters:    { bg: "#F0F3FF", color: "#2471A3", border: "#AED6F1" },
};

export default function ItemsPage() {
  const { items, total, totalAmount, totalPages, loading, fetchItems, createItem, updateItem, deleteItem } = useItems();

  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"new" | "opening_stock">("new");
  const [editItem, setEditItem] = useState<IItem | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [expandedItemId, setExpandedItemId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const { data: session } = useSession();
  const isAdmin = session?.user?.role === "admin";
  const perms = (session?.user?.permissions as any)?.items;
  const canCreate = isAdmin || perms?.create;
  const canEdit = isAdmin || perms?.edit;
  const canDelete = isAdmin || perms?.delete;

  const load = useCallback(() => {
    fetchItems({ search, page, limit: LIMIT, sortBy, sortOrder });
  }, [search, page, sortBy, sortOrder, fetchItems]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { setPage(1); }, [search]);

  const handleSort = (col: string) => {
    if (sortBy === col) setSortOrder(o => o === "asc" ? "desc" : "asc");
    else { setSortBy(col); setSortOrder("asc"); }
  };

  const handleSubmit = async (data: any) => {
    setSaving(true);
    let ok = false;
    if (editItem) {
      ok = await updateItem(editItem._id, { ...data, unit: data.unit as any });
    } else if (modalMode === "opening_stock" && data.itemId) {
      ok = await updateItem(data.itemId, { ...data, unit: data.unit as any, isOpeningStock: true } as any);
    } else {
      ok = await createItem({ ...data, unit: data.unit as any });
    }
    setSaving(false);
    if (ok) { setModalOpen(false); setEditItem(null); load(); }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    const ok = await deleteItem(deleteId);
    setDeleting(false);
    if (ok) { setDeleteId(null); load(); }
  };

  const SortBtn = ({ col }: { col: string }) => (
    <button onClick={() => handleSort(col)} style={{ marginLeft: 4, opacity: 0.5, cursor: "pointer", background: "none", border: "none", color: "inherit", padding: 0 }}>
      <ArrowUpDown size={12} />
    </button>
  );

  const filteredItems = categoryFilter === "All"
    ? items
    : items.filter((i: IItem) => i.category === categoryFilter);

  return (
    <div className="page-container">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}
      >
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: "#1A1210", margin: 0 }}>Inventory</h1>
          <p style={{ fontSize: 13, color: "#7A6055", margin: "4px 0 0" }}>
            {total} furniture items & materials
          </p>
        </div>
        {canCreate && (
          <div style={{ display: "flex", gap: 10 }}>
            <motion.button
              whileHover={{ scale: 1.02, y: -1 }} whileTap={{ scale: 0.98 }}
              onClick={() => { setModalMode("opening_stock"); setEditItem(null); setModalOpen(true); }}
              style={{
                display: "flex", alignItems: "center", gap: 7,
                padding: "9px 18px", borderRadius: 10,
                border: "1.5px solid #E5DDD5", background: "#fff",
                color: "#5C3D2E", fontSize: 13, fontWeight: 600, cursor: "pointer"
              }}
            >
              <Package size={15} /> Opening Stock
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.02, y: -1 }} whileTap={{ scale: 0.98 }}
              onClick={() => { setModalMode("new"); setEditItem(null); setModalOpen(true); }}
              style={{
                display: "flex", alignItems: "center", gap: 7,
                padding: "9px 18px", borderRadius: 10, border: "none",
                background: "linear-gradient(135deg, #2C1810, #5C3D2E)",
                color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer",
                boxShadow: "0 4px 14px rgba(44,24,16,0.2)"
              }}
            >
              <Plus size={15} /> New Item
            </motion.button>
          </div>
        )}
      </motion.div>

      {/* Summary cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 12 }}>
        {[
          { label: "Total Items", value: total, color: "#2C1810" },
          { label: "Stock Value", value: formatCurrency(totalAmount), color: "#1E8449" },
        ].map(({ label, value, color }) => (
          <div key={label} style={{
            background: "#fff", borderRadius: 12, border: "1px solid #E5DDD5",
            padding: "16px 20px", boxShadow: "0 1px 4px rgba(44,24,16,0.04)"
          }}>
            <p style={{ fontSize: 11, color: "#A89080", margin: 0, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em" }}>{label}</p>
            <p style={{ fontSize: 22, fontWeight: 800, color, margin: "4px 0 0" }}>{value}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
        <div style={{
          display: "flex", alignItems: "center", gap: 8,
          background: "#fff", border: "1.5px solid #E5DDD5", borderRadius: 10,
          padding: "0 14px", height: 40, flex: "1 1 240px", maxWidth: 300
        }}>
          <Search size={15} color="#A89080" />
          <input
            placeholder="Search by name or item number…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ border: "none", outline: "none", fontSize: 13, color: "#1A1210", background: "transparent", flex: 1 }}
          />
        </div>
        <select
          value={categoryFilter}
          onChange={e => setCategoryFilter(e.target.value)}
          style={{
            border: "1.5px solid #E5DDD5", borderRadius: 10, padding: "0 12px",
            height: 40, fontSize: 13, color: "#1A1210", background: "#fff",
            cursor: "pointer", outline: "none", maxWidth: 200
          }}
        >
          {FURNITURE_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="table-wrapper">
        <table className="w-full">
          <thead>
            <tr>
              <th className="th">Item # <SortBtn col="itemNumber" /></th>
              <th className="th">Name <SortBtn col="name" /></th>
              <th className="th text-center">Category</th>
              <th className="th text-center">Unit</th>
              <th className="th text-right">In Stock <SortBtn col="quantity" /></th>
              <th className="th text-right">Buy Price</th>
              <th className="th text-right">Sell Price</th>
              <th className="th text-center">Stock History</th>
              {isAdmin && <th className="th text-right">By</th>}
              <th className="th text-right">Actions</th>
            </tr>
          </thead>
          <tbody style={{ borderColor: "#F0EAE3" }}>
            {loading ? (
              <tr><td colSpan={isAdmin ? 10 : 9} style={{ textAlign: "center", padding: "48px 0" }}><Spinner /></td></tr>
            ) : filteredItems.length === 0 ? (
              <tr>
                <td colSpan={isAdmin ? 10 : 9} style={{ textAlign: "center", padding: "64px 0" }}>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
                    <Package size={36} color="#E5DDD5" />
                    <p style={{ color: "#A89080", fontSize: 14, margin: 0 }}>No items found</p>
                    {canCreate && (
                      <button onClick={() => { setModalMode("new"); setModalOpen(true); }} style={{
                        marginTop: 4, padding: "8px 18px", borderRadius: 8,
                        background: "#2C1810", border: "none", color: "#fff",
                        fontSize: 13, fontWeight: 600, cursor: "pointer"
                      }}>Add First Item</button>
                    )}
                  </div>
                </td>
              </tr>
            ) : filteredItems.map((item: IItem, idx: number) => {
              const uc = unitColor[item.unit || "pcs"] || { bg: "#EBF5FB", color: "#2980B9", border: "#AED6F1" };
              return (
                <React.Fragment key={item._id}>
                  <motion.tr
                    className="tr-hover"
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.025 }}
                    style={{ borderBottom: "1px solid #F0EAE3" }}
                  >
                    <td className="td">
                      <span style={{ fontFamily: "monospace", fontSize: 11, color: "#A89080", fontWeight: 600 }}>
                        {item.itemNumber}
                      </span>
                    </td>
                    <td className="td">
                      <div style={{ fontWeight: 700, color: "#1A1210", fontSize: 13 }}>{item.name}</div>
                    </td>
                    <td className="td text-center">
                      {item.category ? (
                        <span style={{
                          display: "inline-block", padding: "2px 10px", borderRadius: 20,
                          fontSize: 10, fontWeight: 700, background: "#F7F4F0",
                          color: "#8B5E3C", border: "1px solid #E5DDD5"
                        }}>
                          {item.category}
                        </span>
                      ) : "—"}
                    </td>
                    <td className="td text-center">
                      <span style={{
                        display: "inline-block", padding: "2px 10px", borderRadius: 20,
                        fontSize: 10, fontWeight: 700, background: uc.bg,
                        color: uc.color, border: `1px solid ${uc.border}`
                      }}>
                        {item.unit || "pcs"}
                      </span>
                    </td>
                    <td className="td text-right">
                      <span style={{
                        display: "inline-block", padding: "3px 10px", borderRadius: 20,
                        fontSize: 12, fontWeight: 700,
                        background: item.quantity === 0 ? "#FDEDEC" : item.quantity < 5 ? "#FEF5E7" : "#EAFAF1",
                        color: item.quantity === 0 ? "#C0392B" : item.quantity < 5 ? "#CA6F1E" : "#1E8449",
                        border: `1px solid ${item.quantity === 0 ? "#F5B7B1" : item.quantity < 5 ? "#FAD7A0" : "#A9DFBF"}`
                      }}>
                        {item.quantity} {item.unit || "pcs"}
                      </span>
                    </td>
                    <td className="td text-right" style={{ fontSize: 12, color: "#7A6055" }}>
                      {formatCurrency(item.purchaseAmount)}
                    </td>
                    <td className="td text-right" style={{ fontSize: 13, fontWeight: 700, color: "#2C1810" }}>
                      {formatCurrency(item.salesAmount)}
                    </td>
                    <td className="td text-center">
                      <button
                        onClick={() => setExpandedItemId(expandedItemId === item._id ? null : item._id)}
                        style={{
                          display: "inline-flex", alignItems: "center", gap: 5,
                          padding: "4px 12px", borderRadius: 8, fontSize: 11, fontWeight: 600,
                          border: "1px solid #E5DDD5", background: expandedItemId === item._id ? "#FEF5E7" : "#fff",
                          color: expandedItemId === item._id ? "#CA6F1E" : "#7A6055",
                          cursor: "pointer"
                        }}
                      >
                        {expandedItemId === item._id ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                        {(item.batches?.length || 0)} entries
                      </button>
                    </td>
                    {isAdmin && (
                      <td className="td text-right">
                        <span style={{ fontSize: 11, color: "#A89080" }}>{item.createdBy?.name || "Admin"}</span>
                      </td>
                    )}
                    <td className="td text-right">
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 4 }}>
                        {canEdit && (
                          <button
                            onClick={() => { setEditItem(item); setModalOpen(true); }}
                            style={{
                              padding: "6px", borderRadius: 7, border: "1px solid #E5DDD5",
                              background: "#fff", cursor: "pointer", color: "#7A6055", display: "flex", transition: "all 0.15s"
                            }}
                            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "#EBF5FB"; (e.currentTarget as HTMLElement).style.color = "#2980B9"; }}
                            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "#fff"; (e.currentTarget as HTMLElement).style.color = "#7A6055"; }}
                          >
                            <Pencil size={13} />
                          </button>
                        )}
                        {canDelete && (
                          <button
                            onClick={() => setDeleteId(item._id)}
                            style={{
                              padding: "6px", borderRadius: 7, border: "1px solid #E5DDD5",
                              background: "#fff", cursor: "pointer", color: "#7A6055", display: "flex", transition: "all 0.15s"
                            }}
                            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "#FDEDEC"; (e.currentTarget as HTMLElement).style.color = "#C0392B"; }}
                            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "#fff"; (e.currentTarget as HTMLElement).style.color = "#7A6055"; }}
                          >
                            <Trash2 size={13} />
                          </button>
                        )}
                      </div>
                    </td>
                  </motion.tr>

                  {/* Expanded purchase history */}
                  <AnimatePresence>
                    {expandedItemId === item._id && (
                      <motion.tr
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        style={{ background: "#FBF9F7" }}
                      >
                        <td colSpan={isAdmin ? 10 : 9} style={{ padding: "12px 16px", borderBottom: "1px solid #F0EAE3" }}>
                          <div style={{
                            fontSize: 10, fontWeight: 800, color: "#8B5E3C",
                            marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.08em",
                            display: "flex", alignItems: "center", gap: 6
                          }}>
                            <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#C9A84C" }} />
                            Purchase / Stock History
                          </div>
                          {item.batches && item.batches.length > 0 ? (
                            <div style={{ borderRadius: 8, border: "1px solid #E5DDD5", overflow: "hidden", background: "#fff" }}>
                              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11 }}>
                                <thead style={{ background: "#F7F4F0" }}>
                                  <tr>
                                    {["Purchase Ref", "Entry Ref", "Qty", "Buy Price", "Sell Price", "Stock Value", "Date"].map(h => (
                                      <th key={h} style={{
                                        padding: "6px 10px", textAlign: h === "Qty" || h === "Buy Price" || h === "Sell Price" || h === "Stock Value" ? "right" : "left",
                                        fontSize: 10, fontWeight: 700, color: "#A89080",
                                        textTransform: "uppercase", letterSpacing: "0.06em",
                                        borderBottom: "1px solid #E5DDD5"
                                      }}>{h}</th>
                                    ))}
                                  </tr>
                                </thead>
                                <tbody>
                                  {item.batches.map((batch, bi) => (
                                    <tr key={bi} style={{ borderBottom: "1px solid #F0EAE3" }}>
                                      <td style={{ padding: "7px 10px", fontFamily: "monospace", color: "#A89080", fontSize: 10 }}>{batch.purchaseNumber || "—"}</td>
                                      <td style={{ padding: "7px 10px", color: "#7A6055" }}>{batch.batchNumber || "—"}</td>
                                      <td style={{ padding: "7px 10px", textAlign: "right", fontWeight: 700, color: "#2C1810" }}>
                                        {batch.quantity} <span style={{ fontSize: 9, color: "#A89080" }}>{item.unit || "pcs"}</span>
                                      </td>
                                      <td style={{ padding: "7px 10px", textAlign: "right", color: "#7A6055" }}>{formatCurrency(batch.purchasePrice)}</td>
                                      <td style={{ padding: "7px 10px", textAlign: "right", fontWeight: 600, color: "#2980B9" }}>{formatCurrency(batch.salePrice)}</td>
                                      <td style={{ padding: "7px 10px", textAlign: "right", fontWeight: 700, color: "#1E8449" }}>
                                        {formatCurrency((batch.purchasePrice || 0) * (batch.quantity || 0))}
                                      </td>
                                      <td style={{ padding: "7px 10px", color: "#A89080" }}>
                                        {batch.createdAt ? formatDate(batch.createdAt) : "—"}
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          ) : (
                            <p style={{ fontSize: 12, color: "#A89080", fontStyle: "italic", margin: 0 }}>
                              No purchase history yet.
                            </p>
                          )}
                        </td>
                      </motion.tr>
                    )}
                  </AnimatePresence>
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
        <div style={{ borderTop: "1px solid #F0EAE3", padding: "0 8px" }}>
          <Pagination page={page} totalPages={totalPages} total={total} limit={LIMIT} onPageChange={setPage} />
        </div>
      </div>

      <ItemModal
        open={modalOpen}
        onClose={() => { setModalOpen(false); setEditItem(null); }}
        onSubmit={handleSubmit}
        item={editItem}
        loading={saving}
        mode={modalMode}
      />

      <ConfirmModal
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Delete Item"
        message="Are you sure you want to delete this item? All stock history will be lost."
        confirmLabel="Delete"
        loading={deleting}
      />
    </div>
  );
}

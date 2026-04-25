"use client";
import React, { useEffect, useState } from "react";
import { AlertTriangle, Package, TrendingDown, Search } from "lucide-react";
import Spinner from "@/components/ui/Spinner";
import { formatCurrency } from "@/lib/utils";
import { motion } from "framer-motion";

interface LowStockItem {
  _id: string;
  itemNumber: string;
  name: string;
  unit: string;
  category?: string;
  quantity: number;
  purchaseAmount: number;
  salesAmount: number;
  stockValue: number;
}

const THRESHOLD = 5;

export default function LowStockPage() {
  const [items, setItems] = useState<LowStockItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetch("/api/items?limit=500&sortBy=quantity&sortOrder=asc")
      .then(r => r.json())
      .then(data => {
        const all: LowStockItem[] = data.data || [];
        setItems(all.filter((i: LowStockItem) => i.quantity <= THRESHOLD));
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const filtered = items.filter(i =>
    i.name.toLowerCase().includes(search.toLowerCase()) ||
    i.itemNumber.toLowerCase().includes(search.toLowerCase())
  );

  const outOfStock   = filtered.filter(i => i.quantity === 0);
  const critical     = filtered.filter(i => i.quantity > 0 && i.quantity <= 2);
  const low          = filtered.filter(i => i.quantity > 2 && i.quantity <= THRESHOLD);

  function statusTag(qty: number) {
    if (qty === 0) return { label: "Out of Stock", bg: "#FDEDEC", color: "#C0392B", border: "#F5B7B1" };
    if (qty <= 2)  return { label: "Critical",     bg: "#FEF5E7", color: "#CA6F1E", border: "#FAD7A0" };
    return           { label: "Low Stock",         bg: "#FEF9E7", color: "#B7950B", border: "#F9E79F" };
  }

  return (
    <div className="page-container">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}
      >
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: "#1A1210", margin: 0 }}>Low Stock Alerts</h1>
          <p style={{ fontSize: 13, color: "#7A6055", margin: "4px 0 0" }}>
            Furniture items and materials that need restocking
          </p>
        </div>
      </motion.div>

      {/* Summary cards */}
      {!loading && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 12 }}>
          {[
            { label: "Out of Stock",   value: outOfStock.length, bg: "#FDEDEC", color: "#C0392B", border: "#F5B7B1" },
            { label: "Critical (≤ 2)", value: critical.length,   bg: "#FEF5E7", color: "#CA6F1E", border: "#FAD7A0" },
            { label: `Low (≤ ${THRESHOLD})`,    value: low.length,       bg: "#FEF9E7", color: "#B7950B", border: "#F9E79F" },
            { label: "Total Alerts",   value: filtered.length,   bg: "#F7F4F0", color: "#2C1810", border: "#E5DDD5" },
          ].map(({ label, value, bg, color, border }, idx) => (
            <motion.div
              key={label}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: idx * 0.06 }}
              style={{ background: bg, border: `1px solid ${border}`, borderRadius: 12, padding: "14px 18px" }}
            >
              <p style={{ fontSize: 11, color, margin: 0, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>{label}</p>
              <p style={{ fontSize: 24, fontWeight: 800, color, margin: "4px 0 0" }}>{value}</p>
            </motion.div>
          ))}
        </div>
      )}

      {/* Search */}
      <div style={{
        display: "flex", alignItems: "center", gap: 8,
        background: "#fff", border: "1.5px solid #E5DDD5", borderRadius: 10,
        padding: "0 14px", height: 40, maxWidth: 320
      }}>
        <Search size={15} color="#A89080" />
        <input
          placeholder="Search item name or number…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ border: "none", outline: "none", fontSize: 13, color: "#1A1210", background: "transparent", flex: 1 }}
        />
      </div>

      {/* Table */}
      <div className="table-wrapper">
        <table className="w-full">
          <thead>
            <tr>
              <th className="th">Item #</th>
              <th className="th">Name</th>
              <th className="th text-center">Category</th>
              <th className="th text-center">Unit</th>
              <th className="th text-center">Status</th>
              <th className="th text-right">In Stock</th>
              <th className="th text-right">Buy Price</th>
              <th className="th text-right">Sell Price</th>
            </tr>
          </thead>
          <tbody style={{ borderColor: "#F0EAE3" }}>
            {loading ? (
              <tr><td colSpan={8} style={{ textAlign: "center", padding: "48px 0" }}><Spinner /></td></tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={8} style={{ textAlign: "center", padding: "64px 0" }}>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
                    <div style={{
                      width: 56, height: 56, borderRadius: "50%",
                      background: "#EAFAF1", border: "2px solid #A9DFBF",
                      display: "flex", alignItems: "center", justifyContent: "center"
                    }}>
                      <Package size={24} color="#1E8449" />
                    </div>
                    <p style={{ fontSize: 15, fontWeight: 700, color: "#1E8449", margin: 0 }}>All stock levels are healthy!</p>
                    <p style={{ fontSize: 13, color: "#A89080", margin: 0 }}>No items below the threshold of {THRESHOLD} units.</p>
                  </div>
                </td>
              </tr>
            ) : filtered.map((item, idx) => {
              const tag = statusTag(item.quantity);
              return (
                <motion.tr
                  key={item._id}
                  className="tr-hover"
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.03 }}
                  style={{ borderBottom: "1px solid #F0EAE3" }}
                >
                  <td className="td">
                    <span style={{ fontFamily: "monospace", fontSize: 11, color: "#A89080", fontWeight: 600 }}>{item.itemNumber}</span>
                  </td>
                  <td className="td">
                    <div style={{ fontWeight: 700, color: "#1A1210", fontSize: 13 }}>{item.name}</div>
                  </td>
                  <td className="td text-center">
                    <span style={{
                      display: "inline-block", padding: "2px 10px", borderRadius: 20,
                      fontSize: 10, fontWeight: 700, background: "#F7F4F0", color: "#8B5E3C", border: "1px solid #E5DDD5"
                    }}>
                      {item.category || "—"}
                    </span>
                  </td>
                  <td className="td text-center">
                    <span style={{
                      display: "inline-block", padding: "2px 10px", borderRadius: 20,
                      fontSize: 10, fontWeight: 700, background: "#EBF5FB", color: "#2980B9", border: "1px solid #AED6F1"
                    }}>
                      {item.unit || "pcs"}
                    </span>
                  </td>
                  <td className="td text-center">
                    <span style={{
                      display: "inline-flex", alignItems: "center", gap: 5,
                      padding: "3px 10px", borderRadius: 20,
                      fontSize: 11, fontWeight: 700,
                      background: tag.bg, color: tag.color, border: `1px solid ${tag.border}`
                    }}>
                      <AlertTriangle size={11} />
                      {tag.label}
                    </span>
                  </td>
                  <td className="td text-right">
                    <span style={{
                      fontWeight: 800, fontSize: 15,
                      color: item.quantity === 0 ? "#C0392B" : item.quantity <= 2 ? "#CA6F1E" : "#B7950B"
                    }}>
                      {item.quantity} <span style={{ fontSize: 11, fontWeight: 500, color: "#A89080" }}>{item.unit || "pcs"}</span>
                    </span>
                  </td>
                  <td className="td text-right" style={{ fontSize: 12, color: "#7A6055" }}>{formatCurrency(item.purchaseAmount)}</td>
                  <td className="td text-right" style={{ fontWeight: 700, color: "#2C1810" }}>{formatCurrency(item.salesAmount)}</td>
                </motion.tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

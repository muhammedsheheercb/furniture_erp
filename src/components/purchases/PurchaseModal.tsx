"use client";
import { useEffect, useState } from "react";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import { Plus, Trash2, Package, Layers } from "lucide-react";
import axios from "axios";
import { toast } from "sonner";
import CurrencySymbol from "@/components/ui/CurrencySymbol";

// ── types ─────────────────────────────────────────────────────────────────────
interface LineItem {
  id:           string;
  type:         "product" | "material";
  refId:        string;
  name:         string;
  code:         string;
  unit:         string;
  qty:          number;
  price:        number;
  sellingPrice: number;
  batchNumber:  string;
  total:        number;
}

interface PurchaseModalProps {
  open:      boolean;
  onClose:   () => void;
  onSubmit:  (data: any) => Promise<void>;
  purchase?: any | null;
  loading?:  boolean;
}

// ── helpers ───────────────────────────────────────────────────────────────────
function uid() { return Math.random().toString(36).slice(2); }

function newProductRow(): LineItem {
  return { id: uid(), type: "product",  refId: "", name: "", code: "", unit: "Piece", qty: 1, price: 0, sellingPrice: 0, batchNumber: "", total: 0 };
}
function newMaterialRow(): LineItem {
  return { id: uid(), type: "material", refId: "", name: "", code: "", unit: "Sheet", qty: 1, price: 0, sellingPrice: 0, batchNumber: "", total: 0 };
}

// ── component ─────────────────────────────────────────────────────────────────
export default function PurchaseModal({ open, onClose, onSubmit, purchase, loading }: PurchaseModalProps) {
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [products,  setProducts]  = useState<any[]>([]);
  const [materials, setMaterials] = useState<any[]>([]);

  // header fields
  const [supplierId,   setSupplierId]   = useState("");
  const [supplierName, setSupplierName] = useState("");
  const [supplierNo,   setSupplierNo]   = useState("");
  const [date,         setDate]         = useState(new Date().toISOString().split("T")[0]);
  const [paymentType,  setPaymentType]  = useState<"cash"|"bank"|"credit">("cash");
  const [note,         setNote]         = useState("");
  const [paidAmount,   setPaidAmount]   = useState(0);

  // line items
  const [lineItems, setLineItems] = useState<LineItem[]>([]);
  const [formError, setFormError] = useState("");

  const grandTotal = lineItems.reduce((s, i) => s + i.total, 0);

  // ── load reference data ──────────────────────────────────────────────────
  useEffect(() => {
    if (!open) return;
    Promise.all([
      axios.get("/api/suppliers"),
      axios.get("/api/items?limit=500"),
      axios.get("/api/materials"),
    ])
      .then(([supRes, prodRes, matRes]) => {
        setSuppliers(supRes.data.data   || []);
        setProducts (prodRes.data.data  || []);
        setMaterials(matRes.data.data   || []);
      })
      .catch(() => toast.error("Failed to load reference data"));
  }, [open]);

  // ── populate form when editing ───────────────────────────────────────────
  useEffect(() => {
    if (!open) return;
    if (purchase) {
      setSupplierId  (purchase.supplierId?._id || purchase.supplierId || "");
      setSupplierName(purchase.supplierName    || "");
      setSupplierNo  (purchase.supplierNumber  || "");
      setDate        (new Date(purchase.date).toISOString().split("T")[0]);
      setPaymentType (purchase.paymentType     || "cash");
      setNote        (purchase.note            || "");
      setPaidAmount  (purchase.paidAmount      || 0);
      setLineItems(
        (purchase.items || []).map((item: any) => ({
          id:           uid(),
          type:         item.itemType || "product",
          refId:        item.materialId || item.itemId || "",
          name:         item.itemName,
          code:         item.itemNumber,
          unit:         item.unit || "Piece",
          qty:          item.quantity,
          price:        item.price,
          sellingPrice: item.sellingPrice || 0,
          batchNumber:  item.batch || "",
          total:        item.total,
        }))
      );
    } else {
      setSupplierId(""); setSupplierName(""); setSupplierNo("");
      setDate(new Date().toISOString().split("T")[0]);
      setPaymentType("cash"); setNote(""); setPaidAmount(0);
      setLineItems([]);
    }
    setFormError("");
  }, [open, purchase]);

  // ── line item helpers ────────────────────────────────────────────────────
  function selectProduct(lineId: string, prodId: string) {
    const p = products.find((x: any) => x._id === prodId);
    if (!p) return;
    setLineItems(prev => prev.map(i => i.id !== lineId ? i : {
      ...i, refId: prodId, name: p.name, code: p.itemNumber,
      unit: p.unit || "Piece", price: p.purchaseAmount || 0,
      sellingPrice: p.salesAmount || 0,
      total: (p.purchaseAmount || 0) * i.qty,
    }));
  }

  function selectMaterial(lineId: string, matId: string) {
    const m = materials.find((x: any) => x._id === matId);
    if (!m) return;
    setLineItems(prev => prev.map(i => i.id !== lineId ? i : {
      ...i, refId: matId, name: m.name, code: m.code,
      unit: m.unit || "Sheet", price: m.lastPurchasePrice || 0,
      total: (m.lastPurchasePrice || 0) * i.qty,
    }));
  }

  function updateField(lineId: string, field: "qty" | "price" | "sellingPrice", value: number) {
    setLineItems(prev => prev.map(i => {
      if (i.id !== lineId) return i;
      const updated = { ...i, [field]: value };
      updated.total = updated.qty * updated.price;
      return updated;
    }));
  }

  function removeRow(lineId: string) {
    setLineItems(prev => prev.filter(i => i.id !== lineId));
  }

  // ── submit ───────────────────────────────────────────────────────────────
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError("");

    if (!supplierId) { setFormError("Please select a supplier."); return; }
    if (lineItems.length === 0) { setFormError("Add at least one item."); return; }
    const missing = lineItems.find(i => !i.refId);
    if (missing) { setFormError("Please select an item for every row."); return; }
    const belowCost = lineItems.find(i => i.type === "product" && i.sellingPrice < i.price);
    if (belowCost) {
      setFormError(`Sales price for "${belowCost.name}" cannot be less than its purchase price (${belowCost.price.toLocaleString("en-IN")}).`);
      return;
    }
    if (paidAmount > grandTotal) {
      setFormError(`Paid amount (${paidAmount.toLocaleString("en-IN")}) cannot exceed Grand Total (${grandTotal.toLocaleString("en-IN")}).`);
      return;
    }

    const payload = {
      supplierId,
      supplierName,
      supplierNumber: supplierNo,
      date,
      paymentType,
      note,
      paidAmount,
      total: grandTotal,
      subtotal: grandTotal,
      items: lineItems.map((i, idx) => ({
        itemType:    i.type,
        itemId:      i.type === "product"  ? i.refId : undefined,
        materialId:  i.type === "material" ? i.refId : undefined,
        itemNumber:  i.code,
        itemName:    i.name,
        unit:        i.unit,
        quantity:    i.qty,
        price:        i.price,
        sellingPrice: i.sellingPrice,
        total:        i.total,
        batch:        i.batchNumber.trim() || `B${Date.now()}${idx}`,
      })),
    };

    await onSubmit(payload);
  }

  // ── render ───────────────────────────────────────────────────────────────
  const inputCls  = "w-full rounded-lg border border-[#E5DDD5] px-3 py-2 text-sm bg-white text-[#1A1210] focus:outline-none focus:ring-2 focus:ring-[#C9A84C]/30";
  const labelCls  = "block text-xs font-semibold text-[#7A6055] mb-1";

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={purchase ? "Edit Purchase Order" : "New Purchase Order"}
      size="xl"
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={loading}>Cancel</Button>
          <Button form="purchase-form" type="submit" loading={loading}>
            {purchase ? "Update Order" : "Create Order"}
          </Button>
        </>
      }
    >
      <form id="purchase-form" onSubmit={handleSubmit} className="space-y-6">

        {/* ── Header ─────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Supplier */}
          <div>
            <label className={labelCls}>Supplier *</label>
            <select
              value={supplierId}
              onChange={e => {
                const s = suppliers.find(x => x._id === e.target.value);
                setSupplierId(e.target.value);
                setSupplierName(s?.name           || "");
                setSupplierNo  (s?.supplierNumber || "");
              }}
              className={inputCls}
            >
              <option value="">Select Supplier</option>
              {suppliers.map(s => (
                <option key={s._id} value={s._id}>{s.name}</option>
              ))}
            </select>
          </div>

          {/* Date */}
          <div>
            <label className={labelCls}>Date</label>
            <input type="date" value={date} onChange={e => setDate(e.target.value)} className={inputCls} />
          </div>

          {/* Payment Type */}
          <div>
            <label className={labelCls}>Payment Type</label>
            <select
              value={paymentType}
              onChange={e => setPaymentType(e.target.value as any)}
              className={inputCls}
            >
              <option value="cash">Cash</option>
              <option value="bank">Bank / UPI</option>
              <option value="credit">Credit / On Account</option>
            </select>
          </div>
        </div>

        {/* ── Items Section ──────────────────────────────────────── */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-[#1A1210]">Order Items</h3>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setLineItems(p => [...p, newProductRow()])}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold bg-[#1B3A2D] text-white hover:bg-[#163222] transition-colors"
              >
                <Package size={14} /> Add Product
              </button>
              <button
                type="button"
                onClick={() => setLineItems(p => [...p, newMaterialRow()])}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold bg-amber-600 text-white hover:bg-amber-700 transition-colors"
              >
                <Layers size={14} /> Add Material
              </button>
            </div>
          </div>

          <div className="rounded-xl border border-[#E5DDD5] overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-[#FAF8F6] border-b border-[#E5DDD5]">
                <tr>
                  <th className="py-2.5 px-3 text-left text-xs font-bold text-[#7A6055] uppercase w-24">Type</th>
                  <th className="py-2.5 px-3 text-left text-xs font-bold text-[#7A6055] uppercase">Item / Material</th>
                  <th className="py-2.5 px-3 text-left text-xs font-bold text-[#7A6055] uppercase w-28">Code</th>
                  <th className="py-2.5 px-3 text-left text-xs font-bold text-[#7A6055] uppercase w-20">Unit</th>
                  <th className="py-2.5 px-3 text-center text-xs font-bold text-[#7A6055] uppercase w-20">Qty</th>
                  <th className="py-2.5 px-3 text-right text-xs font-bold text-[#7A6055] uppercase w-28">Purchase <CurrencySymbol className="w-3 h-3" /></th>
                  <th className="py-2.5 px-3 text-right text-xs font-bold text-[#7A6055] uppercase w-28">Sales <CurrencySymbol className="w-3 h-3" /></th>
                  <th className="py-2.5 px-3 text-left text-xs font-bold text-[#7A6055] uppercase w-28">Batch No.</th>
                  <th className="py-2.5 px-3 text-right text-xs font-bold text-[#7A6055] uppercase w-28">Total (<CurrencySymbol className="w-3 h-3" />)</th>
                  <th className="w-10"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F0EBE5]">
                {lineItems.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="py-10 text-center text-[#A89080] text-sm">
                      Click <strong>Add Product</strong> or <strong>Add Material</strong> to begin
                    </td>
                  </tr>
                ) : lineItems.map(item => (
                  <tr key={item.id} className="hover:bg-[#FAF8F6]">
                    {/* Type badge */}
                    <td className="px-3 py-2">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-bold uppercase ${
                        item.type === "product"
                          ? "bg-[#E8F0EC] text-[#1B3A2D]"
                          : "bg-amber-50 text-amber-700"
                      }`}>
                        {item.type === "product" ? <Package size={10} /> : <Layers size={10} />}
                        {item.type}
                      </span>
                    </td>

                    {/* Item selector */}
                    <td className="px-3 py-2">
                      {item.type === "product" ? (
                        <select
                          value={item.refId}
                          onChange={e => selectProduct(item.id, e.target.value)}
                          className="w-full rounded-lg border border-[#E5DDD5] px-2 py-1.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#C9A84C]/30"
                        >
                          <option value="">— Select Product —</option>
                          {products.map((p: any) => (
                            <option key={p._id} value={p._id}>{p.name} ({p.itemNumber})</option>
                          ))}
                        </select>
                      ) : (
                        <select
                          value={item.refId}
                          onChange={e => selectMaterial(item.id, e.target.value)}
                          className="w-full rounded-lg border border-[#E5DDD5] px-2 py-1.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#C9A84C]/30"
                        >
                          <option value="">— Select Material —</option>
                          {materials.map((m: any) => (
                            <option key={m._id} value={m._id}>{m.name} ({m.code})</option>
                          ))}
                        </select>
                      )}
                    </td>

                    {/* Code (read-only) */}
                    <td className="px-3 py-2 font-mono text-xs text-[#7A6055]">
                      {item.code || <span className="text-[#C5B8B0] italic">auto</span>}
                    </td>

                    {/* Unit (read-only) */}
                    <td className="px-3 py-2 text-[#7A6055]">{item.unit}</td>

                    {/* Qty */}
                    <td className="px-3 py-2">
                      <input
                        type="number" min={1} value={item.qty}
                        onChange={e => updateField(item.id, "qty", Math.max(1, Number(e.target.value)))}
                        className="w-full rounded-lg border border-[#E5DDD5] px-2 py-1.5 text-sm text-center bg-white focus:outline-none focus:ring-2 focus:ring-[#C9A84C]/30"
                      />
                    </td>

                    {/* Purchase Price */}
                    <td className="px-3 py-2">
                      <input
                        type="number" min={0} step="0.01" value={item.price}
                        onChange={e => updateField(item.id, "price", Number(e.target.value))}
                        className="w-full rounded-lg border border-[#E5DDD5] px-2 py-1.5 text-sm text-right bg-white focus:outline-none focus:ring-2 focus:ring-[#C9A84C]/30"
                      />
                    </td>

                    {/* Sales Price — product only */}
                    <td className="px-3 py-2">
                      {item.type === "product" ? (
                        <input
                          type="number" min={item.price} step="0.01" value={item.sellingPrice}
                          onChange={e => updateField(item.id, "sellingPrice", Number(e.target.value))}
                          className={`w-full rounded-lg border px-2 py-1.5 text-sm text-right bg-white focus:outline-none focus:ring-2 ${
                            item.sellingPrice < item.price
                              ? "border-rose-400 focus:ring-rose-300 text-rose-600"
                              : "border-[#E5DDD5] focus:ring-[#C9A84C]/30"
                          }`}
                        />
                      ) : (
                        <span className="block text-center text-[#C5B8B0]">—</span>
                      )}
                    </td>

                    {/* Batch No. — auto-generated, read-only */}
                    <td className="px-3 py-2">
                      <span className="block px-2 py-1.5 rounded-lg bg-[#F0EBE5] text-xs font-mono text-[#7A6055] border border-[#E5DDD5] select-all">
                        {item.batchNumber || "Auto"}
                      </span>
                    </td>

                    {/* Total */}
                    <td className="px-3 py-2 text-right font-semibold text-[#1A1210]">
                      <CurrencySymbol className="w-3 h-3 mr-1" />
                      {item.total.toLocaleString("en-IN")}
                    </td>

                    {/* Remove */}
                    <td className="px-2 py-2 text-center">
                      <button
                        type="button"
                        onClick={() => removeRow(item.id)}
                        className="p-1 rounded-lg hover:bg-rose-50 text-rose-400 hover:text-rose-600 transition-colors"
                      >
                        <Trash2 size={15} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* ── Batch info note ────────────────────────────────────── */}
        {lineItems.length > 0 && (
          <p className="text-xs text-[#A89080] -mt-2">
            Each purchase creates a new batch entry — the same item can be purchased at different prices and tracked separately.
          </p>
        )}

        {/* ── Footer ─────────────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 pt-2 border-t border-[#F0EBE5]">
          {/* Note */}
          <div className="w-full sm:w-64">
            <label className={labelCls}>Note (optional)</label>
            <input
              value={note}
              onChange={e => setNote(e.target.value)}
              placeholder="e.g. Received at warehouse"
              className={inputCls}
            />
          </div>

          {/* Totals */}
          <div className="space-y-2 text-right">
            <div className="flex items-center justify-end gap-4">
              <span className="text-sm text-[#7A6055]">Grand Total</span>
              <span className="text-2xl font-black text-[#1A1210]">
                <CurrencySymbol className="w-5 h-5 mr-1" /> {grandTotal.toLocaleString("en-IN")}
              </span>
            </div>
            <div className="flex items-center justify-end gap-3">
              <label className="text-sm text-[#7A6055]">Paid Amount</label>
              <input
                type="number" min={0} max={grandTotal} value={paidAmount}
                onChange={e => setPaidAmount(Math.min(grandTotal, Math.max(0, Number(e.target.value))))}
                className={`w-36 rounded-lg border px-3 py-1.5 text-sm text-right bg-white focus:outline-none focus:ring-2 ${
                  paidAmount > grandTotal
                    ? "border-rose-400 focus:ring-rose-300 text-rose-600"
                    : "border-[#E5DDD5] focus:ring-[#C9A84C]/30"
                }`}
              />
            </div>
            {paidAmount > grandTotal && (
              <p className="text-xs text-rose-500 text-right">Paid amount cannot exceed Grand Total ({grandTotal.toLocaleString("en-IN")})</p>
            )}
          </div>
        </div>

        {/* Error */}
        {formError && (
          <p className="text-sm text-rose-600 bg-rose-50 border border-rose-200 rounded-lg px-4 py-2">
            {formError}
          </p>
        )}
      </form>
    </Modal>
  );
}

"use client";
import { useEffect, useState } from "react";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import {
  Package, Ruler, Tag, Layers, Palette,
  Plus, Trash2, X, Info, ShoppingCart, Hammer,
} from "lucide-react";
import axios from "axios";
import CurrencySymbol from "@/components/ui/CurrencySymbol";

// ── constants ─────────────────────────────────────────────────────────────────
const CATEGORIES = ["Sofa", "Bed", "Chair", "Table", "Wardrobe", "Office", "Dining", "Other"];
const DIM_UNITS  = ["cm", "inch", "mm", "ft"];

const MFG_TABS = [
  { id: "basic",      label: "Basic Info",  icon: Package },
  { id: "dimensions", label: "Dimensions",  icon: Ruler   },
  { id: "pricing",    label: "Pricing",     icon: Tag     },
  { id: "bom",        label: "BOM",         icon: Layers  },
];

const BUY_TABS = [
  { id: "basic",      label: "Basic Info",  icon: Package },
  { id: "dimensions", label: "Dimensions",  icon: Ruler   },
  { id: "pricing",    label: "Pricing",     icon: Tag     },
];


// ── types ─────────────────────────────────────────────────────────────────────
interface BomRow {
  materialId:   string;
  materialName: string;
  materialCode: string;
  unit:         string;
  batchNumber:  string;
  pricePerUnit: number;
  availableQty: number;
  quantity:     number;
  subtotal:     number;
}

type Mode = "manufacture" | "direct";

interface FormState {
  productName:     string;
  productCode:     string;
  category:        string;
  primaryMaterial: string;
  color:           string;
  status:          string;
  isManufactured:  boolean;
  description:     string;
  currentStock:    number;
  dimensions: { width: string; height: string; depth: string; weight: string; unit: string };
  pricing: {
    materialCost:  number;
    laborCost:     number;
    extraCost:     number;
    totalCost:     number;
    profitMargin:  number;
    sellingPrice:  number;
    discountPrice: number;
    purchasePrice: number;
    salesPrice:    number;
  };
  bom:      BomRow[];
  variants: { colors: string[]; sizes: string[]; finishes: string[] };
}

function makeEmpty(mode: Mode): FormState {
  return {
    productName: "", productCode: "", category: "Sofa",
    primaryMaterial: "", color: "",
    status: "active", isManufactured: mode === "manufacture", description: "",
    currentStock: 0,
    dimensions: { width: "", height: "", depth: "", weight: "", unit: "cm" },
    pricing: { materialCost: 0, laborCost: 0, extraCost: 0, totalCost: 0, profitMargin: 0, sellingPrice: 0, discountPrice: 0, purchasePrice: 0, salesPrice: 0 },
    bom: [],
    variants: { colors: [], sizes: [], finishes: [] },
  };
}

function autoCode(category: string) {
  const map: Record<string, string> = {
    Sofa: "SOF", Bed: "BED", Chair: "CHR", Table: "TBL",
    Wardrobe: "WRD", Office: "OFC", Dining: "DIN", Other: "PRD",
  };
  return `${map[category] || "PRD"}-${Math.floor(100 + Math.random() * 900)}`;
}

// ── chip input ────────────────────────────────────────────────────────────────
function ChipInput({ label, values, onChange }: { label: string; values: string[]; onChange: (v: string[]) => void }) {
  const [input, setInput] = useState("");
  function add() {
    const v = input.trim();
    if (v && !values.includes(v)) onChange([...values, v]);
    setInput("");
  }
  return (
    <div>
      <label className="block text-xs font-semibold text-[#7A6055] mb-1.5">{label}</label>
      <div className="flex flex-wrap gap-1.5 mb-2 min-h-8">
        {values.map(v => (
          <span key={v} className="inline-flex items-center gap-1 bg-[#1B3A2D] text-white text-xs font-medium px-2.5 py-1 rounded-full">
            {v}
            <button type="button" onClick={() => onChange(values.filter(x => x !== v))} className="opacity-60 hover:opacity-100">
              <X size={11} />
            </button>
          </span>
        ))}
        {values.length === 0 && <span className="text-xs text-[#C5B8B0] italic self-center">None added yet</span>}
      </div>
      <div className="flex gap-2">
        <input value={input} onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); add(); } }}
          placeholder="Type and press Enter…"
          className="flex-1 border border-[#E5DDD5] rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#C9A84C]/40" />
        <button type="button" onClick={add} className="px-3 py-1.5 rounded-lg bg-[#E8F0EC] text-[#1B3A2D] text-sm font-semibold hover:bg-[#D0E4D8]">
          Add
        </button>
      </div>
    </div>
  );
}

// ── dimension preview ─────────────────────────────────────────────────────────
function DimPreview({ d }: { d: FormState["dimensions"] }) {
  return (
    <div className="flex flex-col items-center justify-center bg-[#FAF8F6] rounded-2xl border border-[#E5DDD5] p-6 gap-4">
      <div className="w-32 h-22 border-2 border-[#C9A84C] rounded-xl relative flex items-center justify-center bg-white shadow-sm px-2">
        <span className="text-xs font-mono text-[#C9A84C] text-center leading-relaxed">
          {d.width || "W"} × {d.height || "H"} × {d.depth || "D"}
        </span>
        <span className="absolute -bottom-5 left-0 right-0 text-center text-[10px] text-[#A89080]">Width</span>
        <span className="absolute top-0 -right-8 h-full flex items-center text-[10px] text-[#A89080] -rotate-90 origin-center" style={{ writingMode: "vertical-rl" }}>Height</span>
      </div>
      <p className="text-xs text-[#A89080] mt-3">W × H × D ({d.unit})</p>
      {d.weight && <p className="text-xs text-[#C9A84C] font-semibold">⚖ {d.weight} kg</p>}
    </div>
  );
}

// ── main component ────────────────────────────────────────────────────────────
interface ProductModalProps {
  open: boolean; onClose: () => void;
  onSubmit: (data: any) => Promise<void>;
  product?: any | null; loading?: boolean;
}

export default function ProductModal({ open, onClose, onSubmit, product, loading }: ProductModalProps) {
  const [mode,      setMode]      = useState<Mode>("manufacture");
  const [tab,       setTab]       = useState("basic");
  const [form,      setForm]      = useState<FormState>(makeEmpty("manufacture"));
  const [materials, setMaterials] = useState<any[]>([]);
  const [errors,    setErrors]    = useState<Record<string, string>>({});
  const isEdit = !!product;

  const TABS = mode === "manufacture" ? MFG_TABS : BUY_TABS;

  // ── style helpers ─────────────────────────────────────────────────────────
  const lbl   = "block text-xs font-semibold text-[#7A6055] mb-1";
  const inp   = "w-full border border-[#E5DDD5] rounded-lg px-3 py-2 text-sm bg-white text-[#1A1210] focus:outline-none focus:ring-2 focus:ring-[#C9A84C]/40";
  const roInp = `${inp} bg-[#F5F2EA] text-[#A89080] cursor-not-allowed`;

  // ── load materials ────────────────────────────────────────────────────────
  useEffect(() => {
    if (!open) return;
    axios.get("/api/materials").then(r => setMaterials(r.data.data || [])).catch(() => {});
  }, [open]);

  // ── populate form ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (!open) return;
    setTab("basic");
    setErrors({});
    if (product) {
      const m: Mode = product.isManufactured ? "manufacture" : "direct";
      setMode(m);
      setForm({
        productName:     product.name || "",
        productCode:     product.itemNumber || "",
        category:        product.category || "Sofa",
        primaryMaterial: product.primaryMaterial !== "—" ? (product.primaryMaterial || "") : "",
        color:           product.color || "",
        status:          product.status || "active",
        isManufactured:  !!product.isManufactured,
        description:     product.description || "",
        currentStock:    product.quantity ?? 0,
        dimensions: {
          width:  product.dimensions?.width  ?? "",
          height: product.dimensions?.height ?? "",
          depth:  product.dimensions?.depth  ?? "",
          weight: product.dimensions?.weight ?? "",
          unit:   product.dimensions?.unit   || "cm",
        },
        pricing: {
          materialCost:  product.pricing?.materialCost  ?? product.purchaseAmount ?? 0,
          laborCost:     product.pricing?.laborCost     ?? 0,
          extraCost:     product.pricing?.extraCost     ?? 0,
          totalCost:     product.pricing?.totalCost     ?? product.purchaseAmount ?? 0,
          profitMargin:  product.pricing?.profitMargin  ?? 0,
          sellingPrice:  product.pricing?.sellingPrice  ?? product.salesAmount ?? 0,
          discountPrice: product.pricing?.discountPrice ?? product.mrp ?? 0,
          purchasePrice: product.pricing?.purchasePrice ?? product.purchaseAmount ?? 0,
          salesPrice:    product.pricing?.salesPrice    ?? product.salesAmount ?? 0,
        },
        bom: (product.bom || []).map((r: any) => ({
          materialId:   String(r.materialId   || ""),
          materialName: String(r.materialName || ""),
          materialCode: String(r.materialCode || ""),
          unit:         String(r.unit         || ""),
          batchNumber:  String(r.batchNumber  || ""),
          pricePerUnit: Number(r.pricePerUnit || 0),
          availableQty: Number(r.availableQty || 0),
          quantity:     Number(r.quantity     || 1),
          subtotal:     Number(r.subtotal     || 0),
        })),
        variants: { colors: [], sizes: [], finishes: [] },

      });
    } else {
      const m: Mode = "manufacture";
      setMode(m);
      const empty = makeEmpty(m);
      empty.productCode = autoCode("Sofa");
      setForm(empty);
    }
  }, [open, product]);

  // ── switch mode ───────────────────────────────────────────────────────────
  function switchMode(m: Mode) {
    setMode(m);
    setTab("basic");
    setForm(prev => ({ ...prev, isManufactured: m === "manufacture" }));
  }

  // ── category change ───────────────────────────────────────────────────────
  function setCategory(cat: string) {
    setForm(prev => ({
      ...prev, category: cat,
      productCode: isEdit ? prev.productCode : autoCode(cat),
    }));
  }

  // ── pricing helpers ───────────────────────────────────────────────────────
  function recalcPricing(base: FormState["pricing"]) {
    const total = base.materialCost + base.laborCost + base.extraCost;
    const sell  = Math.round(total * (1 + base.profitMargin / 100));
    return { ...base, totalCost: total, sellingPrice: sell };
  }

  function setPricingField(key: keyof FormState["pricing"], value: number) {
    setForm(prev => {
      const p = { ...prev.pricing, [key]: value };
      if (["materialCost", "laborCost", "extraCost", "profitMargin"].includes(key)) {
        return { ...prev, pricing: recalcPricing(p) };
      }
      return { ...prev, pricing: p };
    });
  }

  // ── BOM helpers ───────────────────────────────────────────────────────────
  function addBomRow() {
    setForm(prev => ({
      ...prev,
      bom: [...prev.bom, { materialId: "", materialName: "", materialCode: "", unit: "", batchNumber: "", pricePerUnit: 0, availableQty: 0, quantity: 1, subtotal: 0 }],
    }));
  }

  function updateBomMaterial(idx: number, matId: string) {
    const mat = materials.find(m => m._id === matId);
    setForm(prev => ({
      ...prev,
      bom: prev.bom.map((r, i) => i !== idx ? r : {
        ...r,
        materialId:   matId,
        materialName: mat?.name || "",
        materialCode: mat?.code || "",
        unit:         mat?.unit || "",
        batchNumber:  "", pricePerUnit: 0, availableQty: 0, quantity: 1, subtotal: 0,
      }),
    }));
  }

  function updateBomBatch(idx: number, batchNumber: string) {
    const mat = materials.find(m => m._id === form.bom[idx]?.materialId);
    const batch = mat?.batches?.find((b: any) => b.batchNumber === batchNumber);
    setForm(prev => {
      const updatedBom = prev.bom.map((r, i) => {
        if (i !== idx) return r;
        const price = batch?.purchasePrice || 0;
        const avail = batch?.quantity      || 0;
        const qty   = Math.min(r.quantity, avail) || 1;
        return { ...r, batchNumber, pricePerUnit: price, availableQty: avail, quantity: qty, subtotal: price * qty };
      });
      const matCost = updatedBom.reduce((s, r) => s + r.subtotal, 0);
      return { ...prev, bom: updatedBom, pricing: recalcPricing({ ...prev.pricing, materialCost: matCost }) };
    });
  }

  function updateBomQty(idx: number, qty: number) {
    setForm(prev => {
      const updatedBom = prev.bom.map((r, i) => {
        if (i !== idx) return r;
        const safe = Math.max(0.01, Math.min(qty, r.availableQty || qty));
        return { ...r, quantity: safe, subtotal: r.pricePerUnit * safe };
      });
      const matCost = updatedBom.reduce((s, r) => s + r.subtotal, 0);
      return { ...prev, bom: updatedBom, pricing: recalcPricing({ ...prev.pricing, materialCost: matCost }) };
    });
  }

  function removeBomRow(idx: number) {
    setForm(prev => {
      const updatedBom = prev.bom.filter((_, i) => i !== idx);
      const matCost    = updatedBom.reduce((s, r) => s + r.subtotal, 0);
      return { ...prev, bom: updatedBom, pricing: recalcPricing({ ...prev.pricing, materialCost: matCost }) };
    });
  }

  // ── submit ────────────────────────────────────────────────────────────────
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errs: Record<string, string> = {};
    let errorTab = "basic";
    if (!form.productName.trim()) { errs.productName = "Product name is required"; }
    if (form.currentStock < 0) { errs.currentStock = "Current stock cannot be negative"; }
    if (mode === "direct") {
      if (form.pricing.purchasePrice < 0) { errs.purchasePrice = "Purchase price cannot be negative"; errorTab = "pricing"; }
      if (form.pricing.salesPrice < 0) { errs.salesPrice = "Sales price cannot be negative"; errorTab = "pricing"; }
    } else {
      if (form.pricing.laborCost < 0) { errs.laborCost = "Labour cost cannot be negative"; errorTab = "pricing"; }
      if (form.pricing.extraCost < 0) { errs.extraCost = "Overhead cost cannot be negative"; errorTab = "pricing"; }
    }
    if (Object.keys(errs).length) { 
      setErrors(errs); 
      if (errs.productName || errs.currentStock) setTab("basic");
      else setTab(errorTab);
      return; 
    }

    const isDirect = mode === "direct";
    const payload  = {
      name:            form.productName,
      itemNumber:      form.productCode,
      category:        form.category,
      unit:            "Piece",
      status:          form.status,
      isManufactured:  !isDirect,
      description:     form.description,
      primaryMaterial: form.primaryMaterial || "—",
      color:           form.color || "",
      reorderLevel:    0,
      quantity:        form.currentStock,
      purchaseAmount: isDirect ? form.pricing.purchasePrice : form.pricing.totalCost,
      salesAmount:    isDirect ? form.pricing.salesPrice    : form.pricing.sellingPrice,
      mrp:            isDirect ? 0                          : form.pricing.discountPrice,
      dimensions: {
        width:  form.dimensions.width  ? Number(form.dimensions.width)  : undefined,
        height: form.dimensions.height ? Number(form.dimensions.height) : undefined,
        depth:  form.dimensions.depth  ? Number(form.dimensions.depth)  : undefined,
        weight: form.dimensions.weight ? Number(form.dimensions.weight) : undefined,
        unit:   form.dimensions.unit,
      },
      pricing:  form.pricing,
      bom:      isDirect ? [] : form.bom.filter(r => r.materialId),
      variants: form.variants,
    };

    await onSubmit(payload);
  }

  // ── render ────────────────────────────────────────────────────────────────
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? `Edit: ${product?.name}` : "Create New Product"}
      size="xl"
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={loading}>Cancel</Button>
          <Button form="product-form" type="submit" loading={loading}>
            {isEdit ? "Update Product" : "Create Product"}
          </Button>
        </>
      }
    >
      {/* Mode toggle — only shown when creating new */}
      {!isEdit && (
        <div className="flex gap-2 mb-5 p-1 bg-[#F5F2EA] rounded-xl">
          <button
            type="button"
            onClick={() => switchMode("manufacture")}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-all ${
              mode === "manufacture"
                ? "bg-[#1B3A2D] text-white shadow-sm"
                : "text-[#7A6055] hover:text-[#1A1210]"
            }`}
          >
            <Hammer size={15} />
            Manufactured Product
          </button>
          <button
            type="button"
            onClick={() => switchMode("direct")}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-all ${
              mode === "direct"
                ? "bg-[#C9A84C] text-white shadow-sm"
                : "text-[#7A6055] hover:text-[#1A1210]"
            }`}
          >
            <ShoppingCart size={15} />
            Direct Buy Product
          </button>
        </div>
      )}

      {/* Tab bar */}
      <div className="flex gap-1 mb-6 border-b border-[#F0EBE5] overflow-x-auto pb-0">
        {TABS.map(t => (
          <button key={t.id} type="button" onClick={() => setTab(t.id)}
            className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-semibold whitespace-nowrap border-b-2 transition-colors -mb-px ${
              tab === t.id ? "border-[#C9A84C] text-[#C9A84C]" : "border-transparent text-[#7A6055] hover:text-[#1A1210]"
            }`}
          >
            <t.icon size={15} />
            {t.label}
          </button>
        ))}
      </div>

      <form id="product-form" onSubmit={handleSubmit} className="min-h-96">

        {/* ── Tab: Basic Info ───────────────────────────────────── */}
        {tab === "basic" && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={lbl}>Product Name *</label>
                <input value={form.productName} onChange={e => setForm(p => ({ ...p, productName: e.target.value }))}
                  placeholder="e.g. 3-Seater Velvet Sofa" className={inp} />
                {errors.productName && <p className="text-xs text-rose-500 mt-1">{errors.productName}</p>}
              </div>
              <div>
                <label className={lbl}>
                  Product Code
                  <span className="ml-1.5 text-[10px] font-normal text-[#A89080] bg-[#F5F2EA] px-1.5 py-0.5 rounded-full">
                    {isEdit ? "read-only" : "auto-generated"}
                  </span>
                </label>
                <input readOnly value={form.productCode} className={roInp} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={lbl}>Category</label>
                <select value={form.category} onChange={e => setCategory(e.target.value)} className={inp}>
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className={lbl}>Status</label>
                <select value={form.status} onChange={e => setForm(p => ({ ...p, status: e.target.value }))} className={inp}>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="discontinued">Discontinued</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={lbl}>Color</label>
                <input
                  value={form.color}
                  onChange={e => setForm(p => ({ ...p, color: e.target.value }))}
                  placeholder="e.g. Brown, Black, White"
                  className={inp}
                />
              </div>
              <div>
                <label className={lbl}>Current Stock</label>
                <input type="number" min={0} value={form.currentStock}
                  onChange={e => setForm(p => ({ ...p, currentStock: Number(e.target.value) }))} className={inp} />
                {errors.currentStock && <p className="text-xs text-rose-500 mt-1">{errors.currentStock}</p>}
              </div>
            </div>


            <div>
              <label className={lbl}>Description</label>
              <textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                rows={3} placeholder="Optional product description…"
                className="w-full border border-[#E5DDD5] rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#C9A84C]/40 resize-none" />
            </div>
          </div>
        )}

        {/* ── Tab: Dimensions ───────────────────────────────────── */}
        {tab === "dimensions" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <p className="text-sm text-[#7A6055]">Enter product dimensions and weight.</p>
              <select value={form.dimensions.unit}
                onChange={e => setForm(p => ({ ...p, dimensions: { ...p.dimensions, unit: e.target.value } }))}
                className="border border-[#E5DDD5] rounded-lg px-3 py-1.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#C9A84C]/40">
                {DIM_UNITS.map(u => <option key={u} value={u}>{u}</option>)}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-6">
              <DimPreview d={form.dimensions} />
              <div className="grid grid-cols-2 gap-4">
                {(["width", "height", "depth"] as const).map(f => (
                  <div key={f}>
                    <label className={lbl}>{f.charAt(0).toUpperCase() + f.slice(1)} ({form.dimensions.unit})</label>
                    <input type="number" min={0} value={(form.dimensions as any)[f]}
                      onChange={e => setForm(p => ({ ...p, dimensions: { ...p.dimensions, [f]: e.target.value } }))}
                      placeholder="0" className={inp} />
                  </div>
                ))}
                <div>
                  <label className={lbl}>Weight (kg)</label>
                  <input type="number" min={0} step="0.1" value={form.dimensions.weight}
                    onChange={e => setForm(p => ({ ...p, dimensions: { ...p.dimensions, weight: e.target.value } }))}
                    placeholder="0" className={inp} />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── Tab: Pricing (Manufactured) ────────────────────────── */}
        {tab === "pricing" && mode === "manufacture" && (
          <div className="space-y-5">
            <div>
              <p className="text-xs font-bold text-[#7A6055] uppercase tracking-wide mb-3">Cost Breakdown</p>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className={lbl}>
                    Material Cost (<CurrencySymbol className="w-3 h-3" />)
                    <span className="ml-1 text-[10px] text-[#A89080]">auto from BOM</span>
                  </label>
                  <input readOnly value={form.pricing.materialCost} className={roInp} />
                </div>
                <div>
                  <label className={lbl}>Labour Cost (<CurrencySymbol className="w-3 h-3" />)</label>
                  <input type="number" min={0} value={form.pricing.laborCost}
                    onChange={e => setPricingField("laborCost", Number(e.target.value))} className={inp} />
                </div>
                <div>
                  <label className={lbl}>Extra / Overhead (<CurrencySymbol className="w-3 h-3" />)</label>
                  <input type="number" min={0} value={form.pricing.extraCost}
                    onChange={e => setPricingField("extraCost", Number(e.target.value))} className={inp} />
                </div>
              </div>
            </div>

            <div className="rounded-xl bg-[#1B3A2D] px-5 py-4 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-white/60 uppercase tracking-wide">Total Cost</p>
                <p className="text-2xl font-black text-white"><CurrencySymbol className="w-5 h-5 mr-1" /> {form.pricing.totalCost.toLocaleString("en-IN")}</p>
              </div>
              <p className="text-xs text-white/40">{form.pricing.materialCost} + {form.pricing.laborCost} + {form.pricing.extraCost}</p>
            </div>

            <div>
              <p className="text-xs font-bold text-[#7A6055] uppercase tracking-wide mb-3">Selling Price</p>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className={lbl}>Profit Margin (%)</label>
                  <input type="number" min={0} value={form.pricing.profitMargin}
                    onChange={e => setPricingField("profitMargin", Number(e.target.value))} className={inp} />
                </div>
                <div>
                  <label className={lbl}>Selling Price (<CurrencySymbol className="w-3 h-3" />) <span className="text-[10px] text-[#A89080]">auto-calculated</span></label>
                  <input type="number" min={0} value={form.pricing.sellingPrice}
                    onChange={e => setForm(p => ({ ...p, pricing: { ...p.pricing, sellingPrice: Number(e.target.value) } }))} className={inp} />
                </div>
                <div>
                  <label className={lbl}>Discount Price (<CurrencySymbol className="w-3 h-3" />)</label>
                  <input type="number" min={0} value={form.pricing.discountPrice}
                    onChange={e => setForm(p => ({ ...p, pricing: { ...p.pricing, discountPrice: Number(e.target.value) } }))} className={inp} />
                </div>
              </div>
            </div>

            {form.pricing.sellingPrice > 0 && form.pricing.totalCost > 0 && (
              <div className="flex gap-3 rounded-xl bg-amber-50 border border-amber-200 px-4 py-3 text-sm text-amber-800">
                <Info size={16} className="shrink-0 mt-0.5 text-amber-500" />
                <span>
                  Profit = <CurrencySymbol className="w-3 h-3 mr-1" /> {(form.pricing.sellingPrice - form.pricing.totalCost).toLocaleString("en-IN")} &nbsp;|&nbsp;
                  Margin = {form.pricing.totalCost > 0 ? (((form.pricing.sellingPrice - form.pricing.totalCost) / form.pricing.totalCost) * 100).toFixed(1) : 0}%
                </span>
              </div>
            )}
          </div>
        )}

        {/* ── Tab: Pricing (Direct Buy) ──────────────────────────── */}
        {tab === "pricing" && mode === "direct" && (
          <div className="space-y-5">
            <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 flex gap-3 text-sm text-amber-800">
              <ShoppingCart size={16} className="shrink-0 mt-0.5 text-amber-500" />
              <span>Direct Buy mode — enter the price you pay to your supplier and the price you sell to customers.</span>
            </div>
            <div className="grid grid-cols-2 gap-6">
              <div className="rounded-xl border border-[#E5DDD5] p-5 space-y-3">
                <p className="text-xs font-bold text-[#7A6055] uppercase tracking-wide">Purchase Price</p>
                <p className="text-xs text-[#A89080]">What you pay the supplier</p>
                <input type="number" min={0} value={form.pricing.purchasePrice}
                  onChange={e => setForm(p => ({ ...p, pricing: { ...p.pricing, purchasePrice: Number(e.target.value) } }))}
                  className="w-full border border-[#E5DDD5] rounded-lg px-3 py-2 text-lg font-bold bg-white text-[#1A1210] focus:outline-none focus:ring-2 focus:ring-[#C9A84C]/40" placeholder="0" />
              </div>
              <div className="rounded-xl border border-[#1B3A2D]/20 bg-[#E8F0EC] p-5 space-y-3">
                <p className="text-xs font-bold text-[#1B3A2D] uppercase tracking-wide">Sales Price</p>
                <p className="text-xs text-[#4A7A63]">What you charge the customer</p>
                <input type="number" min={0} value={form.pricing.salesPrice}
                  onChange={e => setForm(p => ({ ...p, pricing: { ...p.pricing, salesPrice: Number(e.target.value) } }))}
                  className="w-full border border-[#1B3A2D]/30 rounded-lg px-3 py-2 text-lg font-bold bg-white text-[#1A1210] focus:outline-none focus:ring-2 focus:ring-[#1B3A2D]/30" placeholder="0" />
              </div>
            </div>
            {form.pricing.salesPrice > 0 && form.pricing.purchasePrice > 0 && (
              <div className="flex gap-3 rounded-xl bg-amber-50 border border-amber-200 px-4 py-3 text-sm text-amber-800">
                <Info size={16} className="shrink-0 mt-0.5 text-amber-500" />
                <span>
                  Profit = <CurrencySymbol className="w-3 h-3 mr-1" /> {(form.pricing.salesPrice - form.pricing.purchasePrice).toLocaleString("en-IN")} &nbsp;|&nbsp;
                  Margin = {((( form.pricing.salesPrice - form.pricing.purchasePrice) / form.pricing.purchasePrice) * 100).toFixed(1)}%
                </span>
              </div>
            )}
          </div>
        )}

        {/* ── Tab: BOM ──────────────────────────────────────────── */}
        {tab === "bom" && mode === "manufacture" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-bold text-[#1A1210]">Bill of Materials</p>
                <p className="text-xs text-[#7A6055]">Select material + batch — quantity is limited to available batch stock.</p>
              </div>
              <button type="button" onClick={addBomRow}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold bg-[#1B3A2D] text-white hover:bg-[#163222] transition-colors">
                <Plus size={14} /> Add Material
              </button>
            </div>

            <div className="rounded-xl border border-[#E5DDD5] overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-[#FAF8F6] border-b border-[#E5DDD5]">
                  <tr>
                    <th className="py-2.5 px-3 text-left text-xs font-bold text-[#7A6055] uppercase">Material</th>
                    <th className="py-2.5 px-3 text-left text-xs font-bold text-[#7A6055] uppercase">Batch</th>
                    <th className="py-2.5 px-3 text-right text-xs font-bold text-[#7A6055] uppercase w-20">Price/Unit</th>
                    <th className="py-2.5 px-3 text-center text-xs font-bold text-[#7A6055] uppercase w-24">Qty</th>
                    <th className="py-2.5 px-3 text-right text-xs font-bold text-[#7A6055] uppercase w-24">Subtotal</th>
                    <th className="w-8"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F0EBE5]">
                  {form.bom.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-10 text-center text-[#A89080] text-sm">
                        Click <strong>Add Material</strong> to build the BOM.
                      </td>
                    </tr>
                  ) : form.bom.map((row, idx) => {
                    const mat     = materials.find(m => m._id === row.materialId);
                    const batches = mat?.batches || [];
                    return (
                      <tr key={idx} className="hover:bg-[#FAF8F6]">
                        {/* Material select */}
                        <td className="px-3 py-2">
                          <select value={row.materialId} onChange={e => updateBomMaterial(idx, e.target.value)}
                            className="w-full rounded-lg border border-[#E5DDD5] px-2 py-1.5 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-[#C9A84C]/40">
                            <option value="">— Select —</option>
                            {materials.map(m => (
                              <option key={m._id} value={m._id}>{m.name} ({m.code})</option>
                            ))}
                          </select>
                        </td>

                        {/* Batch select */}
                        <td className="px-3 py-2">
                          {row.materialId ? (
                            batches.length > 0 ? (
                              <select value={row.batchNumber} onChange={e => updateBomBatch(idx, e.target.value)}
                                className="w-full rounded-lg border border-[#E5DDD5] px-2 py-1.5 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-[#C9A84C]/40">
                                <option value="">— Select Batch —</option>
                                {batches.map((b: any, bi: number) => (
                                  <option key={bi} value={b.batchNumber}>
                                    {b.batchNumber || `Batch ${bi + 1}`} — <CurrencySymbol plain />{b.purchasePrice} | {b.quantity} {row.unit}
                                  </option>
                                ))}
                              </select>
                            ) : (
                              <span className="text-xs text-[#A89080] italic">No batches</span>
                            )
                          ) : (
                            <span className="text-xs text-[#C5B8B0] italic">Select material first</span>
                          )}
                          {/* Available qty indicator */}
                          {row.batchNumber && (
                            <p className="text-[10px] text-[#A89080] mt-0.5">
                              Available: <span className={row.quantity >= row.availableQty ? "text-rose-500 font-semibold" : "text-green-600 font-semibold"}>{row.availableQty} {row.unit}</span>
                            </p>
                          )}
                        </td>

                        {/* Price per unit (read-only) */}
                        <td className="px-3 py-2 text-right font-mono text-xs text-[#7A6055]">
                          {row.pricePerUnit > 0 ? <><CurrencySymbol className="w-3 h-3 mr-1" /> {row.pricePerUnit}</> : "—"}
                        </td>

                        {/* Qty */}
                        <td className="px-3 py-2">
                          <input type="number" min={0.01} step="0.01"
                            value={row.quantity}
                            max={row.availableQty || undefined}
                            disabled={!row.batchNumber}
                            onChange={e => updateBomQty(idx, Number(e.target.value))}
                            className={`w-full rounded-lg border text-sm text-center px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-[#C9A84C]/40 ${
                              !row.batchNumber ? "bg-[#F5F2EA] text-[#A89080] border-[#E5DDD5] cursor-not-allowed" : "bg-white border-[#E5DDD5]"
                            }`} />
                        </td>

                        {/* Subtotal */}
                        <td className="px-3 py-2 text-right font-semibold text-[#1A1210] text-xs">
                          {row.subtotal > 0 ? <><CurrencySymbol className="w-3 h-3 mr-1" /> {row.subtotal.toLocaleString("en-IN")}</> : "—"}
                        </td>

                        {/* Remove */}
                        <td className="px-2 py-2 text-center">
                          <button type="button" onClick={() => removeBomRow(idx)}
                            className="p-1 rounded-lg hover:bg-rose-50 text-rose-400 hover:text-rose-600 transition-colors">
                            <Trash2 size={14} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                {form.bom.length > 0 && (
                  <tfoot>
                    <tr className="border-t-2 border-[#E5DDD5] bg-[#FAF8F6]">
                      <td colSpan={4} className="px-3 py-2.5 text-xs font-bold text-[#7A6055]">Total Material Cost</td>
                      <td className="px-3 py-2.5 text-right text-sm font-black text-[#1B3A2D]">
                        <CurrencySymbol className="w-3 h-3 mr-1" /> {form.pricing.materialCost.toLocaleString("en-IN")}
                      </td>
                      <td />
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>

            {form.bom.some(r => r.batchNumber && r.quantity >= r.availableQty) && (
              <div className="flex gap-2 rounded-lg bg-rose-50 border border-rose-200 px-4 py-2.5 text-xs text-rose-700">
                <Info size={14} className="shrink-0 mt-0.5" />
                Some rows are using the full available batch quantity. Check stock before saving.
              </div>
            )}
          </div>
        )}

        {/* ── Tab: Variants ─────────────────────────────────────── */}
        {tab === "variants" && (
          <div className="space-y-6">
            <p className="text-sm text-[#7A6055]">Add available colors, sizes, and finishes. Type and press <kbd className="px-1.5 py-0.5 bg-[#F5F2EA] rounded text-xs border border-[#E5DDD5] font-mono">Enter</kbd> to add.</p>
            <ChipInput label="Colors"   values={form.variants.colors}   onChange={v => setForm(p => ({ ...p, variants: { ...p.variants, colors: v } }))} />
            <ChipInput label="Sizes"    values={form.variants.sizes}    onChange={v => setForm(p => ({ ...p, variants: { ...p.variants, sizes: v } }))} />
            <ChipInput label="Finishes" values={form.variants.finishes} onChange={v => setForm(p => ({ ...p, variants: { ...p.variants, finishes: v } }))} />

            {(form.variants.colors.length > 0 || form.variants.sizes.length > 0 || form.variants.finishes.length > 0) && (
              <div className="rounded-xl bg-[#FAF8F6] border border-[#E5DDD5] p-4 space-y-2">
                <p className="text-xs font-bold text-[#7A6055] uppercase tracking-wide">Preview</p>
                {["colors", "sizes", "finishes"].map(key => {
                  const vals = (form.variants as any)[key] as string[];
                  if (!vals.length) return null;
                  return (
                    <div key={key} className="flex items-center gap-2 flex-wrap">
                      <span className="text-[#A89080] w-16 text-xs capitalize">{key}:</span>
                      {vals.map(v => (
                        <span key={v} className="px-2 py-0.5 rounded-full bg-white border border-[#E5DDD5] text-xs text-[#1A1210]">{v}</span>
                      ))}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </form>
    </Modal>
  );
}

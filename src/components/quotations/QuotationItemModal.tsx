"use client";
import { useState, useEffect } from "react";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import {
  Package,
  Ruler,
  Tag,
  Layers,
  Search,
  Info,
  Plus,
  Trash2,
} from "lucide-react";
import axios from "axios";
import CurrencySymbol from "@/components/ui/CurrencySymbol";
import { IQuotationItem } from "@/types";
import { useLanguage } from "../../context/LanguageContext";

// ── constants ──────────────────────────────────────────────────────────────────
const CATEGORIES = [
  "Sofa",
  "Bed",
  "Chair",
  "Table",
  "Wardrobe",
  "Office",
  "Dining",
  "Other",
];
const DIM_UNITS = ["cm", "inch", "mm", "ft"];

const TABS = [
  { id: "basic", label: "Basic Info", icon: Package },
  { id: "dimensions", label: "Dimensions", icon: Ruler },
  { id: "pricing", label: "Pricing", icon: Tag },
  { id: "bom", label: "BOM", icon: Layers },
];

// ── types ──────────────────────────────────────────────────────────────────────
interface BomRow {
  materialId: string;
  materialName: string;
  materialCode: string;
  unit: string;
  batchNumber: string;
  pricePerUnit: number;
  availableQty: number;
  quantity: number;
  subtotal: number;
}

interface FormState {
  productName: string;
  category: string;
  color: string;
  description: string;
  quantity: number;
  dimensions: {
    width: string;
    height: string;
    depth: string;
    weight: string;
    unit: string;
  };
  pricing: {
    materialCost: number;
    laborCost: number;
    extraCost: number;
    totalCost: number;
    profitMargin: number;
    sellingPrice: number;
    discountPrice: number;
  };
  bom: BomRow[];
}

function makeEmpty(): FormState {
  return {
    productName: "",
    category: "Sofa",
    color: "",
    description: "",
    quantity: 1,
    dimensions: { width: "", height: "", depth: "", weight: "", unit: "cm" },
    pricing: {
      materialCost: 0,
      laborCost: 0,
      extraCost: 0,
      totalCost: 0,
      profitMargin: 0,
      sellingPrice: 0,
      discountPrice: 0,
    },
    bom: [],
  };
}

// ── dimension preview (copied from ProductModal) ───────────────────────────────
function DimPreview({ d }: { d: FormState["dimensions"] }) {
  const { t } = useLanguage();
  return (
    <div className="flex flex-col items-center justify-center bg-[#FAF8F6] rounded-2xl border border-[#E5DDD5] p-6 gap-4">
      <div className="w-32 h-22 border-2 border-[#C9A84C] rounded-xl relative flex items-center justify-center bg-white shadow-sm px-2">
        <span className="text-xs font-mono text-[#C9A84C] text-center leading-relaxed">
          {d.width || "W"} × {d.height || "H"} × {d.depth || "D"}
        </span>
        <span className="absolute -bottom-5 start-0 end-0 text-center text-[10px] text-[#A89080]">
          {t("width")}
        </span>
        <span
          className="absolute top-0 -right-8 h-full flex items-center text-[10px] text-[#A89080] -rotate-90 origin-center"
          style={{ writingMode: "vertical-rl" }}
        >
          {t("height")}
        </span>
      </div>
      <p className="text-xs text-[#A89080] mt-3">
        {t("wHD")}
        {d.unit})
      </p>
      {d.weight && (
        <p className="text-xs text-[#C9A84C] font-semibold">
          ⚖ {d.weight} {t("kg")}
        </p>
      )}
    </div>
  );
}

// ── props ──────────────────────────────────────────────────────────────────────
interface Props {
  open: boolean;
  onClose: () => void;
  onSubmit: (item: IQuotationItem) => void;
  editItem?: IQuotationItem | null;
  loading?: boolean;
}

// ── component ──────────────────────────────────────────────────────────────────
export default function QuotationItemModal({
  open,
  onClose,
  onSubmit,
  editItem,
  loading,
}: Props) {
  const { t } = useLanguage();
  const [tab, setTab] = useState("basic");
  const [form, setForm] = useState<FormState>(makeEmpty());
  const [products, setProducts] = useState<any[]>([]);
  const [materials, setMaterials] = useState<any[]>([]);
  const [fetching, setFetching] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const lbl = "block text-xs font-semibold text-[#7A6055] mb-1";
  const inp =
    "w-full border border-[#E5DDD5] rounded-lg px-3 py-2 text-sm bg-white text-[#1A1210] focus:outline-none focus:ring-2 focus:ring-[#C9A84C]/40";
  const roInp = `${inp} bg-[#F5F2EA] text-[#A89080] cursor-not-allowed`;

  // ── load reference data ────────────────────────────────────────────────────
  useEffect(() => {
    if (!open) return;
    setFetching(true);
    Promise.all([
      axios.get("/api/items?limit=500"),
      axios.get("/api/materials"),
    ])
      .then(([ir, mr]) => {
        setProducts(ir.data.data || []);
        setMaterials(mr.data.data || []);
      })
      .catch(() => {})
      .finally(() => setFetching(false));
  }, [open]);

  // ── populate form ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (!open) return;
    setTab("basic");
    setErrors({});
    if (editItem) {
      setForm({
        productName: editItem.itemName,
        category: (editItem as any).category || "Sofa",
        color: editItem.color || "",
        description: editItem.description || "",
        quantity: editItem.quantity,
        dimensions: {
          width: String(editItem.dimensions?.width ?? ""),
          height: String(editItem.dimensions?.height ?? ""),
          depth: String(editItem.dimensions?.depth ?? ""),
          weight: String(editItem.dimensions?.weight ?? ""),
          unit: editItem.dimensions?.unit || "cm",
        },
        pricing: {
          materialCost: (editItem as any).pricing?.materialCost ?? 0,
          laborCost: (editItem as any).pricing?.laborCost ?? 0,
          extraCost: (editItem as any).pricing?.extraCost ?? 0,
          totalCost: (editItem as any).pricing?.totalCost ?? 0,
          profitMargin: (editItem as any).pricing?.profitMargin ?? 0,
          sellingPrice: editItem.price || 0,
          discountPrice: (editItem as any).pricing?.discountPrice ?? 0,
        },
        bom: (editItem.bom || []).map((b) => ({
          materialId: b.materialId || "",
          materialName: b.materialName || "",
          materialCode: b.materialCode || "",
          unit: b.unit || "",
          batchNumber: (b as any).batchNumber || "",
          pricePerUnit: (b as any).pricePerUnit || 0,
          availableQty: (b as any).availableQty || 0,
          quantity: b.quantity || 1,
          subtotal: (b as any).subtotal || 0,
        })),
      });
    } else {
      setForm(makeEmpty());
    }
  }, [open, editItem]);

  // ── pre-fill from existing product ────────────────────────────────────────
  function handleProductSelect(productId: string) {
    const p = products.find((x) => x._id === productId);
    if (!p) return;
    setForm((prev) => ({
      ...prev,
      productName: p.name,
      category: p.category || "Sofa",
      color: p.color || "",
      description: p.description || "",
      dimensions: {
        width: String(p.dimensions?.width ?? ""),
        height: String(p.dimensions?.height ?? ""),
        depth: String(p.dimensions?.depth ?? ""),
        weight: String(p.dimensions?.weight ?? ""),
        unit: p.dimensions?.unit || "cm",
      },
      pricing: {
        ...prev.pricing,
        materialCost: p.pricing?.materialCost ?? 0,
        laborCost: p.pricing?.laborCost ?? 0,
        extraCost: p.pricing?.extraCost ?? 0,
        totalCost: p.pricing?.totalCost ?? 0,
        profitMargin: p.pricing?.profitMargin ?? 0,
        sellingPrice: p.pricing?.sellingPrice ?? p.salesAmount ?? 0,
        discountPrice: p.pricing?.discountPrice ?? p.mrp ?? 0,
      },
      bom: (p.bom || []).map((b: any) => ({
        materialId: String(b.materialId || ""),
        materialName: String(b.materialName || ""),
        materialCode: String(b.materialCode || ""),
        unit: String(b.unit || ""),
        batchNumber: "",
        pricePerUnit: 0,
        availableQty: 0,
        quantity: Number(b.quantity || 1),
        subtotal: 0,
      })),
    }));
  }

  // ── pricing helpers (same as ProductModal) ─────────────────────────────────
  function recalcPricing(base: FormState["pricing"]) {
    const total = base.materialCost + base.laborCost + base.extraCost;
    const sell = Math.round(total * (1 + base.profitMargin / 100));
    return { ...base, totalCost: total, sellingPrice: sell };
  }

  function setPricingField(key: keyof FormState["pricing"], value: number) {
    setForm((prev) => {
      const p = { ...prev.pricing, [key]: value };
      if (
        ["materialCost", "laborCost", "extraCost", "profitMargin"].includes(key)
      ) {
        return { ...prev, pricing: recalcPricing(p) };
      }
      return { ...prev, pricing: p };
    });
  }

  // ── BOM helpers (same as ProductModal) ────────────────────────────────────
  function addBomRow() {
    setForm((prev) => ({
      ...prev,
      bom: [
        ...prev.bom,
        {
          materialId: "",
          materialName: "",
          materialCode: "",
          unit: "",
          batchNumber: "",
          pricePerUnit: 0,
          availableQty: 0,
          quantity: 1,
          subtotal: 0,
        },
      ],
    }));
  }

  function updateBomMaterial(idx: number, matId: string) {
    const mat = materials.find((m) => m._id === matId);
    setForm((prev) => ({
      ...prev,
      bom: prev.bom.map((r, i) =>
        i !== idx
          ? r
          : {
              ...r,
              materialId: matId,
              materialName: mat?.name || "",
              materialCode: mat?.code || "",
              unit: mat?.unit || "",
              batchNumber: "",
              pricePerUnit: 0,
              availableQty: 0,
              quantity: 1,
              subtotal: 0,
            },
      ),
    }));
  }

  function updateBomBatch(idx: number, batchNumber: string) {
    const mat = materials.find((m) => m._id === form.bom[idx]?.materialId);
    const batch = mat?.batches?.find((b: any) => b.batchNumber === batchNumber);
    setForm((prev) => {
      const updatedBom = prev.bom.map((r, i) => {
        if (i !== idx) return r;
        const price = batch?.purchasePrice || 0;
        const avail = batch?.quantity || 0;
        const qty = Math.min(r.quantity, avail) || 1;
        return {
          ...r,
          batchNumber,
          pricePerUnit: price,
          availableQty: avail,
          quantity: qty,
          subtotal: price * qty,
        };
      });
      const matCost = updatedBom.reduce((s, r) => s + r.subtotal, 0);
      return {
        ...prev,
        bom: updatedBom,
        pricing: recalcPricing({ ...prev.pricing, materialCost: matCost }),
      };
    });
  }

  function updateBomQty(idx: number, qty: number) {
    setForm((prev) => {
      const updatedBom = prev.bom.map((r, i) => {
        if (i !== idx) return r;
        const safe = Math.max(0.01, Math.min(qty, r.availableQty || qty));
        return { ...r, quantity: safe, subtotal: r.pricePerUnit * safe };
      });
      const matCost = updatedBom.reduce((s, r) => s + r.subtotal, 0);
      return {
        ...prev,
        bom: updatedBom,
        pricing: recalcPricing({ ...prev.pricing, materialCost: matCost }),
      };
    });
  }

  function removeBomRow(idx: number) {
    setForm((prev) => {
      const updatedBom = prev.bom.filter((_, i) => i !== idx);
      const matCost = updatedBom.reduce((s, r) => s + r.subtotal, 0);
      return {
        ...prev,
        bom: updatedBom,
        pricing: recalcPricing({ ...prev.pricing, materialCost: matCost }),
      };
    });
  }

  // ── submit ─────────────────────────────────────────────────────────────────
  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errs: Record<string, string> = {};
    if (!form.productName.trim()) errs.productName = "Product name is required";
    if (form.pricing.sellingPrice <= 0)
      errs.sellingPrice = "Selling price must be greater than 0";
    if (Object.keys(errs).length) {
      setErrors(errs);
      setTab("basic");
      return;
    }

    onSubmit({
      itemName: form.productName.trim(),
      category: form.category as any,
      description: form.description,
      color: form.color,
      material: "",
      size: "",
      unit: "pcs",
      quantity: form.quantity,
      price: form.pricing.sellingPrice,
      discount: 0,
      total: form.pricing.sellingPrice * form.quantity,
      dimensions: {
        width: form.dimensions.width
          ? Number(form.dimensions.width)
          : undefined,
        height: form.dimensions.height
          ? Number(form.dimensions.height)
          : undefined,
        depth: form.dimensions.depth
          ? Number(form.dimensions.depth)
          : undefined,
        weight: form.dimensions.weight
          ? Number(form.dimensions.weight)
          : undefined,
        unit: form.dimensions.unit,
      },
      pricing: form.pricing as any,
      bom: form.bom
        .filter((r) => r.materialId)
        .map((r) => ({
          materialId: r.materialId,
          materialName: r.materialName,
          materialCode: r.materialCode,
          unit: r.unit,
          batchNumber: r.batchNumber,
          pricePerUnit: r.pricePerUnit,
          quantity: r.quantity,
          subtotal: r.subtotal,
        })),
    } as any);

    onClose();
  }

  // ── render ─────────────────────────────────────────────────────────────────
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={
        editItem ? `Edit: ${editItem.itemName}` : "Add Product to Quotation"
      }
      size="xl"
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={loading}>
            {t("cancel")}
          </Button>
          <Button form="quotation-item-form" type="submit" loading={loading}>
            {editItem ? "Update Product" : "Add Product"}
          </Button>
        </>
      }
    >
      {/* Quick-select existing product */}
      {!editItem && (
        <div className="p-4 bg-[#F5F2EA] rounded-xl border border-[#E5DDD5] mb-5">
          <label className={lbl}>{t("quickSelectExistingProduct")}</label>
          <div className="relative">
            <select
              onChange={(e) => handleProductSelect(e.target.value)}
              className={inp + " ps-10 appearance-none"}
              defaultValue=""
            >
              <option value="" disabled>
                {fetching
                  ? "Loading products…"
                  : "— Choose a product to pre-fill —"}
              </option>
              {products.map((p) => (
                <option key={p._id} value={p._id}>
                  {p.name} ({p.itemNumber})
                </option>
              ))}
            </select>
            <Search
              className="absolute start-3 top-1/2 -translate-y-1/2 text-[#A89080]"
              size={16}
            />
          </div>
        </div>
      )}

      {/* Tab bar — exact same as ProductModal */}
      <div className="flex gap-1 mb-6 border-b border-[#F0EBE5] overflow-x-auto pb-0">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-semibold whitespace-nowrap border-b-2 transition-colors -mb-px ${
              tab === t.id
                ? "border-[#C9A84C] text-[#C9A84C]"
                : "border-transparent text-[#7A6055] hover:text-[#1A1210]"
            }`}
          >
            <t.icon size={15} />
            {t.label}
          </button>
        ))}
      </div>

      <form
        id="quotation-item-form"
        onSubmit={handleSubmit}
        className="min-h-96"
      >
        {/* ── Tab: Basic Info ───────────────────────────────────── */}
        {tab === "basic" && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={lbl}>{t("productName")}</label>
                <input
                  value={form.productName}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, productName: e.target.value }))
                  }
                  placeholder={t("eg3seaterVelvetSofa")}
                  className={inp}
                />
                {errors.productName && (
                  <p className="text-xs text-rose-500 mt-1">
                    {errors.productName}
                  </p>
                )}
              </div>
              <div>
                <label className={lbl}>{t("category")}</label>
                <select
                  value={form.category}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, category: e.target.value }))
                  }
                  className={inp}
                >
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={lbl}>{t("color")}</label>
                <input
                  value={form.color}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, color: e.target.value }))
                  }
                  placeholder={t("egBrownBlackWhite")}
                  className={inp}
                />
              </div>
              <div>
                <label className={lbl}>{t("quantity")}</label>
                <input
                  type="number"
                  min={0.01}
                  step="0.01"
                  value={form.quantity}
                  onChange={(e) =>
                    setForm((p) => ({
                      ...p,
                      quantity: parseFloat(e.target.value) || 1,
                    }))
                  }
                  className={inp}
                />
              </div>
            </div>

            <div>
              <label className={lbl}>{t("description")}</label>
              <textarea
                value={form.description}
                onChange={(e) =>
                  setForm((p) => ({ ...p, description: e.target.value }))
                }
                rows={3}
                placeholder={t("optionalProductDescription")}
                className="w-full border border-[#E5DDD5] rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#C9A84C]/40 resize-none"
              />
            </div>
          </div>
        )}

        {/* ── Tab: Dimensions ───────────────────────────────────── */}
        {tab === "dimensions" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <p className="text-sm text-[#7A6055]">
                {t("enterProductDimensionsAndWeight")}
              </p>
              <select
                value={form.dimensions.unit}
                onChange={(e) =>
                  setForm((p) => ({
                    ...p,
                    dimensions: { ...p.dimensions, unit: e.target.value },
                  }))
                }
                className="border border-[#E5DDD5] rounded-lg px-3 py-1.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#C9A84C]/40"
              >
                {DIM_UNITS.map((u) => (
                  <option key={u} value={u}>
                    {u}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-6">
              <DimPreview d={form.dimensions} />
              <div className="grid grid-cols-2 gap-4">
                {(["width", "height", "depth"] as const).map((f) => (
                  <div key={f}>
                    <label className={lbl}>
                      {f.charAt(0).toUpperCase() + f.slice(1)} (
                      {form.dimensions.unit})
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={form.dimensions[f]}
                      onChange={(e) =>
                        setForm((p) => ({
                          ...p,
                          dimensions: { ...p.dimensions, [f]: e.target.value },
                        }))
                      }
                      placeholder="0"
                      className={inp}
                    />
                  </div>
                ))}
                <div>
                  <label className={lbl}>{t("weightKg")}</label>
                  <input
                    type="number"
                    min={0}
                    step="0.1"
                    value={form.dimensions.weight}
                    onChange={(e) =>
                      setForm((p) => ({
                        ...p,
                        dimensions: { ...p.dimensions, weight: e.target.value },
                      }))
                    }
                    placeholder="0"
                    className={inp}
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── Tab: Pricing ──────────────────────────────────────── */}
        {tab === "pricing" && (
          <div className="space-y-5">
            <div>
              <p className="text-xs font-bold text-[#7A6055] uppercase tracking-wide mb-3">
                {t("costBreakdown")}
              </p>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className={lbl}>
                    {t("materialCost")}
                    <CurrencySymbol className="w-3 h-3" />)
                    <span className="ms-1 text-[10px] text-[#A89080]">
                      {t("autoFromBom")}
                    </span>
                  </label>
                  <input
                    readOnly
                    value={form.pricing.materialCost}
                    className={roInp}
                  />
                </div>
                <div>
                  <label className={lbl}>
                    {t("labourCost")}
                    <CurrencySymbol className="w-3 h-3" />)
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={form.pricing.laborCost}
                    onChange={(e) =>
                      setPricingField("laborCost", Number(e.target.value))
                    }
                    className={inp}
                  />
                </div>
                <div>
                  <label className={lbl}>
                    {t("extraOverhead")}
                    <CurrencySymbol className="w-3 h-3" />)
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={form.pricing.extraCost}
                    onChange={(e) =>
                      setPricingField("extraCost", Number(e.target.value))
                    }
                    className={inp}
                  />
                </div>
              </div>
            </div>

            <div className="rounded-xl bg-[#1B3A2D] px-5 py-4 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-white/60 uppercase tracking-wide">
                  {t("totalCost")}
                </p>
                <p className="text-2xl font-black text-white">
                  <CurrencySymbol className="w-5 h-5 me-1" />{" "}
                  {form.pricing.totalCost.toLocaleString("en-IN")}
                </p>
              </div>
              <p className="text-xs text-white/40">
                {form.pricing.materialCost} + {form.pricing.laborCost} +{" "}
                {form.pricing.extraCost}
              </p>
            </div>

            <div>
              <p className="text-xs font-bold text-[#7A6055] uppercase tracking-wide mb-3">
                {t("sellingPrice")}
              </p>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className={lbl}>{t("profitMargin")}</label>
                  <input
                    type="number"
                    min={0}
                    value={form.pricing.profitMargin}
                    onChange={(e) =>
                      setPricingField("profitMargin", Number(e.target.value))
                    }
                    className={inp}
                  />
                </div>
                <div>
                  <label className={lbl}>
                    {t("sellingPrice")}
                    <CurrencySymbol className="w-3 h-3" />)
                    <span className="text-[10px] text-[#A89080] ms-1">
                      {t("autocalculated")}
                    </span>
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={form.pricing.sellingPrice}
                    onChange={(e) =>
                      setForm((p) => ({
                        ...p,
                        pricing: {
                          ...p.pricing,
                          sellingPrice: Number(e.target.value),
                        },
                      }))
                    }
                    className={inp}
                  />
                  {errors.sellingPrice && (
                    <p className="text-xs text-rose-500 mt-1">
                      {errors.sellingPrice}
                    </p>
                  )}
                </div>
                <div>
                  <label className={lbl}>
                    {t("discountPrice")}
                    <CurrencySymbol className="w-3 h-3" />)
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={form.pricing.discountPrice}
                    onChange={(e) =>
                      setForm((p) => ({
                        ...p,
                        pricing: {
                          ...p.pricing,
                          discountPrice: Number(e.target.value),
                        },
                      }))
                    }
                    className={inp}
                  />
                </div>
              </div>
            </div>

            {form.pricing.sellingPrice > 0 && form.pricing.totalCost > 0 && (
              <div className="flex gap-3 rounded-xl bg-amber-50 border border-amber-200 px-4 py-3 text-sm text-amber-800">
                <Info size={16} className="shrink-0 mt-0.5 text-amber-500" />
                <span>
                  {t("profit")}
                  <CurrencySymbol className="w-3 h-3 me-1" />
                  {(
                    form.pricing.sellingPrice - form.pricing.totalCost
                  ).toLocaleString("en-IN")}
                  {t("nbspnbspMargin")}
                  {(
                    ((form.pricing.sellingPrice - form.pricing.totalCost) /
                      form.pricing.totalCost) *
                    100
                  ).toFixed(1)}
                  %
                </span>
              </div>
            )}
          </div>
        )}

        {/* ── Tab: BOM ──────────────────────────────────────────── */}
        {tab === "bom" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-bold text-[#1A1210]">
                  {t("billOfMaterials")}
                </p>
                <p className="text-xs text-[#7A6055]">
                  {t("selectMaterialBatchQuantityIs")}
                </p>
              </div>
              <button
                type="button"
                onClick={addBomRow}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold bg-[#1B3A2D] text-white hover:bg-[#163222] transition-colors"
              >
                <Plus size={14} /> {t("addMaterial")}
              </button>
            </div>

            <div className="rounded-xl border border-[#E5DDD5] overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-[#FAF8F6] border-b border-[#E5DDD5]">
                  <tr>
                    <th className="py-2.5 px-3 text-start text-xs font-bold text-[#7A6055] uppercase">
                      {t("material")}
                    </th>
                    <th className="py-2.5 px-3 text-start text-xs font-bold text-[#7A6055] uppercase">
                      {t("batch")}
                    </th>
                    <th className="py-2.5 px-3 text-end text-xs font-bold text-[#7A6055] uppercase w-20">
                      {t("priceunit")}
                    </th>
                    <th className="py-2.5 px-3 text-center text-xs font-bold text-[#7A6055] uppercase w-24">
                      {t("qty")}
                    </th>
                    <th className="py-2.5 px-3 text-end text-xs font-bold text-[#7A6055] uppercase w-24">
                      {t("subtotal")}
                    </th>
                    <th className="w-8" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F0EBE5]">
                  {form.bom.length === 0 ? (
                    <tr>
                      <td
                        colSpan={6}
                        className="py-10 text-center text-[#A89080] text-sm"
                      >
                        {t("click")}
                        <strong>{t("addMaterial")}</strong> {t("toBuildTheBom")}
                      </td>
                    </tr>
                  ) : (
                    form.bom.map((row, idx) => {
                      const mat = materials.find(
                        (m) => m._id === row.materialId,
                      );
                      const batches = mat?.batches || [];
                      return (
                        <tr key={idx} className="hover:bg-[#FAF8F6]">
                          {/* Material */}
                          <td className="px-3 py-2">
                            <select
                              value={row.materialId}
                              onChange={(e) =>
                                updateBomMaterial(idx, e.target.value)
                              }
                              className="w-full rounded-lg border border-[#E5DDD5] px-2 py-1.5 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-[#C9A84C]/40"
                            >
                              <option value="">{t("select")}</option>
                              {materials.map((m) => (
                                <option key={m._id} value={m._id}>
                                  {m.name} ({m.code})
                                </option>
                              ))}
                            </select>
                          </td>

                          {/* Batch */}
                          <td className="px-3 py-2">
                            {row.materialId ? (
                              batches.length > 0 ? (
                                <select
                                  value={row.batchNumber}
                                  onChange={(e) =>
                                    updateBomBatch(idx, e.target.value)
                                  }
                                  className="w-full rounded-lg border border-[#E5DDD5] px-2 py-1.5 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-[#C9A84C]/40"
                                >
                                  <option value="">{t("selectBatch")}</option>
                                  {batches.map((b: any, bi: number) => (
                                    <option key={bi} value={b.batchNumber}>
                                      {b.batchNumber || `Batch ${bi + 1}`} —{" "}
                                      <CurrencySymbol plain />
                                      {b.purchasePrice} | {b.quantity}{" "}
                                      {row.unit}
                                    </option>
                                  ))}
                                </select>
                              ) : (
                                <span className="text-xs text-[#A89080] italic">
                                  {t("noBatches")}
                                </span>
                              )
                            ) : (
                              <span className="text-xs text-[#C5B8B0] italic">
                                {t("selectMaterialFirst")}
                              </span>
                            )}
                            {row.batchNumber && (
                              <p className="text-[10px] text-[#A89080] mt-0.5">
                                {t("available")}{" "}
                                <span
                                  className={
                                    row.quantity >= row.availableQty
                                      ? "text-rose-500 font-semibold"
                                      : "text-green-600 font-semibold"
                                  }
                                >
                                  {row.availableQty} {row.unit}
                                </span>
                              </p>
                            )}
                          </td>

                          {/* Price/Unit (read-only) */}
                          <td className="px-3 py-2 text-end font-mono text-xs text-[#7A6055]">
                            {row.pricePerUnit > 0 ? (
                              <>
                                <CurrencySymbol className="w-3 h-3 me-0.5" />
                                {row.pricePerUnit}
                              </>
                            ) : (
                              "—"
                            )}
                          </td>

                          {/* Qty */}
                          <td className="px-3 py-2">
                            <input
                              type="number"
                              min={0.01}
                              step="0.01"
                              value={row.quantity}
                              max={row.availableQty || undefined}
                              disabled={!row.batchNumber}
                              onChange={(e) =>
                                updateBomQty(idx, Number(e.target.value))
                              }
                              className={`w-full rounded-lg border text-sm text-center px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-[#C9A84C]/40 ${
                                !row.batchNumber
                                  ? "bg-[#F5F2EA] text-[#A89080] border-[#E5DDD5] cursor-not-allowed"
                                  : "bg-white border-[#E5DDD5]"
                              }`}
                            />
                          </td>

                          {/* Subtotal */}
                          <td className="px-3 py-2 text-end font-semibold text-[#1A1210] text-xs">
                            {row.subtotal > 0 ? (
                              <>
                                <CurrencySymbol className="w-3 h-3 me-0.5" />
                                {row.subtotal.toLocaleString("en-IN")}
                              </>
                            ) : (
                              "—"
                            )}
                          </td>

                          {/* Remove */}
                          <td className="px-2 py-2 text-center">
                            <button
                              type="button"
                              onClick={() => removeBomRow(idx)}
                              className="p-1 rounded-lg hover:bg-rose-50 text-rose-400 hover:text-rose-600 transition-colors"
                            >
                              <Trash2 size={14} />
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
                {form.bom.length > 0 && (
                  <tfoot>
                    <tr className="border-t-2 border-[#E5DDD5] bg-[#FAF8F6]">
                      <td
                        colSpan={4}
                        className="px-3 py-2.5 text-xs font-bold text-[#7A6055]"
                      >
                        {t("totalMaterialCost")}
                      </td>
                      <td className="px-3 py-2.5 text-end text-sm font-black text-[#1B3A2D]">
                        <CurrencySymbol className="w-3 h-3 me-0.5" />
                        {form.pricing.materialCost.toLocaleString("en-IN")}
                      </td>
                      <td />
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>

            {form.bom.some(
              (r) => r.batchNumber && r.quantity >= r.availableQty,
            ) && (
              <div className="flex gap-2 rounded-lg bg-rose-50 border border-rose-200 px-4 py-2.5 text-xs text-rose-700">
                <Info size={14} className="shrink-0 mt-0.5" />
                {t("someRowsAreUsingThe")}
              </div>
            )}
          </div>
        )}
      </form>
    </Modal>
  );
}

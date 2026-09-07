"use client";
import { useEffect, useState } from "react";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import { Package, Tag, Info } from "lucide-react";
import CurrencySymbol from "@/components/ui/CurrencySymbol";
import { useLanguage } from "../../context/LanguageContext";

// ── constants ─────────────────────────────────────────────────────────────────
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

const TABS = [
  { id: "basic", label: "Basic Info", icon: Package },
  { id: "pricing", label: "Pricing", icon: Tag },
];

interface FormState {
  productName: string;
  productCode: string;
  category: string;
  primaryMaterial: string;
  color: string;
  status: string;
  isManufactured: boolean;
  description: string;
  currentStock: number;
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
    purchasePrice: number;
    salesPrice: number;
  };
  bom: any[];
  variants: { colors: string[]; sizes: string[]; finishes: string[] };
}

function makeEmpty(): FormState {
  return {
    productName: "",
    productCode: "",
    category: "Sofa",
    primaryMaterial: "",
    color: "",
    status: "active",
    isManufactured: false,
    description: "",
    currentStock: 0,
    dimensions: { width: "", height: "", depth: "", weight: "", unit: "cm" },
    pricing: {
      materialCost: 0,
      laborCost: 0,
      extraCost: 0,
      totalCost: 0,
      profitMargin: 0,
      sellingPrice: 0,
      discountPrice: 0,
      purchasePrice: 0,
      salesPrice: 0,
    },
    bom: [],
    variants: { colors: [], sizes: [], finishes: [] },
  };
}

function autoCode(category: string) {
  const map: Record<string, string> = {
    Sofa: "SOF",
    Bed: "BED",
    Chair: "CHR",
    Table: "TBL",
    Wardrobe: "WRD",
    Office: "OFC",
    Dining: "DIN",
    Other: "PRD",
  };
  return `${map[category] || "PRD"}-${Math.floor(100 + Math.random() * 900)}`;
}

// ── main component ────────────────────────────────────────────────────────────
interface ProductModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: any) => Promise<void>;
  product?: any | null;
  loading?: boolean;
}

export default function ProductModal({
  open,
  onClose,
  onSubmit,
  product,
  loading,
}: ProductModalProps) {
  const { t } = useLanguage();
  const [tab, setTab] = useState("basic");
  const [form, setForm] = useState<FormState>(makeEmpty());
  const [errors, setErrors] = useState<Record<string, string>>({});
  const isEdit = !!product;

  // ── style helpers ─────────────────────────────────────────────────────────
  const lbl = "block text-xs font-semibold text-[#7A6055] mb-1";
  const inp =
    "w-full border border-[#E5DDD5] rounded-lg px-3 py-2 text-sm bg-white text-[#1A1210] focus:outline-none focus:ring-2 focus:ring-[#C9A84C]/40";
  const roInp = `${inp} bg-[#F5F2EA] text-[#A89080] cursor-not-allowed`;

  // ── populate form ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (!open) return;
    setTab("basic");
    setErrors({});
    if (product) {
      setForm({
        productName: product.name || "",
        productCode: product.itemNumber || "",
        category: product.category || "Sofa",
        primaryMaterial:
          product.primaryMaterial !== "—" ? product.primaryMaterial || "" : "",
        color: product.color || "",
        status: product.status || "active",
        isManufactured: false,
        description: product.description || "",
        currentStock: product.quantity ?? 0,
        dimensions: {
          width: product.dimensions?.width ?? "",
          height: product.dimensions?.height ?? "",
          depth: product.dimensions?.depth ?? "",
          weight: product.dimensions?.weight ?? "",
          unit: product.dimensions?.unit || "cm",
        },
        pricing: {
          materialCost: 0,
          laborCost: 0,
          extraCost: 0,
          totalCost: product.pricing?.totalCost ?? product.purchaseAmount ?? 0,
          profitMargin: product.pricing?.profitMargin ?? 0,
          sellingPrice:
            product.pricing?.sellingPrice ?? product.salesAmount ?? 0,
          discountPrice: product.pricing?.discountPrice ?? product.mrp ?? 0,
          purchasePrice:
            product.pricing?.purchasePrice ?? product.purchaseAmount ?? 0,
          salesPrice: product.pricing?.salesPrice ?? product.salesAmount ?? 0,
        },
        bom: [],
        variants: product.variants || { colors: [], sizes: [], finishes: [] },
      });
    } else {
      const empty = makeEmpty();
      empty.productCode = autoCode("Sofa");
      setForm(empty);
    }
  }, [open, product]);

  // ── category change ───────────────────────────────────────────────────────
  function setCategory(cat: string) {
    setForm((prev) => ({
      ...prev,
      category: cat,
      productCode: isEdit ? prev.productCode : autoCode(cat),
    }));
  }

  // ── submit ────────────────────────────────────────────────────────────────
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errs: Record<string, string> = {};
    let errorTab = "basic";

    if (!form.productName.trim()) {
      errs.productName = "Product name is required";
    }
    if (form.currentStock < 0) {
      errs.currentStock = "Stock cannot be negative";
    }
    if (form.pricing.purchasePrice < 0) {
      errs.purchasePrice = "Purchase price cannot be negative";
      errorTab = "pricing";
    }
    if (form.pricing.salesPrice < 0) {
      errs.salesPrice = "Sales price cannot be negative";
      errorTab = "pricing";
    }

    if (Object.keys(errs).length) {
      setErrors(errs);
      if (errs.productName || errs.currentStock) setTab("basic");
      else setTab(errorTab);
      return;
    }

    const payload = {
      name: form.productName,
      itemNumber: form.productCode,
      category: form.category,
      unit: "Piece",
      status: form.status,
      isManufactured: false,
      description: form.description,
      primaryMaterial: form.primaryMaterial || "—",
      color: form.color || "",
      reorderLevel: 0,
      quantity: form.currentStock,
      purchaseAmount: form.pricing.purchasePrice,
      salesAmount: form.pricing.salesPrice,
      mrp: form.pricing.salesPrice,
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
      pricing: {
        ...form.pricing,
        purchasePrice: form.pricing.purchasePrice,
        salesPrice: form.pricing.salesPrice,
        totalCost: form.pricing.purchasePrice,
        sellingPrice: form.pricing.salesPrice,
      },
      bom: [],
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
      size="lg"
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={loading}>
            {t("cancel")}
          </Button>
          <Button form="product-form" type="submit" loading={loading}>
            {isEdit ? "Update Product" : "Create Product"}
          </Button>
        </>
      }
    >
      {/* Tab bar */}
      <div className="flex gap-1 mb-6 border-b border-[#F0EBE5] overflow-x-auto pb-0">
        {TABS.map((tabItem) => (
          <button
            key={tabItem.id}
            type="button"
            onClick={() => setTab(tabItem.id)}
            className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-semibold whitespace-nowrap border-b-2 transition-colors -mb-px ${
              tab === tabItem.id
                ? "border-[#C9A84C] text-[#C9A84C]"
                : "border-transparent text-[#7A6055] hover:text-[#1A1210]"
            }`}
          >
            <tabItem.icon size={15} />
            {tabItem.label}
          </button>
        ))}
      </div>

      <form id="product-form" onSubmit={handleSubmit} className="min-h-96">
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
                <label className={lbl}>
                  {t("productCode")}
                  <span className="ms-1.5 text-[10px] font-normal text-[#A89080] bg-[#F5F2EA] px-1.5 py-0.5 rounded-full">
                    {isEdit ? "read-only" : "auto-generated"}
                  </span>
                </label>
                <input readOnly value={form.productCode} className={roInp} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={lbl}>{t("category")}</label>
                <select
                  value={form.category}
                  onChange={(e) => setCategory(e.target.value)}
                  className={inp}
                >
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className={lbl}>{t("status")}</label>
                <select
                  value={form.status}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, status: e.target.value }))
                  }
                  className={inp}
                >
                  <option value="active">{t("active")}</option>
                  <option value="inactive">{t("inactive")}</option>
                  <option value="discontinued">{t("discontinued")}</option>
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
                <label className={lbl}>Opening Stock</label>
                <input
                  type="number"
                  min={0}
                  value={form.currentStock}
                  onChange={(e) =>
                    setForm((p) => ({
                      ...p,
                      currentStock: Number(e.target.value),
                    }))
                  }
                  className={inp}
                />
                {errors.currentStock && (
                  <p className="text-xs text-rose-500 mt-1">
                    {errors.currentStock}
                  </p>
                )}
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

        {/* ── Tab: Pricing ──────────────────────────────────────── */}
        {tab === "pricing" && (
          <div className="space-y-5">
            <div className="grid grid-cols-2 gap-6">
              <div className="rounded-xl border border-[#E5DDD5] p-5 space-y-3">
                <p className="text-xs font-bold text-[#7A6055] uppercase tracking-wide">
                  {t("purchasePrice")}
                </p>
                <p className="text-xs text-[#A89080]">
                  What you pay the supplier (per unit)
                </p>
                <input
                  type="number"
                  min={0}
                  value={form.pricing.purchasePrice}
                  onChange={(e) =>
                    setForm((p) => ({
                      ...p,
                      pricing: {
                        ...p.pricing,
                        purchasePrice: Number(e.target.value),
                      },
                    }))
                  }
                  className="w-full border border-[#E5DDD5] rounded-lg px-3 py-2 text-lg font-bold bg-white text-[#1A1210] focus:outline-none focus:ring-2 focus:ring-[#C9A84C]/40"
                  placeholder="0"
                />
                {errors.purchasePrice && (
                  <p className="text-xs text-rose-500 mt-1">
                    {errors.purchasePrice}
                  </p>
                )}
              </div>
              <div className="rounded-xl border border-[#1B3A2D]/20 bg-[#E8F0EC] p-5 space-y-3">
                <p className="text-xs font-bold text-[#1B3A2D] uppercase tracking-wide">
                  {t("salesPrice")}
                </p>
                <p className="text-xs text-[#4A7A63]">
                  {t("whatYouChargeTheCustomer")}
                </p>
                <input
                  type="number"
                  min={0}
                  value={form.pricing.salesPrice}
                  onChange={(e) =>
                    setForm((p) => ({
                      ...p,
                      pricing: {
                        ...p.pricing,
                        salesPrice: Number(e.target.value),
                      },
                    }))
                  }
                  className="w-full border border-[#1B3A2D]/30 rounded-lg px-3 py-2 text-lg font-bold bg-white text-[#1A1210] focus:outline-none focus:ring-2 focus:ring-[#1B3A2D]/30"
                  placeholder="0"
                />
                {errors.salesPrice && (
                  <p className="text-xs text-rose-500 mt-1">
                    {errors.salesPrice}
                  </p>
                )}
              </div>
            </div>
            {form.pricing.salesPrice > 0 && form.pricing.purchasePrice > 0 && (
              <div className="flex gap-3 rounded-xl bg-amber-50 border border-amber-200 px-4 py-3 text-sm text-amber-800">
                <Info size={16} className="shrink-0 mt-0.5 text-amber-500" />
                <span>
                  {t("profit")}
                  <CurrencySymbol className="w-3 h-3 me-1" />{" "}
                  {(
                    form.pricing.salesPrice - form.pricing.purchasePrice
                  ).toLocaleString("en-IN")}{" "}
                  {t("nbspnbspMargin")}
                  {(
                    ((form.pricing.salesPrice - form.pricing.purchasePrice) /
                      form.pricing.purchasePrice) *
                    100
                  ).toFixed(1)}
                  %
                </span>
              </div>
            )}
          </div>
        )}
      </form>
    </Modal>
  );
}

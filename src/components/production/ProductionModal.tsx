"use client";
import { useState, useEffect, useRef } from "react";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import {
  Package,
  Ruler,
  Tag,
  Layers,
  ChevronRight,
  CheckCircle2,
  AlertCircle,
  Trash2,
  Plus,
  Users,
} from "lucide-react";
import axios from "axios";
import { toast } from "sonner";
import CurrencySymbol from "@/components/ui/CurrencySymbol";
import { generateProductionJobCardPDF } from "@/lib/pdf-utils";
import { useLanguage } from "../../context/LanguageContext";

interface ProductionModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (id: string, data: any) => Promise<void>;
  production: any;
  loading?: boolean;
}

const TABS = [
  { id: "basic", label: "Basic Info", icon: Package },
  { id: "dimensions", label: "Dimensions", icon: Ruler },
  { id: "pricing", label: "Pricing", icon: Tag },
  { id: "bom", label: "BOM", icon: Layers },
];

export default function ProductionModal({
  open,
  onClose,
  onSubmit,
  production,
  loading,
}: ProductionModalProps) {
  const { t } = useLanguage();
  const [activeItemIdx, setActiveItemIdx] = useState(0);
  const [tab, setTab] = useState("basic");
  const [itemStates, setItemStates] = useState<any[]>([]);
  const [materials, setMaterials] = useState<any[]>([]);
  const [deliveryDate, setDeliveryDate] = useState("");
  const [remarks, setRemarks] = useState("");

  const [workerSearch, setWorkerSearch] = useState("");
  const [debouncedWorkerSearch, setDebouncedWorkerSearch] = useState("");
  const [workers, setWorkers] = useState<any[]>([]);
  const [selectedWorker, setSelectedWorker] = useState<any | null>(null);
  const [loadingWorkers, setLoadingWorkers] = useState(false);
  const [workerDropdownOpen, setWorkerDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Click outside worker dropdown to close it
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setWorkerDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Debounce worker search input
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedWorkerSearch(workerSearch);
    }, 400);
    return () => clearTimeout(handler);
  }, [workerSearch]);

  // Fetch workers when debounced search query changes
  useEffect(() => {
    if (open) {
      setLoadingWorkers(true);
      axios
        .get(`/api/workers?search=${encodeURIComponent(debouncedWorkerSearch)}`)
        .then((r) => {
          if (r.data.success) {
            setWorkers(r.data.data || []);
          }
        })
        .catch(() => {})
        .finally(() => setLoadingWorkers(false));
    }
  }, [open, debouncedWorkerSearch]);

  useEffect(() => {
    if (open) {
      axios
        .get("/api/materials")
        .then((r) => setMaterials(r.data.data || []))
        .catch(() => {});
    }
  }, [open]);

  useEffect(() => {
    if (open && production && materials.length) {
      setDeliveryDate(
        production.deliveryDate ? production.deliveryDate.split("T")[0] : "",
      );
      setRemarks(production.remarks || "");
      setSelectedWorker(
        production.workerId
          ? {
              _id: production.workerId,
              name: production.workerName,
              contactNumber: production.workerContact,
            }
          : null,
      );
      setWorkerSearch("");

      const states = production.items.map((item: any) => ({
        productName: item.itemName,
        quantity: item.quantity,
        category: item.category || "Sofa",
        color: item.color || "",
        material: item.material || "",
        status: "active",
        productCode: `PROD-${Math.floor(1000 + Math.random() * 9000)}`,
        dimensions: {
          width: item.dimensions?.width || "",
          height: item.dimensions?.height || "",
          depth: item.dimensions?.depth || "",
          weight: item.dimensions?.weight || "",
          unit: item.dimensions?.unit || "cm",
        },
        pricing: (() => {
          const matCost = (item.bom || []).reduce((s: number, b: any) => {
            const sub = b.subtotal ?? (b.pricePerUnit || 0) * (b.quantity || 1);
            return s + sub;
          }, 0);
          const stored = item.pricing || {};
          const labor = stored.laborCost || 0;
          const extra = stored.extraCost || 0;
          const margin = stored.profitMargin ?? 20;
          const total = matCost + labor + extra;
          const sell =
            stored.sellingPrice || Math.round(total * (1 + margin / 100));
          return {
            materialCost: matCost,
            laborCost: labor,
            extraCost: extra,
            totalCost: total,
            profitMargin: margin,
            sellingPrice: sell,
            discountPrice: stored.discountPrice || 0,
          };
        })(),
        bom: (item.bom || []).map((b: any) => {
          const priceFromDb = b.pricePerUnit || 0;
          const qty = b.quantity || 1;

          // try to find material and batch to get fresh stock info
          const mat = materials.find(
            (m: any) => m._id.toString() === b.materialId?.toString(),
          );
          const batch = mat?.batches?.find(
            (bt: any) => bt.batchNumber === b.batchNumber,
          );

          const price = priceFromDb || batch?.purchasePrice || 0;
          const avail = batch?.quantity || 0;
          const sub = b.subtotal ?? price * qty;

          return {
            ...b,
            batchNumber: b.batchNumber || "",
            pricePerUnit: price,
            availableQty: avail,
            subtotal: sub,
          };
        }),
      }));
      setItemStates(states);
      setActiveItemIdx(0);
      setTab("basic");
    }
  }, [open, production, materials]);

  const updateItemState = (idx: number, updates: any) => {
    setItemStates((prev) =>
      prev.map((s, i) => (i === idx ? { ...s, ...updates } : s)),
    );
  };

  const updatePricing = (idx: number, key: string, val: number) => {
    const s = itemStates[idx];
    const p = { ...s.pricing, [key]: val };
    const total =
      (p.materialCost || 0) + (p.laborCost || 0) + (p.extraCost || 0);
    const sell = Math.round(total * (1 + (p.profitMargin || 0) / 100));
    updateItemState(idx, {
      pricing: { ...p, totalCost: total, sellingPrice: sell },
    });
  };

  const updateBomBatch = (
    itemIdx: number,
    bomIdx: number,
    batchNumber: string,
  ) => {
    const s = itemStates[itemIdx];
    const bomRow = s.bom[bomIdx];
    const mat = materials.find(
      (m) => m._id.toString() === bomRow.materialId?.toString(),
    );
    const batch = mat?.batches?.find((b: any) => b.batchNumber === batchNumber);

    const updatedBom = s.bom.map((r: any, i: number) => {
      if (i !== bomIdx) return r;
      const price = batch?.purchasePrice || 0;
      const avail = batch?.quantity || 0;
      const qty = r.quantity || 1;
      return {
        ...r,
        batchNumber,
        pricePerUnit: price,
        availableQty: avail,
        subtotal: price * qty,
      };
    });

    const matCost = updatedBom.reduce(
      (acc: number, r: any) => acc + (r.subtotal || 0),
      0,
    );
    const p = { ...s.pricing, materialCost: matCost };
    const total = matCost + (p.laborCost || 0) + (p.extraCost || 0);
    const sell = Math.round(total * (1 + (p.profitMargin || 0) / 100));

    setItemStates((prev) =>
      prev.map((item, i) =>
        i === itemIdx
          ? {
              ...item,
              bom: updatedBom,
              pricing: { ...p, totalCost: total, sellingPrice: sell },
            }
          : item,
      ),
    );
  };

  const addBomRow = (itemIdx: number) => {
    setItemStates((prev) =>
      prev.map((item, i) => {
        if (i !== itemIdx) return item;
        return {
          ...item,
          bom: [
            ...item.bom,
            {
              materialId: "",
              materialName: "",
              materialCode: "",
              unit: "",
              quantity: 1,
              batchNumber: "",
              pricePerUnit: 0,
              availableQty: 0,
              subtotal: 0,
            },
          ],
        };
      }),
    );
  };

  const removeBomRow = (itemIdx: number, bomIdx: number) => {
    setItemStates((prev) =>
      prev.map((item, i) => {
        if (i !== itemIdx) return item;
        const updatedBom = item.bom.filter(
          (_: any, bi: number) => bi !== bomIdx,
        );
        const matCost = updatedBom.reduce(
          (acc: number, r: any) => acc + (r.subtotal || 0),
          0,
        );
        const p = { ...item.pricing, materialCost: matCost };
        const total = matCost + (p.laborCost || 0) + (p.extraCost || 0);
        const sell = Math.round(total * (1 + (p.profitMargin || 0) / 100));
        return {
          ...item,
          bom: updatedBom,
          pricing: { ...p, totalCost: total, sellingPrice: sell },
        };
      }),
    );
  };

  const updateBomMaterial = (
    itemIdx: number,
    bomIdx: number,
    matId: string,
  ) => {
    const mat = materials.find((m) => m._id.toString() === matId.toString());
    setItemStates((prev) =>
      prev.map((item, i) => {
        if (i !== itemIdx) return item;
        const updatedBom = item.bom.map((r: any, bi: number) => {
          if (bi !== bomIdx) return r;
          return {
            ...r,
            materialId: matId,
            materialName: mat?.name || "",
            materialCode: mat?.code || "",
            unit: mat?.unit || "",
            batchNumber: "",
            pricePerUnit: 0,
            availableQty: 0,
            subtotal: 0,
          };
        });
        return { ...item, bom: updatedBom };
      }),
    );
  };

  const handleFinalSubmit = async () => {
    if (!deliveryDate) return toast.error("Please set a target delivery date");
    if (!selectedWorker)
      return toast.error("Please assign a production worker");

    for (let i = 0; i < itemStates.length; i++) {
      const item = itemStates[i];
      if (item.bom.some((b: any) => !b.batchNumber)) {
        return toast.error(
          `Please select batches for all materials in item: ${item.productName}`,
        );
      }
    }

    // Download PDF Job Card
    try {
      generateProductionJobCardPDF({
        saleNumber: production.saleNumber,
        customerName: production.customerName,
        deliveryDate: deliveryDate,
        items: itemStates.map((it) => ({
          itemName: it.productName,
          quantity: it.quantity,
          material: it.material,
          color: it.color,
          size:
            it.dimensions.width +
            "x" +
            it.dimensions.height +
            "x" +
            it.dimensions.depth,
        })),
        remarks: remarks,
        createdBy: production.saleId?.createdBy?.name,
      });
    } catch (err) {
      console.error("PDF Generation failed:", err);
    }

    await onSubmit(production._id, {
      remarks,
      deliveryDate,
      items: itemStates,
      workerId: selectedWorker._id,
      workerName: selectedWorker.name,
      workerContact: selectedWorker.contactNumber,
    });
  };

  if (!production || itemStates.length === 0) return null;

  const hasStockError = itemStates.some((item) =>
    item.bom.some((b: any) => b.batchNumber && b.quantity > b.availableQty),
  );
  const currentItem = itemStates[activeItemIdx];
  const lbl = "block text-xs font-semibold text-[#7A6055] mb-1";
  const inp =
    "w-full border border-[#E5DDD5] rounded-lg px-3 py-2 text-sm bg-white text-[#1A1210] focus:outline-none focus:ring-2 focus:ring-[#C9A84C]/40";
  const roInp = `${inp} bg-[#F5F2EA] text-[#A89080] cursor-not-allowed`;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={t("createNewProductProductionMode")}
      size="xl"
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={loading}>
            {t("cancel")}
          </Button>
          {!hasStockError ? (
            <Button onClick={handleFinalSubmit} loading={loading}>
              {t("startWorkDownloadJobCard")}
            </Button>
          ) : (
            <div className="flex items-center gap-2 text-rose-500 bg-rose-50 px-4 py-2 rounded-lg border border-rose-100 animate-pulse">
              <AlertCircle size={16} />
              <span className="text-xs font-bold uppercase tracking-tight">
                {t("insufficientStockDetected")}
              </span>
            </div>
          )}
        </>
      }
    >
      <div className="flex flex-col h-[650px]">
        {/* Top: Global Production Settings */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-[#FAF8F6] rounded-xl border border-[#E5DDD5] mb-6">
          <div>
            <label className={lbl}>{t("targetDeliveryDate")}</label>
            <input
              type="date"
              value={deliveryDate}
              onChange={(e) => setDeliveryDate(e.target.value)}
              className={inp}
            />
          </div>
          <div>
            <label className={lbl}>{t("assignProductionWorker")}</label>
            <div className="relative" ref={dropdownRef}>
              <input
                type="text"
                placeholder={
                  selectedWorker
                    ? `${selectedWorker.name}`
                    : "Search & Select Worker..."
                }
                value={workerSearch}
                onChange={(e) => {
                  setWorkerSearch(e.target.value);
                  setWorkerDropdownOpen(true);
                }}
                onFocus={() => setWorkerDropdownOpen(true)}
                className={`${inp} pe-8`}
              />
              <span className="absolute inset-y-0 end-0 pe-3 flex items-center pointer-events-none text-[#A89080]">
                <Users size={16} />
              </span>

              {workerDropdownOpen && (
                <div className="absolute z-50 start-0 end-0 mt-1 bg-white border border-[#E5DDD5] rounded-xl shadow-lg max-h-60 overflow-y-auto">
                  {loadingWorkers ? (
                    <div className="p-3 text-center text-xs text-[#7A6055] animate-pulse">
                      {t("searchingWorkers")}
                    </div>
                  ) : workers.length === 0 ? (
                    <div className="p-3 text-center text-xs text-[#A89080]">
                      {t("noWorkersFound")}
                    </div>
                  ) : (
                    workers.map((w: any) => (
                      <button
                        key={w._id}
                        type="button"
                        onClick={() => {
                          setSelectedWorker(w);
                          setWorkerSearch("");
                          setWorkerDropdownOpen(false);
                        }}
                        className="w-full text-start px-4 py-2 hover:bg-[#FAF8F6] text-sm text-[#1A1210] border-b border-[#F0EBE5] last:border-0 transition-colors flex flex-col"
                      >
                        <span className="font-bold">{w.name}</span>
                        <span className="text-xs text-[#7A6055]">
                          {w.contactNumber}
                        </span>
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>
            {selectedWorker && (
              <div className="mt-1 flex items-center justify-between text-xs bg-emerald-50 text-emerald-800 border border-emerald-100 rounded-lg px-2 py-1 font-semibold">
                <span>
                  {t("assigned")}
                  {selectedWorker.name} ({selectedWorker.contactNumber})
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedWorker(null);
                    setWorkerSearch("");
                  }}
                  className="text-rose-500 hover:text-rose-700 ms-1 font-bold"
                >
                  ✕
                </button>
              </div>
            )}
          </div>
          <div>
            <label className={lbl}>{t("specialRemarks")}</label>
            <textarea
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              className={inp + " h-20 resize-none"}
              placeholder={t("addProductionNotesSpecialInstructions")}
              rows={3}
            />
          </div>
        </div>

        {/* Item Selector Tabs (if multiple items) */}
        {itemStates.length > 1 && (
          <div className="flex gap-2 overflow-x-auto pb-4">
            {itemStates.map((item, i) => (
              <button
                key={i}
                onClick={() => setActiveItemIdx(i)}
                className={`px-4 py-2 rounded-xl border whitespace-nowrap transition-all flex items-center gap-2 ${
                  activeItemIdx === i
                    ? "bg-[#2C1810] border-[#2C1810] text-white shadow-md"
                    : "bg-white border-[#E5DDD5] text-[#7A6055] hover:border-[#C9A84C]"
                }`}
              >
                <span className="font-bold text-sm">{item.productName}</span>
                {item.bom.every((b: any) => b.batchNumber) ? (
                  <CheckCircle2 size={12} className="text-emerald-400" />
                ) : (
                  <AlertCircle size={12} className="text-amber-400" />
                )}
              </button>
            ))}
          </div>
        )}

        {/* Standard Product Form Layout */}
        <div className="flex-1 flex flex-col bg-white border border-[#E5DDD5] rounded-xl overflow-hidden shadow-sm">
          {/* Tab bar (Exact as ProductModal) */}
          <div className="flex gap-1 border-b border-[#F0EBE5] bg-[#FAF8F6] px-4 pt-1 overflow-x-auto">
            {TABS.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setTab(t.id)}
                className={`flex items-center gap-1.5 px-5 py-3 text-sm font-semibold whitespace-nowrap border-b-2 transition-colors -mb-px ${
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

          <div className="flex-1 overflow-y-auto p-6">
            {/* Tab: Basic Info */}
            {tab === "basic" && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={lbl}>{t("productName")}</label>
                    <input
                      value={currentItem.productName}
                      readOnly
                      className={roInp}
                    />
                  </div>
                  <div>
                    <label className={lbl}>
                      {t("productCode")}
                      <span className="ms-1 text-[10px] text-[#A89080] bg-[#F5F2EA] px-1.5 py-0.5 rounded-full uppercase">
                        {t("autogenerated")}
                      </span>
                    </label>
                    <input
                      value={currentItem.productCode}
                      readOnly
                      className={roInp}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={lbl}>{t("category")}</label>
                    <input
                      value={currentItem.category}
                      readOnly
                      className={roInp}
                    />
                  </div>
                  <div>
                    <label className={lbl}>{t("status")}</label>
                    <input
                      value={currentItem.status}
                      readOnly
                      className={roInp}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={lbl}>{t("color")}</label>
                    <input
                      value={currentItem.color}
                      readOnly
                      className={roInp}
                    />
                  </div>
                  <div>
                    <label className={lbl}>{t("plannedQuantity")}</label>
                    <input
                      value={currentItem.quantity}
                      readOnly
                      className={roInp}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Tab: Dimensions */}
            {tab === "dimensions" && (
              <div className="space-y-6">
                <p className="text-sm text-[#7A6055]">
                  {t("finalizeProductDimensionsAndWeight")}
                </p>
                <div className="grid grid-cols-2 gap-6">
                  <div className="flex flex-col items-center justify-center bg-[#FAF8F6] rounded-2xl border border-[#E5DDD5] p-6 gap-4">
                    <div className="flex justify-end w-full">
                      <select
                        value={currentItem.dimensions.unit}
                        onChange={(e) =>
                          updateItemState(activeItemIdx, {
                            dimensions: {
                              ...currentItem.dimensions,
                              unit: e.target.value,
                            },
                          })
                        }
                        className="text-[10px] uppercase font-bold border border-[#E5DDD5] rounded px-1 py-0.5 bg-white outline-none focus:ring-1 focus:ring-[#C9A84C]/40"
                      >
                        {["cm", "inch", "mm", "ft"].map((u) => (
                          <option key={u} value={u}>
                            {u}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="w-32 h-22 border-2 border-[#C9A84C] rounded-xl relative flex items-center justify-center bg-white shadow-sm px-2">
                      <span className="text-xs font-mono text-[#C9A84C] text-center leading-relaxed">
                        {currentItem.dimensions.width || "W"} ×{" "}
                        {currentItem.dimensions.height || "H"} ×{" "}
                        {currentItem.dimensions.depth || "D"}
                      </span>
                    </div>
                    <p className="text-xs text-[#A89080]">
                      {t("wHD")}
                      {currentItem.dimensions.unit})
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    {(["width", "height", "depth"] as const).map((f) => (
                      <div key={f}>
                        <label className={lbl}>
                          {f.charAt(0).toUpperCase() + f.slice(1)} (
                          {currentItem.dimensions.unit})
                        </label>
                        <input
                          type="number"
                          value={currentItem.dimensions[f]}
                          onChange={(e) =>
                            updateItemState(activeItemIdx, {
                              dimensions: {
                                ...currentItem.dimensions,
                                [f]: e.target.value,
                              },
                            })
                          }
                          className={inp}
                        />
                      </div>
                    ))}
                    <div>
                      <label className={lbl}>{t("weightKg")}</label>
                      <input
                        type="number"
                        value={currentItem.dimensions.weight}
                        onChange={(e) =>
                          updateItemState(activeItemIdx, {
                            dimensions: {
                              ...currentItem.dimensions,
                              weight: e.target.value,
                            },
                          })
                        }
                        className={inp}
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Tab: Pricing */}
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
                      </label>
                      <input
                        readOnly
                        value={currentItem.pricing.materialCost}
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
                        value={currentItem.pricing.laborCost}
                        onChange={(e) =>
                          updatePricing(
                            activeItemIdx,
                            "laborCost",
                            Number(e.target.value),
                          )
                        }
                        className={inp}
                      />
                    </div>
                    <div>
                      <label className={lbl}>
                        {t("overheadCost")}
                        <CurrencySymbol className="w-3 h-3" />)
                      </label>
                      <input
                        type="number"
                        value={currentItem.pricing.extraCost}
                        onChange={(e) =>
                          updatePricing(
                            activeItemIdx,
                            "extraCost",
                            Number(e.target.value),
                          )
                        }
                        className={inp}
                      />
                    </div>
                  </div>
                </div>

                <div className="rounded-xl bg-[#1B3A2D] px-5 py-4 flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold text-white/60 uppercase tracking-wide">
                      {t("totalManufacturingCost")}
                    </p>
                    <p className="text-2xl font-black text-white">
                      <CurrencySymbol className="w-5 h-5 me-1" />{" "}
                      {currentItem.pricing.totalCost.toLocaleString()}
                    </p>
                  </div>
                  <p className="text-xs text-white/40">
                    {currentItem.pricing.materialCost} +{" "}
                    {currentItem.pricing.laborCost} +{" "}
                    {currentItem.pricing.extraCost}
                  </p>
                </div>

                <div>
                  <p className="text-xs font-bold text-[#7A6055] uppercase tracking-wide mb-3">
                    {t("profitMargin")}
                  </p>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className={lbl}>{t("profitMargin")}</label>
                      <input
                        type="number"
                        value={currentItem.pricing.profitMargin}
                        onChange={(e) =>
                          updatePricing(
                            activeItemIdx,
                            "profitMargin",
                            Number(e.target.value),
                          )
                        }
                        className={inp}
                      />
                    </div>
                    <div>
                      <label className={lbl}>
                        {t("finalSellingPrice")}
                        <CurrencySymbol className="w-3 h-3" />)
                      </label>
                      <input
                        readOnly
                        value={currentItem.pricing.sellingPrice.toLocaleString()}
                        className={roInp + " font-bold text-lg text-[#1B3A2D]"}
                      />
                      {currentItem.quantity > 1 && (
                        <p className="text-[10px] text-[#A89080] mt-1 text-end italic">
                          {t("perUnit")}
                          <CurrencySymbol className="w-2 h-2" />{" "}
                          {(
                            currentItem.pricing.sellingPrice /
                            currentItem.quantity
                          ).toFixed(3)}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Tab: BOM */}
            {tab === "bom" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-bold text-[#1A1210]">
                      {t("billOfMaterials")}
                    </p>
                    <p className="text-xs text-[#7A6055]">
                      {t("finalizeMaterialListAndSelect")}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => addBomRow(activeItemIdx)}
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
                        <th className="py-2.5 px-3 text-center text-xs font-bold text-[#7A6055] uppercase w-24">
                          {t("qty")}
                        </th>
                        <th className="py-2.5 px-3 text-end text-xs font-bold text-[#7A6055] uppercase w-28">
                          {t("subtotal")}
                        </th>
                        <th className="w-8"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#F0EBE5]">
                      {currentItem.bom.length === 0 ? (
                        <tr>
                          <td
                            colSpan={5}
                            className="py-10 text-center text-[#A89080] text-sm italic"
                          >
                            {t("noMaterialsDefinedAddA")}
                          </td>
                        </tr>
                      ) : (
                        currentItem.bom.map((row: any, bIdx: number) => {
                          const mat = materials.find(
                            (m) =>
                              m._id.toString() === row.materialId?.toString(),
                          );
                          const batches = mat?.batches || [];
                          return (
                            <tr key={bIdx} className="hover:bg-[#FAF8F6]">
                              <td className="px-3 py-2">
                                <select
                                  value={row.materialId?.toString()}
                                  onChange={(e) =>
                                    updateBomMaterial(
                                      activeItemIdx,
                                      bIdx,
                                      e.target.value,
                                    )
                                  }
                                  className="w-full rounded-lg border border-[#E5DDD5] px-2 py-1.5 text-xs outline-none bg-white"
                                >
                                  <option value="">
                                    {t("selectMaterial")}
                                  </option>
                                  {materials.map((m) => (
                                    <option key={m._id} value={m._id}>
                                      {m.name} ({m.code})
                                    </option>
                                  ))}
                                </select>
                              </td>
                              <td className="px-3 py-2">
                                <select
                                  value={row.batchNumber}
                                  onChange={(e) =>
                                    updateBomBatch(
                                      activeItemIdx,
                                      bIdx,
                                      e.target.value,
                                    )
                                  }
                                  className="w-full rounded-lg border border-[#E5DDD5] px-2 py-1.5 text-xs outline-none bg-white"
                                  disabled={!row.materialId}
                                >
                                  <option value="">{t("selectBatch")}</option>
                                  {batches.map((b: any, bi: number) => (
                                    <option key={bi} value={b.batchNumber}>
                                      {b.batchNumber} {t("stock")}
                                      {b.quantity} {row.unit})
                                    </option>
                                  ))}
                                </select>
                              </td>
                              <td className="px-3 py-2">
                                <input
                                  type="number"
                                  min={0.01}
                                  step={0.01}
                                  value={row.quantity}
                                  onChange={(e) => {
                                    let qty = parseFloat(e.target.value) || 0;
                                    if (
                                      row.batchNumber &&
                                      qty > row.availableQty
                                    ) {
                                      toast.error(
                                        `Insufficient stock! Max available: ${row.availableQty} ${row.unit}`,
                                      );
                                      qty = row.availableQty;
                                    }
                                    setItemStates((prev) =>
                                      prev.map((it, i) => {
                                        if (i !== activeItemIdx) return it;
                                        const updatedBom = it.bom.map(
                                          (r: any, ri: number) =>
                                            ri === bIdx
                                              ? {
                                                  ...r,
                                                  quantity: qty,
                                                  subtotal:
                                                    qty * r.pricePerUnit,
                                                }
                                              : r,
                                        );
                                        const matCost = updatedBom.reduce(
                                          (acc: number, r: any) =>
                                            acc + (r.subtotal || 0),
                                          0,
                                        );
                                        const p = {
                                          ...it.pricing,
                                          materialCost: matCost,
                                        };
                                        const total =
                                          matCost +
                                          (p.laborCost || 0) +
                                          (p.extraCost || 0);
                                        const sell = Math.round(
                                          total *
                                            (1 + (p.profitMargin || 0) / 100),
                                        );
                                        return {
                                          ...it,
                                          bom: updatedBom,
                                          pricing: {
                                            ...p,
                                            totalCost: total,
                                            sellingPrice: sell,
                                          },
                                        };
                                      }),
                                    );
                                  }}
                                  className={`w-full border rounded px-1 py-1 text-center text-xs focus:ring-1 focus:ring-[#C9A84C]/40 outline-none ${
                                    row.batchNumber &&
                                    row.quantity >= row.availableQty
                                      ? "border-amber-500 bg-amber-50"
                                      : "border-[#E5DDD5]"
                                  }`}
                                />
                                {row.batchNumber && (
                                  <p className="text-[9px] text-[#A89080] mt-0.5 text-center">
                                    {t("limit")}
                                    <span className="font-bold">
                                      {row.availableQty} {row.unit}
                                    </span>
                                  </p>
                                )}
                              </td>
                              <td className="px-3 py-2 text-end font-semibold text-[#1B3A2D] text-xs">
                                <CurrencySymbol className="w-3 h-3 me-1" />{" "}
                                {row.subtotal.toLocaleString()}
                              </td>
                              <td className="px-2 py-2 text-center">
                                <button
                                  onClick={() =>
                                    removeBomRow(activeItemIdx, bIdx)
                                  }
                                  className="text-rose-400 hover:text-rose-600 transition-colors"
                                >
                                  <Trash2 size={14} />
                                </button>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                    {currentItem.bom.length > 0 && (
                      <tfoot className="bg-[#FAF8F6] border-t border-[#E5DDD5]">
                        <tr>
                          <td
                            colSpan={3}
                            className="px-3 py-2 text-end font-bold text-[#7A6055] text-[10px] uppercase"
                          >
                            {t("totalMaterialCost")}
                          </td>
                          <td className="px-3 py-2 text-end font-black text-[#1B3A2D] text-sm">
                            <CurrencySymbol className="w-3 h-3 me-1" />{" "}
                            {currentItem.pricing.materialCost.toLocaleString()}
                          </td>
                          <td></td>
                        </tr>
                      </tfoot>
                    )}
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="mt-4 flex justify-between items-center text-[#A89080] text-xs font-semibold">
          <p>
            {t("processingItem")}
            {activeItemIdx + 1} {t("of")}
            {itemStates.length}
          </p>
          <div className="flex gap-2">
            <button
              disabled={activeItemIdx === 0}
              onClick={() => {
                setActiveItemIdx((v) => v - 1);
                setTab("basic");
              }}
              className="px-3 py-1.5 rounded-lg border border-[#E5DDD5] disabled:opacity-30 hover:border-[#C9A84C] transition-colors"
            >
              {t("previous")}
            </button>
            <button
              disabled={activeItemIdx === itemStates.length - 1}
              onClick={() => {
                setActiveItemIdx((v) => v + 1);
                setTab("basic");
              }}
              className="px-3 py-1.5 rounded-lg border border-[#E5DDD5] disabled:opacity-30 hover:border-[#C9A84C] transition-colors"
            >
              {t("nextItem")}
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
}

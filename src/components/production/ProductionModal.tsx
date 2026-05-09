"use client";
import { useState, useEffect } from "react";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import { 
  Package, Ruler, Tag, Layers, 
  ChevronRight, CheckCircle2, AlertCircle, Trash2, Plus
} from "lucide-react";
import axios from "axios";
import { toast } from "sonner";

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
  const [activeItemIdx, setActiveItemIdx] = useState(0);
  const [tab, setTab] = useState("basic");
  const [itemStates, setItemStates] = useState<any[]>([]);
  const [materials, setMaterials] = useState<any[]>([]);
  const [deliveryDate, setDeliveryDate] = useState("");
  const [remarks, setRemarks] = useState("");

  useEffect(() => {
    if (open) {
      axios.get("/api/materials").then(r => setMaterials(r.data.data || [])).catch(() => {});
    }
  }, [open]);

  useEffect(() => {
    if (open && production) {
      setDeliveryDate(production.deliveryDate ? production.deliveryDate.split("T")[0] : "");
      setRemarks(production.remarks || "");
      
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
          unit: item.dimensions?.unit || "cm"
        },
        pricing: {
          materialCost: 0,
          laborCost: 0,
          extraCost: 0,
          totalCost: 0,
          profitMargin: 20,
          sellingPrice: 0,
          discountPrice: 0
        },
        bom: (item.bom || []).map((b: any) => ({
          ...b,
          batchNumber: b.batchNumber || "",
          pricePerUnit: 0,
          availableQty: 0,
          subtotal: 0
        })),
      }));
      setItemStates(states);
      setActiveItemIdx(0);
      setTab("basic");
    }
  }, [open, production]);

  const updateItemState = (idx: number, updates: any) => {
    setItemStates(prev => prev.map((s, i) => i === idx ? { ...s, ...updates } : s));
  };

  const updatePricing = (idx: number, key: string, val: number) => {
    const s = itemStates[idx];
    const p = { ...s.pricing, [key]: val };
    const total = (p.materialCost || 0) + (p.laborCost || 0) + (p.extraCost || 0);
    const sell = Math.round(total * (1 + (p.profitMargin || 0) / 100));
    updateItemState(idx, { pricing: { ...p, totalCost: total, sellingPrice: sell } });
  };

  const updateBomBatch = (itemIdx: number, bomIdx: number, batchNumber: string) => {
    const s = itemStates[itemIdx];
    const bomRow = s.bom[bomIdx];
    const mat = materials.find(m => m._id === bomRow.materialId);
    const batch = mat?.batches?.find((b: any) => b.batchNumber === batchNumber);
    
    const updatedBom = s.bom.map((r: any, i: number) => {
      if (i !== bomIdx) return r;
      const price = batch?.purchasePrice || 0;
      const avail = batch?.quantity || 0;
      const qty = r.quantity || 1;
      return { ...r, batchNumber, pricePerUnit: price, availableQty: avail, subtotal: price * qty };
    });

    const matCost = updatedBom.reduce((acc: number, r: any) => acc + (r.subtotal || 0), 0);
    const p = { ...s.pricing, materialCost: matCost };
    const total = matCost + (p.laborCost || 0) + (p.extraCost || 0);
    const sell = Math.round(total * (1 + (p.profitMargin || 0) / 100));

    setItemStates(prev => prev.map((item, i) => i === itemIdx ? { 
      ...item, 
      bom: updatedBom, 
      pricing: { ...p, totalCost: total, sellingPrice: sell } 
    } : item));
  };

  const addBomRow = (itemIdx: number) => {
    setItemStates(prev => prev.map((item, i) => {
      if (i !== itemIdx) return item;
      return {
        ...item,
        bom: [...item.bom, { materialId: "", materialName: "", materialCode: "", unit: "", quantity: 1, batchNumber: "", pricePerUnit: 0, availableQty: 0, subtotal: 0 }]
      };
    }));
  };

  const removeBomRow = (itemIdx: number, bomIdx: number) => {
    setItemStates(prev => prev.map((item, i) => {
      if (i !== itemIdx) return item;
      const updatedBom = item.bom.filter((_: any, bi: number) => bi !== bomIdx);
      const matCost = updatedBom.reduce((acc: number, r: any) => acc + (r.subtotal || 0), 0);
      const p = { ...item.pricing, materialCost: matCost };
      const total = matCost + (p.laborCost || 0) + (p.extraCost || 0);
      const sell = Math.round(total * (1 + (p.profitMargin || 0) / 100));
      return { ...item, bom: updatedBom, pricing: { ...p, totalCost: total, sellingPrice: sell } };
    }));
  };

  const updateBomMaterial = (itemIdx: number, bomIdx: number, matId: string) => {
    const mat = materials.find(m => m._id === matId);
    setItemStates(prev => prev.map((item, i) => {
        if (i !== itemIdx) return item;
        const updatedBom = item.bom.map((r: any, bi: number) => {
            if (bi !== bomIdx) return r;
            return { ...r, materialId: matId, materialName: mat?.name || "", materialCode: mat?.code || "", unit: mat?.unit || "", batchNumber: "", pricePerUnit: 0, availableQty: 0, subtotal: 0 };
        });
        return { ...item, bom: updatedBom };
    }));
  };

  const handleFinalSubmit = async () => {
    if (!deliveryDate) return toast.error("Please set a target delivery date");
    
    for (let i = 0; i < itemStates.length; i++) {
        const item = itemStates[i];
        if (item.bom.some((b: any) => !b.batchNumber)) {
            return toast.error(`Please select batches for all materials in item: ${item.productName}`);
        }
    }

    await onSubmit(production._id, {
      remarks,
      deliveryDate,
      items: itemStates
    });
  };

  if (!production || itemStates.length === 0) return null;

  const currentItem = itemStates[activeItemIdx];
  const lbl = "block text-xs font-semibold text-[#7A6055] mb-1";
  const inp = "w-full border border-[#E5DDD5] rounded-lg px-3 py-2 text-sm bg-white text-[#1A1210] focus:outline-none focus:ring-2 focus:ring-[#C9A84C]/40";
  const roInp = `${inp} bg-[#F5F2EA] text-[#A89080] cursor-not-allowed`;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Create New Product (Production Mode)"
      size="xl"
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={loading}>Cancel</Button>
          <Button onClick={handleFinalSubmit} loading={loading}>
            Start Work & Create Products
          </Button>
        </>
      }
    >
      <div className="flex flex-col h-[650px]">
        {/* Top: Global Production Settings */}
        <div className="flex gap-4 p-4 bg-[#FAF8F6] rounded-xl border border-[#E5DDD5] mb-6">
          <div className="flex-1">
            <label className={lbl}>Target Delivery Date *</label>
            <input type="date" value={deliveryDate} onChange={e => setDeliveryDate(e.target.value)} className={inp} />
          </div>
          <div className="flex-[2]">
            <label className={lbl}>Special Remarks</label>
            <input 
              value={remarks} 
              onChange={e => setRemarks(e.target.value)} 
              className={inp} 
              placeholder="Add production notes..."
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
            {TABS.map(t => (
              <button key={t.id} type="button" onClick={() => setTab(t.id)}
                className={`flex items-center gap-1.5 px-5 py-3 text-sm font-semibold whitespace-nowrap border-b-2 transition-colors -mb-px ${
                  tab === t.id ? "border-[#C9A84C] text-[#C9A84C]" : "border-transparent text-[#7A6055] hover:text-[#1A1210]"
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
                    <label className={lbl}>Product Name</label>
                    <input value={currentItem.productName} readOnly className={roInp} />
                  </div>
                  <div>
                    <label className={lbl}>Product Code <span className="ml-1 text-[10px] text-[#A89080] bg-[#F5F2EA] px-1.5 py-0.5 rounded-full uppercase">auto-generated</span></label>
                    <input value={currentItem.productCode} readOnly className={roInp} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={lbl}>Category</label>
                    <input value={currentItem.category} readOnly className={roInp} />
                  </div>
                  <div>
                    <label className={lbl}>Status</label>
                    <input value={currentItem.status} readOnly className={roInp} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={lbl}>Color</label>
                    <input value={currentItem.color} readOnly className={roInp} />
                  </div>
                  <div>
                    <label className={lbl}>Planned Quantity</label>
                    <input value={currentItem.quantity} readOnly className={roInp} />
                  </div>
                </div>
              </div>
            )}

            {/* Tab: Dimensions */}
            {tab === "dimensions" && (
              <div className="space-y-6">
                <p className="text-sm text-[#7A6055]">Finalize product dimensions and weight before manufacturing.</p>
                <div className="grid grid-cols-2 gap-6">
                  <div className="flex flex-col items-center justify-center bg-[#FAF8F6] rounded-2xl border border-[#E5DDD5] p-6 gap-4">
                    <div className="flex justify-end w-full">
                      <select 
                        value={currentItem.dimensions.unit} 
                        onChange={e => updateItemState(activeItemIdx, { 
                          dimensions: { ...currentItem.dimensions, unit: e.target.value } 
                        })}
                        className="text-[10px] uppercase font-bold border border-[#E5DDD5] rounded px-1 py-0.5 bg-white outline-none focus:ring-1 focus:ring-[#C9A84C]/40"
                      >
                        {["cm", "inch", "mm", "ft"].map(u => <option key={u} value={u}>{u}</option>)}
                      </select>
                    </div>
                    <div className="w-32 h-22 border-2 border-[#C9A84C] rounded-xl relative flex items-center justify-center bg-white shadow-sm px-2">
                      <span className="text-xs font-mono text-[#C9A84C] text-center leading-relaxed">
                        {currentItem.dimensions.width || "W"} × {currentItem.dimensions.height || "H"} × {currentItem.dimensions.depth || "D"}
                      </span>
                    </div>
                    <p className="text-xs text-[#A89080]">W × H × D ({currentItem.dimensions.unit})</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    {(["width", "height", "depth"] as const).map(f => (
                      <div key={f}>
                        <label className={lbl}>{f.charAt(0).toUpperCase() + f.slice(1)} ({currentItem.dimensions.unit})</label>
                        <input 
                          type="number"
                          value={currentItem.dimensions[f]} 
                          onChange={e => updateItemState(activeItemIdx, { 
                            dimensions: { ...currentItem.dimensions, [f]: e.target.value } 
                          })}
                          className={inp} 
                        />
                      </div>
                    ))}
                    <div>
                      <label className={lbl}>Weight (kg)</label>
                      <input 
                        type="number"
                        value={currentItem.dimensions.weight} 
                        onChange={e => updateItemState(activeItemIdx, { 
                          dimensions: { ...currentItem.dimensions, weight: e.target.value } 
                        })}
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
                  <p className="text-xs font-bold text-[#7A6055] uppercase tracking-wide mb-3">Cost Breakdown</p>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className={lbl}>Material Cost (₹)</label>
                      <input readOnly value={currentItem.pricing.materialCost} className={roInp} />
                    </div>
                    <div>
                      <label className={lbl}>Labour Cost (₹)</label>
                      <input type="number" value={currentItem.pricing.laborCost} onChange={e => updatePricing(activeItemIdx, "laborCost", Number(e.target.value))} className={inp} />
                    </div>
                    <div>
                      <label className={lbl}>Overhead Cost (₹)</label>
                      <input type="number" value={currentItem.pricing.extraCost} onChange={e => updatePricing(activeItemIdx, "extraCost", Number(e.target.value))} className={inp} />
                    </div>
                  </div>
                </div>
                
                <div className="rounded-xl bg-[#1B3A2D] px-5 py-4 flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold text-white/60 uppercase tracking-wide">Total Manufacturing Cost</p>
                    <p className="text-2xl font-black text-white">₹ {currentItem.pricing.totalCost.toLocaleString()}</p>
                  </div>
                  <p className="text-xs text-white/40">{currentItem.pricing.materialCost} + {currentItem.pricing.laborCost} + {currentItem.pricing.extraCost}</p>
                </div>

                <div>
                  <p className="text-xs font-bold text-[#7A6055] uppercase tracking-wide mb-3">Profit & Margin</p>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className={lbl}>Profit Margin (%)</label>
                      <input 
                        type="number" 
                        value={currentItem.pricing.profitMargin} 
                        onChange={e => updatePricing(activeItemIdx, "profitMargin", Number(e.target.value))} 
                        className={inp}
                      />
                    </div>
                    <div>
                      <label className={lbl}>Final Selling Price (₹)</label>
                      <input 
                        readOnly
                        value={currentItem.pricing.sellingPrice / (currentItem.quantity || 1)} 
                        className={roInp + " font-bold text-lg"} 
                      />
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
                    <p className="font-bold text-[#1A1210]">Bill of Materials</p>
                    <p className="text-xs text-[#7A6055]">Finalize material list and select batches to allocate stock.</p>
                  </div>
                  <button type="button" onClick={() => addBomRow(activeItemIdx)}
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
                        <th className="py-2.5 px-3 text-center text-xs font-bold text-[#7A6055] uppercase w-24">Qty</th>
                        <th className="py-2.5 px-3 text-right text-xs font-bold text-[#7A6055] uppercase w-28">Subtotal</th>
                        <th className="w-8"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#F0EBE5]">
                      {currentItem.bom.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="py-10 text-center text-[#A89080] text-sm italic">
                            No materials defined. Add a material to calculate cost.
                          </td>
                        </tr>
                      ) : currentItem.bom.map((row: any, bIdx: number) => {
                        const mat = materials.find(m => m._id === row.materialId);
                        const batches = mat?.batches || [];
                        return (
                          <tr key={bIdx} className="hover:bg-[#FAF8F6]">
                            <td className="px-3 py-2">
                              <select 
                                value={row.materialId} 
                                onChange={e => updateBomMaterial(activeItemIdx, bIdx, e.target.value)}
                                className="w-full rounded-lg border border-[#E5DDD5] px-2 py-1.5 text-xs outline-none bg-white"
                              >
                                <option value="">— Select Material —</option>
                                {materials.map(m => (
                                  <option key={m._id} value={m._id}>{m.name} ({m.code})</option>
                                ))}
                              </select>
                            </td>
                            <td className="px-3 py-2">
                              <select 
                                value={row.batchNumber} 
                                onChange={e => updateBomBatch(activeItemIdx, bIdx, e.target.value)}
                                className="w-full rounded-lg border border-[#E5DDD5] px-2 py-1.5 text-xs outline-none bg-white"
                                disabled={!row.materialId}
                              >
                                <option value="">— Select Batch —</option>
                                {batches.map((b: any, bi: number) => (
                                  <option key={bi} value={b.batchNumber}>
                                    {b.batchNumber} (Stock: {b.quantity} {row.unit})
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
                                  onChange={e => {
                                      const qty = parseFloat(e.target.value) || 1;
                                      setItemStates(prev => prev.map((it, i) => {
                                          if (i !== activeItemIdx) return it;
                                          const updatedBom = it.bom.map((r: any, ri: number) => 
                                              ri === bIdx ? { ...r, quantity: qty, subtotal: qty * r.pricePerUnit } : r
                                          );
                                          const matCost = updatedBom.reduce((acc: number, r: any) => acc + (r.subtotal || 0), 0);
                                          const p = { ...it.pricing, materialCost: matCost };
                                          const total = matCost + (p.laborCost || 0) + (p.extraCost || 0);
                                          const sell = Math.round(total * (1 + (p.profitMargin || 0) / 100));
                                          return { ...it, bom: updatedBom, pricing: { ...p, totalCost: total, sellingPrice: sell } };
                                      }));
                                  }}
                                  className="w-full border rounded px-1 py-1 text-center text-xs"
                                />
                            </td>
                            <td className="px-3 py-2 text-right font-semibold text-[#1B3A2D] text-xs">
                              ₹ {row.subtotal.toLocaleString()}
                            </td>
                            <td className="px-2 py-2 text-center">
                              <button 
                                onClick={() => removeBomRow(activeItemIdx, bIdx)}
                                className="text-rose-400 hover:text-rose-600 transition-colors"
                              >
                                <Trash2 size={14} />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                    {currentItem.bom.length > 0 && (
                      <tfoot className="bg-[#FAF8F6] border-t border-[#E5DDD5]">
                        <tr>
                          <td colSpan={3} className="px-3 py-2 text-right font-bold text-[#7A6055] text-[10px] uppercase">Total Material Cost</td>
                          <td className="px-3 py-2 text-right font-black text-[#1B3A2D] text-sm">₹ {currentItem.pricing.materialCost.toLocaleString()}</td>
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
          <p>Processing Item {activeItemIdx + 1} of {itemStates.length}</p>
          <div className="flex gap-2">
            <button 
              disabled={activeItemIdx === 0}
              onClick={() => { setActiveItemIdx(v => v - 1); setTab("basic"); }}
              className="px-3 py-1.5 rounded-lg border border-[#E5DDD5] disabled:opacity-30 hover:border-[#C9A84C] transition-colors"
            >
              Previous
            </button>
            <button 
              disabled={activeItemIdx === itemStates.length - 1}
              onClick={() => { setActiveItemIdx(v => v + 1); setTab("basic"); }}
              className="px-3 py-1.5 rounded-lg border border-[#E5DDD5] disabled:opacity-30 hover:border-[#C9A84C] transition-colors"
            >
              Next Item
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
}

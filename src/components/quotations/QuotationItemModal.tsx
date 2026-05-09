"use client";
import { useState, useEffect } from "react";
import Modal from "@/components/ui/Modal";
import { Plus, Trash2 } from "lucide-react";
import axios from "axios";
import { IQuotationItem, UnitType } from "@/types";

const UNITS: UnitType[] = ["pcs", "meters", "sq.meters", "kg", "liters", "box", "set", "roll"];

const unitLabel: Record<UnitType, string> = {
  pcs: "Pcs", meters: "Meters", "sq.meters": "Sq.M", kg: "KG",
  liters: "Liters", box: "Box", set: "Set", roll: "Roll",
};

interface BomRefRow {
  materialId: string;
  materialName: string;
  unit: string;
  quantity: number;
}

interface QuotationItemModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (item: IQuotationItem) => void;
  editItem?: IQuotationItem | null;
}

export default function QuotationItemModal({
  open, onClose, onSubmit, editItem,
}: QuotationItemModalProps) {
  const [itemName, setItemName] = useState("");
  const [description, setDescription] = useState("");
  const [color, setColor] = useState("");
  const [material, setMaterial] = useState("");
  const [size, setSize] = useState("");
  const [unit, setUnit] = useState<UnitType>("pcs");
  const [quantity, setQuantity] = useState(1);
  const [bomRows, setBomRows] = useState<BomRefRow[]>([]);
  const [materials, setMaterials] = useState<any[]>([]);

  useEffect(() => {
    if (!open) return;
    axios.get("/api/materials").then(r => setMaterials(r.data.data || [])).catch(() => {});
  }, [open]);

  useEffect(() => {
    if (!open) return;
    if (editItem) {
      setItemName(editItem.itemName);
      setDescription(editItem.description || "");
      setColor(editItem.color || "");
      setMaterial(editItem.material || "");
      setSize(editItem.size || "");
      setUnit(editItem.unit);
      setQuantity(editItem.quantity);
      setBomRows([]);
    } else {
      setItemName("");
      setDescription("");
      setColor("");
      setMaterial("");
      setSize("");
      setUnit("pcs");
      setQuantity(1);
      setBomRows([]);
    }
  }, [open, editItem]);

  function addBomRow() {
    setBomRows(prev => [...prev, { materialId: "", materialName: "", unit: "", quantity: 1 }]);
  }

  function updateBomMaterial(idx: number, matId: string) {
    const mat = materials.find(m => m._id === matId);
    setBomRows(prev => prev.map((r, i) =>
      i !== idx ? r : { ...r, materialId: matId, materialName: mat?.name || "", unit: mat?.unit || "" }
    ));
    if (!material && mat?.name) setMaterial(mat.name);
  }

  function removeBomRow(idx: number) {
    setBomRows(prev => prev.filter((_, i) => i !== idx));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!itemName.trim()) return;
    onSubmit({
      itemName: itemName.trim(),
      description,
      color,
      material,
      size,
      unit,
      quantity,
      price: editItem?.price ?? 0,
      discount: editItem?.discount ?? 0,
      total: editItem ? editItem.price * quantity * (1 - (editItem.discount || 0) / 100) : 0,
    });
    onClose();
  }

  const lbl = "text-xs font-semibold text-[#5A4035] block mb-1.5 uppercase tracking-wide";
  const inp = "w-full h-10 border border-[#E5DDD5] rounded-lg px-3 text-sm bg-[#FAF8F6] outline-none focus:ring-2 focus:ring-[#C9A84C]/30";

  return (
    <Modal open={open} onClose={onClose} title={editItem ? "Edit Item" : "Add Quotation Item"} size="lg" className="!z-[60]">
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Item Name */}
        <div>
          <label className={lbl}>Item Name *</label>
          <input
            value={itemName}
            onChange={e => setItemName(e.target.value)}
            required
            placeholder="e.g. 3-Seater Sofa"
            className={inp}
          />
        </div>

        {/* Color / Material / Size */}
        <div className="grid grid-cols-3 gap-3">
          {(["Color", "Material", "Size"] as const).map(field => {
            const key = field.toLowerCase() as "color" | "material" | "size";
            const val = key === "color" ? color : key === "material" ? material : size;
            const setter = key === "color" ? setColor : key === "material" ? setMaterial : setSize;
            return (
              <div key={field}>
                <label className={lbl}>{field}</label>
                <input
                  value={val}
                  onChange={e => setter(e.target.value)}
                  placeholder={field}
                  className={inp}
                />
              </div>
            );
          })}
        </div>

        {/* Unit + Quantity */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={lbl}>Unit</label>
            <select
              value={unit}
              onChange={e => setUnit(e.target.value as UnitType)}
              className={inp + " cursor-pointer"}
            >
              {UNITS.map(u => <option key={u} value={u}>{unitLabel[u]}</option>)}
            </select>
          </div>
          <div>
            <label className={lbl}>Quantity</label>
            <input
              type="number"
              min={0.01}
              step="0.01"
              value={quantity}
              onChange={e => setQuantity(parseFloat(e.target.value) || 1)}
              className={inp}
            />
          </div>
        </div>

        {/* Description */}
        <div>
          <label className={lbl}>Description</label>
          <textarea
            value={description}
            onChange={e => setDescription(e.target.value)}
            rows={2}
            placeholder="Item description or special requirements..."
            className="w-full border border-[#E5DDD5] rounded-lg px-3 py-2 text-sm bg-[#FAF8F6] outline-none resize-none focus:ring-2 focus:ring-[#C9A84C]/30"
          />
        </div>

        {/* Materials Reference (BOM - no stock deduction) */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <div>
              <p className={lbl + " mb-0"}>Materials Required</p>
              <p className="text-[10px] text-[#A89080]">Reference only — no stock deduction for quotation</p>
            </div>
            <button
              type="button"
              onClick={addBomRow}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-[#E5DDD5] bg-white text-xs font-semibold text-[#2C1810] hover:bg-[#F7F4F0] transition-colors"
            >
              <Plus size={12} /> Add Material
            </button>
          </div>

          {bomRows.length > 0 && (
            <div className="rounded-xl border border-[#E5DDD5] overflow-hidden">
              <table className="w-full text-xs">
                <thead className="bg-[#FAF8F6] border-b border-[#E5DDD5]">
                  <tr>
                    <th className="py-2 px-3 text-left text-[#7A6055] uppercase font-bold">Material</th>
                    <th className="py-2 px-3 text-center text-[#7A6055] uppercase font-bold w-28">Qty</th>
                    <th className="py-2 px-3 text-center text-[#7A6055] uppercase font-bold w-16">Unit</th>
                    <th className="w-8"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F0EBE5]">
                  {bomRows.map((row, idx) => (
                    <tr key={idx} className="hover:bg-[#FAF8F6]">
                      <td className="px-3 py-2">
                        <select
                          value={row.materialId}
                          onChange={e => updateBomMaterial(idx, e.target.value)}
                          className="w-full rounded-lg border border-[#E5DDD5] px-2 py-1 text-xs bg-white outline-none focus:ring-2 focus:ring-[#C9A84C]/30"
                        >
                          <option value="">— Select Material —</option>
                          {materials.map(m => (
                            <option key={m._id} value={m._id}>{m.name} ({m.code})</option>
                          ))}
                        </select>
                      </td>
                      <td className="px-3 py-2">
                        <input
                          type="number"
                          min={0.01}
                          step="0.01"
                          value={row.quantity}
                          onChange={e => setBomRows(prev => prev.map((r, i) =>
                            i !== idx ? r : { ...r, quantity: parseFloat(e.target.value) || 1 }
                          ))}
                          className="w-full rounded-lg border border-[#E5DDD5] px-2 py-1 text-xs bg-white outline-none text-center"
                        />
                      </td>
                      <td className="px-3 py-2 text-center text-[#7A6055] font-medium">{row.unit || "—"}</td>
                      <td className="px-2 py-2 text-center">
                        <button
                          type="button"
                          onClick={() => removeBomRow(idx)}
                          className="p-1 rounded-lg hover:bg-rose-50 text-rose-400 hover:text-rose-600 transition-colors"
                        >
                          <Trash2 size={12} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-2 pt-2 border-t border-[#F0EAE3]">
          <button
            type="button"
            onClick={onClose}
            style={{
              padding: "10px 20px", borderRadius: 10, border: "1.5px solid #E5DDD5",
              background: "#fff", fontSize: 14, fontWeight: 600, color: "#7A6055", cursor: "pointer",
            }}
          >
            Cancel
          </button>
          <button
            type="submit"
            style={{
              padding: "10px 24px", borderRadius: 10, border: "none",
              background: "linear-gradient(135deg, #2C1810, #5C3D2E)",
              fontSize: 14, fontWeight: 700, color: "#fff", cursor: "pointer",
              boxShadow: "0 4px 14px rgba(44,24,16,0.2)",
            }}
          >
            {editItem ? "Update Item" : "Add Item"}
          </button>
        </div>
      </form>
    </Modal>
  );
}

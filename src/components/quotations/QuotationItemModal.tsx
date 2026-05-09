"use client";
import { useState, useEffect } from "react";
import Modal from "@/components/ui/Modal";
import { Package, Search } from "lucide-react";
import axios from "axios";
import { IQuotationItem, UnitType } from "@/types";

const UNITS: UnitType[] = ["pcs", "meters", "sq.meters", "kg", "liters", "box", "set", "roll"];
const CATEGORIES = ["Sofa", "Bed", "Chair", "Table", "Wardrobe", "Office", "Dining", "Other"];

const unitLabel: Record<UnitType, string> = {
  pcs: "Pcs", meters: "Meters", "sq.meters": "Sq.M", kg: "KG",
  liters: "Liters", box: "Box", set: "Set", roll: "Roll",
};

interface QuotationItemModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (item: IQuotationItem) => void;
  editItem?: IQuotationItem | null;
}

export default function QuotationItemModal({
  open, onClose, onSubmit, editItem,
}: QuotationItemModalProps) {
  const [products, setProducts] = useState<any[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  
  const [itemName, setItemName] = useState("");
  const [category, setCategory] = useState("Sofa");
  const [description, setDescription] = useState("");
  const [color, setColor] = useState("");
  const [material, setMaterial] = useState("");
  const [size, setSize] = useState("");
  const [unit, setUnit] = useState<UnitType>("pcs");
  const [quantity, setQuantity] = useState(1);
  const [price, setPrice] = useState(0);
  const [discount, setDiscount] = useState(0);

  useEffect(() => {
    if (open) {
      setLoadingProducts(true);
      axios.get("/api/items?limit=500")
        .then(res => setProducts(res.data.data || []))
        .catch(err => console.error("Failed to load products", err))
        .finally(() => setLoadingProducts(false));
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    if (editItem) {
      setItemName(editItem.itemName);
      setCategory((editItem as any).category || "Sofa");
      setDescription(editItem.description || "");
      setColor(editItem.color || "");
      setMaterial(editItem.material || "");
      setSize(editItem.size || "");
      setUnit(editItem.unit);
      setQuantity(editItem.quantity);
      setPrice(editItem.price || 0);
      setDiscount((editItem.discount || 0) / 100 * (editItem.price * editItem.quantity));
    } else {
      setItemName("");
      setCategory("Sofa");
      setDescription("");
      setColor("");
      setMaterial("");
      setSize("");
      setUnit("pcs");
      setQuantity(1);
      setPrice(0);
      setDiscount(0);
    }
  }, [open, editItem]);

  function handleProductSelect(productId: string) {
    const p = products.find(x => x._id === productId);
    if (!p) return;
    
    setItemName(p.name);
    setCategory(p.category || "Sofa");
    setDescription(p.description || "");
    setColor(p.color || "");
    setMaterial(p.primaryMaterial !== "—" ? p.primaryMaterial : "");
    setPrice(p.salesAmount || 0);
    setUnit(p.unit === "Piece" ? "pcs" : "pcs"); // Map as needed
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!itemName.trim()) return;
    
    onSubmit({
      itemName: itemName.trim(),
      category: category as any,
      description,
      color,
      material,
      size,
      unit,
      quantity,
      price: price || 0,
      discount: (discount / (price * quantity)) * 100 || 0, // Convert amount back to % for internal logic if needed
      total: (price * quantity) - (discount || 0),
    } as any);

    onClose();
  }

  const lbl = "text-xs font-semibold text-[#5A4035] block mb-1.5 uppercase tracking-wide";
  const inp = "w-full h-10 border border-[#E5DDD5] rounded-lg px-3 text-sm bg-[#FAF8F6] outline-none focus:ring-2 focus:ring-[#C9A84C]/30";

  return (
    <Modal open={open} onClose={onClose} title={editItem ? "Edit Product" : "Add Product to Quotation"} size="lg" className="!z-[60]">
      <form onSubmit={handleSubmit} className="space-y-4">
        {!editItem && (
          <div className="p-4 bg-[#F5F2EA] rounded-xl border border-[#E5DDD5] mb-2">
            <label className={lbl}>Quick Select Existing Product</label>
            <div className="relative">
              <select 
                onChange={e => handleProductSelect(e.target.value)} 
                className={inp + " pl-10 appearance-none"}
                defaultValue=""
              >
                <option value="" disabled>{loadingProducts ? "Loading products..." : "— Choose a Product to pre-fill —"}</option>
                {products.map(p => (
                  <option key={p._id} value={p._id}>{p.name} ({p.itemNumber})</option>
                ))}
              </select>
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#A89080]" size={16} />
            </div>
          </div>
        )}

        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                  <label className={lbl}>Product Name *</label>
                  <input
                      value={itemName}
                      onChange={e => setItemName(e.target.value)}
                      required
                      placeholder="e.g. 3-Seater Sofa"
                      className={inp}
                  />
              </div>
              <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={lbl}>Category</label>
                    <select value={category} onChange={e => setCategory(e.target.value)} className={inp}>
                        {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className={lbl}>Color</label>
                    <input
                        value={color}
                        onChange={e => setColor(e.target.value)}
                        placeholder="e.g. Brown"
                        className={inp}
                    />
                  </div>
              </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className={lbl}>Quantity *</label>
              <input
                type="number"
                min={0.01}
                step="0.01"
                value={quantity}
                onChange={e => setQuantity(parseFloat(e.target.value) || 1)}
                className={inp}
                required
              />
            </div>
            <div>
              <label className={lbl}>Price *</label>
              <input
                type="number"
                min={0.001}
                step="0.001"
                value={price}
                onChange={e => setPrice(parseFloat(e.target.value) || 0)}
                className={inp}
                required
                placeholder="0.000"
              />
            </div>
            <div>
              <label className={lbl}>Discount Amount</label>
              <input
                type="number"
                min={0}
                step="0.01"
                value={discount}
                onChange={e => setDiscount(parseFloat(e.target.value) || 0)}
                className={inp}
                placeholder="0.00"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className={lbl}>Line Total</label>
              <div className="w-full h-10 border border-[#E5DDD5] rounded-lg px-3 text-sm bg-[#F5F1EE] flex items-center font-bold text-[#1A1210]">
                {((price * quantity) - (discount || 0)).toFixed(3)}
              </div>
            </div>
          </div>
        </div>



        <div className="flex justify-end gap-2 pt-4 border-t border-[#F0EAE3]">
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
            {editItem ? "Update Product" : "Add Product"}
          </button>
        </div>
      </form>
    </Modal>
  );
}


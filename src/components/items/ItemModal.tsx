"use client";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import Modal from "@/components/ui/Modal";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import SearchSelect from "@/components/ui/SearchSelect";
import { IItem, UnitType } from "@/types";

const FURNITURE_CATEGORIES = [
  "Sofa & Seating", "Beds & Mattresses", "Tables & Desks",
  "Wardrobes & Cabinets", "Chairs", "Outdoor Furniture",
  "Kids Furniture", "Office Furniture", "Shelving & Storage",
  "Raw Material - Wood", "Raw Material - Fabric", "Raw Material - Metal",
  "Raw Material - Foam", "Accessories & Hardware", "Other"
];

const UNITS: { value: UnitType; label: string; hint: string }[] = [
  { value: "pcs",       label: "Pieces (pcs)",      hint: "Individual units — chairs, sofas, tables" },
  { value: "set",       label: "Set",                hint: "Grouped sets — dining sets, bedroom sets" },
  { value: "meters",    label: "Meters (m)",         hint: "Length — wood planks, curtain rods, pipes" },
  { value: "sq.meters", label: "Sq. Meters (m²)",   hint: "Area — fabric, glass, board, veneer" },
  { value: "kg",        label: "Kilograms (kg)",     hint: "Weight — metal fittings, foam, hardware" },
  { value: "box",       label: "Box",                hint: "Boxed goods — screws, hinges, handles" },
  { value: "roll",      label: "Roll",               hint: "Rolled material — fabric rolls, edge banding" },
  { value: "liters",    label: "Liters (L)",         hint: "Liquids — paint, varnish, adhesive, polish" },
];

const schema = z.object({
  itemId:          z.string().optional(),
  itemNumber:      z.string().trim().min(1, "Item number is required"),
  name:            z.string().trim().min(1, "Item name is required"),
  category:        z.string().trim().optional(),
  unit:            z.string().trim().default("pcs"),
  salesAmount:     z.coerce.number().min(0, "Sales amount cannot be negative").default(0),
  purchaseAmount:  z.coerce.number().min(0, "Purchase amount cannot be negative").default(0),
  quantity:        z.coerce.number().min(0, "Quantity cannot be negative").default(0),
  batchNumber:     z.string().trim().optional(),
});
type FormData = z.infer<typeof schema>;

interface ItemModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: FormData) => Promise<void>;
  item?: IItem | null;
  loading?: boolean;
  mode?: "new" | "opening_stock";
}

const inputStyle = {
  width: "100%", height: 40, border: "1.5px solid #E5DDD5", borderRadius: 8,
  padding: "0 12px", fontSize: 13, color: "#1A1210", outline: "none",
  background: "#FAF8F6"
};

const labelStyle: React.CSSProperties = {
  fontSize: 12, fontWeight: 600, color: "#5A4035",
  display: "block", marginBottom: 6, letterSpacing: "0.04em"
};

export default function ItemModal({ open, onClose, onSubmit, item, loading, mode = "new" }: ItemModalProps) {
  const isEdit = !!item;
  const [existingItems, setExistingItems] = useState<IItem[]>([]);
  const [selectedUnit, setSelectedUnit] = useState<UnitType>("pcs");

  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema) as any,
  });

  const watchedUnit = watch("unit", "pcs");

  useEffect(() => {
    if (mode === "opening_stock" && open) {
      fetch("/api/items").then(r => r.json()).then(d => setExistingItems(d.data || d));
    }
  }, [mode, open]);

  useEffect(() => {
    if (!open) return;
    const defaults = item
      ? {
          itemNumber: item.itemNumber,
          name: item.name,
          category: item.category || "",
          unit: item.unit || "pcs",
          salesAmount: item.salesAmount || 0,
          purchaseAmount: item.purchaseAmount || 0,
          quantity: item.quantity || 0,
          batchNumber: `OPN-${Date.now().toString().slice(-6)}`,
        }
      : {
          itemNumber: `ITM-${Date.now().toString().slice(-6)}`,
          name: "",
          category: "",
          unit: "pcs",
          salesAmount: 0,
          purchaseAmount: 0,
          quantity: 0,
          batchNumber: `OPN-${Date.now().toString().slice(-6)}`,
        };
    reset(defaults);
    setSelectedUnit((defaults.unit as UnitType) || "pcs");
  }, [open, item, reset, mode]);

  const unitInfo = UNITS.find(u => u.value === (watchedUnit || selectedUnit));

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? "Edit Item" : (mode === "opening_stock" ? "Add Opening Stock" : "New Inventory Item")}
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={loading}>Cancel</Button>
          <Button form="item-form" type="submit" loading={loading}>
            {isEdit ? "Save Changes" : (mode === "opening_stock" ? "Add to Stock" : "Create Item")}
          </Button>
        </>
      }
    >
      <form id="item-form" onSubmit={handleSubmit(onSubmit)} style={{ display: "flex", flexDirection: "column", gap: 16 }}>

        {/* Item selection (opening stock mode) */}
        {mode === "opening_stock" && !isEdit ? (
          <div>
            <label style={labelStyle}>SELECT EXISTING ITEM</label>
            <SearchSelect
              options={existingItems.map((i: IItem) => ({
                label: `${i.itemNumber} — ${i.name} (${i.unit || "pcs"})  [In stock: ${i.quantity}]`,
                value: i._id,
                data: i,
              }))}
              onChange={(opt) => {
                if (opt?.data) {
                  const s = opt.data as IItem;
                  reset({
                    itemId: s._id,
                    itemNumber: s.itemNumber,
                    name: s.name,
                    category: s.category || "",
                    unit: s.unit || "pcs",
                    purchaseAmount: s.purchaseAmount || 0,
                    salesAmount: s.salesAmount || 0,
                    quantity: 0,
                    batchNumber: `OPN-${Date.now().toString().slice(-6)}`,
                  });
                  setSelectedUnit((s.unit as UnitType) || "pcs");
                } else {
                  reset({ itemNumber: `ITM-${Date.now().toString().slice(-6)}`, name: "", unit: "pcs", salesAmount: 0, purchaseAmount: 0, quantity: 0 });
                  setSelectedUnit("pcs");
                }
              }}
              placeholder="Search furniture item…"
            />
            {errors.itemNumber && <p style={{ fontSize: 12, color: "#C0392B", marginTop: 4 }}>{errors.itemNumber.message}</p>}
          </div>
        ) : (
          /* Item number + name for new items */
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1.6fr", gap: 12 }}>
            <div>
              <label style={labelStyle}>ITEM NUMBER</label>
              <input readOnly disabled style={{ ...inputStyle, background: "#F0EAE3", color: "#A89080" }} {...register("itemNumber")} />
              {errors.itemNumber && <p style={{ fontSize: 12, color: "#C0392B", marginTop: 4 }}>{errors.itemNumber.message}</p>}
            </div>
            <div>
              <label style={labelStyle}>ITEM / PRODUCT NAME *</label>
              <input placeholder="e.g. 3-Seater Fabric Sofa" style={inputStyle} {...register("name")} />
              {errors.name && <p style={{ fontSize: 12, color: "#C0392B", marginTop: 4 }}>{errors.name.message}</p>}
            </div>
          </div>
        )}

        {/* Category + Unit */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <div>
            <label style={labelStyle}>CATEGORY</label>
            <select style={{ ...inputStyle, cursor: "pointer" }} {...register("category")}>
              <option value="">Select category…</option>
              {FURNITURE_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label style={labelStyle}>UNIT OF MEASURE *</label>
            <select
              style={{ ...inputStyle, cursor: "pointer" }}
              {...register("unit")}
              onChange={e => { setValue("unit", e.target.value); setSelectedUnit(e.target.value as UnitType); }}
            >
              {UNITS.map(u => <option key={u.value} value={u.value}>{u.label}</option>)}
            </select>
          </div>
        </div>

        {/* Unit hint */}
        {unitInfo && (
          <div style={{
            background: "#FEF5E7", border: "1px solid #FAD7A0", borderRadius: 8,
            padding: "8px 12px", fontSize: 12, color: "#CA6F1E", marginTop: -8
          }}>
            <strong>{unitInfo.label}:</strong> {unitInfo.hint}
          </div>
        )}

        {/* Prices + Quantity */}
        <div style={{ borderTop: "1px solid #F0EAE3", paddingTop: 14 }}>
          <p style={{ fontSize: 12, fontWeight: 700, color: "#5A4035", marginBottom: 10, textTransform: "uppercase", letterSpacing: "0.04em" }}>
            Pricing & Stock
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
            <div>
              <label style={labelStyle}>PURCHASE PRICE</label>
              <input type="number" step="0.001" placeholder="0.000" style={inputStyle} {...register("purchaseAmount")} />
              {errors.purchaseAmount && <p style={{ fontSize: 12, color: "#C0392B", marginTop: 4 }}>{errors.purchaseAmount.message}</p>}
            </div>
            <div>
              <label style={labelStyle}>SELLING PRICE</label>
              <input type="number" step="0.001" placeholder="0.000" style={inputStyle} {...register("salesAmount")} />
              {errors.salesAmount && <p style={{ fontSize: 12, color: "#C0392B", marginTop: 4 }}>{errors.salesAmount.message}</p>}
            </div>
            <div>
              <label style={labelStyle}>
                {mode === "opening_stock" ? "OPENING QTY" : "QUANTITY"} ({unitInfo?.value || "pcs"})
              </label>
              <input type="number" step="0.01" placeholder="0" style={inputStyle} {...register("quantity")} />
              {errors.quantity && <p style={{ fontSize: 12, color: "#C0392B", marginTop: 4 }}>{errors.quantity.message}</p>}
            </div>
          </div>
        </div>

        {/* Stock entry ref (opening stock) */}
        {mode === "opening_stock" && (
          <div>
            <label style={labelStyle}>STOCK ENTRY REFERENCE</label>
            <input
              readOnly disabled
              style={{ ...inputStyle, background: "#F0EAE3", color: "#A89080" }}
              {...register("batchNumber")}
            />
            <p style={{ fontSize: 11, color: "#A89080", marginTop: 4 }}>Auto-generated opening stock reference</p>
          </div>
        )}
      </form>
    </Modal>
  );
}

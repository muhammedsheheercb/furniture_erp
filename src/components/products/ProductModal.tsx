"use client";
import { useEffect, useState } from "react";
import { useForm, type Resolver } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import axios from "axios";
import Modal from "@/components/ui/Modal";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import { Package, Tag, Layers, Ruler, Box, Info } from "lucide-react";

const schema = z.object({
  itemNumber: z.string().min(1, "SKU is required"),
  name: z.string().min(1, "Product name is required"),
  category: z.string().min(1, "Category is required"),
  primaryMaterial: z.string().min(1, "Primary material is required"),
  purchaseAmount: z.coerce.number().min(0, "Cost must be positive"),
  salesAmount: z.coerce.number().min(0, "Price must be positive"),
  mrp: z.coerce.number().min(0, "MRP must be positive"),
  quantity: z.coerce.number().min(0).default(0),
  reorderLevel: z.coerce.number().min(0).default(5),
  unit: z.string().min(1, "Unit is required"),
  status: z.enum(["active", "inactive", "discontinued"]),
  isManufactured: z.boolean().default(false),
  
  // Optional
  dimensions: z.object({
    length: z.coerce.number().optional(),
    width: z.coerce.number().optional(),
    height: z.coerce.number().optional(),
  }).optional(),
  color: z.string().optional(),
  finish: z.string().optional(),
  description: z.string().optional(),
  taxRate: z.coerce.number().optional(),
  leadTime: z.coerce.number().optional(),
  supplierName: z.string().optional(),
  warrantyPeriod: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

interface ProductModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: any) => Promise<void>;
  product?: any | null;
  loading?: boolean;
}

const CATEGORIES = ["Sofa", "Bed", "Chair", "Table", "Wardrobe", "Office", "Dining", "Other"];
const MATERIALS = ["Wood", "Metal", "Glass", "Fabric", "Leather", "Plastic", "Other"];
const UNITS = ["Piece", "Set", "Pair", "Bundle", "Meter"];

export default function ProductModal({
  open,
  onClose,
  onSubmit,
  product,
  loading,
}: ProductModalProps) {
  const [activeTab, setActiveTab] = useState("general");
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const isEdit = !!product;

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema) as Resolver<FormData>,
    defaultValues: {
      status: "active",
      isManufactured: false,
      unit: "Piece",
      category: "Sofa",
      primaryMaterial: "Wood",
      quantity: 0,
      reorderLevel: 5,
    }
  });

  const isManufactured = watch("isManufactured");

  useEffect(() => {
    const fetchSuppliers = async () => {
      try {
        const res = await axios.get("/api/suppliers");
        if (res.data.success) {
          setSuppliers(res.data.data);
        }
      } catch (err) {
        console.error("Failed to fetch suppliers:", err);
      }
    };
    if (open) fetchSuppliers();
  }, [open]);

  useEffect(() => {
    if (open) {
      if (product) {
        reset({
          itemNumber: product.itemNumber,
          name: product.name,
          category: product.category,
          primaryMaterial: product.primaryMaterial || "Wood",
          purchaseAmount: product.purchaseAmount || 0,
          salesAmount: product.salesAmount || 0,
          mrp: product.mrp || 0,
          quantity: product.quantity || 0,
          reorderLevel: product.reorderLevel || 5,
          unit: product.unit || "Piece",
          status: product.status || "active",
          isManufactured: !!product.isManufactured,
          dimensions: product.dimensions || { length: 0, width: 0, height: 0 },
          color: product.color || "",
          finish: product.finish || "",
          description: product.description || "",
          taxRate: product.taxRate || 0,
          leadTime: product.leadTime || 0,
          supplierName: product.supplierName || "",
          warrantyPeriod: product.warrantyPeriod || "",
        });
      } else {
        reset({
          itemNumber: `PRD-${Math.floor(1000 + Math.random() * 9000)}`,
          name: "",
          category: "Sofa",
          primaryMaterial: "Wood",
          purchaseAmount: 0,
          salesAmount: 0,
          mrp: 0,
          quantity: 0,
          reorderLevel: 5,
          unit: "Piece",
          status: "active",
          isManufactured: false,
        });
      }
      setActiveTab("general");
    }
  }, [open, product, reset]);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? `Edit Product: ${product.name}` : "Create New Product"}
      className="max-w-3xl"
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button form="product-form" type="submit" loading={loading}>
            {isEdit ? "Update Product" : "Create Product"}
          </Button>
        </>
      }
    >
      <div className="flex gap-2 mb-6 border-b overflow-x-auto pb-1">
        {[
          { id: "general", label: "General Information", icon: Package },
          { id: "pricing", label: "Pricing & Stock", icon: Tag },
          { id: "details", label: "Additional Details", icon: Info },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium transition-colors whitespace-nowrap border-b-2 ${
              activeTab === tab.id
                ? "border-[#C9A84C] text-[#C9A84C]"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            <tab.icon size={16} />
            {tab.label}
          </button>
        ))}
      </div>

      <form id="product-form" onSubmit={handleSubmit(onSubmit)} className="space-y-6 min-h-[400px]">
        {activeTab === "general" && (
          <div className="space-y-4 animate-in fade-in duration-300">
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="SKU / Unique Code"
                required
                readOnly={isEdit}
                error={errors.itemNumber?.message}
                {...register("itemNumber")}
                className={isEdit ? "bg-gray-50" : ""}
              />
              <Input
                label="Product Name"
                placeholder="e.g. 3-Seater Velvet Sofa"
                required
                error={errors.name?.message}
                {...register("name")}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium">Category *</label>
                <select {...register("category")} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm">
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium">Primary Material *</label>
                <select {...register("primaryMaterial")} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm">
                  {MATERIALS.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-2">
              <div className="flex items-center gap-2 p-3 rounded-lg border bg-[#FAF8F6]">
                <input type="checkbox" id="isManufactured" {...register("isManufactured")} className="w-4 h-4 rounded border-gray-300 text-[#C9A84C] focus:ring-[#C9A84C]" />
                <label htmlFor="isManufactured" className="text-sm font-medium text-gray-700 cursor-pointer">
                  This is a Manufactured Product (BOM needed)
                </label>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium">Status</label>
                <select {...register("status")} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm">
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="discontinued">Discontinued</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {activeTab === "pricing" && (
          <div className="space-y-4 animate-in fade-in duration-300">
            <div className="grid grid-cols-3 gap-4">
              <Input label="Cost Price" type="number" step="0.001" required error={errors.purchaseAmount?.message} {...register("purchaseAmount")} />
              <Input label="Selling Price" type="number" step="0.001" required error={errors.salesAmount?.message} {...register("salesAmount")} />
              <Input label="MRP" type="number" step="0.001" required error={errors.mrp?.message} {...register("mrp")} />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <Input label="Current Stock" type="number" required error={errors.quantity?.message} {...register("quantity")} />
              <Input label="Reorder Level" type="number" required error={errors.reorderLevel?.message} {...register("reorderLevel")} />
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium">Unit *</label>
                <select {...register("unit")} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm">
                  {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                </select>
              </div>
            </div>

            <div className="p-4 rounded-lg bg-blue-50 border border-blue-100 flex gap-3 text-sm text-blue-700">
              <Info size={20} className="shrink-0" />
              <p>Stock alerts will trigger when quantity drops below the reorder level.</p>
            </div>
          </div>
        )}

        {activeTab === "details" && (
          <div className="space-y-4 animate-in fade-in duration-300">
             <div className="flex items-center gap-2 font-semibold text-[#1A1210] pb-1 border-b">
               <Ruler size={16} /> Dimensions (L × W × H)
             </div>
             <div className="grid grid-cols-3 gap-4">
                <Input label="Length" type="number" {...register("dimensions.length")} />
                <Input label="Width" type="number" {...register("dimensions.width")} />
                <Input label="Height" type="number" {...register("dimensions.height")} />
             </div>

             <div className="grid grid-cols-2 gap-4">
                <Input label="Color" placeholder="e.g. Charcoal Grey" {...register("color")} />
                <Input label="Finish" placeholder="e.g. Matte Polish" {...register("finish")} />
             </div>

             <div className="grid grid-cols-2 gap-4">
                <Input label="Tax Rate %" type="number" {...register("taxRate")} />
                <Input label="Warranty Period" placeholder="e.g. 1 Year" {...register("warrantyPeriod")} />
             </div>

             <div className="grid grid-cols-2 gap-4">
                {isManufactured ? (
                  <Input label="Lead Time (Days)" type="number" {...register("leadTime")} />
                ) : (
                  <div className="flex flex-col gap-1">
                    <label className="text-sm font-medium text-gray-700">Primary Supplier</label>
                    <select 
                      {...register("supplierName")} 
                      className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors"
                    >
                      <option value="">Select Supplier</option>
                      {suppliers.map(s => (
                        <option key={s._id} value={s.name}>{s.name}</option>
                      ))}
                    </select>
                  </div>
                )}
                <div className="flex flex-col gap-1">
                  <label className="text-sm font-medium">Description</label>
                  <textarea 
                    {...register("description")} 
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm h-[38px] min-h-[38px]"
                    placeholder="Enter product description..."
                  />
                </div>
             </div>
          </div>
        )}
      </form>
    </Modal>
  );
}

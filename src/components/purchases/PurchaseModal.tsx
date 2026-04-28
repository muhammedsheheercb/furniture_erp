"use client";
import { useEffect, useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import Modal from "@/components/ui/Modal";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import { Plus, Trash2 } from "lucide-react";
import axios from "axios";
import { toast } from "sonner";

const itemSchema = z.object({
  productId: z.string().min(1, "Product is required"),
  productName: z.string(),
  quantity: z.coerce.number().min(1, "Qty must be at least 1"),
  price: z.coerce.number().min(0),
  total: z.coerce.number(),
});

const schema = z.object({
  supplierId: z.string().min(1, "Supplier is required"),
  supplierName: z.string(),
  date: z.string(),
  paymentType: z.enum(["cash", "bank", "credit"]),
  items: z.array(itemSchema).min(1, "Add at least one item"),
  total: z.coerce.number(),
  paidAmount: z.coerce.number().default(0),
  note: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

interface PurchaseModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: any) => Promise<void>;
  purchase?: any | null;
  loading?: boolean;
}

export default function PurchaseModal({
  open,
  onClose,
  onSubmit,
  purchase,
  loading,
}: PurchaseModalProps) {
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const isEdit = !!purchase;

  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      date: new Date().toISOString().split("T")[0],
      paymentType: "cash",
      items: [],
      total: 0,
      paidAmount: 0,
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "items",
  });

  const watchedItems = watch("items");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [supRes, prodRes] = await Promise.all([
          axios.get("/api/suppliers"),
          axios.get("/api/items"),
        ]);
        setSuppliers(supRes.data.data || []);
        setProducts(prodRes.data.data || []);
      } catch (err) {
        toast.error("Failed to load selection data");
      }
    };
    if (open) fetchData();
  }, [open]);

  useEffect(() => {
    if (open) {
      if (purchase) {
        reset({
          supplierId: purchase.supplierId?._id || purchase.supplierId || "",
          supplierName: purchase.supplierName,
          date: new Date(purchase.date).toISOString().split("T")[0],
          paymentType: purchase.paymentType || "cash",
          items: purchase.items || [],
          total: purchase.total || 0,
          paidAmount: purchase.paidAmount || 0,
          note: purchase.note || "",
        });
      } else {
        reset({
          date: new Date().toISOString().split("T")[0],
          paymentType: "cash",
          items: [],
          total: 0,
          paidAmount: 0,
        });
      }
    }
  }, [open, purchase, reset]);

  useEffect(() => {
    const total = watchedItems.reduce((sum, item) => sum + (Number(item.total) || 0), 0);
    setValue("total", total);
  }, [watchedItems, setValue]);

  const handleProductChange = (index: number, productId: string) => {
    const product = products.find((p) => p._id === productId);
    if (product) {
      setValue(`items.${index}.productName`, product.name);
      setValue(`items.${index}.price`, product.purchaseAmount || 0);
      const qty = watchedItems[index].quantity || 1;
      setValue(`items.${index}.total`, (product.purchaseAmount || 0) * qty);
    }
  };

  const handleQtyChange = (index: number, qty: number) => {
    const price = watchedItems[index].price || 0;
    setValue(`items.${index}.total`, price * qty);
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? "Edit Purchase Order" : "New Purchase Order"}
      className="max-w-4xl"
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button form="purchase-form" type="submit" loading={loading}>
            {isEdit ? "Update Order" : "Create Order"}
          </Button>
        </>
      }
    >
      <form id="purchase-form" onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium">Supplier</label>
            <select
              {...register("supplierId")}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              onChange={(e) => {
                const s = suppliers.find(sup => sup._id === e.target.value);
                if (s) setValue("supplierName", s.name);
              }}
            >
              <option value="">Select Supplier</option>
              {suppliers.map((s) => (
                <option key={s._id} value={s._id}>
                  {s.name}
                </option>
              ))}
            </select>
            {errors.supplierId && <p className="text-xs text-red-500">{errors.supplierId.message}</p>}
          </div>
          <Input label="Date" type="date" {...register("date")} />
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium">Payment Type</label>
            <select
              {...register("paymentType")}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            >
              <option value="cash">Cash</option>
              <option value="bank">Bank / UPI</option>
              <option value="credit">Credit / On Account</option>
            </select>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="font-bold text-[#1A1210]">Order Items</h3>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => append({ productId: "", productName: "", quantity: 1, price: 0, total: 0 })}
            >
              <Plus size={14} className="mr-1" /> Add Item
            </Button>
          </div>

          <div className="border rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="py-2 px-3 text-left">Product</th>
                  <th className="py-2 px-3 text-center w-24">Qty</th>
                  <th className="py-2 px-3 text-right w-32">Price</th>
                  <th className="py-2 px-3 text-right w-32">Total</th>
                  <th className="py-2 px-3 text-center w-12"></th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {fields.map((field, index) => (
                  <tr key={field.id}>
                    <td className="p-2">
                      <select
                        {...register(`items.${index}.productId`)}
                        className="w-full rounded border-gray-300 text-sm"
                        onChange={(e) => handleProductChange(index, e.target.value)}
                      >
                        <option value="">Select Product</option>
                        {products.map((p) => (
                          <option key={p._id} value={p._id}>
                            {p.name} ({p.itemNumber})
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="p-2">
                      <input
                        type="number"
                        {...register(`items.${index}.quantity`)}
                        className="w-full rounded border-gray-300 text-sm text-center"
                        onChange={(e) => handleQtyChange(index, Number(e.target.value))}
                      />
                    </td>
                    <td className="p-2">
                      <input
                        type="number"
                        {...register(`items.${index}.price`)}
                        className="w-full rounded border-gray-300 text-sm text-right"
                        readOnly
                      />
                    </td>
                    <td className="p-2 text-right font-medium">
                      OMR {watchedItems[index]?.total?.toLocaleString() || 0}
                    </td>
                    <td className="p-2 text-center">
                      <button type="button" onClick={() => remove(index)} className="text-red-500">
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
                {fields.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-gray-400">No items added yet</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="flex flex-col items-end gap-2 pt-4 border-t">
          <div className="flex items-center gap-4 text-lg">
            <span className="font-medium text-gray-600">Grand Total:</span>
            <span className="font-bold text-2xl text-[#1A1210]">OMR {watch("total")?.toLocaleString() || 0}</span>
          </div>
          <div className="w-full max-w-xs">
            <Input label="Paid Amount (Optional)" type="number" {...register("paidAmount")} />
          </div>
        </div>
      </form>
    </Modal>
  );
}

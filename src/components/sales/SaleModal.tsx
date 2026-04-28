"use client";
import { useEffect, useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import Modal from "@/components/ui/Modal";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import { Plus, Trash2, Search } from "lucide-react";
import axios from "axios";
import { toast } from "sonner";

const itemSchema = z.object({
  itemId: z.string().optional(),
  itemNumber: z.string().optional(),
  itemName: z.string().min(1, "Item name is required"),
  quantity: z.coerce.number().min(1, "Qty must be at least 1"),
  price: z.coerce.number().min(0),
  color: z.string().optional(),
  material: z.string().optional(),
  size: z.string().optional(),
  total: z.coerce.number(),
});

const schema = z.object({
  customerId: z.string().min(1, "Customer is required"),
  customerName: z.string(),
  customerNumber: z.string().optional(),
  date: z.string(),
  paymentType: z.enum(["cash", "bank", "credit"]),
  items: z.array(itemSchema).min(1, "Add at least one item"),
  subtotal: z.coerce.number(),
  total: z.coerce.number(),
  advancePaid: z.coerce.number().default(0),
  deliveryDate: z.string().optional(),
  deliveryAddress: z.string().optional(),
  remarks: z.string().optional(),
  note: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

interface SaleModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: any) => Promise<void>;
  sale?: any | null;
  loading?: boolean;
}

export default function SaleModal({
  open,
  onClose,
  onSubmit,
  sale,
  loading,
}: SaleModalProps) {
  const [customers, setCustomers] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const isEdit = !!sale;

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
      subtotal: 0,
      total: 0,
      advancePaid: 0,
      deliveryDate: "",
      deliveryAddress: "",
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
        const [custRes, prodRes] = await Promise.all([
          axios.get("/api/customers"),
          axios.get("/api/items"),
        ]);
        setCustomers(custRes.data.data || []);
        setProducts(prodRes.data.data || []);
      } catch (err) {
        toast.error("Failed to load selection data");
      }
    };
    if (open) fetchData();
  }, [open]);

  useEffect(() => {
    if (open) {
      if (sale) {
        const itemsMapped = sale.items?.map((it: any) => {
          const item: any = {
            itemNumber: it.itemNumber || it.productNumber || "",
            itemName: it.itemName || it.productName || "",
            quantity: it.quantity || 1,
            price: it.price || 0,
            color: it.color || "",
            material: it.material || "",
            size: it.size || "",
            total: it.total || 0,
          };
          // Only add itemId if it's a valid string (not empty)
          if (it.itemId && it.itemId !== "") {
            item.itemId = it.itemId;
          } else if (it.productId && it.productId !== "") {
            item.itemId = it.productId;
          }
          return item;
        }) || [];

        reset({
          customerId: sale.customerId?._id || sale.customerId || "",
          customerName: sale.customerName,
          customerNumber: sale.customerNumber || "",
          date: new Date(sale.date || new Date()).toISOString().split("T")[0],
          paymentType: sale.paymentType || "cash",
          items: itemsMapped,
          subtotal: sale.subtotal || sale.total || 0,
          total: sale.total || 0,
          advancePaid: sale.advancePaid || sale.paidAmount || 0,
          deliveryDate: sale.deliveryDate ? new Date(sale.deliveryDate).toISOString().split("T")[0] : "",
          deliveryAddress: sale.deliveryAddress || "",
          remarks: sale.remarks || "",
          note: sale.note || "",
        });
      } else {
        reset({
          date: new Date().toISOString().split("T")[0],
          paymentType: "cash",
          items: [],
          subtotal: 0,
          total: 0,
          advancePaid: 0,
          deliveryDate: "",
          deliveryAddress: "",
        });
      }
    }
  }, [open, sale, reset]);

  useEffect(() => {
    const subtotal = watchedItems.reduce((sum, item) => sum + (Number(item.total) || 0), 0);
    setValue("subtotal", subtotal);
    setValue("total", subtotal); // Currently assuming total = subtotal if no tax/discount in modal
  }, [watchedItems, setValue]);

  const handleProductChange = (index: number, productId: string) => {
    const product = products.find((p) => p._id === productId);
    if (product) {
      setValue(`items.${index}.itemId`, product._id);
      setValue(`items.${index}.itemNumber`, product.itemNumber);
      setValue(`items.${index}.itemName`, product.name);
      setValue(`items.${index}.price`, product.salesAmount || 0);
      const qty = watchedItems[index].quantity || 1;
      setValue(`items.${index}.total`, (product.salesAmount || 0) * qty);
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
      title={isEdit ? "Edit Sale Order" : "New Sale Order"}
      className="max-w-4xl"
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button form="sale-form" type="submit" loading={loading}>
            {isEdit ? "Update Order" : "Create Order"}
          </Button>
        </>
      }
    >
      <form id="sale-form" onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium">Customer</label>
            {sale ? (
              <div className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm font-semibold text-[#1A1210]">
                {sale.customerName}
              </div>
            ) : (
              <select
                {...register("customerId")}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                onChange={(e) => {
                  const c = customers.find(cust => cust._id === e.target.value);
                  if (c) {
                    setValue("customerName", c.name);
                    setValue("customerNumber", c.customerNumber);
                  }
                }}
              >
                <option value="">Select Customer</option>
                {customers.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.name}
                  </option>
                ))}
              </select>
            )}
            {errors.customerId && <p className="text-xs text-red-500">{errors.customerId.message}</p>}
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
          </div>

          <div className="border rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b hidden md:table-header-group">
                <tr>
                   <th className="py-2 px-3 text-left">Product</th>
                   <th className="py-2 px-3 text-left">Color</th>
                   <th className="py-2 px-3 text-left">Material</th>
                   <th className="py-2 px-3 text-left">Size</th>
                   <th className="py-2 px-3 text-center w-20">Qty</th>
                   <th className="py-2 px-3 text-right w-28">Price</th>
                   <th className="py-2 px-3 text-right w-28">Total</th>
                   <th className="py-2 px-3 text-center w-10"></th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {fields.map((field, index) => (
                  <tr key={field.id} className="flex flex-col md:table-row p-4 md:p-0 space-y-2 md:space-y-0">
                     <td className="md:p-2">
                        <label className="md:hidden text-xs font-bold text-gray-400 uppercase mb-1 block">Product</label>
                        <input
                          {...register(`items.${index}.itemName`)}
                          className="w-full rounded border-gray-300 text-sm disabled:bg-gray-50"
                          placeholder="Item Name"
                          disabled={sale?.isConversion}
                        />
                     </td>
                     {(["color", "material", "size"] as const).map(f => (
                       <td key={f} className="md:p-2">
                         <label className="md:hidden text-xs font-bold text-gray-400 uppercase mb-1 block">{f}</label>
                         <input
                           {...register(`items.${index}.${f}`)}
                           className="w-full rounded border-gray-300 text-sm disabled:bg-gray-50"
                           placeholder={f}
                           disabled={sale?.isConversion}
                         />
                       </td>
                     ))}
                     <td className="md:p-2">
                        <label className="md:hidden text-xs font-bold text-gray-400 uppercase mb-1 block">Qty</label>
                        <input
                          type="number"
                          {...register(`items.${index}.quantity`)}
                          className="w-full rounded border-gray-300 text-sm text-center disabled:bg-gray-50"
                          onChange={(e) => handleQtyChange(index, Number(e.target.value))}
                          disabled={sale?.isConversion}
                        />
                     </td>
                     <td className="md:p-2">
                        <label className="md:hidden text-xs font-bold text-gray-400 uppercase mb-1 block">Price</label>
                        <input
                          type="number"
                          {...register(`items.${index}.price`)}
                          className="w-full rounded border-gray-300 text-sm text-right disabled:bg-gray-50"
                          onChange={(e) => {
                            const p = Number(e.target.value);
                            const q = watchedItems[index].quantity || 1;
                            setValue(`items.${index}.total`, p * q);
                          }}
                          disabled={sale?.isConversion}
                        />
                     </td>
                     <td className="md:p-2 text-right font-medium">
                        <label className="md:hidden text-xs font-bold text-gray-400 uppercase mb-1 block text-left">Total</label>
                        <div className="py-2">
                          {watchedItems[index]?.total?.toLocaleString() || 0}
                        </div>
                     </td>
                     <td className="md:p-2 text-center">
                     </td>
                  </tr>
                ))}
                {fields.length === 0 && (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-gray-400">No items added yet</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="flex flex-col items-end gap-2 pt-4 border-t">
           <div className="flex items-center gap-4 text-lg">
             <span className="font-medium text-gray-600">Grand Total:</span>
             <span className="font-bold text-2xl text-[#1A1210]">{watch("total")?.toLocaleString() || 0}</span>
           </div>
           <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
             <div className="flex flex-col gap-4">
               <Input label="Advance Paid (Optional)" type="number" {...register("advancePaid")} />
               <Input label="Delivery Date" type="date" {...register("deliveryDate")} />
             </div>
             <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-sm font-medium">Delivery Address</label>
                  <textarea
                    {...register("deliveryAddress")}
                    rows={3}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                    placeholder="Where to deliver?"
                  />
                </div>
                <Input label="Remarks for Production" {...register("remarks")} placeholder="Special instructions..." />
             </div>
           </div>
        </div>
      </form>
    </Modal>
  );
}

"use client";
import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  Plus,
  Trash2,
  Save,
  FileDown,
  Pencil,
  Minus,
  Plus as PlusIcon,
} from "lucide-react";
import TopBar from "@/components/layout/TopBar";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import SearchSelect from "@/components/ui/SearchSelect";
import ConfirmModal from "@/components/ui/ConfirmModal";
import Spinner from "@/components/ui/Spinner";
import { usePurchases } from "@/hooks/usePurchases";
import {
  ISupplier,
  IItem,
  IPurchaseItem,
  ISelectOption,
  PaymentType,
} from "@/types";
import { formatCurrency, formatDateInput } from "@/lib/utils";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import toast from "react-hot-toast";
import { useSession } from "next-auth/react";
import { useLanguage } from "../../../../../context/LanguageContext";

interface CartItem extends IPurchaseItem {
  _itemRef?: IItem;
}

export default function EditPurchasePage() {
  const { t } = useLanguage();
  const router = useRouter();
  const { id } = useParams();
  const { updatePurchase } = usePurchases();
  const { data: session, status } = useSession();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    } else if (status === "authenticated") {
      const isAdmin = session?.user?.role === "admin";
      const canEdit =
        isAdmin || (session?.user?.permissions as any)?.purchases?.edit;
      if (!canEdit) {
        router.push("/purchases");
      }
    }
  }, [session, status, router]);

  const [suppliers, setSuppliers] = useState<ISupplier[]>([]);
  const [purchasers, setPurchasers] = useState<any[]>([]);
  const [items, setItems] = useState<IItem[]>([]);
  const [selSupplier, setSelSupplier] = useState<ISelectOption | null>(null);
  const [selPurchaser, setSelPurchaser] = useState<ISelectOption | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [paymentType, setPaymentType] = useState<PaymentType>("cash");
  const [tax, setTax] = useState(0);
  const [date, setDate] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [isTaxInvoice, setIsTaxInvoice] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const [sr, ir, pr, pur] = await Promise.all([
          fetch("/api/suppliers?limit=500").then((r) => r.json()),
          fetch("/api/items?limit=500").then((r) => r.json()),
          fetch("/api/purchasers").then((r) => r.json()),
          fetch(`/api/purchases/${id}`).then((r) => r.json()),
        ]);
        if (sr.success) setSuppliers(sr.data);
        if (ir.success) setItems(ir.data);
        if (pr.success) setPurchasers(pr.data);
        if (pur.success) {
          const p = pur.data;
          const itemsInInv = ir.data || [];
          setSelSupplier({
            value: p.supplierId,
            label: `${p.supplierName} (${p.supplierNumber})`,
            data: {
              _id: p.supplierId,
              name: p.supplierName,
              supplierNumber: p.supplierNumber,
            } as ISupplier,
          });

          if (p.purchaserId) {
            setSelPurchaser({
              value: p.purchaserId,
              label: p.purchaserName,
              data: { _id: p.purchaserId, name: p.purchaserName } as any,
            });
          }

          // Format dates and ensure sellingPrice is taken from record or inventory
          const formattedItems = p.items.map((pi: any) => {
            const invItem = itemsInInv.find((i: IItem) => i._id === pi.itemId);
            return {
              ...pi,
              sellingPrice: pi.sellingPrice || invItem?.salesAmount || 0,
              manufacturingDate: formatDateInput(pi.manufacturingDate),
              expiryDate: formatDateInput(pi.expiryDate),
            };
          });
          setCart(formattedItems);

          setPaymentType(p.paymentType);
          setTax(p.tax);
          setDate(formatDateInput(p.date));
          setIsTaxInvoice(p.isTaxInvoice || false);
        } else {
          toast.error("Purchase not found");
          router.push("/purchases");
        }
      } catch {
        toast.error("Failed to load data");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id, router]);

  const supplierOptions: ISelectOption[] = suppliers.map((s) => ({
    value: s._id,
    label: `${s.name} (${s.supplierNumber})`,
    data: s,
  }));

  const purchaserOptions: ISelectOption[] = purchasers.map((p) => ({
    value: p._id,
    label: `${p.name} ${p.mobile ? `(${p.mobile})` : ""}`,
    data: p as any,
  }));

  const itemOptions: ISelectOption[] = items.map((i) => ({
    value: i._id,
    label: `${i.name} — Cost: ${formatCurrency(i.purchaseAmount || 0)} | Sale: ${formatCurrency(i.salesAmount || 0)}`,
    data: i,
  }));

  const addItem = (opt: ISelectOption | null) => {
    if (!opt) return;
    const item = opt.data as IItem;
    if (cart.find((c) => c.itemId === item._id)) return;
    setCart((prev) => [
      ...prev,
      {
        itemId: item._id,
        itemNumber: item.itemNumber,
        itemName: item.name,
        quantity: 1,
        price: item.purchaseAmount || 0, // Cost Price
        sellingPrice: item.salesAmount || 0, // Current Selling Price
        total: item.purchaseAmount || 0,
        manufacturingDate: formatDateInput(item.manufacturingDate || ""),
        expiryDate: formatDateInput(item.expiryDate || ""),
        batch: "",
        _itemRef: item,
      },
    ]);
  };

  const updateQty = (idx: number, qtyRaw: any) => {
    setCart((prev) =>
      prev.map((c, i) => {
        if (i !== idx) return c;
        const q = qtyRaw === "" ? 0 : Number(qtyRaw);
        const val = q < 0 ? 0 : q;
        return {
          ...c,
          quantity: qtyRaw === "" ? ("" as any) : val,
          total: Number((Number(c.price || 0) * val).toFixed(3)),
        };
      }),
    );
  };

  const updatePrice = (idx: number, priceRaw: any) => {
    setCart((prev) =>
      prev.map((c, i) => {
        if (i !== idx) return c;
        const p = priceRaw === "" ? 0 : Number(priceRaw);
        const val = p < 0 ? 0 : p;
        const q = (c.quantity as any) === "" ? 0 : Number(c.quantity);
        return {
          ...c,
          price: priceRaw === "" ? ("" as any) : val,
          total: Number((val * q).toFixed(3)),
        };
      }),
    );
  };

  const updateTotal = (idx: number, totalRaw: any) => {
    setCart((prev) =>
      prev.map((c, i) => {
        if (i !== idx) return c;
        const t = totalRaw === "" ? 0 : Number(totalRaw);
        const val = t < 0 ? 0 : t;
        const q = (c.quantity as any) === "" ? 0 : Number(c.quantity);
        const newPrice = q > 0 ? Number((val / q).toFixed(3)) : c.price;
        return {
          ...c,
          total: totalRaw === "" ? ("" as any) : val,
          price: newPrice,
        };
      }),
    );
  };

  const removeItem = (idx: number) =>
    setCart((prev) => prev.filter((_, i) => i !== idx));

  const subtotal = cart.reduce((s, c) => s + c.total, 0);
  const taxAmt = subtotal * (tax / 100);
  const total = subtotal + taxAmt;

  const handleSave = async (shouldPrint: boolean = false) => {
    if (!selSupplier || cart.length === 0) return;
    setSaving(true);
    const supplier = selSupplier.data as ISupplier;
    const purchaseData: any = {
      supplierId: supplier._id,
      supplierName: supplier.name,
      supplierNumber: supplier.supplierNumber,
      items: cart.map(({ _itemRef: _, ...rest }) => rest),
      subtotal,
      tax,
      total,
      paymentType,
      date,
      isTaxInvoice,
    };
    if (selPurchaser) {
      purchaseData.purchaserId = selPurchaser.value;
      purchaseData.purchaserName = (selPurchaser.data as any)?.name;
    } else {
      purchaseData.purchaserId = null;
      purchaseData.purchaserName = "";
    }

    const response = await fetch(`/api/purchases/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(purchaseData),
    });

    const data = await response.json();
    setSaving(false);

    if (data.success) {
      toast.success("Purchase updated successfully");
      if (shouldPrint) {
        const { generateInvoicePDF } = await import("@/lib/pdf-utils");
        generateInvoicePDF({
          number: data.data.purchaseNumber || "PUR",
          customerOrSupplier: supplier.name,
          customerOrSupplierNumber: supplier.supplierNumber,
          date: date,
          paymentType: paymentType,
          items: cart,
          subtotal,
          tax,
          total,
          type: "Purchase",
          isTaxInvoice,
        });
      }
      router.push("/purchases");
    } else {
      toast.error(data.message || "Failed to update purchase");
    }
  };

  if (loading)
    return (
      <div className="py-20 text-center">
        <Spinner />
      </div>
    );

  return (
    <div className="page-container max-w-4xl">
      <TopBar title={t("editPurchase")} subtitle={`Updating record #${id}`} />

      <div className="card p-6 flex flex-col gap-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <SearchSelect
              label={t("supplier")}
              options={supplierOptions}
              value={selSupplier}
              onChange={setSelSupplier}
              required
            />
          </div>
          <div>
            <SearchSelect
              label={t("purchaser") || "Purchaser"}
              placeholder={t("selectPurchaser") || "Select Purchaser (Optional)"}
              options={purchaserOptions}
              value={selPurchaser}
              onChange={setSelPurchaser}
            />
          </div>
          <Input
            label={t("date")}
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            required
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">
              {t("paymentType")}
            </label>
            <div className="flex flex-col sm:flex-row gap-2">
              {(["cash", "credit", "bank"] as PaymentType[]).map((t) => (
                <button
                  key={t}
                  onClick={() => setPaymentType(t)}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-colors capitalize
                    ${paymentType === t ? "bg-amber-600 text-white border-amber-600 shadow-md" : "border-gray-300 text-gray-600 hover:bg-gray-50"}`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <Input
              label={t("tax")}
              type="number"
              min={0}
              max={100}
              value={tax}
              onChange={(e) => {
                const val = e.target.value;
                if (val === "") setTax("" as any);
                else {
                  const n = Number(val);
                  setTax(n < 0 ? 0 : n);
                }
              }}
            />
            <div className="flex items-center gap-2 mt-1">
              <input
                type="checkbox"
                id="isTaxInvoice"
                checked={isTaxInvoice}
                onChange={(e) => setIsTaxInvoice(e.target.checked)}
                className="w-4 h-4 rounded border-gray-300 text-amber-600 focus:ring-amber-500"
              />
              <label
                htmlFor="isTaxInvoice"
                className="text-sm font-medium text-gray-700 cursor-pointer select-none"
              >
                {t("separateTaxBillDetails")}
              </label>
            </div>
          </div>
        </div>

        <div>
          <label className="text-sm font-medium text-gray-700 block mb-1">
            {t("addItem")}
          </label>
          <SearchSelect
            placeholder={t("searchItems")}
            options={itemOptions}
            value={null}
            onChange={addItem}
          />
        </div>

        {cart.length > 0 && (
          <div className="table-wrapper">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="th text-start">{t("item")}</th>
                  <th className="th text-end">{t("purchasePrice")}</th>
                  <th className="th text-end">{t("salesPrice")}</th>
                  <th className="th text-center">{t("batch")}</th>
                  <th className="th text-center">{t("mfgDate")}</th>
                  <th className="th text-center">{t("expDate")}</th>
                  <th className="th text-center">{t("qty")}</th>
                  <th className="th text-end">{t("total")}</th>
                  <th className="th" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {cart.map((c, idx) => (
                  <tr key={c.itemId || idx}>
                    <td className="td text-start">
                      <div className="font-medium text-gray-900">
                        {c.itemName}
                      </div>
                      <div className="text-xs text-gray-400">
                        {c.itemNumber}
                      </div>
                    </td>
                    <td className="td text-end">
                      <input
                        type="number"
                        step="0.001"
                        value={c.price}
                        onChange={(e) => updatePrice(idx, e.target.value)}
                        className="w-24 px-2 py-1.5 text-xs text-end border border-gray-200 rounded-md focus:ring-1 focus:ring-amber-500 focus:border-amber-500 ms-auto block"
                      />
                    </td>
                    <td className="td text-end">
                      <input
                        type="number"
                        step="0.001"
                        value={c.sellingPrice}
                        onChange={(e) => {
                          const val = e.target.value;
                          const n = val === "" ? 0 : Number(val);
                          setCart((prev) =>
                            prev.map((item, i) =>
                              i === idx
                                ? {
                                    ...item,
                                    sellingPrice:
                                      val === "" ? ("" as any) : n < 0 ? 0 : n,
                                  }
                                : item,
                            ),
                          );
                        }}
                        className="w-24 px-2 py-1.5 text-xs text-end border border-gray-200 rounded-md focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 ms-auto block"
                      />
                    </td>
                    <td className="td text-center">
                      <input
                        type="text"
                        value={c.batch}
                        readOnly
                        className="w-24 px-2 py-1.5 text-[10px] text-end border border-gray-100 bg-gray-50 rounded-md text-gray-400 font-mono"
                      />
                    </td>
                    <td className="td text-center">
                      <input
                        type="date"
                        value={c.manufacturingDate}
                        onChange={(e) =>
                          setCart((prev) =>
                            prev.map((item, i) =>
                              i === idx
                                ? { ...item, manufacturingDate: e.target.value }
                                : item,
                            ),
                          )
                        }
                        className="w-32 px-2 py-1.5 text-[10px] text-center border border-gray-200 rounded-md focus:ring-1 focus:ring-indigo-500"
                      />
                    </td>
                    <td className="td text-center">
                      <input
                        type="date"
                        value={c.expiryDate}
                        onChange={(e) =>
                          setCart((prev) =>
                            prev.map((item, i) =>
                              i === idx
                                ? { ...item, expiryDate: e.target.value }
                                : item,
                            ),
                          )
                        }
                        className="w-32 px-2 py-1.5 text-[10px] text-center border border-gray-200 rounded-md focus:ring-1 focus:ring-indigo-500"
                      />
                    </td>
                    <td className="td text-center">
                      <div className="flex items-center justify-center bg-gray-50 rounded-lg border border-gray-200 p-0.5 w-28 mx-auto">
                        <button
                          onClick={() =>
                            updateQty(
                              idx,
                              ((c.quantity as any) === ""
                                ? 0
                                : Number(c.quantity)) - 1,
                            )
                          }
                          className="p-1 hover:bg-white rounded hover:shadow-xs text-gray-500 transition-all"
                        >
                          <Minus size={12} />
                        </button>
                        <input
                          type="number"
                          value={c.quantity}
                          onChange={(e) => updateQty(idx, e.target.value)}
                          className="w-10 text-center bg-transparent text-xs font-semibold focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        />
                        <button
                          onClick={() =>
                            updateQty(
                              idx,
                              ((c.quantity as any) === ""
                                ? 0
                                : Number(c.quantity)) + 1,
                            )
                          }
                          className="p-1 hover:bg-white rounded hover:shadow-xs text-gray-500 transition-all"
                        >
                          <PlusIcon size={12} />
                        </button>
                      </div>
                    </td>
                    <td className="td text-end">
                      <input
                        type="number"
                        step="0.01"
                        value={c.total}
                        onChange={(e) => updateTotal(idx, e.target.value)}
                        className="w-24 px-2 py-1.5 text-xs text-end font-bold text-gray-900 border border-gray-200 rounded-md focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 ms-auto block"
                      />
                    </td>
                    <td className="td text-end">
                      <Button
                        variant="ghost"
                        size="xs"
                        icon={
                          <Trash2
                            size={14}
                            className="text-red-400 hover:text-red-600"
                          />
                        }
                        onClick={() => removeItem(idx)}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="flex flex-col items-end gap-1 text-sm border-t border-gray-100 pt-4">
          <div className="flex gap-8">
            <span>{t("subtotal")}</span>
            <span>{formatCurrency(subtotal)}</span>
          </div>
          <div className="flex gap-8">
            <span>
              {t("tax")}
              {tax}%)
            </span>
            <span>{formatCurrency(taxAmt)}</span>
          </div>
          <div className="flex gap-8 text-lg font-bold text-amber-600">
            <span>{t("total")}</span>
            <span>{formatCurrency(total)}</span>
          </div>
        </div>

        <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 pt-4 border-t border-gray-100">
          <Button
            variant="outline"
            onClick={() => router.push("/purchases")}
            className="w-full sm:w-auto"
          >
            {t("cancel")}
          </Button>
          <Button
            onClick={() => handleSave(true)}
            loading={saving}
            variant="outline"
            className="border-amber-200 text-amber-600 hover:bg-amber-50 w-full sm:w-auto"
          >
            {t("updatePrintPdf")}
          </Button>
          <Button
            onClick={() => setConfirmOpen(true)}
            loading={saving}
            icon={<Save size={16} />}
            className="w-full sm:w-auto"
          >
            {t("updatePurchase")}
          </Button>
        </div>
      </div>

      <ConfirmModal
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={handleSave}
        title={t("updatePurchase")}
        message={t("attentionInventoryQuantitiesWillBe")}
        confirmLabel={t("confirmUpdate")}
        variant="warning"
        loading={saving}
      />
    </div>
  );
}

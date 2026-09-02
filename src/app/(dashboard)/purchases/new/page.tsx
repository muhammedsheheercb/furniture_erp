"use client";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2, FileDown, Minus, Plus as PlusIcon } from "lucide-react";
import TopBar from "@/components/layout/TopBar";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import SearchSelect from "@/components/ui/SearchSelect";
import ConfirmModal from "@/components/ui/ConfirmModal";
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
import { useSession } from "next-auth/react";
import toast from "react-hot-toast";
import { generateInvoicePDF } from "@/lib/pdf-utils";
import { useLanguage } from "../../../../context/LanguageContext";

interface CartItem extends IPurchaseItem {
  _itemRef: IItem;
}

export default function NewPurchasePage() {
  const { t } = useLanguage();
  const router = useRouter();
  const { createPurchase } = usePurchases();
  const { data: session, status } = useSession();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    } else if (status === "authenticated") {
      const isAdmin = session?.user?.role === "admin";
      const canCreate =
        isAdmin || (session?.user?.permissions as any)?.purchases?.create;
      if (!canCreate) {
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
  const [date, setDate] = useState(formatDateInput(new Date()));
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [isTaxInvoice, setIsTaxInvoice] = useState(false);

  useEffect(() => {
    const load = async () => {
      const [sr, ir, pr] = await Promise.all([
        fetch("/api/suppliers?limit=500").then((r) => r.json()),
        fetch("/api/items?limit=500").then((r) => r.json()),
        fetch("/api/purchasers").then((r) => r.json()),
      ]);
      if (sr.success) setSuppliers(sr.data);
      if (ir.success) setItems(ir.data);
      if (pr.success) setPurchasers(pr.data);
    };
    load();
  }, []);

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

  const generateBatchNumber = () => {
    const now = new Date();
    const datePart =
      (now as any).toISOString()?.split("T")[0]?.replace(/-/g, "") ||
      "00000000";
    const randomPart = Math.floor(1000 + Math.random() * 9000);
    return `BAT-${datePart}-${randomPart}`;
  };

  const addItem = async (opt: ISelectOption | null) => {
    if (!opt) return;
    const item = opt.data as IItem;
    if (cart.find((c) => c.itemId === item._id)) return;

    try {
      const res = await fetch(`/api/purchases/last-price?itemId=${item._id}`);
      const data = await res.json();
      if (data.success && data.lastPrice !== null) {
        toast(
          `Last purchased at ${formatCurrency(data.lastPrice)}${data.supplierName ? ` from ${data.supplierName}` : ""}`,
          {
            icon: "📦",
            duration: 6000,
            style: {
              borderRadius: "10px",
              background: "#333",
              color: "#fff",
            },
          },
        );
      }
    } catch (error) {
      console.error("Error fetching last price:", error);
    }

    setCart((prev) => [
      ...prev,
      {
        itemId: item._id,
        itemNumber: item.itemNumber,
        itemName: item.name,
        quantity: 1,
        price: item.purchaseAmount || 0, // Default to last purchase price
        sellingPrice: item.salesAmount || 0, // Default to current selling price
        total: item.purchaseAmount || 0,
        manufacturingDate: item.manufacturingDate
          ? formatDateInput(item.manufacturingDate)
          : "",
        expiryDate: item.expiryDate ? formatDateInput(item.expiryDate) : "",
        batch: generateBatchNumber(),
        _itemRef: item,
      },
    ]);
  };

  const updateItem = (idx: number, updates: any) => {
    setCart((prev) =>
      prev.map((c, i) => {
        if (i !== idx) return c;
        const updated = { ...c, ...updates };

        // Allow empty string for quantity/price temporarily for better typing experience
        const q =
          (updated.quantity as any) === "" ? 0 : Number(updated.quantity);
        const p = (updated.price as any) === "" ? 0 : Number(updated.price);

        // Prevent negative numbers
        if (q < 0) {
          updated.quantity = 0;
        }
        if (p < 0) {
          updated.price = 0;
        }
        if (
          (updated.sellingPrice as any) !== "" &&
          Number(updated.sellingPrice) < 0
        ) {
          updated.sellingPrice = 0;
        }
        if ((updated.total as any) !== "" && Number(updated.total) < 0) {
          updated.total = 0;
        }

        // Recalculate total if quantity or price changed
        if ("quantity" in updates || "price" in updates) {
          const newQ =
            (updates.quantity as any) === "" ? 0 : Number(updated.quantity);
          const newP =
            (updates.price as any) === "" ? 0 : Number(updated.price);
          updated.total = Number((newQ * newP).toFixed(3));
        }
        // If total (amount) changed, recalculate price
        else if ("total" in updates) {
          const t = (updates.total as any) === "" ? 0 : Number(updates.total);
          const currentQ =
            (updated.quantity as any) === "" ? 0 : Number(updated.quantity);
          if (currentQ > 0) {
            updated.price = Number((t / currentQ).toFixed(3));
          }
        }

        return updated;
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

    // Validation: Mfg, Exp dates and Selling Price are mandatory
    for (const item of cart) {
      if (!item.manufacturingDate || !item.expiryDate) {
        alert(
          `Please provide manufacturing and expiry dates for ${item.itemName}`,
        );
        setConfirmOpen(false);
        return;
      }
      if (!item.sellingPrice || item.sellingPrice <= 0) {
        alert(`Please provide a valid Selling Price for ${item.itemName}`);
        setConfirmOpen(false);
        return;
      }
    }

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
    }

    const response = await fetch("/api/purchases", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(purchaseData),
    });

    const data = await response.json();
    setSaving(false);

    if (data.success) {
      toast.success("Purchase recorded successfully");
      if (shouldPrint) {
        generateInvoicePDF({
          number: data.data.purchaseNumber || "PUR-PREVIEW",
          customerOrSupplier: supplier.name,
          customerOrSupplierNumber: supplier.supplierNumber,
          date: date,
          paymentType: paymentType,
          items: cart.map((c) => ({
            itemName: c.itemName,
            itemNumber: c.itemNumber,
            quantity: c.quantity,
            price: c.price,
            total: c.total,
            manufacturingDate: c.manufacturingDate,
            expiryDate: c.expiryDate,
          })),
          subtotal,
          tax,
          total,
          type: "Purchase",
          isTaxInvoice,
        });
      }
      router.push("/purchases");
    } else {
      toast.error(data.message || "Failed to record purchase");
    }
  };

  const generatePDF = () => {
    if (!selSupplier || cart.length === 0) return;
    const supplier = selSupplier.data as ISupplier;
    generateInvoicePDF({
      number: "PUR-PREVIEW",
      customerOrSupplier: supplier.name,
      customerOrSupplierNumber: supplier.supplierNumber,
      date: date,
      paymentType: paymentType,
      items: cart.map((c) => ({
        itemName: c.itemName,
        itemNumber: c.itemNumber,
        quantity: c.quantity,
        price: c.price,
        total: c.total,
        manufacturingDate: c.manufacturingDate,
        expiryDate: c.expiryDate,
      })),
      subtotal,
      tax,
      total,
      type: "Purchase",
      isTaxInvoice,
    });
  };

  return (
    <div className="page-container max-w-6xl">
      <TopBar
        title={t("newPurchase")}
        subtitle={t("recordANewPurchaseFrom")}
      />

      <div className="card p-6 flex flex-col gap-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <SearchSelect
              label={t("supplier")}
              placeholder={t("selectSupplier")}
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

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1.5">
              {t("paymentMethod")}
              <span className="text-red-500">*</span>
            </label>
            <div className="flex flex-col sm:flex-row gap-2">
              <button
                type="button"
                onClick={() => setPaymentType("cash")}
                className={`flex-1 py-3 px-4 rounded-xl text-xs font-bold border-2 transition-all flex items-center justify-center gap-2
                                ${paymentType === "cash" ? "bg-emerald-50 border-emerald-500 text-emerald-700 shadow-sm" : "bg-white border-gray-100 text-gray-400 hover:border-gray-200"}`}
              >
                <span
                  className={`w-2 h-2 rounded-full ${paymentType === "cash" ? "bg-emerald-500" : "bg-gray-200"}`}
                ></span>
                {t("cash")}
              </button>
              <button
                type="button"
                onClick={() => setPaymentType("bank")}
                className={`flex-1 py-3 px-4 rounded-xl text-xs font-bold border-2 transition-all flex items-center justify-center gap-2
                                ${paymentType === "bank" ? "bg-indigo-50 border-indigo-500 text-indigo-700 shadow-sm" : "bg-white border-gray-100 text-gray-400 hover:border-gray-200"}`}
              >
                <span
                  className={`w-2 h-2 rounded-full ${paymentType === "bank" ? "bg-indigo-500" : "bg-gray-200"}`}
                ></span>
                {t("bankOnline")}
              </button>
              <button
                type="button"
                onClick={() => setPaymentType("credit")}
                className={`flex-1 py-3 px-4 rounded-xl text-xs font-bold border-2 transition-all flex items-center justify-center gap-2
                                ${paymentType === "credit" ? "bg-amber-50 border-amber-500 text-amber-700 shadow-sm" : "bg-white border-gray-100 text-gray-400 hover:border-gray-200"}`}
              >
                <span
                  className={`w-2 h-2 rounded-full ${paymentType === "credit" ? "bg-amber-500" : "bg-gray-200"}`}
                ></span>
                {t("creditDebt")}
              </button>
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
              placeholder="0"
              hint="Enter purchase tax percentage"
            />
            <div className="flex items-center gap-2 mt-1">
              <input
                type="checkbox"
                id="isTaxInvoice"
                checked={isTaxInvoice}
                onChange={(e) => setIsTaxInvoice(e.target.checked)}
                className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
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
          <label className="text-sm font-medium text-gray-700 block mb-1.5">
            {t("searchAddItems")}
          </label>
          <SearchSelect
            placeholder={t("searchItems")}
            options={itemOptions}
            value={null}
            onChange={addItem}
          />
        </div>

        {cart.length > 0 ? (
          <div className="table-wrapper border border-gray-100 rounded-xl overflow-hidden shadow-sm">
            <table className="w-full">
              <thead className="bg-gray-50/50">
                <tr className="border-b border-gray-200">
                  <th className="th text-start w-[25%]">{t("itemDetails")}</th>
                  <th className="th text-center">{t("batch")}</th>
                  <th className="th text-center">{t("mfgDate")}</th>
                  <th className="th text-center">{t("expDate")}</th>
                  <th className="th text-center w-28">{t("qty")}</th>
                  <th className="th text-end">{t("cost")}</th>
                  <th className="th text-end">{t("price")}</th>
                  <th className="th text-end">{t("value")}</th>
                  <th className="th w-10 px-0" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {cart.map((c, idx) => (
                  <tr key={c.itemId} className="align-top">
                    <td className="td text-start">
                      <div className="font-semibold text-gray-900">
                        {c.itemName}
                      </div>
                      <div className="text-[10px] font-mono text-gray-400 mt-0.5">
                        {c.itemNumber}
                      </div>
                    </td>
                    <td className="td">
                      <input
                        type="text"
                        placeholder={t("batch")}
                        value={c.batch}
                        readOnly
                        className="w-20 px-2 py-1.5 text-[10px] text-center border border-gray-100 bg-gray-50 rounded-md focus:outline-none text-gray-500 font-mono"
                        title={t("batchNumberIsAutomaticallyGenerated")}
                      />
                    </td>
                    <td className="td">
                      <input
                        type="date"
                        value={c.manufacturingDate}
                        onChange={(e) =>
                          updateItem(idx, { manufacturingDate: e.target.value })
                        }
                        className="w-28 px-2 py-1.5 text-[10px] border border-gray-200 rounded-md focus:ring-1 focus:ring-amber-500"
                      />
                    </td>
                    <td className="td">
                      <input
                        type="date"
                        value={c.expiryDate}
                        onChange={(e) =>
                          updateItem(idx, { expiryDate: e.target.value })
                        }
                        className={`w-28 px-2 py-1.5 text-[10px] border rounded-md focus:ring-1 focus:ring-amber-500 ${!c.expiryDate ? "border-red-300 bg-red-50" : "border-gray-200"}`}
                      />
                    </td>
                    <td className="td">
                      <div className="flex items-center justify-center bg-gray-50 rounded-lg border border-gray-200 p-0.5">
                        <button
                          onClick={() =>
                            updateItem(idx, { quantity: c.quantity - 1 })
                          }
                          className="p-1 hover:bg-white rounded hover:shadow-xs text-gray-500 transition-all disabled:opacity-30"
                        >
                          <Minus size={14} />
                        </button>
                        <input
                          type="number"
                          value={c.quantity}
                          onChange={(e) =>
                            updateItem(idx, { quantity: e.target.value })
                          }
                          className="w-12 text-center bg-transparent text-sm font-semibold focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        />
                        <button
                          onClick={() =>
                            updateItem(idx, { quantity: c.quantity + 1 })
                          }
                          className="p-1 hover:bg-white rounded hover:shadow-xs text-gray-500 transition-all disabled:opacity-30"
                        >
                          <PlusIcon size={14} />
                        </button>
                      </div>
                    </td>
                    <td className="td">
                      <input
                        type="number"
                        step="0.001"
                        value={c.price}
                        onChange={(e) =>
                          updateItem(idx, { price: e.target.value })
                        }
                        className="w-24 px-2 py-1.5 text-xs text-end border border-gray-200 rounded-md focus:ring-1 focus:ring-amber-500 focus:border-amber-500 ms-auto block"
                      />
                    </td>
                    <td className="td">
                      <input
                        type="number"
                        step="0.001"
                        value={c.sellingPrice}
                        onChange={(e) =>
                          updateItem(idx, { sellingPrice: e.target.value })
                        }
                        className={`w-24 px-2 py-1.5 text-xs text-end border rounded-md focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 ms-auto block ${!c.sellingPrice ? "border-red-300 bg-red-50" : "border-gray-200"}`}
                      />
                    </td>
                    <td className="td text-end">
                      <input
                        type="number"
                        step="0.01"
                        value={c.total}
                        onChange={(e) =>
                          updateItem(idx, { total: e.target.value })
                        }
                        className="w-28 px-2 py-1.5 text-xs text-end font-bold text-gray-900 border border-gray-200 rounded-md focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 ms-auto block"
                      />
                    </td>
                    <td className="td">
                      <Button
                        variant="ghost"
                        size="xs"
                        icon={
                          <Trash2
                            size={15}
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
        ) : (
          <div className="border-2 border-dashed border-gray-100 rounded-2xl py-16 text-center text-gray-400 bg-gray-50/30">
            <Plus size={40} className="mx-auto mb-3 opacity-20" />
            <p className="text-sm font-medium">{t("addItemsFromTheSearch")}</p>
          </div>
        )}

        {cart.length > 0 && (
          <div className="flex flex-col items-end gap-1.5 px-2 py-4 bg-gray-50/50 rounded-xl border border-gray-100">
            <div className="flex gap-12 text-sm text-gray-500">
              <span>{t("subtotal")}</span>
              <span className="font-mono">{formatCurrency(subtotal)}</span>
            </div>
            <div className="flex gap-12 text-sm text-gray-500">
              <span>
                {t("tax")}
                {tax}%)
              </span>
              <span className="font-mono">{formatCurrency(taxAmt)}</span>
            </div>
            <div className="h-px w-48 bg-gray-200 my-1" />
            <div className="flex gap-12 text-xl font-bold text-gray-900">
              <span>{t("totalPayable")}</span>
              <span className="text-amber-600 font-mono underline decoration-amber-200 decoration-2 underline-offset-4">
                {formatCurrency(total)}
              </span>
            </div>
          </div>
        )}

        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-4 border-t border-gray-100">
          <Button
            variant="outline"
            icon={<FileDown size={18} />}
            onClick={generatePDF}
            disabled={!selSupplier || cart.length === 0}
            className="px-6 w-full sm:w-auto"
          >
            {t("previewDoc")}
          </Button>
          <div className="flex flex-col sm:flex-row w-full sm:w-auto gap-3 items-center">
            <button
              onClick={() => router.push("/purchases")}
              className="text-sm font-semibold text-gray-500 hover:text-gray-700 underline-offset-4 hover:underline me-2"
            >
              {t("discard")}
            </button>
            <Button
              onClick={() => handleSave(true)}
              disabled={!selSupplier || cart.length === 0 || saving}
              loading={saving}
              className="px-10 h-11 w-full sm:w-auto bg-amber-600 hover:bg-amber-700 shadow-lg shadow-amber-100"
            >
              {t("recordPrintPdf")}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

"use client";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2, FileDown, Minus, Plus as PlusIcon } from "lucide-react";
import TopBar from "@/components/layout/TopBar";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import SearchSelect from "@/components/ui/SearchSelect";
import ConfirmModal from "@/components/ui/ConfirmModal";
import { useSales } from "@/hooks/useSales";
import {
  ICustomer,
  IItem,
  ISaleItem,
  ISelectOption,
  PaymentType,
  IBatch,
} from "@/types";
import { formatCurrency, formatDate, formatDateInput } from "@/lib/utils";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { useSession } from "next-auth/react";
import toast from "react-hot-toast";
import { generateInvoicePDF } from "@/lib/pdf-utils";

import BatchSelectionModal from "@/components/sales/BatchSelectionModal";
import { useLanguage } from "../../../../context/LanguageContext";

interface CartItem extends ISaleItem {
  _itemRef: IItem;
}

export default function NewSalePage() {
  const { t } = useLanguage();
  const router = useRouter();
  const { createSale } = useSales();
  const { data: session, status } = useSession();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    } else if (status === "authenticated") {
      const isAdmin = session?.user?.role === "admin";
      const canCreate =
        isAdmin || (session?.user?.permissions as any)?.sales?.create;
      if (!canCreate) {
        router.push("/sales");
      }
    }
  }, [session, status, router]);

  const [customers, setCustomers] = useState<ICustomer[]>([]);
  const [items, setItems] = useState<IItem[]>([]);
  const [selCustomer, setSelCustomer] = useState<ISelectOption | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [paymentType, setPaymentType] = useState<PaymentType>("cash");
  const [tax, setTax] = useState(0);
  const [date, setDate] = useState(formatDateInput(new Date()));
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [isTaxInvoice, setIsTaxInvoice] = useState(false);
  const [advancePaid, setAdvancePaid] = useState(0);
  const [deliveryDate, setDeliveryDate] = useState("");
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [customerMobile, setCustomerMobile] = useState("");
  const [customerAddress, setCustomerAddress] = useState("");
  const [customerNumber, setCustomerNumber] = useState("");

  // Batch selection state
  const [batchSelectionItem, setBatchSelectionItem] = useState<IItem | null>(
    null,
  );

  // load customers + items once
  useEffect(() => {
    const load = async () => {
      const [cr, ir] = await Promise.all([
        fetch("/api/customers?limit=500").then((r) => r.json()),
        fetch("/api/items?limit=500").then((r) => r.json()),
      ]);
      if (cr.success) setCustomers(cr.data);
      if (ir.success) setItems(ir.data);
    };
    load();
  }, []);

  const customerOptions: ISelectOption[] = customers.map((c) => ({
    value: c._id,
    label: `${c.name} (${c.customerNumber})`,
    data: c,
  }));

  const itemOptions = items.map((i) => ({
    value: i._id,
    label: `${i.name} — Sale: ${formatCurrency(i.salesAmount || 0)} | Stock: ${i.quantity}`,
    data: i,
  }));

  const handleBatchSelect = (batch: IBatch) => {
    if (!batchSelectionItem) return;

    const item = batchSelectionItem;

    const formatDateStr = (d: any): string => {
      if (!d) return "";
      try {
        const dateObj = new Date(d);
        if (isNaN(dateObj.getTime())) return "";
        return dateObj.toISOString().split("T")[0] || "";
      } catch {
        return "";
      }
    };

    // Final add to cart
    const newItem: CartItem = {
      itemId: item._id,
      itemNumber: item.itemNumber,
      itemName: item.name,
      quantity: 1,
      price: batch.salePrice || item.salesAmount || 0,
      total: batch.salePrice || item.salesAmount || 0,
      discount: 0,
      isFOC: false,
      manufacturingDate: formatDateStr(batch.manufacturingDate),
      expiryDate: formatDateStr(batch.expiryDate),
      batch: batch.batchNumber || "",
      _itemRef: item,
    };
    setCart((prev) => [...prev, newItem]);

    setBatchSelectionItem(null);
    toast.success(`Selected batch: ${batch.batchNumber || "Oldest"}`);
  };

  useEffect(() => {
    if (selCustomer) {
      const customer = selCustomer.data as ICustomer;
      setCustomerMobile(customer.mobile || "");
      setCustomerAddress(customer.address || "");
      setCustomerNumber(customer.customerNumber || "");
      setDeliveryAddress(customer.address || "");
    } else {
      setCustomerMobile("");
      setCustomerAddress("");
      setCustomerNumber("");
      setDeliveryAddress("");
    }
  }, [selCustomer]);

  const addItem = useCallback(
    async (opt: ISelectOption | null) => {
      if (!opt) return;
      const item = opt.data as IItem;

      // Fetch last sale price for this customer and item
      if (selCustomer) {
        try {
          const res = await fetch(
            `/api/sales/last-price?customerId=${selCustomer.value}&itemId=${item._id}`,
          );
          const data = await res.json();
          if (data.success && data.lastPrice !== null) {
            toast(
              `Last sold to this customer at ${formatCurrency(data.lastPrice)}`,
              {
                icon: "💰",
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
      }

      const formatDateStr = (d: any): string => {
        if (!d) return "";
        try {
          const dateObj = new Date(d);
          if (isNaN(dateObj.getTime())) return "";
          return dateObj.toISOString().split("T")[0] || "";
        } catch {
          return "";
        }
      };

      // Trigger batch selection modal
      if (item.batches && item.batches.length > 0) {
        setBatchSelectionItem(item);
      } else {
        // No batches found, fall back to standard item data
        const newItem: CartItem = {
          itemId: item._id,
          itemNumber: item.itemNumber,
          itemName: item.name,
          quantity: 1,
          price: item.salesAmount || 0,
          total: item.salesAmount || 0,
          discount: 0,
          isFOC: false,
          manufacturingDate: formatDateStr(item.manufacturingDate),
          expiryDate: formatDateStr(item.expiryDate),
          batch: "",
          _itemRef: item,
        };
        setCart((prev) => [...prev, newItem]);
      }
    },
    [selCustomer],
  );

  const updateItem = (idx: number, updates: any) => {
    setCart((prev) =>
      prev.map((c, i) => {
        if (i !== idx) return c;
        const updated = { ...c, ...updates };

        const q = updated.quantity === "" ? 0 : Number(updated.quantity);
        const p = updated.price === "" ? 0 : Number(updated.price);
        const d = updated.discount === "" ? 0 : Number(updated.discount);

        // Prevent negative
        if (q < 0) {
          updated.quantity = 0;
        }
        if (p < 0) {
          updated.price = 0;
        }
        if (d < 0) {
          updated.discount = 0;
        }
        if (updated.total !== "" && Number(updated.total) < 0) {
          updated.total = 0;
        }

        if (updated.isFOC) {
          updated.total = 0;
          updated.price = 0;
          updated.discount = 0;
        } else {
          if (
            "quantity" in updates ||
            "price" in updates ||
            "discount" in updates
          ) {
            const newQ = updated.quantity === "" ? 0 : Number(updated.quantity);
            const newP = updated.price === "" ? 0 : Number(updated.price);
            const newD = updated.discount === "" ? 0 : Number(updated.discount);
            updated.total = Number((newQ * newP - newD).toFixed(3));
          } else if ("total" in updates) {
            const newT = updated.total === "" ? 0 : Number(updated.total);
            const currentQ =
              updated.quantity === "" ? 0 : Number(updated.quantity);
            const currentD =
              updated.discount === "" ? 0 : Number(updated.discount);
            if (currentQ > 0) {
              updated.price = Number(((newT + currentD) / currentQ).toFixed(3));
            }
          }
        }
        return updated;
      }),
    );
  };

  const removeItem = (idx: number) =>
    setCart((prev) => prev.filter((_, i) => i !== idx));

  const subtotal = cart.reduce(
    (s, c) => s + (c.isFOC ? 0 : c.price * c.quantity),
    0,
  );
  const totalDiscount = cart.reduce(
    (s, c) => s + (c.isFOC ? 0 : c.discount || 0),
    0,
  );
  const taxableAmount = subtotal - totalDiscount;
  const taxAmt = taxableAmount * (tax / 100);
  const total = taxableAmount + taxAmt;

  const handleSave = async (shouldPrint: boolean = false) => {
    if (!selCustomer || cart.length === 0) return;

    // Validation: No longer mandatory for furniture ERP

    setSaving(true);
    const customer = selCustomer.data as ICustomer;

    const saleData = {
      customerId: customer._id,
      customerName: customer.name,
      customerNumber: customerNumber || customer.customerNumber,
      customerMobile,
      customerAddress,
      items: cart.map(({ _itemRef: _, ...rest }) => rest),
      subtotal,
      tax,
      total,
      paymentType,
      date,
      isTaxInvoice,
      advancePaid,
      deliveryDate,
      deliveryAddress,
    };

    const response = await fetch("/api/sales", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(saleData),
    });

    const data = await response.json();
    setSaving(false);

    if (data.success) {
      toast.success("Sale recorded successfully");
      if (shouldPrint) {
        generateInvoicePDF({
          number: data.data.saleNumber || "PREVIEW",
          customerOrSupplier: customer.name,
          customerOrSupplierNumber: customerNumber || customer.customerNumber,
          customerOrSupplierMobile: customerMobile || customer.mobile,
          date: date,
          paymentType: paymentType,
          items: cart,
          subtotal,
          tax,
          total,
          type: "Sale",
          isTaxInvoice,
          advancePaid,
          customerAddress: customerAddress,
          deliveryAddress: deliveryAddress,
          deliveryDate: deliveryDate,
        });
      }
      router.push("/sales");
    } else {
      toast.error(data.message || "Failed to record sale");
    }
  };

  const generatePDF = () => {
    if (!selCustomer || cart.length === 0) return;
    const customer = selCustomer.data as ICustomer;
    generateInvoicePDF({
      number: "PREVIEW",
      customerOrSupplier: customer.name,
      customerOrSupplierNumber: customerNumber || customer.customerNumber,
      customerOrSupplierMobile: customerMobile || customer.mobile,
      date: date,
      paymentType: paymentType,
      items: cart,
      subtotal: subtotal,
      tax: tax,
      total: total,
      type: "Sale",
      isTaxInvoice: isTaxInvoice,
      advancePaid: advancePaid,
      customerAddress: customerAddress,
      deliveryAddress: deliveryAddress,
      deliveryDate: deliveryDate,
    });
  };

  return (
    <div className="page-container max-w-6xl">
      <TopBar title={t("newSale")} subtitle={t("createANewSalesInvoice")} />

      <div className="card p-6 flex flex-col gap-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-1">
            <SearchSelect
              label={t("customer")}
              placeholder={t("selectCustomer")}
              options={customerOptions}
              value={selCustomer}
              onChange={setSelCustomer}
              required
            />
            {selCustomer && (
              <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label={t("customerNumber")}
                  value={customerNumber}
                  readOnly
                  className="bg-gray-50"
                  onChange={(e) => setCustomerNumber(e.target.value)}
                />
                <Input
                  label={t("customerMobile")}
                  value={customerMobile}
                  readOnly
                  className="bg-gray-50"
                  onChange={(e) => setCustomerMobile(e.target.value)}
                />
                <div className="sm:col-span-2">
                  <label className="text-sm font-medium text-gray-700 block mb-1.5">
                    {t("customerAddress")}
                  </label>
                  <textarea
                    value={customerAddress}
                    onChange={(e) => setCustomerAddress(e.target.value)}
                    placeholder={t("customerAddress")}
                    rows={2}
                    readOnly
                    className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-none text-sm bg-gray-50"
                  />
                </div>
              </div>
            )}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label={t("saleDate")}
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
            />
            <Input
              label={t("deliveryDate")}
              type="date"
              value={deliveryDate}
              onChange={(e) => setDeliveryDate(e.target.value)}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6">
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1.5">
              {t("deliveryAddress")}
            </label>
            <textarea
              value={deliveryAddress}
              onChange={(e) => setDeliveryAddress(e.target.value)}
              placeholder={t("enterDeliveryAddress")}
              rows={3}
              className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-none text-sm"
            />
          </div>
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
                className={`flex-1 py-3 px-4 rounded-xl text-sm font-bold border-2 transition-all flex items-center justify-center gap-2
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
                className={`flex-1 py-3 px-4 rounded-xl text-sm font-bold border-2 transition-all flex items-center justify-center gap-2
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
                className={`flex-1 py-3 px-4 rounded-xl text-sm font-bold border-2 transition-all flex items-center justify-center gap-2
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
              label={t("globalTax")}
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
              hint="Applied to total after discounts"
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

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Input
            label={t("advancePaid")}
            type="number"
            min={0}
            value={advancePaid}
            onChange={(e) => setAdvancePaid(Number(e.target.value))}
            placeholder="0"
          />
          <div className="flex items-center gap-2 mt-7">
            <span className="text-sm font-medium text-gray-500">
              {t("balance")}
            </span>
            <span className="text-lg font-bold text-rose-600">
              {formatCurrency(total - advancePaid)}
            </span>
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
              <thead className="bg-gray-50/50 hidden md:table-header-group">
                <tr className="border-b border-gray-200">
                  <th className="th text-start w-[25%]">{t("itemDetails")}</th>
                  <th className="th">{t("batch")}</th>
                  <th className="th text-center">{t("dates")}</th>
                  <th className="th text-center w-28">{t("quantity")}</th>
                  <th className="th text-end">{t("price")}</th>
                  <th className="th text-end">{t("disc")}</th>
                  <th className="th text-center">{t("foc")}</th>
                  <th className="th text-end">{t("total")}</th>
                  <th className="th w-10 px-0" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {cart.map((c, idx) => (
                  <tr
                    key={`${c.itemId}-${idx}`}
                    className="flex flex-col md:table-row p-4 md:p-0 space-y-4 md:space-y-0 relative"
                  >
                    <td className="td text-start md:align-top">
                      <label className="md:hidden text-[10px] font-bold text-gray-400 uppercase mb-1 block">
                        {t("itemDetails")}
                      </label>
                      <div className="font-semibold text-gray-900">
                        {c.itemName}
                      </div>
                      <div className="text-[10px] font-mono text-gray-400 mt-0.5">
                        {c.itemNumber}
                      </div>
                    </td>
                    <td className="td md:align-top">
                      <label className="md:hidden text-[10px] font-bold text-gray-400 uppercase mb-1 block">
                        {t("batch")}
                      </label>
                      <input
                        type="text"
                        placeholder={t("batch")}
                        value={c.batch}
                        readOnly
                        className="w-full md:w-20 px-2 py-1.5 text-[10px] text-start md:text-center border border-gray-100 bg-gray-50 rounded-md focus:outline-none text-gray-500 font-mono"
                      />
                    </td>
                    <td className="td md:align-top">
                      <label className="md:hidden text-[10px] font-bold text-gray-400 uppercase mb-1 block">
                        {t("dates")}
                      </label>
                      <div className="flex flex-col gap-0.5 text-[10px] items-start md:items-center">
                        <span className="text-gray-400">
                          {t("m")}
                          <span className="text-gray-600 font-medium">
                            {c.manufacturingDate
                              ? formatDate(c.manufacturingDate)
                              : "-"}
                          </span>
                        </span>
                        <span className="text-gray-400">
                          {t("e")}
                          <span className="text-rose-600 font-bold">
                            {c.expiryDate ? formatDate(c.expiryDate) : "-"}
                          </span>
                        </span>
                      </div>
                    </td>
                    <td className="td md:align-top">
                      <label className="md:hidden text-[10px] font-bold text-gray-400 uppercase mb-1 block">
                        {t("quantity")}
                      </label>
                      <div className="flex items-center justify-center bg-gray-50 rounded-lg border border-gray-200 p-0.5 max-w-[120px] md:max-w-none">
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
                          disabled={c.quantity >= c._itemRef.quantity}
                          className="p-1 hover:bg-white rounded hover:shadow-xs text-gray-500 transition-all disabled:opacity-30"
                        >
                          <PlusIcon size={14} />
                        </button>
                      </div>
                      <div className="text-[10px] text-start md:text-center text-gray-400 mt-1">
                        {t("stock")}
                        {c._itemRef.quantity}
                      </div>
                    </td>
                    <td className="td md:align-top">
                      <label className="md:hidden text-[10px] font-bold text-gray-400 uppercase mb-1 block">
                        {t("price")}
                      </label>
                      <input
                        type="number"
                        step="0.001"
                        disabled={c.isFOC}
                        value={c.price}
                        onChange={(e) =>
                          updateItem(idx, { price: e.target.value })
                        }
                        className={`w-full md:w-20 px-2 py-1.5 text-xs text-start md:text-right border border-gray-200 rounded-md focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 ${c.isFOC ? "bg-gray-50 opacity-50 cursor-not-allowed" : ""}`}
                      />
                    </td>
                    <td className="td md:align-top">
                      <label className="md:hidden text-[10px] font-bold text-gray-400 uppercase mb-1 block">
                        {t("disc")}
                      </label>
                      <input
                        type="number"
                        step="0.001"
                        placeholder="0.000"
                        disabled={c.isFOC}
                        value={c.discount}
                        onChange={(e) =>
                          updateItem(idx, { discount: e.target.value })
                        }
                        className={`w-full md:w-20 px-2 py-1.5 text-xs text-start md:text-right border border-gray-200 rounded-md focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 ${c.isFOC ? "bg-gray-50 opacity-50 cursor-not-allowed" : ""}`}
                      />
                    </td>
                    <td className="td md:align-top">
                      <label className="md:hidden text-[10px] font-bold text-gray-400 uppercase mb-1 block">
                        {t("foc")}
                      </label>
                      <input
                        type="checkbox"
                        checked={c.isFOC || false}
                        onChange={(e) =>
                          updateItem(idx, { isFOC: e.target.checked })
                        }
                        className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                      />
                    </td>
                    <td className="td text-end md:align-top">
                      <label className="md:hidden text-[10px] font-bold text-gray-400 uppercase mb-1 block text-start">
                        {t("total")}
                      </label>
                      {c.isFOC ? (
                        <span className="text-emerald-600 font-bold px-1.5 py-0.5 bg-emerald-50 rounded text-[10px] uppercase tracking-wider block w-fit ms-auto md:inline">
                          {t("free")}
                        </span>
                      ) : (
                        <input
                          type="number"
                          step="0.01"
                          value={c.total}
                          onChange={(e) =>
                            updateItem(idx, { total: e.target.value })
                          }
                          className="w-full md:w-24 px-2 py-1.5 text-xs text-start md:text-right font-bold text-gray-900 border border-gray-200 rounded-md focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 ms-auto block"
                        />
                      )}
                    </td>
                    <td className="td md:align-top">
                      <div className="flex gap-1 justify-end md:justify-start">
                        <button
                          type="button"
                          title={t("splitThisRow")}
                          onClick={() => {
                            const newItem = { ...c, quantity: 1 };
                            // Update current row quantity (if > 1)
                            if (c.quantity > 1) {
                              updateItem(idx, { quantity: c.quantity - 1 });
                            }
                            // Add new item to cart
                            setCart((prev) => {
                              const newCart = [...prev];
                              newCart.splice(idx + 1, 0, newItem);
                              return newCart;
                            });
                          }}
                          className="p-1 text-indigo-400 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-colors"
                        >
                          <PlusIcon size={14} />
                        </button>
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
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="border-2 border-dashed border-gray-100 rounded-2xl py-16 text-center text-gray-400 bg-gray-50/30">
            <Plus size={40} className="mx-auto mb-3 opacity-20" />
            <p className="text-sm font-medium">{t("addSomeItemsToStart")}</p>
          </div>
        )}

        {cart.length > 0 && (
          <div className="flex flex-col items-end gap-1.5 px-2 py-4 bg-gray-50/50 rounded-xl border border-gray-100">
            <div className="flex gap-12 text-sm text-gray-500">
              <span>{t("totalItemsPrice")}</span>
              <span className="font-mono">{formatCurrency(subtotal)}</span>
            </div>
            <div className="flex gap-12 text-sm text-amber-600 bg-amber-50 px-2 py-0.5 rounded">
              <span>{t("totalDiscount")}</span>
              <span className="font-mono">
                -{formatCurrency(totalDiscount)}
              </span>
            </div>
            <div className="flex gap-12 text-sm text-gray-500">
              <span>
                {t("taxable")}
                {tax}%)
              </span>
              <span className="font-mono">{formatCurrency(taxAmt)}</span>
            </div>
            <div className="h-px w-48 bg-gray-200 my-1" />
            <div className="flex gap-12 text-sm text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">
              <span>{t("advancePaid")}</span>
              <span className="font-mono">{formatCurrency(advancePaid)}</span>
            </div>
            <div className="flex gap-12 text-sm text-rose-600 bg-rose-50 px-2 py-0.5 rounded">
              <span>{t("balanceAmount")}</span>
              <span className="font-mono">
                {formatCurrency(total - advancePaid)}
              </span>
            </div>
            <div className="h-px w-48 bg-gray-200 my-1" />
            <div className="flex gap-12 text-xl font-bold text-gray-900">
              <span>{t("finalTotal")}</span>
              <span className="text-indigo-600 font-mono underline decoration-indigo-200 decoration-2 underline-offset-4">
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
            disabled={!selCustomer || cart.length === 0}
            className="px-6 w-full sm:w-auto"
          >
            {t("previewInvoice")}
          </Button>
          <div className="flex flex-col sm:flex-row w-full sm:w-auto gap-3 items-center">
            <button
              onClick={() => router.push("/sales")}
              className="text-sm font-semibold text-gray-500 hover:text-gray-700 underline-offset-4 hover:underline me-2"
            >
              {t("discard")}
            </button>
            <Button
              onClick={() => handleSave(true)}
              disabled={!selCustomer || cart.length === 0 || saving}
              loading={saving}
              className="px-10 h-11 w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-100"
            >
              {t("createOrder")}
            </Button>
          </div>
        </div>
      </div>

      <BatchSelectionModal
        open={!!batchSelectionItem}
        onClose={() => setBatchSelectionItem(null)}
        item={batchSelectionItem}
        onSelect={handleBatchSelect}
      />
    </div>
  );
}

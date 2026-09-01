"use client";
import { useEffect, useState } from "react";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import CustomerModal from "@/components/customers/CustomerModal";
import QuotationItemModal from "@/components/quotations/QuotationItemModal";
import { Plus, Trash2, UserPlus, AlertCircle, Pencil } from "lucide-react";
import axios from "axios";
import { toast } from "sonner";
import CurrencySymbol from "@/components/ui/CurrencySymbol";
import { useLanguage } from "../../context/LanguageContext";

// ── types ──────────────────────────────────────────────────────────────────────
interface LineItem {
  id: string;
  itemId: string;
  itemNumber: string;
  itemName: string;
  unit: string;
  qty: number;
  price: number;
  discount: number; // percentage
  batchNumber: string;
  color: string;
  material: string;
  size: string;
  total: number;
  dimensions?: any;
  bom?: any[];
  pricing?: any;
}

interface SaleModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: any) => Promise<void>;
  sale?: any | null;
  loading?: boolean;
}

// ── helpers ───────────────────────────────────────────────────────────────────
function uid() {
  return Math.random().toString(36).slice(2);
}
function newRow(): LineItem {
  return {
    id: uid(),
    itemId: "",
    itemNumber: "",
    itemName: "",
    unit: "Piece",
    qty: 1,
    price: 0,
    discount: 0,
    batchNumber: "",
    color: "",
    material: "",
    size: "",
    total: 0,
  };
}

// ── component ─────────────────────────────────────────────────────────────────
export default function SaleModal({
  open,
  onClose,
  onSubmit,
  sale,
  loading,
}: SaleModalProps) {
  const { t } = useLanguage();
  const [customers, setCustomers] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);

  // customer
  const [customerId, setCustomerId] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [customerNumber, setCustomerNumber] = useState("");
  const [customerMobile, setCustomerMobile] = useState("");
  const [customerAddress, setCustomerAddress] = useState("");
  const [custModalOpen, setCustModalOpen] = useState(false);
  const [savingCust, setSavingCust] = useState(false);

  // item edit modal
  const [itemModalOpen, setItemModalOpen] = useState(false);
  const [editingLineId, setEditingLineId] = useState<string | null>(null);

  // sale fields
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [paymentType, setPaymentType] = useState<"cash" | "bank" | "credit">(
    "cash",
  );
  const [advancePaid, setAdvancePaid] = useState(0);

  const [deliveryDate, setDeliveryDate] = useState("");
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [remarks, setRemarks] = useState("");
  const [lineItems, setLineItems] = useState<LineItem[]>([]);
  const [taxPct, setTaxPct] = useState(0);
  const [discAmt, setDiscAmt] = useState(0);
  const [formError, setFormError] = useState("");

  const subtotalAfterItemDiscount = lineItems.reduce((s, i) => {
    const itemTotal = i.qty * i.price * (1 - (i.discount || 0) / 100);
    return s + itemTotal;
  }, 0);

  const taxAmount = subtotalAfterItemDiscount * (taxPct / 100);
  const grandTotal = Math.max(
    0,
    subtotalAfterItemDiscount + taxAmount - discAmt,
  );
  const balance = grandTotal - advancePaid;

  const isConversion = sale?.isConversion === true;
  const isEdit = !!sale?._id;

  // ── load reference data ──────────────────────────────────────────────────────
  useEffect(() => {
    if (!open) return;
    Promise.all([
      axios.get("/api/customers?limit=500"),
      axios.get("/api/items?limit=500"),
    ])
      .then(([c, p]) => {
        setCustomers(c.data.data || []);
        setProducts(p.data.data || []);
      })
      .catch(() => toast.error("Failed to load reference data"));
  }, [open]);

  // ── populate form ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!open) return;
    if (sale) {
      setCustomerId(sale.customerId?._id || sale.customerId || "");
      setCustomerName(sale.customerName || "");
      setCustomerNumber(sale.customerNumber || "");
      setCustomerMobile(sale.customerMobile || "");
      setCustomerAddress(sale.customerAddress || "");
      setDate(new Date(sale.date || new Date()).toISOString().slice(0, 10));
      setPaymentType(sale.paymentType || "cash");
      setAdvancePaid((sale.advancePaid || 0) + (sale.previousPaid || 0));

      setDeliveryDate(
        sale.deliveryDate
          ? new Date(sale.deliveryDate).toISOString().slice(0, 10)
          : "",
      );
      setDeliveryAddress(sale.deliveryAddress || "");
      setRemarks(sale.remarks || "");
      setTaxPct(sale.tax || 0);
      const loadedSubtotal = (sale.items || []).reduce(
        (s: number, it: any) =>
          s +
          (it.price || 0) * (it.quantity || 1) * (1 - (it.discount || 0) / 100),
        0,
      );
      setDiscAmt((loadedSubtotal * (sale.discount || 0)) / 100);
      setLineItems(
        (sale.items || []).map((it: any) => ({
          id: uid(),
          itemId: it.itemId || "",
          itemNumber: it.itemNumber || "",
          itemName: it.itemName || "",
          unit: it.unit || "Piece",
          qty: it.quantity || 1,
          price: it.price || 0,
          discount: it.discount || 0,
          batchNumber: it.batch || "",
          color: it.color || "",
          material: it.material || "",
          size: it.size || "",
          total: it.total || 0,
          dimensions: it.dimensions,
          bom: it.bom,
          pricing: it.pricing,
        })),
      );
    } else {
      setCustomerId("");
      setCustomerName("");
      setCustomerNumber("");
      setCustomerMobile("");
      setCustomerAddress("");
      setDate(new Date().toISOString().slice(0, 10));
      setPaymentType("cash");
      setAdvancePaid(0);
      setDeliveryDate("");
      setDeliveryAddress("");
      setRemarks("");
      setTaxPct(0);
      setDiscAmt(0);
      setLineItems([]);
    }
    setFormError("");
  }, [open, sale]);

  // ── customer helpers ──────────────────────────────────────────────────────────
  function pickCustomer(id: string) {
    const c = customers.find((x) => x._id === id);
    setCustomerId(id);
    setCustomerName(c?.name || "");
    setCustomerNumber(c?.customerNumber || "");
    setCustomerMobile(c?.mobile || "");
    setCustomerAddress(c?.address || "");
  }

  async function handleCreateCustomer(data: any) {
    setSavingCust(true);
    try {
      const res = await axios.post("/api/customers", data);
      if (res.data.success) {
        const c = res.data.data;
        setCustomers((p) => [c, ...p]);
        setCustomerId(c._id);
        setCustomerName(c.name || "");
        setCustomerNumber(c.customerNumber || "");
        setCustomerMobile(c.mobile || "");
        setCustomerAddress(c.address || "");
        setCustModalOpen(false);
        toast.success("Customer created");
      }
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Failed to create customer");
    } finally {
      setSavingCust(false);
    }
  }

  // ── line item helpers ──────────────────────────────────────────────────────────
  function selectProduct(lineId: string, productId: string) {
    const p = products.find((x) => x._id === productId);
    if (!p) return;
    const price = p.salesAmount || 0;
    const material =
      p.primaryMaterial && p.primaryMaterial !== "—" ? p.primaryMaterial : "";
    const color = p.color || p.variants?.colors?.[0] || "";
    const size = p.variants?.sizes?.[0] || "";
    setLineItems((prev) =>
      prev.map((i) =>
        i.id !== lineId
          ? i
          : {
              ...i,
              itemId: productId,
              itemNumber: p.itemNumber,
              itemName: p.name,
              unit: p.unit || "Piece",
              price,
              color,
              material,
              size,
              total: Math.max(0, price * i.qty * (1 - (i.discount || 0) / 100)),
              dimensions: p.dimensions,
              bom: p.bom,
              pricing: p.pricing,
            },
      ),
    );
  }

  function selectBatch(lineId: string, batchNum: string) {
    const row = lineItems.find((i) => i.id === lineId);
    if (!row) return;
    const product = products.find((p) => p._id === row.itemId);
    const batch = product?.batches?.find(
      (b: any) => b.batchNumber === batchNum,
    );
    setLineItems((prev) =>
      prev.map((i) => {
        if (i.id !== lineId) return i;
        const price = batch?.salePrice || i.price;
        return {
          ...i,
          batchNumber: batchNum,
          price,
          total: Math.max(0, i.qty * price * (1 - (i.discount || 0) / 100)),
        };
      }),
    );
  }

  function updateField(
    lineId: string,
    field: keyof LineItem,
    value: string | number,
  ) {
    setLineItems((prev) =>
      prev.map((i) => {
        if (i.id !== lineId) return i;
        let val = value;
        if (field === "qty") {
          const prod = products.find((p) => p._id === i.itemId);
          const stock = prod?.quantity ?? Infinity;
          val = Math.min(Math.max(1, Number(val)), stock);
        }
        const u = { ...i, [field]: val };
        u.total = Math.max(0, u.qty * u.price * (1 - (u.discount || 0) / 100));
        return u;
      }),
    );
  }

  function updateAdvancePaid(val: number) {
    if (val > grandTotal) {
      toast.error("Limit Exceeded: You cannot add more than the grand total.");
      setAdvancePaid(grandTotal);
    } else {
      setAdvancePaid(val);
    }
  }

  function removeRow(lineId: string) {
    setLineItems((prev) => prev.filter((i) => i.id !== lineId));
  }

  function openEditItem(line: LineItem) {
    setEditingLineId(line.id);
    setItemModalOpen(true);
  }

  function handleItemModalSubmit(itemData: any) {
    if (editingLineId) {
      setLineItems((prev) =>
        prev.map((i) =>
          i.id !== editingLineId
            ? i
            : {
                ...i,
                itemName: itemData.itemName,
                unit: itemData.unit || "Piece",
                qty: itemData.quantity,
                price: itemData.price,
                discount: itemData.discount || 0,
                color: itemData.color || "",
                material: itemData.material || "",
                size: itemData.size || "",
                total: itemData.total,
                dimensions: itemData.dimensions,
                bom: itemData.bom,
                pricing: itemData.pricing,
              },
        ),
      );
    } else {
      setLineItems((prev) => [
        ...prev,
        {
          id: uid(),
          itemId: "",
          itemNumber: "",
          itemName: itemData.itemName,
          unit: itemData.unit || "Piece",
          qty: itemData.quantity,
          price: itemData.price,
          discount: itemData.discount || 0,
          batchNumber: "",
          color: itemData.color || "",
          material: itemData.material || "",
          size: itemData.size || "",
          total: itemData.total,
          dimensions: itemData.dimensions,
          bom: itemData.bom,
          pricing: itemData.pricing,
        },
      ]);
    }
    setItemModalOpen(false);
    setEditingLineId(null);
  }

  // ── submit ────────────────────────────────────────────────────────────────────
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError("");
    if (!customerId) {
      setFormError("Please select or create a customer.");
      return;
    }
    if (!deliveryDate) {
      setFormError("Delivery Date is required.");
      return;
    }
    if (!deliveryAddress.trim()) {
      setFormError("Delivery Address is required.");
      return;
    }
    if (lineItems.length === 0) {
      setFormError("Add at least one product.");
      return;
    }
    if (lineItems.some((i) => !i.itemName.trim())) {
      setFormError("All rows must have a product.");
      return;
    }

    await onSubmit({
      customerId,
      customerName,
      customerNumber,
      customerMobile,
      customerAddress,
      date,
      paymentType,
      advancePaid,
      previousPaid: 0,
      subtotal: subtotalAfterItemDiscount,
      tax: taxPct,
      discount:
        subtotalAfterItemDiscount > 0
          ? (discAmt / subtotalAfterItemDiscount) * 100
          : 0,
      total: grandTotal,
      deliveryDate: deliveryDate || undefined,
      deliveryAddress,
      remarks,
      isDirect: !isConversion,
      items: lineItems.map((i) => ({
        itemId: i.itemId || undefined,
        itemNumber: i.itemNumber,
        itemName: i.itemName,
        unit: i.unit,
        quantity: i.qty,
        price: i.price,
        discount: i.discount,
        batch: i.batchNumber || undefined,
        color: i.color,
        material: i.material,
        size: i.size,
        total: i.total,
        dimensions: i.dimensions,
        bom: i.bom,
        pricing: i.pricing,
      })),
    });
  }

  // ── styles ────────────────────────────────────────────────────────────────────
  const inp =
    "w-full rounded-lg border border-[#E5DDD5] px-3 py-2 text-sm bg-white text-[#1A1210] focus:outline-none focus:ring-2 focus:ring-[#C9A84C]/30";
  const lbl = "block text-xs font-semibold text-[#7A6055] mb-1";

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? "Edit Sale Order" : "New Sales Bill"}
      size="xl"
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={loading}>
            {t("cancel")}
          </Button>
          <Button form="sale-form" type="submit" loading={loading}>
            {isEdit ? "Update Order" : "Create Sale Bill"}
          </Button>
        </>
      }
    >
      <form id="sale-form" onSubmit={handleSubmit} className="space-y-5">
        {/* ── Customer + Date ──────────────────────────────────────── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2">
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-semibold text-[#7A6055]">
                {t("customer")}
              </label>
              {!isConversion && (
                <button
                  type="button"
                  onClick={() => setCustModalOpen(true)}
                  className="text-[10px] font-semibold text-[#C9A84C] flex items-center gap-1 hover:underline"
                >
                  <UserPlus size={11} /> {t("addNewCustomer")}
                </button>
              )}
            </div>

            {isConversion ? (
              <div className={inp + " bg-[#FAF8F6] font-semibold"}>
                {customerName}
              </div>
            ) : (
              <select
                value={customerId}
                onChange={(e) => pickCustomer(e.target.value)}
                className={inp}
              >
                <option value="">{t("selectCustomer")}</option>
                {customers.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.name}
                  </option>
                ))}
              </select>
            )}
          </div>

          <div>
            <label className={lbl}>{t("date")}</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className={inp}
            />
          </div>
        </div>

        {/* Customer details */}
        {customerId && (
          <div className="rounded-xl border border-[#E5DDD5] bg-[#FAF8F6] p-4 -mt-1">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className={lbl}>{t("customerId")}</label>
                <input
                  readOnly
                  value={customerNumber}
                  className={inp + " bg-white"}
                  placeholder="—"
                />
              </div>
              <div>
                <label className={lbl}>{t("phone")}</label>
                <input
                  readOnly
                  value={customerMobile}
                  className={inp + " bg-white"}
                  placeholder="—"
                />
              </div>
              <div>
                <label className={lbl}>{t("address")}</label>
                <input
                  readOnly
                  value={customerAddress}
                  className={inp + " bg-white"}
                  placeholder="—"
                />
              </div>
            </div>
          </div>
        )}

        {/* ── Payment Type ─────────────────────────────────────────── */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div>
            <label className={lbl}>{t("paymentType")}</label>
            <select
              value={paymentType}
              onChange={(e) => setPaymentType(e.target.value as any)}
              className={inp}
            >
              <option value="cash">{t("cash")}</option>
              <option value="bank">{t("bankUpi")}</option>
              <option value="credit">{t("credit")}</option>
            </select>
          </div>
        </div>

        {/* ── Products table ───────────────────────────────────────── */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-[#1A1210]">{t("products")}</h3>
            <button
              type="button"
              onClick={() => setLineItems((p) => [...p, newRow()])}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold bg-[#1B3A2D] text-white hover:bg-[#163222] transition-colors"
            >
              <Plus size={14} /> {t("addProduct")}
            </button>
          </div>
          <div className="rounded-xl border border-[#E5DDD5] overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-[#FAF8F6] border-b border-[#E5DDD5]">
                <tr>
                  <th className="py-2.5 px-3 text-start text-xs font-bold text-[#7A6055] uppercase">
                    {t("product")}
                  </th>
                  <th className="py-2.5 px-2 text-start text-xs font-bold text-[#7A6055] uppercase w-24">
                    {t("color")}
                  </th>
                  <th className="py-2.5 px-2 text-center text-xs font-bold text-[#7A6055] uppercase w-16">
                    {t("qty")}
                  </th>
                  <th className="py-2.5 px-2 text-end text-xs font-bold text-[#7A6055] uppercase w-28">
                    {t("price")}
                    <CurrencySymbol className="w-3 h-3" />)
                  </th>
                  <th className="py-2.5 px-2 text-end text-xs font-bold text-[#7A6055] uppercase w-20">
                    {t("disc")}
                  </th>
                  <th className="py-2.5 px-2 text-end text-xs font-bold text-[#7A6055] uppercase w-28">
                    {t("total")}
                    <CurrencySymbol className="w-3 h-3" />)
                  </th>
                  <th className="w-16 text-center py-2.5 px-2 text-xs font-bold text-[#7A6055] uppercase">
                    {t("action")}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F0EBE5]">
                {lineItems.length === 0 ? (
                  <tr>
                    <td
                      colSpan={7}
                      className="py-10 text-center text-[#A89080] text-sm"
                    >
                      {t("addAProductToContinue")}
                    </td>
                  </tr>
                ) : (
                  lineItems.map((item) => (
                    <tr key={item.id} className="hover:bg-[#FAF8F6]">
                      <td className="px-3 py-2">
                        {item.itemName ? (
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-semibold text-[#1A1210]">
                              {item.itemName}
                            </span>
                            {!isConversion && (
                              <button
                                type="button"
                                onClick={() =>
                                  updateField(item.id, "itemName", "")
                                }
                                className="text-[10px] text-[#A89080] hover:text-[#1A1210] underline"
                              >
                                {t("change")}
                              </button>
                            )}
                          </div>
                        ) : (
                          <select
                            value={item.itemId}
                            onChange={(e) =>
                              selectProduct(item.id, e.target.value)
                            }
                            className={inp}
                          >
                            <option value="">{t("selectProduct")}</option>
                            {products.map((p) => (
                              <option key={p._id} value={p._id}>
                                {p.name}
                              </option>
                            ))}
                          </select>
                        )}
                      </td>
                      <td className="px-2 py-2">
                        <input
                          value={item.color}
                          onChange={(e) =>
                            updateField(item.id, "color", e.target.value)
                          }
                          className={inp}
                          placeholder={t("color")}
                        />
                      </td>
                      <td className="px-2 py-2">
                        <input
                          type="number"
                          min={1}
                          value={item.qty}
                          onChange={(e) =>
                            updateField(item.id, "qty", Number(e.target.value))
                          }
                          className={inp + " text-center"}
                        />
                      </td>
                      <td className="px-2 py-2">
                        <input
                          type="number"
                          value={item.price}
                          onChange={(e) =>
                            updateField(
                              item.id,
                              "price",
                              Number(e.target.value),
                            )
                          }
                          className={inp + " text-end"}
                        />
                      </td>
                      <td className="px-2 py-2">
                        <input
                          type="number"
                          value={item.discount}
                          onChange={(e) =>
                            updateField(
                              item.id,
                              "discount",
                              Number(e.target.value),
                            )
                          }
                          className={inp + " text-end"}
                          placeholder="0"
                        />
                      </td>
                      <td className="px-3 py-2 text-end font-semibold">
                        <CurrencySymbol className="w-3 h-3 me-1" />
                        {item.total.toLocaleString("en-IN")}
                      </td>
                      <td className="px-2 py-2 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            type="button"
                            onClick={() => openEditItem(item)}
                            className="text-amber-600 hover:text-amber-800 p-1 rounded hover:bg-amber-50"
                            title={t("editProductSpecsDetails")}
                          >
                            <Pencil size={15} />
                          </button>
                          <button
                            type="button"
                            onClick={() => removeRow(item.id)}
                            className="text-rose-400 hover:text-rose-600 p-1 rounded hover:bg-rose-50"
                            title={t("removeItem")}
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* ── Delivery + Totals ────────────────────────────────────── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2 border-t border-[#F0EBE5]">
          <div className="space-y-3">
            <div>
              <label className={lbl}>{t("deliveryDate")}</label>
              <input
                type="date"
                value={deliveryDate}
                onChange={(e) => setDeliveryDate(e.target.value)}
                className={inp}
                required
              />
            </div>
            <div>
              <label className={lbl}>{t("deliveryAddress")}</label>
              <textarea
                value={deliveryAddress}
                onChange={(e) => setDeliveryAddress(e.target.value)}
                rows={3}
                placeholder={t("enterFullDeliveryAddress")}
                className={inp + " resize-none"}
                required
              />
            </div>
          </div>

          <div className="p-4 rounded-xl bg-[#FAF8F6] border border-[#E5DDD5] space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-[#7A6055]">{t("subtotal")}</span>
              <span className="font-semibold">
                <CurrencySymbol className="w-3 h-3 me-1" />{" "}
                {subtotalAfterItemDiscount.toLocaleString("en-IN")}
              </span>
            </div>
            <div className="flex justify-between text-sm items-center">
              <span className="text-[#7A6055]">{t("discountAmount")}</span>
              <input
                type="number"
                min={0}
                step="0.001"
                value={discAmt}
                onChange={(e) => setDiscAmt(Number(e.target.value))}
                className="w-24 text-end border rounded px-1"
              />
            </div>
            <div className="flex justify-between text-sm items-center">
              <span className="text-[#7A6055]">{t("vat")}</span>
              <input
                type="number"
                value={taxPct}
                onChange={(e) => setTaxPct(Number(e.target.value))}
                className="w-20 text-end border rounded px-1"
              />
            </div>
            <div className="flex justify-between pt-2 border-t border-[#E5DDD5] font-black text-xl">
              <span>{t("grandTotal")}</span>
              <span>
                <CurrencySymbol className="w-5 h-5 me-1" />{" "}
                {grandTotal.toLocaleString("en-IN")}
              </span>
            </div>
            <div className="flex justify-between text-sm items-center py-1">
              <span className="text-[#7A6055] font-semibold">
                {t("advancePaid")}
                <CurrencySymbol className="w-3 h-3" />)
              </span>
              <input
                type="number"
                min={0}
                value={advancePaid}
                onChange={(e) => updateAdvancePaid(Number(e.target.value))}
                className="w-24 text-end border rounded px-2 py-1 font-bold text-[#1B3A2D] focus:ring-2 focus:ring-[#C9A84C]/40 outline-none"
              />
            </div>
            <div
              className={`flex justify-between text-sm ${balance < 0 ? "text-emerald-600" : "text-rose-500"} font-bold`}
            >
              <span>{balance < 0 ? "Credit Balance" : "Balance Due"}</span>
              <span>
                <CurrencySymbol className="w-3 h-3 me-1" />{" "}
                {Math.abs(balance).toLocaleString("en-IN")}
              </span>
            </div>
          </div>
        </div>

        {/* ── Special Instructions ─────────────────────────────────── */}
        <div className="pt-2">
          <label className={lbl}>{t("specialInstructionsRemarks")}</label>
          <textarea
            value={remarks}
            onChange={(e) => setRemarks(e.target.value)}
            rows={4}
            placeholder={t("enterAnySpecialInstructionsFor")}
            className={inp + " resize-y min-h-[100px]"}
          />
        </div>

        {formError && (
          <p className="text-sm text-rose-600 bg-rose-50 px-4 py-2 rounded-lg border border-rose-200">
            {formError}
          </p>
        )}
      </form>

      <CustomerModal
        open={custModalOpen}
        onClose={() => setCustModalOpen(false)}
        onSubmit={handleCreateCustomer}
        loading={savingCust}
      />

      <QuotationItemModal
        open={itemModalOpen}
        onClose={() => {
          setItemModalOpen(false);
          setEditingLineId(null);
        }}
        onSubmit={handleItemModalSubmit}
        editItem={(() => {
          const active = lineItems.find((i) => i.id === editingLineId);
          if (!active) return null;
          return {
            itemName: active.itemName,
            color: active.color,
            material: active.material,
            size: active.size,
            unit: active.unit as any,
            quantity: active.qty,
            price: active.price,
            discount: active.discount,
            total: active.total,
            dimensions: active.dimensions,
            bom: active.bom,
            pricing: active.pricing,
          };
        })()}
      />
    </Modal>
  );
}

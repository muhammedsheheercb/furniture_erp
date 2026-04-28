"use client";
import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { Trash2, Save, FileText, ShoppingCart, Pencil, Plus as PlusIcon, Minus } from "lucide-react";
import TopBar from "@/components/layout/TopBar";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import SearchSelect from "@/components/ui/SearchSelect";
import ConfirmModal from "@/components/ui/ConfirmModal";
import Spinner from "@/components/ui/Spinner";
import { useSales } from "@/hooks/useSales";
import { ICustomer, IItem, ISaleItem, ISelectOption, PaymentType } from "@/types";
import { formatCurrency, formatDateInput } from "@/lib/utils";
import toast from "react-hot-toast";
import { useSession } from "next-auth/react";

interface CartItem extends ISaleItem { _itemRef?: IItem }

export default function EditSalePage() {
    const router = useRouter();
    const { id } = useParams();
    const { updateSale } = useSales();
    const { data: session, status } = useSession();

    useEffect(() => {
        if (status === "unauthenticated") {
            router.push("/login");
        } else if (status === "authenticated") {
            const isAdmin = session?.user?.role === "admin";
            const canEdit = isAdmin || (session?.user?.permissions as any)?.sales?.edit;
            if (!canEdit) {
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
    const [date, setDate] = useState("");
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [isTaxInvoice, setIsTaxInvoice] = useState(false);
    const [advancePaid, setAdvancePaid] = useState(0);
    const [deliveryDate, setDeliveryDate] = useState("");
    const [deliveryAddress, setDeliveryAddress] = useState("");
    const [customerMobile, setCustomerMobile] = useState("");
    const [customerAddress, setCustomerAddress] = useState("");

    useEffect(() => {
        const load = async () => {
            try {
                const [cr, ir, sr] = await Promise.all([
                    fetch("/api/customers?limit=500").then(r => r.json()),
                    fetch("/api/items?limit=500").then(r => r.json()),
                    fetch(`/api/sales/${id}`).then(r => r.json()),
                ]);
                if (cr.success) setCustomers(cr.data);
                if (ir.success) setItems(ir.data);
                if (sr.success) {
                    const s = sr.data;
                    setSelCustomer({ value: s.customerId, label: `${s.customerName} (${s.customerNumber})`, data: { _id: s.customerId, name: s.customerName, customerNumber: s.customerNumber } as ICustomer });
                    
                    // Format dates for cart items
                    const formattedItems = s.items.map((item: any) => ({
                        ...item,
                        manufacturingDate: formatDateInput(item.manufacturingDate),
                        expiryDate: formatDateInput(item.expiryDate)
                    }));
                    setCart(formattedItems);
                    
                    setPaymentType(s.paymentType);
                    setTax(s.tax);
                    setDate(formatDateInput(s.date));
                    setIsTaxInvoice(s.isTaxInvoice || false);
                    setAdvancePaid(s.advancePaid || 0);
                    setDeliveryDate(s.deliveryDate ? formatDateInput(s.deliveryDate) : "");
                    setDeliveryAddress(s.deliveryAddress || "");
                    
                    // Fetch full customer info for mobile/address
                    const custRes = await fetch(`/api/customers/${s.customerId}`).then(r => r.json());
                    if (custRes.success) {
                        setCustomerMobile(custRes.data.mobile || "");
                        setCustomerAddress(custRes.data.address || "");
                    }
                } else {
                    toast.error("Sale not found");
                    router.push("/sales");
                }
            } catch {
                toast.error("Failed to load data");
            } finally {
                setLoading(false);
            }
        };
        load();
    }, [id, router]);

    const customerOptions: ISelectOption[] = customers.map(c => ({
        value: c._id, label: `${c.name} (${c.customerNumber})`, data: c,
    }));

    const itemOptions: ISelectOption[] = items.map(i => ({
        value: i._id, label: `${i.name} — ${formatCurrency(i.salesAmount)}`, data: i,
    }));

    const addItem = async (opt: ISelectOption | null) => {
        if (!opt) return;
        const item = opt.data as IItem;
        
        // Fetch last sale price for this customer and item
        if (selCustomer) {
            try {
                const res = await fetch(`/api/sales/last-price?customerId=${selCustomer.value}&itemId=${item._id}`);
                const data = await res.json();
                if (data.success && data.lastPrice !== null) {
                    toast(`Last sold to this customer at ${formatCurrency(data.lastPrice)}`, {
                        icon: '💰',
                        duration: 6000,
                        style: {
                            borderRadius: '10px',
                            background: '#333',
                            color: '#fff',
                        },
                    });
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
                return dateObj.toISOString().split('T')[0] || "";
            } catch { return ""; }
        };

        setCart(prev => [...prev, {
            itemId: item._id, itemNumber: item.itemNumber, itemName: item.name,
            quantity: 1, price: item.salesAmount, total: item.salesAmount, batch: "", 
            discount: 0,
            isFOC: false,
            manufacturingDate: formatDateStr(item.manufacturingDate) as string,
            expiryDate: formatDateStr(item.expiryDate) as string,
            _itemRef: item,
        }]);
    };

    useEffect(() => {
        if (selCustomer && customers.length > 0) {
            const customer = customers.find(c => c._id === selCustomer.value);
            if (customer) {
                setCustomerMobile(customer.mobile || "");
                setCustomerAddress(customer.address || "");
            }
        }
    }, [selCustomer, customers]);

    const updateItem = (idx: number, updates: any) => {
        setCart(prev => prev.map((c, i) => {
            if (i !== idx) return c;
            const updated = { ...c, ...updates };

            const q = (updated.quantity as any) === "" ? 0 : Number(updated.quantity);
            const p = (updated.price as any) === "" ? 0 : Number(updated.price);
            const d = (updated.discount as any) === "" ? 0 : Number(updated.discount);

            // Prevent negative
            if (q < 0) { updated.quantity = 0; }
            if (p < 0) { updated.price = 0; }
            if (d < 0) { updated.discount = 0; }
            if (updated.total !== "" && Number(updated.total) < 0) { updated.total = 0; }

            if (updated.isFOC) {
                updated.total = 0;
                updated.price = 0;
                updated.discount = 0;
            } else {
                if ('quantity' in updates || 'price' in updates || 'discount' in updates) {
                    const newQ = (updated.quantity as any) === "" ? 0 : Number(updated.quantity);
                    const newP = (updated.price as any) === "" ? 0 : Number(updated.price);
                    const newD = (updated.discount as any) === "" ? 0 : Number(updated.discount);
                    updated.total = Number(((newQ * newP) - newD).toFixed(3));
                } else if ('total' in updates) {
                    const newT = (updated.total as any) === "" ? 0 : Number(updated.total);
                    const currentQ = (updated.quantity as any) === "" ? 0 : Number(updated.quantity);
                    const currentD = (updated.discount as any) === "" ? 0 : Number(updated.discount);
                    if (currentQ > 0) {
                        updated.price = Number(((newT + currentD) / currentQ).toFixed(3));
                    }
                }
            }
            return updated;
        }));
    };

    const removeItem = (idx: number) => setCart(prev => prev.filter((_, i) => i !== idx));

    const subtotal = cart.reduce((s, c) => s + (c.isFOC ? 0 : (c.price * c.quantity)), 0);
    const totalDiscount = cart.reduce((s, c) => s + (c.isFOC ? 0 : (c.discount || 0)), 0);
    const taxableAmount = subtotal - totalDiscount;
    const taxAmt = taxableAmount * (tax / 100);
    const total = taxableAmount + taxAmt;

    const handleSave = async (shouldPrint: boolean = false) => {
        if (!selCustomer || cart.length === 0) return;
        setSaving(true);
        const customer = selCustomer.data as ICustomer;
        const saleData = {
            customerId: customer._id, 
            customerName: customer.name,
            customerNumber: customer.customerNumber,
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

        const response = await fetch(`/api/sales/${id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(saleData),
        });
        
        const data = await response.json();
        setSaving(false);
        
        if (data.success) {
            toast.success("Sale updated successfully");
            if (shouldPrint) {
                const { generateInvoicePDF } = await import("@/lib/pdf-utils");
                generateInvoicePDF({
                    number: data.data.saleNumber || "INV",
                    customerOrSupplier: customer.name,
                    customerOrSupplierNumber: customer.customerNumber,
                    customerOrSupplierMobile: customer.mobile,
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
            toast.error(data.message || "Failed to update sale");
        }
    };

    if (loading) return <div className="py-20 text-center"><Spinner /></div>;

    return (
        <div className="page-container max-w-4xl">
            <TopBar title="Edit Sale" subtitle={`Updating record #${id}`} />

            <div className="card p-6 flex flex-col gap-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="md:col-span-1">
                        <SearchSelect
                            label="Customer"
                            options={customerOptions}
                            value={selCustomer}
                            onChange={(opt) => setSelCustomer(opt)}
                            required
                        />
                        {selCustomer && (
                            <div className="mt-2 p-3 bg-indigo-50/50 rounded-lg border border-indigo-100 flex flex-col gap-1">
                                <div className="text-xs font-bold text-indigo-700 uppercase tracking-wider">Customer Details</div>
                                <div className="text-sm font-medium text-indigo-900">Mobile: {customerMobile || '—'}</div>
                                <div className="text-sm font-medium text-indigo-900">Address: {customerAddress || '—'}</div>
                            </div>
                        )}
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <Input label="Sale Date" type="date" value={date} onChange={e => setDate(e.target.value)} required />
                        <Input label="Delivery Date" type="date" value={deliveryDate} onChange={e => setDeliveryDate(e.target.value)} />
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-6">
                    <div>
                        <label className="text-sm font-medium text-gray-700 block mb-1.5">Delivery Address</label>
                        <textarea
                            value={deliveryAddress}
                            onChange={e => setDeliveryAddress(e.target.value)}
                            placeholder="Enter delivery address..."
                            rows={3}
                            className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-none text-sm"
                        />
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <label className="text-sm font-medium text-gray-700 block mb-1">Payment type</label>
                        <div className="flex flex-col sm:flex-row gap-2">
                            {(["cash", "credit", "bank"] as PaymentType[]).map(t => (
                                <button key={t} onClick={() => setPaymentType(t)}
                                    className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-colors capitalize
                    ${paymentType === t ? "bg-emerald-600 text-white border-emerald-600 shadow-md" : "border-gray-300 text-gray-600 hover:bg-gray-50"}`}>
                                    {t}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div className="flex flex-col gap-2">
                        <Input label="Tax (%)" type="number" min={0} max={100} value={tax} 
                            onChange={e => {
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
                                onChange={e => setIsTaxInvoice(e.target.checked)}
                                className="w-4 h-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                            />
                            <label htmlFor="isTaxInvoice" className="text-sm font-medium text-gray-700 cursor-pointer select-none">Separate Tax Bill Details</label>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input label="Advance Paid" type="number" min={0} value={advancePaid} onChange={e => setAdvancePaid(Number(e.target.value))} placeholder="0" />
                    <div className="flex items-center gap-2 mt-7">
                        <span className="text-sm font-medium text-gray-500">Balance:</span>
                        <span className="text-lg font-bold text-rose-600">{formatCurrency(total - advancePaid)}</span>
                    </div>
                </div>

                <div>
                    <label className="text-sm font-medium text-gray-700 block mb-1">Add item</label>
                    <SearchSelect placeholder="Search items…" options={itemOptions} value={null} onChange={addItem} />
                </div>

                {cart.length > 0 && (
                    <div className="table-wrapper">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-gray-200">
                                    <th className="th text-left">Item Details</th>
                                    <th className="th text-center">Batch</th>
                                    <th className="th text-center">Mfg Date</th>
                                    <th className="th text-center">Exp Date</th>
                                    <th className="th text-right">Unit Price</th>
                                    <th className="th text-center">Qty</th>
                                    <th className="th text-center">FOC</th>
                                    <th className="th text-right">Total</th>
                                    <th className="th" />
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {cart.map((c, idx) => (
                                    <tr key={`${c.itemId}-${idx}`} className="align-top">
                                        <td className="td text-left">
                                            <div className="font-medium text-gray-800">{c.itemName}</div>
                                            <div className="text-[10px] text-gray-400 font-mono tracking-tighter uppercase">{c.itemNumber}</div>
                                        </td>
                                        <td className="td">
                                            <input type="text" value={c.batch} readOnly
                                                className="w-full px-2 py-1 text-[10px] text-right border border-gray-100 bg-gray-50 rounded text-gray-400 font-mono" />
                                        </td>
                                        <td className="td">
                                            <input type="date" value={c.manufacturingDate}
                                                onChange={e => setCart(prev => prev.map((it, i) => i === idx ? { ...it, manufacturingDate: e.target.value } : it))}
                                                className="w-32 px-1 py-1 text-[10px] text-right border border-gray-200 rounded focus:ring-1 focus:ring-emerald-500" />
                                        </td>
                                        <td className="td">
                                            <input type="date" value={c.expiryDate}
                                                onChange={e => setCart(prev => prev.map((it, i) => i === idx ? { ...it, expiryDate: e.target.value } : it))}
                                                className="w-32 px-1 py-1 text-[10px] text-right border border-gray-200 rounded focus:ring-1 focus:ring-emerald-500" />
                                        </td>
                                         <td className="td text-right">
                                             <input type="number" step="0.001" value={c.price} disabled={c.isFOC}
                                                 onChange={e => updateItem(idx, { price: e.target.value })}
                                                 className="w-20 px-2 py-1 text-[10px] text-right border border-gray-200 rounded focus:ring-1 focus:ring-emerald-500" />
                                         </td>
                                         <td className="td text-center">
                                             <div className="flex items-center justify-center bg-gray-50 rounded border border-gray-200 p-0.5 w-24 mx-auto">
                                                 <button onClick={() => updateItem(idx, { quantity: ((c.quantity as any) === "" ? 0 : Number(c.quantity)) - 1 })}
                                                     className="p-1 hover:bg-white rounded hover:shadow-xs text-gray-500 transition-all">
                                                     <Minus size={12} />
                                                 </button>
                                                 <input type="number" value={c.quantity}
                                                     onChange={e => updateItem(idx, { quantity: e.target.value })}
                                                     className="w-10 text-center bg-transparent text-[10px] font-semibold focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" />
                                                 <button onClick={() => updateItem(idx, { quantity: ((c.quantity as any) === "" ? 0 : Number(c.quantity)) + 1 })}
                                                     className="p-1 hover:bg-white rounded hover:shadow-xs text-gray-500 transition-all">
                                                     <PlusIcon size={12} />
                                                 </button>
                                             </div>
                                         </td>
                                        <td className="td text-center">
                                            <input
                                                type="checkbox"
                                                checked={c.isFOC || false}
                                                onChange={e => updateItem(idx, { isFOC: e.target.checked })}
                                                className="w-4 h-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                                            />
                                        </td>
                                         <td className="td text-right font-semibold text-gray-800">
                                             {c.isFOC ? (
                                                 <span className="text-emerald-600 font-bold px-1.5 py-0.5 bg-emerald-50 rounded text-[10px] uppercase tracking-wider">FREE</span>
                                             ) : (
                                                 <input type="number" step="0.01" value={c.total}
                                                     onChange={e => updateItem(idx, { total: e.target.value })}
                                                     className="w-20 px-2 py-1 text-[10px] text-right font-bold border border-gray-200 rounded focus:ring-1 focus:ring-emerald-500" />
                                             )}
                                         </td>
                                        <td className="td text-center">
                                            <div className="flex items-center justify-center gap-1">
                                                <button
                                                    type="button"
                                                    title="Split row"
                                                    onClick={() => {
                                                        const fresh = { ...c, quantity: 1 };
                                                        if (c.quantity > 1) {
                                                            updateItem(idx, { quantity: c.quantity - 1 });
                                                        }
                                                        setCart(prev => {
                                                            const upd = [...prev];
                                                            upd.splice(idx + 1, 0, fresh);
                                                            return upd;
                                                        });
                                                    }}
                                                    className="p-1 text-emerald-500 hover:bg-emerald-50 rounded"
                                                >
                                                    <PlusIcon size={14} />
                                                </button>
                                                <Button variant="ghost" size="xs" icon={<Trash2 size={14} className="text-red-500" />} onClick={() => removeItem(idx)} />
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                <div className="flex flex-col items-end gap-1 text-sm border-t border-gray-100 pt-4 font-medium">
                            <div className="flex gap-10 text-gray-500"><span>Subtotal</span><span>{formatCurrency(subtotal)}</span></div>
                            <div className="flex gap-10 text-amber-600"><span>Discount</span><span>-{((totalDiscount as any) === "" ? "0.00" : formatCurrency(totalDiscount))}</span></div>
                            <div className="flex gap-10 text-gray-500"><span>Tax ({(tax as any) === "" ? 0 : tax}%)</span><span>{formatCurrency(taxAmt)}</span></div>
                            <div className="flex gap-10 text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">
                                <span>Advance Paid</span>
                                <span>{formatCurrency(advancePaid)}</span>
                            </div>
                            <div className="flex gap-10 text-rose-600 bg-rose-50 px-2 py-0.5 rounded">
                                <span>Balance Amount</span>
                                <span>{formatCurrency(total - advancePaid)}</span>
                            </div>
                            <div className="flex gap-10 text-lg font-bold text-gray-800 border-t border-gray-100 pt-2 mt-2"><span>Grand Total</span><span className="text-emerald-600">{formatCurrency(total)}</span></div>
                </div>

                <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 pt-6 border-t border-gray-100">
                    <Button variant="outline" onClick={() => router.push("/sales")} className="w-full sm:w-auto">Cancel</Button>
                    <Button onClick={() => handleSave(true)} loading={saving} variant="outline" className="border-indigo-200 text-indigo-600 hover:bg-indigo-50 w-full sm:w-auto">Update & Print PDF</Button>
                    <Button onClick={() => setConfirmOpen(true)} loading={saving} icon={<Save size={16} />} className="bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-600 w-full sm:w-auto">Update Sale</Button>
                </div>
            </div>

            <ConfirmModal
                open={confirmOpen}
                onClose={() => setConfirmOpen(false)}
                onConfirm={handleSave}
                title="Update Sale"
                message="Inventory quantities will be reconciled based on items and quantities changed. Continue?"
                confirmLabel="Confirm Update"
                variant="success"
                loading={saving}
            />
        </div>
    );
}

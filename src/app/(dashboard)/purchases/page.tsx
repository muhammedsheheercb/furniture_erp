"use client";
import { useEffect, useState, useCallback } from "react";
import { Plus, Search, Trash2, Eye, Pencil } from "lucide-react";
import Link from "next/link";
import TopBar from "@/components/layout/TopBar";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Badge from "@/components/ui/Badge";
import Pagination from "@/components/ui/Pagination";
import ConfirmModal from "@/components/ui/ConfirmModal";
import Spinner from "@/components/ui/Spinner";
import { usePurchases } from "@/hooks/usePurchases";
import { IPurchase, PaymentType } from "@/types";
import { formatCurrency, formatDate } from "@/lib/utils";
import { useSession } from "next-auth/react";
import InvoiceModal from "@/components/dashboard/InvoiceModal";
import { generateInvoicePDF } from "@/lib/pdf-utils";
const LIMIT = 10;
import { FileDown } from "lucide-react";
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const YEARS = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i);
const PAY_TYPES: { label: string; value: PaymentType | "" }[] = [
    { label: "All types", value: "" },
    { label: "Cash", value: "cash" },
    { label: "Credit", value: "credit" },
];

export default function PurchasesPage() {
    const { purchases, total, totalPages, totalAmount, loading, fetchPurchases, deletePurchase } = usePurchases();

    const [search, setSearch] = useState("");
    const [page, setPage] = useState(1);
    const [month, setMonth] = useState<number | "">("");
    const [year, setYear] = useState(new Date().getFullYear());
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [payType, setPayType] = useState<PaymentType | "">("");
    const [viewPurchase, setViewPurchase] = useState<IPurchase | null>(null);
    const [deleteId, setDeleteId] = useState<string | null>(null);
    const [deleting, setDeleting] = useState(false);
    const [showFilters, setShowFilters] = useState(false);
    const { data: session } = useSession();
    const isAdmin = session?.user?.role === "admin";
    const perms = (session?.user?.permissions as any)?.purchases;
    const canCreate = isAdmin || perms?.create;
    const canEdit = isAdmin || perms?.edit;
    const canDelete = isAdmin || perms?.delete;

    const load = useCallback(() => {
        fetchPurchases({
            search, page, limit: LIMIT,
            ...(startDate && endDate ? { startDate, endDate } : month ? { month: Number(month), year } : { year }),
            ...(payType ? { paymentType: payType } : {}),
        });
    }, [search, page, month, year, payType, startDate, endDate, fetchPurchases]);

    useEffect(() => { load(); }, [load]);
    useEffect(() => { setPage(1); }, [search, month, year, payType, startDate, endDate]);

    const handleDelete = async () => {
        if (!deleteId) return;
        setDeleting(true);
        const ok = await deletePurchase(deleteId);
        setDeleting(false);
        if (ok) { setDeleteId(null); load(); }
    };

    const invoiceData = viewPurchase ? {
        _id: viewPurchase._id,
        number: viewPurchase.purchaseNumber,
        customerOrSupplier: viewPurchase.supplierName,
        customerOrSupplierNumber: viewPurchase.supplierNumber,
        date: viewPurchase.date,
        paymentType: viewPurchase.paymentType,
        items: viewPurchase.items,
        subtotal: viewPurchase.subtotal,
        tax: viewPurchase.tax,
        total: viewPurchase.total,
        type: "Purchase" as const,
        isTaxInvoice: viewPurchase.isTaxInvoice
    } : null;

    return (
        <div className="page-container">
            <TopBar
                title="Purchases"
                subtitle={`${total} records — Total: ${formatCurrency(totalAmount)}`}
                actions={
                    <div className="flex flex-wrap gap-2">
                        <Button 
                            variant="outline" 
                            icon={<Search size={16} />} 
                            onClick={() => setShowFilters(!showFilters)}
                            className={showFilters ? "bg-amber-50 border-amber-200 text-amber-600" : ""}
                        >
                            {showFilters ? "Hide Filters" : "Filters"}
                        </Button>
                        {canCreate && (
                            <Link href="/purchases/new">
                                <Button icon={<Plus size={16} />} className="bg-amber-600 hover:bg-amber-700 border-amber-600">New Purchase</Button>
                            </Link>
                        )}
                    </div>
                }
            />

            {showFilters && (
                <div className="filter-bar animate-in fade-in slide-in-from-top-2 duration-200">
                    <Input
                        placeholder="Search supplier or purchase #…"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        leftIcon={<Search size={15} />}
                        wrapperClassName="w-64"
                    />
                    <select className="input-base w-32" value={month} onChange={e => setMonth(e.target.value ? (e.target.value === "" ? "" as any : Number(e.target.value)) : "")}>
                        <option value="">All months</option>
                        {MONTHS.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
                    </select>
                    <select className="input-base w-28" value={year} onChange={e => setYear((e.target.value === "" ? "" as any : Number(e.target.value)))}>
                        {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
                    </select>
                    
                    <div className="flex items-center gap-2">
                        <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} 
                            className="input-base w-36 text-xs h-10" />
                        <span className="text-gray-400">to</span>
                        <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} 
                            className="input-base w-36 text-xs h-10" />
                        {(startDate || endDate) && (
                            <button onClick={() => { setStartDate(""); setEndDate(""); }} 
                                className="text-amber-600 text-xs font-semibold px-1">Clear</button>
                        )}
                    </div>

                    <select className="input-base w-36" value={payType} onChange={e => setPayType(e.target.value as PaymentType | "")}>
                        {PAY_TYPES.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
                    </select>
                </div>
            )}

            <div className="card px-5 py-3 flex items-center justify-between">
                <span className="text-sm text-gray-500">Total Stock Value Purchased</span>
                <span className="text-lg font-bold text-amber-600">{formatCurrency(totalAmount)}</span>
            </div>

            <div className="table-wrapper">
                <table className="w-full">
                    <thead>
                        <tr className="border-b border-gray-200">
                            <th className="th">Purchase #</th>
                            <th className="th">Supplier</th>
                            <th className="th">Date</th>
                            <th className="th text-center">Items</th>
                            <th className="th text-right">Stock Value</th>
                            <th className="th text-center">Payment</th>
                            {isAdmin && <th className="th text-right">Created By</th>}
                            <th className="th text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {loading ? (
                            <tr><td colSpan={isAdmin ? 8 : 7} className="py-16 text-center"><Spinner /></td></tr>
                        ) : purchases.length === 0 ? (
                            <tr><td colSpan={isAdmin ? 8 : 7} className="py-16 text-center text-gray-400 text-sm">No purchases found</td></tr>
                        ) : purchases.map((p: IPurchase) => (
                            <tr key={p._id} className="tr-hover">
                                <td className="td font-mono text-xs text-gray-500">{p.purchaseNumber}</td>
                                <td className="td">
                                    <div className="font-medium text-gray-800">{p.supplierName}</div>
                                    <div className="text-xs text-gray-400">{p.supplierNumber}</div>
                                </td>
                                <td className="td text-gray-500 text-xs">{formatDate(p.date)}</td>
                                <td className="td">
                                    <div className="flex flex-wrap gap-1 max-w-[200px]">
                                        {p.items.map((item, i) => (
                                            <Badge key={i} label={item.itemName} variant="info" className="text-[10px] px-1.5 py-0" />
                                        ))}
                                    </div>
                                    <div className="text-[10px] text-gray-400 mt-1">{p.items.length} items total</div>
                                </td>
                                <td className="td text-right font-semibold text-gray-800">{formatCurrency(p.total)}</td>
                                <td className="td text-center">
                                    <Badge
                                        label={p.paymentType}
                                        variant={p.paymentType === "cash" ? "success" : p.paymentType === "credit" ? "warning" : "info"}
                                    />
                                </td>
                                {isAdmin && (
                                    <td className="td text-right">
                                        <div className="flex flex-col items-end">
                                            <span className="text-[10px] font-medium text-gray-800">{p.createdBy?.name || "Admin"}</span>
                                            {p.updatedBy && p.updatedBy.name !== p.createdBy?.name && (
                                                <span className="text-[9px] text-gray-400 italic">Edit: {p.updatedBy.name}</span>
                                            )}
                                        </div>
                                    </td>
                                )}
                                <td className="td text-right">
                                    <div className="flex items-center justify-end gap-1">
                                        <Button variant="ghost" size="xs" icon={<Eye size={14} className="text-gray-500" />} onClick={() => setViewPurchase(p)} />
                                        {canEdit && (
                                            <Link href={`/purchases/edit/${p._id}`}>
                                                <Button variant="ghost" size="xs" icon={<Pencil size={14} className="text-amber-500" />} />
                                            </Link>
                                        )}
                                        {canDelete && (
                                            <Button variant="ghost" size="xs" icon={<Trash2 size={14} className="text-red-500" />}
                                                onClick={() => setDeleteId(p._id)} />
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                <div className="border-t border-gray-100 px-2">
                    <Pagination page={page} totalPages={totalPages} total={total} limit={LIMIT} onPageChange={setPage} />
                </div>
            </div>

            <InvoiceModal
                open={!!viewPurchase}
                onClose={() => setViewPurchase(null)}
                data={invoiceData}
            />

            <ConfirmModal
                open={!!deleteId}
                onClose={() => setDeleteId(null)}
                onConfirm={handleDelete}
                title="Delete Purchase"
                message="Are you sure? Item quantities will NOT be automatically reversed."
                confirmLabel="Delete"
                loading={deleting}
            />
        </div>
    );
}
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
import { useSales } from "@/hooks/useSales";
import { ISale, PaymentType } from "@/types";
import { formatCurrency, formatDate } from "@/lib/utils";
import { useSession } from "next-auth/react";
import { generateInvoicePDF } from "@/lib/pdf-utils";
const LIMIT = 10;
import InvoiceModal from "@/components/dashboard/InvoiceModal";
import { FileDown } from "lucide-react";
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const YEARS = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i);
const PAY_TYPES: { label: string; value: PaymentType | "" }[] = [
    { label: "All types", value: "" },
    { label: "Cash", value: "cash" },
    { label: "Credit", value: "credit" },
];

export default function SalesPage() {
    const { sales, total, totalPages, totalAmount, loading, fetchSales, deleteSale } = useSales();

    const [search, setSearch] = useState("");
    const [page, setPage] = useState(1);
    const [month, setMonth] = useState<number | "">("");
    const [year, setYear] = useState<number>(new Date().getFullYear());
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [payType, setPayType] = useState<PaymentType | "">("");
    const [viewSale, setViewSale] = useState<ISale | null>(null);
    const [deleteId, setDeleteId] = useState<string | null>(null);
    const [deleting, setDeleting] = useState(false);

    const [showFilters, setShowFilters] = useState(false);
    const { data: session } = useSession();
    const isAdmin = session?.user?.role === "admin";
    const perms = (session?.user?.permissions as any)?.sales;
    const canCreate = isAdmin || perms?.create;
    const canEdit = isAdmin || perms?.edit;
    const canDelete = isAdmin || perms?.delete;

    const load = useCallback(() => {
        fetchSales({
            search, page, limit: LIMIT,
            ...(startDate && endDate ? { startDate, endDate } : month ? { month: Number(month), year } : { year }),
            ...(payType ? { paymentType: payType } : {}),
        });
    }, [search, page, month, year, payType, startDate, endDate, fetchSales]);

    useEffect(() => { load(); }, [load]);
    useEffect(() => { setPage(1); }, [search, month, year, payType, startDate, endDate]);

    const handleDelete = async () => {
        if (!deleteId) return;
        setDeleting(true);
        const ok = await deleteSale(deleteId);
        setDeleting(false);
        if (ok) { setDeleteId(null); load(); }
    };

    const invoiceData = viewSale ? {
        _id: viewSale._id,
        number: viewSale.saleNumber,
        customerOrSupplier: viewSale.customerName,
        customerOrSupplierNumber: viewSale.customerNumber,
        date: viewSale.date,
        paymentType: viewSale.paymentType,
        items: viewSale.items,
        subtotal: viewSale.subtotal,
        tax: viewSale.tax,
        total: viewSale.total,
        type: "Sale" as const,
        isTaxInvoice: viewSale.isTaxInvoice
    } : null;

    return (
        <div className="page-container">
            <TopBar
                title="Sales"
                subtitle={`${total} records — Total: ${formatCurrency(totalAmount)}`}
                actions={
                    <div className="flex flex-wrap gap-2">
                        <Button 
                            variant="outline" 
                            icon={<Search size={16} />} 
                            onClick={() => setShowFilters(!showFilters)}
                            className={showFilters ? "bg-indigo-50 border-indigo-200 text-indigo-600" : ""}
                        >
                            {showFilters ? "Hide Filters" : "Filters"}
                        </Button>
                        {canCreate && (
                            <Link href="/sales/new">
                                <Button icon={<Plus size={16} />}>New Sale</Button>
                            </Link>
                        )}
                    </div>
                }
            />

            {/* filters */}
            {showFilters && (
                <div className="filter-bar animate-in fade-in slide-in-from-top-2 duration-200">
                    <Input
                        placeholder="Search customer or sale #…"
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
                                className="text-indigo-600 text-xs font-semibold px-1">Clear</button>
                        )}
                    </div>

                    <select className="input-base w-36" value={payType} onChange={e => setPayType(e.target.value as PaymentType | "")}>
                        {PAY_TYPES.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
                    </select>
                </div>
            )}

            {/* total bar */}
            <div className="card px-5 py-3 flex items-center justify-between">
                <span className="text-sm text-gray-500">Filtered total</span>
                <span className="text-lg font-bold text-indigo-600">{formatCurrency(totalAmount)}</span>
            </div>

            {/* table */}
            <div className="table-wrapper">
                <table className="w-full">
                    <thead>
                        <tr className="border-b border-gray-200">
                            <th className="th">Sale #</th>
                            <th className="th">Customer</th>
                            <th className="th">Date</th>
                            <th className="th text-center">Items</th>
                            <th className="th text-right">Total</th>
                            <th className="th text-center">Payment</th>
                            {isAdmin && <th className="th text-right">Created By</th>}
                            <th className="th text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {loading ? (
                            <tr><td colSpan={isAdmin ? 8 : 7} className="py-16 text-center"><Spinner /></td></tr>
                        ) : sales.length === 0 ? (
                            <tr><td colSpan={isAdmin ? 8 : 7} className="py-16 text-center text-gray-400 text-sm">No sales found</td></tr>
                        ) : sales.map((s: ISale) => (
                            <tr key={s._id} className="tr-hover">
                                <td className="td font-mono text-xs text-gray-500">{s.saleNumber}</td>
                                <td className="td">
                                    <div className="font-medium text-gray-800">{s.customerName}</div>
                                    <div className="text-xs text-gray-400">{s.customerNumber}</div>
                                </td>
                                <td className="td text-gray-500 text-xs">{formatDate(s.date)}</td>
                                <td className="td text-center">
                                    <Badge label={`${s.items.length} items`} variant="info" />
                                </td>
                                <td className="td text-right font-semibold text-gray-800">{formatCurrency(s.total)}</td>
                                <td className="td text-center">
                                    <Badge
                                        label={s.paymentType}
                                        variant={s.paymentType === "cash" ? "success" : s.paymentType === "credit" ? "warning" : "info"}
                                    />
                                </td>
                                {isAdmin && (
                                    <td className="td text-right">
                                        <div className="flex flex-col items-end">
                                            <span className="text-[10px] font-medium text-gray-800">{s.createdBy?.name || "Admin"}</span>
                                            {s.updatedBy && s.updatedBy.name !== s.createdBy?.name && (
                                                <span className="text-[9px] text-gray-400 italic font-light">Edit: {s.updatedBy.name}</span>
                                            )}
                                        </div>
                                    </td>
                                )}
                                <td className="td text-right">
                                    <div className="flex items-center justify-end gap-1">
                                        <Button variant="ghost" size="xs" icon={<Eye size={14} className="text-gray-500" />} onClick={() => setViewSale(s)} />
                                        {canEdit && (
                                            <Link href={`/sales/edit/${s._id}`}>
                                                <Button variant="ghost" size="xs" icon={<Pencil size={14} className="text-emerald-500" />} />
                                            </Link>
                                        )}
                                        {canDelete && (
                                            <Button variant="ghost" size="xs" icon={<Trash2 size={14} className="text-red-500" />}
                                                onClick={() => setDeleteId(s._id)} />
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
                open={!!viewSale}
                onClose={() => setViewSale(null)}
                data={invoiceData}
            />

            <ConfirmModal
                open={!!deleteId}
                onClose={() => setDeleteId(null)}
                onConfirm={handleDelete}
                title="Delete Sale"
                message="Are you sure you want to delete this sale? Item quantities will NOT be automatically restored."
                confirmLabel="Delete"
                loading={deleting}
            />
        </div>
    );
}
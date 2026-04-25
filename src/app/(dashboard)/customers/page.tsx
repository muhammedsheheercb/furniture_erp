"use client";
import { useEffect, useState, useCallback } from "react";
import { Plus, Search, ArrowUpDown, Pencil, Trash2, Eye, PlusCircle } from "lucide-react";
import TopBar from "@/components/layout/TopBar";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Badge from "@/components/ui/Badge";
import Pagination from "@/components/ui/Pagination";
import ConfirmModal from "@/components/ui/ConfirmModal";
import CustomerModal from "@/components/customers/CustomerModal";
import BalanceAdjustmentModal from "@/components/customers/BalanceAdjustmentModal";
import BalanceHistoryModal from "@/components/customers/BalanceHistoryModal";
import Spinner from "@/components/ui/Spinner";
import { useCustomers } from "@/hooks/useCustomers";
import { ICustomer } from "@/types";
import { formatCurrency, formatDate } from "@/lib/utils";
import { useSession } from "next-auth/react";

const LIMIT = 10;

export default function CustomersPage() {
    const { customers, total, totalPages, loading, fetchCustomers, createCustomer, updateCustomer, deleteCustomer } = useCustomers();

    const [search, setSearch] = useState("");
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [purchaseFilter, setPurchaseFilter] = useState<"higher" | "lower" | "">("");
    const [page, setPage] = useState(1);
    const [sortBy, setSortBy] = useState("createdAt");
    const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
    const [modalOpen, setModalOpen] = useState(false);
    const [editCustomer, setEditCustomer] = useState<ICustomer | null>(null);
    const [deleteId, setDeleteId] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [historyLoading, setHistoryLoading] = useState(false);
    const [activeHistoryId, setActiveHistoryId] = useState<string | null>(null);
    const { data: session } = useSession();
    const isAdmin = session?.user?.role === "admin";
    const perms = (session?.user?.permissions as any)?.customers;
    const canCreate = isAdmin || perms?.create;
    const canEdit = isAdmin || perms?.edit;
    const canDelete = isAdmin || perms?.delete;

    // Balance Adjustment
    const [adjustModalOpen, setAdjustModalOpen] = useState(false);
    const [adjustCustomer, setAdjustCustomer] = useState<ICustomer | null>(null);
    // Balance History
    const [historyModalOpen, setHistoryModalOpen] = useState(false);
    const [historyCustomer, setHistoryCustomer] = useState<ICustomer | null>(null);
    const load = useCallback(() => {
        fetchCustomers({ search, page, limit: LIMIT, sortBy, sortOrder, startDate, endDate, purchaseFilter });
    }, [search, page, sortBy, sortOrder, startDate, endDate, purchaseFilter, fetchCustomers]);

    useEffect(() => { load(); }, [load]);
    useEffect(() => { setPage(1); }, [search, startDate, endDate, purchaseFilter]);

    const handleSort = (col: string) => {
        if (sortBy === col) setSortOrder(o => o === "asc" ? "desc" : "asc");
        else { setSortBy(col); setSortOrder("asc"); }
    };

    const handleSubmit = async (data: any) => {
        setSaving(true);
        const ok = editCustomer ? await updateCustomer(editCustomer._id, data) : await createCustomer(data);
        setSaving(false);
        if (ok) { setModalOpen(false); setEditCustomer(null); load(); }
    };

    const handleAdjustBalance = async (data: { adjustAmount: number; adjustType: "add" | "subtract"; date: string }) => {
        if (!adjustCustomer) return;
        setSaving(true);
        const ok = await updateCustomer(adjustCustomer._id, data as any);
        setSaving(false);
        if (ok) { setAdjustModalOpen(false); setAdjustCustomer(null); load(); }
    };

    const handleDelete = async () => {
        if (!deleteId) return;
        setDeleting(true);
        const ok = await deleteCustomer(deleteId);
        setDeleting(false);
        if (ok) { setDeleteId(null); load(); }
    };

    const handleViewHistory = async (c: ICustomer) => {
        setActiveHistoryId(c._id);
        setHistoryLoading(true);
        try {
            const res = await fetch(`/api/customers/${c._id}?t=${Date.now()}`);
            const data = await res.json();
            if (data.success) {
                setHistoryCustomer(data.data);
                setHistoryModalOpen(true);
            }
        } catch (err) {
            console.error("Failed to fetch history:", err);
        } finally {
            setHistoryLoading(false);
            setActiveHistoryId(null);
        }
    };

    const SortBtn = ({ col }: { col: string }) => (
        <button onClick={() => handleSort(col)} className="ml-1 opacity-50 hover:opacity-100 transition-opacity">
            <ArrowUpDown size={13} />
        </button>
    );

    return (
        <div className="page-container">
            <TopBar
                title="Customers"
                subtitle={`${total} customers total`}
                actions={
                    canCreate && (
                        <Button icon={<Plus size={16} />} onClick={() => { setEditCustomer(null); setModalOpen(true); }}>
                            New Customer
                        </Button>
                    )
                }
            />

            <div className="filter-bar flex-wrap gap-4">
                <Input
                    placeholder="Search customers…"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    leftIcon={<Search size={15} />}
                    wrapperClassName="w-64"
                />
                <div className="flex items-center gap-2">
                    <Input
                        type="date"
                        value={startDate}
                        onChange={e => setStartDate(e.target.value)}
                        className="text-xs"
                    />
                    <span className="text-gray-400">to</span>
                    <Input
                        type="date"
                        value={endDate}
                        onChange={e => setEndDate(e.target.value)}
                        className="text-xs"
                    />
                </div>
                <select
                    className="input-base text-sm py-2 px-3 min-w-[180px]"
                    value={purchaseFilter}
                    onChange={e => setPurchaseFilter(e.target.value as any)}
                >
                    <option value="">Sort by Purchase Vol.</option>
                    <option value="higher">Higher Purchases First</option>
                    <option value="lower">Lower Purchases First</option>
                </select>
                {(startDate || endDate || purchaseFilter || search) && (
                    <Button variant="ghost" size="sm" onClick={() => { setStartDate(""); setEndDate(""); setPurchaseFilter(""); setSearch(""); }} className="text-gray-500">
                        Clear
                    </Button>
                )}
            </div>

            <div className="table-wrapper">
                <table className="w-full">
                    <thead>
                        <tr className="border-b border-gray-200">
                            <th className="th">Customer # <SortBtn col="customerNumber" /></th>
                            <th className="th">Name <SortBtn col="name" /></th>
                            <th className="th">Mobile</th>
                            {(purchaseFilter || startDate || endDate) && <th className="th text-right text-indigo-600">Total Purchase</th>}
                            <th className="th text-right">Balance <SortBtn col="creditBalance" /></th>
                            <th className="th">Joined <SortBtn col="createdAt" /></th>
                            {isAdmin && <th className="th text-right">Created By</th>}
                            <th className="th text-right px-6">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {loading ? (
                            <tr><td colSpan={isAdmin ? 8 : 7} className="py-16 text-center"><Spinner /></td></tr>
                        ) : customers.length === 0 ? (
                            <tr><td colSpan={isAdmin ? 8 : 7} className="py-16 text-center text-gray-400 text-sm">No customers found</td></tr>
                        ) : customers.map((c: any) => (
                            <tr key={c._id} className="tr-hover">
                                <td className="td font-mono text-xs text-gray-500">{c.customerNumber}</td>
                                <td className="td font-medium text-gray-800">{c.name}</td>
                                <td className="td text-gray-500">{c.mobile}</td>
                                {(purchaseFilter || startDate || endDate) && (
                                    <td className="td text-right font-bold text-indigo-600">
                                        {formatCurrency(c.totalPurchases || 0)}
                                    </td>
                                )}
                                <td className="td text-right">
                                    <div className="flex items-center justify-end gap-1.5">
                                        <Badge
                                            label={formatCurrency(c.creditBalance || 0)}
                                            variant={(c.creditBalance || 0) > 0 ? "warning" : (c.creditBalance || 0) < 0 ? "danger" : "success"}
                                        />
                                        <Button variant="ghost" size="xs" icon={<PlusCircle size={14} className="text-indigo-500" />} 
                                            onClick={() => { setAdjustCustomer(c); setAdjustModalOpen(true); }} 
                                            title="Add Payment / Adjustment"
                                        />
                                        <Button variant="ghost" size="xs" icon={<Eye size={14} className="text-gray-400 hover:text-indigo-600 transition-colors" />} 
                                            onClick={() => handleViewHistory(c)}
                                            title="Full Statement"
                                            loading={historyLoading && activeHistoryId === c._id}
                                        />
                                    </div>
                                </td>
                                <td className="td text-gray-400 text-xs">{formatDate(c.createdAt)}</td>
                                {isAdmin && (
                                    <td className="td text-right">
                                        <div className="flex flex-col items-end">
                                            <span className="text-[10px] font-medium text-gray-800">{c.createdBy?.name || "Admin"}</span>
                                            {c.updatedBy && c.updatedBy.name !== c.createdBy?.name && (
                                                <span className="text-[9px] text-gray-400 italic">Edit: {c.updatedBy.name}</span>
                                            )}
                                        </div>
                                    </td>
                                )}
                                <td className="td text-right">
                                    <div className="flex items-center justify-end gap-1">
                                        {canEdit && (
                                            <Button variant="ghost" size="xs" icon={<Pencil size={14} />}
                                                onClick={() => { setEditCustomer(c); setModalOpen(true); }} />
                                        )}
                                        {canDelete && (
                                            <Button variant="ghost" size="xs" icon={<Trash2 size={14} className="text-red-500" />}
                                                onClick={() => setDeleteId(c._id)} />
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

            <CustomerModal
                open={modalOpen}
                onClose={() => { setModalOpen(false); setEditCustomer(null); }}
                onSubmit={handleSubmit}
                customer={editCustomer}
                loading={saving}
            />

            <BalanceAdjustmentModal
                open={adjustModalOpen}
                onClose={() => { setAdjustModalOpen(false); setAdjustCustomer(null); }}
                onSubmit={handleAdjustBalance}
                entityName={adjustCustomer?.name || ""}
                customerNumber={adjustCustomer?.customerNumber}
                currentBalance={adjustCustomer?.creditBalance}
                loading={saving}
            />

            <BalanceHistoryModal
                open={historyModalOpen}
                onClose={() => { setHistoryModalOpen(false); setHistoryCustomer(null); }}
                history={historyCustomer?.balanceHistory || []}
                entityName={historyCustomer?.name || ""}
                currentBalance={historyCustomer?.creditBalance || 0}
            />

            <ConfirmModal
                open={!!deleteId}
                onClose={() => setDeleteId(null)}
                onConfirm={handleDelete}
                title="Delete Customer"
                message="Are you sure you want to delete this customer?"
                confirmLabel="Delete"
                loading={deleting}
            />
        </div>
    );
}
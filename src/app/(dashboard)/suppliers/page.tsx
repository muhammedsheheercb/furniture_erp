"use client";
import { useEffect, useState, useCallback } from "react";
import { Plus, Search, ArrowUpDown, Pencil, Trash2, Eye, PlusCircle } from "lucide-react";
import TopBar from "@/components/layout/TopBar";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Badge from "@/components/ui/Badge";
import Pagination from "@/components/ui/Pagination";
import ConfirmModal from "@/components/ui/ConfirmModal";
import SupplierModal from "@/components/suppliers/SupplierModal";
import BalanceAdjustmentModal from "@/components/customers/BalanceAdjustmentModal";
import BalanceHistoryModal from "@/components/customers/BalanceHistoryModal";
import Spinner from "@/components/ui/Spinner";
import { useSuppliers } from "@/hooks/useSuppliers";
import { ISupplier } from "@/types";
import { formatCurrency, formatDate } from "@/lib/utils";
import { useSession } from "next-auth/react";

const LIMIT = 10;

export default function SuppliersPage() {
    const { suppliers, total, totalPages, loading, fetchSuppliers, createSupplier, updateSupplier, deleteSupplier } = useSuppliers();

    const [search, setSearch] = useState("");
    const [page, setPage] = useState(1);
    const [sortBy, setSortBy] = useState("createdAt");
    const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
    const [modalOpen, setModalOpen] = useState(false);
    const [editSupplier, setEditSupplier] = useState<ISupplier | null>(null);
    const [deleteId, setDeleteId] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const { data: session } = useSession();
    const isAdmin = session?.user?.role === "admin";
    const perms = (session?.user?.permissions as any)?.suppliers;
    const canCreate = isAdmin || perms?.create;
    const canEdit = isAdmin || perms?.edit;
    const canDelete = isAdmin || perms?.delete;
    const [historyLoading, setHistoryLoading] = useState(false);
    const [activeHistoryId, setActiveHistoryId] = useState<string | null>(null);

    // Balance Adjustment
    const [adjustModalOpen, setAdjustModalOpen] = useState(false);
    const [adjustSupplier, setAdjustSupplier] = useState<ISupplier | null>(null);
    // Balance History
    const [historyModalOpen, setHistoryModalOpen] = useState(false);
    const [historySupplier, setHistorySupplier] = useState<ISupplier | null>(null);

    const load = useCallback(() => {
        fetchSuppliers({ search, page, limit: LIMIT, sortBy, sortOrder });
    }, [search, page, sortBy, sortOrder, fetchSuppliers]);

    useEffect(() => { load(); }, [load]);
    useEffect(() => { setPage(1); }, [search]);

    const handleSort = (col: string) => {
        if (sortBy === col) setSortOrder(o => o === "asc" ? "desc" : "asc");
        else { setSortBy(col); setSortOrder("asc"); }
    };

    const handleSubmit = async (data: any) => {
        setSaving(true);
        const ok = editSupplier ? await updateSupplier(editSupplier._id, data) : await createSupplier(data);
        setSaving(false);
        if (ok) { setModalOpen(false); setEditSupplier(null); load(); }
    };

    const handleAdjustBalance = async (data: { adjustAmount: number; adjustType: "add" | "subtract"; date: string }) => {
        if (!adjustSupplier) return;
        setSaving(true);
        const ok = await updateSupplier(adjustSupplier._id, data as any);
        setSaving(false);
        if (ok) { setAdjustModalOpen(false); setAdjustSupplier(null); load(); }
    };

    const handleDelete = async () => {
        if (!deleteId) return;
        setDeleting(true);
        const ok = await deleteSupplier(deleteId);
        setDeleting(false);
        if (ok) { setDeleteId(null); load(); }
    };

    const handleViewHistory = async (s: ISupplier) => {
        setActiveHistoryId(s._id);
        setHistoryLoading(true);
        try {
            const res = await fetch(`/api/suppliers/${s._id}?t=${Date.now()}`);
            const data = await res.json();
            if (data.success) {
                setHistorySupplier(data.data);
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
                title="Suppliers"
                subtitle={`${total} suppliers total`}
                actions={
                    canCreate && (
                        <Button icon={<Plus size={16} />} onClick={() => { setEditSupplier(null); setModalOpen(true); }}>
                            New Supplier
                        </Button>
                    )
                }
            />

            <div className="filter-bar">
                <Input
                    placeholder="Search by name or number…"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    leftIcon={<Search size={15} />}
                    wrapperClassName="w-72"
                />
            </div>

            <div className="table-wrapper">
                <table className="w-full">
                    <thead>
                        <tr className="border-b border-gray-200">
                            <th className="th">Supplier # <SortBtn col="supplierNumber" /></th>
                            <th className="th">Name <SortBtn col="name" /></th>
                            <th className="th">Mobile</th>
                            <th className="th text-center">Items Provided</th>
                            <th className="th text-right">Balance <SortBtn col="creditBalance" /></th>
                            <th className="th">Created <SortBtn col="createdAt" /></th>
                            {isAdmin && <th className="th text-right">Created By</th>}
                            <th className="th text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {loading ? (
                            <tr><td colSpan={isAdmin ? 7 : 6} className="py-16 text-center"><Spinner /></td></tr>
                        ) : suppliers.length === 0 ? (
                            <tr><td colSpan={isAdmin ? 7 : 6} className="py-16 text-center text-gray-400 text-sm">No suppliers found</td></tr>
                        ) : suppliers.map((s: ISupplier) => (
                            <tr key={s._id} className="tr-hover">
                                <td className="td font-mono text-xs text-gray-500">{s.supplierNumber}</td>
                                <td className="td font-medium text-gray-800">{s.name}</td>
                                <td className="td text-gray-500">{s.mobile || "-"}</td>
                                <td className="td text-center">
                                    <Badge label={`${s.itemsProvided?.length ?? 0} items`} variant="info" />
                                </td>
                                <td className="td text-right">
                                    <div className="flex items-center justify-end gap-2">
                                        <Badge
                                            label={formatCurrency(s.creditBalance || 0)}
                                            variant={(s.creditBalance || 0) > 0 ? "warning" : (s.creditBalance || 0) < 0 ? "danger" : "success"}
                                        />
                                        <Button variant="ghost" size="xs" icon={<PlusCircle size={14} className="text-indigo-500" />} 
                                            onClick={() => { setAdjustSupplier(s); setAdjustModalOpen(true); }} 
                                            title="Adjust Balance"
                                        />
                                        <Button variant="ghost" size="xs" icon={<Eye size={14} />} 
                                            onClick={() => handleViewHistory(s)}
                                            title="View History"
                                            loading={historyLoading && activeHistoryId === s._id}
                                        />
                                    </div>
                                </td>
                                <td className="td text-gray-400 text-xs">{formatDate(s.createdAt)}</td>
                                {isAdmin && (
                                    <td className="td text-right">
                                        <div className="flex flex-col items-end">
                                            <span className="text-[10px] font-medium text-gray-800">{s.createdBy?.name || "Admin"}</span>
                                            {s.updatedBy && s.updatedBy.name !== s.createdBy?.name && (
                                                <span className="text-[9px] text-gray-400 italic">Edit: {s.updatedBy.name}</span>
                                            )}
                                        </div>
                                    </td>
                                )}
                                <td className="td text-right">
                                    <div className="flex items-center justify-end gap-1">
                                        {canEdit && (
                                            <Button variant="ghost" size="xs" icon={<Pencil size={14} />}
                                                onClick={() => { setEditSupplier(s); setModalOpen(true); }} />
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

            <SupplierModal
                open={modalOpen}
                onClose={() => { setModalOpen(false); setEditSupplier(null); }}
                onSubmit={handleSubmit}
                supplier={editSupplier}
                loading={saving}
            />

            <BalanceAdjustmentModal
                open={adjustModalOpen}
                onClose={() => { setAdjustModalOpen(false); setAdjustSupplier(null); }}
                onSubmit={handleAdjustBalance}
                entityName={adjustSupplier?.name || ""}
                isSupplier={true}
                loading={saving}
            />

            <BalanceHistoryModal
                open={historyModalOpen}
                onClose={() => { setHistoryModalOpen(false); setHistorySupplier(null); }}
                history={historySupplier?.balanceHistory || []}
                entityName={historySupplier?.name || ""}
                currentBalance={historySupplier?.creditBalance || 0}
                isSupplier={true}
            />

            <ConfirmModal
                open={!!deleteId}
                onClose={() => setDeleteId(null)}
                onConfirm={handleDelete}
                title="Delete Supplier"
                message="Are you sure you want to delete this supplier?"
                confirmLabel="Delete"
                loading={deleting}
            />
        </div>
    );
}
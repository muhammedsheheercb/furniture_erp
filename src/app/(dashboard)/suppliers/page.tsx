"use client";
import { useEffect, useState } from "react";
import axios from "axios";
import { toast } from "sonner";
import { 
  Plus, 
  Search, 
  Package,
  Mail,
  Phone,
  Edit,
  Trash2,
  ExternalLink,
  Wallet,
  Eye,
  History,
  Truck
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import SupplierModal from "@/components/suppliers/SupplierModal";
import ConfirmModal from "@/components/ui/ConfirmModal";
import SupplierBalanceModal from "@/components/suppliers/SupplierBalanceModal";
import SupplierLedgerModal from "@/components/suppliers/SupplierLedgerModal";
import CurrencySymbol from "@/components/ui/CurrencySymbol";

export default function SuppliersPage() {
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editSupplier, setEditSupplier] = useState<any | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  
  // New balance/ledger state
  const [balanceModalOpen, setBalanceModalOpen] = useState(false);
  const [ledgerModalOpen, setLedgerModalOpen] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState<any | null>(null);
  const [balanceUpdating, setBalanceUpdating] = useState(false);

  const fetchSuppliers = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`/api/suppliers?search=${search}`);
      if (res.data.success) {
        setSuppliers(res.data.data);
      }
    } catch (err) {
      console.error("Suppliers fetch error:", err);
      toast.error("Failed to load suppliers");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSuppliers();
  }, [search]);

  const handleSubmitSupplier = async (data: any) => {
    setSaving(true);
    try {
      if (editSupplier) {
        const res = await axios.put(`/api/suppliers/${editSupplier._id}`, data);
        if (res.data.success) {
          toast.success("Supplier updated successfully");
          setModalOpen(false);
          setEditSupplier(null);
          fetchSuppliers();
        }
      } else {
        const res = await axios.post("/api/suppliers", data);
        if (res.data.success) {
          toast.success("Supplier created successfully");
          setModalOpen(false);
          fetchSuppliers();
        }
      }
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Failed to save supplier");
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (supplier: any) => {
    setEditSupplier(supplier);
    setModalOpen(true);
  };

  const handleDelete = (id: string) => {
    setDeleteId(id);
  };

  const handleConfirmDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try {
      const res = await axios.delete(`/api/suppliers/${deleteId}`);
      if (res.data.success) {
        toast.success("Supplier deleted successfully");
        setDeleteId(null);
        fetchSuppliers();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Failed to delete supplier");
    } finally {
      setDeleting(false);
    }
  };

  const handleOpenBalance = (supplier: any) => {
    setSelectedSupplier(supplier);
    setBalanceModalOpen(true);
  };

  const handleViewLedger = (supplier: any) => {
    setSelectedSupplier(supplier);
    setLedgerModalOpen(true);
  };

  const handleSubmitBalance = async (data: any) => {
    if (!selectedSupplier) return;
    setBalanceUpdating(true);
    try {
      const res = await axios.put(`/api/suppliers/${selectedSupplier._id}`, data);
      if (res.data.success) {
        toast.success("Balance updated successfully");
        setBalanceModalOpen(false);
        fetchSuppliers();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Failed to update balance");
    } finally {
      setBalanceUpdating(false);
    }
  };

  const totalPayables = suppliers.reduce((sum, s) => sum + (s.creditBalance || 0), 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-extrabold text-[#1A1210]">Suppliers</h2>
          <p className="text-[#7A6055]">Manage your supply chain and procurement history.</p>
        </div>
        <Button 
          className="bg-[#2C1810] hover:bg-[#1A0F0A] text-white"
          onClick={() => {
            setEditSupplier(null);
            setModalOpen(true);
          }}
        >
          <Truck size={18} className="mr-2" /> Add Supplier
        </Button>
      </div>

      <SupplierModal 
        open={modalOpen} 
        onClose={() => {
          setModalOpen(false);
          setEditSupplier(null);
        }} 
        onSubmit={handleSubmitSupplier}
        supplier={editSupplier}
        loading={saving}
      />

      <ConfirmModal 
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleConfirmDelete}
        title="Delete Supplier"
        message="Are you sure you want to delete this supplier? All history will be removed."
        loading={deleting}
      />

      <SupplierBalanceModal 
        open={balanceModalOpen}
        onClose={() => setBalanceModalOpen(false)}
        onSubmit={handleSubmitBalance}
        supplierName={selectedSupplier?.name || ""}
        loading={balanceUpdating}
      />

      <SupplierLedgerModal 
        open={ledgerModalOpen}
        onClose={() => setLedgerModalOpen(false)}
        supplier={selectedSupplier}
      />

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="md:col-span-3 border-[#E5DDD5]">
          <CardHeader className="p-4 border-b border-[#E5DDD5]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#A89080]" size={18} />
              <Input 
                placeholder="Search by name, phone or supplier #..." 
                className="pl-10 border-[#E5DDD5] bg-[#FAF8F6]"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="flex items-center justify-center py-20">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#C9A84C]"></div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-[#FAF8F6] border-b border-[#E5DDD5]">
                      <th className="py-4 px-6 text-xs font-bold text-[#7A6055] uppercase">Supplier</th>
                      <th className="py-4 px-6 text-xs font-bold text-[#7A6055] uppercase">Contact</th>
                      <th className="py-4 px-6 text-xs font-bold text-[#7A6055] uppercase">Items Provided</th>
                      <th className="py-4 px-6 text-xs font-bold text-[#7A6055] uppercase">Payable Balance</th>
                      <th className="py-4 px-6 text-xs font-bold text-[#7A6055] uppercase text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#F0EBE5]">
                    {suppliers.length > 0 ? suppliers.map((supplier) => (
                      <tr key={supplier._id} className="hover:bg-[#FAF8F6] transition-colors group">
                        <td className="py-4 px-6">
                          <div className="font-semibold text-[#1A1210]">{supplier.name}</div>
                          <div className="text-xs text-[#A89080]">ID: {supplier.supplierNumber}</div>
                        </td>
                        <td className="py-4 px-6">
                          <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-1.5 text-sm text-[#7A6055]">
                              <Phone size={12} /> {supplier.mobile || "N/A"}
                            </div>
                            <div className="flex items-center gap-1.5 text-sm text-[#7A6055]">
                              <Mail size={12} /> {supplier.email || "N/A"}
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-6">
                           <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-[#EDE8E0] text-[#8B5E3C] border border-[#E5DDD5]">
                             {supplier.itemsProvided?.length || 0} Products
                           </span>
                        </td>
                        <td className="py-4 px-6 text-sm font-bold text-[#1A1210]">
                           <CurrencySymbol /> {(supplier.creditBalance || 0).toLocaleString()}
                        </td>
                        <td className="py-4 px-6 text-right">
                          <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="text-rose-500"
                              title="Record Payment"
                              onClick={() => handleOpenBalance(supplier)}
                            >
                              <Wallet size={16} />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="text-[#C9A84C]"
                              title="View Ledger"
                              onClick={() => handleViewLedger(supplier)}
                            >
                              <Eye size={16} />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="text-[#7A6055]"
                              title="Edit Supplier"
                              onClick={() => handleEdit(supplier)}
                            >
                              <Edit size={16} />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="text-rose-500"
                              title="Delete Supplier"
                              onClick={() => handleDelete(supplier._id)}
                            >
                              <Trash2 size={16} />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    )) : (
                      <tr>
                        <td colSpan={5} className="py-10 text-center text-[#7A6055]">No suppliers found</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card className="border-[#E5DDD5] bg-[#1A0F0A] text-white">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium opacity-60 uppercase">Total Payables</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold"><CurrencySymbol /> {totalPayables.toLocaleString()}</div>
              <p className="text-xs text-amber-400 mt-1">
                Outstanding to {suppliers.filter(s => (s.creditBalance || 0) > 0).length} suppliers
              </p>
            </CardContent>
          </Card>
          <Card className="border-[#E5DDD5]">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-[#7A6055] uppercase">Quick Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between items-center text-sm">
                <span className="text-[#A89080]">Total Suppliers</span>
                <span className="font-bold">{suppliers.length}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
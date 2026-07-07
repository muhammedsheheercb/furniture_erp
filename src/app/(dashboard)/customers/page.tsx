"use client";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import axios from "axios";
import { toast } from "sonner";
import { 
  Plus, 
  Search, 
  UserPlus,
  Mail,
  Phone,
  Edit,
  Trash2,
  ExternalLink,
  Wallet,
  Eye,
  History,
  MapPin
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import CustomerModal from "@/components/customers/CustomerModal";
import ConfirmModal from "@/components/ui/ConfirmModal";
import CustomerBalanceModal from "@/components/customers/CustomerBalanceModal";
import CustomerLedgerModal from "@/components/customers/CustomerLedgerModal";
import CurrencySymbol from "@/components/ui/CurrencySymbol";
import Pagination from "@/components/ui/Pagination";
import { useDateFilter } from "@/context/DateFilterContext";

export default function CustomersPage() {
  const { startDate, endDate } = useDateFilter();
  const { data: session } = useSession();
  const isAdmin = session?.user?.role === "admin";
  const perms = (session?.user?.permissions as any)?.customers;
  const canCreate = isAdmin || perms?.create;
  const canEdit = isAdmin || perms?.edit;
  const canDelete = isAdmin || perms?.delete;

  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editCustomer, setEditCustomer] = useState<any | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  
  // New balance/ledger state
  const [balanceModalOpen, setBalanceModalOpen] = useState(false);
  const [ledgerModalOpen, setLedgerModalOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<any | null>(null);
  
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [serverTotalReceivables, setServerTotalReceivables] = useState(0);
  const limit = 10;

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        search,
        ...(startDate && { startDate }),
        ...(endDate && { endDate }),
        page: page.toString(),
        limit: limit.toString(),
      });
      const res = await axios.get(`/api/customers?${params}`);
      if (res.data.success) {
        setCustomers(res.data.data);
        setTotalPages(res.data.totalPages || 1);
        setTotal(res.data.total || 0);
        setServerTotalReceivables(res.data.totalReceivables || 0);
      }
    } catch (err) {
      console.error("Customers fetch error:", err);
      toast.error("Failed to load customers");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { setPage(1); }, [search, startDate, endDate]);
  useEffect(() => { fetchCustomers(); }, [search, startDate, endDate, page]);

  const handleSubmitCustomer = async (data: any) => {
    setSaving(true);
    try {
      if (editCustomer) {
        const res = await axios.put(`/api/customers/${editCustomer._id}`, data);
        if (res.data.success) {
          toast.success("Customer updated successfully");
          setModalOpen(false);
          setEditCustomer(null);
          fetchCustomers();
        }
      } else {
        const res = await axios.post("/api/customers", data);
        if (res.data.success) {
          toast.success("Customer created successfully");
          setModalOpen(false);
          fetchCustomers();
        }
      }
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Failed to save customer");
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (customer: any) => {
    setEditCustomer(customer);
    setModalOpen(true);
  };

  const handleDelete = (id: string) => {
    setDeleteId(id);
  };

  const handleConfirmDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try {
      const res = await axios.delete(`/api/customers/${deleteId}`);
      if (res.data.success) {
        toast.success("Customer deleted successfully");
        setDeleteId(null);
        fetchCustomers();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Failed to delete customer");
    } finally {
      setDeleting(false);
    }
  };

  const handleOpenBalance = (customer: any) => {
    setSelectedCustomer(customer);
    setBalanceModalOpen(true);
  };

  const handleViewLedger = (customer: any) => {
    setSelectedCustomer(customer);
    setLedgerModalOpen(true);
  };

  const handleBalanceSuccess = () => {
    setBalanceModalOpen(false);
    fetchCustomers();
  };

  const totalReceivables = serverTotalReceivables;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-extrabold text-[#1A1210]">Customers</h2>
          <p className="text-[#7A6055]">Manage your customer relationships and credit history.</p>
        </div>
        {canCreate && (
          <Button 
            className="bg-[#2C1810] hover:bg-[#1A0F0A] text-white"
            onClick={() => {
              setEditCustomer(null);
              setModalOpen(true);
            }}
          >
            <UserPlus size={18} className="mr-2" /> Add Customer
          </Button>
        )}
      </div>

      <CustomerModal 
        open={modalOpen} 
        onClose={() => {
          setModalOpen(false);
          setEditCustomer(null);
        }} 
        onSubmit={handleSubmitCustomer}
        customer={editCustomer}
        loading={saving}
      />

      <ConfirmModal 
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleConfirmDelete}
        title="Delete Customer"
        message="Are you sure you want to delete this customer? This action cannot be undone and will remove all history."
        loading={deleting}
      />

      <CustomerBalanceModal
        open={balanceModalOpen}
        onClose={() => setBalanceModalOpen(false)}
        onSuccess={handleBalanceSuccess}
        customerName={selectedCustomer?.name || ""}
        customer={selectedCustomer}
      />

      <CustomerLedgerModal 
        open={ledgerModalOpen}
        onClose={() => setLedgerModalOpen(false)}
        customer={selectedCustomer}
      />

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="md:col-span-3 border-[#E5DDD5]">
          <CardHeader className="p-4 border-b border-[#E5DDD5]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#A89080]" size={18} />
              <Input 
                placeholder="Search by name, phone or email..." 
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
                      <th className="py-4 px-6 text-xs font-bold text-[#7A6055] uppercase">Customer</th>
                      <th className="py-4 px-6 text-xs font-bold text-[#7A6055] uppercase">Contact</th>
                      <th className="py-4 px-6 text-xs font-bold text-[#7A6055] uppercase">Type</th>
                      <th className="py-4 px-6 text-xs font-bold text-[#7A6055] uppercase">Outstanding</th>
                      <th className="py-4 px-6 text-xs font-bold text-[#7A6055] uppercase text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#F0EBE5]">
                    {customers.length > 0 ? customers.map((customer) => (
                      <tr key={customer._id} className="hover:bg-[#FAF8F6] transition-colors group">
                        <td className="py-4 px-6">
                          <div className="font-semibold text-[#1A1210]">{customer.name}</div>
                          <div className="text-xs text-[#A89080]">ID: {customer.customerNumber || `CUST-${customer._id.slice(-4)}`}</div>
                        </td>
                        <td className="py-4 px-6">
                          <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-1.5 text-sm text-[#7A6055]">
                              <Phone size={12} /> {customer.mobile || customer.phone || "N/A"}
                            </div>
                            {customer.address && (
                              <div className="flex items-start gap-1.5 text-sm text-[#7A6055] mt-0.5">
                                <MapPin size={12} className="mt-1 shrink-0" /> 
                                <span className="line-clamp-2">{customer.address}</span>
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-[#EDE8E0] text-[#8B5E3C] border border-[#E5DDD5]">
                            {customer.customerType || customer.type || "retail"}
                          </span>
                        </td>
                        <td className="py-4 px-6">
                          <span className={`text-sm font-bold ${(customer.creditBalance || 0) > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                            <CurrencySymbol /> {(customer.creditBalance || 0).toLocaleString()}
                          </span>
                        </td>
                        <td className="py-4 px-6 text-right">
                          <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            {canEdit && (
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="text-emerald-600"
                                title="Receive Payment"
                                onClick={() => handleOpenBalance(customer)}
                              >
                                <Wallet size={16} />
                              </Button>
                            )}
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="text-[#C9A84C]"
                              title="View Ledger"
                              onClick={() => handleViewLedger(customer)}
                            >
                              <Eye size={16} />
                            </Button>
                            {canEdit && (
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="text-[#7A6055]"
                                title="Edit Profile"
                                onClick={() => handleEdit(customer)}
                              >
                                <Edit size={16} />
                              </Button>
                            )}
                            {canDelete && (
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="text-rose-500"
                                title="Delete Customer"
                                onClick={() => handleDelete(customer._id)}
                              >
                                <Trash2 size={16} />
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    )) : (
                      <tr>
                        <td colSpan={5} className="py-10 text-center text-[#7A6055]">No customers found</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
            
            {!loading && totalPages > 1 && (
              <div className="border-t border-[#E5DDD5]">
                <Pagination page={page} totalPages={totalPages} total={total} limit={limit} onPageChange={setPage} />
              </div>
            )}
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card className="border-[#E5DDD5] bg-[#1A0F0A] text-white">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium opacity-60 uppercase">Total Receivables</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold"><CurrencySymbol /> {totalReceivables.toLocaleString()}</div>
              <p className="text-xs text-rose-400 mt-1">
                {customers.filter(c => (c.creditBalance || 0) > 0).length} customers with balance
              </p>
            </CardContent>
          </Card>
          <Card className="border-[#E5DDD5]">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-[#7A6055] uppercase">Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between items-center text-sm">
                <span className="text-[#A89080]">Total Customers</span>
                <span className="font-bold">{customers.length}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
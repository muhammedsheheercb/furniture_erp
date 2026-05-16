"use client";
import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import axios from "axios";
import { toast } from "sonner";
import { 
  Receipt, 
  Plus, 
  Search, 
  Calendar as CalendarIcon,
  TrendingDown,
  TrendingUp,
  Filter,
  Pencil,
  Trash2,
  ChevronLeft,
  ChevronRight,
  MoreVertical,
  Download
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { format } from "date-fns";
import CurrencySymbol from "@/components/ui/CurrencySymbol";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import ExpenseModal from "@/components/expenses/ExpenseModal";
import ConfirmModal from "@/components/ui/ConfirmModal";
import { Badge } from "@/components/ui/Badge";
import Spinner from "@/components/ui/Spinner";

export default function ExpensesPage() {
  const { data: session } = useSession();
  const isAdmin = session?.user?.role === "admin";
  const perms = (session?.user?.permissions as any)?.expenses;
  const canCreate = isAdmin || perms?.create;
  const canEdit = isAdmin || perms?.edit;
  const canDelete = isAdmin || perms?.delete;

  const [expenses, setExpenses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalAmount, setTotalAmount] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  
  // Modal states
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState<any | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [expenseToDelete, setExpenseToDelete] = useState<any | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchExpenses = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: "10",
        search,
        ...(category && { category }),
      });
      const res = await axios.get(`/api/expenses?${params}`);
      if (res.data.success) {
        setExpenses(res.data.data);
        setTotalAmount(res.data.totalAmount);
        setTotalPages(res.data.totalPages);
      }
    } catch (err) {
      toast.error("Failed to load expenses");
    } finally {
      setLoading(false);
    }
  }, [page, search, category]);

  useEffect(() => {
    fetchExpenses();
  }, [fetchExpenses]);

  const handleCreateOrUpdate = async (data: any) => {
    setSubmitting(true);
    try {
      if (selectedExpense) {
        const res = await axios.put(`/api/expenses/${selectedExpense._id}`, data);
        if (res.data.success) {
          toast.success("Expense updated successfully");
          setModalOpen(false);
          fetchExpenses();
        }
      } else {
        const res = await axios.post("/api/expenses", data);
        if (res.data.success) {
          toast.success("Expense recorded successfully");
          setModalOpen(false);
          fetchExpenses();
        }
      }
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Failed to save expense");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!expenseToDelete) return;
    setDeleting(true);
    try {
      const res = await axios.delete(`/api/expenses/${expenseToDelete._id}`);
      if (res.data.success) {
        toast.success("Expense deleted");
        setConfirmOpen(false);
        fetchExpenses();
      }
    } catch (err) {
      toast.error("Failed to delete expense");
    } finally {
      setDeleting(false);
      setExpenseToDelete(null);
    }
  };

  const openEditModal = (expense: any) => {
    setSelectedExpense(expense);
    setModalOpen(true);
  };

  const openDeleteConfirm = (expense: any) => {
    setExpenseToDelete(expense);
    setConfirmOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-extrabold text-[#1A1210]">Expense Tracking</h2>
          <p className="text-[#7A6055]">Monitor operational costs and overheads.</p>
        </div>
        {canCreate && (
          <Button 
            onClick={() => { setSelectedExpense(null); setModalOpen(true); }}
            className="bg-[#2C1810] hover:bg-[#1A0F0A] text-white shadow-lg shadow-[#2C1810]/20"
          >
            <Plus size={18} className="mr-2" /> Record Expense
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="border-[#E5DDD5] bg-gradient-to-br from-white to-[#FAF8F6] overflow-hidden relative">
          <div className="absolute top-0 right-0 p-4 opacity-5">
            <Receipt size={80} />
          </div>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold text-[#7A6055] uppercase tracking-wider">Total Expenses (Current View)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-black text-rose-600 drop-shadow-sm">
              <CurrencySymbol /> {totalAmount.toLocaleString()}
            </div>
            <p className="text-xs text-[#A89080] mt-2 flex items-center gap-1 font-medium">
              <TrendingDown size={14} className="text-emerald-500" /> Operational efficiency monitor
            </p>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2 border-[#E5DDD5] shadow-sm overflow-hidden">
          <CardHeader className="p-4 border-b border-[#E5DDD5] bg-white flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="relative flex-1 w-full max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#A89080]" size={18} />
              <Input 
                placeholder="Search by title, number, category..." 
                className="pl-10 border-[#E5DDD5] bg-[#FAF8F6] focus:ring-[#C9A84C]"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-2 w-full md:w-auto">
              <select
                className="h-10 px-3 rounded-md border border-[#E5DDD5] bg-[#FAF8F6] text-sm text-[#1A1210] outline-none focus:ring-2 focus:ring-[#C9A84C]/20 transition-all"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                <option value="">All Categories</option>
                <option value="Labor">Labor</option>
                <option value="Electricity">Electricity</option>
                <option value="Transport">Transport</option>
                <option value="Rent">Rent</option>
                <option value="Marketing">Marketing</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#FAF8F6] border-b border-[#E5DDD5]">
                    <th className="py-4 px-6 text-[11px] font-bold text-[#7A6055] uppercase tracking-wider">Expense #</th>
                    <th className="py-4 px-6 text-[11px] font-bold text-[#7A6055] uppercase tracking-wider">Date</th>
                    <th className="py-4 px-6 text-[11px] font-bold text-[#7A6055] uppercase tracking-wider">Title / Category</th>
                    <th className="py-4 px-6 text-[11px] font-bold text-[#7A6055] uppercase tracking-wider text-right">Amount</th>
                    <th className="py-4 px-6 text-[11px] font-bold text-[#7A6055] uppercase tracking-wider text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F0EBE5]">
                  {loading ? (
                    <tr>
                      <td colSpan={5} className="py-20 text-center">
                        <Spinner />
                      </td>
                    </tr>
                  ) : expenses.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-20 text-center text-[#A89080] italic">
                        No expenses found for the current selection.
                      </td>
                    </tr>
                  ) : (
                    expenses.map((exp) => (
                      <tr key={exp._id} className="group hover:bg-[#FAF8F6] transition-colors">
                        <td className="py-4 px-6">
                          <span className="font-mono text-xs text-[#8B5E3C] font-bold">{exp.expenseNumber}</span>
                        </td>
                        <td className="py-4 px-6 text-sm text-[#1A1210]">
                          {format(new Date(exp.date), "dd MMM yyyy")}
                        </td>
                        <td className="py-4 px-6">
                          <div className="text-sm font-bold text-[#1A1210]">{exp.title}</div>
                          <div className="text-[10px] uppercase font-black text-[#C9A84C] mt-0.5">{exp.category}</div>
                        </td>
                        <td className="py-4 px-6 text-right">
                          <div className="text-sm font-black text-rose-600">
                            <CurrencySymbol className="w-3 h-3 inline mr-0.5" />
                            {exp.amount.toLocaleString()}
                          </div>
                          <div className="text-[10px] text-[#A89080] capitalize">{exp.paymentType}</div>
                        </td>
                        <td className="py-4 px-6">
                          <div className="flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            {canEdit && (
                              <button 
                                onClick={() => openEditModal(exp)}
                                className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-100 transition-colors"
                                title="Edit"
                              >
                                <Pencil size={14} />
                              </button>
                            )}
                            {canDelete && (
                              <button 
                                onClick={() => openDeleteConfirm(exp)}
                                className="p-1.5 rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-100 transition-colors"
                                title="Delete"
                              >
                                <Trash2 size={14} />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            
            {/* Pagination */}
            {totalPages > 1 && (
              <div className="p-4 border-t border-[#E5DDD5] flex items-center justify-between bg-white">
                <p className="text-xs text-[#A89080]">
                  Page <span className="font-bold text-[#1A1210]">{page}</span> of {totalPages}
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page === 1}
                    onClick={() => setPage(p => p - 1)}
                    className="border-[#E5DDD5] h-8 px-2"
                  >
                    <ChevronLeft size={16} />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page === totalPages}
                    onClick={() => setPage(p => p + 1)}
                    className="border-[#E5DDD5] h-8 px-2"
                  >
                    <ChevronRight size={16} />
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Modals */}
      <ExpenseModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmit={handleCreateOrUpdate}
        expense={selectedExpense}
        loading={submitting}
      />

      <ConfirmModal
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={handleDelete}
        title="Delete Expense"
        message={`Are you sure you want to delete this expense? This action cannot be undone.`}
        confirmLabel="Delete"
        loading={deleting}
      />
    </div>
  );
}

"use client";
import { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "sonner";
import { 
  Receipt, 
  Printer, 
  Search,
  CheckCircle2,
  Download,
  Wallet
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/Input";
import { formatDate, formatCurrency } from "@/lib/utils";
import CurrencySymbol from "@/components/ui/CurrencySymbol";
import UpdateBalanceModal from "@/components/sales/UpdateBalanceModal";
import { useDateFilter } from "@/context/DateFilterContext";

export default function InvoicesPage() {
  const { startDate, endDate } = useDateFilter();
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [balanceSale, setBalanceSale] = useState<any | null>(null);
  const [balanceModalOpen, setBalanceModalOpen] = useState(false);

  const fetchInvoices = async () => {
    setLoading(true);
    try {
      // Invoices are delivered sales
      const params = new URLSearchParams({
        status: "invoiced",
        search,
        ...(startDate && { startDate }),
        ...(endDate && { endDate }),
      });
      const res = await axios.get(`/api/sales?${params}`);
      if (res.data.success) {
        setInvoices(res.data.data);
      }
    } catch (err) {
      toast.error("Failed to load invoices");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, [search, startDate, endDate]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-extrabold text-[#1A1210]">Invoices</h2>
          <p className="text-[#7A6055]">View and print invoices for delivered furniture.</p>
        </div>
      </div>

      <UpdateBalanceModal 
        open={balanceModalOpen}
        onClose={() => {
            setBalanceModalOpen(false);
            setBalanceSale(null);
        }}
        onSuccess={() => fetchInvoices()}
        sale={balanceSale}
      />

      <Card className="border-[#E5DDD5]">
        <CardHeader className="p-4 border-b border-[#E5DDD5]">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#A89080]" size={18} />
            <Input 
              placeholder="Search invoices..." 
              className="pl-10 border-[#E5DDD5] bg-[#FAF8F6]"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="py-20 text-center text-[#7A6055]">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#C9A84C] mx-auto mb-4"></div>
              Loading invoices...
            </div>
          ) : invoices.length === 0 ? (
            <div className="py-20 text-center text-[#7A6055]">
              <Receipt size={48} className="mx-auto mb-4 opacity-20" />
              <p>No delivered orders found to invoice.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#FAF8F6] border-b border-[#E5DDD5]">
                    <th className="py-4 px-6 text-xs font-bold text-[#7A6055] uppercase">Invoice #</th>
                    <th className="py-4 px-6 text-xs font-bold text-[#7A6055] uppercase">Customer</th>
                    <th className="py-4 px-6 text-xs font-bold text-[#7A6055] uppercase text-right">Total</th>
                    <th className="py-4 px-6 text-xs font-bold text-[#7A6055] uppercase text-right">Balance</th>
                    <th className="py-4 px-6 text-xs font-bold text-[#7A6055] uppercase text-center">Payment Status</th>
                    <th className="py-4 px-6 text-xs font-bold text-[#7A6055] uppercase text-center">Order Status</th>
                    <th className="py-4 px-6 text-xs font-bold text-[#7A6055] uppercase text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F0EBE5]">
                  {invoices.map((inv) => (
                    <tr key={inv._id} className="hover:bg-[#FAF8F6] transition-colors group">
                      <td className="py-4 px-6 font-mono text-sm text-[#1A1210]">{inv.saleNumber}</td>
                      <td className="py-4 px-6">
                        <div className="text-sm font-semibold text-[#1A1210]">{inv.customerName}</div>
                        <div className="text-[10px] text-[#A89080]">{formatDate(inv.date)}</div>
                      </td>
                      <td className="py-4 px-6 text-sm font-bold text-[#1A1210] text-right">
                        <CurrencySymbol /> {inv.total.toLocaleString()}
                      </td>
                      <td className="py-4 px-6 text-sm text-rose-600 font-semibold text-right">
                        <CurrencySymbol /> {(inv.total - (inv.advancePaid || 0)).toLocaleString()}
                      </td>
                      <td className="py-4 px-6 text-center">
                        {(() => {
                          const balance = inv.total - (inv.advancePaid || 0);
                          if (balance <= 0) {
                            return (
                              <Badge className="bg-emerald-50 text-emerald-600 border-emerald-100 text-[10px] uppercase font-bold">
                                Order Close
                              </Badge>
                            );
                          }
                          return (
                            <Badge className="bg-amber-50 text-amber-600 border-amber-100 text-[10px] uppercase font-bold">
                              Balance Amount Pending
                            </Badge>
                          );
                        })()}
                      </td>
                      <td className="py-4 px-6 text-center">
                        {(() => {
                          if (inv.deliveryStatus === "delivered" || inv.status === "invoiced") {
                            return <Badge className="bg-emerald-50 text-emerald-600 border-emerald-100 text-[10px] uppercase font-bold">Delivered</Badge>;
                          }

                          if (inv.productionStatus === "finished" || inv.status === "delivered") {
                            return <Badge className="bg-blue-50 text-blue-600 border-blue-100 text-[10px] uppercase font-bold">Delivery Pending</Badge>;
                          }

                          if (inv.productionStatus === "processing") {
                            return <Badge className="bg-amber-50 text-amber-600 border-amber-100 text-[10px] uppercase font-bold">Production Pending</Badge>;
                          }

                          return <Badge className="bg-gray-50 text-gray-600 border-gray-100 text-[10px] uppercase font-bold">Waiting for Production</Badge>;
                        })()}
                      </td>
                      <td className="py-4 px-6 text-right">
                        <div className="flex justify-end gap-2">
                          {(inv.total - (inv.advancePaid || 0)) > 0 && (
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="text-[#C9A84C]"
                              title="Update Balance"
                              onClick={() => {
                                setBalanceSale(inv);
                                setBalanceModalOpen(true);
                              }}
                            >
                              <Wallet size={16} />
                            </Button>
                          )}
                          <Button variant="outline" size="sm" className="border-[#E5DDD5] text-[#7A6055]">
                            <Printer size={14} className="mr-1" /> Print
                          </Button>
                          <Button variant="outline" size="sm" className="border-[#E5DDD5] text-[#7A6055]">
                            <Download size={14} className="mr-1" /> PDF
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

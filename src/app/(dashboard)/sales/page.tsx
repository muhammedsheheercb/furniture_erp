"use client";
import { 
  Plus, 
  Search, 
  FileText, 
  ClipboardList, 
  CheckCircle2,
  Clock,
  Printer,
  ChevronRight,
  MoreHorizontal,
  Trash2,
  Wallet
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import { useEffect, useState } from "react";
import axios from "axios";
import { toast } from "sonner";
import { format } from "date-fns";

import SaleModal from "@/components/sales/SaleModal";
import UpdateBalanceModal from "@/components/sales/UpdateBalanceModal";
import ConfirmModal from "@/components/ui/ConfirmModal";
import CurrencySymbol from "@/components/ui/CurrencySymbol";

import { generateInvoicePDF } from "@/lib/pdf-utils";

export default function SalesPage() {
  const [activeTab, setActiveTab] = useState("convert");
  const [sales, setSales] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editSale, setEditSale] = useState<any | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [balanceSale, setBalanceSale] = useState<any | null>(null);
  const [balanceModalOpen, setBalanceModalOpen] = useState(false);

  const [quotations, setQuotations] = useState<any[]>([]);
  const [loadingQuotes, setLoadingQuotes] = useState(false);

  const fetchSales = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`/api/sales?search=${search}`);
      if (res.data.success) {
        setSales(res.data.data);
      }
    } catch (err) {
      console.error("Sales fetch error:", err);
      toast.error("Failed to load sales");
    } finally {
      setLoading(false);
    }
  };

  const fetchQuotes = async () => {
    setLoadingQuotes(true);
    try {
      const res = await axios.get(`/api/quotations?search=${search}&status=sale&converted=false`);
      if (res.data.success) {
        setQuotations(res.data.data);
      }
    } catch (err) {
      console.error("Quotes fetch error:", err);
    } finally {
      setLoadingQuotes(false);
    }
  };

  useEffect(() => {
    fetchSales();
    fetchQuotes();
  }, [search]);

  const handleSubmitSale = async (data: any) => {
    setSaving(true);
    try {
      if (editSale?._id) {
        const res = await axios.put(`/api/sales/${editSale._id}`, data);
        if (res.data.success) {
          toast.success("Order updated successfully");
          
          // Generate PDF on update
          const saleData = res.data.data;
          generateInvoicePDF({
            number: saleData.saleNumber,
            customerOrSupplier: saleData.customerName,
            customerOrSupplierNumber: saleData.customerNumber,
            date: saleData.date,
            paymentType: saleData.paymentType,
            items: saleData.items,
            subtotal: saleData.subtotal,
            tax: saleData.tax,
            total: saleData.total,
            type: "Sale",
            isTaxInvoice: saleData.isTaxInvoice,
            advancePaid: saleData.advancePaid,
            customerMobile: saleData.customerMobile,
            customerAddress: saleData.customerAddress,
            deliveryAddress: saleData.deliveryAddress,
            deliveryDate: saleData.deliveryDate
          });

          setModalOpen(false);
          setEditSale(null);
          fetchSales();
        }
      } else {
        const res = await axios.post("/api/sales", { ...data, quotationId: editSale?.quotationId });
        if (res.data.success) {
          toast.success("Order created successfully");

          // Generate PDF on create
          const saleData = res.data.data;
          generateInvoicePDF({
            number: saleData.saleNumber,
            customerOrSupplier: saleData.customerName,
            customerOrSupplierNumber: saleData.customerNumber,
            date: saleData.date,
            paymentType: saleData.paymentType,
            items: saleData.items,
            subtotal: saleData.subtotal,
            tax: saleData.tax,
            total: saleData.total,
            type: "Sale",
            isTaxInvoice: saleData.isTaxInvoice, 
            advancePaid: saleData.advancePaid,
            customerMobile: saleData.customerMobile,
            customerAddress: saleData.customerAddress,
            deliveryAddress: saleData.deliveryAddress,
            deliveryDate: saleData.deliveryDate
          });

          setModalOpen(false);
          setEditSale(null);
          fetchSales();
          fetchQuotes();
        }
      }
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Failed to save order");
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (sale: any) => {
    // Edit removed as per user request
  };

  const handleDelete = (id: string) => {
    setDeleteId(id);
  };

  const handleConfirmDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try {
      const res = await axios.delete(`/api/sales/${deleteId}`);
      if (res.data.success) {
        toast.success("Order deleted successfully");
        setDeleteId(null);
        fetchSales();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Failed to delete order");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-extrabold text-[#1A1210]">Sales Module</h2>
          <p className="text-[#7A6055]">Manage quotations, sales orders and invoices.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="border-[#E5DDD5] text-[#7A6055]">
            <Printer size={18} className="mr-2" /> Print Reports
          </Button>
        </div>
      </div>

      <SaleModal 
        open={modalOpen}
        onClose={() => {
            setModalOpen(false);
            setEditSale(null);
        }}
        onSubmit={handleSubmitSale}
        sale={editSale}
        loading={saving}
      />

      <ConfirmModal 
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleConfirmDelete}
        title="Delete Sale Order"
        message="Are you sure you want to delete this order? This will also revert the stock quantities."
        loading={deleting}
      />

      <UpdateBalanceModal 
        open={balanceModalOpen}
        onClose={() => {
            setBalanceModalOpen(false);
            setBalanceSale(null);
        }}
        onSuccess={() => fetchSales()}
        sale={balanceSale}
      />

      <Tabs defaultValue="convert" className="w-full" onValueChange={setActiveTab}>
        <TabsList className="bg-[#FAF8F6] border border-[#E5DDD5] p-1 h-12">
          <TabsTrigger value="convert" className="data-[state=active]:bg-white data-[state=active]:text-[#C9A84C] data-[state=active]:shadow-sm px-6">
            Ready to Convert
          </TabsTrigger>
          <TabsTrigger value="orders" className="data-[state=active]:bg-white data-[state=active]:text-[#C9A84C] data-[state=active]:shadow-sm px-6">
            Active Sales Orders
          </TabsTrigger>
          <TabsTrigger value="invoices" className="data-[state=active]:bg-white data-[state=active]:text-[#C9A84C] data-[state=active]:shadow-sm px-6">
            Invoices
          </TabsTrigger>
        </TabsList>

        <Card className="mt-6 border-[#E5DDD5]">
          <CardHeader className="p-4 border-b border-[#E5DDD5]">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#A89080]" size={18} />
                <Input 
                  placeholder={`Search ${activeTab}...`} 
                  className="pl-10 border-[#E5DDD5] bg-[#FAF8F6]"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="flex items-center justify-center py-20">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#C9A84C]"></div>
              </div>
            ) : (
              <>

                <TabsContent value="convert" className="m-0">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-[#FAF8F6] border-b border-[#E5DDD5]">
                          <th className="py-4 px-6 text-xs font-bold text-[#7A6055] uppercase">Quote #</th>
                          <th className="py-4 px-6 text-xs font-bold text-[#7A6055] uppercase">Customer</th>
                          <th className="py-4 px-6 text-xs font-bold text-[#7A6055] uppercase">Total</th>
                          <th className="py-4 px-6 text-xs font-bold text-[#7A6055] uppercase text-center">Status</th>
                          <th className="py-4 px-6 text-xs font-bold text-[#7A6055] uppercase text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#F0EBE5]">
                        {quotations.length === 0 ? (
                          <tr>
                            <td colSpan={5} className="py-10 text-center text-[#7A6055]">No quotations ready for conversion</td>
                          </tr>
                        ) : (
                          quotations.map((q) => (
                            <tr key={q._id} className="hover:bg-[#FAF8F6] transition-colors group">
                              <td className="py-4 px-6 font-mono text-sm text-[#1A1210]">{q.quotationNumber}</td>
                              <td className="py-4 px-6">
                                <div className="text-sm font-semibold text-[#1A1210]">{q.customerName}</div>
                                <div className="text-[10px] text-[#A89080]">{format(new Date(q.date), "dd MMM yyyy")}</div>
                              </td>
                              <td className="py-4 px-6 text-sm font-bold text-[#1A1210]"><CurrencySymbol /> {q.total.toLocaleString()}</td>
                              <td className="py-4 px-6 text-center">
                                <Badge className="bg-indigo-50 text-indigo-600 border-indigo-100 text-[10px] uppercase">Quotation</Badge>
                              </td>
                              <td className="py-4 px-6 text-right">
                                <Button 
                                  size="sm" 
                                  className="h-8 bg-[#2C1810] hover:bg-[#1A0F0A] text-white px-3 text-xs"
                                  onClick={() => {
                                    setEditSale({
                                      customerId: q.customerId?._id || q.customerId,
                                      customerName: q.customerName,
                                      customerNumber: q.customerId?.customerNumber || "",
                                      customerMobile: q.customerMobile || "",
                                      customerAddress: q.customerAddress || "",
                                      items: q.items.map((it: any) => ({
                                        itemId: it.itemId,
                                        itemNumber: it.itemNumber,
                                        itemName: it.itemName,
                                        quantity: it.quantity,
                                        price: it.price,
                                        color: it.color,
                                        material: it.material,
                                        size: it.size,
                                        total: it.total
                                      })),
                                      total: q.total,
                                      quotationId: q._id,
                                      isConversion: true
                                    });
                                    setModalOpen(true);
                                  }}
                                >
                                  Convert to Sale
                                </Button>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </TabsContent>

                <TabsContent value="orders" className="m-0">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-[#FAF8F6] border-b border-[#E5DDD5]">
                          <th className="py-4 px-6 text-xs font-bold text-[#7A6055] uppercase">Order #</th>
                          <th className="py-4 px-6 text-xs font-bold text-[#7A6055] uppercase">Customer</th>
                          <th className="py-4 px-6 text-xs font-bold text-[#7A6055] uppercase">Total</th>
                          <th className="py-4 px-6 text-xs font-bold text-[#7A6055] uppercase">Advance</th>
                          <th className="py-4 px-6 text-xs font-bold text-[#7A6055] uppercase">Balance</th>
                          <th className="py-4 px-6 text-xs font-bold text-[#7A6055] uppercase text-center">Payment Status</th>
                          <th className="py-4 px-6 text-xs font-bold text-[#7A6055] uppercase text-center">Order Status</th>
                          <th className="py-4 px-6 text-xs font-bold text-[#7A6055] uppercase text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#F0EBE5]">
                        {(() => {
                          const activeOrders = sales.filter(item => {
                            const balance = item.total - (item.advancePaid || 0);
                            const isDelivered = item.deliveryStatus === "delivered" || item.status === "invoiced";
                            // Show in Active if has balance OR not delivered
                            return balance > 0 || !isDelivered;
                          }).sort((a, b) => new Date(b.date || b.createdAt).getTime() - new Date(a.date || a.createdAt).getTime());

                          if (activeOrders.length === 0) {
                            return (
                              <tr>
                                <td colSpan={8} className="py-10 text-center text-[#7A6055]">No active sales orders found</td>
                              </tr>
                            );
                          }

                          return activeOrders.map((item) => (
                            <tr key={item._id} className="hover:bg-[#FAF8F6] transition-colors group">
                              <td className="py-4 px-6 font-mono text-sm text-[#1A1210]">{item.saleNumber}</td>
                              <td className="py-4 px-6">
                                <div className="text-sm font-semibold text-[#1A1210]">{item.customerName}</div>
                                <div className="text-[10px] text-[#A89080]">{format(new Date(item.date || item.createdAt), "dd MMM yyyy")}</div>
                              </td>
                              <td className="py-4 px-6 text-sm font-bold text-[#1A1210]"><CurrencySymbol /> {item.total.toLocaleString()}</td>
                              <td className="py-4 px-6 text-sm text-[#8B5E3C]"><CurrencySymbol /> {(item.advancePaid || 0).toLocaleString()}</td>
                              <td className="py-4 px-6 text-sm text-rose-600 font-semibold">
                                <CurrencySymbol /> {(item.total - (item.advancePaid || 0)).toLocaleString()}
                              </td>
                              <td className="py-4 px-6 text-center">
                                {(() => {
                                  const balance = item.total - (item.advancePaid || 0);
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
                                  if (item.deliveryStatus === "delivered" || item.status === "invoiced") {
                                    return <Badge className="bg-emerald-50 text-emerald-600 border-emerald-100 text-[10px] uppercase font-bold">Delivered</Badge>;
                                  }

                                  if (item.productionStatus === "finished" || item.status === "delivered") {
                                    return <Badge className="bg-blue-50 text-blue-600 border-blue-100 text-[10px] uppercase font-bold">Delivery Pending</Badge>;
                                  }

                                  if (item.productionStatus === "processing") {
                                    return <Badge className="bg-amber-50 text-amber-600 border-amber-100 text-[10px] uppercase font-bold">Production Pending</Badge>;
                                  }

                                  return <Badge className="bg-gray-50 text-gray-600 border-gray-100 text-[10px] uppercase font-bold">Waiting for Production</Badge>;
                                })()}
                              </td>
                              <td className="py-4 px-6 text-right">
                                <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                  {(item.total - (item.advancePaid || 0)) > 0 && (
                                    <Button 
                                      variant="ghost" 
                                      size="icon" 
                                      className="text-[#C9A84C]"
                                      title="Update Balance"
                                      onClick={() => {
                                        setBalanceSale(item);
                                        setBalanceModalOpen(true);
                                      }}
                                    >
                                      <Wallet size={16} />
                                    </Button>
                                  )}
                                  {item.status !== "delivered" && item.status !== "invoiced" && (
                                    <Button 
                                      variant="ghost" 
                                      size="icon" 
                                      className="text-rose-500"
                                      onClick={() => handleDelete(item._id)}
                                    >
                                      <Trash2 size={16} />
                                    </Button>
                                  )}
                                </div>
                              </td>
                            </tr>
                          ));
                        })()}
                      </tbody>
                    </table>
                  </div>
                </TabsContent>
                <TabsContent value="invoices" className="m-0">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-[#FAF8F6] border-b border-[#E5DDD5]">
                          <th className="py-4 px-6 text-xs font-bold text-[#7A6055] uppercase">Invoice #</th>
                          <th className="py-4 px-6 text-xs font-bold text-[#7A6055] uppercase">Customer</th>
                          <th className="py-4 px-6 text-xs font-bold text-[#7A6055] uppercase">Total</th>
                          <th className="py-4 px-6 text-xs font-bold text-[#7A6055] uppercase text-center">Status</th>
                          <th className="py-4 px-6 text-xs font-bold text-[#7A6055] uppercase text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#F0EBE5]">
                        {(() => {
                          const completedOrders = sales.filter(item => {
                            const balance = item.total - (item.advancePaid || 0);
                            const isDelivered = item.deliveryStatus === "delivered" || item.status === "invoiced";
                            return balance <= 0 && isDelivered;
                          }).sort((a, b) => new Date(b.date || b.createdAt).getTime() - new Date(a.date || a.createdAt).getTime());

                          if (completedOrders.length === 0) {
                            return (
                              <tr>
                                <td colSpan={5} className="py-10 text-center text-[#7A6055]">No completed invoices found</td>
                              </tr>
                            );
                          }

                          return completedOrders.map((item) => (
                            <tr key={item._id} className="hover:bg-[#FAF8F6] transition-colors group">
                              <td className="py-4 px-6 font-mono text-sm text-[#1A1210]">{item.saleNumber}</td>
                              <td className="py-4 px-6">
                                <div className="text-sm font-semibold text-[#1A1210]">{item.customerName}</div>
                                <div className="text-[10px] text-[#A89080]">{format(new Date(item.date || item.createdAt), "dd MMM yyyy")}</div>
                              </td>
                              <td className="py-4 px-6 text-sm font-bold text-[#1A1210]"><CurrencySymbol /> {item.total.toLocaleString()}</td>
                              <td className="py-4 px-6 text-center">
                                <Badge className="bg-emerald-50 text-emerald-600 border-emerald-100 text-[10px] uppercase font-bold">
                                  Order Close & Delivered
                                </Badge>
                              </td>
                              <td className="py-4 px-6 text-right">
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  className="text-[#7A6055]"
                                  onClick={() => {
                                    generateInvoicePDF({
                                      number: item.saleNumber,
                                      customerOrSupplier: item.customerName,
                                      customerOrSupplierNumber: item.customerNumber,
                                      date: item.date,
                                      paymentType: item.paymentType,
                                      items: item.items,
                                      subtotal: item.subtotal,
                                      tax: item.tax,
                                      total: item.total,
                                      type: "Sale",
                                      isTaxInvoice: item.isTaxInvoice,
                                      advancePaid: item.advancePaid
                                    });
                                  }}
                                >
                                  <Printer size={16} />
                                </Button>
                              </td>
                            </tr>
                          ));
                        })()}
                      </tbody>
                    </table>
                  </div>
                </TabsContent>
              </>
            )}
          </CardContent>
        </Card>
      </Tabs>
    </div>
  );
}


function TablePlaceholder({ type }: { type: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-[#A89080]">
      <ClipboardList size={48} className="mb-4 opacity-20" />
      <p>No {type}s found for the current period.</p>
      <Button variant="ghost" className="text-[#C9A84C] mt-2">Create your first {type}</Button>
    </div>
  );
}
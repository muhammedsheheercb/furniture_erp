"use client";
import {
  Plus,
  Search,
  Filter,
  Download,
  MoreHorizontal,
  Eye,
  Edit,
  Trash2,
  Hammer,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Layers
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useEffect, useState, Fragment } from "react";
import axios from "axios";
import { toast } from "sonner";

import ProductModal from "@/components/products/ProductModal";
import ConfirmModal from "@/components/ui/ConfirmModal";
import CurrencySymbol from "@/components/ui/CurrencySymbol";

export default function ProductsPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [modalOpen, setModalOpen] = useState(false);
  const [editProduct, setEditProduct] = useState<any | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [expandedBatches, setExpandedBatches] = useState<Set<string>>(new Set());

  function toggleBatches(id: string) {
    setExpandedBatches(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const catParam = category !== "all" ? `&category=${category}` : "";
      const res = await axios.get(`/api/items?search=${search}${catParam}`);
      if (res.data.success) {
        setProducts(res.data.data);
      }
    } catch (err) {
      console.error("Products fetch error:", err);
      toast.error("Failed to load products");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [search, category]);

  const handleSubmitProduct = async (data: any) => {
    setSaving(true);
    try {
      if (editProduct) {
        const res = await axios.put(`/api/items/${editProduct._id}`, data);
        if (res.data.success) {
          toast.success("Product updated successfully");
          setModalOpen(false);
          setEditProduct(null);
          fetchProducts();
        }
      } else {
        const res = await axios.post("/api/items", data);
        if (res.data.success) {
          toast.success("Product added successfully");
          setModalOpen(false);
          fetchProducts();
        }
      }
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Failed to save product");
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (product: any) => {
    setEditProduct(product);
    setModalOpen(true);
  };

  const handleDelete = (id: string) => {
    setDeleteId(id);
  };

  const handleConfirmDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try {
      const res = await axios.delete(`/api/items/${deleteId}`);
      if (res.data.success) {
        toast.success("Product deleted successfully");
        setDeleteId(null);
        fetchProducts();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Failed to delete product");
    } finally {
      setDeleting(false);
    }
  };

  const handleExport = () => {
    if (products.length === 0) {
      toast.error("No products to export");
      return;
    }

    const headers = ["SKU", "Name", "Category", "Quantity", "Unit", "Price"];
    const csvRows = products.map(p => [
      p.itemNumber || p.sku,
      p.name,
      p.category,
      p.quantity || 0,
      p.unit,
      p.salesAmount || 0
    ].join(","));

    const csvContent = [headers.join(","), ...csvRows].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `products_export_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Products exported successfully");
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-extrabold text-[#1A1210]">Products</h2>
          <p className="text-[#7A6055]">Manage your furniture catalog and stock levels.</p>
        </div>
        <div className="flex gap-2">
          <Button
            className="bg-[#2C1810] hover:bg-[#1A0F0A] text-white"
            onClick={() => {
              setEditProduct(null);
              setModalOpen(true);
            }}
          >
            <Plus size={18} className="mr-2" /> Add Product
          </Button>
        </div>
      </div>

      <ProductModal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditProduct(null);
        }}
        onSubmit={handleSubmitProduct}
        product={editProduct}
        loading={saving}
      />

      <ConfirmModal
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleConfirmDelete}
        title="Delete Product"
        message="Are you sure you want to delete this product? This action cannot be undone."
        loading={deleting}
      />

      <Card className="border-[#E5DDD5]">
        <CardHeader className="p-4 sm:p-6 border-b border-[#E5DDD5]">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#A89080]" size={18} />
              <Input
                placeholder="Search by SKU or name..."
                className="pl-10 border-[#E5DDD5] bg-[#FAF8F6] focus:bg-white transition-colors"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <select
                className="border-[#E5DDD5] bg-[#FAF8F6] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#C9A84C]"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                <option value="all">All Categories</option>
                <option value="sofa">Sofas</option>
                <option value="chair">Chairs</option>
                <option value="table">Tables</option>
                <option value="bed">Beds</option>
                <option value="office">Office</option>
                <option value="other">Other</option>
              </select>
            </div>
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
                    <th className="w-10"></th>
                    <th className="py-4 px-6 text-xs font-bold text-[#7A6055] uppercase">Product Details</th>
                    <th className="py-4 px-6 text-xs font-bold text-[#7A6055] uppercase">Category</th>
                    <th className="py-4 px-6 text-xs font-bold text-[#7A6055] uppercase">Color</th>
                    <th className="py-4 px-6 text-xs font-bold text-[#7A6055] uppercase text-center">Stock Level</th>
                    <th className="py-4 px-6 text-xs font-bold text-[#7A6055] uppercase">Selling Price</th>
                    <th className="py-4 px-6 text-xs font-bold text-[#7A6055] uppercase text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F0EBE5]">
                  {products.length > 0 ? products.map((product) => (
                    <Fragment key={product._id}>
                      <tr className="hover:bg-[#FAF8F6] transition-colors group border-b border-[#F0EBE5]">
                        <td className="py-4 px-2 text-center">
                          {product.batches?.length > 0 && (
                            <button onClick={() => toggleBatches(product._id)} className="text-[#A89080] hover:text-[#C9A84C]">
                              {expandedBatches.has(product._id) ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                            </button>
                          )}
                        </td>
                        <td className="py-4 px-6">
                          <div className="font-semibold text-[#1A1210]">{product.name}</div>
                          <div className="text-xs text-[#A89080]">{product.itemNumber}</div>
                        </td>
                        <td className="py-4 px-6">
                          <span className="text-sm font-medium text-[#7A6055]">{product.category}</span>
                        </td>
                        <td className="py-4 px-6">
                          <span className="text-sm text-[#7A6055]">{product.color || "—"}</span>
                        </td>
                        <td className="py-4 px-6">
                          <div className="flex flex-col items-center gap-1">
                            <div className={`text-sm font-bold ${(product.quantity || 0) <= (product.reorderLevel || 5) ? 'text-rose-600' : 'text-[#1A1210]'}`}>
                              {product.quantity || 0} <span className="text-[10px] font-normal text-[#A89080]">{product.unit || "Pcs"}</span>
                            </div>
                            {(product.quantity || 0) <= (product.reorderLevel || 5) && (
                              <AlertTriangle size={12} className="text-rose-500" />
                            )}
                          </div>
                        </td>
                        <td className="py-4 px-6 text-sm font-bold text-[#1A1210]">
                          <CurrencySymbol className="w-3 h-3 mr-1" /> {(product.salesAmount || 0).toLocaleString()}
                        </td>
                        <td className="py-4 px-6 text-right">
                          <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-[#7A6055]" onClick={() => handleEdit(product)}>
                              <Edit size={14} />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-rose-400" onClick={() => handleDelete(product._id)}>
                              <Trash2 size={14} />
                            </Button>
                          </div>
                        </td>
                      </tr>

                      {expandedBatches.has(product._id) && product.batches?.length > 0 && (
                        <tr className="bg-[#FAF9F7]">
                          <td colSpan={7} className="px-12 py-4">
                            <div className="rounded-xl border border-[#E5DDD5] bg-white overflow-hidden shadow-sm">
                              <div className="bg-[#FAF8F6] px-4 py-2 border-b border-[#E5DDD5] flex items-center gap-2">
                                <Layers size={14} className="text-[#C9A84C]" />
                                <span className="text-[10px] font-bold text-[#7A6055] uppercase tracking-wider">Stock Batch Details</span>
                              </div>
                              <table className="w-full text-xs text-left">
                                <thead>
                                  <tr className="border-b border-[#F0EBE5] bg-[#FDFCFB]">
                                    <th className="py-2 px-4 font-bold text-[#A89080] uppercase">Batch No.</th>
                                    <th className="py-2 px-4 font-bold text-[#A89080] uppercase text-center">Quantity</th>
                                    <th className="py-2 px-4 font-bold text-[#A89080] uppercase text-right">Unit Price</th>
                                    <th className="py-2 px-4 font-bold text-[#A89080] uppercase text-right">Total Value</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-[#F0EBE5]">
                                  {product.batches.map((b: any, idx: number) => (
                                    <tr key={idx} className="hover:bg-[#FAF8F6]">
                                      <td className="py-2 px-4 font-mono text-[#7A6055]">{b.batchNumber}</td>
                                      <td className="py-2 px-4 text-center font-semibold text-[#1A1210]">
                                        {b.quantity} {product.unit || "Pcs"}
                                      </td>
                                      <td className="py-2 px-4 text-right"><CurrencySymbol className="w-3 h-3 mr-1" /> {(b.salePrice || product.salesAmount || 0).toLocaleString()}</td>
                                      <td className="py-2 px-4 text-right font-bold text-[#1B3A2D]">
                                        <CurrencySymbol className="w-3 h-3 mr-1" /> {(b.quantity * (b.salePrice || product.salesAmount || 0)).toLocaleString()}
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                                <tfoot className="bg-[#FAF8F6] font-bold">
                                  <tr>
                                    <td className="py-2 px-4">Total across batches</td>
                                    <td className="py-2 px-4 text-center">{product.quantity} {product.unit || "Pcs"}</td>
                                    <td className="py-2 px-4 text-right">Avg: <CurrencySymbol className="w-3 h-3 mr-1" /> {Math.round(product.salesAmount || 0)}</td>
                                    <td className="py-2 px-4 text-right text-[#1B3A2D]"><CurrencySymbol className="w-3 h-3 mr-1" /> {(product.quantity * (product.salesAmount || 0)).toLocaleString()}</td>
                                  </tr>
                                </tfoot>
                              </table>
                            </div>
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  )) : (
                    <tr>
                      <td colSpan={7} className="py-10 text-center text-[#7A6055]">No products found</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}


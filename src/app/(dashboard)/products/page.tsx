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
  Layers,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useEffect, useState, Fragment } from "react";
import axios from "axios";
import { toast } from "sonner";

import ProductModal from "@/components/products/ProductModal";
import ConfirmModal from "@/components/ui/ConfirmModal";
import CurrencySymbol from "@/components/ui/CurrencySymbol";
import { useDateFilter } from "@/context/DateFilterContext";
import Pagination from "@/components/ui/Pagination";
import { useLanguage } from "../../../context/LanguageContext";

export default function ProductsPage() {
  const { t } = useLanguage();
  const { startDate, endDate } = useDateFilter();
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [modalOpen, setModalOpen] = useState(false);
  const [editProduct, setEditProduct] = useState<any | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [expandedBatches, setExpandedBatches] = useState<Set<string>>(
    new Set(),
  );

  // Tabs states
  const [activeTab, setActiveTab] = useState<"available" | "sold" | "returned">(
    "available",
  );
  const [soldItems, setSoldItems] = useState<any[]>([]);
  const [returnedItems, setReturnedItems] = useState<any[]>([]);

  const limit = 10;
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const [soldPage, setSoldPage] = useState(1);
  const [soldTotalPages, setSoldTotalPages] = useState(1);
  const [soldTotal, setSoldTotal] = useState(0);

  const [returnedPage, setReturnedPage] = useState(1);
  const [returnedTotalPages, setReturnedTotalPages] = useState(1);
  const [returnedTotal, setReturnedTotal] = useState(0);

  function toggleBatches(id: string) {
    setExpandedBatches((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const dateParam = `${startDate ? `&startDate=${startDate}` : ""}${endDate ? `&endDate=${endDate}` : ""}`;
      if (activeTab === "available") {
        const catParam = category !== "all" ? `&category=${category}` : "";
        const res = await axios.get(
          `/api/items?search=${search}&page=${page}&limit=${limit}${catParam}${dateParam}&isManufactured=false`,
        );
        if (res.data.success) {
          setProducts(res.data.data);
          setTotalPages(res.data.totalPages || 1);
          setTotal(res.data.total || 0);
        }
      } else if (activeTab === "sold") {
        const res = await axios.get(
          `/api/items/sold?search=${search}&page=${soldPage}&limit=${limit}${dateParam}`,
        );
        if (res.data.success) {
          setSoldItems(res.data.data);
          setSoldTotalPages(res.data.pagination.totalPages || 1);
          setSoldTotal(res.data.pagination.total || 0);
        }
      } else if (activeTab === "returned") {
        const res = await axios.get(
          `/api/items/returned?search=${search}&page=${returnedPage}&limit=${limit}${dateParam}`,
        );
        if (res.data.success) {
          setReturnedItems(res.data.data);
          setReturnedTotalPages(res.data.pagination.totalPages || 1);
          setReturnedTotal(res.data.pagination.total || 0);
        }
      }
    } catch (err) {
      console.error("Products fetch error:", err);
      toast.error("Failed to load products/items");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setPage(1);
    setSoldPage(1);
    setReturnedPage(1);
  }, [search, category, activeTab, startDate, endDate]);

  useEffect(() => {
    fetchProducts();
  }, [
    search,
    category,
    activeTab,
    page,
    soldPage,
    returnedPage,
    startDate,
    endDate,
  ]);

  const handleTabChange = (tab: "available" | "sold" | "returned") => {
    setActiveTab(tab);
    setSearch("");
    setSoldPage(1);
    setReturnedPage(1);
  };

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
    const csvRows = products.map((p) =>
      [
        p.itemNumber || p.sku,
        p.name,
        p.category,
        p.quantity || 0,
        p.unit,
        p.salesAmount || 0,
      ].join(","),
    );

    const csvContent = [headers.join(","), ...csvRows].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `products_export_${new Date().toISOString().split("T")[0]}.csv`,
    );
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Products exported successfully");
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-extrabold text-[#1A1210]">
            {t("products")}
          </h2>
          <p className="text-[#7A6055]">{t("manageYourFurnitureCatalogAnd")}</p>
        </div>
        <div className="flex gap-2">
          {activeTab === "available" && (
            <Button
              className="bg-[#2C1810] hover:bg-[#1A0F0A] text-white"
              onClick={() => {
                setEditProduct(null);
                setModalOpen(true);
              }}
            >
              <Plus size={18} className="me-2" /> {t("addProduct")}
            </Button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex bg-[#F5F2EA] p-1 rounded-xl gap-1 overflow-x-auto">
        <button
          onClick={() => handleTabChange("available")}
          className={`px-5 py-2.5 rounded-lg text-sm font-bold transition-all whitespace-nowrap uppercase tracking-wider ${
            activeTab === "available"
              ? "bg-[#2C1810] text-white shadow-sm"
              : "text-[#7A6055] hover:text-[#1A1210]"
          }`}
        >
          {t("availableProducts")}
        </button>
        <button
          onClick={() => handleTabChange("sold")}
          className={`px-5 py-2.5 rounded-lg text-sm font-bold transition-all whitespace-nowrap uppercase tracking-wider ${
            activeTab === "sold"
              ? "bg-[#2C1810] text-white shadow-sm"
              : "text-[#7A6055] hover:text-[#1A1210]"
          }`}
        >
          {t("soldProducts")}
        </button>
        <button
          onClick={() => handleTabChange("returned")}
          className={`px-5 py-2.5 rounded-lg text-sm font-bold transition-all whitespace-nowrap uppercase tracking-wider ${
            activeTab === "returned"
              ? "bg-[#2C1810] text-white shadow-sm"
              : "text-[#7A6055] hover:text-[#1A1210]"
          }`}
        >
          {t("returnedProducts")}
        </button>
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
        title={t("deleteProduct")}
        message={t("areYouSureYouWant")}
        loading={deleting}
      />

      <Card className="border-[#E5DDD5]">
        <CardHeader className="p-4 sm:p-6 border-b border-[#E5DDD5]">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search
                className="absolute start-3 top-1/2 -translate-y-1/2 text-[#A89080]"
                size={18}
              />
              <Input
                placeholder={
                  activeTab === "available"
                    ? "Search by SKU or name..."
                    : activeTab === "sold"
                      ? "Search sold products by sale #, customer, or product..."
                      : "Search returned products by return #, customer, or product..."
                }
                className="ps-10 border-[#E5DDD5] bg-[#FAF8F6] focus:bg-white transition-colors"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            {activeTab === "available" && (
              <div className="flex gap-2">
                <select
                  className="border-[#E5DDD5] bg-[#FAF8F6] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#C9A84C]"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                >
                  <option value="all">{t("allCategories")}</option>
                  <option value="sofa">{t("sofas")}</option>
                  <option value="chair">{t("chairs")}</option>
                  <option value="table">{t("tables")}</option>
                  <option value="bed">{t("beds")}</option>
                  <option value="office">{t("office")}</option>
                  <option value="other">{t("other")}</option>
                </select>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#C9A84C]"></div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              {activeTab === "available" ? (
                <>
                  <table className="w-full text-start border-collapse">
                    <thead>
                      <tr className="bg-[#FAF8F6] border-b border-[#E5DDD5]">
                        <th className="w-10"></th>
                        <th className="py-4 px-6 text-xs font-bold text-[#7A6055] uppercase">
                          {t("productDetails")}
                        </th>
                        <th className="py-4 px-6 text-xs font-bold text-[#7A6055] uppercase">
                          {t("category")}
                        </th>
                        <th className="py-4 px-6 text-xs font-bold text-[#7A6055] uppercase">
                          {t("color")}
                        </th>
                        <th className="py-4 px-6 text-xs font-bold text-[#7A6055] uppercase text-center">
                          {t("stockLevel")}
                        </th>
                        <th className="py-4 px-6 text-xs font-bold text-[#7A6055] uppercase">
                          {t("sellingPrice")}
                        </th>
                        <th className="py-4 px-6 text-xs font-bold text-[#7A6055] uppercase text-end">
                          {t("actions")}
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#F0EBE5]">
                      {products.length > 0 ? (
                        products.map((product) => (
                          <Fragment key={product._id}>
                            <tr className="hover:bg-[#FAF8F6] transition-colors group border-b border-[#F0EBE5]">
                              <td className="py-4 px-2 text-center">
                                {product.batches?.length > 0 && (
                                  <button
                                    onClick={() => toggleBatches(product._id)}
                                    className="text-[#A89080] hover:text-[#C9A84C]"
                                  >
                                    {expandedBatches.has(product._id) ? (
                                      <ChevronUp size={16} />
                                    ) : (
                                      <ChevronDown size={16} />
                                    )}
                                  </button>
                                )}
                              </td>
                              <td className="py-4 px-6">
                                <div className="font-semibold text-[#1A1210]">
                                  {product.name}
                                </div>
                                <div className="text-xs text-[#A89080]">
                                  {product.itemNumber}
                                </div>
                              </td>
                              <td className="py-4 px-6">
                                <span className="text-sm font-medium text-[#7A6055]">
                                  {product.category}
                                </span>
                              </td>
                              <td className="py-4 px-6">
                                <span className="text-sm text-[#7A6055]">
                                  {product.color || "—"}
                                </span>
                              </td>
                              <td className="py-4 px-6">
                                <div className="flex flex-col items-center gap-1">
                                  <div
                                    className={`text-sm font-bold ${(product.quantity || 0) <= (product.reorderLevel || 5) ? "text-rose-600" : "text-[#1A1210]"}`}
                                  >
                                    {product.quantity || 0}{" "}
                                    <span className="text-[10px] font-normal text-[#A89080]">
                                      {product.unit || "Pcs"}
                                    </span>
                                  </div>
                                  {(product.quantity || 0) <=
                                    (product.reorderLevel || 5) && (
                                    <AlertTriangle
                                      size={12}
                                      className="text-rose-500"
                                    />
                                  )}
                                </div>
                              </td>
                              <td className="py-4 px-6 text-sm font-bold text-[#1A1210]">
                                <CurrencySymbol className="w-3 h-3 me-1" />{" "}
                                {(product.salesAmount || 0).toLocaleString()}
                              </td>
                              <td className="py-4 px-6 text-end">
                                <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 text-[#7A6055]"
                                    onClick={() => handleEdit(product)}
                                  >
                                    <Edit size={14} />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 text-rose-400"
                                    onClick={() => handleDelete(product._id)}
                                  >
                                    <Trash2 size={14} />
                                  </Button>
                                </div>
                              </td>
                            </tr>

                            {expandedBatches.has(product._id) &&
                              product.batches?.length > 0 && (
                                <tr className="bg-[#FAF9F7]">
                                  <td colSpan={7} className="px-12 py-4">
                                    <div className="rounded-xl border border-[#E5DDD5] bg-white overflow-hidden shadow-sm">
                                      <div className="bg-[#FAF8F6] px-4 py-2 border-b border-[#E5DDD5] flex items-center gap-2">
                                        <Layers
                                          size={14}
                                          className="text-[#C9A84C]"
                                        />
                                        <span className="text-[10px] font-bold text-[#7A6055] uppercase tracking-wider">
                                          {t("stockBatchDetails")}
                                        </span>
                                      </div>
                                      <table className="w-full text-xs text-start">
                                        <thead>
                                          <tr className="border-b border-[#F0EBE5] bg-[#FDFCFB]">
                                            <th className="py-2 px-4 font-bold text-[#A89080] uppercase">
                                              {t("batchNo")}
                                            </th>
                                            <th className="py-2 px-4 font-bold text-[#A89080] uppercase text-center">
                                              {t("quantity")}
                                            </th>
                                            <th className="py-2 px-4 font-bold text-[#A89080] uppercase text-end">
                                              {t("unitPrice")}
                                            </th>
                                            <th className="py-2 px-4 font-bold text-[#A89080] uppercase text-end">
                                              {t("totalValue")}
                                            </th>
                                          </tr>
                                        </thead>
                                        <tbody className="divide-y divide-[#F0EBE5]">
                                          {product.batches.map(
                                            (b: any, idx: number) => (
                                              <tr
                                                key={idx}
                                                className="hover:bg-[#FAF8F6]"
                                              >
                                                <td className="py-2 px-4 font-mono text-[#7A6055]">
                                                  {b.batchNumber}
                                                </td>
                                                <td className="py-2 px-4 text-center font-semibold text-[#1A1210]">
                                                  {b.quantity}{" "}
                                                  {product.unit || "Pcs"}
                                                </td>
                                                <td className="py-2 px-4 text-end">
                                                  <CurrencySymbol className="w-3 h-3 me-1" />{" "}
                                                  {(
                                                    b.salePrice ||
                                                    product.salesAmount ||
                                                    0
                                                  ).toLocaleString()}
                                                </td>
                                                <td className="py-2 px-4 text-end font-bold text-[#1B3A2D]">
                                                  <CurrencySymbol className="w-3 h-3 me-1" />{" "}
                                                  {(
                                                    b.quantity *
                                                    (b.salePrice ||
                                                      product.salesAmount ||
                                                      0)
                                                  ).toLocaleString()}
                                                </td>
                                              </tr>
                                            ),
                                          )}
                                        </tbody>
                                        <tfoot className="bg-[#FAF8F6] font-bold">
                                          <tr>
                                            <td className="py-2 px-4">
                                              {t("totalAcrossBatches")}
                                            </td>
                                            <td className="py-2 px-4 text-center">
                                              {product.quantity}{" "}
                                              {product.unit || "Pcs"}
                                            </td>
                                            <td className="py-2 px-4 text-end">
                                              {t("avg")}
                                              <CurrencySymbol className="w-3 h-3 me-1" />{" "}
                                              {Math.round(
                                                product.salesAmount || 0,
                                              )}
                                            </td>
                                            <td className="py-2 px-4 text-end text-[#1B3A2D]">
                                              <CurrencySymbol className="w-3 h-3 me-1" />{" "}
                                              {(
                                                product.quantity *
                                                (product.salesAmount || 0)
                                              ).toLocaleString()}
                                            </td>
                                          </tr>
                                        </tfoot>
                                      </table>
                                    </div>
                                  </td>
                                </tr>
                              )}
                          </Fragment>
                        ))
                      ) : (
                        <tr>
                          <td
                            colSpan={7}
                            className="py-10 text-center text-[#7A6055]"
                          >
                            {t("noProductsFound")}
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                  {totalPages > 1 && (
                    <div className="border-t border-[#E5DDD5]">
                      <Pagination
                        page={page}
                        totalPages={totalPages}
                        total={total}
                        limit={limit}
                        onPageChange={setPage}
                      />
                    </div>
                  )}
                </>
              ) : activeTab === "sold" ? (
                <div className="space-y-4">
                  <table className="w-full text-start border-collapse">
                    <thead>
                      <tr className="bg-[#FAF8F6] border-b border-[#E5DDD5]">
                        <th className="py-4 px-6 text-xs font-bold text-[#7A6055] uppercase">
                          {t("productDescription")}
                        </th>
                        <th className="py-4 px-6 text-xs font-bold text-[#7A6055] uppercase">
                          {t("saleReference")}
                        </th>
                        <th className="py-4 px-6 text-xs font-bold text-[#7A6055] uppercase">
                          {t("customer")}
                        </th>
                        <th className="py-4 px-6 text-xs font-bold text-[#7A6055] uppercase">
                          {t("colorSize")}
                        </th>
                        <th className="py-4 px-6 text-xs font-bold text-[#7A6055] uppercase text-center">
                          {t("quantitySold")}
                        </th>
                        <th className="py-4 px-6 text-xs font-bold text-[#7A6055] uppercase text-end">
                          {t("unitPrice")}
                        </th>
                        <th className="py-4 px-6 text-xs font-bold text-[#7A6055] uppercase text-end">
                          {t("totalRevenue")}
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#F0EBE5]">
                      {soldItems.length > 0 ? (
                        soldItems.map((item, idx) => (
                          <tr
                            key={idx}
                            className="hover:bg-[#FAF8F6] transition-colors border-b border-[#F0EBE5]"
                          >
                            <td className="py-4 px-6">
                              <div className="font-semibold text-[#1A1210]">
                                {item.itemName}
                              </div>
                              <div className="text-xs text-[#A89080]">
                                {item.itemNumber}
                              </div>
                            </td>
                            <td className="py-4 px-6">
                              <div className="font-bold text-indigo-600">
                                {item.saleNumber}
                              </div>
                              <div className="text-xs text-[#A89080]">
                                {new Date(item.date).toLocaleDateString()}
                              </div>
                            </td>
                            <td className="py-4 px-6 font-medium text-[#1A1210]">
                              {item.customerName}
                            </td>
                            <td className="py-4 px-6 text-sm text-[#7A6055]">
                              {item.color || "—"} / {item.size || "—"}
                            </td>
                            <td className="py-4 px-6 text-center font-bold text-[#1A1210]">
                              {item.quantity}
                            </td>
                            <td className="py-4 px-6 text-end font-semibold text-[#7A6055]">
                              <CurrencySymbol className="w-3 h-3 me-1" />
                              {(item.price || 0).toLocaleString()}
                            </td>
                            <td className="py-4 px-6 text-end font-extrabold text-[#1B3A2D]">
                              <CurrencySymbol className="w-3 h-3 me-1" />
                              {(item.total || 0).toLocaleString()}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td
                            colSpan={7}
                            className="py-10 text-center text-[#7A6055]"
                          >
                            {t("noSoldProductsFound")}
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>

                  {soldTotalPages > 1 && (
                    <div className="border-t border-[#E5DDD5]">
                      <Pagination
                        page={soldPage}
                        totalPages={soldTotalPages}
                        total={soldTotal}
                        limit={limit}
                        onPageChange={setSoldPage}
                      />
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  <table className="w-full text-start border-collapse">
                    <thead>
                      <tr className="bg-[#FAF8F6] border-b border-[#E5DDD5]">
                        <th className="py-4 px-6 text-xs font-bold text-[#7A6055] uppercase">
                          {t("productDescription")}
                        </th>
                        <th className="py-4 px-6 text-xs font-bold text-[#7A6055] uppercase">
                          {t("returnReference")}
                        </th>
                        <th className="py-4 px-6 text-xs font-bold text-[#7A6055] uppercase">
                          {t("customer")}
                        </th>
                        <th className="py-4 px-6 text-xs font-bold text-[#7A6055] uppercase text-center">
                          {t("returnedQty")}
                        </th>
                        <th className="py-4 px-6 text-xs font-bold text-[#7A6055] uppercase text-end">
                          {t("price")}
                        </th>
                        <th className="py-4 px-6 text-xs font-bold text-[#7A6055] uppercase text-end">
                          {t("refundValue")}
                        </th>
                        <th className="py-4 px-6 text-xs font-bold text-[#7A6055] uppercase">
                          {t("reasonNotes")}
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#F0EBE5]">
                      {returnedItems.length > 0 ? (
                        returnedItems.map((item, idx) => (
                          <tr
                            key={idx}
                            className="hover:bg-[#FAF8F6] transition-colors border-b border-[#F0EBE5]"
                          >
                            <td className="py-4 px-6">
                              <div className="font-semibold text-[#1A1210]">
                                {item.itemName}
                              </div>
                              <div className="text-xs text-[#A89080]">
                                {item.itemNumber}
                              </div>
                            </td>
                            <td className="py-4 px-6">
                              <div className="font-bold text-rose-600">
                                {item.returnNumber}
                              </div>
                              <div className="text-xs text-[#A89080]">
                                {new Date(item.date).toLocaleDateString()}
                              </div>
                            </td>
                            <td className="py-4 px-6 font-medium text-[#1A1210]">
                              {item.customerName}
                            </td>
                            <td className="py-4 px-6 text-center font-bold text-rose-600">
                              {item.quantity}
                            </td>
                            <td className="py-4 px-6 text-end font-semibold text-[#7A6055]">
                              <CurrencySymbol className="w-3 h-3 me-1" />
                              {(item.price || 0).toLocaleString()}
                            </td>
                            <td className="py-4 px-6 text-end font-extrabold text-rose-700">
                              <CurrencySymbol className="w-3 h-3 me-1" />
                              {(item.total || 0).toLocaleString()}
                            </td>
                            <td className="py-4 px-6 text-sm text-[#7A6055] italic">
                              {item.reason}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td
                            colSpan={7}
                            className="py-10 text-center text-[#7A6055]"
                          >
                            {t("noReturnedProductsFound")}
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>

                  {returnedTotalPages > 1 && (
                    <div className="border-t border-[#E5DDD5]">
                      <Pagination
                        page={returnedPage}
                        totalPages={returnedTotalPages}
                        total={returnedTotal}
                        limit={limit}
                        onPageChange={setReturnedPage}
                      />
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

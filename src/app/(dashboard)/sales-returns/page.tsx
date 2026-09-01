"use client";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import {
  Undo2,
  Plus,
  Search,
  Calendar,
  Package,
  User as UserIcon,
  ReceiptText,
  Eye,
  ArrowUpDown,
  Edit,
  Trash2,
} from "lucide-react";
import ConfirmModal from "@/components/ui/ConfirmModal";
import TopBar from "@/components/layout/TopBar";
import Modal from "@/components/ui/Modal";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import Select from "react-select";
import { toast } from "react-hot-toast";
import { formatCurrency, formatDate } from "@/lib/utils";
import { ISale, ISaleItem, ICustomer } from "@/types";

import Pagination from "@/components/ui/Pagination";

import { useDateFilter } from "@/context/DateFilterContext";
import { useLanguage } from "../../../context/LanguageContext";

export default function SalesReturnsPage() {
  const { t } = useLanguage();
  const { startDate, endDate } = useDateFilter();
  const [returns, setReturns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);

  const [sales, setSales] = useState<ISale[]>([]);
  const [selectedSale, setSelectedSale] = useState<ISale | null>(null);
  const [returnItems, setReturnItems] = useState<any[]>([]);
  const { data: session } = useSession();
  const isAdmin = session?.user?.role === "admin";
  const perms = (session?.user?.permissions as any)?.sales_returns;
  const canCreate = isAdmin || perms?.create;
  const canEdit = isAdmin || perms?.edit;
  const canDelete = isAdmin || perms?.delete;

  useEffect(() => {
    fetchReturns();
    fetchSales();
  }, [page, startDate, endDate]);

  const fetchReturns = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: "10",
        ...(startDate && { startDate }),
        ...(endDate && { endDate }),
      });
      const res = await fetch(`/api/sales-returns?${params}`);
      const data = await res.json();
      setReturns(data.data || []);
      setTotal(data.total || 0);
      setTotalPages(data.totalPages || 0);
    } catch (error) {
      toast.error("Failed to fetch returns");
    } finally {
      setLoading(false);
    }
  };

  const fetchSales = async () => {
    try {
      const res = await fetch("/api/sales");
      const data = await res.json();
      setSales(data.data || data); // Handle both paginated and non-paginated
    } catch (error) {
      toast.error("Failed to fetch sales");
    }
  };

  const handleSaleSelect = async (sale: ISale) => {
    setSelectedSale(sale);
    try {
      const res = await fetch(`/api/sales-returns?saleId=${sale._id}`);
      const result = await res.json();
      const existingReturns = result.data || [];

      const returnedQtyMap: Record<string, number> = {};
      existingReturns.forEach((ret: any) => {
        if (editMode && ret._id === editId) return;
        ret.items.forEach((item: any) => {
          returnedQtyMap[item.itemId] =
            (returnedQtyMap[item.itemId] || 0) + item.quantity;
        });
      });

      setReturnItems(
        sale.items.map((item) => {
          const alreadyReturned = returnedQtyMap[item.itemId] || 0;
          return {
            ...item,
            returnQuantity: 0,
            alreadyReturned,
            originalQuantity: item.quantity,
          };
        }),
      );
    } catch (error) {
      toast.error("Failed to load return history for this sale");
      setReturnItems(
        sale.items.map((item) => ({
          ...item,
          returnQuantity: 0,
          alreadyReturned: 0,
          originalQuantity: item.quantity,
        })),
      );
    }
  };

  const handleDeleteRequest = (id: string) => {
    setDeleteId(id);
    setConfirmModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteId) return;
    try {
      const res = await fetch(`/api/sales-returns/${deleteId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        toast.success("Return record deleted & balance/stock reverted");
        fetchReturns();
      } else {
        toast.error("Failed to delete record");
      }
    } catch (error) {
      toast.error("An error occurred during deletion");
    } finally {
      setConfirmModalOpen(false);
      setDeleteId(null);
    }
  };

  const handleEditReturn = async (ret: any) => {
    // Find the sale this return belongs to
    const sale = sales.find((s) => s._id === ret.saleId);
    if (!sale) {
      toast.error("Original sale data missing - editing unavailable.");
      return;
    }

    setEditId(ret._id);
    setEditMode(true);
    setSelectedSale(sale);

    try {
      const res = await fetch(`/api/sales-returns?saleId=${ret.saleId}`);
      const result = await res.json();
      const existingReturns = result.data || [];

      const returnedQtyMap: Record<string, number> = {};
      existingReturns.forEach((r: any) => {
        if (r._id === ret._id) return;
        r.items.forEach((item: any) => {
          returnedQtyMap[item.itemId] =
            (returnedQtyMap[item.itemId] || 0) + item.quantity;
        });
      });

      setReturnItems(
        sale.items.map((sItem) => {
          const rItem = ret.items.find((ri: any) => ri.itemId === sItem.itemId);
          const alreadyReturned = returnedQtyMap[sItem.itemId] || 0;
          return {
            ...sItem,
            originalQuantity: sItem.quantity,
            returnQuantity: rItem ? rItem.quantity : 0,
            alreadyReturned,
          };
        }),
      );
    } catch (error) {
      toast.error("Failed to load return history for this sale");
      setReturnItems(
        sale.items.map((sItem) => {
          const rItem = ret.items.find((ri: any) => ri.itemId === sItem.itemId);
          return {
            ...sItem,
            originalQuantity: sItem.quantity,
            returnQuantity: rItem ? rItem.quantity : 0,
            alreadyReturned: 0,
          };
        }),
      );
    }
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSale) return;

    const itemsToReturn = returnItems.filter((item) => item.returnQuantity > 0);
    if (itemsToReturn.length === 0) {
      toast.error("Please select at least one item to return");
      return;
    }

    for (const item of itemsToReturn) {
      const alreadyReturned = item.alreadyReturned || 0;
      const maxAllowed = item.originalQuantity - alreadyReturned;
      if (item.returnQuantity > maxAllowed) {
        toast.error(
          `Cannot return more than ${maxAllowed} of ${item.itemName}`,
        );
        return;
      }
    }

    const total = itemsToReturn.reduce(
      (sum, item) => sum + item.price * item.returnQuantity,
      0,
    );
    const payload = {
      returnNumber: editMode
        ? returns.find((r) => r._id === editId).returnNumber
        : `RET-${Date.now().toString().slice(-6)}`,
      saleId: selectedSale._id,
      saleNumber: selectedSale.saleNumber,
      customerId: selectedSale.customerId,
      customerName: selectedSale.customerName,
      items: itemsToReturn.map((item) => ({
        itemId: item.itemId,
        itemNumber: item.itemNumber,
        itemName: item.itemName,
        quantity: item.returnQuantity,
        batch: item.batch,
        price: item.price,
        total: item.price * item.returnQuantity,
        reason: "Customer Return",
      })),
      totalAmount: total,
      date: new Date(),
    };

    try {
      const url = editMode
        ? `/api/sales-returns/${editId}`
        : "/api/sales-returns";
      const method = editMode ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        toast.success(
          editMode
            ? "Return updated successfully"
            : "Return processed successfully",
        );
        setModalOpen(false);
        fetchReturns();
      } else {
        const data = await res.json();
        toast.error(data.error || "Failed to process return");
      }
    } catch (error) {
      toast.error("An error occurred");
    }
  };

  return (
    <main className="flex-1 p-6">
      <div className="max-w-6xl mx-auto">
        <TopBar
          title={t("salesReturns")}
          subtitle={t("trackAndManageCustomerProduct")}
          actions={
            canCreate && (
              <Button
                onClick={() => {
                  setEditMode(false);
                  setEditId(null);
                  setSelectedSale(null);
                  setReturnItems([]);
                  setModalOpen(true);
                }}
                icon={<Plus size={18} />}
              >
                {t("newReturn")}
              </Button>
            )
          }
        />

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-x-auto">
          <table className="w-full text-start">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 text-sm font-semibold text-gray-900 text-center">
                  {t("return")}
                </th>
                <th className="px-6 py-4 text-sm font-semibold text-gray-900 text-center">
                  {t("sale")}
                </th>
                <th className="px-6 py-4 text-sm font-semibold text-gray-900 text-center">
                  {t("customer")}
                </th>
                <th className="px-6 py-4 text-sm font-semibold text-gray-900 text-center">
                  {t("total")}
                </th>
                <th className="px-6 py-4 text-sm font-semibold text-gray-900 text-center">
                  {t("date")}
                </th>
                {isAdmin && (
                  <th className="px-6 py-4 text-sm font-semibold text-gray-900 text-end">
                    {t("createdBy")}
                  </th>
                )}
                <th className="px-6 py-4 text-sm font-semibold text-gray-900 text-end pe-6">
                  {t("actions")}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 text-center">
              {returns.map((ret) => (
                <tr
                  key={ret._id}
                  className="hover:bg-gray-50 transition-colors"
                >
                  <td className="px-6 py-4 font-medium text-indigo-600">
                    {ret.returnNumber}
                  </td>
                  <td className="px-6 py-4 text-gray-600">{ret.saleNumber}</td>
                  <td className="px-6 py-4 text-gray-900 font-medium">
                    {ret.customerName}
                  </td>
                  <td className="px-6 py-4 font-bold text-red-600">
                    {formatCurrency(ret.totalAmount)}
                  </td>
                  <td className="px-6 py-4 text-gray-500">
                    {formatDate(ret.date)}
                  </td>
                  {isAdmin && (
                    <td className="px-6 py-4 text-end">
                      <div className="flex flex-col items-end">
                        <span className="text-[10px] font-medium text-gray-800">
                          {ret.createdBy?.name || "Admin"}
                        </span>
                        {ret.updatedBy &&
                          ret.updatedBy.name !== ret.createdBy?.name && (
                            <span className="text-[9px] text-gray-400 italic">
                              {t("edit")}
                              {ret.updatedBy.name}
                            </span>
                          )}
                      </div>
                    </td>
                  )}
                  <td className="px-6 py-4 text-end pe-6">
                    <div className="flex justify-end gap-2">
                      {canEdit && (
                        <Button
                          variant="ghost"
                          size="xs"
                          onClick={() => handleEditReturn(ret)}
                          title={t("editReturn")}
                        >
                          <Edit size={16} className="text-indigo-500" />
                        </Button>
                      )}
                      {canDelete && (
                        <Button
                          variant="ghost"
                          size="xs"
                          onClick={() => handleDeleteRequest(ret._id)}
                          title={t("deleteReturn")}
                        >
                          <Trash2 size={16} className="text-red-500" />
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {returns.length === 0 && !loading && (
            <div className="p-12 text-center text-gray-500">
              {t("noReturnsFound")}
            </div>
          )}
          <div className="border-t border-gray-100 px-2 mt-4">
            <Pagination
              page={page}
              totalPages={totalPages}
              total={total}
              limit={10}
              onPageChange={setPage}
            />
          </div>
        </div>

        <ConfirmModal
          open={confirmModalOpen}
          title={t("deleteSalesReturn")}
          message={t("thisWillReverseTheInventory")}
          onClose={() => setConfirmModalOpen(false)}
          onConfirm={handleDeleteConfirm}
        />
      </div>

      <Modal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditMode(false);
          setEditId(null);
        }}
        title={
          editMode
            ? `Edit Return #${returns.find((r) => r._id === editId)?.returnNumber}`
            : "Process Sales Return"
        }
        size="xl"
      >
        <div className="space-y-6 min-h-[600px] flex flex-col">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t("selectSale")}
            </label>
            <Select
              options={sales.map((s) => ({
                value: s._id,
                label: `${s.saleNumber} - ${s.customerName}`,
                data: s,
              }))}
              value={
                selectedSale
                  ? {
                      value: selectedSale._id,
                      label: `${selectedSale.saleNumber} - ${selectedSale.customerName}`,
                      data: selectedSale,
                    }
                  : null
              }
              onChange={(opt: any) => handleSaleSelect(opt.data)}
              placeholder={t("searchSaleNumberOrCustomer")}
            />
          </div>

          {selectedSale && (
            <div className="space-y-4 flex-1">
              <div className="bg-indigo-50 p-4 rounded-lg flex justify-between items-center text-sm">
                <div>
                  <span className="text-gray-500">{t("customer")}</span>
                  <span className="ms-2 font-semibold text-gray-900">
                    {selectedSale.customerName}
                  </span>
                </div>
                <div>
                  <span className="text-gray-500">{t("saleDate")}</span>
                  <span className="ms-2 font-semibold text-gray-900">
                    {formatDate(selectedSale.date)}
                  </span>
                </div>
              </div>

              <div className="overflow-auto max-h-[400px] w-full border border-gray-100 rounded-lg">
                <table className="w-full text-sm min-w-[500px]">
                  <thead className="text-gray-500 border-b sticky top-0 bg-white">
                    <tr>
                      <th className="py-2 font-medium text-start">
                        {t("item")}
                      </th>
                      <th className="py-2 font-medium text-center">
                        {t("qtyBought")}
                      </th>
                      <th className="py-2 font-medium text-center">
                        {t("alreadyReturned")}
                      </th>
                      <th className="py-2 font-medium text-center">
                        {t("returnQty")}
                      </th>
                      <th className="py-2 font-medium text-end">
                        {t("price")}
                      </th>
                      <th className="py-2 font-medium text-end">
                        {t("returnTotal")}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {returnItems
                      .map((item, originalIdx) => ({ ...item, originalIdx }))
                      .filter((item) => {
                        const maxAllowed =
                          item.originalQuantity - (item.alreadyReturned || 0);
                        return (
                          maxAllowed > 0 ||
                          (editMode && item.returnQuantity > 0)
                        );
                      })
                      .map((item) => {
                        const idx = item.originalIdx;
                        const maxAllowed =
                          item.originalQuantity - (item.alreadyReturned || 0);
                        return (
                          <tr key={idx}>
                            <td className="py-3 text-start">
                              <div className="flex items-center gap-2">
                                <span className="font-medium text-gray-900">
                                  {item.itemName}
                                </span>
                                {(item.alreadyReturned || 0) >=
                                  item.originalQuantity && (
                                  <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-red-100 text-red-800">
                                    {t("fullyReturned")}
                                  </span>
                                )}
                              </div>
                              <div className="text-xs text-gray-500">
                                {item.itemNumber}{" "}
                                {item.batch ? `(Batch: ${item.batch})` : ""}
                              </div>
                            </td>
                            <td className="py-3 text-center">
                              {item.originalQuantity}
                            </td>
                            <td className="py-3 text-center text-red-500 font-semibold">
                              {item.alreadyReturned || 0}
                            </td>
                            <td className="py-3 text-center">
                              <input
                                type="number"
                                min="0"
                                max={maxAllowed}
                                value={item.returnQuantity}
                                onChange={(e) => {
                                  const raw = e.target.value;
                                  const val = raw === "" ? 0 : parseInt(raw);
                                  const finalVal = Math.max(
                                    0,
                                    Math.min(val || 0, maxAllowed),
                                  );
                                  const newItems = [...returnItems];
                                  newItems[idx].returnQuantity =
                                    raw === "" ? "" : finalVal;
                                  setReturnItems(newItems);
                                }}
                                disabled={maxAllowed <= 0}
                                className="w-16 px-2 py-1 border rounded text-center focus:ring-1 focus:ring-indigo-500 outline-none disabled:bg-gray-100 disabled:text-gray-400"
                              />
                            </td>
                            <td className="py-3 text-end">
                              {formatCurrency(item.price)}
                            </td>
                            <td className="py-3 text-end font-medium">
                              {formatCurrency(
                                item.price * (item.returnQuantity || 0),
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    {returnItems.filter((item) => {
                      const maxAllowed =
                        item.originalQuantity - (item.alreadyReturned || 0);
                      return (
                        maxAllowed > 0 || (editMode && item.returnQuantity > 0)
                      );
                    }).length === 0 && (
                      <tr>
                        <td
                          colSpan={6}
                          className="py-8 text-center text-gray-500 font-semibold"
                        >
                          {t("allItemsInThisSale")}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              <div className="flex flex-col sm:flex-row justify-between items-center sm:items-center bg-gray-50 p-4 rounded-xl border border-gray-200 mt-auto gap-2">
                <span className="font-semibold text-gray-700 text-center sm:text-left text-sm sm:text-base">
                  {t("totalReturnAmount")}
                </span>
                <span className="text-xl font-bold text-red-600">
                  {formatCurrency(
                    returnItems.reduce(
                      (sum, item) =>
                        sum + item.price * (item.returnQuantity || 0),
                      0,
                    ),
                  )}
                </span>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t">
                <Button variant="outline" onClick={() => setModalOpen(false)}>
                  {t("cancel")}
                </Button>
                <Button onClick={handleSubmit} color="primary">
                  {t("confirmReturn")}
                </Button>
              </div>
            </div>
          )}
        </div>
      </Modal>
    </main>
  );
}

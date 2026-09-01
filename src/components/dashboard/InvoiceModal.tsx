"use client";
import {
  X,
  FileDown,
  User,
  Calendar,
  Hash,
  CreditCard,
  Package,
} from "lucide-react";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import { formatCurrency, formatDate } from "@/lib/utils";
import { generateInvoicePDF } from "@/lib/pdf-utils";
import { useLanguage } from "../../context/LanguageContext";

interface InvoiceItem {
  itemName: string;
  itemNumber: string;
  quantity: number;
  price: number;
  total: number;
  isFOC?: boolean;
  manufacturingDate?: string;
  expiryDate?: string;
}

interface InvoiceData {
  _id: string;
  number: string;
  customerOrSupplier: string;
  customerOrSupplierNumber: string;
  date: Date | string;
  paymentType: string;
  items: InvoiceItem[];
  subtotal: number;
  tax: number;
  total: number;
  type: "Sale" | "Purchase";
  isTaxInvoice?: boolean;
  advancePaid?: number;
  createdBy?: { name: string };
}

interface InvoiceModalProps {
  open: boolean;
  onClose: () => void;
  data: InvoiceData | null;
}

export default function InvoiceModal({
  open,
  onClose,
  data,
}: InvoiceModalProps) {
  const { t } = useLanguage();
  if (!open || !data) return null;

  const subtotal = data.subtotal || 0;
  const tax = data.tax || 0;
  const taxAmt = subtotal * (tax / 100);

  const generatePDF = () => {
    if (!data) return;
    generateInvoicePDF({
      number: data.number,
      customerOrSupplier: data.customerOrSupplier,
      customerOrSupplierNumber: data.customerOrSupplierNumber,
      date: data.date,
      paymentType: data.paymentType,
      items: data.items.map((item) => ({
        itemName: item.itemName,
        itemNumber: item.itemNumber,
        quantity: item.quantity,
        price: item.price,
        total: item.total,
        isFOC: item.isFOC,
        manufacturingDate: item.manufacturingDate,
        expiryDate: item.expiryDate,
      })),
      subtotal,
      tax,
      total: data.total,
      type: data.type,
      isTaxInvoice: data.isTaxInvoice,
      advancePaid: data.advancePaid,
      createdBy: data.createdBy?.name,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div className="w-full max-w-3xl bg-white rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <div>
            <h3 className="text-xl font-bold text-gray-800">
              {data.type} {t("invoice")}
            </h3>
            <p className="text-sm text-gray-500 font-mono">{data.number}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full text-gray-400 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-8 scrollbar-thin">
          {/* Info Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="space-y-1">
              <label className="text-[10px] uppercase font-bold text-gray-400 tracking-wider flex items-center gap-1.5">
                <User size={10} />{" "}
                {data.type === "Sale" ? "Customer" : "Supplier"}
              </label>
              <p className="text-sm font-semibold text-gray-800 truncate">
                {data.customerOrSupplier}
              </p>
              <p className="text-xs text-gray-500">
                {data.customerOrSupplierNumber}
              </p>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] uppercase font-bold text-gray-400 tracking-wider flex items-center gap-1.5">
                <Calendar size={10} /> {t("date")}
              </label>
              <p className="text-sm font-semibold text-gray-800">
                {formatDate(data.date)}
              </p>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] uppercase font-bold text-gray-400 tracking-wider flex items-center gap-1.5">
                <CreditCard size={10} /> {t("payment")}
              </label>
              <Badge
                label={data.paymentType}
                variant={
                  data.paymentType === "cash"
                    ? "success"
                    : data.paymentType === "credit"
                      ? "warning"
                      : "info"
                }
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] uppercase font-bold text-gray-400 tracking-wider flex items-center gap-1.5">
                <Package size={10} /> {t("items")}
              </label>
              <p className="text-sm font-semibold text-gray-800">
                {data.items.length} {t("units")}
              </p>
            </div>
            {data.createdBy && (
              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-gray-400 tracking-wider flex items-center gap-1.5">
                  <User size={10} /> {t("createdBy")}
                </label>
                <p className="text-sm font-semibold text-indigo-600">
                  {data.createdBy.name}
                </p>
              </div>
            )}
          </div>

          {/* Items Table */}
          <div className="border border-gray-100 rounded-xl overflow-x-auto">
            <table className="w-full text-start border-collapse min-w-[600px]">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="px-4 py-3 text-[10px] uppercase font-bold text-gray-400 tracking-wider">
                    {t("itemDetails")}
                  </th>
                  <th className="px-4 py-3 text-[10px] uppercase font-bold text-gray-400 tracking-wider text-end">
                    {t("qty")}
                  </th>
                  <th className="px-4 py-3 text-[10px] uppercase font-bold text-gray-400 tracking-wider text-end">
                    {t("price")}
                  </th>
                  <th className="px-4 py-3 text-[10px] uppercase font-bold text-gray-400 tracking-wider text-end">
                    {data.type === "Purchase" ? "Stock Value" : "Total"}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 text-sm">
                {data.items.map((item, i) => (
                  <tr key={i} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-800">
                        {item.itemName}
                      </p>
                      <p className="text-[10px] font-mono text-gray-400">
                        {item.itemNumber}
                      </p>
                    </td>
                    <td className="px-4 py-3 text-end text-gray-600">
                      {item.quantity}
                    </td>
                    <td className="px-4 py-3 text-end text-gray-600">
                      {item.isFOC ? "—" : formatCurrency(item.price)}
                    </td>
                    <td className="px-4 py-3 text-end font-semibold text-gray-800">
                      {item.isFOC ? (
                        <span className="text-emerald-600 font-bold px-1.5 py-0.5 bg-emerald-50 rounded text-[10px] uppercase tracking-wider">
                          {t("free")}
                        </span>
                      ) : (
                        formatCurrency(item.total)
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Totals Section */}
          <div className="flex justify-end p-2">
            <div className="w-64 space-y-3">
              <div className="flex justify-between text-sm text-gray-500">
                <span>{t("subtotal")}</span>
                <span className="font-medium text-gray-700">
                  {formatCurrency(subtotal)}
                </span>
              </div>
              <div className="flex justify-between text-sm text-gray-500">
                <span>
                  {t("tax")}
                  {tax}%)
                </span>
                <span className="font-medium text-gray-700">
                  {formatCurrency(taxAmt)}
                </span>
              </div>
              <div className="flex justify-between text-sm text-gray-500">
                <span>{t("advancePaid")}</span>
                <span className="font-medium text-emerald-600">
                  {formatCurrency(data.advancePaid || 0)}
                </span>
              </div>
              <div className="flex justify-between text-sm text-gray-500">
                <span>{t("balanceAmount")}</span>
                <span className="font-medium text-rose-600">
                  {formatCurrency(data.total - (data.advancePaid || 0))}
                </span>
              </div>
              <div className="flex justify-between text-base font-bold text-gray-800 border-t border-gray-100 pt-3">
                <span>{t("totalAmount")}</span>
                <span className="text-indigo-600">
                  {formatCurrency(data.total)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-5 bg-gray-50 border-t border-gray-100 flex justify-end gap-3">
          <Button variant="outline" onClick={onClose}>
            {t("close")}
          </Button>
          <Button icon={<FileDown size={16} />} onClick={generatePDF}>
            {t("downloadPdf")}
          </Button>
        </div>
      </div>
    </div>
  );
}

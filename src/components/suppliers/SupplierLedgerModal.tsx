"use client";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import { Download, History, ArrowUpRight, ArrowDownLeft } from "lucide-react";
import { format } from "date-fns";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import CurrencySymbol from "@/components/ui/CurrencySymbol";
import { useLanguage } from "../../context/LanguageContext";

interface SupplierLedgerModalProps {
  open: boolean;
  onClose: () => void;
  supplier: any | null;
}

export default function SupplierLedgerModal({
  open,
  onClose,
  supplier,
}: SupplierLedgerModalProps) {
  const { t } = useLanguage();
  if (!supplier) return null;

  const handleDownloadPDF = () => {
    const doc = new jsPDF();

    // Branded Header
    doc.setFontSize(22);
    doc.setTextColor(44, 24, 16); // #2C1810
    doc.text("Diamond Home Furniture", 105, 20, { align: "center" });

    doc.setFontSize(12);
    doc.setTextColor(122, 96, 85); // #7A6055
    doc.text("Supplier Statement / Ledger", 105, 28, { align: "center" });

    // Supplier Info
    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);
    doc.text(`Supplier Name: ${supplier.name}`, 14, 40);
    doc.text(`Supplier ID: ${supplier.supplierNumber}`, 14, 45);
    doc.text(`Mobile: ${supplier.mobile || "N/A"}`, 14, 50);
    doc.text(`Statement Date: ${format(new Date(), "dd MMM yyyy")}`, 14, 55);

    // Summary Box
    doc.setDrawColor(229, 221, 213); // #E5DDD5
    doc.setFillColor(250, 248, 246); // #FAF8F6
    doc.rect(14, 60, 182, 20, "F");

    doc.setFontSize(9);
    doc.text("Opening Balance", 20, 68);
    doc.text("Total Purchases", 85, 68);
    doc.text("CURRENT PAYABLE", 150, 68);

    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text(`INR ${supplier.openingBalance?.toLocaleString()}`, 20, 75);
    doc.text(`INR ${supplier.totalPurchases?.toLocaleString() || 0}`, 85, 75);
    doc.setTextColor(201, 168, 76); // #C9A84C
    doc.text(`INR ${supplier.creditBalance?.toLocaleString()}`, 150, 75);

    // Table
    const tableData = [...(supplier.balanceHistory || [])]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .map((entry) => [
        format(new Date(entry.date), "dd MMM yyyy"),
        entry.note ||
          (entry.type === "adjustment" ? "Balance Increase" : "Payment Made"),
        entry.paymentMethod || "N/A",
        entry.type === "adjustment" ? `+${entry.amount}` : "-",
        entry.type === "payment" ? `-${entry.amount}` : "-",
      ]);

    autoTable(doc, {
      startY: 85,
      head: [["Date", "Description", "Method", "Debit (+)", "Credit (-)"]],
      body: tableData,
      headStyles: { fillColor: [44, 24, 16], textColor: [255, 255, 255] },
      alternateRowStyles: { fillColor: [250, 248, 246] },
    });

    doc.save(
      `Supplier_Statement_${supplier.name.replace(/\s+/g, "_")}_${format(new Date(), "yyyyMMdd")}.pdf`,
    );
  };

  const balanceHistory = [...(supplier.balanceHistory || [])].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
  );

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`Supplier Statement: ${supplier.name}`}
      className="max-w-4xl"
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            {t("close")}
          </Button>
          <Button onClick={handleDownloadPDF}>
            <Download size={16} className="me-2" /> {t("downloadPdf")}
          </Button>
        </>
      }
    >
      <div className="space-y-6 print:p-0">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 rounded-xl bg-[#FAF8F6] border border-[#E5DDD5]">
            <p className="text-xs text-[#7A6055] uppercase font-bold mb-1">
              {t("openingBalance")}
            </p>
            <p className="text-xl font-bold text-[#1A1210]">
              <CurrencySymbol />{" "}
              {(supplier.openingBalance || 0).toLocaleString()}
            </p>
          </div>
          <div className="p-4 rounded-xl bg-[#FAF8F6] border border-[#E5DDD5]">
            <p className="text-xs text-[#7A6055] uppercase font-bold mb-1">
              {t("totalPurchases")}
            </p>
            <p className="text-xl font-bold text-[#1A1210]">
              <CurrencySymbol />{" "}
              {(supplier.totalPurchases || 0).toLocaleString()}
            </p>
          </div>
          <div className="p-4 rounded-xl bg-[#1A0F0A] border border-[#1A0F0A] text-white">
            <p className="text-xs opacity-60 uppercase font-bold mb-1">
              {t("currentPayable")}
            </p>
            <p className="text-xl font-bold">
              <CurrencySymbol />{" "}
              {(supplier.creditBalance || 0).toLocaleString()}
            </p>
          </div>
        </div>

        <div className="border rounded-xl overflow-hidden">
          <table className="w-full text-sm border-collapse">
            <thead className="bg-[#FAF8F6] border-b">
              <tr>
                <th className="py-3 px-4 text-start">{t("date")}</th>
                <th className="py-3 px-4 text-start">{t("description")}</th>
                <th className="py-3 px-4 text-start">{t("method")}</th>
                <th className="py-3 px-4 text-end">{t("debit")}</th>
                <th className="py-3 px-4 text-end">{t("credit")}</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {balanceHistory.map((entry, idx) => {
                const isAdjustment = entry.type === "adjustment";
                return (
                  <tr key={idx} className="hover:bg-gray-50 transition-colors">
                    <td className="py-3 px-4 text-[#7A6055]">
                      {format(new Date(entry.date), "dd MMM yyyy")}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        {isAdjustment ? (
                          <ArrowUpRight size={14} className="text-rose-500" />
                        ) : (
                          <ArrowDownLeft
                            size={14}
                            className="text-emerald-500"
                          />
                        )}
                        <span className="font-medium text-[#1A1210]">
                          {entry.note ||
                            (isAdjustment
                              ? "Balance Increase"
                              : "Payment Made")}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-4 capitalize text-[#7A6055]">
                      {entry.paymentMethod || "N/A"}
                    </td>
                    <td className="py-3 px-4 text-end font-bold text-rose-600">
                      {isAdjustment ? (
                        <>
                          <CurrencySymbol /> {entry.amount.toLocaleString()}
                        </>
                      ) : (
                        "-"
                      )}
                    </td>
                    <td className="py-3 px-4 text-end font-bold text-emerald-600">
                      {!isAdjustment ? (
                        <>
                          <CurrencySymbol /> {entry.amount.toLocaleString()}
                        </>
                      ) : (
                        "-"
                      )}
                    </td>
                  </tr>
                );
              })}
              {balanceHistory.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-10 text-center text-gray-400">
                    <History size={40} className="mx-auto mb-2 opacity-20" />
                    {t("noTransactionRecordsFound")}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </Modal>
  );
}

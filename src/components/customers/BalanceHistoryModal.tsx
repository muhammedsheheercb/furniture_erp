"use client";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { Printer } from "lucide-react";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import { formatCurrency, formatDate } from "@/lib/utils";
import { IBalanceHistory } from "@/types";
import { useLanguage } from "../../context/LanguageContext";

interface BalanceHistoryModalProps {
  open: boolean;
  onClose: () => void;
  entityName: string;
  history: IBalanceHistory[];
  currentBalance?: number;
  isSupplier?: boolean;
}

export default function BalanceHistoryModal({
  open,
  onClose,
  entityName,
  history,
  currentBalance = 0,
  isSupplier = false,
}: BalanceHistoryModalProps) {
  const { t } = useLanguage();
  // Reverse array to show the latest inserted record at the TOP
  const displayHistory =
    history && history.length > 0 ? [...history].reverse() : [];

  const handlePrintStatement = () => {
    const doc = new jsPDF();

    // Header
    doc.setFontSize(22);
    doc.text("CAFE DIRECT", 105, 20, { align: "center" });
    doc.setFontSize(14);
    doc.text(
      `${isSupplier ? "SUPPLIER" : "CUSTOMER"} ACCOUNT STATEMENT`,
      105,
      30,
      { align: "center" },
    );

    // Customer/Supplier Info
    doc.setFontSize(11);
    doc.text(
      `${isSupplier ? "Supplier" : "Customer"} Name: ${entityName}`,
      14,
      45,
    );
    doc.text(`Statement Date: ${formatDate(new Date())}`, 14, 52);
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text(`Current Balance: ${formatCurrency(currentBalance)}`, 14, 60);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);

    // Table
    autoTable(doc, {
      startY: 70,
      head: [["Date", "Entry Details", "Type", "Mode", "Amount (OMR)"]],
      body: displayHistory.map((item) => [
        item.date ? formatDate(item.date) : "Recent",
        item.note || "System Adjustment",
        item.type === "payment" ? "Payment Received" : "Sales/Adjustment",
        item.paymentMethod ? item.paymentMethod.toUpperCase() : "CREDIT",
        {
          content: `${item.type === "payment" ? "-" : "+"}${formatCurrency(item.amount || 0)}`,
          styles: {
            fontStyle: "bold",
            textColor: item.type === "payment" ? [220, 50, 50] : [30, 140, 30],
          },
        },
      ]),
      styles: { fontSize: 9 },
      headStyles: { fillColor: [63, 81, 181] },
    });

    doc.save(`Statement-${entityName}-${new Date().getTime()}.pdf`);
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`Financial Record: ${entityName}`}
      size="lg"
    >
      <div className="flex flex-col gap-4">
        <div className="overflow-x-auto bg-white ring-1 ring-gray-100 rounded-2xl shadow-sm">
          <table className="w-full text-start min-w-[600px]">
            <thead className="bg-gray-50/80 border-b border-gray-100">
              <tr>
                <th className="px-6 py-4 text-[10px] font-extrabold text-gray-500 uppercase tracking-widest">
                  {t("transactionDate")}
                </th>
                <th className="px-6 py-4 text-[10px] font-extrabold text-gray-500 uppercase tracking-widest text-end">
                  {t("amount")}
                </th>
                <th className="px-6 py-4 text-[10px] font-extrabold text-gray-500 uppercase tracking-widest text-center">
                  {t("paymentMode")}
                </th>
                <th className="px-6 py-4 text-[10px] font-extrabold text-gray-500 uppercase tracking-widest">
                  {t("entryDetails")}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {displayHistory.length > 0 ? (
                displayHistory.map((item, idx) => (
                  <tr
                    key={idx}
                    className="hover:bg-gray-50/80 transition-all group"
                  >
                    <td className="px-6 py-5 text-sm font-semibold text-gray-700 whitespace-nowrap">
                      {item.date ? formatDate(item.date) : "Recent"}
                    </td>
                    <td
                      className={`px-6 py-5 text-sm font-black text-end whitespace-nowrap ${item.type === "payment" ? "text-rose-500" : "text-emerald-500"}`}
                    >
                      {item.type === "payment" ? "-" : "+"}
                      {formatCurrency(item.amount || 0)}
                    </td>
                    <td className="px-6 py-5 text-center">
                      <span
                        className={`inline-flex px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider border-2 
                        ${
                          item.paymentMethod === "credit" ||
                          (item.type === "adjustment" && !item.paymentMethod)
                            ? "bg-amber-50 text-amber-700 border-amber-200"
                            : item.paymentMethod === "cash"
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                              : "bg-indigo-50 text-indigo-700 border-indigo-200"
                        }`}
                      >
                        {item.paymentMethod === "credit"
                          ? "CREDIT"
                          : !item.paymentMethod && item.type === "adjustment"
                            ? "CREDIT/Old"
                            : item.paymentMethod || "CASH"}
                      </span>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex flex-col gap-0.5">
                        <span className="text-xs font-bold text-gray-700">
                          {item.note || "System Adjustment"}
                        </span>
                        {item.type === "payment" && (
                          <span className="text-[10px] text-gray-400 font-medium">
                            {t("recordedPaymentSubtractedFromDebt")}
                          </span>
                        )}
                        {item.type === "adjustment" && (
                          <span className="text-[10px] text-gray-400 font-medium">
                            {t("balanceEntryAddedToRecord")}
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="px-6 py-24 text-center">
                    <div className="flex flex-col items-center gap-2 opacity-30">
                      <p className="text-2xl font-black text-gray-300">
                        {t("void")}
                      </p>
                      <p className="text-sm font-medium text-gray-400 italic">
                        {t("noHistoricalActivitiesLoggedFor")}
                      </p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="bg-gray-50/50 p-4 rounded-xl flex items-center justify-between border border-gray-100">
          <div className="flex flex-col">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">
              {t("currentMultirecordBalance")}
            </span>
            <span
              className={`text-xl font-black ${currentBalance > 0 ? "text-amber-600" : currentBalance < 0 ? "text-rose-600" : "text-emerald-600"}`}
            >
              {formatCurrency(currentBalance)}
            </span>
          </div>
          <Button
            icon={<Printer size={16} />}
            onClick={handlePrintStatement}
            className="bg-indigo-600 hover:bg-indigo-700"
          >
            {t("printFullStatement")}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

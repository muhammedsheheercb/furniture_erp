"use client";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import { Download, History, ArrowUpRight, ArrowDownLeft } from "lucide-react";
import { format } from "date-fns";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import CurrencySymbol from "@/components/ui/CurrencySymbol";

interface CustomerLedgerModalProps {
  open: boolean;
  onClose: () => void;
  customer: any | null;
}

export default function CustomerLedgerModal({
  open,
  onClose,
  customer,
}: CustomerLedgerModalProps) {
  if (!customer) return null;

  const handleDownloadPDF = () => {
    const doc = new jsPDF();
    
    // Branded Header
    doc.setFontSize(22);
    doc.setTextColor(44, 24, 16); // #2C1810
    doc.text("Diamond Home Furniture", 105, 20, { align: "center" });
    
    doc.setFontSize(12);
    doc.setTextColor(122, 96, 85); // #7A6055
    doc.text("Customer Statement / Ledger", 105, 28, { align: "center" });
    
    // Customer Info
    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);
    doc.text(`Customer Name: ${customer.name}`, 14, 40);
    doc.text(`Customer ID: ${customer.customerNumber}`, 14, 45);
    doc.text(`Mobile: ${customer.mobile || "N/A"}`, 14, 50);
    doc.text(`Statement Date: ${format(new Date(), "dd MMM yyyy")}`, 14, 55);

    // Summary Box
    doc.setDrawColor(229, 221, 213); // #E5DDD5
    doc.setFillColor(250, 248, 246); // #FAF8F6
    doc.rect(14, 60, 182, 20, "F");
    
    doc.setFontSize(9);
    doc.text("Opening Balance", 20, 68);
    doc.text("Total Sales", 85, 68);
    doc.text("CURRENT BALANCE", 150, 68);
    
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text(`OMR ${customer.openingBalance?.toLocaleString()}`, 20, 75);
    doc.text(`OMR ${customer.totalSales?.toLocaleString() || 0}`, 85, 75);
    doc.setTextColor(201, 168, 76); // #C9A84C
    doc.text(`OMR ${customer.creditBalance?.toLocaleString()}`, 150, 75);

    // Table
    const tableData = [...(customer.balanceHistory || [])]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .map(entry => [
        format(new Date(entry.date), "dd MMM yyyy"),
        entry.note || (entry.type === "adjustment" ? "Balance Increase" : "Payment Received"),
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

    doc.save(`Statement_${customer.name.replace(/\s+/g, '_')}_${format(new Date(), "yyyyMMdd")}.pdf`);
  };

  const balanceHistory = [...(customer.balanceHistory || [])].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`Customer Statement: ${customer.name}`}
      className="max-w-4xl"
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
          <Button onClick={handleDownloadPDF}>
            <Download size={16} className="mr-2" /> Download PDF
          </Button>
        </>
      }
    >
      <div className="space-y-6 print:p-0">
        {/* Header Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 rounded-xl bg-[#FAF8F6] border border-[#E5DDD5]">
            <p className="text-xs text-[#7A6055] uppercase font-bold mb-1">Opening Balance</p>
            <p className="text-xl font-bold text-[#1A1210]"><CurrencySymbol /> {(customer.openingBalance || 0).toLocaleString()}</p>
          </div>
          <div className="p-4 rounded-xl bg-[#FAF8F6] border border-[#E5DDD5]">
            <p className="text-xs text-[#7A6055] uppercase font-bold mb-1">Total Sales</p>
            <p className="text-xl font-bold text-[#1A1210]"><CurrencySymbol /> {(customer.totalSales || 0).toLocaleString()}</p>
          </div>
          <div className="p-4 rounded-xl bg-[#1A0F0A] border border-[#1A0F0A] text-white">
            <p className="text-xs opacity-60 uppercase font-bold mb-1">Current Balance</p>
            <p className="text-xl font-bold"><CurrencySymbol /> {(customer.creditBalance || 0).toLocaleString()}</p>
          </div>
        </div>

        {/* Ledger Table */}
        <div className="border rounded-xl overflow-hidden">
          <table className="w-full text-sm border-collapse">
            <thead className="bg-[#FAF8F6] border-b">
              <tr>
                <th className="py-3 px-4 text-left">Date</th>
                <th className="py-3 px-4 text-left">Description</th>
                <th className="py-3 px-4 text-left">Method</th>
                <th className="py-3 px-4 text-right">Debit (+)</th>
                <th className="py-3 px-4 text-right">Credit (-)</th>
                <th className="py-3 px-4 text-right">Balance</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {/* Calculate running balance for the display */}
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
                          <ArrowDownLeft size={14} className="text-emerald-500" />
                        )}
                        <span className="font-medium text-[#1A1210]">{entry.note || (isAdjustment ? "Balance Increase" : "Payment Received")}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 capitalize text-[#7A6055]">{entry.paymentMethod || "N/A"}</td>
                    <td className="py-3 px-4 text-right font-bold text-rose-600">
                      {isAdjustment ? <><CurrencySymbol /> {entry.amount.toLocaleString()}</> : "-"}
                    </td>
                    <td className="py-3 px-4 text-right font-bold text-emerald-600">
                      {!isAdjustment ? <><CurrencySymbol /> {entry.amount.toLocaleString()}</> : "-"}
                    </td>
                    <td className="py-3 px-4 text-right font-bold text-[#1A1210]">
                        {/* We don't have a point-in-time balance in history, so we show the amount only or skip if complex */}
                        -
                    </td>
                  </tr>
                );
              })}
              {balanceHistory.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-gray-400">
                    <History size={40} className="mx-auto mb-2 opacity-20" />
                    No transaction records found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      
      {/* Print Styles */}
      <style jsx global>{`
        @media print {
          body * { visibility: hidden; }
          .print-content, .print-content * { visibility: visible; }
          .print-content { position: absolute; left: 0; top: 0; width: 100%; }
          .modal-footer, .modal-header-close { display: none !important; }
        }
      `}</style>
    </Modal>
  );
}

import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { formatCurrency, formatDate } from "./utils";

export interface InvoiceItem {
    itemName: string;
    itemNumber: string;
    quantity: number;
    price: number;
    total: number;
    isFOC?: boolean;
    manufacturingDate?: string;
    expiryDate?: string;
}

export interface InvoiceData {
    number: string;
    customerOrSupplier: string;
    customerOrSupplierNumber: string;
    customerOrSupplierMobile?: string;
    date: Date | string;
    paymentType: string;
    items: InvoiceItem[];
    subtotal: number;
    tax: number;
    total: number;
    type: "Sale" | "Purchase";
    isTaxInvoice?: boolean;
}

export const generateInvoicePDF = (data: InvoiceData) => {
    const doc = new jsPDF();
    
    const taxBillName = "cafe tax bill";
    const taxNumber = "12345678";
    const crNo = "345678";
    const place = "Oman";

    doc.setFontSize(18);
    if (data.isTaxInvoice) {
        doc.text(taxBillName, 14, 20);
        doc.setFontSize(10);
        doc.text(`Tax No: ${taxNumber} | CR No: ${crNo} | Place: ${place}`, 14, 26);
    } else {
        doc.text(`Cafe Direct`, 14, 20);
        doc.setFontSize(11);
        doc.text(`${data.type} Invoice`, 14, 28);
    }
    
    doc.setFontSize(11);
    const startY = data.isTaxInvoice ? 38 : 38;
    
    doc.text(`${data.type === "Sale" ? "Customer" : "Supplier"}: ${data.customerOrSupplier}`, 14, startY);
    doc.text(`Number: ${data.customerOrSupplierNumber}`, 14, startY + 7);
    if (data.customerOrSupplierMobile) {
        doc.text(`Mobile: ${data.customerOrSupplierMobile}`, 14, startY + 14);
    }
    doc.text(`Invoice #: ${data.number}`, 120, startY);
    doc.text(`Date: ${formatDate(data.date)}`, 120, startY + 7);
    doc.text(`Payment: ${data.paymentType.toUpperCase()}`, 120, startY + 14);

    const taxAmt = data.subtotal * (data.tax / 100);

    autoTable(doc, {
        startY: startY + 25,
        head: [["#", "Item", "Qty", "Price", data.type === "Purchase" ? "Stock Value" : "Total"]],
        body: data.items.map((item, i) => [
            i + 1,
            item.itemName + (item.isFOC ? " (FOC)" : ""),
            item.quantity,
            item.isFOC ? "0.00" : formatCurrency(item.price),
            formatCurrency(item.total)
        ]),
        foot: [
            ["", "", "", "Subtotal", formatCurrency(data.subtotal)],
            ["", "", "", `Tax (${data.tax}%)`, formatCurrency(taxAmt)],
            ["", "", "", "Total", formatCurrency(data.total)],
        ],
        styles: { fontSize: 8.5 },
        headStyles: { fillColor: [63, 81, 181] },
        footStyles: { fontStyle: "bold" },
    });

    doc.save(`invoice-${data.number}.pdf`);
};

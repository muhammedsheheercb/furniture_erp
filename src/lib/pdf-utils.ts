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
    advancePaid?: number;
    customerAddress?: string;
    deliveryAddress?: string;
    deliveryDate?: string | Date;
}

export const generateInvoicePDF = (data: InvoiceData) => {
    const doc = new jsPDF();
    
    const taxBillName = "DIAMOND HOME";
    const taxNumber = "12345678";
    const crNo = "345678";
    const place = "Oman";

    doc.setFontSize(18);
    doc.text(`DIAMOND HOME`, 14, 20);
    doc.setFontSize(11);
    if (data.isTaxInvoice) {
        doc.text(`Tax Invoice`, 14, 28);
        doc.setFontSize(10);
        doc.text(`Tax No: ${taxNumber} | CR No: ${crNo} | Place: ${place}`, 14, 34);
    } else {
        doc.text(`${data.type} Invoice`, 14, 28);
    }
    
    doc.setFontSize(11);
    const startY = data.isTaxInvoice ? 38 : 38;
    
    doc.text(`${data.type === "Sale" ? "Customer" : "Supplier"}: ${data.customerOrSupplier}`, 14, startY);
    doc.text(`Number: ${data.customerOrSupplierNumber}`, 14, startY + 7);
    if (data.customerOrSupplierMobile) {
        doc.text(`Mobile: ${data.customerOrSupplierMobile}`, 14, startY + 14);
    } else if (data.type === "Sale" && (data as any).customerMobile) {
        doc.text(`Mobile: ${(data as any).customerMobile}`, 14, startY + 14);
    }
    if (data.customerAddress) {
        doc.setFontSize(9);
        doc.text(`Address: ${data.customerAddress}`, 14, startY + 21, { maxWidth: 100 });
        doc.setFontSize(11);
    }

    doc.text(`Invoice #: ${data.number}`, 120, startY);
    doc.text(`Date: ${formatDate(data.date)}`, 120, startY + 7);
    doc.text(`Payment: ${data.paymentType.toUpperCase()}`, 120, startY + 14);
    if (data.deliveryDate) {
        doc.text(`Delivery Date: ${formatDate(data.deliveryDate)}`, 120, startY + 21);
    }

    if (data.deliveryAddress) {
        doc.setFontSize(9);
        doc.text(`Delivery Address: ${data.deliveryAddress}`, 14, startY + 28, { maxWidth: 180 });
        doc.setFontSize(11);
    }

    const taxAmt = data.subtotal * (data.tax / 100);

    autoTable(doc, {
        startY: startY + 45,
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
            ["", "", "", "Advance Paid", formatCurrency(data.advancePaid || 0)],
            ["", "", "", "Balance Amount", formatCurrency(data.total - (data.advancePaid || 0))],
        ],
        styles: { fontSize: 8.5 },
        headStyles: { fillColor: [63, 81, 181] },
        footStyles: { fontStyle: "bold" },
    });

    doc.save(`invoice-${data.number}.pdf`);
};

export const generateQuotationPDF = (data: any) => {
    const doc = new jsPDF();
    
    doc.setFontSize(18);
    doc.text(`DIAMOND HOME`, 14, 20);
    doc.setFontSize(12);
    doc.text(`Furniture Quotation`, 14, 28);
    
    doc.setFontSize(11);
    doc.text(`Customer: ${data.customerName}`, 14, 38);
    if (data.customerMobile) {
        doc.text(`Mobile: ${data.customerMobile}`, 14, 45);
    }
    if (data.customerAddress || (data as any).address) {
        doc.setFontSize(9);
        doc.text(`Address: ${data.customerAddress || (data as any).address}`, 14, 52, { maxWidth: 100 });
        doc.setFontSize(11);
    }
    doc.text(`Quotation #: ${data.quotationNumber}`, 120, 38);
    doc.text(`Date: ${formatDate(data.date)}`, 120, 45);
    if (data.validUntil) {
        doc.text(`Valid Until: ${formatDate(data.validUntil)}`, 120, 52);
    }
    if (data.deliveryDate) {
        doc.text(`Delivery Date: ${formatDate(data.deliveryDate)}`, 120, 59);
    }

    autoTable(doc, {
        startY: 70,
        head: [["#", "Item", "Color", "Material", "Size", "Qty", "Price", "Total"]],
        body: data.items.map((item: any, i: number) => [
            i + 1,
            item.itemName,
            item.color || "—",
            item.material || "—",
            item.size || "—",
            item.quantity,
            formatCurrency(item.price),
            formatCurrency(item.total)
        ]),
        foot: [
            ["", "", "", "", "", "", "Subtotal", formatCurrency(data.subtotal)],
            ["", "", "", "", "", "", `Tax (${data.tax || 0}%)`, formatCurrency(data.subtotal * (data.tax || 0) / 100)],
            ["", "", "", "", "", "", "Total", formatCurrency(data.total)],
        ],
        styles: { fontSize: 8.5 },
        headStyles: { fillColor: [139, 94, 60] }, // Brownish for furniture
        footStyles: { fontStyle: "bold" },
    });

    if (data.notes) {
        const finalY = (doc as any).lastAutoTable.finalY + 10;
        doc.setFontSize(10);
        doc.text("Notes:", 14, finalY);
        doc.setFontSize(9);
        doc.setTextColor(100);
        doc.text(data.notes, 14, finalY + 7);
    }

    doc.save(`quotation-${data.quotationNumber}.pdf`);
};

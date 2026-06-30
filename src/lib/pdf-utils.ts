import jsPDF from "jspdf";
import { formatCurrency, formatDate } from "./utils";

export interface InvoiceItem {
    itemName: string;
    itemNumber: string;
    quantity: number;
    price: number;
    discount?: number;
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
    discount?: number;
    total: number;
    type: "Sale" | "Purchase";
    isTaxInvoice?: boolean;
    advancePaid?: number;
    customerAddress?: string;
    deliveryAddress?: string;
    deliveryDate?: string | Date;
    customerMobile?: string;
    createdBy?: string;
}


const containsArabic = (text: string) => {
    const arabicPattern = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/;
    return arabicPattern.test(text);
};

export const generateInvoicePDF = (data: InvoiceData) => {
    const isArabic = containsArabic(data.customerAddress || "") || containsArabic(data.customerOrSupplier || "");
    const dir = isArabic ? "rtl" : "ltr";
    const totalDiscount = data.items.reduce((s, i) => s + (i.discount || 0), 0);
    const hasDiscount = totalDiscount > 0;

    const html = `
        <div style="font-family: Arial, sans-serif; padding: 40px; color: #333; direction: ${dir}; text-align: ${isArabic ? 'right' : 'left'}">
            <div style="display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #3F51B5; padding-bottom: 20px; margin-bottom: 30px">
                <div>
                    <h1 style="margin: 0; color: #3F51B5; font-size: 28px">DIAMOND HOME</h1>
                    <h2 style="margin: 5px 0 0; color: #666; font-size: 18px; text-transform: uppercase; letter-spacing: 2px">${data.isTaxInvoice ? 'Tax Invoice' : `${data.type} Invoice`}</h2>
                    ${data.isTaxInvoice ? `
                    <div style="margin-top: 10px; font-size: 11px; color: #999">
                        Tax No: 12345678 | CR No: 345678 | Oman
                    </div>` : ''}
                </div>
                <div style="text-align: right">
                    <p style="margin: 0; font-weight: bold; color: #3F51B5">Invoice #: ${data.number}</p>
                    <p style="margin: 5px 0 0; font-size: 14px; color: #999">Date: ${formatDate(data.date)}</p>
                    <p style="margin: 5px 0 0; font-size: 12px; color: #666; text-transform: uppercase">${data.paymentType}</p>
                </div>
            </div>

            <div style="display: grid; grid-template-columns: 1.5fr 1fr; gap: 40px; margin-bottom: 40px">
                <div style="background: #F8F9FA; padding: 20px; border-radius: 12px; border: 1px solid #E9ECEF">
                    <h3 style="margin: 0 0 10px; font-size: 11px; text-transform: uppercase; color: #6C757D; letter-spacing: 1px">${data.type === "Sale" ? "Customer" : "Supplier"} Details</h3>
                    <p style="margin: 0 0 5px; font-size: 18px; font-weight: bold; color: #212529">${data.customerOrSupplier}</p>
                    <p style="margin: 0 0 5px; font-size: 14px; color: #495057">ID: ${data.customerOrSupplierNumber}</p>
                    ${(data.customerOrSupplierMobile || (data as any).customerMobile) ? `<p style="margin: 0 0 5px; font-size: 14px; color: #495057">Mobile: ${data.customerOrSupplierMobile || (data as any).customerMobile}</p>` : ''}
                    ${data.customerAddress ? `<p style="margin: 0; font-size: 13px; color: #6C757D; line-height: 1.4">${data.customerAddress}</p>` : ''}
                </div>
                <div style="display: flex; flex-direction: column; gap: 10px">
                    ${data.deliveryDate ? `
                    <div style="background: #FFF; padding: 12px; border-radius: 8px; border: 1px solid #E9ECEF">
                        <span style="font-size: 11px; text-transform: uppercase; color: #6C757D">Delivery Date:</span>
                        <span style="float: right; font-weight: bold">${formatDate(data.deliveryDate)}</span>
                    </div>` : ''}
                    ${data.deliveryAddress ? `
                    <div style="background: #FFF; padding: 12px; border-radius: 8px; border: 1px solid #E9ECEF">
                        <h4 style="margin: 0 0 5px; font-size: 11px; text-transform: uppercase; color: #6C757D">Delivery Address:</h4>
                        <p style="margin: 0; font-size: 12px; color: #495057">${data.deliveryAddress}</p>
                    </div>` : ''}
                </div>
            </div>

            <table style="width: 100%; border-collapse: collapse; margin-bottom: 30px">
                <thead>
                    <tr style="background: #3F51B5; color: #fff">
                        <th style="padding: 12px; text-align: center; border: 1px solid #3F51B5; width: 40px">#</th>
                        <th style="padding: 12px; text-align: left; border: 1px solid #3F51B5">Description</th>
                        <th style="padding: 12px; text-align: center; border: 1px solid #3F51B5; width: 60px">Qty</th>
                        <th style="padding: 12px; text-align: right; border: 1px solid #3F51B5; width: 100px">Unit Price</th>
                        ${hasDiscount ? `<th style="padding: 12px; text-align: right; border: 1px solid #3F51B5; width: 100px">Disc%</th>` : ''}
                        <th style="padding: 12px; text-align: right; border: 1px solid #3F51B5; width: 120px">Total</th>
                    </tr>
                </thead>
                <tbody>
                    ${data.items.map((item, i) => `
                        <tr>
                            <td style="padding: 12px; text-align: center; border: 1px solid #DEE2E6">${i + 1}</td>
                            <td style="padding: 12px; border: 1px solid #DEE2E6">
                                <div style="font-weight: bold; color: #212529">${item.itemName}${item.isFOC ? ' (FOC)' : ''}</div>
                                <div style="font-size: 11px; color: #6C757D">${item.itemNumber || ''}</div>
                            </td>
                            <td style="padding: 12px; text-align: center; border: 1px solid #DEE2E6; font-weight: 500">${item.quantity}</td>
                            <td style="padding: 12px; text-align: right; border: 1px solid #DEE2E6">${item.isFOC ? '0.00' : formatCurrency(item.price)}</td>
                            ${hasDiscount ? `<td style="padding: 12px; text-align: right; border: 1px solid #DEE2E6; color: #DC3545">${item.discount || 0}%</td>` : ''}
                            <td style="padding: 12px; text-align: right; border: 1px solid #DEE2E6; font-weight: bold">${formatCurrency(item.total)}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>

            <div style="display: flex; justify-content: flex-end; margin-bottom: 40px">
                <div style="width: 250px">
                    <div style="display: flex; justify-content: space-between; padding: 5px 0">
                        <span style="color: #6C757D">Subtotal:</span>
                        <span style="font-weight: 500">${formatCurrency(data.items.reduce((acc, it) => acc + (it.price * it.quantity), 0))}</span>
                    </div>
                    ${hasDiscount ? `
                    <div style="display: flex; justify-content: space-between; padding: 5px 0">
                        <span style="color: #6C757D">Item Discount:</span>
                        <span style="font-weight: 500; color: #DC3545">- ${formatCurrency(data.items.reduce((acc, it) => acc + (it.price * it.quantity * (it.discount || 0) / 100), 0))}</span>
                    </div>` : ''}
                    ${data.discount ? `
                    <div style="display: flex; justify-content: space-between; padding: 5px 0">
                        <span style="color: #6C757D">Discount:</span>
                        <span style="font-weight: 500; color: #DC3545">- ${formatCurrency(data.subtotal * (data.discount / 100))}</span>
                    </div>` : ''}
                    ${data.tax ? `
                    <div style="display: flex; justify-content: space-between; padding: 5px 0">
                        <span style="color: #6C757D">Tax (${data.tax}%):</span>
                        <span style="font-weight: 500">${formatCurrency(data.subtotal * (data.tax / 100))}</span>
                    </div>` : ''}
                    <div style="display: flex; justify-content: space-between; padding: 15px 0; border-top: 2px solid #3F51B5; margin-top: 10px">
                        <span style="font-weight: bold; font-size: 18px; color: #212529">Grand Total:</span>
                        <span style="font-weight: bold; font-size: 18px; color: #3F51B5">${formatCurrency(data.total)}</span>
                    </div>
                    ${data.advancePaid ? `
                    <div style="display: flex; justify-content: space-between; padding: 5px 0; font-size: 13px">
                        <span style="color: #6C757D">Advance Paid:</span>
                        <span style="color: #28A745; font-weight: 500">(-) ${formatCurrency(data.advancePaid)}</span>
                    </div>
                    <div style="display: flex; justify-content: space-between; padding: 5px 0; font-weight: bold; color: #DC3545">
                        <span>Balance Due:</span>
                        <span>${formatCurrency(data.total - data.advancePaid)}</span>
                    </div>` : ''}
                </div>
            </div>

            <div style="margin-top: 60px; border-top: 1px solid #E9ECEF; padding-top: 20px; display: flex; justify-content: space-between; align-items: flex-end;">
                <div style="font-size: 10px; color: #6C757D;">
                    ${data.createdBy ? `<p style="margin: 0;"><strong>Sales Person:</strong> ${data.createdBy}</p>` : ''}
                    <p style="margin: 3px 0 0 0;"><strong>Printed on:</strong> ${new Date().toLocaleString()}</p>
                </div>
                <div style="text-align: center; width: 150px;">
                    <div style="border-bottom: 1px solid #333; margin-bottom: 5px;"></div>
                    <p style="font-size: 10px; color: #6C757D; margin: 0;">Authorized Signature</p>
                </div>
            </div>
        </div>
    `;

    const element = document.createElement("div");
    element.innerHTML = html;
    
    import("html2pdf.js").then((html2pdf: any) => {
        const opt = {
            margin: 0,
            filename: `invoice-${data.number}.pdf`,
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 2, useCORS: true },
            jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
        };
        html2pdf.default().from(element).set(opt).save();
    });
};

export const generateQuotationPDF = (data: any) => {
    const isArabic = containsArabic(data.notes || "") || containsArabic(data.customerName || "");
    const dir = isArabic ? "rtl" : "ltr";
    const totalItemDiscount = data.items.reduce((s: number, i: any) => s + (i.price * i.quantity * (i.discount || 0) / 100), 0);
    const extraDiscountAmount = data.subtotal * (data.discount || 0) / 100;
    const totalDiscountAmount = totalItemDiscount + extraDiscountAmount;
    const hasAnyDiscount = totalDiscountAmount > 0;
    
    const html = `
        <div style="font-family: Arial, sans-serif; padding: 40px; color: #333; direction: ${dir}; text-align: ${isArabic ? 'right' : 'left'}">
            <div style="display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #8B5E3C; padding-bottom: 20px; margin-bottom: 30px">
                <div>
                    <h1 style="margin: 0; color: #8B5E3C; font-size: 28px">DIAMOND HOME</h1>
                    <h2 style="margin: 5px 0 0; color: #666; font-size: 18px; text-transform: uppercase; letter-spacing: 2px">Furniture Quotation</h2>
                </div>
                <div style="text-align: right">
                    <p style="margin: 0; font-weight: bold; color: #8B5E3C">Quotation #: ${data.quotationNumber}</p>
                    <p style="margin: 5px 0 0; font-size: 14px; color: #999">Date: ${formatDate(data.date)}</p>
                </div>
            </div>

            <div style="display: grid; grid-template-columns: 1.5fr 1fr; gap: 40px; margin-bottom: 40px">
                <div style="background: #FAF8F6; padding: 20px; border-radius: 12px; border: 1px solid #E5DDD5">
                    <h3 style="margin: 0 0 10px; font-size: 11px; text-transform: uppercase; color: #A89080; letter-spacing: 1px">Bill To</h3>
                    <p style="margin: 0 0 5px; font-size: 18px; font-weight: bold; color: #2C1810">${data.customerName}</p>
                    ${data.customerMobile ? `<p style="margin: 0 0 5px; font-size: 14px; color: #666">Mobile: ${data.customerMobile}</p>` : ''}
                    ${(data.customerAddress || data.address) ? `<p style="margin: 0; font-size: 13px; color: #7A6055; line-height: 1.4">${data.customerAddress || data.address}</p>` : ''}
                </div>
                <div style="display: flex; flex-direction: column; gap: 10px">
                    ${data.validUntil ? `
                    <div style="background: #FFF; padding: 12px; border-radius: 8px; border: 1px solid #E5DDD5">
                        <span style="font-size: 11px; text-transform: uppercase; color: #A89080">Valid Until:</span>
                        <span style="float: right; font-weight: bold">${formatDate(data.validUntil)}</span>
                    </div>` : ''}
                    ${data.deliveryDate ? `
                    <div style="background: #FFF; padding: 12px; border-radius: 8px; border: 1px solid #E5DDD5">
                        <span style="font-size: 11px; text-transform: uppercase; color: #A89080">Estimated Delivery:</span>
                        <span style="float: right; font-weight: bold">${formatDate(data.deliveryDate)}</span>
                    </div>` : ''}
                </div>
            </div>

            <table style="width: 100%; border-collapse: collapse; margin-bottom: 30px">
                <thead>
                    <tr style="background: #8B5E3C; color: #fff">
                        <th style="padding: 12px; text-align: center; border: 1px solid #8B5E3C; width: 40px">#</th>
                        <th style="padding: 12px; text-align: left; border: 1px solid #8B5E3C">Description</th>
                        <th style="padding: 12px; text-align: center; border: 1px solid #8B5E3C">Color</th>
                        <th style="padding: 12px; text-align: center; border: 1px solid #8B5E3C; width: 60px">Qty</th>
                        <th style="padding: 12px; text-align: right; border: 1px solid #8B5E3C; width: 100px">Unit Price</th>
                        ${totalItemDiscount > 0 ? `<th style="padding: 12px; text-align: right; border: 1px solid #8B5E3C; width: 100px">Disc%</th>` : ''}
                        <th style="padding: 12px; text-align: right; border: 1px solid #8B5E3C; width: 120px">Total</th>
                    </tr>
                </thead>
                <tbody>
                    ${data.items.map((item: any, i: number) => `
                        <tr>
                            <td style="padding: 12px; text-align: center; border: 1px solid #E5DDD5">${i + 1}</td>
                            <td style="padding: 12px; border: 1px solid #E5DDD5">
                                <div style="font-weight: bold; color: #2C1810">${item.itemName}</div>
                                <div style="font-size: 11px; color: #888">${item.material || ''}</div>
                            </td>
                            <td style="padding: 12px; text-align: center; border: 1px solid #E5DDD5; font-size: 13px; color: #666">
                                ${item.color || '—'}
                            </td>
                            <td style="padding: 12px; text-align: center; border: 1px solid #E5DDD5; font-weight: 500">${item.quantity}</td>
                            <td style="padding: 12px; text-align: right; border: 1px solid #E5DDD5">${formatCurrency(item.price)}</td>
                            ${totalItemDiscount > 0 ? `<td style="padding: 12px; text-align: right; border: 1px solid #E5DDD5; color: #DC3545">${item.discount || 0}%</td>` : ''}
                            <td style="padding: 12px; text-align: right; border: 1px solid #E5DDD5; font-weight: bold">${formatCurrency(item.total)}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>

            <div style="display: flex; justify-content: flex-end; margin-bottom: 40px">
                <div style="width: 250px">
                    <div style="display: flex; justify-content: space-between; padding: 5px 0">
                        <span style="color: #7A6055">Subtotal:</span>
                        <span style="font-weight: 500">${formatCurrency(data.subtotal + totalItemDiscount)}</span>
                    </div>
                    ${hasAnyDiscount ? `
                    <div style="display: flex; justify-content: space-between; padding: 5px 0">
                        <span style="color: #7A6055">Discount:</span>
                        <span style="font-weight: 500; color: #DC3545">- ${formatCurrency(totalDiscountAmount)}</span>
                    </div>` : ''}
                    <div style="display: flex; justify-content: space-between; padding: 5px 0">
                        <span style="color: #7A6055">VAT (${data.tax || 0}%):</span>
                        <span style="font-weight: 500">${formatCurrency(data.subtotal * (data.tax || 0) / 100)}</span>
                    </div>
                    <div style="display: flex; justify-content: space-between; padding: 15px 0; border-top: 2px solid #8B5E3C; margin-top: 10px">
                        <span style="font-weight: bold; font-size: 18px; color: #2C1810">Grand Total:</span>
                        <span style="font-weight: bold; font-size: 18px; color: #8B5E3C">${formatCurrency(data.total)}</span>
                    </div>
                </div>
            </div>

            ${data.notes ? `
            <div style="background: #FAF8F6; padding: 20px; border-radius: 12px; border-left: 4px solid #8B5E3C">
                <h3 style="margin: 0 0 10px; font-size: 12px; text-transform: uppercase; color: #8B5E3C">Notes & Conditions</h3>
                <p style="margin: 0; font-size: 14px; line-height: 1.5; color: #444; white-space: pre-wrap">${data.notes}</p>
            </div>
            ` : ''}

            <div style="margin-top: 60px; border-top: 1px solid #F0EAE3; padding-top: 20px; display: flex; justify-content: space-between; align-items: flex-end;">
                <div style="font-size: 10px; color: #A89080;">
                    ${data.createdBy ? `<p style="margin: 0;"><strong>Sales Person:</strong> ${data.createdBy}</p>` : ''}
                    <p style="margin: 3px 0 0 0;"><strong>Printed on:</strong> ${new Date().toLocaleString()}</p>
                </div>
                <div style="text-align: center; width: 150px;">
                    <div style="border-bottom: 1px solid #333; margin-bottom: 5px;"></div>
                    <p style="font-size: 10px; color: #A89080; margin: 0;">Authorized Signature</p>
                </div>
            </div>
        </div>
    `;

    const element = document.createElement("div");
    element.innerHTML = html;
    
    import("html2pdf.js").then((html2pdf: any) => {
        const opt = {
            margin: 0,
            filename: `quotation-${data.quotationNumber}.pdf`,
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 2, useCORS: true },
            jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
        };
        html2pdf.default().from(element).set(opt).save();
    });
};

export const generateProductionJobCardPDF = (data: any) => {
    const isArabic = containsArabic(data.remarks || "") || containsArabic(data.customerName || "");
    const dir = isArabic ? "rtl" : "ltr";
    
    const html = `
        <div style="font-family: Arial, sans-serif; padding: 40px; color: #333; direction: ${dir}; text-align: ${isArabic ? 'right' : 'left'}">
            <div style="display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #2C1810; padding-bottom: 20px; margin-bottom: 30px">
                <div>
                    <h1 style="margin: 0; color: #2C1810; font-size: 28px">DIAMOND HOME</h1>
                    <h2 style="margin: 5px 0 0; color: #666; font-size: 18px; text-transform: uppercase; letter-spacing: 2px">Production Job Card</h2>
                </div>
                <div style="text-align: right">
                    <p style="margin: 0; font-weight: bold; color: #CA6F1E">Sale #: ${data.saleNumber}</p>
                    <p style="margin: 5px 0 0; font-size: 14px; color: #999">Date: ${formatDate(new Date())}</p>
                </div>
            </div>

            <div style="display: grid; grid-template-cols: 1fr 1fr; gap: 20px; margin-bottom: 40px">
                <div style="background: #F9F7F5; padding: 20px; border-radius: 12px; border: 1px solid #E5DDD5">
                    <h3 style="margin: 0 0 10px; font-size: 12px; text-transform: uppercase; color: #A89080">Customer Details</h3>
                    <p style="margin: 0; font-size: 18px; font-weight: bold; color: #2C1810">${data.customerName}</p>
                </div>
                ${data.deliveryDate ? `
                <div style="background: #FFF5F5; padding: 20px; border-radius: 12px; border: 1px solid #FED7D7; text-align: right">
                    <h3 style="margin: 0 0 10px; font-size: 12px; text-transform: uppercase; color: #C53030">Deadline</h3>
                    <p style="margin: 0; font-size: 18px; font-weight: bold; color: #C53030">${formatDate(data.deliveryDate)}</p>
                </div>
                ` : ''}
            </div>

            <table style="width: 100%; border-collapse: collapse; margin-bottom: 40px">
                <thead>
                    <tr style="background: #2C1810; color: #fff">
                        <th style="padding: 12px; text-align: center; border: 1px solid #2C1810; width: 40px">#</th>
                        <th style="padding: 12px; text-align: left; border: 1px solid #2C1810">Item Name</th>
                        <th style="padding: 12px; text-align: center; border: 1px solid #2C1810">Color</th>
                        <th style="padding: 12px; text-align: center; border: 1px solid #2C1810">Size</th>
                        <th style="padding: 12px; text-align: center; border: 1px solid #2C1810; width: 60px">Qty</th>
                    </tr>
                </thead>
                <tbody>
                    ${data.items.map((item: any, i: number) => `
                        <tr>
                            <td style="padding: 12px; text-align: center; border: 1px solid #E5DDD5">${i + 1}</td>
                            <td style="padding: 12px; border: 1px solid #E5DDD5">
                                <div style="font-weight: bold">${item.itemName}</div>
                                <div style="font-size: 12px; color: #666">${item.material || ''}</div>
                            </td>
                            <td style="padding: 12px; text-align: center; border: 1px solid #E5DDD5">${item.color || '—'}</td>
                            <td style="padding: 12px; text-align: center; border: 1px solid #E5DDD5">${item.size || '—'}</td>
                            <td style="padding: 12px; text-align: center; border: 1px solid #E5DDD5; font-weight: bold">${item.quantity}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>

            ${data.remarks ? `
            <div style="background: #FAF8F6; padding: 25px; border-radius: 12px; border: 1px dashed #C9A84C">
                <h3 style="margin: 0 0 15px; font-size: 14px; text-transform: uppercase; color: #8B5E3C; border-bottom: 1px solid #E8C97A; padding-bottom: 5px">Special Instructions / Remarks</h3>
                <p style="margin: 0; font-size: 16px; line-height: 1.6; color: #2C1810; white-space: pre-wrap">${data.remarks}</p>
            </div>
            ` : ''}

            <div style="margin-top: 60px; display: flex; justify-content: space-between; align-items: flex-end;">
                <div style="text-align: center; width: 200px; border-top: 1.5px solid #2C1810; padding-top: 10px; font-size: 11px; font-weight: bold; color: #2C1810;">
                    Workshop Supervisor
                    ${data.createdBy ? `<div style="margin-top: 4px; font-size: 10px; font-weight: normal; color: #7A6055;">(Sales: ${data.createdBy})</div>` : ''}
                </div>
                <div style="font-size: 9px; color: #A89080; font-family: monospace;">
                    Job Card ID: ${data.saleNumber}<br>
                    Printed: ${new Date().toLocaleString()}
                </div>
                <div style="text-align: center; width: 200px; border-top: 1.5px solid #2C1810; padding-top: 10px; font-size: 11px; font-weight: bold; color: #2C1810;">
                    Worker Signature
                </div>
            </div>
        </div>
    `;

    const element = document.createElement("div");
    element.innerHTML = html;
    
    // Use dynamic import to avoid SSR issues if this runs in a context where global window is not yet ready
    import("html2pdf.js").then((html2pdf: any) => {
        const opt = {
            margin: 0,
            filename: `job-card-${data.saleNumber}.pdf`,
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 2, useCORS: true, logging: false },
            jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
        };
        html2pdf.default().from(element).set(opt).save();
    });
};

export const generateDeliveryChallanPDF = (data: any) => {
    const isArabic = containsArabic(data.deliveryAddress || "") || containsArabic(data.customerName || "");
    const dir = isArabic ? "rtl" : "ltr";
    const balanceDue = (data.grandTotal || 0) - (data.advancePaid || 0);
    
    const html = `
        <div style="font-family: Arial, sans-serif; padding: 40px; color: #333; direction: ${dir}; text-align: ${isArabic ? 'right' : 'left'} font-size: 13px;">
            <div style="display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #1E8449; padding-bottom: 20px; margin-bottom: 30px">
                <div>
                    <h1 style="margin: 0; color: #1E8449; font-size: 28px">DIAMOND HOME</h1>
                    <h2 style="margin: 5px 0 0; color: #666; font-size: 18px; text-transform: uppercase; letter-spacing: 2px">Delivery Challan & Gate Pass</h2>
                </div>
                <div style="text-align: right">
                    <p style="margin: 0; font-weight: bold; color: #1E8449; font-size: 16px;">Sale #: ${data.saleNumber}</p>
                    <p style="margin: 5px 0 0; font-size: 13px; color: #999">Date: ${formatDate(new Date())}</p>
                </div>
            </div>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 30px">
                <div style="background: #F4FAF6; padding: 20px; border-radius: 12px; border: 1px solid #D5F5E3">
                    <h3 style="margin: 0 0 10px; font-size: 11px; text-transform: uppercase; color: #27AE60; letter-spacing: 1px">Customer Details</h3>
                    <p style="margin: 0 0 5px; font-size: 18px; font-weight: bold; color: #2C1810">${data.customerName}</p>
                    ${data.customerMobile ? `<p style="margin: 0 0 5px; font-size: 13px; color: #555"><strong>Mobile:</strong> ${data.customerMobile}</p>` : ''}
                    ${data.customerAddress ? `<p style="margin: 0; font-size: 13px; color: #777; line-height: 1.4"><strong>Billing Address:</strong> ${data.customerAddress}</p>` : ''}
                </div>
                <div style="background: #FCF3CF; padding: 20px; border-radius: 12px; border: 1px solid #F9E79F">
                    <h3 style="margin: 0 0 10px; font-size: 11px; text-transform: uppercase; color: #B7950B; letter-spacing: 1px">Delivery Destination</h3>
                    <p style="margin: 0 0 5px; font-size: 16px; font-weight: bold; color: #7D6608">${data.deliveryAddress || 'Same as Billing Address'}</p>
                </div>
            </div>

            <div style="background: #FAF8F6; padding: 15px 20px; border-radius: 12px; border: 1px solid #E5DDD5; margin-bottom: 30px; display: grid; grid-template-columns: 1fr 1fr; gap: 20px">
                <div>
                    <h4 style="margin: 0 0 8px; font-size: 11px; text-transform: uppercase; color: #A89080">Driver Assignment</h4>
                    <p style="margin: 0 0 3px; font-size: 14px; font-weight: bold; color: #2C1810">Driver: ${data.driverName}</p>
                    <p style="margin: 0; font-size: 13px; color: #7A6055">Contact: ${data.driverContact}</p>
                </div>
                <div style="text-align: right; border-left: 1px solid #E5DDD5; padding-left: 20px">
                    <h4 style="margin: 0 0 8px; font-size: 11px; text-transform: uppercase; color: #A89080">Payment Status</h4>
                    <div style="font-size: 13px; color: #555; margin-bottom: 4px">Total Order: ${formatCurrency(data.grandTotal)}</div>
                    <div style="font-size: 13px; color: #27AE60; margin-bottom: 6px">Advance Paid: ${formatCurrency(data.advancePaid)}</div>
                    <div style="font-size: 18px; font-weight: bold; color: ${balanceDue > 0 ? '#C0392B' : '#27AE60'}">
                        ${balanceDue > 0 ? `CASH TO COLLECT: ${formatCurrency(balanceDue)}` : 'PAID IN FULL'}
                    </div>
                </div>
            </div>

            <table style="width: 100%; border-collapse: collapse; margin-bottom: 40px">
                <thead>
                    <tr style="background: #1E8449; color: #fff">
                        <th style="padding: 12px; text-align: center; border: 1px solid #1E8449; width: 40px">#</th>
                        <th style="padding: 12px; text-align: left; border: 1px solid #1E8449">Item Description</th>
                        <th style="padding: 12px; text-align: center; border: 1px solid #1E8449">Color</th>
                        <th style="padding: 12px; text-align: center; border: 1px solid #1E8449">Size</th>
                        <th style="padding: 12px; text-align: center; border: 1px solid #1E8449; width: 80px">Quantity</th>
                    </tr>
                </thead>
                <tbody>
                    ${data.items.map((item: any, i: number) => `
                        <tr>
                            <td style="padding: 12px; text-align: center; border: 1px solid #E5DDD5">${i + 1}</td>
                            <td style="padding: 12px; border: 1px solid #E5DDD5">
                                <div style="font-weight: bold">${item.itemName || item.productName}</div>
                                <div style="font-size: 12px; color: #666">${item.material || ''}</div>
                            </td>
                            <td style="padding: 12px; text-align: center; border: 1px solid #E5DDD5">${item.color || '—'}</td>
                            <td style="padding: 12px; text-align: center; border: 1px solid #E5DDD5">${item.size || '—'}</td>
                            <td style="padding: 12px; text-align: center; border: 1px solid #E5DDD5; font-weight: bold">${item.quantity}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>

            <div style="margin-top: 80px; display: flex; justify-content: space-between; align-items: flex-end;">
                <div style="text-align: center; width: 220px; border-top: 1.5px solid #1E8449; padding-top: 10px; font-size: 11px; font-weight: bold; color: #2C1810;">
                    Driver's Signature
                </div>
                <div style="font-size: 9px; color: #A89080; font-family: monospace; text-align: center">
                    Challan ID: DEL-${data.saleNumber}<br>
                    Generated: ${new Date().toLocaleString()}
                </div>
                <div style="text-align: center; width: 220px; border-top: 1.5px solid #1E8449; padding-top: 10px; font-size: 11px; font-weight: bold; color: #2C1810;">
                    Customer Signature (Acknowledge Receipt)
                </div>
            </div>
        </div>
    `;

    const element = document.createElement("div");
    element.innerHTML = html;
    
    import("html2pdf.js").then((html2pdf: any) => {
        const opt = {
            margin: 0,
            filename: `delivery-challan-${data.saleNumber}.pdf`,
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 2, useCORS: true, logging: false },
            jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
        };
        html2pdf.default().from(element).set(opt).save();
    });
};

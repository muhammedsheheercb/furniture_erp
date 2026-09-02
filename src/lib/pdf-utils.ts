import jsPDF from "jspdf";
import { formatCurrency, formatDate } from "./utils";
import enTranslations from "../locales/en.json";
import arTranslations from "../locales/ar.json";

const t = (key: string) => {
  const isArabic = typeof window !== "undefined" && document.documentElement.lang === "ar";
  if (isArabic) return (arTranslations as any)[key] || key;
  return (enTranslations as any)[key] || key;
};


export interface InvoiceItem {
  itemName: string;
  itemNumber: string;
  quantity: number;
  price: number;
  discount?: number;
  subtotal?: number;
  taxAmount?: number;
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

const printHtml = (html: string) => {
  const iframe = document.createElement("iframe");
  iframe.style.position = "absolute";
  iframe.style.top = "-10000px";
  document.body.appendChild(iframe);
  const doc = iframe.contentWindow?.document;
  if (doc) {
    doc.open();
    doc.write(`
      <html>
        <head>
          <title>Print Document</title>
          <style>
            @media print {
              body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            }
          </style>
        </head>
        <body>${html}</body>
      </html>
    `);
    doc.close();
    setTimeout(() => {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
      setTimeout(() => document.body.removeChild(iframe), 1000);
    }, 250);
  }
};

const containsArabic = (text: string) => {
  const arabicPattern =
    /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/;
  return arabicPattern.test(text);
};

export const generateInvoicePDF = (data: InvoiceData) => {
  const isArabic = typeof window !== "undefined" && document.documentElement.lang === "ar";
  const dir = isArabic ? "rtl" : "ltr";
  const totalDiscount = data.items.reduce((s, i) => s + (i.discount || 0), 0);
  const hasDiscount = totalDiscount > 0;

  const html = `
        <div style="font-family: Arial, sans-serif; padding: 40px; color: #333; direction: ${dir}; text-align: ${isArabic ? "right" : "left"}">
            <div style="display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #3F51B5; padding-bottom: 20px; margin-bottom: 30px">
                <div>
                    <h1 style="margin: 0; color: #3F51B5; font-size: 28px">DIAMOND HOME</h1>
                    <h2 style="margin: 5px 0 0; color: #666; font-size: 18px; text-transform: uppercase; letter-spacing: 2px">${data.isTaxInvoice ? t("taxInvoice") : `${data.type} Invoice`}</h2>
                    ${
                      data.isTaxInvoice
                        ? `
                    <div style="margin-top: 10px; font-size: 11px; color: #999">
                        Tax No: 12345678 | CR No: 345678 | Oman
                    </div>`
                        : ""
                    }
                </div>
                <div style="text-align: right">
                    <p style="margin: 0; font-weight: bold; color: #3F51B5">${t("invoiceNumber")}: ${data.number}</p>
                    <p style="margin: 5px 0 0; font-size: 14px; color: #999">${t("date")}: ${formatDate(data.date)}</p>
                    <p style="margin: 5px 0 0; font-size: 12px; color: #666; text-transform: uppercase">${data.paymentType}</p>
                </div>
            </div>

            <div style="display: grid; grid-template-columns: 1.5fr 1fr; gap: 40px; margin-bottom: 40px">
                <div style="background: #F8F9FA; padding: 20px; border-radius: 12px; border: 1px solid #E9ECEF">
                    <h3 style="margin: 0 0 10px; font-size: 11px; text-transform: uppercase; color: #6C757D; letter-spacing: 1px">${t(data.type === "Sale" ? "customerDetails" : "supplierDetails")}</h3>
                    <p style="margin: 0 0 5px; font-size: 18px; font-weight: bold; color: #212529">${data.customerOrSupplier}</p>
                    <p style="margin: 0 0 5px; font-size: 14px; color: #495057">ID: ${data.customerOrSupplierNumber}</p>
                    ${data.customerOrSupplierMobile || (data as any).customerMobile ? `<p style="margin: 0 0 5px; font-size: 14px; color: #495057">${t("mobile")}: ${data.customerOrSupplierMobile || (data as any).customerMobile}</p>` : ""}
                    ${data.customerAddress ? `<p style="margin: 0; font-size: 13px; color: #6C757D; line-height: 1.4">${data.customerAddress}</p>` : ""}
                </div>
                <div style="display: flex; flex-direction: column; gap: 10px">
                    ${
                      data.deliveryDate
                        ? `
                    <div style="background: #FFF; padding: 12px; border-radius: 8px; border: 1px solid #E9ECEF">
                        <span style="font-size: 11px; text-transform: uppercase; color: #6C757D">Delivery ${t("date")}:</span>
                        <span style="float: right; font-weight: bold">${formatDate(data.deliveryDate)}</span>
                    </div>`
                        : ""
                    }
                    ${
                      data.deliveryAddress
                        ? `
                    <div style="background: #FFF; padding: 12px; border-radius: 8px; border: 1px solid #E9ECEF">
                        <h4 style="margin: 0 0 5px; font-size: 11px; text-transform: uppercase; color: #6C757D">${t("deliveryAddress")}:</h4>
                        <p style="margin: 0; font-size: 12px; color: #495057">${data.deliveryAddress}</p>
                    </div>`
                        : ""
                    }
                </div>
            </div>

            <table style="width: 100%; border-collapse: collapse; margin-bottom: 30px">
                <thead>
                    <tr style="background: #3F51B5; color: #fff">
                        <th style="padding: 12px; text-align: center; border: 1px solid #3F51B5; width: 40px">#</th>
                        <th style="padding: 12px; text-align: left; border: 1px solid #3F51B5">${t("description")}</th>
                        <th style="padding: 12px; text-align: center; border: 1px solid #3F51B5; width: 60px">${t("qty")}</th>
                        <th style="padding: 12px; text-align: right; border: 1px solid #3F51B5; width: 100px">${t("unitPrice")}</th>
                        ${hasDiscount ? `<th style="padding: 12px; text-align: right; border: 1px solid #3F51B5; width: 100px">${t("discPct")}</th>` : ""}
                        <th style="padding: 12px; text-align: right; border: 1px solid #3F51B5; width: 100px">${t("subtotal")}</th>
                        <th style="padding: 12px; text-align: right; border: 1px solid #3F51B5; width: 80px">${t("vat")} 5%</th>
                        <th style="padding: 12px; text-align: right; border: 1px solid #3F51B5; width: 120px">${t("total")}</th>
                    </tr>
                </thead>
                <tbody>
                    ${data.items
                      .map(
                        (item, i) => `
                        <tr>
                            <td style="padding: 12px; text-align: center; border: 1px solid #DEE2E6">${i + 1}</td>
                            <td style="padding: 12px; border: 1px solid #DEE2E6">
                                <div style="font-weight: bold; color: #212529">${item.itemName}${item.isFOC ? " (FOC)" : ""}</div>
                                <div style="font-size: 11px; color: #6C757D">${item.itemNumber || ""}</div>
                            </td>
                            <td style="padding: 12px; text-align: center; border: 1px solid #DEE2E6; font-weight: 500">${item.quantity}</td>
                            <td style="padding: 12px; text-align: right; border: 1px solid #DEE2E6">${item.isFOC ? "0.00" : formatCurrency(item.price)}</td>
                            ${hasDiscount ? `<td style="padding: 12px; text-align: right; border: 1px solid #DEE2E6; color: #DC3545">${item.discount || 0}%</td>` : ""}
                            <td style="padding: 12px; text-align: right; border: 1px solid #DEE2E6">${formatCurrency(item.subtotal || item.total)}</td>
                            <td style="padding: 12px; text-align: right; border: 1px solid #DEE2E6">${formatCurrency(item.taxAmount || 0)}</td>
                            <td style="padding: 12px; text-align: right; border: 1px solid #DEE2E6; font-weight: bold">${formatCurrency(item.total)}</td>
                        </tr>
                    `,
                      )
                      .join("")}
                </tbody>
            </table>

            <div style="display: flex; justify-content: flex-end; margin-bottom: 40px">
                <div style="width: 250px">
                    <div style="display: flex; justify-content: space-between; padding: 5px 0">
                        <span style="color: #6C757D">${t("subtotal")}:</span>
                        <span style="font-weight: 500">${formatCurrency(data.items.reduce((acc, it) => acc + (it.subtotal || it.total), 0))}</span>
                    </div>
                    ${
                      hasDiscount
                        ? `
                    <div style="display: flex; justify-content: space-between; padding: 5px 0">
                        <span style="color: #6C757D">${t("itemDiscount")}:</span>
                        <span style="font-weight: 500; color: #DC3545">- ${formatCurrency(data.items.reduce((acc, it) => acc + (it.price * it.quantity * (it.discount || 0)) / 100, 0))}</span>
                    </div>`
                        : ""
                    }
                    ${
                      data.discount
                        ? `
                    <div style="display: flex; justify-content: space-between; padding: 5px 0">
                        <span style="color: #6C757D">${t("discount")}:</span>
                        <span style="font-weight: 500; color: #DC3545">- ${formatCurrency(data.subtotal * (data.discount / 100))}</span>
                    </div>`
                        : ""
                    }
                    <div style="display: flex; justify-content: space-between; padding: 5px 0">
                        <span style="color: #6C757D">${t("tax")} (VAT):</span>
                        <span style="font-weight: 500">${formatCurrency(data.items.reduce((acc, it) => acc + (it.taxAmount || 0), 0))}</span>
                    </div>
                    <div style="display: flex; justify-content: space-between; padding: 15px 0; border-top: 2px solid #3F51B5; margin-top: 10px">
                        <span style="font-weight: bold; font-size: 18px; color: #212529">${t("grandTotal")}:</span>
                        <span style="font-weight: bold; font-size: 18px; color: #3F51B5">${formatCurrency(data.total)}</span>
                    </div>
                    ${
                      data.advancePaid
                        ? `
                    <div style="display: flex; justify-content: space-between; padding: 5px 0; font-size: 13px">
                        <span style="color: #6C757D">${t("advancePaid")}:</span>
                        <span style="color: #28A745; font-weight: 500">(-) ${formatCurrency(data.advancePaid)}</span>
                    </div>
                    <div style="display: flex; justify-content: space-between; padding: 5px 0; font-weight: bold; color: #DC3545">
                        <span>${t("balanceDue")}:</span>
                        <span>${formatCurrency(data.total - data.advancePaid)}</span>
                    </div>`
                        : ""
                    }
                </div>
            </div>

            <div style="margin-top: 60px; border-top: 1px solid #E9ECEF; padding-top: 20px; display: flex; justify-content: space-between; align-items: flex-end;">
                <div style="font-size: 10px; color: #6C757D;">
                    ${data.createdBy ? `<p style="margin: 0;"><strong>${t("salesPerson")}:</strong> ${data.createdBy}</p>` : ""}
                    <p style="margin: 3px 0 0 0;"><strong>${t("printedOn")}:</strong> ${new Date().toLocaleString()}</p>
                </div>
                <div style="text-align: center; width: 150px;">
                    <div style="border-bottom: 1px solid #333; margin-bottom: 5px;"></div>
                    <p style="font-size: 10px; color: #6C757D; margin: 0;">${t("authorizedSignature")}</p>
                </div>
            </div>
        </div>
    `;

  printHtml(html);
};

export const generateQuotationPDF = (data: any) => {
  const isArabic = typeof window !== "undefined" && document.documentElement.lang === "ar";
  const dir = isArabic ? "rtl" : "ltr";
  const totalItemDiscount = data.items.reduce(
    (s: number, i: any) => s + (i.price * i.quantity * (i.discount || 0)) / 100,
    0,
  );
  const extraDiscountAmount = (data.subtotal * (data.discount || 0)) / 100;
  const totalDiscountAmount = totalItemDiscount + extraDiscountAmount;
  const hasAnyDiscount = totalDiscountAmount > 0;

  const html = `
        <div style="font-family: Arial, sans-serif; padding: 40px; color: #333; direction: ${dir}; text-align: ${isArabic ? "right" : "left"}">
            <div style="display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #8B5E3C; padding-bottom: 20px; margin-bottom: 30px">
                <div>
                    <h1 style="margin: 0; color: #8B5E3C; font-size: 28px">DIAMOND HOME</h1>
                    <h2 style="margin: 5px 0 0; color: #666; font-size: 18px; text-transform: uppercase; letter-spacing: 2px">${t("furnitureQuotation")}</h2>
                </div>
                <div style="text-align: right">
                    <p style="margin: 0; font-weight: bold; color: #8B5E3C">${t("quotationNumber")}: ${data.quotationNumber}</p>
                    <p style="margin: 5px 0 0; font-size: 14px; color: #999">${t("date")}: ${formatDate(data.date)}</p>
                </div>
            </div>

            <div style="display: grid; grid-template-columns: 1.5fr 1fr; gap: 40px; margin-bottom: 40px">
                <div style="background: #FAF8F6; padding: 20px; border-radius: 12px; border: 1px solid #E5DDD5">
                    <h3 style="margin: 0 0 10px; font-size: 11px; text-transform: uppercase; color: #A89080; letter-spacing: 1px">${t("billTo")}</h3>
                    <p style="margin: 0 0 5px; font-size: 18px; font-weight: bold; color: #2C1810">${data.customerName}</p>
                    ${data.customerMobile ? `<p style="margin: 0 0 5px; font-size: 14px; color: #666">${t("mobile")}: ${data.customerMobile}</p>` : ""}
                    ${data.customerAddress || data.address ? `<p style="margin: 0; font-size: 13px; color: #7A6055; line-height: 1.4">${data.customerAddress || data.address}</p>` : ""}
                </div>
                <div style="display: flex; flex-direction: column; gap: 10px">
                    ${
                      data.validUntil
                        ? `
                    <div style="background: #FFF; padding: 12px; border-radius: 8px; border: 1px solid #E5DDD5">
                        <span style="font-size: 11px; text-transform: uppercase; color: #A89080">${t("validUntil")}:</span>
                        <span style="float: right; font-weight: bold">${formatDate(data.validUntil)}</span>
                    </div>`
                        : ""
                    }
                    ${
                      data.deliveryDate
                        ? `
                    <div style="background: #FFF; padding: 12px; border-radius: 8px; border: 1px solid #E5DDD5">
                        <span style="font-size: 11px; text-transform: uppercase; color: #A89080">${t("estimatedDelivery")}:</span>
                        <span style="float: right; font-weight: bold">${formatDate(data.deliveryDate)}</span>
                    </div>`
                        : ""
                    }
                </div>
            </div>

            <table style="width: 100%; border-collapse: collapse; margin-bottom: 30px">
                <thead>
                    <tr style="background: #8B5E3C; color: #fff">
                        <th style="padding: 12px; text-align: center; border: 1px solid #8B5E3C; width: 40px">#</th>
                        <th style="padding: 12px; text-align: left; border: 1px solid #8B5E3C">${t("description")}</th>
                        <th style="padding: 12px; text-align: center; border: 1px solid #8B5E3C">${t("color")}</th>
                        <th style="padding: 12px; text-align: center; border: 1px solid #8B5E3C; width: 60px">${t("qty")}</th>
                        <th style="padding: 12px; text-align: right; border: 1px solid #8B5E3C; width: 100px">${t("unitPrice")}</th>
                        ${totalItemDiscount > 0 ? `<th style="padding: 12px; text-align: right; border: 1px solid #8B5E3C; width: 100px">${t("discPct")}</th>` : ""}
                        <th style="padding: 12px; text-align: right; border: 1px solid #8B5E3C; width: 100px">${t("subtotal")}</th>
                        <th style="padding: 12px; text-align: right; border: 1px solid #8B5E3C; width: 80px">${t("vat")} 5%</th>
                        <th style="padding: 12px; text-align: right; border: 1px solid #8B5E3C; width: 120px">${t("total")}</th>
                    </tr>
                </thead>
                <tbody>
                    ${data.items
                      .map(
                        (item: any, i: number) => `
                        <tr>
                            <td style="padding: 12px; text-align: center; border: 1px solid #E5DDD5">${i + 1}</td>
                            <td style="padding: 12px; border: 1px solid #E5DDD5">
                                <div style="font-weight: bold; color: #2C1810">${item.itemName}</div>
                                <div style="font-size: 11px; color: #888">${item.material || ""}</div>
                            </td>
                            <td style="padding: 12px; text-align: center; border: 1px solid #E5DDD5; font-size: 13px; color: #666">
                                ${item.color || "—"}
                            </td>
                            <td style="padding: 12px; text-align: center; border: 1px solid #E5DDD5; font-weight: 500">${item.quantity}</td>
                            <td style="padding: 12px; text-align: right; border: 1px solid #E5DDD5">${formatCurrency(item.price)}</td>
                            ${totalItemDiscount > 0 ? `<td style="padding: 12px; text-align: right; border: 1px solid #E5DDD5; color: #DC3545">${item.discount || 0}%</td>` : ""}
                            <td style="padding: 12px; text-align: right; border: 1px solid #E5DDD5">${formatCurrency(item.subtotal || item.total)}</td>
                            <td style="padding: 12px; text-align: right; border: 1px solid #E5DDD5">${formatCurrency(item.taxAmount || 0)}</td>
                            <td style="padding: 12px; text-align: right; border: 1px solid #E5DDD5; font-weight: bold">${formatCurrency(item.total)}</td>
                        </tr>
                    `,
                      )
                      .join("")}
                </tbody>
            </table>

            <div style="display: flex; justify-content: flex-end; margin-bottom: 40px">
                <div style="width: 250px">
                    <div style="display: flex; justify-content: space-between; padding: 5px 0">
                        <span style="color: #7A6055">${t("subtotal")}:</span>
                        <span style="font-weight: 500">${formatCurrency(data.subtotal)}</span>
                    </div>
                    ${
                      hasAnyDiscount
                        ? `
                    <div style="display: flex; justify-content: space-between; padding: 5px 0">
                        <span style="color: #7A6055">${t("discount")}:</span>
                        <span style="font-weight: 500; color: #DC3545">- ${formatCurrency(totalDiscountAmount)}</span>
                    </div>`
                        : ""
                    }
                    <div style="display: flex; justify-content: space-between; padding: 5px 0">
                        <span style="color: #7A6055">${t("vat")}:</span>
                        <span style="font-weight: 500">${formatCurrency(data.items.reduce((acc: number, it: any) => acc + (it.taxAmount || 0), 0))}</span>
                    </div>
                    <div style="display: flex; justify-content: space-between; padding: 15px 0; border-top: 2px solid #8B5E3C; margin-top: 10px">
                        <span style="font-weight: bold; font-size: 18px; color: #2C1810">${t("grandTotal")}:</span>
                        <span style="font-weight: bold; font-size: 18px; color: #8B5E3C">${formatCurrency(data.total)}</span>
                    </div>
                </div>
            </div>

            ${
              data.notes
                ? `
            <div style="background: #FAF8F6; padding: 20px; border-radius: 12px; border-left: 4px solid #8B5E3C">
                <h3 style="margin: 0 0 10px; font-size: 12px; text-transform: uppercase; color: #8B5E3C">${t("notesConditions")}</h3>
                <p style="margin: 0; font-size: 14px; line-height: 1.5; color: #444; white-space: pre-wrap">${data.notes}</p>
            </div>
            `
                : ""
            }

            <div style="margin-top: 60px; border-top: 1px solid #F0EAE3; padding-top: 20px; display: flex; justify-content: space-between; align-items: flex-end;">
                <div style="font-size: 10px; color: #A89080;">
                    ${data.createdBy ? `<p style="margin: 0;"><strong>${t("salesPerson")}:</strong> ${data.createdBy}</p>` : ""}
                    <p style="margin: 3px 0 0 0;"><strong>${t("printedOn")}:</strong> ${new Date().toLocaleString()}</p>
                </div>
                <div style="text-align: center; width: 150px;">
                    <div style="border-bottom: 1px solid #333; margin-bottom: 5px;"></div>
                    <p style="font-size: 10px; color: #A89080; margin: 0;">${t("authorizedSignature")}</p>
                </div>
            </div>
        </div>
    `;

  printHtml(html);
};

export const generateProductionJobCardPDF = (data: any) => {
  const isArabic = typeof window !== "undefined" && document.documentElement.lang === "ar";
  const dir = isArabic ? "rtl" : "ltr";

  const html = `
        <div style="font-family: Arial, sans-serif; padding: 40px; color: #333; direction: ${dir}; text-align: ${isArabic ? "right" : "left"}">
            <div style="display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #2C1810; padding-bottom: 20px; margin-bottom: 30px">
                <div>
                    <h1 style="margin: 0; color: #2C1810; font-size: 28px">DIAMOND HOME</h1>
                    <h2 style="margin: 5px 0 0; color: #666; font-size: 18px; text-transform: uppercase; letter-spacing: 2px">${t("productionJobCard")}</h2>
                </div>
                <div style="text-align: right">
                    <p style="margin: 0; font-weight: bold; color: #CA6F1E">${t("saleNumber")}: ${data.saleNumber}</p>
                    <p style="margin: 5px 0 0; font-size: 14px; color: #999">${t("date")}: ${formatDate(new Date())}</p>
                </div>
            </div>

            <div style="display: grid; grid-template-cols: 1fr 1fr; gap: 20px; margin-bottom: 40px">
                <div style="background: #F9F7F5; padding: 20px; border-radius: 12px; border: 1px solid #E5DDD5">
                    <h3 style="margin: 0 0 10px; font-size: 12px; text-transform: uppercase; color: #A89080">Customer Details</h3>
                    <p style="margin: 0; font-size: 18px; font-weight: bold; color: #2C1810">${data.customerName}</p>
                </div>
                ${
                  data.deliveryDate
                    ? `
                <div style="background: #FFF5F5; padding: 20px; border-radius: 12px; border: 1px solid #FED7D7; text-align: right">
                    <h3 style="margin: 0 0 10px; font-size: 12px; text-transform: uppercase; color: #C53030">${t("deadline")}</h3>
                    <p style="margin: 0; font-size: 18px; font-weight: bold; color: #C53030">${formatDate(data.deliveryDate)}</p>
                </div>
                `
                    : ""
                }
            </div>

            <table style="width: 100%; border-collapse: collapse; margin-bottom: 40px">
                <thead>
                    <tr style="background: #2C1810; color: #fff">
                        <th style="padding: 12px; text-align: center; border: 1px solid #2C1810; width: 40px">#</th>
                        <th style="padding: 12px; text-align: left; border: 1px solid #2C1810">${t("itemName")}</th>
                        <th style="padding: 12px; text-align: center; border: 1px solid #2C1810">${t("color")}</th>
                        <th style="padding: 12px; text-align: center; border: 1px solid #2C1810">${t("size")}</th>
                        <th style="padding: 12px; text-align: center; border: 1px solid #2C1810; width: 60px">${t("qty")}</th>
                    </tr>
                </thead>
                <tbody>
                    ${data.items
                      .map(
                        (item: any, i: number) => `
                        <tr>
                            <td style="padding: 12px; text-align: center; border: 1px solid #E5DDD5">${i + 1}</td>
                            <td style="padding: 12px; border: 1px solid #E5DDD5">
                                <div style="font-weight: bold">${item.itemName}</div>
                                <div style="font-size: 12px; color: #666">${item.material || ""}</div>
                            </td>
                            <td style="padding: 12px; text-align: center; border: 1px solid #E5DDD5">${item.color || "—"}</td>
                            <td style="padding: 12px; text-align: center; border: 1px solid #E5DDD5">${item.size || "—"}</td>
                            <td style="padding: 12px; text-align: center; border: 1px solid #E5DDD5; font-weight: bold">${item.quantity}</td>
                        </tr>
                    `,
                      )
                      .join("")}
                </tbody>
            </table>

            ${
              data.remarks
                ? `
            <div style="background: #FAF8F6; padding: 25px; border-radius: 12px; border: 1px dashed #C9A84C">
                <h3 style="margin: 0 0 15px; font-size: 14px; text-transform: uppercase; color: #8B5E3C; border-bottom: 1px solid #E8C97A; padding-bottom: 5px">${t("specialInstructions")}</h3>
                <p style="margin: 0; font-size: 16px; line-height: 1.6; color: #2C1810; white-space: pre-wrap">${data.remarks}</p>
            </div>
            `
                : ""
            }

            <div style="margin-top: 60px; display: flex; justify-content: space-between; align-items: flex-end;">
                <div style="text-align: center; width: 200px; border-top: 1.5px solid #2C1810; padding-top: 10px; font-size: 11px; font-weight: bold; color: #2C1810;">
                    ${t("workshopSupervisor")}
                    ${data.createdBy ? `<div style="margin-top: 4px; font-size: 10px; font-weight: normal; color: #7A6055;">(Sales: ${data.createdBy})</div>` : ""}
                </div>
                <div style="font-size: 9px; color: #A89080; font-family: monospace;">
                    ${t("jobCardId")}: ${data.saleNumber}<br>
                    Printed: ${new Date().toLocaleString()}
                </div>
                <div style="text-align: center; width: 200px; border-top: 1.5px solid #2C1810; padding-top: 10px; font-size: 11px; font-weight: bold; color: #2C1810;">
                    ${t("workerSignature")}
                </div>
            </div>
        </div>
    `;

  printHtml(html);
};

export const generateDeliveryChallanPDF = (data: any) => {
  const isArabic = typeof window !== "undefined" && document.documentElement.lang === "ar";
  const dir = isArabic ? "rtl" : "ltr";
  const balanceDue = (data.grandTotal || 0) - (data.advancePaid || 0);

  const html = `
        <div style="font-family: Arial, sans-serif; padding: 40px; color: #333; direction: ${dir}; text-align: ${isArabic ? "right" : "left"} font-size: 13px;">
            <div style="display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #1E8449; padding-bottom: 20px; margin-bottom: 30px">
                <div>
                    <h1 style="margin: 0; color: #1E8449; font-size: 28px">DIAMOND HOME</h1>
                    <h2 style="margin: 5px 0 0; color: #666; font-size: 18px; text-transform: uppercase; letter-spacing: 2px">${t("deliveryChallan")}</h2>
                </div>
                <div style="text-align: right">
                    <p style="margin: 0; font-weight: bold; color: #1E8449; font-size: 16px;">${t("saleNumber")}: ${data.saleNumber}</p>
                    <p style="margin: 5px 0 0; font-size: 13px; color: #999">${t("date")}: ${formatDate(new Date())}</p>
                </div>
            </div>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 30px">
                <div style="background: #F4FAF6; padding: 20px; border-radius: 12px; border: 1px solid #D5F5E3">
                    <h3 style="margin: 0 0 10px; font-size: 11px; text-transform: uppercase; color: #27AE60; letter-spacing: 1px">Customer Details</h3>
                    <p style="margin: 0 0 5px; font-size: 18px; font-weight: bold; color: #2C1810">${data.customerName}</p>
                    ${data.customerMobile ? `<p style="margin: 0 0 5px; font-size: 13px; color: #555"><strong>${t("mobile")}:</strong> ${data.customerMobile}</p>` : ""}
                    ${data.customerAddress ? `<p style="margin: 0; font-size: 13px; color: #777; line-height: 1.4"><strong>Billing Address:</strong> ${data.customerAddress}</p>` : ""}
                </div>
                <div style="background: #FCF3CF; padding: 20px; border-radius: 12px; border: 1px solid #F9E79F">
                    <h3 style="margin: 0 0 10px; font-size: 11px; text-transform: uppercase; color: #B7950B; letter-spacing: 1px">Delivery Destination</h3>
                    <p style="margin: 0 0 5px; font-size: 16px; font-weight: bold; color: #7D6608">${data.deliveryAddress || "Same as Billing Address"}</p>
                </div>
            </div>

            <div style="background: #FAF8F6; padding: 15px 20px; border-radius: 12px; border: 1px solid #E5DDD5; margin-bottom: 30px; display: grid; grid-template-columns: 1fr 1fr; gap: 20px">
                <div>
                    <h4 style="margin: 0 0 8px; font-size: 11px; text-transform: uppercase; color: #A89080">${t("driverAssignment")}</h4>
                    <p style="margin: 0 0 3px; font-size: 14px; font-weight: bold; color: #2C1810">${t("driver")}: ${data.driverName}</p>
                    <p style="margin: 0; font-size: 13px; color: #7A6055">${t("contact")}: ${data.driverContact}</p>
                </div>
                <div style="text-align: right; border-left: 1px solid #E5DDD5; padding-left: 20px">
                    <h4 style="margin: 0 0 8px; font-size: 11px; text-transform: uppercase; color: #A89080">${t("paymentStatus")}</h4>
                    <div style="font-size: 13px; color: #555; margin-bottom: 4px">${t("totalOrder")}: ${formatCurrency(data.grandTotal)}</div>
                    <div style="font-size: 13px; color: #27AE60; margin-bottom: 6px">${t("advancePaid")}: ${formatCurrency(data.advancePaid)}</div>
                    <div style="font-size: 18px; font-weight: bold; color: ${balanceDue > 0 ? "#C0392B" : "#27AE60"}">
                        ${balanceDue > 0 ? `${t("cashToCollect")}: ${formatCurrency(balanceDue)}` : t("paidInFull")}
                    </div>
                </div>
            </div>

            <table style="width: 100%; border-collapse: collapse; margin-bottom: 40px">
                <thead>
                    <tr style="background: #1E8449; color: #fff">
                        <th style="padding: 12px; text-align: center; border: 1px solid #1E8449; width: 40px">#</th>
                        <th style="padding: 12px; text-align: left; border: 1px solid #1E8449">Item ${t("description")}</th>
                        <th style="padding: 12px; text-align: center; border: 1px solid #1E8449">${t("color")}</th>
                        <th style="padding: 12px; text-align: center; border: 1px solid #1E8449">${t("size")}</th>
                        <th style="padding: 12px; text-align: center; border: 1px solid #1E8449; width: 80px">${t("quantity")}</th>
                    </tr>
                </thead>
                <tbody>
                    ${data.items
                      .map(
                        (item: any, i: number) => `
                        <tr>
                            <td style="padding: 12px; text-align: center; border: 1px solid #E5DDD5">${i + 1}</td>
                            <td style="padding: 12px; border: 1px solid #E5DDD5">
                                <div style="font-weight: bold">${item.itemName || item.productName}</div>
                                <div style="font-size: 12px; color: #666">${item.material || ""}</div>
                            </td>
                            <td style="padding: 12px; text-align: center; border: 1px solid #E5DDD5">${item.color || "—"}</td>
                            <td style="padding: 12px; text-align: center; border: 1px solid #E5DDD5">${item.size || "—"}</td>
                            <td style="padding: 12px; text-align: center; border: 1px solid #E5DDD5; font-weight: bold">${item.quantity}</td>
                        </tr>
                    `,
                      )
                      .join("")}
                </tbody>
            </table>

            <div style="margin-top: 80px; display: flex; justify-content: space-between; align-items: flex-end;">
                <div style="text-align: center; width: 220px; border-top: 1.5px solid #1E8449; padding-top: 10px; font-size: 11px; font-weight: bold; color: #2C1810;">
                    ${t("driversSignature")}
                </div>
                <div style="font-size: 9px; color: #A89080; font-family: monospace; text-align: center">
                    Challan ID: DEL-${data.saleNumber}<br>
                    Generated: ${new Date().toLocaleString()}
                </div>
                <div style="text-align: center; width: 220px; border-top: 1.5px solid #1E8449; padding-top: 10px; font-size: 11px; font-weight: bold; color: #2C1810;">
                    ${t("customerSignature")}
                </div>
            </div>
        </div>
    `;

  printHtml(html);
};

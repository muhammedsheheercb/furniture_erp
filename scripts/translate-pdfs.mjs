import fs from 'fs';

const filePath = './src/lib/pdf-utils.ts';
let content = fs.readFileSync(filePath, 'utf8');

// Add translation utility
if (!content.includes('import enTranslations')) {
  const imports = `import enTranslations from "../locales/en.json";
import arTranslations from "../locales/ar.json";

const t = (key: string) => {
  const isArabic = typeof window !== "undefined" && document.documentElement.lang === "ar";
  if (isArabic) return (arTranslations as any)[key] || key;
  return (enTranslations as any)[key] || key;
};
`;
  content = content.replace('import { formatCurrency, formatDate } from "./utils";', 'import { formatCurrency, formatDate } from "./utils";\n' + imports);
}

// Map of hardcoded strings to replace in HTML
const replacements = [
  ['"Tax Invoice"', 't("taxInvoice")'],
  ['"Sale Invoice"', 't("saleInvoice")'],
  ['Invoice #:', '${t("invoiceNumber")}:'],
  ['Date:', '${t("date")}:'],
  ['"Customer" : "Supplier"} Details', 't(data.type === "Sale" ? "customerDetails" : "supplierDetails")}'],
  ['ID:', 'ID:'], // maybe skip ID
  ['Mobile:', '${t("mobile")}:'],
  ['Delivery Date:', '${t("deliveryDate")}:'],
  ['Delivery Address:', '${t("deliveryAddress")}:'],
  ['Description<', '${t("description")}<'],
  ['Qty<', '${t("qty")}<'],
  ['Unit Price<', '${t("unitPrice")}<'],
  ['Disc%<', '${t("discPct")}<'],
  ['Total<', '${t("total")}<'],
  ['Subtotal:', '${t("subtotal")}:'],
  ['Item Discount:', '${t("itemDiscount")}:'],
  ['Discount:', '${t("discount")}:'],
  ['Tax (', '${t("tax")} ('],
  ['Grand Total:', '${t("grandTotal")}:'],
  ['Advance Paid:', '${t("advancePaid")}:'],
  ['Balance Due:', '${t("balanceDue")}:'],
  ['Sales Person:', '${t("salesPerson")}:'],
  ['Printed on:', '${t("printedOn")}:'],
  ['Authorized Signature', '${t("authorizedSignature")}'],
  ['Furniture Quotation', '${t("furnitureQuotation")}'],
  ['Quotation #:', '${t("quotationNumber")}:'],
  ['Bill To<', '${t("billTo")}<'],
  ['Valid Until:', '${t("validUntil")}:'],
  ['Estimated Delivery:', '${t("estimatedDelivery")}:'],
  ['Color<', '${t("color")}<'],
  ['VAT (', '${t("vat")} ('],
  ['Notes & Conditions', '${t("notesConditions")}'],
  ['Production Job Card', '${t("productionJobCard")}'],
  ['Sale #:', '${t("saleNumber")}:'],
  ['Deadline<', '${t("deadline")}<'],
  ['Item Name<', '${t("itemName")}<'],
  ['Size<', '${t("size")}<'],
  ['Special Instructions / Remarks', '${t("specialInstructions")}'],
  ['Workshop Supervisor', '${t("workshopSupervisor")}'],
  ['Job Card ID:', '${t("jobCardId")}:'],
  ['Worker Signature', '${t("workerSignature")}'],
  ['Delivery Challan & Gate Pass', '${t("deliveryChallan")}'],
  ['Driver Assignment', '${t("driverAssignment")}'],
  ['Driver:', '${t("driver")}:'],
  ['Contact:', '${t("contact")}:'],
  ['Payment Status<', '${t("paymentStatus")}<'],
  ['Total Order:', '${t("totalOrder")}:'],
  ['CASH TO COLLECT:', '${t("cashToCollect")}:'],
  ['PAID IN FULL', '${t("paidInFull")}'],
  ['Item Description<', '${t("itemDescription")}<'],
  ['Quantity<', '${t("quantity")}<'],
  ["Driver's Signature", '${t("driversSignature")}'],
  ['Customer Signature (Acknowledge Receipt)', '${t("customerSignature")}']
];

for (const [find, replace] of replacements) {
  content = content.replaceAll(find, replace);
}

// We need to be careful with isArabic inside pdf-utils.ts now that we rely on language!
// containsArabic is still fine for text direction.

fs.writeFileSync(filePath, content);
console.log("pdf-utils.ts has been patched with translation calls.");

import fs from 'fs';

const enPath = './src/locales/en.json';
const arPath = './src/locales/ar.json';

const en = JSON.parse(fs.readFileSync(enPath, 'utf8'));
const ar = JSON.parse(fs.readFileSync(arPath, 'utf8'));

const newKeys = {
  "taxInvoice": ["Tax Invoice", "فاتورة ضريبية"],
  "saleInvoice": ["Sale Invoice", "فاتورة مبيعات"],
  "invoiceNumber": ["Invoice #", "رقم الفاتورة"],
  "date": ["Date", "التاريخ"],
  "customerDetails": ["Customer Details", "تفاصيل العميل"],
  "supplierDetails": ["Supplier Details", "تفاصيل المورد"],
  "mobile": ["Mobile", "الجوال"],
  "deliveryDate": ["Delivery Date", "تاريخ التوصيل"],
  "deliveryAddress": ["Delivery Address", "عنوان التوصيل"],
  "description": ["Description", "الوصف"],
  "qty": ["Qty", "الكمية"],
  "unitPrice": ["Unit Price", "سعر الوحدة"],
  "discPct": ["Disc%", "نسبة الخصم"],
  "total": ["Total", "الإجمالي"],
  "subtotal": ["Subtotal", "المجموع الفرعي"],
  "itemDiscount": ["Item Discount", "خصم العناصر"],
  "discount": ["Discount", "الخصم"],
  "tax": ["Tax", "الضريبة"],
  "grandTotal": ["Grand Total", "الإجمالي الكلي"],
  "advancePaid": ["Advance Paid", "المبلغ المدفوع"],
  "balanceDue": ["Balance Due", "الرصيد المتبقي"],
  "salesPerson": ["Sales Person", "مندوب المبيعات"],
  "printedOn": ["Printed on", "تاريخ الطباعة"],
  "authorizedSignature": ["Authorized Signature", "توقيع معتمد"],
  "furnitureQuotation": ["Furniture Quotation", "عرض سعر أثاث"],
  "quotationNumber": ["Quotation #", "رقم عرض السعر"],
  "billTo": ["Bill To", "فاتورة إلى"],
  "validUntil": ["Valid Until", "صالح حتى"],
  "estimatedDelivery": ["Estimated Delivery", "التوصيل المتوقع"],
  "color": ["Color", "اللون"],
  "vat": ["VAT", "ضريبة القيمة المضافة"],
  "notesConditions": ["Notes & Conditions", "ملاحظات وشروط"],
  "productionJobCard": ["Production Job Card", "بطاقة عمل الإنتاج"],
  "saleNumber": ["Sale #", "رقم البيع"],
  "deadline": ["Deadline", "الموعد النهائي"],
  "itemName": ["Item Name", "اسم العنصر"],
  "size": ["Size", "المقاس"],
  "specialInstructions": ["Special Instructions / Remarks", "تعليمات خاصة / ملاحظات"],
  "workshopSupervisor": ["Workshop Supervisor", "مشرف الورشة"],
  "jobCardId": ["Job Card ID", "معرف بطاقة العمل"],
  "workerSignature": ["Worker Signature", "توقيع العامل"],
  "deliveryChallan": ["Delivery Challan & Gate Pass", "إيصال التوصيل وتصريح الخروج"],
  "driverAssignment": ["Driver Assignment", "تعيين السائق"],
  "driver": ["Driver", "السائق"],
  "contact": ["Contact", "رقم التواصل"],
  "paymentStatus": ["Payment Status", "حالة الدفع"],
  "totalOrder": ["Total Order", "إجمالي الطلب"],
  "cashToCollect": ["CASH TO COLLECT", "المبلغ المطلوب تحصيله"],
  "paidInFull": ["PAID IN FULL", "مدفوع بالكامل"],
  "itemDescription": ["Item Description", "وصف العنصر"],
  "quantity": ["Quantity", "الكمية"],
  "driversSignature": ["Driver's Signature", "توقيع السائق"],
  "customerSignature": ["Customer Signature (Acknowledge Receipt)", "توقيع العميل (إقرار الاستلام)"]
};

for (const [key, [enVal, arVal]] of Object.entries(newKeys)) {
  if (!en[key]) en[key] = enVal;
  if (!ar[key]) ar[key] = arVal;
}

fs.writeFileSync(enPath, JSON.stringify(en, null, 2));
fs.writeFileSync(arPath, JSON.stringify(ar, null, 2));

console.log("Print PDF keys added.");

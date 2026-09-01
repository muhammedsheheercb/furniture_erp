import fs from 'fs';

const enPath = './src/locales/en.json';
const arPath = './src/locales/ar.json';

const en = JSON.parse(fs.readFileSync(enPath, 'utf8'));
const ar = JSON.parse(fs.readFileSync(arPath, 'utf8'));

const newKeys = {
  "areYouSureYouWant": ["Are you sure you want to delete this customer? This action cannot be undone and will remove all history.", "هل أنت متأكد أنك تريد حذف هذا العميل؟ لا يمكن التراجع عن هذا الإجراء وسيتم مسح كل السجل."],
  "deleteThisRecordTheItem": ["Delete this record? The item quantity will be restored to inventory.", "هل تريد حذف هذا السجل؟ ستتم إعادة كمية العنصر إلى المخزون."],
  "delete": ["Delete", "حذف"],
  "trackAndManageCustomerProduct": ["Track and manage customer product returns", "تتبع وإدارة مرتجعات منتجات العملاء"],
  "thisWillReverseTheInventory": ["This will reverse the inventory update and restore the customer's debt balance. This action cannot be easily undone.", "سيؤدي هذا إلى عكس تحديث المخزون واستعادة رصيد دين العميل. لا يمكن التراجع عن هذا الإجراء بسهولة."],
  "addANewBusinessExpense": ["Add a new business expense record", "إضافة سجل مصروفات تجارية جديد"],
  "recordANewPurchaseFrom": ["Record a new purchase from a supplier", "تسجيل عملية شراء جديدة من مورد"],
  "createANewSalesInvoice": ["Create a new sales invoice", "إنشاء فاتورة مبيعات جديدة"],
  "attentionInventoryQuantitiesWillBe": ["Attention: Inventory quantities will be recalculated based on your changes. Old quantities will be reversed and new ones applied. Continue?", "تنبيه: سيتم إعادة حساب كميات المخزون بناءً على التغييرات. سيتم إلغاء الكميات القديمة وتطبيق الجديدة. هل تريد المتابعة؟"],
  "confirmUpdate": ["Confirm Update", "تأكيد التحديث"],
  "inventoryQuantitiesWillBeReconciled": ["Inventory quantities will be reconciled based on items and quantities changed. Continue?", "سيتم تسوية كميات المخزون بناءً على العناصر والكميات التي تم تغييرها. هل تريد المتابعة؟"]
};

for (const [key, [enVal, arVal]] of Object.entries(newKeys)) {
  if (!en[key]) en[key] = enVal;
  if (!ar[key]) ar[key] = arVal;
}

fs.writeFileSync(enPath, JSON.stringify(en, null, 2));
fs.writeFileSync(arPath, JSON.stringify(ar, null, 2));

console.log("Extracted long messages patched into locales.");

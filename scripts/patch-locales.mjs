import fs from 'fs';

const enPath = './src/locales/en.json';
const arPath = './src/locales/ar.json';

const en = JSON.parse(fs.readFileSync(enPath, 'utf8'));
const ar = JSON.parse(fs.readFileSync(arPath, 'utf8'));

const newKeys = {
  "dashboard": ["Dashboard", "لوحة القيادة"],
  "quotations": ["Quotations", "عروض الأسعار"],
  "sales_orders": ["Sales Orders", "أوامر المبيعات"],
  "production": ["Production", "الإنتاج"],
  "production_workers": ["Production Workers", "عمال الإنتاج"],
  "delivery": ["Delivery", "التوصيل"],
  "inventory": ["Inventory", "المخزون"],
  "customers": ["Customers", "العملاء"],
  "suppliers": ["Suppliers", "الموردين"],
  "workers": ["Workers", "العمال"],
  "raw_materials": ["Raw Materials", "المواد الخام"],
  "purchases": ["Purchases", "المشتريات"],
  "expenses": ["Expenses", "المصروفات"],
  "settings": ["Settings", "الإعدادات"],
  "returns": ["Returns", "المرتجعات"],
  "damaged": ["Damaged", "التالف"],
  "low_stock": ["Low Stock", "مخزون منخفض"]
};

for (const [key, [enVal, arVal]] of Object.entries(newKeys)) {
  if (!en[key]) en[key] = enVal;
  if (!ar[key]) ar[key] = arVal;
}

fs.writeFileSync(enPath, JSON.stringify(en, null, 2));
fs.writeFileSync(arPath, JSON.stringify(ar, null, 2));

console.log("Missing keys added.");

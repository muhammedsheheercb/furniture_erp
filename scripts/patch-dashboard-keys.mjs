import fs from 'fs';

const enPath = './src/locales/en.json';
const arPath = './src/locales/ar.json';

const en = JSON.parse(fs.readFileSync(enPath, 'utf8'));
const ar = JSON.parse(fs.readFileSync(arPath, 'utf8'));

const newKeys = {
  "business_overview": ["Business Overview", "نظرة عامة على الأعمال"],
  "dashboard_subtitle": ["Here is what's happening with your store today.", "إليك ما يحدث في متجرك اليوم."],
  "liveUpdates": ["Live Updates", "تحديثات مباشرة"],
  "total_sales": ["Total Sales", "إجمالي المبيعات"],
  "cash_sale": ["Cash Sale", "مبيعات نقدية"],
  "bank_upi_sale": ["Bank/UPI Sale", "مبيعات البنك / الحوالات"],
  "credit_sale": ["Credit Sale", "مبيعات بالآجل"],
  "total_purchases": ["Total Purchases", "إجمالي المشتريات"],
  "cash_purchase": ["Cash Purchase", "مشتريات نقدية"],
  "bank_upi_purchase": ["Bank/UPI Purchase", "مشتريات البنك / الحوالات"],
  "credit_purchase": ["Credit Purchase", "مشتريات بالآجل"],
  "total_expenses": ["Total Expenses", "إجمالي المصروفات"],
  "total_revenue": ["Total Revenue", "إجمالي الإيرادات"],
  "financialPerformance": ["Financial Performance", "الأداء المالي"],
  "monthlyComparisonOfSalesPurchases": ["Monthly Comparison of Sales & Purchases", "مقارنة شهرية للمبيعات والمشتريات"],
  "sales": ["Sales", "المبيعات"],
  "purchases": ["Purchases", "المشتريات"],
  "inventorySummary": ["Inventory Summary", "ملخص المخزون"],
  "totalStock": ["Total Stock", "إجمالي المخزون"],
  "units": ["Units", "الوحدات"],
  "receivable": ["Receivable", "الذمم المدينة"],
  "payable": ["Payable", "الذمم الدائنة"],
  "total_items": ["Total Items", "إجمالي الأصناف"],
  "total_customers": ["Total Customers", "إجمالي العملاء"]
};

for (const [key, [enVal, arVal]] of Object.entries(newKeys)) {
  if (!en[key]) en[key] = enVal;
  if (!ar[key]) ar[key] = arVal;
}

fs.writeFileSync(enPath, JSON.stringify(en, null, 2));
fs.writeFileSync(arPath, JSON.stringify(ar, null, 2));

console.log("Dashboard pre-existing keys added.");

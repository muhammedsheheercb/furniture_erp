import fs from "fs";
import path from "path";

const newKeys = {
  purchasers: { en: "Purchasers", ar: "المشترين" },
  purchaser: { en: "Purchaser", ar: "المشتري" },
  addPurchaser: { en: "Add Purchaser", ar: "إضافة مشتري" },
  editPurchaser: { en: "Edit Purchaser", ar: "تعديل المشتري" },
  deletePurchaser: { en: "Delete Purchaser", ar: "حذف المشتري" },
  managePurchasers: { en: "Manage purchasers and view their purchase history", ar: "إدارة المشترين وعرض سجل مشترياتهم" },
  monthlyPurchases: { en: "Monthly Purchases", ar: "مشتريات الشهر" },
  totalPurchasers: { en: "Total Purchasers", ar: "إجمالي المشترين" },
  selectPurchaser: { en: "Select Purchaser (Optional)", ar: "اختر المشتري (اختياري)" },
  enterPurchaserName: { en: "Enter purchaser name", ar: "أدخل اسم المشتري" },
};

const enPath = path.resolve("./src/locales/en.json");
const arPath = path.resolve("./src/locales/ar.json");

const enJSON = JSON.parse(fs.readFileSync(enPath, "utf-8"));
const arJSON = JSON.parse(fs.readFileSync(arPath, "utf-8"));

for (const [key, value] of Object.entries(newKeys)) {
  enJSON[key] = value.en;
  arJSON[key] = value.ar;
}

fs.writeFileSync(enPath, JSON.stringify(enJSON, null, 2));
fs.writeFileSync(arPath, JSON.stringify(arJSON, null, 2));

console.log("Translation keys added successfully");

"use client";
import React, { createContext, useContext, useState, useEffect } from "react";

type Language = "en" | "ar";

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const translations: Record<Language, Record<string, string>> = {
  en: {
    dashboard: "Dashboard",
    quotations: "Quotations",
    sales: "Sales",
    purchases: "Purchases",
    inventory: "Inventory",
    customers: "Customers",
    suppliers: "Suppliers",
    expenses: "Expenses",
    returns: "Returns",
    damaged: "Damaged",
    low_stock: "Low Stock",
    users: "Users",
    logout: "Sign Out",
    welcome: "Welcome",
    total_sales: "Total Sales",
    total_orders: "Total Orders",
    total_customers: "Total Customers",
    active_production: "Active Production",
    start_work: "Start Work",
    mark_finished: "Mark Finished",
    production_control: "Production Control",
    ready_to_convert: "Ready to Convert",
    active_sales_orders: "Active Sales Orders",
    invoices: "Invoices",
    business_overview: "Business Overview",
    dashboard_subtitle: "Here's what's happening with your furniture business today.",
    revenue: "Revenue",
    total_items: "Total Items",
    total_suppliers: "Total Suppliers",
  },
  ar: {
    dashboard: "لوحة القيادة",
    quotations: "الاقتباسات",
    sales: "المبيعات",
    purchases: "المشتريات",
    inventory: "المخزون",
    customers: "العملاء",
    suppliers: "الموردين",
    expenses: "المصاريف",
    returns: "المرتجعات",
    damaged: "التالف",
    low_stock: "مخزون منخفض",
    users: "المستخدمين",
    logout: "تسجيل الخروج",
    welcome: "أهلاً بك",
    total_sales: "إجمالي المبيعات",
    total_orders: "إجمالي الطلبات",
    total_customers: "إجمالي العملاء",
    active_production: "الإنتاج النشط",
    start_work: "بدء العمل",
    mark_finished: "تم الانتهاء",
    production_control: "التحكم في الإنتاج",
    ready_to_convert: "جاهز للتحويل",
    active_sales_orders: "طلبات المبيعات النشطة",
    invoices: "الفواتير",
    business_overview: "نظرة عامة على الأعمال",
    dashboard_subtitle: "إليك ما يحدث في أعمال الأثاث الخاصة بك اليوم.",
    revenue: "الإيرادات",
    total_items: "إجمالي العناصر",
    total_suppliers: "إجمالي الموردين",
  }
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguage] = useState<Language>("en");

  useEffect(() => {
    const savedLang = localStorage.getItem("language") as Language;
    if (savedLang) setLanguage(savedLang);
  }, []);

  const handleSetLanguage = (lang: Language) => {
    setLanguage(lang);
    localStorage.setItem("language", lang);
    document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";
    document.documentElement.lang = lang;
  };

  useEffect(() => {
    document.documentElement.dir = language === "ar" ? "rtl" : "ltr";
    document.documentElement.lang = language;
  }, [language]);

  const t = (key: string) => {
    return translations[language][key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage: handleSetLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
}

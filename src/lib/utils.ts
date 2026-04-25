import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

// ─── Tailwind class merge ────────────────────────────
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// ─── Currency format ────────────────────────────────
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-OM", {
    style: "currency",
    currency: "OMR",
    minimumFractionDigits: 3,
    maximumFractionDigits: 3,
  }).format(amount);
}

// ─── Date format ────────────────────────────────────
export function formatDate(date: Date | string): string {
  if (!date) return "-";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
  }).format(new Date(date));
}

export function formatDateInput(date: Date | string): string {
  return new Date(date).toISOString().split("T")[0] ?? "";
}

// ─── Month name ─────────────────────────────────────
export function getMonthName(month: number): string {
  return new Intl.DateTimeFormat("en-OM", { month: "short" }).format(
    new Date(2024, month - 1, 1)
  );
}

// ─── Unique number generator ─────────────────────────
export function generateUniqueNumber(prefix: string): string {
  const ts = Date.now().toString().slice(-6);
  const rand = Math.floor(Math.random() * 1000)
    .toString()
    .padStart(3, "0");
  return `${prefix}-${ts}${rand}`;
}

export const generateCustomerID = () => generateUniqueNumber("CUST");
export const generateItemID = () => generateUniqueNumber("ITEM");
export const generateSupplierID = () => generateUniqueNumber("SUPP");
export const generatePurchaseID = () => generateUniqueNumber("PUR");
export const generateSaleID = () => generateUniqueNumber("SALE");

// ─── Truncate text ───────────────────────────────────
export function truncate(str: string, max: number): string {
  return str.length > max ? str.slice(0, max) + "..." : str;
}

// ─── Safe JSON parse ─────────────────────────────────
export function safeJson<T>(val: string, fallback: T): T {
  try {
    return JSON.parse(val) as T;
  } catch {
    return fallback;
  }
}
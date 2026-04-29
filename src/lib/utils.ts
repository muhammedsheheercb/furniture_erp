import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export const cn = (...inputs: ClassValue[]) => {
  return twMerge(clsx(inputs));
};

export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

export const formatDate = (date: Date | string): string => {
  if (!date) return "-";
  return new Intl.DateTimeFormat("en-IN", {
    month: "short",
    day: "2-digit",
    year: "numeric",
  }).format(new Date(date));
};

export const formatDateInput = (date: Date | string): string => {
  if (!date) return "";
  const d = new Date(date);
  if (isNaN(d.getTime())) return "";
  return d.toISOString().split('T')[0] || "";
};

export const generateUniqueNumber = (prefix: string): string => {
  const timestamp = Date.now().toString().slice(-6);
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `${prefix}-${timestamp}${random}`;
};

export const generateDocNumber = (prefix: string, lastNumber: number): string => {
  const year = new Date().getFullYear();
  const seq = (lastNumber + 1).toString().padStart(4, '0');
  return `${prefix}-${year}-${seq}`;
};

export const generateCustomerID = (): string => {
  return `CUST-${Math.floor(1000 + Math.random() * 9000)}`;
};

export const generateSupplierID = (): string => {
  return `SUP-${Math.floor(1000 + Math.random() * 9000)}`;
};
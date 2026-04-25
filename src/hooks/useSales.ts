"use client";
import { useState, useCallback } from "react";
import { ISale, ISaleForm, PaymentType } from "@/types";
import toast from "react-hot-toast";

interface SaleFilters {
  search?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  startDate?: string;
  endDate?: string;
  month?: number;
  year?: number;
  paymentType?: PaymentType;
}

export function useSales() {
  const [sales, setSales]           = useState<ISale[]>([]);
  const [total, setTotal]           = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [totalAmount, setTotalAmount] = useState(0);
  const [loading, setLoading]       = useState(false);

  const fetchSales = useCallback(async (filters: SaleFilters = {}) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([k, v]) => { if (v !== undefined && v !== "") params.set(k, String(v)); });

      const res  = await fetch(`/api/sales?${params}`);
      const data = await res.json();
      if (!data.success) throw new Error();
      setSales(data.data);
      setTotal(data.total);
      setTotalPages(data.totalPages);
      setTotalAmount(data.totalAmount ?? 0);
    } catch {
      toast.error("Failed to load sales");
    } finally {
      setLoading(false);
    }
  }, []);

  const createSale = useCallback(async (form: ISaleForm): Promise<boolean> => {
    try {
      const res  = await fetch("/api/sales", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      toast.success("Sale created successfully");
      return true;
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Failed to create sale");
      return false;
    }
  }, []);

  const deleteSale = useCallback(async (id: string): Promise<boolean> => {
    try {
      const res  = await fetch(`/api/sales/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      toast.success("Sale deleted");
      return true;
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Failed to delete sale");
      return false;
    }
  }, []);

  const updateSale = useCallback(async (id: string, form: Partial<ISaleForm>): Promise<boolean> => {
    try {
      const res  = await fetch(`/api/sales/${id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      toast.success("Sale updated");
      return true;
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Failed to update sale");
      return false;
    }
  }, []);

  return { sales, total, totalPages, totalAmount, loading, fetchSales, createSale, deleteSale, updateSale };
}
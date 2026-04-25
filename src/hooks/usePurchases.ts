"use client";
import { useState, useCallback } from "react";
import { IPurchase, IPurchaseForm, PaymentType } from "@/types";
import toast from "react-hot-toast";

interface PurchaseFilters {
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

export function usePurchases() {
  const [purchases, setPurchases]   = useState<IPurchase[]>([]);
  const [total, setTotal]           = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [totalAmount, setTotalAmount] = useState(0);
  const [loading, setLoading]       = useState(false);

  const fetchPurchases = useCallback(async (filters: PurchaseFilters = {}) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([k, v]) => { if (v !== undefined && v !== "") params.set(k, String(v)); });

      const res  = await fetch(`/api/purchases?${params}`);
      const data = await res.json();
      if (!data.success) throw new Error();
      setPurchases(data.data);
      setTotal(data.total);
      setTotalPages(data.totalPages);
      setTotalAmount(data.totalAmount ?? 0);
    } catch {
      toast.error("Failed to load purchases");
    } finally {
      setLoading(false);
    }
  }, []);

  const createPurchase = useCallback(async (form: IPurchaseForm): Promise<boolean> => {
    try {
      const res  = await fetch("/api/purchases", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      toast.success("Purchase created successfully");
      return true;
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Failed to create purchase");
      return false;
    }
  }, []);

  const deletePurchase = useCallback(async (id: string): Promise<boolean> => {
    try {
      const res  = await fetch(`/api/purchases/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      toast.success("Purchase deleted");
      return true;
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Failed to delete purchase");
      return false;
    }
  }, []);

  const updatePurchase = useCallback(async (id: string, form: Partial<IPurchaseForm>): Promise<boolean> => {
    try {
      const res  = await fetch(`/api/purchases/${id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      toast.success("Purchase updated");
      return true;
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Failed to update purchase");
      return false;
    }
  }, []);

  return { purchases, total, totalPages, totalAmount, loading, fetchPurchases, createPurchase, deletePurchase, updatePurchase };
}
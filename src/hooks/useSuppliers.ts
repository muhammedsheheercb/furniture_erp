"use client";
import { useState, useCallback } from "react";
import { ISupplier, ISupplierForm, IPaginatedResponse } from "@/types";
import toast from "react-hot-toast";

interface Filters {
  search?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export function useSuppliers() {
  const [suppliers, setSuppliers] = useState<ISupplier[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);

  const fetchSuppliers = useCallback(async (filters: Filters = {}) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.search) params.set("search", filters.search);
      if (filters.page) params.set("page", String(filters.page));
      if (filters.limit) params.set("limit", String(filters.limit));
      if (filters.sortBy) params.set("sortBy", filters.sortBy);
      if (filters.sortOrder) params.set("sortOrder", filters.sortOrder);

      const res = await fetch(`/api/suppliers?${params}`);
      const data: IPaginatedResponse<ISupplier> = await res.json();
      if (!data.success) throw new Error();
      setSuppliers(data.data);
      setTotal(data.total);
      setTotalPages(data.totalPages);
    } catch {
      toast.error("Failed to load suppliers");
    } finally {
      setLoading(false);
    }
  }, []);

  const createSupplier = useCallback(
    async (form: ISupplierForm): Promise<boolean> => {
      try {
        const res = await fetch("/api/suppliers", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        });
        const data = await res.json();
        if (!data.success) throw new Error(data.error);
        toast.success("Supplier created successfully");
        return true;
      } catch (e: unknown) {
        toast.error(
          e instanceof Error ? e.message : "Failed to create supplier",
        );
        return false;
      }
    },
    [],
  );

  const updateSupplier = useCallback(
    async (id: string, form: Partial<ISupplierForm>): Promise<boolean> => {
      try {
        const res = await fetch(`/api/suppliers/${id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        });
        const data = await res.json();
        if (!data.success) throw new Error(data.error);
        toast.success("Supplier updated successfully");
        return true;
      } catch (e: unknown) {
        toast.error(
          e instanceof Error ? e.message : "Failed to update supplier",
        );
        return false;
      }
    },
    [],
  );

  const deleteSupplier = useCallback(async (id: string): Promise<boolean> => {
    try {
      const res = await fetch(`/api/suppliers/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      toast.success("Supplier deleted");
      return true;
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Failed to delete supplier");
      return false;
    }
  }, []);

  return {
    suppliers,
    total,
    totalPages,
    loading,
    fetchSuppliers,
    createSupplier,
    updateSupplier,
    deleteSupplier,
  };
}

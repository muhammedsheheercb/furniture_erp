"use client";
import { useState, useCallback } from "react";
import { ICustomer, ICustomerForm, IPaginatedResponse } from "@/types";
import toast from "react-hot-toast";

interface Filters {
  search?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  startDate?: string;
  endDate?: string;
  purchaseFilter?: "higher" | "lower" | "";
}

export function useCustomers() {
  const [customers, setCustomers] = useState<ICustomer[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);

  const fetchCustomers = useCallback(async (filters: Filters = {}) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.search) params.set("search", filters.search);
      if (filters.page) params.set("page", String(filters.page));
      if (filters.limit) params.set("limit", String(filters.limit));
      if (filters.sortBy) params.set("sortBy", filters.sortBy);
      if (filters.sortOrder) params.set("sortOrder", filters.sortOrder);
      if (filters.startDate) params.set("startDate", filters.startDate);
      if (filters.endDate) params.set("endDate", filters.endDate);
      if (filters.purchaseFilter)
        params.set("purchaseFilter", filters.purchaseFilter);

      const res = await fetch(`/api/customers?${params}`);
      const data: IPaginatedResponse<ICustomer> = await res.json();
      if (!data.success) throw new Error();
      setCustomers(data.data);
      setTotal(data.total);
      setTotalPages(data.totalPages);
    } catch {
      toast.error("Failed to load customers");
    } finally {
      setLoading(false);
    }
  }, []);

  const createCustomer = useCallback(
    async (form: ICustomerForm): Promise<boolean> => {
      try {
        const res = await fetch("/api/customers", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        });
        const data = await res.json();
        if (!data.success) throw new Error(data.error);
        toast.success("Customer created successfully");
        return true;
      } catch (e: unknown) {
        toast.error(
          e instanceof Error ? e.message : "Failed to create customer",
        );
        return false;
      }
    },
    [],
  );

  const updateCustomer = useCallback(
    async (id: string, form: Partial<ICustomerForm>): Promise<boolean> => {
      try {
        const res = await fetch(`/api/customers/${id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        });
        const data = await res.json();
        if (!data.success) throw new Error(data.error);
        toast.success("Customer updated successfully");
        return true;
      } catch (e: unknown) {
        toast.error(
          e instanceof Error ? e.message : "Failed to update customer",
        );
        return false;
      }
    },
    [],
  );

  const deleteCustomer = useCallback(async (id: string): Promise<boolean> => {
    try {
      const res = await fetch(`/api/customers/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      toast.success("Customer deleted");
      return true;
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Failed to delete customer");
      return false;
    }
  }, []);

  return {
    customers,
    total,
    totalPages,
    loading,
    fetchCustomers,
    createCustomer,
    updateCustomer,
    deleteCustomer,
  };
}

"use client";
import { useState, useCallback } from "react";
import { IItem, IItemForm, IPaginatedResponse } from "@/types";
import toast from "react-hot-toast";

interface Filters {
  search?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export function useItems() {
  const [items, setItems]           = useState<IItem[]>([]);
  const [total, setTotal]           = useState(0);
  const [totalAmount, setTotalAmount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading]       = useState(false);

  const fetchItems = useCallback(async (filters: Filters = {}) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.search)    params.set("search",    filters.search);
      if (filters.page)      params.set("page",      String(filters.page));
      if (filters.limit)     params.set("limit",     String(filters.limit));
      if (filters.sortBy)    params.set("sortBy",    filters.sortBy);
      if (filters.sortOrder) params.set("sortOrder", filters.sortOrder);

      const res  = await fetch(`/api/items?${params}`);
      const data: IPaginatedResponse<IItem> & { totalAmount: number } = await res.json();
      if (!data.success) throw new Error(data as unknown as string);
      setItems(data.data);
      setTotal(data.total);
      setTotalAmount(data.totalAmount);
      setTotalPages(data.totalPages);
    } catch {
      toast.error("Failed to load items");
    } finally {
      setLoading(false);
    }
  }, []);

  const createItem = useCallback(async (form: IItemForm): Promise<boolean> => {
    try {
      const res  = await fetch("/api/items", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      toast.success("Item created successfully");
      return true;
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Failed to create item");
      return false;
    }
  }, []);

  const updateItem = useCallback(async (id: string, form: Partial<IItemForm>): Promise<boolean> => {
    try {
      const res  = await fetch(`/api/items/${id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      toast.success("Item updated successfully");
      return true;
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Failed to update item");
      return false;
    }
  }, []);

  const deleteItem = useCallback(async (id: string): Promise<boolean> => {
    try {
      const res  = await fetch(`/api/items/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      toast.success("Item deleted");
      return true;
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Failed to delete item");
      return false;
    }
  }, []);

  return { items, total, totalAmount, totalPages, loading, fetchItems, createItem, updateItem, deleteItem };
}
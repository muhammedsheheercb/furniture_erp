"use client";
import { useState, useCallback } from "react";
import { IExpense, IExpenseForm, IExpenseFilter } from "@/types";
import toast from "react-hot-toast";

export function useExpenses() {
  const [expenses, setExpenses] = useState<IExpense[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [totalAmount, setTotalAmount] = useState(0);
  const [loading, setLoading] = useState(false);

  const fetchExpenses = useCallback(async (filters: IExpenseFilter = {}) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([k, v]) => {
        if (v !== undefined && v !== "") params.set(k, String(v));
      });

      const res = await fetch(`/api/expenses?${params}`);
      const data = await res.json();
      if (!data.success) throw new Error();
      setExpenses(data.data);
      setTotal(data.total);
      setTotalPages(data.totalPages);
      setTotalAmount(data.totalAmount ?? 0);
    } catch {
      toast.error("Failed to load expenses");
    } finally {
      setLoading(false);
    }
  }, []);

  const createExpense = useCallback(
    async (form: IExpenseForm): Promise<boolean> => {
      try {
        const res = await fetch("/api/expenses", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        });
        const data = await res.json();
        if (!data.success) throw new Error(data.error);
        toast.success("Expense recorded successfully");
        return true;
      } catch (e: unknown) {
        toast.error(
          e instanceof Error ? e.message : "Failed to record expense",
        );
        return false;
      }
    },
    [],
  );

  const deleteExpense = useCallback(async (id: string): Promise<boolean> => {
    try {
      const res = await fetch(`/api/expenses/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      toast.success("Expense deleted");
      return true;
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Failed to delete expense");
      return false;
    }
  }, []);

  const updateExpense = useCallback(
    async (id: string, form: Partial<IExpenseForm>): Promise<boolean> => {
      try {
        const res = await fetch(`/api/expenses/${id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        });
        const data = await res.json();
        if (!data.success) throw new Error(data.error);
        toast.success("Expense updated");
        return true;
      } catch (e: unknown) {
        toast.error(
          e instanceof Error ? e.message : "Failed to update expense",
        );
        return false;
      }
    },
    [],
  );

  return {
    expenses,
    total,
    totalPages,
    totalAmount,
    loading,
    fetchExpenses,
    createExpense,
    deleteExpense,
    updateExpense,
  };
}

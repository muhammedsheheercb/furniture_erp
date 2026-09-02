"use client";
import { useState, useEffect } from "react";
import Modal from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/label";
import axios from "axios";
import {
  Receipt,
  DollarSign,
  Calendar as CalendarIcon,
  Tag,
  FileText,
  CreditCard,
  Hash,
} from "lucide-react";
import { useLanguage } from "../../context/LanguageContext";

interface ExpenseModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: any) => Promise<void>;
  expense?: any | null;
  loading?: boolean;
}

const CATEGORIES = [
  "Labor",
  "Electricity",
  "Transport",
  "Rent",
  "Marketing",
  "Maintenance",
  "Office Supplies",
  "Petrol Expense",
  "Other",
];

const PAYMENT_TYPES = [
  { value: "cash", label: "Cash" },
  { value: "bank", label: "Bank Transfer" },
  { value: "debit", label: "Debit Card" },
  { value: "credit", label: "Credit Card" },
];

export default function ExpenseModal({
  open,
  onClose,
  onSubmit,
  expense,
  loading,
}: ExpenseModalProps) {
  const { t } = useLanguage();
  const [formData, setFormData] = useState({
    title: "",
    category: "Other",
    amount: "",
    date: new Date().toISOString().split("T")[0],
    reference: "",
    description: "",
    paymentType: "cash",
    purchaserId: "",
    purchaserName: "",
  });
  const [purchasers, setPurchasers] = useState<any[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!open) return;
    axios
      .get("/api/purchasers")
      .then((res) => setPurchasers(res.data.data || []))
      .catch((err) => console.error("Failed to fetch purchasers", err));
  }, [open]);

  useEffect(() => {
    setErrors({});
    if (expense) {
      setFormData({
        title: expense.title || "",
        category: expense.category || "Other",
        amount: String(expense.amount || ""),
        date: expense.date
          ? new Date(expense.date).toISOString().split("T")[0]
          : new Date().toISOString().split("T")[0],
        reference: expense.reference || "",
        description: expense.description || "",
        paymentType: expense.paymentType || "cash",
        purchaserId: expense.purchaserId?._id || expense.purchaserId || "",
        purchaserName: expense.purchaserName || "",
      });
    } else {
      setFormData({
        title: "",
        category: "Other",
        amount: "",
        date: new Date().toISOString().split("T")[0],
        reference: "",
        description: "",
        paymentType: "cash",
        purchaserId: "",
        purchaserName: "",
      });
    }
  }, [expense, open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};
    if (!formData.title.trim()) {
      newErrors.title = "Expense title is required";
    }
    if (!formData.amount || Number(formData.amount) <= 0) {
      newErrors.amount = "Amount must be greater than 0";
    }
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    setErrors({});
    onSubmit({
      ...formData,
      title: formData.title.trim(),
      amount: Number(formData.amount),
    });
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={expense ? "Edit Expense" : "Record New Expense"}
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Title */}
          <div className="space-y-2">
            <Label
              htmlFor="title"
              className="text-xs font-bold text-[#7A6055] uppercase tracking-wider"
            >
              {t("expenseTitle")}
            </Label>
            <div className="relative">
              <Receipt
                className="absolute start-3 top-1/2 -translate-y-1/2 text-[#A89080]"
                size={18}
              />
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => {
                  setFormData({ ...formData, title: e.target.value });
                  if (errors.title) setErrors({ ...errors, title: "" });
                }}
                error={errors.title}
                className="ps-10 border-[#E5DDD5] bg-[#FAF8F6] focus:ring-[#C9A84C]"
                placeholder={t("egMonthlyRent")}
              />
            </div>
          </div>

          {/* Amount */}
          <div className="space-y-2">
            <Label
              htmlFor="amount"
              className="text-xs font-bold text-[#7A6055] uppercase tracking-wider"
            >
              {t("amount")}
            </Label>
            <div className="relative">
              <DollarSign
                className="absolute start-3 top-1/2 -translate-y-1/2 text-[#A89080]"
                size={18}
              />
              <Input
                id="amount"
                type="number"
                min="0"
                step="0.01"
                value={formData.amount}
                onChange={(e) => {
                  setFormData({ ...formData, amount: e.target.value });
                  if (errors.amount) setErrors({ ...errors, amount: "" });
                }}
                error={errors.amount}
                className="ps-10 border-[#E5DDD5] bg-[#FAF8F6] focus:ring-[#C9A84C]"
                placeholder="0.00"
              />
            </div>
          </div>

          {/* Category */}
          <div className="space-y-2">
            <Label
              htmlFor="category"
              className="text-xs font-bold text-[#7A6055] uppercase tracking-wider"
            >
              {t("category")}
            </Label>
            <div className="relative">
              <Tag
                className="absolute start-3 top-1/2 -translate-y-1/2 text-[#A89080]"
                size={18}
              />
              <select
                id="category"
                required
                value={formData.category}
                onChange={(e) =>
                  setFormData({ ...formData, category: e.target.value })
                }
                className="w-full h-10 ps-10 pe-4 rounded-md border border-[#E5DDD5] bg-[#FAF8F6] text-sm focus:outline-none focus:ring-2 focus:ring-[#C9A84C]/20"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Date */}
          <div className="space-y-2">
            <Label
              htmlFor="date"
              className="text-xs font-bold text-[#7A6055] uppercase tracking-wider"
            >
              {t("date")}
            </Label>
            <div className="relative">
              <CalendarIcon
                className="absolute start-3 top-1/2 -translate-y-1/2 text-[#A89080]"
                size={18}
              />
              <Input
                id="date"
                type="date"
                required
                value={formData.date}
                onChange={(e) =>
                  setFormData({ ...formData, date: e.target.value })
                }
                className="ps-10 border-[#E5DDD5] bg-[#FAF8F6] focus:ring-[#C9A84C]"
              />
            </div>
          </div>

          {/* Payment Type */}
          <div className="space-y-2">
            <Label
              htmlFor="paymentType"
              className="text-xs font-bold text-[#7A6055] uppercase tracking-wider"
            >
              {t("paymentMethod")}
            </Label>
            <div className="relative">
              <CreditCard
                className="absolute start-3 top-1/2 -translate-y-1/2 text-[#A89080]"
                size={18}
              />
              <select
                id="paymentType"
                required
                value={formData.paymentType}
                onChange={(e) =>
                  setFormData({ ...formData, paymentType: e.target.value })
                }
                className="w-full h-10 ps-10 pe-4 rounded-md border border-[#E5DDD5] bg-[#FAF8F6] text-sm focus:outline-none focus:ring-2 focus:ring-[#C9A84C]/20"
              >
                {PAYMENT_TYPES.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Reference */}
          <div className="space-y-2">
            <Label
              htmlFor="reference"
              className="text-xs font-bold text-[#7A6055] uppercase tracking-wider"
            >
              {t("referenceBill")}
            </Label>
            <div className="relative">
              <Hash
                className="absolute start-3 top-1/2 -translate-y-1/2 text-[#A89080]"
                size={18}
              />
              <Input
                id="reference"
                value={formData.reference}
                onChange={(e) =>
                  setFormData({ ...formData, reference: e.target.value })
                }
                className="ps-10 border-[#E5DDD5] bg-[#FAF8F6] focus:ring-[#C9A84C]"
                placeholder={t("optional")}
              />
            </div>
          </div>

          {/* Purchaser */}
          <div className="space-y-2">
            <Label
              htmlFor="purchaser"
              className="text-xs font-bold text-[#7A6055] uppercase tracking-wider"
            >
              {t("purchaser") || "Purchaser"}
            </Label>
            <div className="relative">
              <select
                id="purchaser"
                value={formData.purchaserId}
                onChange={(e) => {
                  const selectedId = e.target.value;
                  const p = purchasers.find((x) => x._id === selectedId);
                  setFormData({
                    ...formData,
                    purchaserId: selectedId,
                    purchaserName: p ? p.name : "",
                  });
                }}
                className="w-full h-10 px-4 rounded-md border border-[#E5DDD5] bg-[#FAF8F6] text-sm focus:outline-none focus:ring-2 focus:ring-[#C9A84C]/20"
              >
                <option value="">{t("selectPurchaser") || "None (Optional)"}</option>
                {purchasers.map((p) => (
                  <option key={p._id} value={p._id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Description */}
        <div className="space-y-2">
          <Label
            htmlFor="description"
            className="text-xs font-bold text-[#7A6055] uppercase tracking-wider"
          >
            {t("description")}
          </Label>
          <div className="relative">
            <FileText
              className="absolute start-3 top-3 text-[#A89080]"
              size={18}
            />
            <textarea
              id="description"
              rows={3}
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              className="w-full ps-10 pe-4 py-2 rounded-md border border-[#E5DDD5] bg-[#FAF8F6] text-sm focus:outline-none focus:ring-2 focus:ring-[#C9A84C]/20 transition-all resize-none"
              placeholder={t("additionalDetails")}
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-[#E5DDD5]">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            className="border-[#E5DDD5] text-[#7A6055] hover:bg-[#FAF8F6]"
            disabled={loading}
          >
            {t("cancel")}
          </Button>
          <Button
            type="submit"
            className="bg-[#2C1810] hover:bg-[#1A0F0A] text-white px-8"
            disabled={loading}
          >
            {loading
              ? "Processing..."
              : expense
                ? "Update Expense"
                : "Record Expense"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

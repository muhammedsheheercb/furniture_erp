"use client";
import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  DollarSign,
  Save,
  X,
  Calendar,
  Tag,
  CreditCard,
  FileText,
} from "lucide-react";
import TopBar from "@/components/layout/TopBar";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Spinner from "@/components/ui/Spinner";
import { useExpenses } from "@/hooks/useExpenses";
import { PaymentType } from "@/types";
import { formatDateInput } from "@/lib/utils";
import toast from "react-hot-toast";
import { useSession } from "next-auth/react";
import { useLanguage } from "../../../../../context/LanguageContext";

const CATEGORIES = [
  "Office",
  "Travel",
  "Utilities",
  "Marketing",
  "Salaries",
  "Rent",
  "Others",
];

export default function EditExpensePage() {
  const { t } = useLanguage();
  const router = useRouter();
  const { id } = useParams();
  const { updateExpense } = useExpenses();
  const { data: session, status } = useSession();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    } else if (status === "authenticated") {
      const isAdmin = session?.user?.role === "admin";
      const canEdit =
        isAdmin || (session?.user?.permissions as any)?.expenses?.edit;
      if (!canEdit) {
        router.push("/expenses");
      }
    }
  }, [session, status, router]);

  const [form, setForm] = useState({
    title: "",
    category: "Office",
    amount: 0,
    date: "",
    reference: "",
    description: "",
    paymentType: "cash" as PaymentType,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchExpense = async () => {
      try {
        const res = await fetch(`/api/expenses/${id}`);
        const data = await res.json();
        if (data.success) {
          const e = data.data;
          setForm({
            title: e.title,
            category: e.category,
            amount: e.amount,
            date: formatDateInput(e.date),
            reference: e.reference || "",
            description: e.description || "",
            paymentType: e.paymentType,
          });
        } else {
          toast.error("Expense not found");
          router.push("/expenses");
        }
      } catch {
        toast.error("Failed to load expense");
      } finally {
        setLoading(false);
      }
    };
    fetchExpense();
  }, [id, router]);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title || !form.amount) return;
    setSaving(true);
    const ok = await updateExpense(id as string, form);
    setSaving(false);
    if (ok) router.push("/expenses");
  };

  if (loading)
    return (
      <div className="py-20 text-center">
        <Spinner />
      </div>
    );

  return (
    <div className="page-container max-w-2xl">
      <TopBar title={t("editExpense")} subtitle={`Updating record #${id}`} />

      <form onSubmit={handleUpdate} className="card p-6 flex flex-col gap-6">
        <Input
          label={t("expenseTitle")}
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
          required
          leftIcon={<FileText size={16} />}
        />

        <div className="grid grid-cols-2 gap-4">
          <Input
            label={t("amountOmr")}
            type="number"
            min={0}
            step="0.001"
            value={form.amount}
            onChange={(e) => {
              const val = e.target.value;
              if (val === "") setForm({ ...form, amount: "" as any });
              else {
                const n = Number(val);
                setForm({ ...form, amount: n < 0 ? 0 : n });
              }
            }}
            required
            leftIcon={<CreditCard size={16} />}
          />
          <Input
            label={t("date")}
            type="date"
            value={form.date}
            onChange={(e) => setForm({ ...form, date: e.target.value })}
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">
              {t("category")}
            </label>
            <select
              className="input-base w-full"
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
              required
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">
              {t("paymentVia")}
            </label>
            <div className="flex gap-2">
              {(["cash", "credit"] as PaymentType[]).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setForm({ ...form, paymentType: t })}
                  className={`flex-1 py-2 rounded-lg text-xs font-semibold border transition-colors capitalize
                    ${form.paymentType === t ? "bg-red-600 text-white border-red-600 shadow-md" : "border-gray-300 text-gray-600 hover:bg-gray-50 bg-white"}`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
        </div>

        <Input
          label={t("referenceOptional")}
          placeholder={t("refIdReceipt")}
          value={form.reference}
          onChange={(e) => setForm({ ...form, reference: e.target.value })}
        />

        <div>
          <label className="text-sm font-medium text-gray-700 block mb-1">
            {t("descriptionOptional")}
          </label>
          <textarea
            className="input-base w-full min-h-[100px] py-3"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push("/expenses")}
          >
            {t("cancel")}
          </Button>
          <Button
            type="submit"
            loading={saving}
            icon={<Save size={16} />}
            className="bg-red-600 hover:bg-red-700 border-red-600 text-white"
          >
            {t("saveChanges")}
          </Button>
        </div>
      </form>
    </div>
  );
}

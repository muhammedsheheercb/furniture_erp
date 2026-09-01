"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
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
import { useExpenses } from "@/hooks/useExpenses";
import { PaymentType } from "@/types";
import { formatDateInput } from "@/lib/utils";
import { useSession } from "next-auth/react";
import { useEffect } from "react";
import { useLanguage } from "../../../../context/LanguageContext";

const CATEGORIES = [
  "Office",
  "Travel",
  "Utilities",
  "Marketing",
  "Salaries",
  "Rent",
  "Others",
];

export default function NewExpensePage() {
  const { t } = useLanguage();
  const router = useRouter();
  const { createExpense } = useExpenses();
  const { data: session, status } = useSession();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    } else if (status === "authenticated") {
      const isAdmin = session?.user?.role === "admin";
      const canCreate =
        isAdmin || (session?.user?.permissions as any)?.expenses?.create;
      if (!canCreate) {
        router.push("/expenses");
      }
    }
  }, [session, status, router]);

  const [form, setForm] = useState({
    title: "",
    category: "Office",
    amount: 0,
    date: formatDateInput(new Date()),
    reference: "",
    description: "",
    paymentType: "cash" as PaymentType,
  });
  const [saving, setSaving] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title || !form.amount) return;
    setSaving(true);
    const ok = await createExpense(form);
    setSaving(false);
    if (ok) router.push("/expenses");
  };

  return (
    <div className="page-container max-w-2xl">
      <TopBar
        title={t("recordExpense")}
        subtitle={t("addANewBusinessExpense")}
      />

      <form onSubmit={handleSave} className="card p-6 flex flex-col gap-6">
        {/* title */}
        <Input
          label={t("expenseTitle")}
          placeholder={t("egElectricityBillCoffeeLaptop")}
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
          required
          leftIcon={<FileText size={16} />}
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* amount */}
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
          {/* date */}
          <Input
            label={t("date")}
            type="date"
            value={form.date}
            onChange={(e) => setForm({ ...form, date: e.target.value })}
            required
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* category */}
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1 flex items-center gap-2">
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

          {/* payment type */}
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">
              {t("paymentVia")}
            </label>
            <div className="flex flex-col sm:flex-row gap-2">
              {(["cash", "bank", "credit"] as PaymentType[]).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setForm({ ...form, paymentType: t })}
                  className={`flex-1 py-2 rounded-lg text-[10px] font-bold border transition-all uppercase tracking-tighter
                    ${form.paymentType === t ? "bg-red-600 text-white border-red-600 shadow-md translate-y-[-1px]" : "border-gray-300 text-gray-600 hover:bg-gray-50 bg-white"}`}
                >
                  {t === "bank" ? "bank (online)" : t}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* reference */}
        <Input
          label={t("referenceOptional")}
          placeholder={t("refIdReceipt")}
          value={form.reference}
          onChange={(e) => setForm({ ...form, reference: e.target.value })}
        />

        {/* description */}
        <div>
          <label className="text-sm font-medium text-gray-700 block mb-1">
            {t("descriptionOptional")}
          </label>
          <textarea
            className="input-base w-full min-h-[100px] py-3 resize-none scrollbar-thin"
            placeholder={t("addSomeNotesAboutThis")}
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
        </div>

        {/* actions */}
        <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 pt-4 border-t border-gray-100">
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
            className="bg-red-600 hover:bg-red-700 border-red-600 text-white w-full sm:w-auto"
          >
            {t("recordExpense")}
          </Button>
        </div>
      </form>
    </div>
  );
}

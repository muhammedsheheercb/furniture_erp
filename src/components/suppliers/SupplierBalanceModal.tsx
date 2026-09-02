import React, { useMemo } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import Modal from "@/components/ui/Modal";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import CurrencySymbol from "@/components/ui/CurrencySymbol";
import { useLanguage } from "../../context/LanguageContext";

interface SupplierBalanceModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: any) => Promise<void>;
  supplierName: string;
  supplierBalance: number;
  loading?: boolean;
}

export default function SupplierBalanceModal({
  open,
  onClose,
  onSubmit,
  supplierName,
  supplierBalance,
  loading,
}: SupplierBalanceModalProps) {
  const { t } = useLanguage();

  const schema = useMemo(
    () =>
      z.object({
        adjustAmount: z.coerce
          .number()
          .min(0.01, "Amount must be greater than 0")
          .max(
            supplierBalance,
            `Amount cannot exceed the payable balance of ${supplierBalance}`,
          ),
        adjustType: z.enum(["add", "subtract"]),
        paymentMethod: z.enum(["cash", "bank", "credit"]),
        note: z.string().optional(),
        date: z.string(),
      }),
    [supplierBalance],
  );

  type FormData = z.infer<typeof schema>;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      adjustType: "subtract",
      paymentMethod: "cash",
      date: new Date().toISOString().split("T")[0],
    },
  });

  // Reset form when modal opens
  React.useEffect(() => {
    if (open) {
      reset({
        adjustType: "subtract",
        paymentMethod: "cash",
        date: new Date().toISOString().split("T")[0],
        adjustAmount: 0 as any,
        note: "",
      });
    }
  }, [open, reset]);

  const onSubmitHandler = async (data: FormData) => {
    // Always force subtract for payments
    const payload = { ...data, adjustType: "subtract" };
    await onSubmit(payload);
    reset();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`Record Payment: ${supplierName}`}
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={loading}>
            {t("cancel")}
          </Button>
          <Button form="balance-form" type="submit" loading={loading}>
            {t("recordPayment")}
          </Button>
        </>
      }
    >
      <form
        id="balance-form"
        onSubmit={handleSubmit(onSubmitHandler)}
        className="space-y-4"
      >
        <div className="bg-[#FAF8F6] p-4 rounded-lg border border-[#E5DDD5] mb-4">
          <p className="text-sm text-[#7A6055]">{t("payableBalance")}</p>
          <p className="text-2xl font-bold text-[#1A1210]">
            <CurrencySymbol /> {supplierBalance.toLocaleString()}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Input
            label={t("amount")}
            type="number"
            step="0.01"
            required
            error={errors.adjustAmount?.message}
            {...register("adjustAmount")}
          />
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium">{t("paymentMethod")}</label>
            <select
              {...register("paymentMethod")}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            >
              <option value="cash">{t("cash")}</option>
              <option value="bank">{t("bankUpi")}</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Input label={t("date")} type="date" required {...register("date")} />
          <Input
            label={t("noteReference")}
            placeholder={t("egPaidViaGpay")}
            {...register("note")}
          />
        </div>
      </form>
    </Modal>
  );
}

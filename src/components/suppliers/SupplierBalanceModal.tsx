"use client";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import Modal from "@/components/ui/Modal";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import { useLanguage } from "../../context/LanguageContext";

const schema = z.object({
  adjustAmount: z.coerce.number().min(0.01, "Amount must be greater than 0"),
  adjustType: z.enum(["add", "subtract"]),
  paymentMethod: z.enum(["cash", "bank", "credit"]),
  note: z.string().optional(),
  date: z.string(),
});

type FormData = z.infer<typeof schema>;

interface SupplierBalanceModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: any) => Promise<void>;
  supplierName: string;
  loading?: boolean;
}

export default function SupplierBalanceModal({
  open,
  onClose,
  onSubmit,
  supplierName,
  loading,
}: SupplierBalanceModalProps) {
  const { t } = useLanguage();
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

  const onSubmitHandler = async (data: any) => {
    await onSubmit(data);
    reset();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`Update Balance: ${supplierName}`}
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={loading}>
            {t("cancel")}
          </Button>
          <Button form="balance-form" type="submit" loading={loading}>
            {t("updateBalance")}
          </Button>
        </>
      }
    >
      <form
        id="balance-form"
        onSubmit={handleSubmit(onSubmitHandler)}
        className="space-y-4"
      >
        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium">{t("entryType")}</label>
            <select
              {...register("adjustType")}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            >
              <option value="subtract">{t("paymentMadeReducesPayable")}</option>
              <option value="add">
                {t("balanceAdjustmentIncreasesPayable")}
              </option>
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium">{t("paymentMethod")}</label>
            <select
              {...register("paymentMethod")}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            >
              <option value="cash">{t("cash")}</option>
              <option value="bank">{t("bankUpi")}</option>
              <option value="credit">{t("onAccount")}</option>
            </select>
          </div>
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
          <Input label={t("date")} type="date" required {...register("date")} />
        </div>

        <Input
          label={t("noteReference")}
          placeholder={t("egPaidViaGpay")}
          {...register("note")}
        />

        <p className="text-[10px] text-gray-500 italic">
          {t("choosingPaymentMadeWillSubtract")}
        </p>
      </form>
    </Modal>
  );
}

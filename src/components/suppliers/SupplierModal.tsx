"use client";
import { useEffect } from "react";
import { useForm, type Resolver } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import Modal from "@/components/ui/Modal";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import { ISupplier } from "@/types";

import { generateSupplierID } from "@/lib/utils";
import { useLanguage } from "../../context/LanguageContext";

const schema = z.object({
  supplierNumber: z.string().trim().min(1, "Supplier number is required"),
  name: z.string().trim().min(1, "Supplier name is required"),
  mobile: z
    .string()
    .trim()
    .optional()
    .refine((val) => !val || /^\d{8,12}$/.test(val), {
      message: "Mobile must be between 8 and 12 digits",
    }),
  balance: z.coerce.number().min(0, "Balance cannot be negative").default(0),
});
type FormData = z.infer<typeof schema>;

interface SupplierModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: FormData) => Promise<void>;
  supplier?: ISupplier | null;
  loading?: boolean;
}

export default function SupplierModal({
  open,
  onClose,
  onSubmit,
  supplier,
  loading,
}: SupplierModalProps) {
  const { t } = useLanguage();
  const isEdit = !!supplier;
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema) as Resolver<FormData>,
  });

  useEffect(() => {
    if (open) {
      reset(
        supplier
          ? {
              supplierNumber: supplier.supplierNumber,
              name: supplier.name,
              mobile: supplier.mobile || "",
              balance: supplier.creditBalance ?? supplier.openingBalance ?? 0,
            }
          : {
              supplierNumber: generateSupplierID(),
              name: "",
              mobile: "",
              balance: 0,
            },
      );
    }
  }, [open, supplier, reset]);

  const onFinalSubmit = (data: FormData) => {
    const payload: any = { ...data };
    if (isEdit) {
      payload.creditBalance = data.balance;
      delete payload.balance;
    } else {
      payload.openingBalance = data.balance;
      delete payload.balance;
    }
    onSubmit(payload);
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? "Edit Supplier" : "Create Supplier"}
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={loading}>
            {t("cancel")}
          </Button>
          <Button form="supplier-form" type="submit" loading={loading}>
            {isEdit ? "Save Changes" : "Create Supplier"}
          </Button>
        </>
      }
    >
      <form
        id="supplier-form"
        onSubmit={handleSubmit(onFinalSubmit)}
        className="flex flex-col gap-4"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label={t("supplierNumber")}
            placeholder={t("sup001")}
            required
            readOnly
            disabled
            error={errors.supplierNumber?.message}
            {...register("supplierNumber")}
          />
          <Input
            label={t("name")}
            placeholder={t("supplierName")}
            required
            error={errors.name?.message}
            {...register("name")}
          />
          <Input
            label={t("mobileNumber")}
            placeholder="9876543210"
            error={errors.mobile?.message}
            {...register("mobile")}
          />
          <Input
            label={isEdit ? "Opening Balance (INR)" : "Opening balance (INR)"}
            type="number"
            step="0.001"
            placeholder="0.000"
            error={errors.balance?.message}
            {...register("balance")}
          />
        </div>
      </form>
    </Modal>
  );
}

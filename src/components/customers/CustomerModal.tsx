"use client";
import { useEffect } from "react";
import { useForm, type Resolver } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import Modal from "@/components/ui/Modal";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import { ICustomer } from "@/types";

import { generateCustomerID } from "@/lib/utils";

const schema = z.object({
  customerNumber: z.string().trim().min(1, "Customer number is required"),
  name: z.string().trim().min(1, "Name is required"),
  mobile: z.string().trim().regex(/^\d{8,12}$/, "Mobile must be between 8 and 12 digits"),
  address: z.string().trim().optional(),
  balance: z.coerce.number().min(0, "Balance cannot be negative").default(0),
});
type FormData = z.infer<typeof schema>;

interface CustomerModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: any) => Promise<void>;
  customer?: ICustomer | null;
  loading?: boolean;
}

export default function CustomerModal({
  open,
  onClose,
  onSubmit,
  customer,
  loading,
}: CustomerModalProps) {
  const isEdit = !!customer;
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
        customer
          ? {
            customerNumber: customer.customerNumber,
            name: customer.name,
            mobile: customer.mobile,
            address: customer.address || "",
            balance: customer.creditBalance ?? customer.openingBalance ?? 0,
          }
          : {
            customerNumber: generateCustomerID(),
            name: "",
            mobile: "",
            address: "",
            balance: 0
          },
      );
    }
  }, [open, customer, reset]);

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
      title={isEdit ? "Edit Customer" : "Create Customer"}
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button form="customer-form" type="submit" loading={loading}>
            {isEdit ? "Save Changes" : "Create Customer"}
          </Button>
        </>
      }
    >
      <form
        id="customer-form"
        onSubmit={handleSubmit(onFinalSubmit)}
        className="flex flex-col gap-4"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Customer number"
            placeholder="CUST-001"
            required
            readOnly
            disabled
            error={errors.customerNumber?.message}
            {...register("customerNumber")}
          />
          <Input
            label="Full name"
            placeholder="Customer name"
            required
            error={errors.name?.message}
            {...register("name")}
          />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Mobile number"
            placeholder="9876543210"
            required
            error={errors.mobile?.message}
            {...register("mobile")}
          />
          <Input
            label="Address"
            placeholder="Customer address"
            error={errors.address?.message}
            {...register("address")}
          />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label={isEdit ? "Current Balance (INR)" : "Opening Balance (INR)"}
            type="number"
            step="0.001"
            placeholder="0.000"
            error={errors.balance?.message}
            {...register("balance")}
          />
        </div>
        {isEdit && (
          <p className="text-xs text-blue-600 bg-blue-50 px-4 py-2 rounded-lg">
            This is the current outstanding balance. Adjusting this will record a manual balance update.
          </p>
        )}
      </form>
    </Modal>
  );
}

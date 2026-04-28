"use client";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import Modal from "@/components/ui/Modal";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";

const schema = z.object({
  adjustAmount: z.coerce.number().min(0.01, "Amount must be greater than 0"),
  adjustType: z.enum(["add", "subtract"]),
  paymentMethod: z.enum(["cash", "bank", "credit"]),
  note: z.string().optional(),
  date: z.string(),
});

type FormData = z.infer<typeof schema>;

interface CustomerBalanceModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: any) => Promise<void>;
  customerName: string;
  loading?: boolean;
}

export default function CustomerBalanceModal({
  open,
  onClose,
  onSubmit,
  customerName,
  loading,
}: CustomerBalanceModalProps) {
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
      title={`Update Balance: ${customerName}`}
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button form="balance-form" type="submit" loading={loading}>
            Update Balance
          </Button>
        </>
      }
    >
      <form id="balance-form" onSubmit={handleSubmit(onSubmitHandler)} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium">Entry Type</label>
            <select
              {...register("adjustType")}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            >
              <option value="subtract">Payment Received (Reduces Balance)</option>
              <option value="add">Balance Adjustment (Increases Balance)</option>
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium">Payment Method</label>
            <select
              {...register("paymentMethod")}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            >
              <option value="cash">Cash</option>
              <option value="bank">Bank / UPI</option>
              <option value="credit">On Account</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Input 
            label="Amount" 
            type="number" 
            step="0.01" 
            required 
            error={errors.adjustAmount?.message} 
            {...register("adjustAmount")} 
          />
          <Input label="Date" type="date" required {...register("date")} />
        </div>

        <Input label="Note / Reference" placeholder="e.g. Received via GPay" {...register("note")} />
        
        <p className="text-[10px] text-gray-500 italic">
          * Choosing "Payment Received" will subtract the amount from the customer's total outstanding balance.
        </p>
      </form>
    </Modal>
  );
}

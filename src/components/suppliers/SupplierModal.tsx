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

const schema = z.object({
    supplierNumber: z.string().min(1, "Supplier number is required"),
    name: z.string().min(1, "Name is required"),
    mobile: z.string().optional(),
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

export default function SupplierModal({ open, onClose, onSubmit, supplier, loading }: SupplierModalProps) {
    const isEdit = !!supplier;
    const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>({
        resolver: zodResolver(schema) as Resolver<FormData>,
    });

    useEffect(() => {
        if (open) {
            reset(supplier
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
                }
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
                    <Button variant="outline" onClick={onClose} disabled={loading}>Cancel</Button>
                    <Button form="supplier-form" type="submit" loading={loading}>
                        {isEdit ? "Save Changes" : "Create Supplier"}
                    </Button>
                </>
            }
        >
            <form id="supplier-form" onSubmit={handleSubmit(onFinalSubmit)} className="flex flex-col gap-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Input label="Supplier number" placeholder="SUP-001" required readOnly disabled error={errors.supplierNumber?.message} {...register("supplierNumber")} />
                    <Input label="Name" placeholder="Supplier name" required error={errors.name?.message}           {...register("name")} />
                    <Input label="Mobile number" placeholder="9876543210" error={errors.mobile?.message} {...register("mobile")} />
                    <Input label={isEdit ? "Opening Balance (INR)" : "Opening balance (INR)"} type="number" step="0.001" placeholder="0.000"
                        error={errors.balance?.message} {...register("balance")} />
                </div>
            </form>
        </Modal>
    );
}
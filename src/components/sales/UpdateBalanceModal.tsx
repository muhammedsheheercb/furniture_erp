"use client";
import { useState } from "react";
import Modal from "@/components/ui/Modal";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import CurrencySymbol from "@/components/ui/CurrencySymbol";
import axios from "axios";
import { toast } from "sonner";

interface UpdateBalanceModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  sale: any;
}

export default function UpdateBalanceModal({
  open,
  onClose,
  onSuccess,
  sale,
}: UpdateBalanceModalProps) {
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);

  if (!sale) return null;

  const balance = sale.total - (sale.advancePaid || 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const paymentAmount = Number(amount);

    if (!amount || isNaN(paymentAmount) || paymentAmount <= 0) {
      toast.error("Please enter a valid positive amount");
      return;
    }

    if (paymentAmount > balance) {
      toast.error(`Amount cannot exceed the remaining balance of ${balance.toLocaleString()}`);
      return;
    }

    setLoading(true);
    try {
      const res = await axios.post(`/api/sales/${sale._id}/payment`, {
        amount: Number(amount),
        note: `Balance update for ${sale.saleNumber}`
      });

      if (res.data.success) {
        toast.success("Balance updated successfully");
        setAmount("");
        onSuccess();
        onClose();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Failed to update balance");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`Update Balance - ${sale.saleNumber}`}
      className="max-w-md"
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} loading={loading}>
            Update Balance
          </Button>
        </>
      }
    >
      <div className="space-y-4 py-2">
        <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg border border-gray-100">
          <div>
            <p className="text-xs text-gray-500 uppercase font-semibold">Current Balance</p>
            <p className="text-xl font-bold text-[#1A1210]">
              <CurrencySymbol /> {balance.toLocaleString()}
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-500 uppercase font-semibold">Total Amount</p>
            <p className="text-sm font-medium text-gray-700">
              <CurrencySymbol /> {sale.total.toLocaleString()}
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <Input
            label="Payment Amount"
            type="number"
            placeholder="Enter amount to pay"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            min="0"
            max={balance}
            autoFocus
          />
          <p className="mt-2 text-[10px] text-gray-400">
            * This will be added to the advance paid amount.
          </p>
        </form>
      </div>
    </Modal>
  );
}

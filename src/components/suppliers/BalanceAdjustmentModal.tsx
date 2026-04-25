"use client";
import { useState } from "react";
import Modal from "@/components/ui/Modal";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import { toast } from "react-hot-toast";

interface BalanceAdjustmentModalProps {
  open: boolean;
  onClose: () => void;
  entityId: string;
  entityName: string;
  type: "customer" | "supplier";
  onSuccess: () => void;
}

export default function BalanceAdjustmentModal({ 
  open, onClose, entityId, entityName, type, onSuccess 
}: BalanceAdjustmentModalProps) {
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const endpoint = type === "customer" ? `/api/customers/${entityId}` : `/api/suppliers/${entityId}`;
      const res = await fetch(endpoint, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          adjustment: {
            amount: parseFloat(amount),
            note
          }
        }),
      });

      if (res.ok) {
        toast.success("Balance updated");
        onSuccess();
        onClose();
        setAmount("");
        setNote("");
      } else {
        const error = await res.json();
        toast.error(error.message || "Failed to update balance");
      }
    } catch (error) {
      toast.error("An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title={`Adjust Balance: ${entityName}`}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Amount (OMR)"
          type="number"
          step="0.001"
          placeholder="e.g. 50.000 or -25.500"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          required
          hint="Use positive for credit increase, negative for payment/decrease"
        />
        <Input
          label="Description / Note"
          placeholder="Reason for adjustment..."
          value={note}
          onChange={(e) => setNote(e.target.value)}
          required
        />
        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button variant="outline" type="button" onClick={onClose}>Cancel</Button>
          <Button type="submit" loading={loading}>Update Balance</Button>
        </div>
      </form>
    </Modal>
  );
}

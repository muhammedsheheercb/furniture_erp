"use client";
import { useState } from "react";
import Modal from "@/components/ui/Modal";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import CurrencySymbol from "@/components/ui/CurrencySymbol";
import axios from "axios";
import { toast } from "sonner";
import { Banknote, CreditCard, Landmark } from "lucide-react";

interface UpdateBalanceModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  sale: any;
}

const PAYMENT_METHODS = [
  { value: "cash",  label: "Cash",       icon: Banknote },
  { value: "bank",  label: "Bank",        icon: Landmark },
  { value: "credit", label: "Credit",    icon: CreditCard },
];

export default function UpdateBalanceModal({
  open,
  onClose,
  onSuccess,
  sale,
}: UpdateBalanceModalProps) {
  const [amount, setAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "bank" | "credit">("cash");
  const [loading, setLoading] = useState(false);

  if (!sale) return null;

  const totalPaid   = sale.advancePaid || 0;
  const balance     = sale.total - totalPaid;
  const afterPayment = balance - (Number(amount) || 0);

  const handleClose = () => {
    setAmount("");
    setPaymentMethod("cash");
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const paymentAmount = Number(amount);

    if (!amount || isNaN(paymentAmount) || paymentAmount <= 0) {
      toast.error("Please enter a valid positive amount");
      return;
    }
    if (paymentAmount > balance) {
      toast.error(`Amount cannot exceed remaining balance of ${balance.toLocaleString()}`);
      return;
    }

    setLoading(true);
    try {
      const res = await axios.post(`/api/sales/${sale._id}/payment`, {
        amount: paymentAmount,
        paymentMethod,
        note: `${paymentMethod.toUpperCase()} payment received for ${sale.saleNumber}`,
      });

      if (res.data.success) {
        toast.success("Payment recorded successfully");
        setAmount("");
        setPaymentMethod("cash");
        onSuccess();
        handleClose();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Failed to record payment");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title={`Receive Payment — ${sale.saleNumber}`}
      className="max-w-md"
      footer={
        <>
          <Button variant="outline" onClick={handleClose} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} loading={loading} disabled={balance <= 0}>
            Record Payment
          </Button>
        </>
      }
    >
      <div className="space-y-4 py-1">

        {/* Balance summary */}
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="p-3 rounded-xl bg-[#F0F5F2] border border-[#DDD8CE]">
            <p className="text-[10px] font-semibold text-[#5A6B60] uppercase tracking-wider mb-1">Order Total</p>
            <p className="text-base font-bold text-[#1a1a1a]">
              <CurrencySymbol /> {sale.total.toLocaleString()}
            </p>
          </div>
          <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-100">
            <p className="text-[10px] font-semibold text-emerald-600 uppercase tracking-wider mb-1">Paid So Far</p>
            <p className="text-base font-bold text-emerald-700">
              <CurrencySymbol /> {totalPaid.toLocaleString()}
            </p>
          </div>
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-100">
            <p className="text-[10px] font-semibold text-rose-500 uppercase tracking-wider mb-1">Outstanding</p>
            <p className="text-base font-bold text-rose-600">
              <CurrencySymbol /> {balance.toLocaleString()}
            </p>
          </div>
        </div>

        {balance <= 0 ? (
          <div className="text-center py-4 text-emerald-600 font-semibold text-sm bg-emerald-50 rounded-xl border border-emerald-100">
            ✓ This order is fully paid
          </div>
        ) : (
          <>
            {/* Payment method */}
            <div>
              <p className="text-xs font-semibold text-[#5A6B60] uppercase tracking-wider mb-2">Payment Method</p>
              <div className="flex gap-2">
                {PAYMENT_METHODS.map(({ value, label, icon: Icon }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setPaymentMethod(value as any)}
                    style={{
                      flex: 1,
                      padding: "10px 6px",
                      borderRadius: 10,
                      border: `2px solid ${paymentMethod === value ? "#1B3A2D" : "#DDD8CE"}`,
                      background: paymentMethod === value ? "#1B3A2D" : "#fff",
                      color: paymentMethod === value ? "#fff" : "#5A6B60",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      gap: 4,
                      cursor: "pointer",
                      fontSize: 12,
                      fontWeight: 600,
                      transition: "all 0.15s",
                    }}
                  >
                    <Icon size={16} />
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Amount */}
            <form onSubmit={handleSubmit}>
              <Input
                label="Amount to Receive"
                type="number"
                placeholder={`Max: ${balance.toLocaleString()}`}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                min="0"
                max={balance}
                autoFocus
              />
            </form>

            {/* Preview after payment */}
            {Number(amount) > 0 && Number(amount) <= balance && (
              <div className="flex justify-between items-center p-3 rounded-xl bg-[#F0F5F2] border border-[#DDD8CE] text-sm">
                <span className="text-[#5A6B60] font-medium">Remaining after payment</span>
                <span className={`font-bold ${afterPayment <= 0 ? "text-emerald-600" : "text-rose-600"}`}>
                  <CurrencySymbol /> {Math.max(0, afterPayment).toLocaleString()}
                  {afterPayment <= 0 && <span className="ml-1 text-xs">✓ Fully Paid</span>}
                </span>
              </div>
            )}
          </>
        )}

      </div>
    </Modal>
  );
}

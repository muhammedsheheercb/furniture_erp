"use client";
import { useEffect, useState } from "react";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import CurrencySymbol from "@/components/ui/CurrencySymbol";
import axios from "axios";
import { toast } from "sonner";
import { format } from "date-fns";
import { CheckCircle2, Banknote, Landmark, CreditCard } from "lucide-react";
import { useLanguage } from "../../context/LanguageContext";

interface CustomerBalanceModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  customerName: string;
  customer: any;
}

const PAYMENT_METHODS = [
  { value: "cash", label: "Cash", icon: Banknote },
  { value: "bank", label: "Bank", icon: Landmark },
  { value: "credit", label: "Credit", icon: CreditCard },
];

export default function CustomerBalanceModal({
  open,
  onClose,
  onSuccess,
  customerName,
  customer,
}: CustomerBalanceModalProps) {
  const { t } = useLanguage();
  const [sales, setSales] = useState<any[]>([]);
  const [loadingSales, setLoadingSales] = useState(false);
  const [selectedSale, setSelectedSale] = useState<any | null>(null);
  const [amount, setAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<
    "cash" | "bank" | "credit"
  >("cash");
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Fetch outstanding sales whenever modal opens
  useEffect(() => {
    if (!open || !customer?._id) return;
    setLoadingSales(true);
    axios
      .get(`/api/sales?limit=100`)
      .then((res) => {
        if (res.data.success) {
          const pending = (res.data.data as any[]).filter(
            (s) =>
              String(s.customerId) === String(customer._id) &&
              s.total - (s.advancePaid || 0) > 0,
          );
          setSales(pending);
        }
      })
      .catch(() => toast.error("Failed to load bills"))
      .finally(() => setLoadingSales(false));
  }, [open, customer?._id]);

  const handleClose = () => {
    setSelectedSale(null);
    setAmount("");
    setNote("");
    setPaymentMethod("cash");
    onClose();
  };

  const selectedBalance = selectedSale
    ? selectedSale.total - (selectedSale.advancePaid || 0)
    : 0;

  const afterPayment = selectedBalance - (Number(amount) || 0);

  const handleSubmit = async () => {
    if (!selectedSale) {
      toast.error("Please select a bill");
      return;
    }
    const pay = Number(amount);
    if (!pay || pay <= 0) {
      toast.error("Enter a valid amount");
      return;
    }
    if (pay > selectedBalance) {
      toast.error(
        `Amount cannot exceed balance of ${selectedBalance.toLocaleString()}`,
      );
      return;
    }

    setSubmitting(true);
    try {
      await axios.put(`/api/customers/${customer._id}`, {
        adjustAmount: pay,
        adjustType: "subtract",
        paymentMethod,
        note: note || `Payment for ${selectedSale.saleNumber}`,
        date: new Date().toISOString().split("T")[0],
        saleId: selectedSale._id,
      });
      toast.success("Payment recorded successfully");
      onSuccess();
      handleClose();
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Failed to record payment");
    } finally {
      setSubmitting(false);
    }
  };

  const totalOutstanding = sales.reduce(
    (sum, s) => sum + (s.total - (s.advancePaid || 0)),
    0,
  );

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title={`Receive Payment — ${customerName}`}
      footer={
        <>
          <Button variant="outline" onClick={handleClose} disabled={submitting}>
            {t("cancel")}
          </Button>
          <Button
            onClick={handleSubmit}
            loading={submitting}
            disabled={!selectedSale || !amount}
          >
            {t("recordPayment")}
          </Button>
        </>
      }
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
        {/* Total outstanding banner */}
        {totalOutstanding > 0 && (
          <div
            style={{
              background: "#FEF5E7",
              border: "1px solid #FAD7A0",
              borderRadius: 12,
              padding: "12px 16px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <div>
              <p
                style={{
                  margin: 0,
                  fontSize: 10,
                  fontWeight: 700,
                  color: "#CA6F1E",
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                }}
              >
                {t("totalOutstanding")}
              </p>
              <p
                style={{
                  margin: "2px 0 0",
                  fontSize: 22,
                  fontWeight: 800,
                  color: "#935116",
                }}
              >
                <CurrencySymbol /> {totalOutstanding.toLocaleString()}
              </p>
            </div>
            <p
              style={{
                margin: 0,
                fontSize: 12,
                color: "#CA6F1E",
                fontWeight: 600,
              }}
            >
              {sales.length} {t("pendingBill")}
              {sales.length !== 1 ? "s" : ""}
            </p>
          </div>
        )}

        {/* Bills list */}
        <div>
          <p
            style={{
              margin: "0 0 8px",
              fontSize: 11,
              fontWeight: 700,
              color: "#5A6B60",
              textTransform: "uppercase",
              letterSpacing: "0.07em",
            }}
          >
            {t("selectABillToPay")}
          </p>

          {loadingSales ? (
            <div
              style={{
                textAlign: "center",
                padding: 24,
                color: "#999",
                fontSize: 13,
              }}
            >
              {t("loadingBills")}
            </div>
          ) : sales.length === 0 ? (
            <div
              style={{
                textAlign: "center",
                padding: "20px 16px",
                background: "#F0F5F2",
                borderRadius: 10,
                color: "#5A6B60",
                fontSize: 13,
                fontWeight: 500,
              }}
            >
              {t("noOutstandingBillsForThis")}
            </div>
          ) : (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 6,
                maxHeight: 240,
                overflowY: "auto",
              }}
            >
              {sales.map((s) => {
                const bal = s.total - (s.advancePaid || 0);
                const selected = selectedSale?._id === s._id;
                return (
                  <button
                    key={s._id}
                    type="button"
                    onClick={() => {
                      setSelectedSale(s);
                      setAmount("");
                    }}
                    style={{
                      width: "100%",
                      textAlign: "left",
                      padding: "12px 14px",
                      borderRadius: 10,
                      border: `2px solid ${selected ? "#1B3A2D" : "#DDD8CE"}`,
                      background: selected ? "rgba(27,58,45,0.06)" : "#fff",
                      cursor: "pointer",
                      transition: "all 0.15s",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <div
                      style={{ display: "flex", alignItems: "center", gap: 10 }}
                    >
                      {selected ? (
                        <CheckCircle2 size={18} color="#1B3A2D" />
                      ) : (
                        <div
                          style={{
                            width: 18,
                            height: 18,
                            borderRadius: "50%",
                            border: "2px solid #DDD8CE",
                          }}
                        />
                      )}
                      <div>
                        <p
                          style={{
                            margin: 0,
                            fontWeight: 700,
                            fontSize: 13,
                            color: "#1a1a1a",
                            fontFamily: "monospace",
                          }}
                        >
                          {s.saleNumber}
                        </p>
                        <p
                          style={{
                            margin: "2px 0 0",
                            fontSize: 11,
                            color: "#8A9E94",
                          }}
                        >
                          {s.date
                            ? format(new Date(s.date), "dd MMM yyyy")
                            : ""}{" "}
                          {t("total")}
                          <CurrencySymbol />
                          {s.total.toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <p
                        style={{
                          margin: 0,
                          fontSize: 10,
                          color: "#e53e3e",
                          fontWeight: 700,
                          textTransform: "uppercase",
                          letterSpacing: "0.06em",
                        }}
                      >
                        {t("balance")}
                      </p>
                      <p
                        style={{
                          margin: "1px 0 0",
                          fontSize: 15,
                          fontWeight: 800,
                          color: "#e53e3e",
                        }}
                      >
                        <CurrencySymbol /> {bal.toLocaleString()}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Payment form — only shown after selecting a bill */}
        {selectedSale && (
          <div
            style={{
              border: "1px solid #DDD8CE",
              borderRadius: 12,
              padding: "16px",
              background: "#FAFAF8",
              display: "flex",
              flexDirection: "column",
              gap: 14,
            }}
          >
            {/* Selected bill summary */}
            <div style={{ display: "flex", gap: 10 }}>
              <div
                style={{
                  flex: 1,
                  padding: "10px 12px",
                  background: "#fff",
                  borderRadius: 8,
                  border: "1px solid #DDD8CE",
                  textAlign: "center",
                }}
              >
                <p
                  style={{
                    margin: 0,
                    fontSize: 10,
                    color: "#8A9E94",
                    fontWeight: 600,
                    textTransform: "uppercase",
                  }}
                >
                  {t("billTotal")}
                </p>
                <p
                  style={{
                    margin: "2px 0 0",
                    fontWeight: 800,
                    fontSize: 15,
                    color: "#1a1a1a",
                  }}
                >
                  <CurrencySymbol /> {selectedSale.total.toLocaleString()}
                </p>
              </div>
              <div
                style={{
                  flex: 1,
                  padding: "10px 12px",
                  background: "#EAFAF1",
                  borderRadius: 8,
                  border: "1px solid #A9DFBF",
                  textAlign: "center",
                }}
              >
                <p
                  style={{
                    margin: 0,
                    fontSize: 10,
                    color: "#1E8449",
                    fontWeight: 600,
                    textTransform: "uppercase",
                  }}
                >
                  {t("alreadyPaid")}
                </p>
                <p
                  style={{
                    margin: "2px 0 0",
                    fontWeight: 800,
                    fontSize: 15,
                    color: "#1E8449",
                  }}
                >
                  <CurrencySymbol />{" "}
                  {(selectedSale.advancePaid || 0).toLocaleString()}
                </p>
              </div>
              <div
                style={{
                  flex: 1,
                  padding: "10px 12px",
                  background: "#FDEDEC",
                  borderRadius: 8,
                  border: "1px solid #F5B7B1",
                  textAlign: "center",
                }}
              >
                <p
                  style={{
                    margin: 0,
                    fontSize: 10,
                    color: "#C0392B",
                    fontWeight: 600,
                    textTransform: "uppercase",
                  }}
                >
                  {t("balanceDue")}
                </p>
                <p
                  style={{
                    margin: "2px 0 0",
                    fontWeight: 800,
                    fontSize: 15,
                    color: "#C0392B",
                  }}
                >
                  <CurrencySymbol /> {selectedBalance.toLocaleString()}
                </p>
              </div>
            </div>

            {/* Payment method */}
            <div>
              <p
                style={{
                  margin: "0 0 6px",
                  fontSize: 11,
                  fontWeight: 700,
                  color: "#5A6B60",
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                }}
              >
                {t("paymentMethod")}
              </p>
              <div style={{ display: "flex", gap: 8 }}>
                {PAYMENT_METHODS.map(({ value, label, icon: Icon }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setPaymentMethod(value as any)}
                    style={{
                      flex: 1,
                      padding: "9px 6px",
                      borderRadius: 8,
                      border: `2px solid ${paymentMethod === value ? "#1B3A2D" : "#DDD8CE"}`,
                      background: paymentMethod === value ? "#1B3A2D" : "#fff",
                      color: paymentMethod === value ? "#fff" : "#5A6B60",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      gap: 4,
                      cursor: "pointer",
                      fontSize: 11,
                      fontWeight: 700,
                      transition: "all 0.15s",
                    }}
                  >
                    <Icon size={15} />
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Amount input */}
            <div>
              <label
                style={{
                  display: "block",
                  fontSize: 11,
                  fontWeight: 700,
                  color: "#5A6B60",
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                  marginBottom: 6,
                }}
              >
                {t("amountToPay")}
                <span
                  style={{
                    color: "#8A9E94",
                    fontWeight: 400,
                    textTransform: "none",
                  }}
                >
                  {t("max")}
                  {selectedBalance.toLocaleString()})
                </span>
              </label>
              <input
                type="number"
                placeholder={`Enter amount (max ${selectedBalance.toLocaleString()})`}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                min={0.01}
                max={selectedBalance}
                step="0.01"
                autoFocus
                style={{
                  width: "100%",
                  height: 44,
                  borderRadius: 8,
                  border: "1.5px solid #DDD8CE",
                  padding: "0 12px",
                  fontSize: 14,
                  color: "#1a1a1a",
                  background: "#fff",
                  outline: "none",
                  boxSizing: "border-box",
                }}
                onFocus={(e) => (e.target.style.borderColor = "#1B3A2D")}
                onBlur={(e) => (e.target.style.borderColor = "#DDD8CE")}
              />
            </div>

            {/* Note */}
            <div>
              <label
                style={{
                  display: "block",
                  fontSize: 11,
                  fontWeight: 700,
                  color: "#5A6B60",
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                  marginBottom: 6,
                }}
              >
                {t("note")}
                <span style={{ fontWeight: 400, textTransform: "none" }}>
                  {t("optional")}
                </span>
              </label>
              <input
                type="text"
                placeholder={t("egCashReceivedGpayRef")}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                style={{
                  width: "100%",
                  height: 40,
                  borderRadius: 8,
                  border: "1.5px solid #DDD8CE",
                  padding: "0 12px",
                  fontSize: 13,
                  color: "#1a1a1a",
                  background: "#fff",
                  outline: "none",
                  boxSizing: "border-box",
                }}
                onFocus={(e) => (e.target.style.borderColor = "#1B3A2D")}
                onBlur={(e) => (e.target.style.borderColor = "#DDD8CE")}
              />
            </div>

            {/* After payment preview */}
            {Number(amount) > 0 && Number(amount) <= selectedBalance && (
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "10px 14px",
                  background: "#F0F5F2",
                  borderRadius: 8,
                  border: "1px solid #DDD8CE",
                }}
              >
                <span
                  style={{ fontSize: 13, fontWeight: 600, color: "#5A6B60" }}
                >
                  {t("remainingBalanceAfterPayment")}
                </span>
                <span
                  style={{
                    fontSize: 15,
                    fontWeight: 800,
                    color: afterPayment <= 0 ? "#1E8449" : "#C0392B",
                  }}
                >
                  <CurrencySymbol />{" "}
                  {Math.max(0, afterPayment).toLocaleString()}
                  {afterPayment <= 0 && (
                    <span
                      style={{
                        marginLeft: 6,
                        fontSize: 11,
                        background: "#EAFAF1",
                        color: "#1E8449",
                        padding: "2px 6px",
                        borderRadius: 4,
                      }}
                    >
                      {t("fullyPaid")}
                    </span>
                  )}
                </span>
              </div>
            )}
          </div>
        )}
      </div>
    </Modal>
  );
}

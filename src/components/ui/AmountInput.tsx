"use client";

import { forwardRef, useState, type InputHTMLAttributes } from "react";
import { amountText, limitAmountInput } from "@/lib/amounts";

/** Keeps an editing draft so numeric state does not erase `10.150` while typing. */
export const AmountInput = forwardRef<
  HTMLInputElement,
  InputHTMLAttributes<HTMLInputElement>
>(({ value, defaultValue, onChange, onBlur, ...props }, ref) => {
  const [draft, setDraft] = useState<string | null>(null);
  const controlled = value !== undefined;
  const matchesDraft =
    draft !== null &&
    (String(value ?? "") === draft ||
      (draft !== "" && Number(value) === Number(draft)) ||
      (draft === "" && (value === "" || value === 0)));
  const display = controlled
    ? matchesDraft
      ? draft
      : value === ""
        ? ""
        : amountText(typeof value === "number" ? value : String(value))
    : undefined;
  return (
    <input
      {...props}
      ref={ref}
      type="number"
      inputMode="decimal"
      step="0.001"
      value={display}
      defaultValue={
        defaultValue === undefined
          ? undefined
          : limitAmountInput(String(defaultValue))
      }
      onChange={(event) => {
        const next = limitAmountInput(event.currentTarget.value);
        if (next !== event.currentTarget.value)
          event.currentTarget.value = next;
        setDraft(next);
        onChange?.(event);
      }}
      onBlur={(event) => {
        setDraft(null);
        onBlur?.(event);
      }}
    />
  );
});
AmountInput.displayName = "AmountInput";

/** Amounts are truncated for presentation; calculations retain their precision. */
export function amountText(value: number | string | null | undefined): string {
  if (value == null || value === "") return "0";
  let raw = String(value);
  if (!Number.isFinite(Number(raw))) return "0";
  if (typeof value === "number") {
    // Correct only binary floating-point noise at a three-decimal boundary.
    const scaled = value * 1000;
    const nearest = Math.round(scaled);
    if (Math.abs(scaled - nearest) <= Number.EPSILON * Math.abs(scaled) * 2) {
      raw = String(nearest / 1000);
    }
  }
  const [coefficient = "0", exponentText] = raw.toLowerCase().split("e");
  if (exponentText !== undefined) {
    const negative = coefficient.startsWith("-");
    const unsigned = coefficient.replace(/^[+-]/, "");
    const [whole = "0", fraction = ""] = unsigned.split(".");
    const digits = whole + fraction;
    const point = whole.length + Number(exponentText);
    raw =
      (negative ? "-" : "") +
      (point <= 0
        ? "0." + "0".repeat(-point) + digits
        : point >= digits.length
          ? digits + "0".repeat(point - digits.length)
          : digits.slice(0, point) + "." + digits.slice(point));
  }
  const [whole = "0", fraction] = raw.split(".");
  const integer =
    whole === "" || whole === "+" ? "0" : whole === "-" ? "-0" : whole;
  return integer + (fraction !== undefined ? "." + fraction.slice(0, 3) : "");
}

/** Fixed three-decimal amount, with grouping and no rounding. */
export function formatAmount(
  value: number | string | null | undefined,
  locale = "en-OM",
): string {
  const raw = amountText(value);
  const [whole = "0", fraction = ""] = raw.split(".");
  const negative = whole.startsWith("-");
  const grouped = BigInt(whole || "0").toLocaleString(locale);
  return (
    (negative && BigInt(whole) === BigInt(0) ? "-" : "") +
    grouped +
    "." +
    fraction.padEnd(3, "0")
  );
}

/** Preserve the editable decimal point and trailing zeros while limiting precision. */
export function limitAmountInput(value: string): string {
  if (value === "" || value === "-" || value === "." || value === "-.")
    return value;
  return amountText(value);
}

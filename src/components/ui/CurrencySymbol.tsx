"use client";
import React from "react";
import { useLanguage } from "../../context/LanguageContext";

interface CurrencySymbolProps {
  className?: string;
  plain?: boolean;
}

export default function CurrencySymbol({
  className = "w-4 h-4 inline-block align-middle",
  plain = false,
}: CurrencySymbolProps) {
  const { t } = useLanguage();
  if (plain) return <>{t("omr")}</>;

  return (
    <img
      src="/images/money.webp"
      alt={t("omr")}
      className={className}
      style={{
        display: "inline-block",
        verticalAlign: "middle",
        marginRight: "2px",
      }}
    />
  );
}

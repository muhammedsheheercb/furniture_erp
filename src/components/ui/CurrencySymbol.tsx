"use client";
import Image from "next/image";

export default function CurrencySymbol() {
  return (
    <span className="inline-flex items-center self-center mr-1">
      <img 
        src="/images/money.webp" 
        alt="Currency" 
        className="h-3.5 w-auto object-contain" 
        style={{ display: 'inline-block', verticalAlign: 'middle' }}
      />
    </span>
  );
}

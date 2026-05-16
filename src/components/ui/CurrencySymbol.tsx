import React from "react";

interface CurrencySymbolProps {
  className?: string;
}

export default function CurrencySymbol({ className = "w-4 h-4 inline-block align-middle" }: CurrencySymbolProps) {
  return (
    <img 
      src="/images/money.webp" 
      alt="OMR" 
      className={className} 
      style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '2px' }}
    />
  );
}

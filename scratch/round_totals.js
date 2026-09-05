const fs = require('fs');

// page.tsx
const pagePath = '/home/sheheer/freelance/furniture_erp/src/app/(dashboard)/quotations/page.tsx';
let page = fs.readFileSync(pagePath, 'utf8');
page = page.replace(
  'return { subtotal, taxAmt, total: subtotal + taxAmt - discAmt };',
  'return { subtotal, taxAmt, total: Math.round(subtotal + taxAmt - discAmt) };'
);
fs.writeFileSync(pagePath, page);

// SaleModal.tsx
const salePath = '/home/sheheer/freelance/furniture_erp/src/components/sales/SaleModal.tsx';
let sale = fs.readFileSync(salePath, 'utf8');
sale = sale.replace(
  'const grandTotal = Math.max(\n    0,\n    subtotalAfterItemDiscount + taxAmount - discAmt,\n  );',
  'const grandTotal = Math.round(Math.max(\n    0,\n    subtotalAfterItemDiscount + taxAmount - discAmt,\n  ));'
);
fs.writeFileSync(salePath, sale);

console.log('done');

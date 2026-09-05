const fs = require('fs');

// 1. Update Translations
const enPath = '/home/sheheer/freelance/furniture_erp/src/locales/en.json';
let en = JSON.parse(fs.readFileSync(enPath, 'utf8'));
en.chooseAvailableProduct = "Choose Available Product";
fs.writeFileSync(enPath, JSON.stringify(en, null, 2));

const arPath = '/home/sheheer/freelance/furniture_erp/src/locales/ar.json';
let ar = JSON.parse(fs.readFileSync(arPath, 'utf8'));
ar.chooseAvailableProduct = "اختر المنتج المتاح";
fs.writeFileSync(arPath, JSON.stringify(ar, null, 2));

// 2. Update QuotationItemModal.tsx
const qModalPath = '/home/sheheer/freelance/furniture_erp/src/components/quotations/QuotationItemModal.tsx';
let qModal = fs.readFileSync(qModalPath, 'utf8');

// FormState
qModal = qModal.replace(
  /pricing: \{\s*materialCost: number;\s*laborCost: number;\s*extraCost: number;\s*totalCost: number;\s*profitMargin: number;\s*sellingPrice: number;\s*discountPrice: number;\s*\};\s*bom: BomRow\[\];\s*\}/,
  `pricing: {
    materialCost: number;
    laborCost: number;
    extraCost: number;
    totalCost: number;
    profitMargin: number;
    sellingPrice: number;
    discountPrice: number;
  };
  bom: BomRow[];
  itemId?: string;
}`
);

// makeEmpty
qModal = qModal.replace(
  /discountPrice: 0,\s*\},\s*bom: \[\],\s*\};/,
  `discountPrice: 0,
    },
    bom: [],
    itemId: undefined,
  };`
);

// handleProductSelect
qModal = qModal.replace(
  /productName: p\.name,\s*category: p\.category \|\| "Sofa",/,
  `productName: p.name,
      itemId: p._id,
      category: p.category || "Sofa",`
);

// onSubmit
qModal = qModal.replace(
  /itemName: form\.productName\.trim\(\),\s*category: form\.category as any,/,
  `itemName: form.productName.trim(),
      itemId: form.itemId,
      category: form.category as any,`
);

// labels / titles
qModal = qModal.replace(
  /title=\{\s*editItem \? \`Edit: \$\{editItem\.itemName\}\` : "Add Product to Quotation"\s*\}/,
  `title={
        editItem ? \`Edit: \$\{editItem.itemName\}\` : t("chooseAvailableProduct")
      }`
);
qModal = qModal.replace(
  /\{t\("quickSelectExistingProduct"\)\}/g,
  `{t("chooseAvailableProduct")}`
);


// BOM table Price/Unit removal
// Remove headers
qModal = qModal.replace(/<th className="py-2\.5 px-3 text-end text-xs font-bold text-\[#7A6055\] uppercase w-20">\s*\{t\("priceunit"\)\}\s*<\/th>/, "");
qModal = qModal.replace(/<th className="py-2\.5 px-3 text-end text-xs font-bold text-\[#7A6055\] uppercase w-24">\s*\{t\("subtotal"\)\}\s*<\/th>/, "");

// Remove body cells
qModal = qModal.replace(/\{\/\* Price\/Unit \(read-only\) \*\/\}\s*<td className="px-3 py-2 text-end font-mono text-xs text-\[#7A6055\]">\s*\{row\.pricePerUnit > 0 \? \(\s*<>\s*<CurrencySymbol className="w-3 h-3 me-0\.5" \/>\s*\{row\.pricePerUnit\}\s*<\/>\s*\) : \(\s*"—"\s*\)\}\s*<\/td>/, "");

qModal = qModal.replace(/\{\/\* Subtotal \*\/\}\s*<td className="px-3 py-2 text-end font-mono font-semibold text-\[#1B3A2D\]">\s*\{row\.subtotal > 0 \? \(\s*<>\s*<CurrencySymbol className="w-3 h-3 me-0\.5" \/>\s*\{row\.subtotal\.toLocaleString\("en-IN", \{\s*minimumFractionDigits: 2,\s*maximumFractionDigits: 3,\s*\}\)\}\s*<\/>\s*\) : \(\s*"—"\s*\)\}\s*<\/td>/, "");

// Remove price from batch dropdown text
qModal = qModal.replace(/\{b\.batchNumber \|\| \`Batch \$\{bi \+ 1\}\`\} —\{" "\}\s*<CurrencySymbol plain \/>\s*\{b\.purchasePrice\} \|/g, "{b.batchNumber || `Batch ${bi + 1}`} |");

fs.writeFileSync(qModalPath, qModal);

// 3. Update page.tsx (Quotation Address)
const pagePath = '/home/sheheer/freelance/furniture_erp/src/app/(dashboard)/quotations/page.tsx';
let page = fs.readFileSync(pagePath, 'utf8');

page = page.replace(
  /if \(\!form\.customerAddress\?\.trim\(\)\)\s*return toast\.error\("Customer address is required"\);/,
  ``
);

// Removing `required` from textarea for customerAddress
page = page.replace(
  /value=\{form\.customerAddress\}\s*onChange=\{\(e\) =>\s*setForm\(\(f\) => \(\{ \.\.\.f, customerAddress: e\.target\.value \}\)\)\s*\}\s*required\s*style=\{\{/g,
  `value={form.customerAddress}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, customerAddress: e.target.value }))
                  }
                  style={{`
);

fs.writeFileSync(pagePath, page);

console.log("Updates applied successfully.");

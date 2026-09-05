const fs = require('fs');
const path = '/home/sheheer/freelance/furniture_erp/src/components/production/ProductionModal.tsx';
let code = fs.readFileSync(path, 'utf8');

// 1. Update TABS
code = code.replace(
  /const TABS = \[\s*\{ id: "basic", label: "Basic Info", icon: Package \},\s*\{ id: "dimensions", label: "Dimensions", icon: Ruler \},\s*\{ id: "pricing", label: "Pricing", icon: Tag \},\s*\{ id: "bom", label: "BOM", icon: Layers \},\s*\];/g,
  `const TABS = [\n  { id: "basic", label: "Basic Info", icon: Package },\n  { id: "bom", label: "BOM", icon: Layers },\n];`
);

// 2. Add hasEmptyBOM logic
const errorLogicRegex = /const hasStockError = itemStates\.some\(\(item\) =>\s*item\.bom\.some\(\(b: any\) => b\.batchNumber && b\.quantity > b\.availableQty\),\s*\);/;
if (code.match(errorLogicRegex)) {
  code = code.replace(
    errorLogicRegex,
    `const hasStockError = itemStates.some((item) =>\n    item.bom.some((b: any) => b.batchNumber && b.quantity > b.availableQty),\n  );\n  const hasEmptyBOM = itemStates.some((item) => !item.bom || item.bom.length === 0);`
  );
}

// 3. Update footer to disable button if hasEmptyBOM
const footerRegex = /\{!hasStockError \? \(\s*<Button onClick=\{handleFinalSubmit\} loading=\{loading\}>\s*\{t\("startWorkDownloadJobCard"\)\}\s*<\/Button>\s*\) : \(/g;
if (code.match(footerRegex)) {
  code = code.replace(
    footerRegex,
    `{!hasStockError && !hasEmptyBOM ? (\n            <Button onClick={handleFinalSubmit} loading={loading}>\n              {t("startWorkDownloadJobCard")}\n            </Button>\n          ) : hasEmptyBOM ? (\n            <div className="flex items-center gap-2 text-rose-500 bg-rose-50 px-4 py-2 rounded-lg border border-rose-100 animate-pulse">\n              <AlertCircle size={16} />\n              <span className="text-xs font-bold uppercase tracking-tight">\n                {t("bomRequired") || "BOM Required to Start Work"}\n              </span>\n            </div>\n          ) : (`
  );
}

// 4. Update handleFinalSubmit
const submitRegex = /const handleFinalSubmit = async \(\) => \{\s*if \(\!deliveryDate\) return toast\.error\("Please set a target delivery date"\);\s*if \(\!selectedWorker\)\s*return toast\.error\("Please assign a production worker"\);/;
if (code.match(submitRegex)) {
  code = code.replace(
    submitRegex,
    `const handleFinalSubmit = async () => {\n    if (!deliveryDate) return toast.error("Please set a target delivery date");\n    if (!selectedWorker)\n      return toast.error("Please assign a production worker");\n    if (itemStates.some(it => !it.bom || it.bom.length === 0)) return toast.error("Please add materials to the BOM before starting work.");`
  );
}

// 5. Remove dimensions and pricing tabs content
// Using regex to remove from {/* Tab: Dimensions */} to {/* Tab: BOM */}
const tabRemovalRegex = /\{\/\* Tab: Dimensions \*\/\}[\s\S]*?\{\/\* Tab: BOM \*\/\}/g;
if (code.match(tabRemovalRegex)) {
  code = code.replace(tabRemovalRegex, `{/* Tab: BOM */}`);
}

fs.writeFileSync(path, code);
console.log("Updated ProductionModal.tsx.");

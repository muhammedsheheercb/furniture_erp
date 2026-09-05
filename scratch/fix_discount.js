const fs = require('fs');
const path = '/home/sheheer/freelance/furniture_erp/src/app/(dashboard)/quotations/page.tsx';
let content = fs.readFileSync(path, 'utf8');

// Replace item discount formula
content = content.replace(/i\.price \* i\.quantity \* \(1 - \(i\.discount \|\| 0\) \/ 100\)/g, 'Math.max(0, i.price * i.quantity - (i.discount || 0))');
content = content.replace(/updated\.price \* updated\.quantity \* \(1 - \(updated\.discount \|\| 0\) \/ 100\)/g, 'Math.max(0, updated.price * updated.quantity - (updated.discount || 0))');
content = content.replace(/it\.price \* it\.quantity \* \(1 - \(it\.discount \|\| 0\) \/ 100\)/g, 'Math.max(0, it.price * it.quantity - (it.discount || 0))');

// Item discount total (in reduce)
content = content.replace(/\(i\.price \* i\.quantity \* \(i\.discount \|\| 0\)\) \/ 100/g, '(i.discount || 0)');

// Global discount
content = content.replace(/const globalDiscountAmt = form\.subtotal \* \(discPct \/ 100\);/g, 'const globalDiscountAmt = discPct || 0;');

// View modal - global discount display
content = content.replace(/\{formatCurrency\(\(q\.subtotal \* \(q\.discount \|\| 0\)\) \/ 100\)\}/g, '{formatCurrency(q.discount || 0)}');
content = content.replace(/<small>\(\{q\.discount\}%\)<\/small>/g, '');

// Global discount input label
content = content.replace(/\{t\("discount"\)\} \(%\)/g, '{t("discountAmount")}');

// Remove {item.discount}%
content = content.replace(/\{item\.discount\}%/g, '{item.discount}');

// extraDiscount text rendering which was `{discPct}%)`
content = content.replace(/\{discPct\}%\)/g, '');

// Remove max={100} from discPct input
content = content.replace(/max=\{100\}\n(\s+)style=\{\{\n\s+width: 60/g, 'style={{\n$1width: 60');

fs.writeFileSync(path, content);
console.log('done');

const fs = require('fs');
const path = '/home/sheheer/freelance/furniture_erp/src/app/(dashboard)/quotations/page.tsx';
let content = fs.readFileSync(path, 'utf8');

content = content.replace(/const discAmt = subtotal \* \(discPct \/ 100\);/g, 'const discAmt = discPct || 0;');
content = content.replace(/"Disc%"/g, '"Discount"');

fs.writeFileSync(path, content);
console.log('done');

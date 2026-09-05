const fs = require('fs');

const path = '/home/sheheer/freelance/furniture_erp/src/app/api/production/route.ts';
let code = fs.readFileSync(path, 'utf8');

if (!code.includes('import Sale from "@/models/Sale";') && !code.includes('import "@/models/Sale";')) {
  code = code.replace(
    'import Production from "@/models/Production";',
    'import Production from "@/models/Production";\nimport "@/models/Sale";'
  );
  fs.writeFileSync(path, code);
  console.log('Fixed');
} else {
  console.log('Already there');
}


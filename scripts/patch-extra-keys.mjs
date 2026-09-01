import fs from 'fs';

const enPath = './src/locales/en.json';
const arPath = './src/locales/ar.json';

const en = JSON.parse(fs.readFileSync(enPath, 'utf8'));
const ar = JSON.parse(fs.readFileSync(arPath, 'utf8'));

const newKeys = {
  "clickToCollapse": ["Click to collapse", "انقر للطي"],
  "clickToSeeBreakdown": ["Click to see breakdown", "انقر لرؤية التفاصيل"],
  "languageToggle": ["العربية", "English"]
};

for (const [key, [enVal, arVal]] of Object.entries(newKeys)) {
  if (!en[key]) en[key] = enVal;
  if (!ar[key]) ar[key] = arVal;
}

fs.writeFileSync(enPath, JSON.stringify(en, null, 2));
fs.writeFileSync(arPath, JSON.stringify(ar, null, 2));

console.log("Missing dashboard keys added.");

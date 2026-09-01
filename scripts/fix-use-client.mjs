import fs from 'fs';
import path from 'path';

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? walkDir(dirPath, callback) : callback(path.join(dir, f));
  });
}

let fixed = 0;
walkDir('./src', (filePath) => {
  if (filePath.endsWith('.tsx') || filePath.endsWith('.ts')) {
    let content = fs.readFileSync(filePath, 'utf8');
    if (content.includes('useLanguage') && !content.includes('"use client";') && !content.includes("'use client';")) {
      fs.writeFileSync(filePath, '"use client";\n' + content);
      console.log('Fixed', filePath);
      fixed++;
    }
  }
});
console.log('Total fixed:', fixed);

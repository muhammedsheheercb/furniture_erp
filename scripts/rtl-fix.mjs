import fs from 'fs';
import path from 'path';

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? walkDir(dirPath, callback) : callback(path.join(dir, f));
  });
}

const replacements = [
  { regex: /(?<=["'\s`])ml-([\w\[\]\.]+)(?=["'\s`])/g, replace: "ms-$1" },
  { regex: /(?<=["'\s`])mr-([\w\[\]\.]+)(?=["'\s`])/g, replace: "me-$1" },
  { regex: /(?<=["'\s`])pl-([\w\[\]\.]+)(?=["'\s`])/g, replace: "ps-$1" },
  { regex: /(?<=["'\s`])pr-([\w\[\]\.]+)(?=["'\s`])/g, replace: "pe-$1" },
  { regex: /(?<=["'\s`])text-left(?=["'\s`])/g, replace: "text-start" },
  { regex: /(?<=["'\s`])text-right(?=["'\s`])/g, replace: "text-end" },
  { regex: /(?<=["'\s`])border-l-([\w\[\]\.]+)(?=["'\s`])/g, replace: "border-s-$1" },
  { regex: /(?<=["'\s`])border-r-([\w\[\]\.]+)(?=["'\s`])/g, replace: "border-e-$1" },
  { regex: /(?<=["'\s`])border-l(?=["'\s`])/g, replace: "border-s" },
  { regex: /(?<=["'\s`])border-r(?=["'\s`])/g, replace: "border-e" },
  { regex: /(?<=["'\s`])rounded-l-([\w\[\]\.]+)(?=["'\s`])/g, replace: "rounded-s-$1" },
  { regex: /(?<=["'\s`])rounded-r-([\w\[\]\.]+)(?=["'\s`])/g, replace: "rounded-e-$1" },
  { regex: /(?<=["'\s`])rounded-tl-([\w\[\]\.]+)(?=["'\s`])/g, replace: "rounded-ss-$1" },
  { regex: /(?<=["'\s`])rounded-tr-([\w\[\]\.]+)(?=["'\s`])/g, replace: "rounded-se-$1" },
  { regex: /(?<=["'\s`])rounded-bl-([\w\[\]\.]+)(?=["'\s`])/g, replace: "rounded-es-$1" },
  { regex: /(?<=["'\s`])rounded-br-([\w\[\]\.]+)(?=["'\s`])/g, replace: "rounded-ee-$1" },
  { regex: /(?<=["'\s`])left-([\w\[\]\.]+)(?=["'\s`])/g, replace: "start-$1" },
  { regex: /(?<=["'\s`])right-([\w\[\]\.]+)(?=["'\s`])/g, replace: "end-$1" },
];

let changedFiles = 0;

walkDir('./src', (filePath) => {
  if (filePath.endsWith('.tsx') || filePath.endsWith('.ts')) {
    let content = fs.readFileSync(filePath, 'utf8');
    let newContent = content;
    
    replacements.forEach(({ regex, replace }) => {
      newContent = newContent.replace(regex, replace);
    });
    
    if (newContent !== content) {
      fs.writeFileSync(filePath, newContent);
      changedFiles++;
    }
  }
});

console.log(`Updated ${changedFiles} files with logical properties for RTL.`);

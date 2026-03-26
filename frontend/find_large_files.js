const fs = require('fs');
const path = require('path');

function getFiles(dir, files = []) {
  const list = fs.readdirSync(dir);
  for (const item of list) {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      getFiles(fullPath, files);
    } else if (fullPath.match(/\.(ts|tsx)$/)) {
      files.push({ file: fullPath, size: stat.size });
    }
  }
  return files;
}

const files = getFiles('d:/meu-contador/frontend/src');
files.sort((a, b) => b.size - a.size);
console.log(files.slice(0, 10).map(f => `${f.file}: ${f.size} bytes`).join('\n'));

const fs = require('fs');
const path = require('path');
const en = JSON.parse(fs.readFileSync(path.join(__dirname, '../src/i18n/locales/en.json'), 'utf8')).translation;

function hasKey(obj, pathArr) {
  let cur = obj;
  for (const part of pathArr) {
    if (!cur || typeof cur !== 'object') return false;
    cur = cur[part];
  }
  return cur !== undefined;
}

function getFiles(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    const full = path.join(dir, file);
    const stat = fs.statSync(full);
    if (stat && stat.isDirectory()) {
      results = results.concat(getFiles(full));
    } else if (full.endsWith('.jsx') || (full.endsWith('.js') && !full.includes('check_keys'))) {
      results.push(full);
    }
  });
  return results;
}

const files = getFiles(path.join(__dirname, '../src'));
const missingKeys = new Set();
const keyRegex = /t\(\s*['"]([a-zA-Z0-9_.]+)['"]/g;

files.forEach(f => {
  const content = fs.readFileSync(f, 'utf8');
  let match;
  while ((match = keyRegex.exec(content)) !== null) {
    const key = match[1];
    const parts = key.split('.');
    if (!hasKey(en, parts)) {
      missingKeys.add(`${key} (in ${path.relative(path.join(__dirname, '..'), f)})`);
    }
  }
});

console.log('Total files checked:', files.length);
console.log('Keys used in JSX/JS but missing from translation files:');
const missing = Array.from(missingKeys);
console.log(missing);
console.log('Count:', missing.length);

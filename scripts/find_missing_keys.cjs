const fs = require('fs');
const path = require('path');

const en = JSON.parse(fs.readFileSync(path.join(__dirname, '../src/i18n/locales/en.json'), 'utf8')).translation;
const extracted = JSON.parse(fs.readFileSync(path.join(__dirname, 'all_extracted_keys.json'), 'utf8'));

function hasKey(obj, pathArr) {
  let cur = obj;
  for (const part of pathArr) {
    if (!cur || typeof cur !== 'object') return false;
    cur = cur[part];
  }
  return cur !== undefined;
}

const missing = {};
for (const [key, fallback] of Object.entries(extracted)) {
  const parts = key.split('.');
  if (!hasKey(en, parts)) {
    missing[key] = fallback;
  }
}

fs.writeFileSync(path.join(__dirname, 'missing_keys.json'), JSON.stringify(missing, null, 2));
console.log('Missing keys count:', Object.keys(missing).length);
console.log(missing);

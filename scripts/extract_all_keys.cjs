const fs = require('fs');
const path = require('path');

function getFiles(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    const full = path.join(dir, file);
    const stat = fs.statSync(full);
    if (stat && stat.isDirectory()) {
      results = results.concat(getFiles(full));
    } else if (full.endsWith('.jsx') || (full.endsWith('.js') && !full.includes('check_') && !full.includes('extract_'))) {
      results.push(full);
    }
  });
  return results;
}

const files = getFiles(path.join(__dirname, '../src'));
// Match t('key', 'Default text') or t("key", "Default text") or t('key')
const tCallRegex = /t\(\s*['"]([a-zA-Z0-9_.]+)['"](?:\s*,\s*(?:['"`]([\s\S]*?)['"`]|([a-zA-Z0-9_]+)))?\s*\)/g;

const extracted = {};

files.forEach(f => {
  const content = fs.readFileSync(f, 'utf8');
  let match;
  while ((match = tCallRegex.exec(content)) !== null) {
    const key = match[1];
    let fallback = match[2];
    if (key === 'T' || key === 'a' || key === 'email') continue; // skip noise/vars
    if (!extracted[key]) {
      extracted[key] = fallback ? fallback.replace(/\\n/g, ' ').replace(/\s+/g, ' ').trim() : key;
    }
  }
});

fs.writeFileSync(path.join(__dirname, 'all_extracted_keys.json'), JSON.stringify(extracted, null, 2));
console.log('Total extracted keys:', Object.keys(extracted).length);

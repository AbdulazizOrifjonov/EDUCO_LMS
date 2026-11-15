import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const srcDir = path.resolve(__dirname, '..', 'src');

const report = {
  fixedWidths: [],
  unresponsiveGrids: [],
  unwrappedTables: [],
  overflowHiddenContainers: [],
  viewportMeta: null,
};

function scanFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');

  lines.forEach((line, idx) => {
    const lineNum = idx + 1;
    const trimmed = line.trim();

    // 1. Fixed large width classes (>= 320px) without responsive prefix
    const fixedWidthRegex = /(?<!(?:sm|md|lg|xl|2xl):)(?<!max-)\bw-\[(\d+)px\]/g;
    let match;
    while ((match = fixedWidthRegex.exec(line)) !== null) {
      const px = parseInt(match[1]);
      if (px >= 320) {
        report.fixedWidths.push({
          file: path.relative(srcDir, filePath),
          line: lineNum,
          px,
          snippet: trimmed,
        });
      }
    }

    // 2. Fixed large min-w classes (>= 350px) without overflow wrapper context
    const minWidthRegex = /(?<!(?:sm|md|lg|xl|2xl):)\bmin-w-\[(\d+)px\]/g;
    while ((match = minWidthRegex.exec(line)) !== null) {
      const px = parseInt(match[1]);
      if (px >= 350) {
        report.fixedWidths.push({
          file: path.relative(srcDir, filePath),
          line: lineNum,
          type: 'min-w',
          px,
          snippet: trimmed,
        });
      }
    }

    // 3. Grid cols >= 3 without responsive prefix
    const gridColsRegex = /(?<!(?:sm|md|lg|xl|2xl):)\bgrid-cols-([3-9]|1[0-2])\b/g;
    while ((match = gridColsRegex.exec(line)) !== null) {
      if (!line.includes('sm:') && !line.includes('md:') && !line.includes('lg:') && !line.includes('xs:')) {
        report.unresponsiveGrids.push({
          file: path.relative(srcDir, filePath),
          line: lineNum,
          cols: match[1],
          snippet: trimmed,
        });
      }
    }

    // 4. Raw tables without table-fixed or responsive overflow
    if (trimmed.startsWith('<table') && !trimmed.includes('table-fixed')) {
      const prevContext = lines.slice(Math.max(0, idx - 6), idx).join(' ');
      if (!prevContext.includes('overflow-x') && !prevContext.includes('overflow-auto') && !prevContext.includes('table-responsive')) {
        report.unwrappedTables.push({
          file: path.relative(srcDir, filePath),
          line: lineNum,
          snippet: trimmed,
        });
      }
    }
  });
}

function walkDir(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name !== 'node_modules' && entry.name !== '.git' && entry.name !== 'dist') {
        walkDir(fullPath);
      }
    } else if (entry.name.endsWith('.jsx') || entry.name.endsWith('.js') || entry.name.endsWith('.css')) {
      scanFile(fullPath);
    }
  }
}

walkDir(srcDir);

// Check index.html viewport
const indexHtml = fs.readFileSync(path.resolve(__dirname, '..', 'index.html'), 'utf8');
const vpMatch = indexHtml.match(/<meta[^>]*name=["']viewport["'][^>]*>/i);
report.viewportMeta = vpMatch ? vpMatch[0] : 'MISSING';

console.log('=== RESPONSIVE MEDIA & PIXEL-PERFECT AUDIT REPORT ===');
console.log('Viewport Meta:', report.viewportMeta);
console.log('\n--- 1. Fixed Widths >= 320px without responsive prefix (' + report.fixedWidths.length + ') ---');
report.fixedWidths.forEach(item => {
  console.log(`[${item.file}:${item.line}] ${item.type || 'width'}: ${item.px}px -> ${item.snippet.substring(0, 100)}`);
});

console.log('\n--- 2. Unresponsive Grids >= 3 cols without breakpoints (' + report.unresponsiveGrids.length + ') ---');
report.unresponsiveGrids.forEach(item => {
  console.log(`[${item.file}:${item.line}] ${item.cols} cols -> ${item.snippet.substring(0, 100)}`);
});

console.log('\n--- 3. Unwrapped Tables without overflow-x/table-fixed (' + report.unwrappedTables.length + ') ---');
report.unwrappedTables.forEach(item => {
  console.log(`[${item.file}:${item.line}] -> ${item.snippet.substring(0, 100)}`);
});

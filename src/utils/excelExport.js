import * as XLSX from 'xlsx';

/**
 * Exports data to a genuine Microsoft Excel (.xlsx) workbook and triggers browser download.
 * Ensures clean multi-column layouts, proper cell data types, and auto-adjusted column widths
 * so WPS Office and Microsoft Excel open every field in its own dedicated, legible column.
 *
 * @param {Array<{ key: string, label: string }|string>} columns - Column definitions
 * @param {Array<Object>} rows - Data rows
 * @param {string} filename - Target filename (e.g. 'educo_master_baza.xlsx')
 * @param {Object} [options] - Optional settings (sheetName, autoWidth)
 * @returns {Blob|null} The generated XLSX blob
 */
export function exportToExcel(columns = [], rows = [], filename = 'export.xlsx', options = {}) {
  if (!rows || !rows.length) {
    console.warn('exportToExcel: No rows provided.');
  }

  // Normalize column definitions
  const colDefs = columns.map((col) => {
    if (typeof col === 'string') {
      return { key: col, label: col };
    }
    return {
      key: col.key || col.id,
      label: col.label || col.header || col.key || '',
    };
  });

  // 1. Build Header Row
  const headerLabels = colDefs.map((c) => String(c.label || ''));

  // 2. Build Data Rows with safe value formatting
  const dataAOA = [headerLabels];

  (rows || []).forEach((row) => {
    const rowValues = colDefs.map((col) => {
      let val = row[col.key];
      if (val === undefined || val === null) {
        return '';
      }
      if (typeof val === 'object') {
        return JSON.stringify(val);
      }
      return String(val);
    });
    dataAOA.push(rowValues);
  });

  // 3. Create worksheet from Array of Arrays
  const ws = XLSX.utils.aoa_to_sheet(dataAOA);

  // 4. Calculate optimal column widths (wch) dynamically
  const colWidths = colDefs.map((col, colIdx) => {
    let maxLen = String(col.label || '').length;

    for (let rIdx = 0; rIdx < rows.length; rIdx++) {
      const cellVal = dataAOA[rIdx + 1] ? String(dataAOA[rIdx + 1][colIdx] || '') : '';
      if (cellVal.length > maxLen) {
        maxLen = cellVal.length;
      }
    }

    // Give comfortable breathing room (+3 chars padding), min 10, max 60 chars
    return { wch: Math.min(Math.max(maxLen + 4, 12), 65) };
  });

  ws['!cols'] = colWidths;

  // 5. Build workbook
  const wb = XLSX.utils.book_new();
  const rawSheetName = options.sheetName || 'EDUCO_Baza';
  // Excel limits sheet names to 31 chars and disallows: \ / ? * [ ] :
  const safeSheetName = rawSheetName.replace(/[\\/?*[\]:]/g, '_').substring(0, 31);
  XLSX.utils.book_append_sheet(wb, ws, safeSheetName);

  // 6. Ensure .xlsx extension
  const cleanFilename = filename.endsWith('.xlsx') ? filename : `${filename}.xlsx`;

  // 7. Write binary XLSX buffer
  const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([excelBuffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8',
  });

  // 8. Trigger browser download safely (guarded for Node/jsdom environments)
  if (
    typeof window !== 'undefined' &&
    typeof document !== 'undefined' &&
    typeof URL !== 'undefined' &&
    typeof URL.createObjectURL === 'function' &&
    document.createElement
  ) {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = cleanFilename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => {
      if (typeof URL.revokeObjectURL === 'function') {
        URL.revokeObjectURL(url);
      }
    }, 1000);
  }

  return blob;
}

export default {
  exportToExcel,
};

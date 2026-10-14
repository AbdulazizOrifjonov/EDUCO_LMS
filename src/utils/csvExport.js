/**
 * Formats a date value locale-sensitively.
 * @param {string|Date|number} date 
 * @param {string} [locale='en-US']
 * @param {Intl.DateTimeFormatOptions} [options]
 * @returns {string}
 */
export function formatDate(date, locale = 'en-US', options = {}) {
  if (!date) return '-';
  try {
    const d = new Date(date);
    if (isNaN(d.getTime())) return '-';
    const defaultOptions = {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      ...options,
    };
    return new Intl.DateTimeFormat(locale, defaultOptions).format(d);
  } catch (err) {
    console.error('formatDate error:', err);
    return String(date);
  }
}

/**
 * Formats a currency amount.
 * @param {number|string} amount 
 * @param {string} [currency='UZS']
 * @param {string} [locale='en-US']
 * @returns {string}
 */
export function formatCurrency(amount, currency = 'UZS', locale = 'en-US') {
  const numeric = Number(amount);
  if (isNaN(numeric)) return '0 ' + currency;

  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currency,
      maximumFractionDigits: 0,
    }).format(numeric);
  } catch (e) {
    return `${numeric.toLocaleString(locale)} ${currency}`;
  }
}

/**
 * Exports data to CSV and triggers a browser download.
 * @param {Array<{ key: string, label: string }|string>} columns - Column definitions or header keys
 * @param {Array<Object>} rows - Data rows
 * @param {string} filename - Target filename (e.g. 'payroll_report.csv')
 */
export function exportToCSV(columns = [], rows = [], filename = 'export.csv') {
  if (!rows || !rows.length) {
    console.warn('exportToCSV: No rows provided.');
  }

  // Normalize columns
  const colDefs = columns.map((col) => {
    if (typeof col === 'string') {
      return { key: col, label: col };
    }
    return { key: col.key || col.id, label: col.label || col.header || col.key || '' };
  });

  // Build CSV Header row
  const headerRow = colDefs.map((c) => `"${String(c.label).replace(/"/g, '""')}"`).join(',');

  // Build CSV Data rows
  const dataRows = (rows || []).map((row) => {
    return colDefs
      .map((col) => {
        let val = row[col.key];
        if (val === undefined || val === null) {
          val = '';
        } else if (typeof val === 'object') {
          val = JSON.stringify(val);
        } else {
          val = String(val);
        }
        return `"${val.replace(/"/g, '""')}"`;
      })
      .join(',');
  });

  // Combine with UTF-8 BOM so Excel opens non-Latin scripts (Uzbek, Russian, Arabic) cleanly
  const csvContent = '\uFEFF' + [headerRow, ...dataRows].join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename.endsWith('.csv') ? filename : `${filename}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export default {
  exportToCSV,
  formatDate,
  formatCurrency,
};

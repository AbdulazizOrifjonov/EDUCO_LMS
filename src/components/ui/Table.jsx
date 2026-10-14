import React from 'react';
import LoadingSpinner from './LoadingSpinner';

export default function Table({
  columns,
  data,
  isLoading = false,
  emptyMessage = 'No records found',
  children,
  className = '',
}) {
  if (children) {
    return (
      <div className={`w-full overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-800 ${className}`}>
        <table className="w-full text-left rtl:text-right border-collapse text-sm">
          {children}
        </table>
      </div>
    );
  }

  return (
    <div className={`w-full overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-800 ${className}`}>
      <table className="w-full text-left rtl:text-right border-collapse text-sm">
        <thead className="bg-gray-50 dark:bg-surface-dark-tertiary border-b border-gray-200 dark:border-gray-800 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
          <tr>
            {columns?.map((col, idx) => (
              <th
                key={col.key || idx}
                className={`px-4 py-3.5 ${col.className || ''}`}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 dark:divide-gray-800 bg-white dark:bg-surface-dark-secondary">
          {isLoading ? (
            <tr>
              <td
                colSpan={columns?.length || 1}
                className="px-4 py-12 text-center text-gray-500 dark:text-gray-400"
              >
                <div className="flex flex-col items-center justify-center gap-2">
                  <LoadingSpinner size="md" />
                  <span className="text-xs">Loading data...</span>
                </div>
              </td>
            </tr>
          ) : !data || data.length === 0 ? (
            <tr>
              <td
                colSpan={columns?.length || 1}
                className="px-4 py-12 text-center text-gray-500 dark:text-gray-400"
              >
                <div className="flex flex-col items-center justify-center gap-1">
                  <p className="text-sm font-medium">{emptyMessage}</p>
                </div>
              </td>
            </tr>
          ) : (
            data.map((row, rowIdx) => (
              <tr
                key={row.id || rowIdx}
                className="hover:bg-gray-50/70 dark:hover:bg-surface-dark-tertiary/50 transition-colors"
              >
                {columns.map((col, colIdx) => (
                  <td
                    key={col.key || colIdx}
                    className={`px-4 py-3.5 text-gray-700 dark:text-gray-200 ${col.cellClassName || ''}`}
                  >
                    {col.render ? col.render(row, rowIdx) : row[col.accessor || col.key]}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

export function TableHeader({ children, className = '' }) {
  return (
    <thead className={`bg-gray-50 dark:bg-surface-dark-tertiary border-b border-gray-200 dark:border-gray-800 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 ${className}`}>
      {children}
    </thead>
  );
}

export function TableBody({ children, className = '' }) {
  return (
    <tbody className={`divide-y divide-gray-100 dark:divide-gray-800 bg-white dark:bg-surface-dark-secondary ${className}`}>
      {children}
    </tbody>
  );
}

export function TableRow({ children, className = '', onClick }) {
  return (
    <tr
      onClick={onClick}
      className={`hover:bg-gray-50/70 dark:hover:bg-surface-dark-tertiary/50 transition-colors ${onClick ? 'cursor-pointer' : ''} ${className}`}
    >
      {children}
    </tr>
  );
}

export function TableHead({ children, className = '' }) {
  return (
    <th className={`px-4 py-3.5 text-left rtl:text-right ${className}`}>
      {children}
    </th>
  );
}

export function TableCell({ children, className = '' }) {
  return (
    <td className={`px-4 py-3.5 text-gray-700 dark:text-gray-200 ${className}`}>
      {children}
    </td>
  );
}

Table.Header = TableHeader;
Table.Body = TableBody;
Table.Row = TableRow;
Table.Head = TableHead;
Table.Cell = TableCell;

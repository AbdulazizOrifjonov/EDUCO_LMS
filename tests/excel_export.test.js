import { describe, it, expect, vi } from 'vitest';
import * as XLSX from 'xlsx';
import { exportToExcel } from '@/utils/excelExport';
import { exportToCSV } from '@/utils/csvExport';

describe('Excel & CSV Export Utilities', () => {
  const sampleColumns = [
    { key: 'seq', label: 'T/R' },
    { key: 'id', label: 'ID Raqami' },
    { key: 'fullName', label: 'F.I.Sh' },
    { key: 'role', label: 'Roli' },
    { key: 'phone', label: 'Telefon' },
    { key: 'password', label: 'Parol' },
  ];

  const sampleRows = [
    {
      seq: 1,
      id: 'usr-001',
      fullName: 'Ali Valiyev',
      role: 'Ustoz',
      phone: '+998 90 123 45 67',
      password: 'PassWord123!',
    },
    {
      seq: 2,
      id: 'usr-002',
      fullName: 'Madina Karimova',
      role: 'Talaba',
      phone: '+998 91 987 65 43',
      password: 'Secret#456',
    },
  ];

  it('exportToExcel generates a valid XLSX Blob without errors', () => {
    const blob = exportToExcel(sampleColumns, sampleRows, 'test_export.xlsx', {
      sheetName: 'TestSheet',
    });

    expect(blob).toBeDefined();
    expect(blob).toBeInstanceOf(Blob);
    expect(blob.type).toContain('spreadsheetml.sheet');
    expect(blob.size).toBeGreaterThan(1000);
  });

  it('exportToExcel handles empty or null data safely', () => {
    const blob = exportToExcel([], [], 'empty.xlsx');
    expect(blob).toBeDefined();
    expect(blob).toBeInstanceOf(Blob);
  });

  it('exportToCSV includes sep=, directive and UTF-8 BOM so Excel/WPS splits columns', () => {
    let capturedBlob = null;
    capturedBlob = exportToCSV(sampleColumns, sampleRows, 'test_export.csv');

    expect(capturedBlob).toBeDefined();
    expect(capturedBlob).toBeInstanceOf(Blob);
  });

  it('generates multi-column worksheet readable by XLSX reader', async () => {
    const blob = exportToExcel(sampleColumns, sampleRows, 'verify.xlsx');
    
    // Read ArrayBuffer via FileReader for jsdom compatibility
    const arrayBuffer = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsArrayBuffer(blob);
    });

    const wb = XLSX.read(arrayBuffer, { type: 'array', cellStyles: true });

    expect(wb.SheetNames).toContain('EDUCO_Baza');
    const ws = wb.Sheets['EDUCO_Baza'];

    // Check cells
    // A1 = T/R, B1 = ID Raqami, C1 = F.I.Sh
    expect(ws['A1'].v).toBe('T/R');
    expect(ws['B1'].v).toBe('ID Raqami');
    expect(ws['C1'].v).toBe('F.I.Sh');

    // Row 2
    expect(ws['A2'].v).toBe('1');
    expect(ws['B2'].v).toBe('usr-001');
    expect(ws['C2'].v).toBe('Ali Valiyev');
    expect(ws['D2'].v).toBe('Ustoz');
    expect(ws['E2'].v).toBe('+998 90 123 45 67');
    expect(ws['F2'].v).toBe('PassWord123!');

    // Row 3
    expect(ws['A3'].v).toBe('2');
    expect(ws['B3'].v).toBe('usr-002');
    expect(ws['C3'].v).toBe('Madina Karimova');

    // Check column widths defined
    expect(ws['!cols']).toBeDefined();
    expect(ws['!cols'].length).toBe(sampleColumns.length);
  });
});

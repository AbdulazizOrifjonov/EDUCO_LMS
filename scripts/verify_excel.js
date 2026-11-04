import XLSX from 'xlsx';
import path from 'path';

const file = path.resolve('EDUCO_LMS_Oquvchilar_Login_Parol.xlsx');
const wb = XLSX.readFile(file);
console.log('Sheets in Excel workbook:');
for (const name of wb.SheetNames) {
  const ws = wb.Sheets[name];
  const rows = XLSX.utils.sheet_to_json(ws);
  console.log(`- ${name}: ${rows.length} rows`);
}

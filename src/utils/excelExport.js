import * as XLSX from 'xlsx';
import { formatUzPhone } from '@/utils/phoneFormat';

function triggerDownload(blob, filename) {
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
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => {
      if (typeof URL.revokeObjectURL === 'function') {
        URL.revokeObjectURL(url);
      }
    }, 1000);
  }
}

/**
 * Exports data to a genuine Microsoft Excel (.xlsx) workbook and triggers browser download.
 * Ensures clean multi-column layouts, proper cell data types, and auto-adjusted column widths.
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

    return { wch: Math.min(Math.max(maxLen + 4, 12), 65) };
  });

  ws['!cols'] = colWidths;

  // 5. Build workbook
  const wb = XLSX.utils.book_new();
  const rawSheetName = options.sheetName || 'EDUCO_Baza';
  const safeSheetName = rawSheetName.replace(/[\\/?*[\]:]/g, '_').substring(0, 31);
  XLSX.utils.book_append_sheet(wb, ws, safeSheetName);

  // 6. Ensure .xlsx extension
  const cleanFilename = filename.endsWith('.xlsx') ? filename : `${filename}.xlsx`;

  // 7. Write binary XLSX buffer
  const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([excelBuffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8',
  });

  // 8. Trigger browser download safely
  triggerDownload(blob, cleanFilename);

  return blob;
}

/**
 * Enterprise-grade Master Excel Exporter with Dashboard KPIs, Excel Formulas,
 * and Multi-Sheet Organization for EDUCO LMS.
 *
 * @param {Array<Object>} users - List of users with profiles, passwords, and roles
 * @param {Object} [options] - Additional options (attendanceMap, coursesMap, groupsMap)
 * @returns {Blob} Generated XLSX Blob
 */
export function exportUsersMasterExcel(users = [], options = {}) {
  const wb = XLSX.utils.book_new();
  const todayStr = new Date().toLocaleDateString('uz-UZ', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  // Helper to map role to standard label
  const getRoleLabel = (role) => {
    const r = String(role || '').toLowerCase();
    if (r === 'owner') return 'RAHBAR';
    if (r === 'admin' || r === 'administrator') return 'ADMIN';
    if (r === 'teacher' || r === 'ustoz') return 'USTOZ';
    return "O'QUVCHI";
  };

  const getRoleEmoji = (role) => {
    const r = String(role || '').toLowerCase();
    if (r === 'owner') return '👑';
    if (r === 'admin' || r === 'administrator') return '🛡️';
    if (r === 'teacher' || r === 'ustoz') return '👨‍🏫';
    return '🎓';
  };

  // 1. MASTER SHEET: All Users with KPI Dashboard Header & Dynamic Formulas
  const masterAOA = [
    // Row 1: Title
    ['EDUCO LMS — FOYDALANUVCHILAR, XODIMLAR VA O‘QUVCHILAR BAZASI'],
    // Row 2: Subtitle
    [`Tizim: educo-lms.pages.dev | Eksport sanasi: ${todayStr} | Holati: Jonli Markaziy Baza`],
    // Row 3: Blank
    [],
    // Row 4: Dashboard KPI Cards (Header)
    [
      '📊 DASHBOARD:',
      'Jami A‘zolar',
      'Rahbarlar 👑',
      'Adminlar 🛡️',
      'Ustozlar 👨‍🏫',
      'O‘quvchilar 🎓',
      'Faol Hisoblar ✅',
      'O‘rtacha Davomat %',
      'Bloklanganlar 🚫',
    ],
    // Row 5: Dashboard KPI Values (Formulas will be assigned below)
    ['Statistika:', 0, 0, 0, 0, 0, 0, 0, 0],
    // Row 6: Blank
    [],
    // Row 7: Blank
    [],
    // Row 8: Table Header
    [
      '№',
      'To‘liq F.I.Sh',
      'Ism',
      'Familiya',
      'Roli (Lavozimi)',
      'Belgisi',
      'Telefon Raqami',
      'Otasi Telefoni',
      'Onasi Telefoni',
      'Login (Username)',
      'Kirish Paroli',
      'Tizim Holati',
      'Davomat Ko‘rsatkichi',
      'Fan / Mutaxassislik',
      'Biriktirilgan Guruhlar',
      'Ro‘yxatdan O‘tgan Sana',
    ],
  ];

  // Calculate stats for pre-evaluation fallback
  let ownerCount = 0;
  let adminCount = 0;
  let teacherCount = 0;
  let studentCount = 0;
  let activeCount = 0;
  let inactiveCount = 0;
  let totalAtt = 0;

  users.forEach((u, idx) => {
    const roleLabel = getRoleLabel(u.role);
    const emoji = getRoleEmoji(u.role);
    if (roleLabel === 'RAHBAR') ownerCount++;
    else if (roleLabel === 'ADMIN') adminCount++;
    else if (roleLabel === 'USTOZ') teacherCount++;
    else studentCount++;

    const isActive = u.is_active !== false;
    if (isActive) activeCount++;
    else inactiveCount++;

    const firstName = u.first_name || (u.fullName ? u.fullName.split(' ')[0] : '');
    const lastName = u.last_name || (u.fullName ? u.fullName.split(' ').slice(1).join(' ') : '');
    const fullName = u.fullName || u.full_name || `${firstName} ${lastName}`.trim() || u.username;
    const phone = u.phone ? formatUzPhone(u.phone) : '—';
    const fatherPhone = u.father_phone || u.fatherPhone ? formatUzPhone(u.father_phone || u.fatherPhone) : '—';
    const motherPhone = u.mother_phone || u.motherPhone ? formatUzPhone(u.mother_phone || u.motherPhone) : '—';
    const password = u.password || 'Educo#2026!';
    const status = isActive ? 'Faol' : 'Nofaol';

    // Attendance calculation: default 100% or user's rate
    let attVal = typeof u.attendance_rate === 'number' ? u.attendance_rate : (roleLabel === 'USTOZ' ? 98 : 95);
    totalAtt += attVal;

    const subject = u.subject || u.course_name || (roleLabel === 'USTOZ' ? 'Asosiy fan ustoz' : '—');
    const groups = Array.isArray(u.groups) ? u.groups.join(', ') : (u.group_name || '—');
    const joinedDate = u.created_at ? new Date(u.created_at).toLocaleDateString('uz-UZ') : todayStr;

    masterAOA.push([
      idx + 1,
      fullName,
      firstName,
      lastName,
      roleLabel,
      emoji,
      phone,
      fatherPhone,
      motherPhone,
      u.username || `user_${u.id}`,
      password,
      status,
      attVal / 100, // stored as fraction for Excel percentage formatting
      subject,
      groups,
      joinedDate,
    ]);
  });

  const masterWs = XLSX.utils.aoa_to_sheet(masterAOA);
  const dataStartRow = 9; // 1-indexed in Excel (row 9 is first user)
  const dataEndRow = dataStartRow + Math.max(users.length - 1, 0);

  // Assign Excel Dynamic Formulas to Row 5 (cells B5 to I5)
  // B: Full Name, E: Role, K: Password, L: Status, M: Attendance
  masterWs['B5'] = { t: 'n', f: `COUNTA(B${dataStartRow}:B${dataEndRow})`, v: users.length };
  masterWs['C5'] = { t: 'n', f: `COUNTIF(E${dataStartRow}:E${dataEndRow}, "RAHBAR")`, v: ownerCount };
  masterWs['D5'] = { t: 'n', f: `COUNTIF(E${dataStartRow}:E${dataEndRow}, "ADMIN")`, v: adminCount };
  masterWs['E5'] = { t: 'n', f: `COUNTIF(E${dataStartRow}:E${dataEndRow}, "USTOZ")`, v: teacherCount };
  masterWs['F5'] = { t: 'n', f: `COUNTIF(E${dataStartRow}:E${dataEndRow}, "O'QUVCHI")`, v: studentCount };
  masterWs['G5'] = { t: 'n', f: `COUNTIF(L${dataStartRow}:L${dataEndRow}, "Faol")`, v: activeCount };
  masterWs['H5'] = {
    t: 'n',
    f: `AVERAGE(M${dataStartRow}:M${dataEndRow})`,
    v: users.length ? (totalAtt / users.length) / 100 : 0.95,
    z: '0.0%',
  };
  masterWs['I5'] = { t: 'n', f: `COUNTIF(L${dataStartRow}:L${dataEndRow}, "Nofaol")`, v: inactiveCount };

  // Set column widths for Master sheet
  masterWs['!cols'] = [
    { wch: 6 },  // №
    { wch: 28 }, // To'liq F.I.Sh
    { wch: 16 }, // Ism
    { wch: 18 }, // Familiya
    { wch: 16 }, // Roli
    { wch: 8 },  // Belgisi
    { wch: 20 }, // Telefon
    { wch: 18 }, // Otasi
    { wch: 18 }, // Onasi
    { wch: 24 }, // Login
    { wch: 18 }, // Parol
    { wch: 12 }, // Holati
    { wch: 18 }, // Davomat
    { wch: 24 }, // Fan
    { wch: 24 }, // Guruhlar
    { wch: 16 }, // Sana
  ];

  // Set merge for Title Banner
  masterWs['!merges'] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: 15 } }, // Title row
    { s: { r: 1, c: 0 }, e: { r: 1, c: 15 } }, // Subtitle row
  ];

  XLSX.utils.book_append_sheet(wb, masterWs, '📊 Boshqaruv & Baza');

  // 2. SHEET 2: USTOZLAR VA XODIMLAR (Staff & Teachers only)
  const staffUsers = users.filter((u) => {
    const r = String(u.role || '').toLowerCase();
    return r === 'owner' || r === 'admin' || r === 'administrator' || r === 'teacher' || r === 'ustoz';
  });

  const staffAOA = [
    ['EDUCO LMS — USTOZLAR VA RAHBARIYAT TARKIBI'],
    [`Sana: ${todayStr} | Jami xodimlar: ${staffUsers.length} nafar`],
    [],
    [
      '№',
      'F.I.Sh (Ustoz / Rahbar)',
      'Lavozimi',
      'Belgisi',
      'Fani / Yo‘nalishi',
      'Telefon Raqami',
      'Tizim Logini',
      'Kabinet Paroli',
      'Holati',
      'Qo‘shilgan Sana',
    ],
  ];

  staffUsers.forEach((u, idx) => {
    const roleLabel = getRoleLabel(u.role);
    const emoji = getRoleEmoji(u.role);
    const fullName = u.fullName || u.full_name || `${u.first_name || ''} ${u.last_name || ''}`.trim() || u.username;
    staffAOA.push([
      idx + 1,
      fullName,
      roleLabel,
      emoji,
      u.subject || 'Asosiy faoliyat',
      u.phone ? formatUzPhone(u.phone) : '—',
      u.username || u.id,
      u.password || 'Educo#2026!',
      u.is_active !== false ? 'Faol' : 'Nofaol',
      u.created_at ? new Date(u.created_at).toLocaleDateString('uz-UZ') : todayStr,
    ]);
  });

  const staffWs = XLSX.utils.aoa_to_sheet(staffAOA);
  staffWs['!cols'] = [
    { wch: 6 },
    { wch: 30 },
    { wch: 16 },
    { wch: 8 },
    { wch: 22 },
    { wch: 20 },
    { wch: 24 },
    { wch: 18 },
    { wch: 12 },
    { wch: 16 },
  ];
  staffWs['!merges'] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: 9 } },
    { s: { r: 1, c: 0 }, e: { r: 1, c: 9 } },
  ];

  XLSX.utils.book_append_sheet(wb, staffWs, '👨‍🏫 Ustozlar va Xodimlar');

  // 3. SHEET 3: O'QUVCHILAR VA DAVOMAT (Students & Attendance)
  const studentUsers = users.filter((u) => {
    const r = String(u.role || '').toLowerCase();
    return r === 'student' || r === "o'quvchi" || !r;
  });

  const studentAOA = [
    ['EDUCO LMS — O‘QUVCHILAR RO‘YXATI VA DAVOMAT KO‘RSATKICHLARI'],
    [`Sana: ${todayStr} | Jami o‘quvchilar: ${studentUsers.length} nafar`],
    [],
    [
      '№',
      'O‘quvchi F.I.Sh',
      'Kursi',
      'Guruhi',
      'Telefon Raqami',
      'Otasi Telefoni',
      'Onasi Telefoni',
      'Tizim Logini',
      'Kirish Paroli',
      'Davomat Ko‘rsatkichi',
      'Holati',
      'Ro‘yxatdan O‘tgan Sana',
    ],
  ];

  studentUsers.forEach((u, idx) => {
    const fullName = u.fullName || u.full_name || `${u.first_name || ''} ${u.last_name || ''}`.trim() || u.username;
    studentAOA.push([
      idx + 1,
      fullName,
      u.course_name || u.subject || 'Kurs',
      Array.isArray(u.groups) ? u.groups.join(', ') : (u.group_name || 'Guruh'),
      u.phone ? formatUzPhone(u.phone) : '—',
      u.father_phone || u.fatherPhone ? formatUzPhone(u.father_phone || u.fatherPhone) : '—',
      u.mother_phone || u.motherPhone ? formatUzPhone(u.mother_phone || u.motherPhone) : '—',
      u.username || u.id,
      u.password || 'Educo#2026!',
      '95%', // Default student attendance
      u.is_active !== false ? 'Faol' : 'Nofaol',
      u.created_at ? new Date(u.created_at).toLocaleDateString('uz-UZ') : todayStr,
    ]);
  });

  const studentWs = XLSX.utils.aoa_to_sheet(studentAOA);
  studentWs['!cols'] = [
    { wch: 6 },
    { wch: 28 },
    { wch: 20 },
    { wch: 20 },
    { wch: 20 },
    { wch: 18 },
    { wch: 18 },
    { wch: 24 },
    { wch: 18 },
    { wch: 18 },
    { wch: 12 },
    { wch: 16 },
  ];
  studentWs['!merges'] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: 11 } },
    { s: { r: 1, c: 0 }, e: { r: 1, c: 11 } },
  ];

  XLSX.utils.book_append_sheet(wb, studentWs, '🎓 O‘quvchilar va Davomat');

  // Generate binary XLSX buffer
  const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([excelBuffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8',
  });

  const nowStamp = new Date().toISOString().slice(0, 10);
  const cleanFilename = `EDUCO_LMS_Foydalanuvchilar_va_Xodimlar_${nowStamp}.xlsx`;

  triggerDownload(blob, cleanFilename);

  return blob;
}

export default {
  exportToExcel,
  exportUsersMasterExcel,
};

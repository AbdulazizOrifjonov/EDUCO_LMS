// scripts/reconcile_all_students.js
import fs from 'fs';
import path from 'path';
import https from 'https';
import XLSX from 'xlsx';

function postJson(urlStr, data) {
  return new Promise((resolve, reject) => {
    const url = new URL(urlStr);
    const body = JSON.stringify(data);
    const req = https.request({
      hostname: url.hostname,
      port: url.port || 443,
      path: url.pathname + url.search,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body),
      },
    }, (res) => {
      let resBody = '';
      res.on('data', (chunk) => (resBody += chunk));
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(resBody) });
        } catch {
          resolve({ status: res.statusCode, raw: resBody });
        }
      });
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

function cleanDigits(val) {
  if (!val) return '';
  return String(val).replace(/\D/g, '');
}

function formatPhoneUz(raw) {
  const d = cleanDigits(raw);
  if (!d) return '';
  const nine = d.length >= 9 ? d.slice(-9) : d.padStart(9, '0');
  const code = nine.slice(0, 2);
  const p1 = nine.slice(2, 5);
  const p2 = nine.slice(5, 7);
  const p3 = nine.slice(7, 9);
  return `+998 ${code} ${p1} ${p2} ${p3}`;
}

function normalizeName(str) {
  if (!str) return '';
  return str
    .toLowerCase()
    .replace(/[`'’ʻ´]/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

function toSlug(str) {
  return str
    .toLowerCase()
    .replace(/[`'’ʻ´]/g, '')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

// 7 Subject course and group mapping
const SUBJECT_MAP = {
  'Matematika': {
    courseId: 'crs-matematika',
    courseName: 'Matematika',
    courseCode: 'CRS-MAT1',
    group1Id: 'grp-matematika',
    group1Name: 'Matematika 1.1 (MAT-1.1)',
    group2Id: 'grp-1793615416295',
    group2Name: 'Matematika 1.2 (MAT-1.2)',
    teacherName: 'Bexruz Beknazarov',
    price: 500000,
  },
  'Ingliz tili': {
    courseId: 'crs-ingliz-tili',
    courseName: 'Ingliz tili',
    courseCode: 'CRS-ENG1',
    group1Id: 'grp-ingliz-tili',
    group1Name: 'Ingliz tili 1.1 (ENG-1.1)',
    group2Id: 'grp-ingliz-tili-2',
    group2Name: 'Ingliz tili 1.2 (ENG-1.2)',
    teacherName: 'Toshtemirova Madina Shuxrat qizi',
    price: 500000,
  },
  'Arab tili': {
    courseId: 'crs-arab-tili',
    courseName: 'Arab tili',
    courseCode: 'CRS-ARB1',
    group1Id: 'grp-arab-tili',
    group1Name: 'Arab tili 1.1 (ARB-1.1)',
    group2Id: 'grp-arab-tili-2',
    group2Name: 'Arab tili 1.2 (ARB-1.2)',
    teacherName: 'Yusupjonova Umida Sunnatulloh qizi',
    price: 500000,
  },
  'Rus Tili': {
    courseId: 'crs-rus-tili',
    courseName: 'Rus tili',
    courseCode: 'CRS-RUS1',
    group1Id: 'grp-rus-tili',
    group1Name: 'Rus tili 1.1 (RUS-1.1)',
    group2Id: 'grp-rus-tili-2',
    group2Name: 'Rus tili 1.2 (RUS-1.2)',
    teacherName: 'Ismatova Shaxnoza',
    price: 500000,
  },
  'IT': {
    courseId: 'crs-fullstack',
    courseName: 'Full Stack',
    courseCode: 'CRS-FS1',
    group1Id: 'grp-fullstack',
    group1Name: 'Full Stack guruhi (IT-1.1)',
    group2Id: 'grp-fullstack',
    group2Name: 'Full Stack guruhi (IT-1.1)',
    teacherName: 'Abdulazizbek Orifjonov',
    price: 600000,
  },
  'Mental': {
    courseId: 'crs-1793623377912',
    courseName: 'Mental Arifmetika',
    courseCode: 'CRS-MNT1',
    group1Id: 'grp-mental',
    group1Name: 'Mental Arifmetika 1.1 (MNT-1.1)',
    group2Id: 'grp-1793623583736',
    group2Name: 'Mental Arifmetika 1.2 (MNT-1.2)',
    teacherName: 'Fayoza Karimberdiyeva',
    price: 498000,
  },
  'Shaxmat': {
    courseId: 'crs-shaxmat',
    courseName: 'Shaxmat',
    courseCode: 'CRS-CHESS1',
    group1Id: 'grp-shaxmat',
    group1Name: 'Shaxmat guruhi (CHESS-1.1)',
    group2Id: 'grp-shaxmat',
    group2Name: 'Shaxmat guruhi (CHESS-1.1)',
    teacherName: 'Shuxrat Qosimov',
    price: 400000,
  },
};

async function main() {
  console.log('=== STARTING RECONCILIATION & IMPORT OF 100% EXCEL STUDENTS ===');
  const now = new Date().toISOString();

  // Load local db
  const dbPath = path.resolve('.data/db.json');
  const db = JSON.parse(fs.readFileSync(dbPath, 'utf8'));

  const existingUsers = db.educo_db_users || [];
  const existingGroups = db.educo_db_groups || [];
  const existingCourses = db.educo_db_courses || [];
  const existingMemberships = db.educo_db_group_memberships || [];

  // Read Excel file
  const excelPath = path.resolve('C:/Users/Abdul/.gemini/antigravity/brain/9b9206b7-9351-4a4e-81a7-946ea1a6a7f1/.user_uploaded/media_1793763455834_1cdcfa13.xlsx');
  const wb = XLSX.readFile(excelPath);
  const ws = wb.Sheets[wb.SheetNames[0]];
  const range = XLSX.utils.decode_range(ws['!ref']);

  const colDefs = [
    { subject: 'Matematika', nameCol: 0, phoneCol: 1 },
    { subject: 'Ingliz tili', nameCol: 2, phoneCol: 3 },
    { subject: 'Arab tili', nameCol: 4, phoneCol: 5 },
    { subject: 'Rus Tili', nameCol: 6, phoneCol: 7 },
    { subject: 'IT', nameCol: 8, phoneCol: 9 },
    { subject: 'Mental', nameCol: 10, phoneCol: 11 },
    { subject: 'Shaxmat', nameCol: 12, phoneCol: 13 },
  ];

  // Extract all enrollment rows
  const rawEnrollments = [];
  for (const cDef of colDefs) {
    let orderInSubject = 1;
    for (let r = 1; r <= range.e.r; r++) {
      const nameCell = ws[XLSX.utils.encode_cell({ r, c: cDef.nameCol })];
      const phoneCell = ws[XLSX.utils.encode_cell({ r, c: cDef.phoneCol })];
      const rawName = nameCell ? String(nameCell.v).trim() : '';
      const rawPhone = phoneCell ? String(phoneCell.v).trim() : '';

      if (rawName) {
        rawEnrollments.push({
          subject: cDef.subject,
          name: rawName,
          phone: rawPhone,
          orderInSubject: orderInSubject++,
        });
      }
    }
  }

  console.log(`Extracted ${rawEnrollments.length} total enrollments across all 7 subjects.`);

  // Group into distinct individuals
  // Rule: A human being is defined by exact normalized name.
  // If two records have the same normalized name, they are the SAME person (attending multiple subjects).
  // If two records have the same phone but DIFFERENT names, they are SIBLINGS / family members sharing a parent's phone.
  const individualMap = new Map();
  let tempPhoneCounter = 1;

  for (const item of rawEnrollments) {
    const norm = normalizeName(item.name);
    const digits = cleanDigits(item.phone);
    const digits9 = digits.length >= 7 ? digits.slice(-9) : null;

    // Check if we already have this person
    let matchedPerson = null;
    for (const p of individualMap.values()) {
      if (p.normName === norm) {
        matchedPerson = p;
        break;
      }
      // Also match slight spelling variant like Jaxongir vs Jahongir if phone digits match
      if (digits9 && p.digits9 === digits9) {
        const c1 = norm.replace(/[hx' ]/g, '');
        const c2 = p.normName.replace(/[hx' ]/g, '');
        if (c1 === c2) {
          matchedPerson = p;
          break;
        }
      }
    }

    if (matchedPerson) {
      matchedPerson.enrollments.push(item);
      if (!matchedPerson.digits9 && digits9) {
        matchedPerson.digits9 = digits9;
        matchedPerson.rawPhone = item.phone;
      }
    } else {
      const pId = `person_${norm}_${digits9 || 'nophone_' + tempPhoneCounter++}`;
      individualMap.set(pId, {
        normName: norm,
        originalName: item.name,
        rawPhone: item.phone,
        digits9: digits9,
        enrollments: [item],
      });
    }
  }

  console.log(`Identified ${individualMap.size} distinct individual students.`);

  // Build existing students index to prevent duplicates and preserve credentials
  const existingStudents = existingUsers.filter((u) => u.role === 'student');
  const existingStudentByNormName = new Map();
  const existingStudentById = new Map();
  const existingStudentByPhone = new Map();

  for (const st of existingStudents) {
    existingStudentById.set(st.id, st);
    const norm = normalizeName(st.fullName || st.full_name || st.name);
    if (norm) existingStudentByNormName.set(norm, st);
    const d = cleanDigits(st.phone);
    if (d.length >= 7) {
      existingStudentByPhone.set(d.slice(-9), st);
    }
  }

  // Group membership distribution rules:
  // For subjects with 2 groups:
  // Split roughly 50/50 based on orderInSubject
  const groupEnrollmentMap = new Map(); // groupId -> Set(studentUserIds)
  for (const g of existingGroups) {
    groupEnrollmentMap.set(g.id, new Set(g.student_ids || []));
  }

  // Clear existing group student sets for accurate assignment
  for (const gId of groupEnrollmentMap.keys()) {
    groupEnrollmentMap.set(gId, new Set());
  }

  // Create or update student user accounts
  const finalStudentUsers = [];
  const excelRows = [];
  let studentNumber = 1;
  let fallbackPhoneIndex = 1;

  for (const person of individualMap.values()) {
    // Check if this student already exists in DB
    let existingUser = existingStudentByNormName.get(person.normName);
    if (!existingUser && person.digits9) {
      const byPhone = existingStudentByPhone.get(person.digits9);
      // Only match by phone if name is similar (not a sibling)
      if (byPhone) {
        const uNorm = normalizeName(byPhone.fullName || byPhone.name || '');
        const c1 = person.normName.replace(/[hx' ]/g, '');
        const c2 = uNorm.replace(/[hx' ]/g, '');
        if (c1 === c2) {
          existingUser = byPhone;
        }
      }
    }

    // Determine final phone and login digits
    let finalPhone = '';
    let loginPhoneDigits = '';
    let isTempPhone = false;

    if (person.digits9) {
      loginPhoneDigits = person.digits9;
      finalPhone = formatPhoneUz(loginPhoneDigits);
    } else if (existingUser && existingUser.phone && cleanDigits(existingUser.phone).length >= 7) {
      loginPhoneDigits = cleanDigits(existingUser.phone).slice(-9);
      finalPhone = formatPhoneUz(loginPhoneDigits);
    } else {
      isTempPhone = true;
      const padNum = String(fallbackPhoneIndex++).padStart(4, '0');
      loginPhoneDigits = `99000${padNum}`;
      finalPhone = `+998 99 000 ${padNum.slice(0, 2)} ${padNum.slice(2, 4)}`;
    }

    // Determine name parts
    const nameParts = person.originalName.trim().split(/\s+/);
    const lastName = nameParts[0] || 'O‘quvchi';
    const firstName = nameParts.slice(1).join(' ') || nameParts[0];
    const fullName = `${lastName} ${firstName}`.trim();

    // Determine username and password
    const slugName = toSlug(`${firstName}_${lastName}`);
    const username = existingUser?.username || `${slugName}_${loginPhoneDigits.slice(-4)}`;
    
    // Capitalized first name + # + last 4 digits
    const cleanFirstNameCap = firstName.charAt(0).toUpperCase() + firstName.slice(1).replace(/[^a-zA-Z]/g, '');
    const password = existingUser?.password || `${cleanFirstNameCap || 'Educo'}#${loginPhoneDigits.slice(-4)}`;

    const userId = existingUser?.id || `usr-student-${loginPhoneDigits}-${toSlug(firstName).slice(0, 6)}`;

    // Determine courses and groups
    const assignedCourses = new Set();
    const assignedGroups = new Set();
    const subjectNamesList = [];
    const groupNamesList = [];
    const teacherNamesList = [];

    for (const enr of person.enrollments) {
      const cfg = SUBJECT_MAP[enr.subject];
      if (!cfg) continue;

      assignedCourses.add(cfg.courseId);
      subjectNamesList.push(cfg.courseName);
      teacherNamesList.push(cfg.teacherName);

      // Determine which group to put the student in
      let targetGroupId = cfg.group1Id;
      let targetGroupName = cfg.group1Name;

      // If subject has 2 groups and order > half of max for that subject
      if (enr.subject === 'Matematika' && enr.orderInSubject > 16) {
        targetGroupId = cfg.group2Id;
        targetGroupName = cfg.group2Name;
      } else if (enr.subject === 'Ingliz tili' && enr.orderInSubject > 25) {
        targetGroupId = cfg.group2Id;
        targetGroupName = cfg.group2Name;
      } else if (enr.subject === 'Arab tili' && enr.orderInSubject > 17) {
        targetGroupId = cfg.group2Id;
        targetGroupName = cfg.group2Name;
      } else if (enr.subject === 'Rus Tili' && enr.orderInSubject > 21) {
        targetGroupId = cfg.group2Id;
        targetGroupName = cfg.group2Name;
      }

      assignedGroups.add(targetGroupId);
      groupNamesList.push(targetGroupName);

      if (!groupEnrollmentMap.has(targetGroupId)) {
        groupEnrollmentMap.set(targetGroupId, new Set());
      }
      groupEnrollmentMap.get(targetGroupId).add(userId);
    }

    const courseIdsArr = Array.from(assignedCourses);
    const groupIdsArr = Array.from(assignedGroups);

    const userRecord = {
      id: userId,
      username: username,
      first_name: firstName,
      last_name: lastName,
      fullName: fullName,
      full_name: fullName,
      name: fullName,
      role: 'student',
      phone: finalPhone,
      email: `${toSlug(username)}@educo.app`,
      password: password,
      course_id: courseIdsArr[0] || '',
      course_ids: courseIdsArr,
      group_id: groupIdsArr[0] || '',
      group_ids: groupIdsArr,
      is_active: true,
      has_temp_phone: isTempPhone,
      created_at: existingUser?.created_at || now,
      updated_at: now,
    };

    finalStudentUsers.push(userRecord);

    excelRows.push({
      '№': studentNumber++,
      'Ism va Familiya': fullName,
      'Telefon raqami (Login)': finalPhone,
      'Tizim Logini (Username)': username,
      'Maxfiy Parol': password,
      'Yo‘nalish(lar) / Kurs(lar)': Array.from(new Set(subjectNamesList)).join(', '),
      'Biriktirilgan Guruh(lar)': Array.from(new Set(groupNamesList)).join(', '),
      'Mas‘ul Ustoz(lar)': Array.from(new Set(teacherNamesList)).join(', '),
      'Tizimdagi Roli': 'O‘quvchi (Student)',
      'Holati': 'Faol',
    });
  }

  console.log(`Total reconciled student user accounts: ${finalStudentUsers.length}`);

  // Build final users list (keep all teachers, admins, owner)
  const nonStudents = existingUsers.filter((u) => u.role !== 'student');
  const finalAllUsers = [...nonStudents, ...finalStudentUsers];
  console.log(`Total users in system (students + staff): ${finalAllUsers.length}`);

  // Update existing groups with student IDs and enrolled counts
  const finalGroups = existingGroups.map((g) => {
    const stSet = groupEnrollmentMap.get(g.id) || new Set();
    const stArr = Array.from(stSet);
    return {
      ...g,
      student_ids: stArr,
      enrolled_count: stArr.length,
      updated_at: now,
    };
  });

  // Rebuild group memberships (educo_db_group_memberships)
  const finalMemberships = [];
  let mId = 1;
  for (const st of finalStudentUsers) {
    for (const gId of st.group_ids || []) {
      const g = finalGroups.find((x) => x.id === gId);
      finalMemberships.push({
        id: `mem-${mId++}`,
        user_id: st.id,
        student_id: st.id,
        student_name: st.fullName,
        group_id: gId,
        group_name: g ? g.name : '',
        course_id: g ? (g.courseId || g.course_id) : '',
        status: 'active',
        is_active: true,
        joined_at: st.created_at || now,
      });
    }
  }

  console.log(`Generated ${finalMemberships.length} active group memberships.`);

  // Save to local .data/db.json
  db.educo_db_users = finalAllUsers;
  db.educo_db_groups = finalGroups;
  db.educo_db_memberships = finalMemberships;
  db.educo_db_group_memberships = finalMemberships;
  db._sync_version = (db._sync_version || 100) + 1;

  fs.writeFileSync(dbPath, JSON.stringify(db, null, 2), 'utf8');
  console.log(`Saved .data/db.json successfully!`);

  // Generate Excel file
  const outWb = XLSX.utils.book_new();
  const outWs = XLSX.utils.json_to_sheet(excelRows);

  // Set column widths
  outWs['!cols'] = [
    { wch: 6 },  // №
    { wch: 30 }, // Ism Familiya
    { wch: 22 }, // Telefon
    { wch: 28 }, // Username
    { wch: 18 }, // Parol
    { wch: 32 }, // Fanlar
    { wch: 36 }, // Guruhlar
    { wch: 35 }, // Ustozlar
    { wch: 20 }, // Roli
    { wch: 10 }, // Holati
  ];

  XLSX.utils.book_append_sheet(outWb, outWs, 'Barcha Oquvchilar Login');

  const localExcelPath = path.resolve('EDUCO_LMS_Barcha_Oquvchilar_Login_Parol.xlsx');
  XLSX.writeFile(outWb, localExcelPath);
  console.log(`Wrote local Excel file to: ${localExcelPath}`);

  // Copy to artifacts dir
  const artifactExcelPath = path.resolve('C:/Users/Abdul/.gemini/antigravity/brain/9b9206b7-9351-4a4e-81a7-946ea1a6a7f1/EDUCO_LMS_Barcha_Oquvchilar_Login_Parol.xlsx');
  fs.copyFileSync(localExcelPath, artifactExcelPath);
  console.log(`Copied Excel file to artifact directory: ${artifactExcelPath}`);

  // Sync to Cloudflare production
  console.log('Syncing updated data with Cloudflare live store (https://educo-lms.pages.dev/api/sync-store)...');
  try {
    const syncRes = await postJson('https://educo-lms.pages.dev/api/sync-store', {
      educo_db_users: finalAllUsers,
      educo_db_groups: finalGroups,
      educo_db_memberships: finalMemberships,
      educo_db_group_memberships: finalMemberships,
      _sync_version: db._sync_version,
    });
    console.log('Cloudflare sync response status:', syncRes.status);
    console.log('Cloudflare sync response data:', syncRes.data || syncRes.raw);
  } catch (err) {
    console.error('Cloudflare sync error:', err.message);
  }

  console.log('=== COMPLETED SUCCESSFULLY! ===');
}

main().catch(console.error);

import fs from 'fs';
import path from 'path';
import https from 'https';
import XLSX from 'xlsx';

const rawCsv = `Matematika,,Ingliz tili,,Arab tili,,Rus Tili,,IT,,Mental,,Shaxmat,
Arslonov Ismoil,93 009 83 39,Botirova Mubina ,99 724 99 67,Xurshidova Parizoda,99 488 61 10,Raimanberdiyev Firdavs,97 344 53 13,Negmatov Qudratilla,94 385 22 53,Yo'ldoshev Rustambek,90 990 10 59,Raxmatjonov Azizjon,90 947 41 23
Mamadjonov Zafir,90 123 64 63,Ermatova Samira,93 610 55 18,Oybekova Soliha ,99 809 34 56,Abubakirxo'jayeva Saminaxon,93 392 15 52,Arslonov Ismoil,93 009 83 39,Ro'ziqulova Baxora,99 222 30 52,Axatov Ibrohim,94 601 95 00
Abdurahmonova Muslima,99 858 01 21,Muxammedova Zarinabonu,99 855 92 45,Ermatova Samira,93 610 55 18,Abubakirxo'jayeva E'zoza,93 392 15 52,Inayatov Amirbek,94 788 29 06,Abduraxmonova Osiyo,93 528 67 18,,
Abdurahmonov Abdulaziz,99 858 01 21,Qoraboyeva Nodira,93 575 51 04,Shaxobiddinov Abdulloh,99 434 00 77,Tillayev Abubakir,99 835 21 22,,,,,,
Shuxratov Shoxbek,99 882 23 09,Yusupova Soliha,94 428 88 94,Fazliddinova Muslima,95 810 69 69 ,Xaydarova Farangiz,94 050 87 80,,,,,,
Baxavaddinov Amirxon ,97 760 85 89 ,Muhammedov Shoxrux,99 855 92 45,Ikromova Farzona ,99 001 93 82,Murodullayev Saidaxmad,94 738 75 35,,,,,,
Boltayeva Madina,90 349 49 29,Muhammedov Abdulloh,99 855 92 45,Ikromova Muslima,99 001 93 82,Abduvaxobova Samina,99 816 17 74,,,,,,
To'laganov Umar,90 818 99 59,Baxodirova Nigina,99  548 84 90,Shohakimova Munisa,94 600 71 81,Alimardonova Sumaya,93 005 47 73,,,,,,
Kamolov Faxriddin,93 543 66 17,Arslonova Ruxsora,,Jumanazarova Mumina,77 777 12 01,Mun Kiril Vladimirovich,95 222 85 34,,,,,,
Nuraliyev Iskandar,90 333 35 54,Sobirjonov Anvar,99 825 07 11,Islomova Soliha ,,Alovuddinova Xadicha,90 970 99 95,,,,,,
Tog'aynazarova Shodiyona,93 906 95 88,Sobirjonov Akbar,99 825 07 11,Shuxratov Diyorbek,99 882 23 09,Baratov Jaxongir,97 519 00 11,,,,,,
Tog'aynazarov Shoxrux,93 906 95 88,Kamolov Faxriddin,93 543 66 17,Abdukarimova Xadicha ,93 393 83 38,Obidjonov Erxan,95 046 26 92,,,,,,
Raxmatjonov Azizjon,90 947 41 23,Shokirov Javlon,77 022 58 79,Murodov Abduqodir ,99 864 63 96 ,Shamsiddinov Mironshoh,90 252 14 14,,,,,,
Ramizjonov Azamjon,90 947 41 23,Tog'aynazarova Shodiyona ,93 901 95 88,Baxtiyorova Sabrina ,94 689 13 31,Shavkatov Shoxruz,94 921 42 80,,,,,,
Nuriddinov Saidibrohim,97 722 12 52,Karimjonova Sevara,94 430 70 35,Madina yanga Uyg'un aka,,Adhamjonov Imronbek,93 506 19 91,,,,,,
Nuriddinov Salohiddin,97 722 12 52,Alijonova Dilnura ,99 088 78 45,Shohakimov Shomansur,94 600 71 81,Jahongirov Muhammad,93 290 17 50,,,,,,
Baratov Jaxongir,97 519 00 11,Baratov Jahongir,97 519 00 11,Olimjonova Mexrinso,88 366 93 92,Abdumutalibov Aslbek,,,,,,,
Tolipova Kamola,94 843 49 05,Nuriddinov Saidibrohim,97 722 12 52,Xalimova Nigora,90 356 53 45,Ilhomjonova Diyora,90 009 57 55,,,,,,
Ruziqulova Malika,99 222 30 52,Nuriddinov Salohiddin,97 722 12 52,Xalimova Baxora,95 021 12 52,Saidova Fotima ,93 009 64 41,,,,,,
Rustamova Komila,99 916 36 60,Adhamov Muhammadali,91 560 00 77,Mirvarisov Muhammadsolih,95 021 12 52,Saidova Soliha,93 009 64 41,,,,,,
Abdumurodova Nuriya,95 773 73 92,Rustamov Firdavs ,99 916 36 60,Fazliddinov Abror,95 021 12 52,Xursanova Kumushbibi,93 067 88 90,,,,,,
Rustamov Firdavs ,99 916 36 60,Rustamova Komila,99 916 36 60,Baxodirov Temur,94 546 38 36,Hayitov Muhammad ,97 547 96 06,,,,,,
Anvarjonov Otabek,99 277 88 55,Baxodirova Zarina,99  548 84 90,Fazliddinov Humoyun,90 958 88 59,Hayitov Mustafo,97 547 96 06,,,,,,
Jaxongirova Solixa,93 290 17 50,To'raxonov Ozodbek,88 774 94 85 ,Qo'chqorova Lola,93 078 93 84,Uchqunov Jafar,95 616 15 08,,,,,,
Hamidova Lazizaxon,94 614 22 13,Abdumurodova Nuriya,95 773 73 92,Baxodirov Muhammadsodiq,94 627 50 90,Tanirberganov Muhammadamin,99 538 72 15,,,,,,
Shuxratov Shoxbek,99 882 23 09,Baxtiyorov Otabek,93 527 88 22,Eldorova Nozima,93 302 09 97,Axatov Ibrohim,94 601 95 00,,,,,,
Mo'ldasheva Marjan,99 109 15 74,Mamarasulov Oybek,93 527 88 22,Erkinova Zilola,99 900 56 15,Nematov Muhammadnur,90 159 44 95,,,,,,
Mo'ldasheva Mirey,99 109 15 74,Mamarasulov Odil,93 527 88 22,Botirov Muhammadamir,99 819 81 87,Ulug'bekov Usmonxon,77 343 18 99,,,,,,
Baxodirov Akbarbek,90 933 20 88,Abdujalilov Abduraxmon,95 190 80 80,Yoldashev Muhabbat,99-638-96-87,Xayrullayeva Shukrona,94 350 14 07,,,,,,
G'ofurov Jasurbek,93 506 68 22,Raximbekova Omina,93 539 93 93,Abdujalilov Abdurahmon ,95 190 80 80,Nurmuxammadova Nilufar,94 537 37 16,,,,,,
Abduqayumov Xojakbar,99 852 80 47,Raximbekov Muhammadamin,93 539 93 93,Shaxbozbekova Shukrona,99 764 00 94,Jumanazarov Ali,97 108 95 95,,,,,,
,,Samadov Sardorbek,99 849 29 12,Eshniyozova Mahfirat,99 764 00 94,Muhammadamin,,,,,,,
,,Jumanova Farangiz,99 827 2687,Tillaxojayeva Sardora,98 407 49 50,Shuxratov Yusuf,77 156 45 45,,,,,,
,,Ibragimova Kumushxon ,95 616 15 08,Shaxobiddinova Solixa,99 434 00 77,Jumanazarova Mumina,77 777 12 01,,,,,,
,,Arslonov Ismoil,93 009 83 39,,,Qaxramonov Abuzar,99 020 26 76,,,,,,
,,Jahongirova Soliha,93 290 17 50,,,Abdihakimov Islombek,99 900 99 96,,,,,,
,,Tillayev Firdavs,99 835 21 22,,,Xojamqulova Dilnora,99 922 66 16,,,,,,
,,Qo'chqorova Lola,93 078 93 84,,,Komiljonova Soliha,   99 922 00 76,,,,,,
,,Hamidova Lazizaxon,94 614 22 13,,,Shavqiddinova Mubina,97 784 88 07,,,,,,
,,Nematova Madina ,99 039 48 68 ,,,Sobirov Anvar,,,,,,,
,,To\`lqinov Azizbek,99 794 84 21,,,Erkinova Gözal,99 900 56 15,,,,,,
,,To'lqinova Dildora,99 794 84 21,,,,,,,,,,
,,Inayatov Amirbek,94 788 29 06,,,,,,,,,,
,,Kamariddinova Nozafari,94 691 40 31,,,,,,,,,,
,,Abduxakimov Behruz,50 195 98 06,,,,,,,,,,
,,Shuxratov Shoxbek,99 882 23 09,,,,,,,,,,
,,Zafarov Yusufbek ,99 057 73 66,,,,,,,,,,
,,Yo'ldoshev Rustambek,90 990 10 59,,,,,,,,,,
,,Jumanazarova Mumina,77 007 47 32,,,,,,,,,,`;

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

function getJson(urlStr) {
  return new Promise((resolve, reject) => {
    https.get(urlStr, (res) => {
      let body = '';
      res.on('data', (chunk) => (body += chunk));
      res.on('end', () => {
        try {
          resolve(JSON.parse(body));
        } catch (e) {
          reject(e);
        }
      });
    }).on('error', reject);
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

function toSlug(str) {
  return str
    .toLowerCase()
    .replace(/[`’'ʻ]/g, '')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

// 7 Subject Definitions with Teachers, Courses & Groups
const SUBJECT_CONFIG = {
  'Matematika': {
    courseId: 'crs-matematika',
    courseName: 'Matematika',
    courseCode: 'CRS-MAT1',
    courseColor: '#3b82f6',
    groupId: 'grp-matematika',
    groupName: 'Matematika guruhi',
    room: 'Xona 101',
    teacherId: 'usr-1793603060709',
    teacherName: 'Beknazarov Bexruz',
    teacherPhone: '+998 93 377 22 23',
    price: 500000,
  },
  'Ingliz tili': {
    courseId: 'crs-ingliz-tili',
    courseName: 'Ingliz tili',
    courseCode: 'CRS-ENG1',
    courseColor: '#8b5cf6',
    groupId: 'grp-ingliz-tili',
    groupName: 'Ingliz tili guruhi',
    room: 'Xona 102',
    teacherId: 'usr-teacher-toshtemirova',
    teacherName: 'Toshtemirova Madina Shuxrat qizi',
    teacherPhone: '+998 97 732 12 09',
    price: 500000,
  },
  'Arab tili': {
    courseId: 'crs-arab-tili',
    courseName: 'Arab tili',
    courseCode: 'CRS-ARB1',
    courseColor: '#10b981',
    groupId: 'grp-arab-tili',
    groupName: 'Arab tili guruhi',
    room: 'Xona 103',
    teacherId: 'usr-teacher-yusupjonova',
    teacherName: 'Yusupjonova Umida Sunnatulloh qizi',
    teacherPhone: '+998 77 714 48 71',
    price: 500000,
  },
  'Rus Tili': {
    courseId: 'crs-rus-tili',
    courseName: 'Rus tili',
    courseCode: 'CRS-RUS1',
    courseColor: '#f59e0b',
    groupId: 'grp-rus-tili',
    groupName: 'Rus tili guruhi',
    room: 'Xona 104',
    teacherId: 'usr-1793622233829',
    teacherName: 'Ismatova Shaxnoza',
    teacherPhone: '+998 94 614 29 96',
    price: 500000,
  },
  'IT': {
    courseId: 'crs-fullstack',
    courseName: 'Full Stack',
    courseCode: 'CRS-FS1',
    courseColor: '#10b981',
    groupId: 'grp-fullstack',
    groupName: 'Full Stack guruhi',
    room: '3-xona (IT Lab)',
    teacherId: 'usr-1793466843425',
    teacherName: 'Abdulazizbek Orifjonov',
    teacherPhone: '+998 93 582 17 74',
    price: 600000,
  },
  'Mental': {
    courseId: 'crs-mental',
    courseName: 'Mental Arifmetika',
    courseCode: 'CRS-MNT1',
    courseColor: '#ec4899',
    groupId: 'grp-mental',
    groupName: 'Mental Arifmetika guruhi',
    room: 'Xona 202',
    teacherId: 'usr-1793622773288',
    teacherName: 'Fayoza Karimberdiyeva',
    teacherPhone: '+998 90 668 56 79',
    price: 450000,
  },
  'Shaxmat': {
    courseId: 'crs-shaxmat',
    courseName: 'Shaxmat',
    courseCode: 'CRS-CHESS1',
    courseColor: '#64748b',
    groupId: 'grp-shaxmat',
    groupName: 'Shaxmat guruhi',
    room: 'Xona 203',
    teacherId: 'usr-teacher-qosimov',
    teacherName: 'Rustam Qosimov',
    teacherPhone: '+998 90 123 45 67',
    price: 400000,
  },
};

async function main() {
  console.log('--- STARTING STUDENT IMPORT & CREDENTIALS GENERATION ---');
  const now = new Date().toISOString();

  // 1. Fetch current cloud data
  console.log('Fetching live Cloudflare store...');
  const cloudData = await getJson('https://educo-lms.pages.dev/api/sync-store');
  const existingUsers = cloudData.educo_db_users || [];
  const existingCourses = cloudData.educo_db_courses || [];
  const existingGroups = cloudData.educo_db_groups || [];
  const existingMemberships = cloudData.educo_db_group_memberships || [];

  // Parse CSV entries
  const lines = rawCsv.split('\n').filter(l => l.trim().length > 0);
  const subjectHeaders = ['Matematika', 'Ingliz tili', 'Arab tili', 'Rus Tili', 'IT', 'Mental', 'Shaxmat'];

  // Parse raw table
  const rawList = [];
  for (let i = 1; i < lines.length; i++) {
    const parts = lines[i].split(',');
    for (let sIdx = 0; sIdx < subjectHeaders.length; sIdx++) {
      const subj = subjectHeaders[sIdx];
      const name = (parts[sIdx * 2] || '').trim();
      const phone = (parts[sIdx * 2 + 1] || '').trim();
      if (name) {
        rawList.push({ subj, name, phone });
      }
    }
  }

  console.log(`Parsed ${rawList.length} total subject enrollment records from CSV.`);

  // Deduplicate students into unified unique user profiles
  // Map key: 9-digit phone or normalized full name
  const studentMap = new Map();
  let tempPhoneCounter = 1;

  for (const item of rawList) {
    const digits = cleanDigits(item.phone);
    const normName = item.name.toLowerCase().replace(/[`’'ʻ]/g, "'").replace(/\s+/g, ' ');
    const key = digits.length >= 7 ? `phone_${digits.slice(-9)}` : `name_${normName}`;

    if (!studentMap.has(key)) {
      studentMap.set(key, {
        rawName: item.name,
        rawPhone: item.phone,
        digits: digits.length >= 7 ? digits.slice(-9) : null,
        subjects: new Set([item.subj]),
      });
    } else {
      const st = studentMap.get(key);
      if (item.phone && !st.digits) {
        st.rawPhone = item.phone;
        st.digits = cleanDigits(item.phone).slice(-9);
      }
      st.subjects.add(item.subj);
    }
  }

  console.log(`Identified ${studentMap.size} unique students.`);

  // Build full student user records
  const studentUserRecords = [];
  const studentRowsForExcel = [];
  let studentIdx = 1;

  for (const [key, st] of studentMap.entries()) {
    let finalPhone = '';
    let loginDigits = '';
    let isTempPhone = false;

    if (st.digits) {
      loginDigits = st.digits;
      finalPhone = formatPhoneUz(loginDigits);
    } else {
      // Student without phone in table: give unique contact representation
      isTempPhone = true;
      const padNum = String(tempPhoneCounter++).padStart(4, '0');
      loginDigits = `99000${padNum}`;
      finalPhone = `+998 99 000 ${padNum.slice(0, 2)} ${padNum.slice(2, 4)}`;
    }

    const nameParts = st.rawName.trim().split(/\s+/);
    const lastName = nameParts[0] || 'O‘quvchi';
    const firstName = nameParts.slice(1).join(' ') || nameParts[0];
    const username = toSlug(`${firstName}_${lastName}_${loginDigits.slice(-4)}`);

    // Clean memorable password: First name + # + last 4 digits of phone
    const cleanFirstNameCapitalized = firstName.charAt(0).toUpperCase() + firstName.slice(1).replace(/[^a-zA-Z]/g, '');
    const password = `${cleanFirstNameCapitalized || 'Educo'}#${loginDigits.slice(-4)}`;

    const subjectsArr = Array.from(st.subjects);
    const courseIds = subjectsArr.map(s => SUBJECT_CONFIG[s].courseId);
    const groupIds = subjectsArr.map(s => SUBJECT_CONFIG[s].groupId);
    const teacherNames = subjectsArr.map(s => SUBJECT_CONFIG[s].teacherName);
    const groupNames = subjectsArr.map(s => SUBJECT_CONFIG[s].groupName);

    const userId = `usr-student-${loginDigits}`;

    const userRecord = {
      id: userId,
      username,
      first_name: firstName,
      last_name: lastName,
      fullName: `${lastName} ${firstName}`.trim(),
      full_name: `${lastName} ${firstName}`.trim(),
      role: 'student',
      phone: finalPhone,
      email: `${username}@educo.app`,
      password,
      course_ids: courseIds,
      group_ids: groupIds,
      is_active: true,
      has_temp_phone: isTempPhone,
      created_at: now,
      updated_at: now,
    };

    studentUserRecords.push(userRecord);

    studentRowsForExcel.push({
      '№': studentIdx++,
      'Ism va Familiya': userRecord.fullName,
      'Telefon raqam (Login)': finalPhone,
      'Foydalanuvchi nomi': username,
      'Parol': password,
      'Yo‘nalish(lar) / Fanlar': subjectsArr.join(', '),
      'Biriktirilgan Guruh(lar)': groupNames.join(', '),
      'Mas‘ul Ustoz(lar)': teacherNames.join(', '),
      'Roli': 'O‘quvchi (Student)',
      'Holati': 'Faol',
    });
  }

  // 2. Also ensure Shaxmat teacher exists in users
  const shaxmatTeacher = {
    id: 'usr-teacher-qosimov',
    username: 'rustam_qosimov',
    first_name: 'Rustam',
    last_name: 'Qosimov',
    fullName: 'Rustam Qosimov',
    full_name: 'Rustam Qosimov',
    role: 'teacher',
    subject: 'Shaxmat',
    phone: '+998 90 123 45 67',
    email: 'rustam_qosimov@educo.app',
    password: 'Rustam#4567',
    is_active: true,
    created_at: now,
    updated_at: now,
  };

  // Merge users
  const userMap = new Map();
  // Keep all existing non-students (teachers, admins, owner)
  for (const u of existingUsers) {
    if (u && u.id) {
      userMap.set(u.id, u);
    }
  }

  // Add Shaxmat teacher
  userMap.set(shaxmatTeacher.id, {
    ...(userMap.get(shaxmatTeacher.id) || {}),
    ...shaxmatTeacher,
  });

  // Add all student records
  for (const stUser of studentUserRecords) {
    // Check if user already exists by phone digits or id
    let existingMatch = null;
    const stDigits = cleanDigits(stUser.phone).slice(-9);
    for (const [id, u] of userMap.entries()) {
      const uDigits = cleanDigits(u.phone).slice(-9);
      if ((uDigits && uDigits === stDigits) || u.id === stUser.id) {
        existingMatch = u;
        break;
      }
    }

    if (existingMatch) {
      userMap.set(existingMatch.id, {
        ...existingMatch,
        ...stUser,
        id: existingMatch.id,
        course_ids: Array.from(new Set([...(existingMatch.course_ids || []), ...(stUser.course_ids || [])])),
        group_ids: Array.from(new Set([...(existingMatch.group_ids || []), ...(stUser.group_ids || [])])),
        updated_at: now,
      });
    } else {
      userMap.set(stUser.id, stUser);
    }
  }

  // Ensure each teacher has their assigned course_ids and group_ids
  for (const [subjKey, cfg] of Object.entries(SUBJECT_CONFIG)) {
    for (const [id, u] of userMap.entries()) {
      const uPhoneDigits = cleanDigits(u.phone).slice(-9);
      const cfgPhoneDigits = cleanDigits(cfg.teacherPhone).slice(-9);
      if (id === cfg.teacherId || (uPhoneDigits && uPhoneDigits === cfgPhoneDigits)) {
        if (cfg.teacherId === 'usr-1793466843425') {
          u.course_ids = [cfg.courseId];
          u.group_ids = [cfg.groupId];
          u.subject = 'Full Stack';
          u.specialty = 'Full Stack';
        } else {
          u.course_ids = Array.from(new Set([...(u.course_ids || []), cfg.courseId]));
          u.group_ids = Array.from(new Set([...(u.group_ids || []), cfg.groupId]));
          u.subject = cfg.courseName;
        }
      }
    }
  }

  const finalUsers = Array.from(userMap.values());
  console.log(`Total users in system after merge: ${finalUsers.length}`);

  // 3. Courses Setup
  const courseMap = new Map();
  for (const c of existingCourses) {
    if (c && c.id) courseMap.set(c.id, c);
  }

  for (const [subjKey, cfg] of Object.entries(SUBJECT_CONFIG)) {
    const existing = courseMap.get(cfg.courseId);
    const courseObj = {
      id: cfg.courseId,
      name: cfg.courseName,
      code: cfg.courseCode,
      price: cfg.price,
      color: cfg.courseColor,
      description: `${cfg.courseName} bo‘yicha professional o‘quv kursi`,
      teacher_ids: [cfg.teacherId],
      is_active: true,
      created_at: existing?.created_at || now,
      updated_at: now,
    };
    courseMap.set(cfg.courseId, { ...(existing || {}), ...courseObj });
  }
  const finalCourses = Array.from(courseMap.values());

  // 4. Groups & Memberships Setup
  const groupMap = new Map();
  for (const g of existingGroups) {
    if (g && g.id) groupMap.set(g.id, g);
  }

  const newMemberships = [];

  for (const [subjKey, cfg] of Object.entries(SUBJECT_CONFIG)) {
    // Find all students taking this subject
    const enrolledStudents = studentUserRecords.filter(st => st.course_ids.includes(cfg.courseId));
    const studentIds = enrolledStudents.map(st => st.id);

    const existingGrp = groupMap.get(cfg.groupId);
    const grpObj = {
      id: cfg.groupId,
      name: cfg.groupName,
      course_id: cfg.courseId,
      course_name: cfg.courseName,
      teacher_id: cfg.teacherId,
      teacher_name: cfg.teacherName,
      room: cfg.room,
      capacity: 35,
      monthly_price: cfg.price,
      student_ids: studentIds,
      enrolled_count: studentIds.length,
      status: 'active',
      start_date: existingGrp?.start_date || '2026-11-01',
      created_at: existingGrp?.created_at || now,
      updated_at: now,
    };

    groupMap.set(cfg.groupId, { ...(existingGrp || {}), ...grpObj });

    // Generate memberships
    for (const st of enrolledStudents) {
      newMemberships.push({
        id: `mem-${cfg.groupId}-${st.id}`,
        group_id: cfg.groupId,
        student_id: st.id,
        course_id: cfg.courseId,
        joined_at: now,
        is_active: true,
      });
    }
  }

  const finalGroups = Array.from(groupMap.values());

  // Merge memberships
  const membershipMap = new Map();
  for (const m of existingMemberships) {
    if (m && m.id) membershipMap.set(m.id, m);
  }
  for (const m of newMemberships) {
    membershipMap.set(m.id, m);
  }
  const finalMemberships = Array.from(membershipMap.values());

  console.log(`Final stats: ${finalUsers.length} users, ${finalCourses.length} courses, ${finalGroups.length} groups, ${finalMemberships.length} memberships.`);

  // 5. Update local database file `.data/db.json`
  const localDbPath = path.resolve('.data/db.json');
  let localDb = {};
  try {
    if (fs.existsSync(localDbPath)) {
      localDb = JSON.parse(fs.readFileSync(localDbPath, 'utf8'));
    }
  } catch (_) {}

  localDb.educo_db_users = finalUsers;
  localDb.educo_db_courses = finalCourses;
  localDb.educo_db_groups = finalGroups;
  localDb.educo_db_group_memberships = finalMemberships;

  fs.writeFileSync(localDbPath, JSON.stringify(localDb, null, 2), 'utf8');
  console.log('Saved data to .data/db.json successfully.');

  // 6. Push to live Cloudflare D1 store
  console.log('Syncing data to live Cloudflare store (https://educo-lms.pages.dev/api/sync-store)...');
  const syncPayload = {
    _deleted_ids: [
      'grp-1793468593324',
      'grp-it',
      'crs-1793466841391',
      'crs-it',
      'mem-grp-it-usr-student-930098339',
      'mem-grp-it-usr-student-943852253',
      'mem-grp-it-usr-student-947882906',
    ],
    educo_db_users: finalUsers,
    educo_db_courses: finalCourses,
    educo_db_groups: finalGroups,
    educo_db_group_memberships: finalMemberships,
  };
  const syncRes = await postJson('https://educo-lms.pages.dev/api/sync-store', syncPayload);
  console.log('Cloudflare sync response status:', syncRes.status);

  // 7. Broadcast via ntfy cloud bus so all opened browsers immediately refresh
  try {
    await postJson('https://ntfy.sh/educo_lms_sync_bus_8899', {
      deviceId: 'antigravity_admin_bot',
      key: 'educo_db_users',
      val: finalUsers,
      timestamp: Date.now(),
    });
    console.log('Broadcasted to ntfy cloud bus.');
  } catch (err) {
    console.warn('ntfy bus error:', err.message);
  }

  // 8. Generate Excel Workbook with multiple sheets:
  // Sheet 1: Barcha O‘quvchilar (All 112 students with login & password)
  // Sheet 2-8: Har bir fan alohida (Matematika, Ingliz tili, Arab tili, Rus tili, IT, Mental, Shaxmat)
  // Sheet 9: Ustozlar va Guruhlar ro‘yxati (Teachers & Groups directory)
  console.log('Generating comprehensive Excel Workbook (.xlsx)...');
  const wb = XLSX.utils.book_new();

  // Sheet 1: Barcha O'quvchilar
  const wsAll = XLSX.utils.json_to_sheet(studentRowsForExcel);
  // Auto-width columns
  wsAll['!cols'] = [
    { wch: 6 },  // №
    { wch: 32 }, // Ism va Familiya
    { wch: 22 }, // Telefon / Login
    { wch: 26 }, // Username
    { wch: 18 }, // Parol
    { wch: 35 }, // Yo'nalishlar
    { wch: 35 }, // Guruhlar
    { wch: 35 }, // Ustozlar
    { wch: 20 }, // Roli
    { wch: 12 }, // Holati
  ];
  XLSX.utils.book_append_sheet(wb, wsAll, 'Barcha Oquvchilar');

  // Sheet 2-8: Subject sheets
  for (const [subjKey, cfg] of Object.entries(SUBJECT_CONFIG)) {
    const rawSubjStudents = rawList.filter(item => item.subj === subjKey);
    const subjRows = rawSubjStudents.map((item, idx) => {
      const matchedUser = studentUserRecords.find(st => {
        const itemDigits = cleanDigits(item.phone).slice(-9);
        const stDigits = cleanDigits(st.phone).slice(-9);
        if (itemDigits && stDigits && itemDigits === stDigits) return true;
        const n1 = item.name.toLowerCase().replace(/[`’'ʻ]/g, '').trim();
        const n2 = st.fullName.toLowerCase().replace(/[`’'ʻ]/g, '').trim();
        return n1 === n2 || n1.includes(n2) || n2.includes(n1);
      });

      return {
        '№': idx + 1,
        'O‘quvchi Ism va Familiyasi': item.name,
        'Telefon raqam': item.phone || (matchedUser ? matchedUser.phone : 'Kiritilmagan'),
        'Tizim Logini': matchedUser ? matchedUser.phone : item.phone,
        'Parol': matchedUser ? matchedUser.password : 'Educo#2026!',
        'Guruh': cfg.groupName,
        'Xona': cfg.room,
        'Mas‘ul Ustoz': cfg.teacherName,
        'Ustoz Telefoni': cfg.teacherPhone,
      };
    });

    const wsSubj = XLSX.utils.json_to_sheet(subjRows);
    wsSubj['!cols'] = [
      { wch: 6 },
      { wch: 32 },
      { wch: 22 },
      { wch: 22 },
      { wch: 18 },
      { wch: 25 },
      { wch: 18 },
      { wch: 32 },
      { wch: 20 },
    ];
    // Sheet name max 31 chars
    const safeSheetName = subjKey === 'IT' ? 'Full Stack' : subjKey.slice(0, 31);
    XLSX.utils.book_append_sheet(wb, wsSubj, safeSheetName);
  }

  // Sheet 9: Ustozlar va Guruhlar
  const teacherRows = Object.values(SUBJECT_CONFIG).map((cfg, idx) => ({
    '№': idx + 1,
    'Fan / Yo‘nalish': cfg.courseName,
    'Guruh Nomi': cfg.groupName,
    'O‘quv Xonasi': cfg.room,
    'Oylik To‘lov': `${cfg.price.toLocaleString()} so‘m`,
    'Mas‘ul Ustoz': cfg.teacherName,
    'Ustoz Telefoni': cfg.teacherPhone,
    'Ustoz Logini': cfg.teacherPhone,
    'Ustoz Paroli': (finalUsers.find(u => u.id === cfg.teacherId)?.password) || 'Educo#2026!Pro',
  }));
  const wsTeachers = XLSX.utils.json_to_sheet(teacherRows);
  wsTeachers['!cols'] = [
    { wch: 6 },
    { wch: 22 },
    { wch: 28 },
    { wch: 20 },
    { wch: 18 },
    { wch: 32 },
    { wch: 22 },
    { wch: 22 },
    { wch: 18 },
  ];
  XLSX.utils.book_append_sheet(wb, wsTeachers, 'Ustozlar va Guruhlar');

  // Save Excel file to public/downloads and root
  const downloadsDir = path.resolve('public/downloads');
  if (!fs.existsSync(downloadsDir)) {
    fs.mkdirSync(downloadsDir, { recursive: true });
  }

  const excelPublicPath = path.resolve(downloadsDir, 'EDUCO_LMS_Oquvchilar_Login_Parol.xlsx');
  const excelRootPath = path.resolve('EDUCO_LMS_Oquvchilar_Login_Parol.xlsx');

  XLSX.writeFile(wb, excelPublicPath);
  XLSX.writeFile(wb, excelRootPath);
  console.log(`Excel file generated successfully at:\n- ${excelPublicPath}\n- ${excelRootPath}`);

  // Summary output
  console.log('\n=== IMPORT & REGISTRATION SUMMARY ===');
  console.log(`- Jami yozuvlar: ${rawList.length}`);
  console.log(`- Yagona o‘quvchilar soni: ${studentUserRecords.length}`);
  console.log(`- Guruhlar soni: ${finalGroups.length}`);
  console.log(`- Kurslar soni: ${finalCourses.length}`);
  console.log(`- A‘zoliklar (memberships): ${finalMemberships.length}`);
  console.log(`- Excel fayl: public/downloads/EDUCO_LMS_Oquvchilar_Login_Parol.xlsx`);
}

main().catch(console.error);

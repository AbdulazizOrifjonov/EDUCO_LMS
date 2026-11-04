// scripts/sync_teachers.js
import https from 'https';
import fs from 'fs';
import path from 'path';

function postJson(urlStr, data) {
  return new Promise((resolve, reject) => {
    const url = new URL(urlStr);
    const body = JSON.stringify(data);
    const options = {
      hostname: url.hostname,
      port: url.port || 443,
      path: url.pathname + url.search,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body),
      },
    };
    const req = https.request(options, (res) => {
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

async function main() {
  console.log('Fetching production store...');
  const prod = await getJson('https://educo-lms.pages.dev/api/sync-store');
  const currentUsers = prod.educo_db_users || [];
  const currentCourses = prod.educo_db_courses || [];

  const now = new Date().toISOString();

  // 1. Target Teachers and Admin
  const targetTeachers = [
    {
      id: 'usr-teacher-beknazarov',
      username: 'bexruz_beknazarov',
      first_name: 'Bexruz',
      last_name: 'Beknazarov',
      fullName: 'Beknazarov Bexruz',
      full_name: 'Beknazarov Bexruz',
      role: 'teacher',
      subject: 'Matematika',
      phone: '+998 93 377 22 23',
      email: 'bexruz_beknazarov@educo.app',
      password: 'Bexruz#2223',
      password_updated_at: now,
      is_active: true,
      created_at: now,
      updated_at: now,
    },
    {
      id: 'usr-teacher-yusupjonova',
      username: 'umida_yusupjonova',
      first_name: 'Umida',
      last_name: 'Yusupjonova',
      fullName: 'Yusupjonova Umida Sunnatulloh qizi',
      full_name: 'Yusupjonova Umida Sunnatulloh qizi',
      role: 'teacher',
      subject: 'Arab tili',
      phone: '+998 77 714 48 71',
      email: 'umida_yusupjonova@educo.app',
      password: 'Umida#4871',
      password_updated_at: now,
      is_active: true,
      created_at: now,
      updated_at: now,
    },
    {
      id: 'usr-teacher-toshtemirova',
      username: 'madina_toshtemirova',
      first_name: 'Madina',
      last_name: 'Toshtemirova',
      fullName: 'Toshtemirova Madina Shuxrat qizi',
      full_name: 'Toshtemirova Madina Shuxrat qizi',
      role: 'teacher',
      subject: 'Ingliz tili',
      phone: '+998 97 732 12 09',
      email: 'madina_toshtemirova@educo.app',
      password: 'Madina#1209',
      password_updated_at: now,
      is_active: true,
      created_at: now,
      updated_at: now,
    },
    {
      id: 'usr-teacher-ismatova',
      username: 'shaxnoza_ismatova',
      first_name: 'Shaxnoza',
      last_name: 'Ismatova',
      fullName: 'Ismatova Shaxnoza',
      full_name: 'Ismatova Shaxnoza',
      role: 'teacher',
      subject: 'Rus tili',
      phone: '+998 94 614 29 96',
      email: 'shaxnoza_ismatova@educo.app',
      password: 'Shaxnoza#2996',
      password_updated_at: now,
      is_active: true,
      created_at: now,
      updated_at: now,
    },
    {
      id: 'usr-teacher-karimberdiyeva',
      username: 'fayoza_karimberdiyeva',
      first_name: 'Fayoza',
      last_name: 'Karimberdiyeva',
      fullName: 'Fayoza Karimberdiyeva',
      full_name: 'Fayoza Karimberdiyeva',
      role: 'teacher',
      subject: 'Mental Arifmetika',
      phone: '+998 90 668 56 79',
      email: 'fayoza_karimberdiyeva@educo.app',
      password: 'Fayoza#5679',
      password_updated_at: now,
      is_active: true,
      created_at: now,
      updated_at: now,
    },
    {
      id: 'usr-admin-erkinova',
      username: 'zilola_erkinova',
      first_name: 'Zilola',
      last_name: 'Erkinova',
      fullName: 'Erkinova Zilola',
      full_name: 'Erkinova Zilola',
      role: 'admin',
      phone: '+998 99 900 56 15',
      email: 'zilola_erkinova@educo.app',
      password: 'Zilola#5615',
      password_updated_at: now,
      is_active: true,
      created_at: now,
      updated_at: now,
    },
  ];

  // Merge users by clean phone / username / name
  const userMap = new Map();
  for (const u of currentUsers) {
    if (u && u.id) {
      userMap.set(u.id, u);
    }
  }

  for (const target of targetTeachers) {
    const targetDigits = target.phone.replace(/\D/g, '').slice(-9);
    // Find if already exists by phone or username or name
    let foundExisting = null;
    for (const [id, u] of userMap.entries()) {
      const uDigits = (u.phone || '').replace(/\D/g, '').slice(-9);
      if (
        (uDigits && uDigits === targetDigits) ||
        u.username === target.username ||
        (u.fullName && u.fullName.toLowerCase() === target.fullName.toLowerCase())
      ) {
        foundExisting = u;
        break;
      }
    }

    if (foundExisting) {
      console.log(`Updating existing user: ${foundExisting.fullName} (${foundExisting.id})`);
      userMap.set(foundExisting.id, {
        ...foundExisting,
        ...target,
        id: foundExisting.id,
        updated_at: now,
      });
    } else {
      console.log(`Adding new user: ${target.fullName} (${target.id})`);
      userMap.set(target.id, target);
    }
  }

  const updatedUsers = Array.from(userMap.values());

  // 2. Target Courses
  const targetCourses = [
    {
      id: 'crs-matematika',
      name: 'Matematika',
      code: 'CRS-MAT1',
      price: 500000,
      color: '#3b82f6',
      description: 'Matematika va mantiqiy fikrlash kursi',
      teacher_ids: ['usr-teacher-beknazarov'],
      is_active: true,
      created_at: now,
      updated_at: now,
    },
    {
      id: 'crs-arab-tili',
      name: 'Arab tili',
      code: 'CRS-ARB1',
      price: 500000,
      color: '#10b981',
      description: 'Arab tili va tajvid asoslari',
      teacher_ids: ['usr-teacher-yusupjonova'],
      is_active: true,
      created_at: now,
      updated_at: now,
    },
    {
      id: 'crs-ingliz-tili',
      name: 'Ingliz tili',
      code: 'CRS-ENG1',
      price: 500000,
      color: '#8b5cf6',
      description: 'General English, Grammar and Speaking',
      teacher_ids: ['usr-teacher-toshtemirova'],
      is_active: true,
      created_at: now,
      updated_at: now,
    },
    {
      id: 'crs-rus-tili',
      name: 'Rus tili',
      code: 'CRS-RUS1',
      price: 500000,
      color: '#f59e0b',
      description: 'Rus tili grammatikasi va so‘zlashuv',
      teacher_ids: ['usr-teacher-ismatova'],
      is_active: true,
      created_at: now,
      updated_at: now,
    },
    {
      id: 'crs-mental',
      name: 'Mental Arifmetika',
      code: 'CRS-MNT1',
      price: 450000,
      color: '#ec4899',
      description: 'Mental arifmetika va tezkor hisoblash',
      teacher_ids: ['usr-teacher-karimberdiyeva'],
      is_active: true,
      created_at: now,
      updated_at: now,
    },
    {
      id: 'crs-it',
      name: 'IT va Dasturlash',
      code: 'CRS-IT1',
      price: 600000,
      color: '#06b6d4',
      description: 'Zamonaviy dasturlash va kompyuter savodxonligi',
      teacher_ids: ['usr-1793466843425'],
      is_active: true,
      created_at: now,
      updated_at: now,
    },
    {
      id: 'crs-shaxmat',
      name: 'Shaxmat',
      code: 'CRS-CHESS1',
      price: 400000,
      color: '#64748b',
      description: 'Professional shaxmat mahorati',
      teacher_ids: [],
      is_active: true,
      created_at: now,
      updated_at: now,
    },
  ];

  const courseMap = new Map();
  for (const c of currentCourses) {
    if (c && c.id) {
      courseMap.set(c.id, c);
    }
  }

  for (const tc of targetCourses) {
    let existingCourse = null;
    for (const [id, c] of courseMap.entries()) {
      if (
        c.name.toLowerCase() === tc.name.toLowerCase() ||
        c.code === tc.code ||
        c.id === tc.id
      ) {
        existingCourse = c;
        break;
      }
    }
    if (existingCourse) {
      console.log(`Updating course: ${existingCourse.name} (${existingCourse.id})`);
      courseMap.set(existingCourse.id, {
        ...existingCourse,
        ...tc,
        id: existingCourse.id,
        teacher_ids: Array.from(new Set([...(existingCourse.teacher_ids || []), ...(tc.teacher_ids || [])])),
        updated_at: now,
      });
    } else {
      console.log(`Adding new course: ${tc.name} (${tc.id})`);
      courseMap.set(tc.id, tc);
    }
  }

  const updatedCourses = Array.from(courseMap.values());

  const payload = {
    educo_db_users: updatedUsers,
    educo_db_courses: updatedCourses,
  };

  console.log('Sending payload to Cloudflare D1 store...');
  const postRes = await postJson('https://educo-lms.pages.dev/api/sync-store', payload);
  console.log('Cloudflare D1 sync response:', postRes.status);

  // Update local .data/db.json
  const dbPath = path.resolve('.data/db.json');
  try {
    let localDb = {};
    if (fs.existsSync(dbPath)) {
      localDb = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
    }
    localDb.educo_db_users = updatedUsers;
    localDb.educo_db_courses = updatedCourses;
    fs.writeFileSync(dbPath, JSON.stringify(localDb, null, 2), 'utf8');
    console.log('Updated local .data/db.json successfully.');
  } catch (err) {
    console.warn('Could not update local db.json:', err.message);
  }

  // Broadcast to ntfy cloud bus
  try {
    await postJson('https://ntfy.sh/educo_lms_sync_bus_8899', {
      deviceId: 'antigravity_admin_bot',
      key: 'educo_db_users',
      val: updatedUsers,
      timestamp: Date.now(),
    });
    console.log('Broadcasted users update to ntfy cloud bus.');
  } catch (e) {
    console.warn('ntfy broadcast error:', e.message);
  }

  console.log('All done! Created and updated teachers successfully.');
}

main().catch(console.error);

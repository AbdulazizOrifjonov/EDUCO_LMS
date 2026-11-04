// scripts/harmonize_courses.js
import fs from 'fs';
import path from 'path';
import https from 'https';

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
    https
      .get(urlStr, (res) => {
        let resBody = '';
        res.on('data', (chunk) => (resBody += chunk));
        res.on('end', () => {
          try {
            resolve({ status: res.statusCode, data: JSON.parse(resBody) });
          } catch {
            resolve({ status: res.statusCode, raw: resBody });
          }
        });
      })
      .on('error', reject);
  });
}

async function main() {
  console.log('--- HARMONIZING COURSES AND GROUPS ---');

  // 1. Fetch current live store or local db
  let liveStore = null;
  try {
    const res = await getJson('https://educo-lms.pages.dev/api/sync-store');
    if (res.status === 200 && res.data) {
      liveStore = res.data;
      console.log('Successfully fetched live production store from Cloudflare.');
    }
  } catch (e) {
    console.warn('Failed to fetch live store, using local fallback:', e.message);
  }

  const localDbPath = path.resolve('.data/db.json');
  let db = {};
  if (fs.existsSync(localDbPath)) {
    db = JSON.parse(fs.readFileSync(localDbPath, 'utf8'));
  }
  const store = liveStore || db;

  let courses = store.educo_db_courses || [];
  let groups = store.educo_db_groups || [];
  let users = store.educo_db_users || [];
  let memberships = store.educo_db_group_memberships || [];

  console.log(`Original courses count: ${courses.length}`);
  console.log(`Original groups count: ${groups.length}`);

  // Canonical course IDs:
  // Mental Arifmetika: crs-1793623377912 (which user is actively editing at localhost:5173/owner/courses/edit/crs-1793623377912)
  // Matematika: crs-matematika
  // Rus tili: crs-rus-tili
  const CANONICAL_MENTAL_ID = 'crs-1793623377912';
  const CANONICAL_MATH_ID = 'crs-matematika';
  const CANONICAL_RUS_ID = 'crs-rus-tili';

  // 1. Harmonize Mental Arifmetika Course
  let mentalCourse = courses.find((c) => c.id === CANONICAL_MENTAL_ID) || {
    id: CANONICAL_MENTAL_ID,
    name: 'Mental Arifmetika',
    code: 'CRS-MNT1',
  };
  mentalCourse.name = 'Mental Arifmetika';
  mentalCourse.code = 'CRS-MNT1';
  mentalCourse.monthly_fee = 498000;
  mentalCourse.price = 498000;
  mentalCourse.color = '#ec4899';
  mentalCourse.description = 'Mental arifmetika va tezkor hisoblash';
  mentalCourse.is_active = true;
  mentalCourse.teacher_ids = ['usr-1793622773288'];
  mentalCourse.teachers = [
    {
      id: 'usr-1793622773288',
      name: 'Fayoza Karimberdiyeva',
      phone: '+998 90 668 56 79',
    },
  ];

  // 2. Harmonize Matematika Course
  let mathCourse = courses.find((c) => c.id === CANONICAL_MATH_ID) || {
    id: CANONICAL_MATH_ID,
    name: 'Matematika',
    code: 'CRS-MAT1',
  };
  mathCourse.name = 'Matematika';
  mathCourse.code = 'CRS-MAT1';
  mathCourse.monthly_fee = 500000;
  mathCourse.price = 500000;
  mathCourse.color = '#3b82f6';
  mathCourse.description = 'Matematika va mantiqiy fikrlash kursi';
  mathCourse.is_active = true;
  mathCourse.teacher_ids = ['usr-1793603060709'];
  mathCourse.teachers = [
    {
      id: 'usr-1793603060709',
      name: 'Bexruz Beknazarov',
      phone: '+998 93 377 22 23',
    },
  ];

  // 3. Harmonize Rus tili Course
  let rusCourse = courses.find((c) => c.id === CANONICAL_RUS_ID) || {
    id: CANONICAL_RUS_ID,
    name: 'Rus tili',
    code: 'CRS-RUS1',
  };
  rusCourse.name = 'Rus tili';
  rusCourse.code = 'CRS-RUS1';
  rusCourse.monthly_fee = 500000;
  rusCourse.price = 500000;
  rusCourse.color = '#f59e0b';
  rusCourse.description = 'Rus tili bo‘yicha professional o‘quv kursi';
  rusCourse.is_active = true;
  rusCourse.teacher_ids = ['usr-1793622233829'];
  rusCourse.teachers = [
    {
      id: 'usr-1793622233829',
      name: 'Shaxnoza Ismatova',
      phone: '+998 91 123 45 67',
    },
  ];

  // Filter out the duplicate course rows:
  // - crs-mental (old duplicate of crs-1793623377912)
  // - crs-1793615340332 (duplicate of crs-matematika)
  // - crs-1793622350270 (duplicate of crs-rus-tili)
  const removeCourseIds = new Set(['crs-mental', 'crs-1793615340332', 'crs-1793622350270']);
  courses = courses.filter((c) => !removeCourseIds.has(c.id));

  // Ensure canonical courses are in courses array
  const upsertCourse = (item) => {
    const idx = courses.findIndex((c) => c.id === item.id);
    if (idx >= 0) courses[idx] = { ...courses[idx], ...item };
    else courses.push(item);
  };
  upsertCourse(mentalCourse);
  upsertCourse(mathCourse);
  upsertCourse(rusCourse);

  console.log(`Harmonized courses count: ${courses.length}`);
  courses.forEach((c) => console.log(`  Course: ${c.id} | ${c.name} (${c.code})`));

  // 4. Harmonize Groups:
  // Mental Arithmetic groups:
  // - grp-mental -> Mental Arifmetika 1.1 (MNT-1.1), course_id = CANONICAL_MENTAL_ID (3 students)
  // - grp-1793623583736 -> Mental Arifmetika 1.2 (MNT-1.2), course_id = CANONICAL_MENTAL_ID (0 students)
  groups = groups.map((g) => {
    // Mental groups
    if (g.id === 'grp-mental' || (g.course_id === 'crs-mental' && g.id !== 'grp-1793623583736')) {
      return {
        ...g,
        id: 'grp-mental',
        name: 'Mental Arifmetika 1.1 (MNT-1.1)',
        code: 'MNT-1.1',
        course_id: CANONICAL_MENTAL_ID,
        course_name: 'Mental Arifmetika',
        direction: 'Mental Arifmetika',
        teacher_id: 'usr-1793622773288',
        teacher_name: 'Fayoza Karimberdiyeva',
        teacherName: 'Fayoza Karimberdiyeva',
        room: 'Xona 202',
        capacity: 35,
        monthly_price: 498000,
        price: 498000,
        status: 'active',
        is_active: true,
      };
    }
    if (g.id === 'grp-1793623583736' || (g.course_id === CANONICAL_MENTAL_ID && g.id !== 'grp-mental')) {
      return {
        ...g,
        id: 'grp-1793623583736',
        name: 'Mental Arifmetika 1.2 (MNT-1.2)',
        code: 'MNT-1.2',
        course_id: CANONICAL_MENTAL_ID,
        course_name: 'Mental Arifmetika',
        direction: 'Mental Arifmetika',
        teacher_id: 'usr-1793622773288',
        teacher_name: 'Fayoza Karimberdiyeva',
        teacherName: 'Fayoza Karimberdiyeva',
        room: 'Xona 203',
        capacity: 35,
        monthly_price: 498000,
        price: 498000,
        status: 'active',
        is_active: true,
      };
    }

    // Matematika groups
    if (g.id === 'grp-matematika') {
      return {
        ...g,
        name: 'Matematika 1.1 (MAT-1.1)',
        code: 'MAT-1.1',
        course_id: CANONICAL_MATH_ID,
        course_name: 'Matematika',
        direction: 'Matematika',
        teacher_id: 'usr-1793603060709',
        teacher_name: 'Bexruz Beknazarov',
        teacherName: 'Bexruz Beknazarov',
        room: 'Xona 101',
        capacity: 35,
        status: 'active',
        is_active: true,
      };
    }
    if (g.id === 'grp-1793615416295') {
      return {
        ...g,
        name: 'Matematika 1.2 (MAT-1.2)',
        code: 'MAT-1.2',
        course_id: CANONICAL_MATH_ID,
        course_name: 'Matematika',
        direction: 'Matematika',
        teacher_id: 'usr-1793603060709',
        teacher_name: 'Bexruz Beknazarov',
        teacherName: 'Bexruz Beknazarov',
        room: 'Xona 105',
        capacity: 35,
        status: 'active',
        is_active: true,
      };
    }

    // Rus tili groups
    if (g.id === 'grp-rus-tili') {
      return {
        ...g,
        name: 'Rus tili 1.1 (RUS-1.1)',
        code: 'RUS-1.1',
        course_id: CANONICAL_RUS_ID,
        course_name: 'Rus tili',
        direction: 'Rus tili',
        teacher_id: 'usr-1793622233829',
        teacher_name: 'Shaxnoza Ismatova',
        teacherName: 'Shaxnoza Ismatova',
        room: 'Xona 104',
        capacity: 35,
        status: 'active',
        is_active: true,
      };
    }
    if (g.id === 'grp-rus-tili-2') {
      return {
        ...g,
        name: 'Rus tili 1.2 (RUS-1.2)',
        code: 'RUS-1.2',
        course_id: CANONICAL_RUS_ID,
        course_name: 'Rus tili',
        direction: 'Rus tili',
        teacher_id: 'usr-1793622233829',
        teacher_name: 'Shaxnoza Ismatova',
        teacherName: 'Shaxnoza Ismatova',
        room: 'Xona 106',
        capacity: 35,
        status: 'active',
        is_active: true,
      };
    }
    if (g.id === 'grp-1793622453272') {
      return {
        ...g,
        name: 'Rus tili 1.3 (RUS-1.3)',
        code: 'RUS-1.3',
        course_id: CANONICAL_RUS_ID,
        course_name: 'Rus tili',
        direction: 'Rus tili',
        teacher_id: 'usr-1793622233829',
        teacher_name: 'Shaxnoza Ismatova',
        teacherName: 'Shaxnoza Ismatova',
        room: 'Xona 108',
        capacity: 35,
        status: 'active',
        is_active: true,
      };
    }

    // Ingliz tili groups
    if (g.id === 'grp-ingliz-tili') {
      return {
        ...g,
        name: 'Ingliz tili 1.1 (ENG-1.1)',
        code: 'ENG-1.1',
        course_id: 'crs-ingliz-tili',
        course_name: 'Ingliz tili',
        direction: 'Ingliz tili',
        capacity: 35,
        status: 'active',
        is_active: true,
      };
    }

    return g;
  });

  console.log(`Harmonized groups count: ${groups.length}`);
  groups.forEach((g) => {
    console.log(`  Group: ${g.id} | ${g.name} | course_id: ${g.course_id} | students: ${(g.student_ids || []).length}`);
  });

  // 5. Harmonize Users (Course references):
  // Map crs-mental -> CANONICAL_MENTAL_ID
  // Map crs-1793615340332 -> CANONICAL_MATH_ID
  // Map crs-1793622350270 -> CANONICAL_RUS_ID
  users = users.map((u) => {
    if (u.id === 'usr-1793622773288') {
      return {
        ...u,
        course_ids: [CANONICAL_MENTAL_ID],
        group_ids: ['grp-mental', 'grp-1793623583736'],
      };
    }
    let cids = u.course_ids || [];
    let modified = false;
    cids = cids.map((cid) => {
      if (cid === 'crs-mental') {
        modified = true;
        return CANONICAL_MENTAL_ID;
      }
      if (cid === 'crs-1793615340332') {
        modified = true;
        return CANONICAL_MATH_ID;
      }
      if (cid === 'crs-1793622350270') {
        modified = true;
        return CANONICAL_RUS_ID;
      }
      return cid;
    });
    if (modified) {
      return { ...u, course_ids: [...new Set(cids)] };
    }
    return u;
  });

  // 6. Harmonize Memberships:
  memberships = memberships.map((m) => {
    if (m.course_id === 'crs-mental') return { ...m, course_id: CANONICAL_MENTAL_ID };
    if (m.course_id === 'crs-1793615340332') return { ...m, course_id: CANONICAL_MATH_ID };
    if (m.course_id === 'crs-1793622350270') return { ...m, course_id: CANONICAL_RUS_ID };
    return m;
  });

  // Save to local db.json
  const updatedStore = {
    ...store,
    educo_db_courses: courses,
    educo_db_groups: groups,
    educo_db_users: users,
    educo_db_group_memberships: memberships,
    _sync_version: Date.now(),
  };

  fs.writeFileSync(localDbPath, JSON.stringify(updatedStore, null, 2), 'utf8');
  console.log('Saved harmonized data to .data/db.json.');

  // Push to Cloudflare production /api/sync-store
  console.log('Pushing harmonized store to https://educo-lms.pages.dev/api/sync-store...');
  try {
    const postRes = await postJson('https://educo-lms.pages.dev/api/sync-store', {
      educo_db_courses: courses,
      educo_db_groups: groups,
      educo_db_users: users,
      educo_db_group_memberships: memberships,
    });
    console.log('Cloudflare sync response status:', postRes.status, postRes.data || postRes.raw);
  } catch (err) {
    console.error('Failed to sync to Cloudflare:', err.message);
  }

  console.log('--- HARMONIZATION COMPLETE ---');
}

main().catch(console.error);

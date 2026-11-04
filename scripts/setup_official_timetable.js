// scripts/setup_official_timetable.js
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

const OFFICIAL_TIMETABLE_SLOTS = [
  // 1-7: MADINA (INGLIZ TILI)
  {
    slotNum: 1,
    teacherKey: 'madina',
    teacherName: 'Toshtemirova Madina Shuxrat qizi',
    teacherId: 'usr-teacher-toshtemirova',
    courseId: 'crs-ingliz-tili',
    courseName: 'Ingliz tili',
    groupId: 'grp-ingliz-tili',
    groupName: 'Ingliz tili 1.1 (ENG-1.1)',
    groupCode: 'ENG-1.1',
    pattern: 'odd', // D/CH/J -> [1, 3, 5]
    daysOfWeek: [1, 3, 5],
    startTime: '09:00:00',
    endTime: '10:30:00',
    scheduleText: 'Dush-Chor-Jum, 09:00 - 10:30',
    room: '102',
  },
  {
    slotNum: 2,
    teacherKey: 'madina',
    teacherName: 'Toshtemirova Madina Shuxrat qizi',
    teacherId: 'usr-teacher-toshtemirova',
    courseId: 'crs-ingliz-tili',
    courseName: 'Ingliz tili',
    groupId: 'grp-ingliz-tili-2',
    groupName: 'Ingliz tili 1.2 (ENG-1.2)',
    groupCode: 'ENG-1.2',
    pattern: 'odd', // D/CH/J -> [1, 3, 5]
    daysOfWeek: [1, 3, 5],
    startTime: '10:30:00',
    endTime: '12:00:00',
    scheduleText: 'Dush-Chor-Jum, 10:30 - 12:00',
    room: '102',
  },
  {
    slotNum: 3,
    teacherKey: 'madina',
    teacherName: 'Toshtemirova Madina Shuxrat qizi',
    teacherId: 'usr-teacher-toshtemirova',
    courseId: 'crs-ingliz-tili',
    courseName: 'Ingliz tili',
    groupId: 'grp-ingliz-tili-3',
    groupName: 'Ingliz tili 1.3 (ENG-1.3)',
    groupCode: 'ENG-1.3',
    pattern: 'even', // S/P/SH -> [2, 4, 6]
    daysOfWeek: [2, 4, 6],
    startTime: '09:30:00',
    endTime: '11:00:00',
    scheduleText: 'Sesh-Pay-Shan, 09:30 - 11:00',
    room: '102',
  },
  {
    slotNum: 4,
    teacherKey: 'madina',
    teacherName: 'Toshtemirova Madina Shuxrat qizi',
    teacherId: 'usr-teacher-toshtemirova',
    courseId: 'crs-ingliz-tili',
    courseName: 'Ingliz tili',
    groupId: 'grp-ingliz-tili-4',
    groupName: 'Ingliz tili 1.4 (ENG-1.4)',
    groupCode: 'ENG-1.4',
    pattern: 'even', // S/P/SH -> [2, 4, 6]
    daysOfWeek: [2, 4, 6],
    startTime: '11:00:00',
    endTime: '12:30:00',
    scheduleText: 'Sesh-Pay-Shan, 11:00 - 12:30',
    room: '102',
  },
  {
    slotNum: 5,
    teacherKey: 'madina',
    teacherName: 'Toshtemirova Madina Shuxrat qizi',
    teacherId: 'usr-teacher-toshtemirova',
    courseId: 'crs-ingliz-tili',
    courseName: 'Ingliz tili',
    groupId: 'grp-ingliz-tili-5',
    groupName: 'Ingliz tili 1.5 (ENG-1.5)',
    groupCode: 'ENG-1.5',
    pattern: 'even', // S/P/SH -> [2, 4, 6]
    daysOfWeek: [2, 4, 6],
    startTime: '14:00:00',
    endTime: '15:30:00',
    scheduleText: 'Sesh-Pay-Shan, 14:00 - 15:30',
    room: '102',
  },
  {
    slotNum: 6,
    teacherKey: 'madina',
    teacherName: 'Toshtemirova Madina Shuxrat qizi',
    teacherId: 'usr-teacher-toshtemirova',
    courseId: 'crs-ingliz-tili',
    courseName: 'Ingliz tili',
    groupId: 'grp-ingliz-tili-6',
    groupName: 'Ingliz tili 1.6 (ENG-1.6)',
    groupCode: 'ENG-1.6',
    pattern: 'even', // S/P/SH -> [2, 4, 6]
    daysOfWeek: [2, 4, 6],
    startTime: '15:30:00',
    endTime: '17:00:00',
    scheduleText: 'Sesh-Pay-Shan, 15:30 - 17:00',
    room: '102',
  },
  {
    slotNum: 7,
    teacherKey: 'madina',
    teacherName: 'Toshtemirova Madina Shuxrat qizi',
    teacherId: 'usr-teacher-toshtemirova',
    courseId: 'crs-ingliz-tili',
    courseName: 'Ingliz tili',
    groupId: 'grp-ingliz-tili-7',
    groupName: 'Ingliz tili 1.7 (ENG-1.7)',
    groupCode: 'ENG-1.7',
    pattern: 'even', // S/P/SH -> [2, 4, 6]
    daysOfWeek: [2, 4, 6],
    startTime: '17:00:00',
    endTime: '18:30:00',
    scheduleText: 'Sesh-Pay-Shan, 17:00 - 18:30',
    room: '102',
  },

  // 8-10: UMIDA (ARAB TILI)
  {
    slotNum: 8,
    teacherKey: 'umida',
    teacherName: 'Yusupjonova Umida Sunnatulloh qizi',
    teacherId: 'usr-teacher-yusupjonova',
    courseId: 'crs-arab-tili',
    courseName: 'Arab tili',
    groupId: 'grp-arab-tili',
    groupName: 'Arab tili 1.1 (ARB-1.1)',
    groupCode: 'ARB-1.1',
    pattern: 'odd', // D/CH/J -> [1, 3, 5]
    daysOfWeek: [1, 3, 5],
    startTime: '17:00:00',
    endTime: '18:30:00',
    scheduleText: 'Dush-Chor-Jum, 17:00 - 18:30',
    room: '103',
  },
  {
    slotNum: 9,
    teacherKey: 'umida',
    teacherName: 'Yusupjonova Umida Sunnatulloh qizi',
    teacherId: 'usr-teacher-yusupjonova',
    courseId: 'crs-arab-tili',
    courseName: 'Arab tili',
    groupId: 'grp-arab-tili-2',
    groupName: 'Arab tili 1.2 (ARB-1.2)',
    groupCode: 'ARB-1.2',
    pattern: 'even', // S/P/SH -> [2, 4, 6]
    daysOfWeek: [2, 4, 6],
    startTime: '07:00:00',
    endTime: '08:30:00',
    scheduleText: 'Sesh-Pay-Shan, 07:00 - 08:30',
    room: '103',
  },
  {
    slotNum: 10,
    teacherKey: 'umida',
    teacherName: 'Yusupjonova Umida Sunnatulloh qizi',
    teacherId: 'usr-teacher-yusupjonova',
    courseId: 'crs-arab-tili',
    courseName: 'Arab tili',
    groupId: 'grp-arab-tili-3',
    groupName: 'Arab tili 1.3 (ARB-1.3)',
    groupCode: 'ARB-1.3',
    pattern: 'even', // S/P/SH -> [2, 4, 6]
    daysOfWeek: [2, 4, 6],
    startTime: '17:00:00',
    endTime: '18:30:00',
    scheduleText: 'Sesh-Pay-Shan, 17:00 - 18:30',
    room: '103',
  },

  // 11-14: SHAXNOZA (RUS TILI)
  {
    slotNum: 11,
    teacherKey: 'shaxnoza',
    teacherName: 'Ismatova Shaxnoza',
    teacherId: 'usr-1793622233829',
    courseId: 'crs-rus-tili',
    courseName: 'Rus tili',
    groupId: 'grp-rus-tili',
    groupName: 'Rus tili 1.1 (RUS-1.1)',
    groupCode: 'RUS-1.1',
    pattern: 'odd', // D/CH/J -> [1, 3, 5]
    daysOfWeek: [1, 3, 5],
    startTime: '09:30:00',
    endTime: '11:00:00',
    scheduleText: 'Dush-Chor-Jum, 09:30 - 11:00',
    room: '104',
  },
  {
    slotNum: 12,
    teacherKey: 'shaxnoza',
    teacherName: 'Ismatova Shaxnoza',
    teacherId: 'usr-1793622233829',
    courseId: 'crs-rus-tili',
    courseName: 'Rus tili',
    groupId: 'grp-rus-tili-2',
    groupName: 'Rus tili 1.2 (RUS-1.2)',
    groupCode: 'RUS-1.2',
    pattern: 'odd', // D/CH/J -> [1, 3, 5]
    daysOfWeek: [1, 3, 5],
    startTime: '18:00:00',
    endTime: '19:30:00',
    scheduleText: 'Dush-Chor-Jum, 18:00 - 19:30',
    room: '104',
  },
  {
    slotNum: 13,
    teacherKey: 'shaxnoza',
    teacherName: 'Ismatova Shaxnoza',
    teacherId: 'usr-1793622233829',
    courseId: 'crs-rus-tili',
    courseName: 'Rus tili',
    groupId: 'grp-1793622453272',
    groupName: 'Rus tili 1.3 (RUS-1.3)',
    groupCode: 'RUS-1.3',
    pattern: 'even', // S/P/SH -> [2, 4, 6]
    daysOfWeek: [2, 4, 6],
    startTime: '10:00:00',
    endTime: '11:30:00',
    scheduleText: 'Sesh-Pay-Shan, 10:00 - 11:30',
    room: '104',
  },
  {
    slotNum: 14,
    teacherKey: 'shaxnoza',
    teacherName: 'Ismatova Shaxnoza',
    teacherId: 'usr-1793622233829',
    courseId: 'crs-rus-tili',
    courseName: 'Rus tili',
    groupId: 'grp-rus-tili-4',
    groupName: 'Rus tili 1.4 (RUS-1.4)',
    groupCode: 'RUS-1.4',
    pattern: 'even', // S/P/SH -> [2, 4, 6]
    daysOfWeek: [2, 4, 6],
    startTime: '17:30:00',
    endTime: '19:00:00',
    scheduleText: 'Sesh-Pay-Shan, 17:30 - 19:00',
    room: '104',
  },

  // 15: FAYOZA (MENTAL ARIF)
  {
    slotNum: 15,
    teacherKey: 'fayoza',
    teacherName: 'Fayoza Karimberdiyeva',
    teacherId: 'usr-1793622773288',
    courseId: 'crs-1793623377912',
    courseName: 'Mental Arifmetika',
    groupId: 'grp-mental',
    groupName: 'Mental Arifmetika 1.1 (MNT-1.1)',
    groupCode: 'MNT-1.1',
    pattern: 'odd', // D/CH/J -> [1, 3, 5]
    daysOfWeek: [1, 3, 5],
    startTime: '16:00:00',
    endTime: '17:30:00',
    scheduleText: 'Dush-Chor-Jum, 16:00 - 17:30',
    room: '202',
  },

  // 16-20: BEXRUZ (MATEM)
  {
    slotNum: 16,
    teacherKey: 'bexruz',
    teacherName: 'Beknazarov Bexruz',
    teacherId: 'usr-1793603060709',
    courseId: 'crs-matematika',
    courseName: 'Matematika',
    groupId: 'grp-matematika',
    groupName: 'Matematika 1.1 (MAT-1.1)',
    groupCode: 'MAT-1.1',
    pattern: 'odd', // D/CH/J -> [1, 3, 5]
    daysOfWeek: [1, 3, 5],
    startTime: '09:30:00',
    endTime: '11:00:00',
    scheduleText: 'Dush-Chor-Jum, 09:30 - 11:00',
    room: '101',
  },
  {
    slotNum: 17,
    teacherKey: 'bexruz',
    teacherName: 'Beknazarov Bexruz',
    teacherId: 'usr-1793603060709',
    courseId: 'crs-matematika',
    courseName: 'Matematika',
    groupId: 'grp-1793615416295',
    groupName: 'Matematika 1.2 (MAT-1.2)',
    groupCode: 'MAT-1.2',
    pattern: 'even', // S/P/SH -> [2, 4, 6]
    daysOfWeek: [2, 4, 6],
    startTime: '08:30:00',
    endTime: '10:00:00',
    scheduleText: 'Sesh-Pay-Shan, 08:30 - 10:00',
    room: '101',
  },
  {
    slotNum: 18,
    teacherKey: 'bexruz',
    teacherName: 'Beknazarov Bexruz',
    teacherId: 'usr-1793603060709',
    courseId: 'crs-matematika',
    courseName: 'Matematika',
    groupId: 'grp-matematika-3',
    groupName: 'Matematika 1.3 (MAT-1.3)',
    groupCode: 'MAT-1.3',
    pattern: 'even', // S/P/SH -> [2, 4, 6]
    daysOfWeek: [2, 4, 6],
    startTime: '10:00:00',
    endTime: '11:30:00',
    scheduleText: 'Sesh-Pay-Shan, 10:00 - 11:30',
    room: '101',
  },
  {
    slotNum: 19,
    teacherKey: 'bexruz',
    teacherName: 'Beknazarov Bexruz',
    teacherId: 'usr-1793603060709',
    courseId: 'crs-matematika',
    courseName: 'Matematika',
    groupId: 'grp-matematika-4',
    groupName: 'Matematika 1.4 (MAT-1.4)',
    groupCode: 'MAT-1.4',
    pattern: 'even', // S/P/SH -> [2, 4, 6]
    daysOfWeek: [2, 4, 6],
    startTime: '14:00:00',
    endTime: '15:30:00',
    scheduleText: 'Sesh-Pay-Shan, 14:00 - 15:30',
    room: '101',
  },
  {
    slotNum: 20,
    teacherKey: 'bexruz',
    teacherName: 'Beknazarov Bexruz',
    teacherId: 'usr-1793603060709',
    courseId: 'crs-matematika',
    courseName: 'Matematika',
    groupId: 'grp-matematika-5',
    groupName: 'Matematika 1.5 (MAT-1.5)',
    groupCode: 'MAT-1.5',
    pattern: 'even', // S/P/SH -> [2, 4, 6]
    daysOfWeek: [2, 4, 6],
    startTime: '15:30:00',
    endTime: '17:00:00',
    scheduleText: 'Sesh-Pay-Shan, 15:30 - 17:00',
    room: '101',
  },

  // 21: SHUXRAT (SHAXMAT)
  {
    slotNum: 21,
    teacherKey: 'shuxrat',
    teacherName: 'Shuxrat Qosimov',
    teacherId: 'usr-teacher-qosimov',
    courseId: 'crs-shaxmat',
    courseName: 'Shaxmat',
    groupId: 'grp-shaxmat',
    groupName: 'Shaxmat guruhi (CHESS-1.1)',
    groupCode: 'CHESS-1.1',
    pattern: 'even', // S/P/SH -> [2, 4, 6]
    daysOfWeek: [2, 4, 6],
    startTime: '17:00:00',
    endTime: '18:30:00',
    scheduleText: 'Sesh-Pay-Shan, 17:00 - 18:30',
    room: '203',
  },

  // 22: ABDULAZIZ (IT)
  {
    slotNum: 22,
    teacherKey: 'abdulaziz',
    teacherName: 'Abdulazizbek Orifjonov',
    teacherId: 'usr-1793466843425',
    courseId: 'crs-fullstack',
    courseName: 'Full Stack',
    groupId: 'grp-fullstack',
    groupName: 'Full Stack guruhi (IT-1.1)',
    groupCode: 'IT-1.1',
    pattern: 'odd', // D/CH/J -> [1, 3, 5]
    daysOfWeek: [1, 3, 5],
    startTime: '18:00:00',
    endTime: '19:30:00',
    scheduleText: 'Dush-Chor-Jum, 18:00 - 19:30',
    room: '3-xona (IT Lab)',
  },
];

async function main() {
  console.log('=== SETTING UP OFFICIAL TIMETABLE FOR ALL TEACHERS ===');

  let liveStore = null;
  try {
    const res = await getJson('https://educo-lms.pages.dev/api/sync-store');
    if (res.status === 200 && res.data) {
      liveStore = res.data;
      console.log('Fetched live store from Cloudflare.');
    }
  } catch (e) {
    console.warn('Live store fetch failed, falling back to local db.json:', e.message);
  }

  const localDbPath = path.resolve('.data/db.json');
  let db = {};
  if (fs.existsSync(localDbPath)) {
    db = JSON.parse(fs.readFileSync(localDbPath, 'utf8'));
  }
  const store = liveStore || db;

  let users = store.educo_db_users || [];
  let groups = store.educo_db_groups || [];
  let courses = store.educo_db_courses || [];

  // 1. Update Teacher Shuxrat Qosimov
  users = users.map((u) => {
    if (u.id === 'usr-teacher-qosimov' || u.username === 'rustam_qosimov') {
      return {
        ...u,
        first_name: 'Shuxrat',
        last_name: 'Qosimov',
        fullName: 'Shuxrat Qosimov',
        full_name: 'Shuxrat Qosimov',
        username: 'shuxrat_qosimov',
        subject: 'Shaxmat',
      };
    }
    return u;
  });

  // 2. Upsert or update groups for each slot
  for (const slot of OFFICIAL_TIMETABLE_SLOTS) {
    let grp = groups.find((g) => g.id === slot.groupId);
    if (!grp) {
      // Create new group for this timetable slot
      grp = {
        id: slot.groupId,
        name: slot.groupName,
        code: slot.groupCode,
        course_id: slot.courseId,
        course_name: slot.courseName,
        direction: slot.courseName,
        teacher_id: slot.teacherId,
        teacher_name: slot.teacherName,
        room: slot.room,
        capacity: 35,
        student_ids: [],
        enrolled_count: 0,
        status: 'active',
        is_active: true,
        schedule: slot.scheduleText,
        start_time: slot.startTime,
        end_time: slot.endTime,
        monthly_price: 500000,
        price: 500000,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      groups.push(grp);
      console.log(`Created new parallel group: ${grp.name} (${grp.id})`);
    } else {
      // Update existing group with exact timetable details
      grp.name = slot.groupName;
      grp.code = slot.groupCode;
      grp.course_id = slot.courseId;
      grp.course_name = slot.courseName;
      grp.direction = slot.courseName;
      grp.teacher_id = slot.teacherId;
      grp.teacher_name = slot.teacherName;
      grp.room = slot.room;
      grp.schedule = slot.scheduleText;
      grp.start_time = slot.startTime;
      grp.end_time = slot.endTime;
      grp.status = 'active';
      grp.is_active = true;
      grp.updated_at = new Date().toISOString();
      console.log(`Updated group: ${grp.name} (${grp.id}) -> ${grp.schedule}`);
    }
  }

  // Remove obsolete/duplicate groups that have no students and are duplicates
  const keepGroupIds = new Set(OFFICIAL_TIMETABLE_SLOTS.map((s) => s.groupId));
  keepGroupIds.add('grp-1793623583736'); // Mental 1.2
  groups = groups.filter((g) => {
    if (g.id === 'grp-1793778141712' || g.id === 'grp-1793778155864') {
      console.log(`Removing redundant temporary group clone: ${g.id}`);
      return false;
    }
    return true;
  });

  // 3. Generate the 66 exact lesson schedule entries (22 slots x 3 days)
  const lessonSchedules = [];
  for (const slot of OFFICIAL_TIMETABLE_SLOTS) {
    for (const dayNum of slot.daysOfWeek) {
      const scheduleId = `sch-${slot.teacherKey}-${slot.groupCode.toLowerCase().replace(/[^a-z0-9]/g, '')}-d${dayNum}`;
      lessonSchedules.push({
        id: scheduleId,
        group_id: slot.groupId,
        day_of_week: dayNum,
        start_time: slot.startTime,
        end_time: slot.endTime,
        room: slot.room,
        created_at: new Date().toISOString(),
      });
    }
  }

  console.log(`Total generated lesson schedules: ${lessonSchedules.length} (22 slots x 3 days)`);

  // 4. Update teachers' assigned group_ids
  users = users.map((u) => {
    const teacherSlots = OFFICIAL_TIMETABLE_SLOTS.filter(
      (s) => s.teacherId === u.id || (u.username && s.teacherKey === u.username.split('_')[0])
    );
    if (teacherSlots.length > 0) {
      const gids = teacherSlots.map((s) => s.groupId);
      return {
        ...u,
        group_ids: Array.from(new Set([...(u.group_ids || []), ...gids])),
      };
    }
    return u;
  });

  // 5. Save to local .data/db.json
  const updatedStore = {
    ...store,
    educo_db_users: users,
    educo_db_groups: groups,
    educo_db_courses: courses,
    educo_db_lesson_schedules: lessonSchedules,
    _sync_version: Date.now(),
  };

  fs.writeFileSync(localDbPath, JSON.stringify(updatedStore, null, 2), 'utf8');
  console.log('Saved timetable to local .data/db.json.');

  // 6. Push to live Cloudflare production /api/sync-store
  console.log('Pushing official timetable to https://educo-lms.pages.dev/api/sync-store...');
  try {
    const postRes = await postJson('https://educo-lms.pages.dev/api/sync-store', {
      educo_db_users: users,
      educo_db_groups: groups,
      educo_db_courses: courses,
      educo_db_lesson_schedules: lessonSchedules,
    });
    console.log('Cloudflare sync response:', postRes.status, postRes.data || postRes.raw);
  } catch (err) {
    console.error('Failed to sync to Cloudflare:', err.message);
  }

  console.log('=== TIMETABLE SETUP COMPLETE ===');
}

main().catch(console.error);

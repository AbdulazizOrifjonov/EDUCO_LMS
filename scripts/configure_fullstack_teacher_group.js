// scripts/configure_fullstack_teacher_group.js
import https from 'https';
import fs from 'fs';
import path from 'path';

function getJson(urlStr) {
  return new Promise((resolve, reject) => {
    https.get(urlStr, (res) => {
      let body = '';
      res.on('data', (c) => (body += c));
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

async function run() {
  console.log('Fetching live cloud store...');
  const prod = await getJson('https://educo-lms.pages.dev/api/sync-store');

  const now = new Date().toISOString();

  let users = prod.educo_db_users || [];
  let courses = prod.educo_db_courses || [];
  let groups = prod.educo_db_groups || [];
  let memberships = prod.educo_db_group_memberships || [];

  console.log('Original counts:', {
    users: users.length,
    courses: courses.length,
    groups: groups.length,
    memberships: memberships.length,
  });

  // 1. Find Abdulazizbek Orifjonov
  const teacherId = 'usr-1793466843425';
  let teacherUser = users.find(
    (u) =>
      u.id === teacherId ||
      u.username === 'abdulazizbek_orifjonov' ||
      (u.phone && u.phone.includes('93 582 17 74'))
  );

  if (!teacherUser) {
    console.log('Creating Abdulazizbek Orifjonov teacher user...');
    teacherUser = {
      id: teacherId,
      username: 'abdulazizbek_orifjonov',
      first_name: 'Abdulazizbek',
      last_name: 'Orifjonov',
      fullName: 'Abdulazizbek Orifjonov',
      full_name: 'Abdulazizbek Orifjonov',
      role: 'teacher',
      specialty: 'Full Stack',
      subject: 'Full Stack',
      email: 'abdulazizbek_orifjonov@educo.app',
      phone: '+998 93 582 17 74',
      password: 'Hbwy%22A7',
      password_updated_at: now,
      is_active: true,
      created_at: now,
      updated_at: now,
    };
    users.push(teacherUser);
  } else {
    console.log('Updating Abdulazizbek Orifjonov teacher user to Full Stack...');
    teacherUser.specialty = 'Full Stack';
    teacherUser.subject = 'Full Stack';
    teacherUser.role = 'teacher';
    teacherUser.updated_at = now;
  }

  // 2. Configure Course: "Full Stack"
  // Remove duplicate/old IT or Frontend courses assigned to this teacher, or update crs-it
  courses = courses.filter((c) => c.id !== 'crs-1793466841391'); // remove old dummy frontend course
  let fullStackCourse = courses.find((c) => c.id === 'crs-fullstack' || c.id === 'crs-it');
  if (!fullStackCourse) {
    fullStackCourse = {
      id: 'crs-fullstack',
      name: 'Full Stack',
      code: 'CRS-FS1',
      price: 600000,
      color: '#10b981',
      description: 'Full Stack veb-dasturlash kursi (Frontend & Backend)',
      teacher_ids: [teacherUser.id],
      is_active: true,
      created_at: now,
      updated_at: now,
    };
    courses.push(fullStackCourse);
  } else {
    fullStackCourse.id = 'crs-fullstack';
    fullStackCourse.name = 'Full Stack';
    fullStackCourse.code = 'CRS-FS1';
    fullStackCourse.color = '#10b981';
    fullStackCourse.description = 'Full Stack veb-dasturlash kursi (Frontend & Backend)';
    fullStackCourse.teacher_ids = [teacherUser.id];
    fullStackCourse.is_active = true;
    fullStackCourse.updated_at = now;
  }

  // Also clean up any other course that says "IT va Dasturlash" to avoid confusion
  courses = courses.filter((c) => c.id !== 'crs-it' || c === fullStackCourse);

  // 3. Find the 3 target students: Ismoil, Qudratillo, Amirbek
  const studentIsmoil = users.find((u) => u.id === 'usr-student-930098339' || (u.phone && u.phone.includes('93 009 83 39')));
  const studentQudrat = users.find((u) => u.id === 'usr-student-943852253' || (u.phone && u.phone.includes('94 385 22 53')));
  const studentAmirbek = users.find((u) => u.id === 'usr-1793599332662' || (u.phone && u.phone.includes('94 788 29 06')));

  if (!studentIsmoil || !studentQudrat || !studentAmirbek) {
    console.error('Could not find all 3 students!', {
      studentIsmoil: Boolean(studentIsmoil),
      studentQudrat: Boolean(studentQudrat),
      studentAmirbek: Boolean(studentAmirbek),
    });
    process.exit(1);
  }

  const targetStudentIds = [studentIsmoil.id, studentQudrat.id, studentAmirbek.id];
  console.log('Target student IDs:', targetStudentIds);

  // 4. Configure Group: Exactly 1 group for teacher Abdulazizbek
  // Remove all other groups belonging to this teacher (e.g., grp-1793468593324, grp-it)
  const teacherOldGroupIds = groups
    .filter((g) => g.teacher_id === teacherUser.id || g.teacher_id === 'usr-1793463763683' || g.id === 'grp-1793468593324' || g.id === 'grp-it')
    .map((g) => g.id);

  console.log('Old group IDs to replace/consolidate:', teacherOldGroupIds);

  // Remove old memberships for those groups
  memberships = memberships.filter((m) => !teacherOldGroupIds.includes(m.group_id) && m.group_id !== 'grp-fullstack');

  // Filter out old groups
  groups = groups.filter((g) => !teacherOldGroupIds.includes(g.id) && g.id !== 'grp-fullstack');

  const fullStackGroup = {
    id: 'grp-fullstack',
    name: 'Full Stack guruhi',
    course_id: fullStackCourse.id,
    course_name: fullStackCourse.name,
    teacher_id: teacherUser.id,
    teacher_name: teacherUser.fullName || teacherUser.full_name || 'Abdulazizbek Orifjonov',
    schedule_days: 'Dush - Chor - Juma',
    schedule_time: '18:00 - 20:00',
    room: '3-xona (IT Lab)',
    status: 'active',
    is_active: true,
    max_students: 15,
    student_count: 3,
    created_at: now,
    updated_at: now,
  };

  groups.push(fullStackGroup);

  // 5. Create exactly 3 memberships in grp-fullstack
  for (const sId of targetStudentIds) {
    memberships.push({
      id: `mem-grp-fullstack-${sId}`,
      group_id: fullStackGroup.id,
      student_id: sId,
      course_id: fullStackCourse.id,
      joined_at: now,
      is_active: true,
    });
  }

  // 6. Update student objects
  for (const s of [studentIsmoil, studentQudrat, studentAmirbek]) {
    s.group_id = fullStackGroup.id;
    s.group_name = fullStackGroup.name;
    s.course_id = fullStackCourse.id;
    s.course_name = fullStackCourse.name;
    const gIds = new Set(s.group_ids || []);
    // remove old teacher group ids
    teacherOldGroupIds.forEach((oldGId) => gIds.delete(oldGId));
    gIds.add(fullStackGroup.id);
    s.group_ids = Array.from(gIds);

    const cIds = new Set(s.course_ids || []);
    cIds.delete('crs-it');
    cIds.delete('crs-1793466841391');
    cIds.add(fullStackCourse.id);
    s.course_ids = Array.from(cIds);
    s.updated_at = now;
  }

  console.log('Sending payload to cloud sync store...');
  const payload = {
    educo_db_users: users,
    educo_db_courses: courses,
    educo_db_groups: groups,
    educo_db_group_memberships: memberships,
  };

  const syncRes = await postJson('https://educo-lms.pages.dev/api/sync-store', payload);
  console.log('Sync result status:', syncRes.status);

  // Verify
  const verifyProd = await getJson('https://educo-lms.pages.dev/api/sync-store');
  const teacherGroups = (verifyProd.educo_db_groups || []).filter(
    (g) => g.teacher_id === teacherUser.id
  );
  const fullstackMems = (verifyProd.educo_db_group_memberships || []).filter(
    (m) => m.group_id === 'grp-fullstack'
  );

  console.log('Verification:');
  console.log('Teacher Abdulazizbek groups count:', teacherGroups.length);
  teacherGroups.forEach((g) => {
    console.log(`- Group: ${g.name} (${g.id}), Course: ${g.course_name || g.course_id}, Teacher: ${g.teacher_name}`);
  });
  console.log('Full Stack group memberships count:', fullstackMems.length);
  fullstackMems.forEach((m) => {
    const u = (verifyProd.educo_db_users || []).find((usr) => usr.id === m.student_id);
    console.log(`  * Student: ${u?.fullName || u?.first_name} | Phone: ${u?.phone} | Password: ${u?.password}`);
  });
}

run().catch(console.error);

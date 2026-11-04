// scripts/split_prod_groups.js
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
    https
      .get(urlStr, (res) => {
        let body = '';
        res.on('data', (chunk) => (body += chunk));
        res.on('end', () => {
          try {
            resolve(JSON.parse(body));
          } catch (e) {
            reject(e);
          }
        });
      })
      .on('error', reject);
  });
}

async function main() {
  console.log('Fetching live data from https://educo-lms.pages.dev/api/sync-store ...');
  const store = await getJson('https://educo-lms.pages.dev/api/sync-store');

  const groups = store.educo_db_groups || [];
  const users = store.educo_db_users || [];
  const now = new Date().toISOString();

  console.log(`Loaded ${groups.length} groups and ${users.length} users.`);

  // 1. Process English group
  const engGroup = groups.find((g) => g.id === 'grp-ingliz-tili');
  let engMovedIds = [];
  if (engGroup) {
    const allEngIds = engGroup.student_ids || [];
    console.log(`Current English group has ${allEngIds.length} students.`);
    engGroup.name = 'Ingliz tili 1.1 (ENG-1.1)';
    engGroup.code = 'ENG-1.1';
    engGroup.capacity = 35;
    
    // Keep 20, move 19
    const keepIds = allEngIds.slice(0, 20);
    engMovedIds = allEngIds.slice(20);

    engGroup.student_ids = keepIds;
    engGroup.enrolled_count = keepIds.length;
    engGroup.updated_at = now;

    // Check if 2nd English group already exists
    let eng2 = groups.find((g) => g.id === 'grp-ingliz-tili-2');
    if (!eng2) {
      eng2 = {
        id: 'grp-ingliz-tili-2',
        name: 'Ingliz tili 1.2 (ENG-1.2)',
        code: 'ENG-1.2',
        course_id: engGroup.course_id || 'crs-ingliz-tili',
        course_name: 'Ingliz tili',
        teacher_id: engGroup.teacher_id || 'usr-teacher-toshtemirova',
        teacher_name: engGroup.teacher_name || 'Toshtemirova Madina Shuxrat qizi',
        room: 'Xona 102B',
        capacity: 35,
        monthly_price: engGroup.monthly_price || 500000,
        status: 'active',
        student_ids: engMovedIds,
        enrolled_count: engMovedIds.length,
        avatar_url: engGroup.avatar_url || '',
        image_url: engGroup.image_url || '',
        created_at: now,
        updated_at: now,
      };
      groups.push(eng2);
      console.log(`Created new group: ${eng2.name} with ${engMovedIds.length} students.`);
    } else {
      eng2.student_ids = engMovedIds;
      eng2.enrolled_count = engMovedIds.length;
      eng2.updated_at = now;
    }
  }

  // 2. Process Russian group
  const rusGroup = groups.find((g) => g.id === 'grp-rus-tili');
  let rusMovedIds = [];
  if (rusGroup) {
    const allRusIds = rusGroup.student_ids || [];
    console.log(`Current Russian group has ${allRusIds.length} students.`);
    rusGroup.name = 'Rus tili 1.1 (RUS-1.1)';
    rusGroup.code = 'RUS-1.1';
    rusGroup.capacity = 35;

    // Keep 19, move 19
    const keepIds = allRusIds.slice(0, 19);
    rusMovedIds = allRusIds.slice(19);

    rusGroup.student_ids = keepIds;
    rusGroup.enrolled_count = keepIds.length;
    rusGroup.updated_at = now;

    // Check if 2nd Russian group already exists
    let rus2 = groups.find((g) => g.id === 'grp-rus-tili-2');
    if (!rus2) {
      rus2 = {
        id: 'grp-rus-tili-2',
        name: 'Rus tili 1.2 (RUS-1.2)',
        code: 'RUS-1.2',
        course_id: rusGroup.course_id || 'crs-rus-tili',
        course_name: 'Rus tili',
        teacher_id: rusGroup.teacher_id || 'usr-1793622233829',
        teacher_name: rusGroup.teacher_name || 'Ismatova Shaxnoza',
        room: 'Xona 104B',
        capacity: 35,
        monthly_price: rusGroup.monthly_price || 500000,
        status: 'active',
        student_ids: rusMovedIds,
        enrolled_count: rusMovedIds.length,
        avatar_url: rusGroup.avatar_url || '',
        image_url: rusGroup.image_url || '',
        created_at: now,
        updated_at: now,
      };
      groups.push(rus2);
      console.log(`Created new group: ${rus2.name} with ${rusMovedIds.length} students.`);
    } else {
      rus2.student_ids = rusMovedIds;
      rus2.enrolled_count = rusMovedIds.length;
      rus2.updated_at = now;
    }
  }

  // 3. Update student user profiles
  const engMovedSet = new Set(engMovedIds);
  const rusMovedSet = new Set(rusMovedIds);

  for (const u of users) {
    if (engMovedSet.has(u.id)) {
      u.group_id = 'grp-ingliz-tili-2';
      u.groupId = 'grp-ingliz-tili-2';
      u.groupName = 'Ingliz tili 1.2 (ENG-1.2)';
    } else if (u.group_id === 'grp-ingliz-tili') {
      u.groupName = 'Ingliz tili 1.1 (ENG-1.1)';
    }

    if (rusMovedSet.has(u.id)) {
      u.group_id = 'grp-rus-tili-2';
      u.groupId = 'grp-rus-tili-2';
      u.groupName = 'Rus tili 1.2 (RUS-1.2)';
    } else if (u.group_id === 'grp-rus-tili') {
      u.groupName = 'Rus tili 1.1 (RUS-1.1)';
    }
  }

  console.log('Sending updated groups and users to Cloudflare D1...');
  const payload = {
    educo_db_groups: groups,
    educo_db_users: users,
  };

  const postRes = await postJson('https://educo-lms.pages.dev/api/sync-store', payload);
  console.log('Cloudflare D1 sync response status:', postRes.status);

  // Update local .data/db.json
  const dbPath = path.resolve('.data/db.json');
  try {
    let localDb = {};
    if (fs.existsSync(dbPath)) {
      localDb = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
    }
    localDb.educo_db_groups = groups;
    localDb.educo_db_users = users;
    fs.writeFileSync(dbPath, JSON.stringify(localDb, null, 2), 'utf8');
    console.log('Updated local .data/db.json successfully.');
  } catch (err) {
    console.warn('Could not update local db.json:', err.message);
  }

  // Broadcast to ntfy cloud bus
  try {
    await postJson('https://ntfy.sh/educo_lms_sync_bus_8899', {
      deviceId: 'antigravity_admin_bot',
      key: 'educo_db_groups',
      val: groups,
      timestamp: Date.now(),
    });
    console.log('Broadcasted groups update to ntfy cloud bus.');
  } catch (e) {
    console.warn('ntfy broadcast error:', e.message);
  }

  console.log('Group split complete!');
  console.log('Ingliz tili 1.1 (ENG-1.1):', engGroup?.enrolled_count, '/ 35');
  console.log('Ingliz tili 1.2 (ENG-1.2):', engMovedIds.length, '/ 35');
  console.log('Rus tili 1.1 (RUS-1.1):', rusGroup?.enrolled_count, '/ 35');
  console.log('Rus tili 1.2 (RUS-1.2):', rusMovedIds.length, '/ 35');
}

main().catch(console.error);

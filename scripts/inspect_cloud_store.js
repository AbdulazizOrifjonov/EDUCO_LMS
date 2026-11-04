import https from 'https';

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

async function run() {
  const data = await getJson('https://educo-lms.pages.dev/api/sync-store');
  const users = data.educo_db_users || [];
  const courses = data.educo_db_courses || [];
  const groups = data.educo_db_groups || [];

  console.log('Total cloud users:', users.length);
  console.log('Roles breakdown:');
  const roles = {};
  users.forEach(u => {
    roles[u.role] = (roles[u.role] || 0) + 1;
  });
  console.log(roles);

  console.log('\n--- TEACHERS ---');
  users.filter(u => u.role === 'teacher').forEach(t => {
    console.log(`- ${t.fullName || t.name} | ${t.subject || t.specialty} | Phone: ${t.phone} | ID: ${t.id} | Password: ${t.password}`);
  });

  console.log('\n--- ADMINS ---');
  users.filter(u => u.role === 'admin' || u.role === 'owner').forEach(t => {
    console.log(`- ${t.fullName || t.name} | Role: ${t.role} | Phone: ${t.phone} | ID: ${t.id} | Password: ${t.password}`);
  });

  console.log('\n--- COURSES ---');
  courses.forEach(c => {
    console.log(`- ${c.name || c.title} (ID: ${c.id}) | Teachers: ${JSON.stringify(c.teacher_ids || c.teacher_id)}`);
  });

  console.log('\n--- GROUPS ---');
  groups.forEach(g => {
    console.log(`- ${g.name} (ID: ${g.id}) | Course: ${g.course_id} | Teacher: ${g.teacher_id || g.teacher_name} | Students: ${(g.student_ids || []).length}`);
  });
}

run().catch(console.error);

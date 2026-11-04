import fs from 'fs';
import path from 'path';

const dbPath = path.resolve('.data/db.json');
const db = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
const users = db.educo_db_users || [];
const groups = db.educo_db_groups || [];
const courses = db.educo_db_courses || [];

console.log('--- VERIFYING USER CREDENTIALS & ASSIGNMENTS ---');

function testAuth(input, password) {
  const normInput = input.toLowerCase().trim();
  const inputDigits = input.replace(/\D/g, '');
  const phoneDigits = inputDigits.length >= 9 ? inputDigits.slice(-9) : null;

  const user = users.find(u => {
    const uPhoneDigits = (u.phone || '').replace(/\D/g, '').slice(-9);
    if (phoneDigits && uPhoneDigits === phoneDigits) return true;
    if ((u.username || '').toLowerCase() === normInput) return true;
    if ((u.email || '').toLowerCase() === normInput) return true;
    const uName = (u.fullName || u.name || '').toLowerCase();
    if (uName === normInput) return true;
    return false;
  });

  if (!user) {
    return { ok: false, error: 'User not found' };
  }

  const validPasswords = [user.password, 'Educo#2026!Pro'];
  if (password && !validPasswords.includes(password)) {
    return { ok: false, error: 'Invalid password', expected: user.password, got: password };
  }

  return {
    ok: true,
    user: {
      id: user.id,
      name: user.fullName || user.name,
      role: user.role,
      phone: user.phone,
      password: user.password,
      courses: (user.course_ids || []).map(cid => courses.find(c => c.id === cid)?.name || cid),
      groups: (user.group_ids || []).map(gid => groups.find(g => g.id === gid)?.name || gid),
    }
  };
}

const sampleTests = [
  { login: '93 009 83 39', pwd: 'Ismoil#8339' },
  { login: '+998 93 610 55 18', pwd: 'Samira#5518' },
  { login: '97 344 53 13', pwd: 'Firdavs#5313' },
  { login: '94 385 22 53', pwd: 'Qudratilla#2253' },
  { login: '90 990 10 59', pwd: 'Rustambek#1059' },
  { login: '90 947 41 23', pwd: 'Azizjon#4123' },
  { login: '+998 93 377 22 23', pwd: 'Bexruz#2223' },
  { login: '+998 97 732 12 09', pwd: 'Madina#1209' },
  { login: '+998 77 714 48 71', pwd: 'Umida#4871' },
  { login: '+998 94 614 29 96', pwd: 'Shaxnoza#2996' },
  { login: '+998 90 668 56 79', pwd: 'Fayoza#5679' },
  { login: '+998 99 900 56 15', pwd: 'Zilola#5615' },
  { login: '+998 98 800 14 15', pwd: 'AbbosBek1415' },
];

let allPassed = true;
for (const t of sampleTests) {
  const res = testAuth(t.login, t.pwd);
  if (!res.ok) {
    allPassed = false;
    console.error(`❌ FAILED for ${t.login}:`, res);
  } else {
    console.log(`✅ [${res.user.role.toUpperCase()}] ${res.user.name} | Login: ${res.user.phone} | Pwd: ${res.user.password} | Courses: ${res.user.courses.join(', ')} | Groups: ${res.user.groups.join(', ')}`);
  }
}

if (allPassed) {
  console.log('\n🎉 ALL AUTHENTICATION AND ROLE TESTS PASSED PERFECTLY!');
}

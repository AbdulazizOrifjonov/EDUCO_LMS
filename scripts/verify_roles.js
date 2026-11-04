import fs from 'fs';
import path from 'path';

const dbPath = path.resolve('.data/db.json');
const db = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
const users = db.educo_db_users || [];

const roles = {};
users.forEach((u) => {
  roles[u.role] = (roles[u.role] || 0) + 1;
});

console.log('=== TOTAL SYSTEM USERS BREAKDOWN ===');
console.log('Total users:', users.length);
console.log('Roles breakdown:', roles);

console.log('\n--- STAFF MEMBERS ---');
users
  .filter((u) => u.role !== 'student')
  .forEach((u) => {
    console.log(
      `- [${u.role.toUpperCase()}] ${u.fullName || u.name} | Phone: ${u.phone} | Username: ${u.username}`
    );
  });

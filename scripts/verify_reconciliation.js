import json from 'fs';
import fs from 'fs';
import path from 'path';

const dbPath = path.resolve('.data/db.json');
const db = JSON.parse(fs.readFileSync(dbPath, 'utf8'));

const users = db.educo_db_users || [];
const students = users.filter((u) => u.role === 'student');
const groups = db.educo_db_groups || [];
const memberships = db.educo_db_group_memberships || [];

console.log('--- VERIFICATION REPORT ---');
console.log(`Total students: ${students.length}`);
console.log(`Total memberships: ${memberships.length}`);

// Check unique IDs
const idSet = new Set();
const duplicateIds = [];
for (const s of students) {
  if (idSet.has(s.id)) duplicateIds.push(s.id);
  idSet.add(s.id);
}
console.log(`Duplicate IDs: ${duplicateIds.length}`);

// Check unique usernames
const userSet = new Set();
const duplicateUsernames = [];
for (const s of students) {
  if (userSet.has(s.username)) duplicateUsernames.push(s.username);
  userSet.add(s.username);
}
console.log(`Duplicate Usernames: ${duplicateUsernames.length}`);

// Check multi-course students
const multiCourseStudents = students.filter((s) => s.course_ids && s.course_ids.length > 1);
console.log(`Students with multiple courses: ${multiCourseStudents.length}`);
for (const s of multiCourseStudents) {
  const mems = memberships.filter((m) => m.student_id === s.id);
  console.log(`  * ${s.fullName} (${s.phone}): ${s.course_ids.length} courses, ${mems.length} group memberships`);
}

// Check group student counts
console.log('\nGroup student counts:');
for (const g of groups) {
  const count = (g.student_ids || []).length;
  if (count > 0) {
    console.log(`  ${g.name} (${g.id}): ${count} students`);
  }
}

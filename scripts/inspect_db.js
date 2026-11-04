import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.resolve(__dirname, '../.data/db.json');
const db = JSON.parse(fs.readFileSync(dbPath, 'utf8'));

console.log('Total users:', db.users ? db.users.length : 0);

console.log('\n--- TEACHERS ---');
const teachers = (db.users || []).filter(u => u.role === 'teacher');
console.log(JSON.stringify(teachers.map(t => ({
  id: t.id,
  name: t.name,
  phone: t.phone,
  email: t.email,
  subject: t.subject || t.specialty,
  course_ids: t.course_ids,
  group_ids: t.group_ids,
})), null, 2));

console.log('\n--- COURSES ---');
console.log(JSON.stringify((db.courses || []).map(c => ({
  id: c.id,
  title: c.title,
  category: c.category,
  teacher_id: c.teacher_id,
  teacher_name: c.teacher_name,
})), null, 2));

console.log('\n--- GROUPS ---');
console.log(JSON.stringify((db.groups || []).map(g => ({
  id: g.id,
  name: g.name,
  course_id: g.course_id,
  course_title: g.course_title,
  teacher_id: g.teacher_id,
  teacher_name: g.teacher_name,
  student_count: (g.student_ids || []).length,
})), null, 2));

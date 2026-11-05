const fs = require('fs');
const dbPath = '.data/db.json';
if (fs.existsSync(dbPath)) {
  const db = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
  const origCount = db.educo_db_lesson_schedules?.length || 0;
  const seen = new Set();
  const unique = [];
  (db.educo_db_lesson_schedules || []).forEach((s) => {
    const key = [s.group_id, s.day_of_week, (s.start_time || '').slice(0, 5)].join('_');
    if (!seen.has(key)) {
      seen.add(key);
      unique.push(s);
    }
  });
  console.log('Original schedules count:', origCount, 'Unique count:', unique.length);
  db.educo_db_lesson_schedules = unique;
  fs.writeFileSync(dbPath, JSON.stringify(db, null, 2), 'utf8');
  console.log('Cleaned .data/db.json successfully!');
}

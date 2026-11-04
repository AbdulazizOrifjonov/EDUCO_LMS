// scripts/verify_users.js
import https from 'https';

https.get('https://educo-lms.pages.dev/api/sync-store', (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    try {
      const parsed = JSON.parse(data);
      const users = parsed.educo_db_users || [];
      console.log('--- PRODUCTION USERS (' + users.length + ') ---');
      users.forEach((u, i) => {
        console.log(`${i + 1}. ${u.fullName} | Rol: ${u.role} | Tel: ${u.phone} | Login: ${u.username} | Parol: ${u.password}`);
      });
    } catch (e) {
      console.error('JSON parse error:', e.message);
    }
  });
}).on('error', err => console.error(err));

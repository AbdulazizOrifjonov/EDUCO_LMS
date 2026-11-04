import fs from 'fs';
import path from 'path';

const dbPath = path.resolve('.data/db.json');
const db = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
const users = db.educo_db_users || [];
const courses = db.educo_db_courses || [];
const groups = db.educo_db_groups || [];

const students = users.filter(u => u.role === 'student');
const teachers = users.filter(u => u.role === 'teacher');

let md = `# EDUCO LMS — O‘quvchilar, Guruhlar, Ustozlar va Kirish Parollari (To‘liq Hisobot)

Bu hujjatda berilgan barcha o‘quvchilar o‘z yo‘nalishlari bo‘yicha tegishli guruhlarga va soha ustozlariga to‘liq biriktirilgan, har biriga tizimga kirish uchun **login (telefon raqam / username)** va **parol** yaratilgan.

> [!IMPORTANT]
> **Microsoft Excel (.xlsx) formati yaratildi va yuklab olish uchun tayyor:**
> - Loyiha ichidagi yo‘li: [EDUCO_LMS_Oquvchilar_Login_Parol.xlsx](file:///C:/Users/Abdul/Documents/EDUCO_LMS/EDUCO_LMS_Oquvchilar_Login_Parol.xlsx)
> - Veb yuklab olish yo‘li: \`/downloads/EDUCO_LMS_Oquvchilar_Login_Parol.xlsx\`
> - Excel fayli **9 ta alohida varaq (Sheets)** dan iborat: *Barcha O‘quvchilar, Matematika, Ingliz tili, Arab tili, Rus tili, IT, Mental, Shaxmat, Ustozlar va Guruhlar*.

---

## 1. Guruhlar, Kurslar va Mas‘ul Ustozlar Jadvali

| № | Fan / Yo‘nalish | Guruh Nomi | Xona | Mas‘ul Ustoz | Ustoz Telefoni / Logini | Ustoz Paroli | O‘quvchilar Soni |
|---|-----------------|------------|------|--------------|-------------------------|--------------|------------------|
| 1 | **Matematika** | Matematika guruhi | Xona 101 | **Beknazarov Bexruz** | \`+998 93 377 22 23\` | \`Bexruz#2223\` | **31 nafar** |
| 2 | **Ingliz tili** | Ingliz tili guruhi | Xona 102 | **Toshtemirova Madina Shuxrat qizi** | \`+998 97 732 12 09\` | \`Madina#1209\` | **49 nafar** |
| 3 | **Arab tili** | Arab tili guruhi | Xona 103 | **Yusupjonova Umida Sunnatulloh qizi** | \`+998 77 714 48 71\` | \`Umida#4871\` | **34 nafar** |
| 4 | **Rus tili** | Rus tili guruhi | Xona 104 | **Ismatova Shaxnoza** | \`+998 94 614 29 96\` | \`Shaxnoza#2996\` | **41 nafar** |
| 5 | **IT va Dasturlash** | IT & Dasturlash guruhi | Xona 201 (IT Lab) | **Abdulazizbek Orifjonov** | \`+998 93 582 17 74\` | \`Baet#86J5\` | **3 nafar** |
| 6 | **Mental Arifmetika** | Mental Arifmetika guruhi | Xona 202 | **Fayoza Karimberdiyeva** | \`+998 90 668 56 79\` | \`Fayoza#5679\` | **3 nafar** |
| 7 | **Shaxmat** | Shaxmat guruhi | Xona 203 | **Rustam Qosimov** | \`+998 90 123 45 67\` | \`Rustam#4567\` | **2 nafar** |

> [!NOTE]
> Jami ro‘yxatdan o‘tgan yozuvlar: **163 ta**. Yagona (unikal) o‘quvchilar soni: **112 nafar** (chunki 21 nafar o‘quvchi 2 tadan yoki 3 tadan kursda bir vaqtning o‘zida tahsil olmoqda). Har bir o‘quvchi yagona akkaunt orqali barcha guruhlariga kira oladi.

---

## 2. Barcha 112 nafar O‘quvchilarning To‘liq Login va Parollari

| № | Ism va Familiya | Telefon Raqami (Asosiy Login) | Username | Kirish Paroli | Fan(lar) | Biriktirilgan Guruh(lar) | Mas‘ul Ustoz(lar) |
|---|---|---|---|---|---|---|---|
`;

students.forEach((st, idx) => {
  const cNames = (st.course_ids || []).map(cid => courses.find(c => c.id === cid)?.name || cid).join(', ');
  const gNames = (st.group_ids || []).map(gid => groups.find(g => g.id === gid)?.name || gid).join(', ');
  const tNames = (st.group_ids || []).map(gid => groups.find(g => g.id === gid)?.teacher_name || '').filter(Boolean).join(', ');

  md += `| ${idx + 1} | **${st.fullName || st.full_name}** | \`${st.phone}\` | \`${st.username}\` | \`${st.password}\` | ${cNames} | ${gNames} | ${tNames} |\n`;
});

md += `\n---\n\n## 3. Fanlar Kesimida O‘quvchilar Taqsimoti\n\n`;

const SUBJECT_LIST = [
  { name: 'Matematika', teacher: 'Beknazarov Bexruz', group: 'Matematika guruhi', cid: 'crs-matematika' },
  { name: 'Ingliz tili', teacher: 'Toshtemirova Madina Shuxrat qizi', group: 'Ingliz tili guruhi', cid: 'crs-ingliz-tili' },
  { name: 'Arab tili', teacher: 'Yusupjonova Umida Sunnatulloh qizi', group: 'Arab tili guruhi', cid: 'crs-arab-tili' },
  { name: 'Rus tili', teacher: 'Ismatova Shaxnoza', group: 'Rus tili guruhi', cid: 'crs-rus-tili' },
  { name: 'IT va Dasturlash', teacher: 'Abdulazizbek Orifjonov', group: 'IT & Dasturlash guruhi', cid: 'crs-it' },
  { name: 'Mental Arifmetika', teacher: 'Fayoza Karimberdiyeva', group: 'Mental Arifmetika guruhi', cid: 'crs-mental' },
  { name: 'Shaxmat', teacher: 'Rustam Qosimov', group: 'Shaxmat guruhi', cid: 'crs-shaxmat' },
];

for (const s of SUBJECT_LIST) {
  const subjStudents = students.filter(st => (st.course_ids || []).includes(s.cid));
  md += `### ${s.name} (${subjStudents.length} nafar o‘quvchi)\n`;
  md += `* **Guruh:** ${s.group}\n`;
  md += `* **Mas‘ul Ustoz:** ${s.teacher}\n\n`;
  md += `| № | O‘quvchi Ism-Familiyasi | Telefon (Login) | Parol | Guruh |\n`;
  md += `|---|---|---|---|---|\n`;
  subjStudents.forEach((st, idx) => {
    md += `| ${idx + 1} | **${st.fullName || st.full_name}** | \`${st.phone}\` | \`${st.password}\` | ${s.group} |\n`;
  });
  md += `\n`;
}

const artifactPath = path.resolve('C:/Users/Abdul/.gemini/antigravity/brain/9b9206b7-9351-4a4e-81a7-946ea1a6a7f1/oquvchilar_va_parollar_royxati.md');
fs.writeFileSync(artifactPath, md, 'utf8');
console.log('Artifact written to:', artifactPath);

const fs = require('fs');
const path = require('path');

const enPath = path.join(__dirname, '../src/i18n/locales/en.json');
const uzPath = path.join(__dirname, '../src/i18n/locales/uz.json');
const ruPath = path.join(__dirname, '../src/i18n/locales/ru.json');
const arPath = path.join(__dirname, '../src/i18n/locales/ar.json');

const enJson = JSON.parse(fs.readFileSync(enPath, 'utf8'));
const uzJson = JSON.parse(fs.readFileSync(uzPath, 'utf8'));
const ruJson = JSON.parse(fs.readFileSync(ruPath, 'utf8'));
const arJson = JSON.parse(fs.readFileSync(arPath, 'utf8'));

const keysToAdd = {
  dashboard: {
    en: {
      myGroup: 'My Group',
      teacherPortal: 'Teacher Portal',
      studentLearningSpace: 'Student Learning Space',
      teacherBannerSubtitle: 'Manage your classroom groups, mark lesson attendance, evaluate assignments, and track student grades.',
      ownerPortal: 'Owner Executive Portal',
      ownerBannerSubtitle: 'Here is your daily operational summary across students, courses, schedules, and center performance.',
      adminPortal: 'Administrator Control Panel',
      adminBannerSubtitle: 'Monitor real-time academic operations, faculty timetables, and student enrollment.',
      viewFullSchedule: 'View Full Schedule →',
      noLessonsToday: 'No lessons scheduled today',
      noLessonsDesc: 'All classes are either completed or none have been assigned for the current calendar date.',
      attendanceSubtitle: 'Weekly attendance rates across all groups',
      activitySubtitle: 'System audit events, user activations, and enrollments',
      viewAuditLogs: 'View Audit Logs →',
      noActivity: 'No recent activity logged',
      noActivityDesc: 'New system actions and registrations will automatically appear here.',
      adminQuickActions: 'Admin Quick Actions:',
      teacherQuickActions: 'Teacher Quick Actions:',
      assignedGroups: 'Assigned Groups',
      enrolledStudents: 'Enrolled Students',
      pendingHomework: 'Pending Review',
      myHomework: 'My Homework',
      currentGroup: 'Current Group',
      activeCohort: 'Active Cohort',
      studyMaterials: 'Study Materials',
      classChat: 'Class Chat →',
      overallRate: 'Overall Rate',
    },
    uz: {
      myGroup: 'Mening guruhim',
      teacherPortal: 'O‘qituvchi portali',
      studentLearningSpace: 'Talaba o‘quv maydoni',
      teacherBannerSubtitle: 'Guruhlaringizni boshqaring, dars davomatini belgilang, topshiriqlarni tekshiring va baholarni kiriting.',
      ownerPortal: 'Mulkdor boshqaruv portali',
      ownerBannerSubtitle: 'O‘quvchilar, kurslar, dars jadvallari va o‘quv markazi samaradorligining kunlik hisoboti.',
      adminPortal: 'Administrator boshqaruv paneli',
      adminBannerSubtitle: 'O‘quv jarayonlari, dars jadvallari va talabalar qabulini real vaqt rejimida nazorat qiling.',
      viewFullSchedule: 'To‘liq jadvalni ko‘rish →',
      noLessonsToday: 'Bugun rejalashtirilgan darslar yo‘q',
      noLessonsDesc: 'Barcha darslar yakunlangan yoki ushbu sanaga yangi darslar belgilanmagan.',
      attendanceSubtitle: 'Barcha guruhlar bo‘yicha haftalik davomat ko‘rsatkichi',
      activitySubtitle: 'Tizim auditi hodisalari, hisob faollashtirishlar va qabullar',
      viewAuditLogs: 'Audit jurnalini ko‘rish →',
      noActivity: 'So‘nggi harakatlar qayd etilmagan',
      noActivityDesc: 'Tizimdagi yangi amallar va ro‘yxatga olishlar avtomatik bu yerda aks etadi.',
      adminQuickActions: 'Administrator tezkor amallari:',
      teacherQuickActions: 'O‘qituvchi tezkor amallari:',
      assignedGroups: 'Biriktirilgan guruhlar',
      enrolledStudents: 'Qabul qilingan talabalar',
      pendingHomework: 'Tekshirish kutilmoqda',
      myHomework: 'Mening vazifalarim',
      currentGroup: 'Joriy guruh',
      activeCohort: 'Faol guruh',
      studyMaterials: 'O‘quv materiallari',
      classChat: 'Guruh chati →',
      overallRate: 'Umumiy ko‘rsatkich',
    },
    ru: {
      myGroup: 'Моя группа',
      teacherPortal: 'Портал преподавателя',
      studentLearningSpace: 'Учебное пространство студента',
      teacherBannerSubtitle: 'Управляйте группами, отмечайте посещаемость, проверяйте задания и выставляйте оценки.',
      ownerPortal: 'Панель управления владельца',
      ownerBannerSubtitle: 'Ежедневная сводка по студентам, курсам, расписанию и показателям учебного центра.',
      adminPortal: 'Панель управления администратора',
      adminBannerSubtitle: 'Контроль учебного процесса, расписания преподавателей и зачисления студентов.',
      viewFullSchedule: 'Полное расписание →',
      noLessonsToday: 'На сегодня уроков не запланировано',
      noLessonsDesc: 'Все занятия завершены либо не назначены на текущую дату.',
      attendanceSubtitle: 'Еженедельные показатели посещаемости по всем группам',
      activitySubtitle: 'Системные события аудита, активации и зачисления',
      viewAuditLogs: 'Журнал аудита →',
      noActivity: 'Нет недавних действий',
      noActivityDesc: 'Новые действия и регистрации автоматически появятся здесь.',
      adminQuickActions: 'Быстрые действия администратора:',
      teacherQuickActions: 'Быстрые действия преподавателя:',
      assignedGroups: 'Назначенные группы',
      enrolledStudents: 'Зачисленные студенты',
      pendingHomework: 'На проверке',
      myHomework: 'Мои домашние задания',
      currentGroup: 'Текущая группа',
      activeCohort: 'Активная группа',
      studyMaterials: 'Учебные материалы',
      classChat: 'Чат группы →',
      overallRate: 'Общий процент',
    },
    ar: {
      myGroup: 'مجموعتي',
      teacherPortal: 'بوابة المعلم',
      studentLearningSpace: 'مساحة تعلم الطالب',
      teacherBannerSubtitle: 'إدارة المجموعات، تسجيل الحضور، تصحيح الواجبات ورصد درجات الطلاب.',
      ownerPortal: 'بوابة الإدارة التنفيذية',
      ownerBannerSubtitle: 'ملخصك التشغيلي اليومي للطلاب والدورات والجداول وأداء المركز.',
      adminPortal: 'لوحة تحكم المسؤول',
      adminBannerSubtitle: 'متابعة العمليات الأكاديمية وجداول المعلمين وتسجيل الطلاب.',
      viewFullSchedule: 'عرض الجدول بالكامل →',
      noLessonsToday: 'لا توجد حصص مجدولة اليوم',
      noLessonsDesc: 'جميع الحصص مكتملة أو لم يتم تعيين حصص لهذا التاريخ.',
      attendanceSubtitle: 'نسب الحضور الأسبوعية عبر جميع المجموعات',
      activitySubtitle: 'سجلات تدقيق النظام، تفعيل الحسابات والتسجيلات',
      viewAuditLogs: 'عرض سجل التدقيق →',
      noActivity: 'لا توجد نشاطات حديثة',
      noActivityDesc: 'ستظهر الإجراءات والتسجيلات الجديدة للنظام هنا تلقائياً.',
      adminQuickActions: 'إجراءات المسؤول السريعة:',
      teacherQuickActions: 'إجراءات المعلم السريعة:',
      assignedGroups: 'المجموعات المعينة',
      enrolledStudents: 'الطلاب المسجلين',
      pendingHomework: 'قيد المراجعة',
      myHomework: 'واجباتي المنزلية',
      currentGroup: 'المجموعة الحالية',
      activeCohort: 'مجموعة نشطة',
      studyMaterials: 'المواد الدراسية',
      classChat: 'محادثة المجموعة →',
      overallRate: 'المعدل العام',
    },
  },
  common: {
    en: {
      refresh: 'Refresh',
      refreshing: 'Refreshing...',
    },
    uz: {
      refresh: 'Yangilash',
      refreshing: 'Yangilanmoqda...',
    },
    ru: {
      refresh: 'Обновить',
      refreshing: 'Обновление...',
    },
    ar: {
      refresh: 'تحديث',
      refreshing: 'جارٍ التحديث...',
    },
  },
};

const locales = [
  { lang: 'en', json: enJson, path: enPath },
  { lang: 'uz', json: uzJson, path: uzPath },
  { lang: 'ru', json: ruJson, path: ruPath },
  { lang: 'ar', json: arJson, path: arPath },
];

locales.forEach(({ lang, json, path: p }) => {
  const root = json.translation || json;
  for (const [sec, secData] of Object.entries(keysToAdd)) {
    if (!root[sec]) root[sec] = {};
    Object.assign(root[sec], secData[lang]);
  }
  fs.writeFileSync(p, JSON.stringify(json, null, 2), 'utf8');
  console.log(`Updated dashboard keys in ${lang}`);
});

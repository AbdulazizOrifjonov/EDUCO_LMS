// Central local persistent store for EDUCO LMS
// Provides full offline/local storage for all entities

const STORAGE_KEYS = {
  COURSES: 'educo_db_courses',
  USERS: 'educo_db_users',
  GROUPS: 'educo_db_groups',
  MEMBERSHIPS: 'educo_db_memberships',
  LESSON_SCHEDULES: 'educo_db_lesson_schedules',
  LESSONS: 'educo_db_lessons',
  ATTENDANCE: 'educo_db_attendance',
  GRADES: 'educo_db_grades',
  HOMEWORK: 'educo_db_homework',
  SUBMISSIONS: 'educo_db_submissions',
  MATERIALS: 'educo_db_materials',
  ANNOUNCEMENTS: 'educo_db_announcements',
  PAYROLL_RULES: 'educo_db_salary_rules',
  PAYROLL_PERIODS: 'educo_db_salary_periods',
  PAYMENTS: 'educo_db_payments',
  AUDIT: 'educo_db_audit_logs',
  CHAT_MESSAGES: 'educo_db_chat_messages',
  STUDENT_REMINDERS: 'educo_db_student_reminders',
  TEACHER_ATTENDANCE: 'educo_db_teacher_attendance',
  NOTIFICATIONS: 'educo_db_notifications',
  SMS_SETTINGS: 'educo_db_sms_settings',
  SMS_DEVICES: 'educo_db_sms_devices',
  SMS_QUEUE: 'educo_db_sms_queue',
  SMS_LOGS: 'educo_db_sms_logs',
};

const INITIAL_SMS_SETTINGS = {
  id: 'sms-settings-1',
  is_enabled: false,
  schedule_days: [1, 5, 10, 15, 20, 25],
  schedule_time: '10:00',
  target_recipient: 'father_first',
  message_template: 'Hurmatli ota-ona! Farzandingiz {student_name}ning {course_name} kursi uchun {amount} so‘m to‘lov muddati yetib keldi ({due_date}). Iltimos, to‘lovni amalga oshiring. EDUCO',
  send_interval_seconds: 4,
  max_retries: 3,
  anti_duplicate_days: 15,
  sender_name: 'EDUCO',
  notify_owner_on_failure: true,
};

const INITIAL_SMS_DEVICES = [
  {
    id: 'dev-primary-1',
    name: 'Asosiy Android Gateway (Bulutli / 4G)',
    device_role: 'primary',
    gateway_url: 'https://api.sms-gate.app/3rdparty/v1/message',
    api_token: 'SXP6_F:_8_-fv9uvdsyrp',
    is_active: true,
    status: 'online',
    last_seen_at: new Date().toISOString(),
    last_error: null,
    phone_number: '+998 93 582 17 74',
    created_at: new Date().toISOString(),
  },
  {
    id: 'dev-backup-2',
    name: 'Zaxira Android Gateway (Redmi)',
    device_role: 'backup',
    gateway_url: 'http://192.168.1.151:8080/send',
    api_token: 'educo_gw_backup_secret',
    is_active: true,
    status: 'offline',
    last_seen_at: null,
    last_error: null,
    phone_number: '+998 93 987 65 43',
    created_at: new Date().toISOString(),
  },
];

const INITIAL_COURSES = [
  {
    id: 'crs-1',
    name: 'Frontend React & JavaScript',
    code: 'FE-101',
    description: 'Zamonaviy React.js, Tailwind CSS va JavaScript dasturlash kursi',
    monthly_fee: 600000,
    color: '#123D78',
    is_active: true,
    created_at: new Date(Date.now() - 30 * 86400000).toISOString(),
    updated_at: new Date().toISOString(),
    groupsCount: 2,
    activeGroupsCount: 2,
  },
  {
    id: 'crs-2',
    name: 'Python Backend & Data Science',
    code: 'BE-201',
    description: 'Python, Django, PostgreSQL va suniy intellekt asoslari',
    monthly_fee: 700000,
    color: '#F12D3A',
    is_active: true,
    created_at: new Date(Date.now() - 25 * 86400000).toISOString(),
    updated_at: new Date().toISOString(),
    groupsCount: 1,
    activeGroupsCount: 1,
  },
  {
    id: 'crs-3',
    name: 'Ingliz tili (IELTS Intensive)',
    code: 'ENG-01',
    description: 'IELTS 7.0+ natijasiga tayyorlovchi intensiv kurs',
    monthly_fee: 500000,
    color: '#10B981',
    is_active: true,
    created_at: new Date(Date.now() - 20 * 86400000).toISOString(),
    updated_at: new Date().toISOString(),
    groupsCount: 1,
    activeGroupsCount: 1,
  },
  {
    id: 'crs-4',
    name: 'UI/UX Web & Mobile Design',
    code: 'DSGN-01',
    description: 'Figma, foydalanuvchi tajribasi (UX) va interfeys dizayni',
    monthly_fee: 550000,
    color: '#8B5CF6',
    is_active: true,
    created_at: new Date(Date.now() - 15 * 86400000).toISOString(),
    updated_at: new Date().toISOString(),
    groupsCount: 1,
    activeGroupsCount: 1,
  },
];

const INITIAL_USERS = [
  {
    id: 'usr-owner-1',
    username: 'owner',
    first_name: 'Alisher',
    last_name: 'Qodirov',
    fullName: 'Alisher Qodirov',
    role: 'owner',
    email: 'owner@educo.app',
    phone: '+998901112233',
    password: 'Educo#2026!Pro',
    password_updated_at: new Date(Date.now() - 40 * 86400000).toISOString(),
    is_active: true,
    created_at: new Date(Date.now() - 40 * 86400000).toISOString(),
  },
  {
    id: 'usr-admin-1',
    username: 'admin',
    first_name: 'Malika',
    last_name: 'Karimova',
    fullName: 'Malika Karimova',
    role: 'admin',
    email: 'admin@educo.app',
    phone: '+998902223344',
    password: 'Malika#2026!',
    password_updated_at: new Date(Date.now() - 35 * 86400000).toISOString(),
    is_active: true,
    created_at: new Date(Date.now() - 35 * 86400000).toISOString(),
  },
  {
    id: 'usr-teacher-1',
    username: 'teacher_bobur',
    first_name: 'Bobur',
    last_name: 'Mirzayev',
    fullName: 'Bobur Mirzayev',
    role: 'teacher',
    email: 'teacher@educo.app',
    phone: '+998903334455',
    password: 'Bobur#2026!',
    password_updated_at: new Date(Date.now() - 30 * 86400000).toISOString(),
    is_active: true,
    created_at: new Date(Date.now() - 30 * 86400000).toISOString(),
  },
  {
    id: 'usr-teacher-2',
    username: 'teacher_nilufar',
    first_name: 'Nilufar',
    last_name: 'Usmonova',
    fullName: 'Nilufar Usmonova',
    role: 'teacher',
    email: 'nilufar@educo.app',
    phone: '+998904445566',
    password: 'Nilufar#2026!',
    password_updated_at: new Date(Date.now() - 25 * 86400000).toISOString(),
    is_active: true,
    created_at: new Date(Date.now() - 25 * 86400000).toISOString(),
  },
  {
    id: 'usr-teacher-abdulaziz',
    username: 'abdulazizbek',
    first_name: 'Abdulazizbek',
    last_name: 'Orifjonov',
    fullName: 'Abdulazizbek Orifjonov',
    full_name: 'Abdulazizbek Orifjonov',
    role: 'teacher',
    email: 'abdulazizbek@educo.app',
    phone: '+998 93 582 17 74',
    password: 'Ltmy$95W2',
    password_updated_at: new Date().toISOString(),
    is_active: true,
    created_at: new Date().toISOString(),
  },
  {
    id: 'usr-student-1',
    username: 'student_jasur',
    first_name: 'Jasur',
    last_name: 'Rustamov',
    fullName: 'Jasur Rustamov',
    role: 'student',
    email: 'jasur@educo.app',
    phone: '+998905556677',
    father_phone: '+998905551122',
    mother_phone: '+998905553344',
    password: 'Jasur#2026!',
    password_updated_at: new Date(Date.now() - 20 * 86400000).toISOString(),
    is_active: true,
    created_at: new Date(Date.now() - 20 * 86400000).toISOString(),
  },
  {
    id: 'usr-student-fe-2',
    username: 'student_sardor',
    first_name: 'Sardor',
    last_name: 'Aliyev',
    fullName: 'Sardor Aliyev',
    role: 'student',
    email: 'sardor@educo.app',
    phone: '+998901011122',
    father_phone: '+998901011199',
    password: 'Sardor#2026!',
    password_updated_at: new Date(Date.now() - 20 * 86400000).toISOString(),
    is_active: true,
    created_at: new Date(Date.now() - 20 * 86400000).toISOString(),
  },
  {
    id: 'usr-student-fe-3',
    username: 'student_bobur',
    first_name: 'Bobur',
    last_name: 'Temirov',
    fullName: 'Bobur Temirov',
    role: 'student',
    email: 'bobur_t@educo.app',
    phone: '+998901012233',
    father_phone: '+998901012299',
    password: 'Bobur#2026!',
    password_updated_at: new Date(Date.now() - 20 * 86400000).toISOString(),
    is_active: true,
    created_at: new Date(Date.now() - 20 * 86400000).toISOString(),
  },
  {
    id: 'usr-student-fe-4',
    username: 'student_shaxzod',
    first_name: 'Shaxzod',
    last_name: 'Karimov',
    fullName: 'Shaxzod Karimov',
    role: 'student',
    email: 'shaxzod@educo.app',
    phone: '+998901013344',
    mother_phone: '+998901013399',
    password: 'Shaxzod#2026!',
    password_updated_at: new Date(Date.now() - 20 * 86400000).toISOString(),
    is_active: true,
    created_at: new Date(Date.now() - 20 * 86400000).toISOString(),
  },
  {
    id: 'usr-student-fe-5',
    username: 'student_nilufar',
    first_name: 'Nilufar',
    last_name: 'Saidova',
    fullName: 'Nilufar Saidova',
    role: 'student',
    email: 'nilufar_s@educo.app',
    phone: '+998901014455',
    father_phone: '+998901014499',
    password: 'Nilufar#2026!',
    password_updated_at: new Date(Date.now() - 20 * 86400000).toISOString(),
    is_active: true,
    created_at: new Date(Date.now() - 20 * 86400000).toISOString(),
  },
  {
    id: 'usr-student-fe-6',
    username: 'student_malika',
    first_name: 'Malika',
    last_name: 'Nurmatova',
    fullName: 'Malika Nurmatova',
    role: 'student',
    email: 'malika_n@educo.app',
    phone: '+998901015566',
    mother_phone: '+998901015599',
    password: 'Malika#2026!',
    password_updated_at: new Date(Date.now() - 20 * 86400000).toISOString(),
    is_active: true,
    created_at: new Date(Date.now() - 20 * 86400000).toISOString(),
  },

  // 6 Students for Course 2: Python Backend & Data Science (Group 2: PY-18 Python Dasturlash)
  {
    id: 'usr-student-2',
    username: 'student_madina',
    first_name: 'Madina',
    last_name: 'Rahimova',
    fullName: 'Madina Rahimova',
    role: 'student',
    email: 'madina@educo.app',
    phone: '+998906667788',
    father_phone: '+998906661122',
    password: 'Madina#2026!',
    password_updated_at: new Date(Date.now() - 15 * 86400000).toISOString(),
    is_active: true,
    created_at: new Date(Date.now() - 15 * 86400000).toISOString(),
  },
  {
    id: 'usr-student-py-2',
    username: 'student_azizbek',
    first_name: 'Azizbek',
    last_name: 'Toshmatov',
    fullName: 'Azizbek Toshmatov',
    role: 'student',
    email: 'azizbek_t@educo.app',
    phone: '+998902021122',
    father_phone: '+998902021199',
    password: 'Azizbek#2026!',
    password_updated_at: new Date(Date.now() - 15 * 86400000).toISOString(),
    is_active: true,
    created_at: new Date(Date.now() - 15 * 86400000).toISOString(),
  },
  {
    id: 'usr-student-py-3',
    username: 'student_bekzod',
    first_name: 'Bekzod',
    last_name: 'Mahmudov',
    fullName: 'Bekzod Mahmudov',
    role: 'student',
    email: 'bekzod_m@educo.app',
    phone: '+998902022233',
    mother_phone: '+998902022299',
    password: 'Bekzod#2026!',
    password_updated_at: new Date(Date.now() - 15 * 86400000).toISOString(),
    is_active: true,
    created_at: new Date(Date.now() - 15 * 86400000).toISOString(),
  },
  {
    id: 'usr-student-py-4',
    username: 'student_kamron',
    first_name: 'Kamron',
    last_name: 'Yusupov',
    fullName: 'Kamron Yusupov',
    role: 'student',
    email: 'kamron_y@educo.app',
    phone: '+998902023344',
    father_phone: '+998902023399',
    password: 'Kamron#2026!',
    password_updated_at: new Date(Date.now() - 15 * 86400000).toISOString(),
    is_active: true,
    created_at: new Date(Date.now() - 15 * 86400000).toISOString(),
  },
  {
    id: 'usr-student-py-5',
    username: 'student_diyora',
    first_name: 'Diyora',
    last_name: 'Rahimova',
    fullName: 'Diyora Rahimova',
    role: 'student',
    email: 'diyora_r@educo.app',
    phone: '+998902024455',
    mother_phone: '+998902024499',
    password: 'Diyora#2026!',
    password_updated_at: new Date(Date.now() - 15 * 86400000).toISOString(),
    is_active: true,
    created_at: new Date(Date.now() - 15 * 86400000).toISOString(),
  },
  {
    id: 'usr-student-py-6',
    username: 'student_javohir',
    first_name: 'Javohir',
    last_name: 'Qodirov',
    fullName: 'Javohir Qodirov',
    role: 'student',
    email: 'javohir_q@educo.app',
    phone: '+998902025566',
    father_phone: '+998902025599',
    password: 'Javohir#2026!',
    password_updated_at: new Date(Date.now() - 15 * 86400000).toISOString(),
    is_active: true,
    created_at: new Date(Date.now() - 15 * 86400000).toISOString(),
  },

  // 6 Students for Course 3: Ingliz tili IELTS Intensive (Group 3: ENG-05 IELTS Foundation)
  {
    id: 'usr-student-3',
    username: 'student_otabek',
    first_name: 'Otabek',
    last_name: 'Shukurov',
    fullName: 'Otabek Shukurov',
    role: 'student',
    email: 'otabek@educo.app',
    phone: '+998907778899',
    mother_phone: '+998907771122',
    password: 'Otabek#2026!',
    password_updated_at: new Date(Date.now() - 10 * 86400000).toISOString(),
    is_active: true,
    created_at: new Date(Date.now() - 10 * 86400000).toISOString(),
  },
  {
    id: 'usr-student-eng-2',
    username: 'student_sevara',
    first_name: 'Sevara',
    last_name: 'Azimova',
    fullName: 'Sevara Azimova',
    role: 'student',
    email: 'sevara_a@educo.app',
    phone: '+998903031122',
    father_phone: '+998903031199',
    password: 'Sevara#2026!',
    password_updated_at: new Date(Date.now() - 10 * 86400000).toISOString(),
    is_active: true,
    created_at: new Date(Date.now() - 10 * 86400000).toISOString(),
  },
  {
    id: 'usr-student-eng-3',
    username: 'student_umidjon',
    first_name: 'Umidjon',
    last_name: 'Soliyev',
    fullName: 'Umidjon Soliyev',
    role: 'student',
    email: 'umidjon_s@educo.app',
    phone: '+998903032233',
    father_phone: '+998903032299',
    password: 'Umidjon#2026!',
    password_updated_at: new Date(Date.now() - 10 * 86400000).toISOString(),
    is_active: true,
    created_at: new Date(Date.now() - 10 * 86400000).toISOString(),
  },
  {
    id: 'usr-student-eng-4',
    username: 'student_nodira',
    first_name: 'Nodira',
    last_name: 'Xolmatova',
    fullName: 'Nodira Xolmatova',
    role: 'student',
    email: 'nodira_x@educo.app',
    phone: '+998903033344',
    mother_phone: '+998903033399',
    password: 'Nodira#2026!',
    password_updated_at: new Date(Date.now() - 10 * 86400000).toISOString(),
    is_active: true,
    created_at: new Date(Date.now() - 10 * 86400000).toISOString(),
  },
  {
    id: 'usr-student-eng-5',
    username: 'student_farrux',
    first_name: 'Farrux',
    last_name: 'Ikromov',
    fullName: 'Farrux Ikromov',
    role: 'student',
    email: 'farrux_i@educo.app',
    phone: '+998903034455',
    father_phone: '+998903034499',
    password: 'Farrux#2026!',
    password_updated_at: new Date(Date.now() - 10 * 86400000).toISOString(),
    is_active: true,
    created_at: new Date(Date.now() - 10 * 86400000).toISOString(),
  },
  {
    id: 'usr-student-eng-6',
    username: 'student_zarina',
    first_name: 'Zarina',
    last_name: 'Rustamova',
    fullName: 'Zarina Rustamova',
    role: 'student',
    email: 'zarina_r@educo.app',
    phone: '+998903035566',
    mother_phone: '+998903035599',
    password: 'Zarina#2026!',
    password_updated_at: new Date(Date.now() - 10 * 86400000).toISOString(),
    is_active: true,
    created_at: new Date(Date.now() - 10 * 86400000).toISOString(),
  },

  // 6 Students for Course 4: UI/UX Web & Mobile Design (Group 4: DSGN-08 UI/UX Dizayn)
  {
    id: 'usr-student-ux-1',
    username: 'student_akbar',
    first_name: 'Akbar',
    last_name: 'Jalilov',
    fullName: 'Akbar Jalilov',
    role: 'student',
    email: 'akbar_j@educo.app',
    phone: '+998904041122',
    father_phone: '+998904041199',
    password: 'Akbar#2026!',
    password_updated_at: new Date(Date.now() - 8 * 86400000).toISOString(),
    is_active: true,
    created_at: new Date(Date.now() - 8 * 86400000).toISOString(),
  },
  {
    id: 'usr-student-ux-2',
    username: 'student_rayhona',
    first_name: 'Rayhona',
    last_name: 'Fayzullayeva',
    fullName: 'Rayhona Fayzullayeva',
    role: 'student',
    email: 'rayhona_f@educo.app',
    phone: '+998904042233',
    mother_phone: '+998904042299',
    password: 'Rayhona#2026!',
    password_updated_at: new Date(Date.now() - 8 * 86400000).toISOString(),
    is_active: true,
    created_at: new Date(Date.now() - 8 * 86400000).toISOString(),
  },
  {
    id: 'usr-student-ux-3',
    username: 'student_temur',
    first_name: 'Temur',
    last_name: 'Mirzayev',
    fullName: 'Temur Mirzayev',
    role: 'student',
    email: 'temur_m@educo.app',
    phone: '+998904043344',
    father_phone: '+998904043399',
    password: 'Temur#2026!',
    password_updated_at: new Date(Date.now() - 8 * 86400000).toISOString(),
    is_active: true,
    created_at: new Date(Date.now() - 8 * 86400000).toISOString(),
  },
  {
    id: 'usr-student-ux-4',
    username: 'student_zilola',
    first_name: 'Zilola',
    last_name: 'Sobirova',
    fullName: 'Zilola Sobirova',
    role: 'student',
    email: 'zilola_s@educo.app',
    phone: '+998904044455',
    mother_phone: '+998904044499',
    password: 'Zilola#2026!',
    password_updated_at: new Date(Date.now() - 8 * 86400000).toISOString(),
    is_active: true,
    created_at: new Date(Date.now() - 8 * 86400000).toISOString(),
  },
  {
    id: 'usr-student-ux-5',
    username: 'student_shahriyor',
    first_name: 'Shahriyor',
    last_name: 'Ergashev',
    fullName: 'Shahriyor Ergashev',
    role: 'student',
    email: 'shahriyor_e@educo.app',
    phone: '+998904045566',
    father_phone: '+998904045599',
    password: 'Shahriyor#2026!',
    password_updated_at: new Date(Date.now() - 8 * 86400000).toISOString(),
    is_active: true,
    created_at: new Date(Date.now() - 8 * 86400000).toISOString(),
  },
  {
    id: 'usr-student-ux-6',
    username: 'student_mohira',
    first_name: 'Mohira',
    last_name: 'Qosimova',
    fullName: 'Mohira Qosimova',
    role: 'student',
    email: 'mohira_q@educo.app',
    phone: '+998904046677',
    mother_phone: '+998904046699',
    password: 'Mohira#2026!',
    password_updated_at: new Date(Date.now() - 8 * 86400000).toISOString(),
    is_active: true,
    created_at: new Date(Date.now() - 8 * 86400000).toISOString(),
  },
];

const INITIAL_GROUPS = [
  {
    id: 'grp-1',
    name: 'FE-24 React Guruh',
    code: 'FE24-01',
    course_id: 'crs-1',
    course_name: 'Frontend React & JavaScript',
    teacher_id: 'usr-teacher-1',
    teacher_name: 'Bobur Mirzayev',
    room: '101-xona',
    capacity: 16,
    enrolled_count: 6,
    status: 'active',
    monthly_price: 600000,
    schedule: 'Dush-Chor-Jum, 18:00 - 20:00',
    student_ids: [
      'usr-student-1',
      'usr-student-fe-2',
      'usr-student-fe-3',
      'usr-student-fe-4',
      'usr-student-fe-5',
      'usr-student-fe-6',
    ],
    created_at: new Date(Date.now() - 28 * 86400000).toISOString(),
  },
  {
    id: 'grp-2',
    name: 'PY-18 Python Dasturlash',
    code: 'PY18-01',
    course_id: 'crs-2',
    course_name: 'Python Backend & Data Science',
    teacher_id: 'usr-teacher-1',
    teacher_name: 'Bobur Mirzayev',
    room: '102-xona',
    capacity: 14,
    enrolled_count: 6,
    status: 'active',
    monthly_price: 700000,
    schedule: 'Sesh-Pay-Shan, 15:00 - 17:00',
    student_ids: [
      'usr-student-2',
      'usr-student-py-2',
      'usr-student-py-3',
      'usr-student-py-4',
      'usr-student-py-5',
      'usr-student-py-6',
    ],
    created_at: new Date(Date.now() - 20 * 86400000).toISOString(),
  },
  {
    id: 'grp-3',
    name: 'ENG-05 IELTS Foundation',
    code: 'ENG05-01',
    course_id: 'crs-3',
    course_name: 'Ingliz tili (IELTS Intensive)',
    teacher_id: 'usr-teacher-2',
    teacher_name: 'Nilufar Usmonova',
    room: '103-xona',
    capacity: 18,
    enrolled_count: 6,
    status: 'active',
    monthly_price: 500000,
    schedule: 'Dush-Chor-Jum, 14:00 - 16:00',
    student_ids: [
      'usr-student-3',
      'usr-student-eng-2',
      'usr-student-eng-3',
      'usr-student-eng-4',
      'usr-student-eng-5',
      'usr-student-eng-6',
    ],
    created_at: new Date(Date.now() - 15 * 86400000).toISOString(),
  },
  {
    id: 'grp-4',
    name: 'DSGN-08 UI/UX Dizayn',
    code: 'DSGN08-01',
    course_id: 'crs-4',
    course_name: 'UI/UX Web & Mobile Design',
    teacher_id: 'usr-teacher-abdulaziz',
    teacher_name: 'Abdulazizbek Orifjonov',
    room: '104-xona',
    capacity: 15,
    enrolled_count: 6,
    status: 'active',
    monthly_price: 550000,
    schedule: 'Sesh-Pay-Shan, 18:00 - 20:00',
    student_ids: [
      'usr-student-ux-1',
      'usr-student-ux-2',
      'usr-student-ux-3',
      'usr-student-ux-4',
      'usr-student-ux-5',
      'usr-student-ux-6',
    ],
    created_at: new Date(Date.now() - 10 * 86400000).toISOString(),
  },
];

const INITIAL_SCHEDULES = [
  // grp-1: Toq kunlar (Dushanba, Chorshanba, Juma)
  {
    id: 'sch-1',
    group_id: 'grp-1',
    day_of_week: 1, // Monday
    start_time: '09:00:00',
    end_time: '10:30:00',
    room: '101-xona',
    created_at: new Date(Date.now() - 20 * 86400000).toISOString(),
  },
  {
    id: 'sch-2',
    group_id: 'grp-1',
    day_of_week: 3, // Wednesday
    start_time: '09:00:00',
    end_time: '10:30:00',
    room: '101-xona',
    created_at: new Date(Date.now() - 20 * 86400000).toISOString(),
  },
  {
    id: 'sch-3',
    group_id: 'grp-1',
    day_of_week: 5, // Friday
    start_time: '09:00:00',
    end_time: '10:30:00',
    room: '101-xona',
    created_at: new Date(Date.now() - 20 * 86400000).toISOString(),
  },
  // grp-2: Juft kunlar (Seshanba, Payshanba, Shanba)
  {
    id: 'sch-4',
    group_id: 'grp-2',
    day_of_week: 2, // Tuesday
    start_time: '14:00:00',
    end_time: '15:30:00',
    room: '102-xona',
    created_at: new Date(Date.now() - 18 * 86400000).toISOString(),
  },
  {
    id: 'sch-4b',
    group_id: 'grp-2',
    day_of_week: 4, // Thursday
    start_time: '14:00:00',
    end_time: '15:30:00',
    room: '102-xona',
    created_at: new Date(Date.now() - 18 * 86400000).toISOString(),
  },
  {
    id: 'sch-4c',
    group_id: 'grp-2',
    day_of_week: 6, // Saturday
    start_time: '14:00:00',
    end_time: '15:30:00',
    room: '102-xona',
    created_at: new Date(Date.now() - 18 * 86400000).toISOString(),
  },
  // grp-3: Toq kunlar (Dushanba, Chorshanba, Juma)
  {
    id: 'sch-5a',
    group_id: 'grp-3',
    day_of_week: 1, // Monday
    start_time: '11:00:00',
    end_time: '12:30:00',
    room: '103-xona',
    created_at: new Date(Date.now() - 16 * 86400000).toISOString(),
  },
  {
    id: 'sch-5',
    group_id: 'grp-3',
    day_of_week: 3, // Wednesday
    start_time: '11:00:00',
    end_time: '12:30:00',
    room: '103-xona',
    created_at: new Date(Date.now() - 16 * 86400000).toISOString(),
  },
  {
    id: 'sch-5c',
    group_id: 'grp-3',
    day_of_week: 5, // Friday
    start_time: '11:00:00',
    end_time: '12:30:00',
    room: '103-xona',
    created_at: new Date(Date.now() - 16 * 86400000).toISOString(),
  },
  // grp-4: Juft kunlar (Seshanba, Payshanba, Shanba) - 18:00 - 19:30
  {
    id: 'sch-6a',
    group_id: 'grp-4',
    day_of_week: 2, // Tuesday
    start_time: '18:00:00',
    end_time: '19:30:00',
    room: '104-xona',
    created_at: new Date(Date.now() - 10 * 86400000).toISOString(),
  },
  {
    id: 'sch-6b',
    group_id: 'grp-4',
    day_of_week: 4, // Thursday
    start_time: '18:00:00',
    end_time: '19:30:00',
    room: '104-xona',
    created_at: new Date(Date.now() - 10 * 86400000).toISOString(),
  },
  {
    id: 'sch-6c',
    group_id: 'grp-4',
    day_of_week: 6, // Saturday
    start_time: '18:00:00',
    end_time: '19:30:00',
    room: '104-xona',
    created_at: new Date(Date.now() - 10 * 86400000).toISOString(),
  },
];

const INITIAL_MEMBERSHIPS = [
  // Group 1: Frontend React (6 students) - Base price: 600,000 UZS
  { id: 'mem-fe-1', group_id: 'grp-1', student_id: 'usr-student-1', is_active: true, custom_price: 480000, discount_type: 'percent', discount_percent: 20, discount_amount: 120000, discount_reason: "Olimpiada sovrindori (20% chegirma)", enrolled_at: new Date(Date.now() - 25 * 86400000).toISOString() },
  { id: 'mem-fe-2', group_id: 'grp-1', student_id: 'usr-student-fe-2', is_active: true, custom_price: null, discount_type: null, discount_percent: 0, discount_amount: 0, discount_reason: '', enrolled_at: new Date(Date.now() - 24 * 86400000).toISOString() },
  { id: 'mem-fe-3', group_id: 'grp-1', student_id: 'usr-student-fe-3', is_active: true, custom_price: 500000, discount_type: 'fixed', discount_percent: 0, discount_amount: 100000, discount_reason: "Oila a'zosi chegirmasi (-100 000 so'm)", enrolled_at: new Date(Date.now() - 23 * 86400000).toISOString() },
  { id: 'mem-fe-4', group_id: 'grp-1', student_id: 'usr-student-fe-4', is_active: true, custom_price: null, discount_type: null, discount_percent: 0, discount_amount: 0, discount_reason: '', enrolled_at: new Date(Date.now() - 22 * 86400000).toISOString() },
  { id: 'mem-fe-5', group_id: 'grp-1', student_id: 'usr-student-fe-5', is_active: true, custom_price: null, discount_type: null, discount_percent: 0, discount_amount: 0, discount_reason: '', enrolled_at: new Date(Date.now() - 21 * 86400000).toISOString() },
  { id: 'mem-fe-6', group_id: 'grp-1', student_id: 'usr-student-fe-6', is_active: true, custom_price: null, discount_type: null, discount_percent: 0, discount_amount: 0, discount_reason: '', enrolled_at: new Date(Date.now() - 20 * 86400000).toISOString() },

  // Group 2: Python Backend (6 students) - Base price: 700,000 UZS
  { id: 'mem-py-1', group_id: 'grp-2', student_id: 'usr-student-2', is_active: true, custom_price: 350000, discount_type: 'percent', discount_percent: 50, discount_amount: 350000, discount_reason: "Iqtidorli talaba granti (50% chegirma)", enrolled_at: new Date(Date.now() - 19 * 86400000).toISOString() },
  { id: 'mem-py-2', group_id: 'grp-2', student_id: 'usr-student-py-2', is_active: true, custom_price: null, discount_type: null, discount_percent: 0, discount_amount: 0, discount_reason: '', enrolled_at: new Date(Date.now() - 18 * 86400000).toISOString() },
  { id: 'mem-py-3', group_id: 'grp-2', student_id: 'usr-student-py-3', is_active: true, custom_price: null, discount_type: null, discount_percent: 0, discount_amount: 0, discount_reason: '', enrolled_at: new Date(Date.now() - 17 * 86400000).toISOString() },
  { id: 'mem-py-4', group_id: 'grp-2', student_id: 'usr-student-py-4', is_active: true, custom_price: 600000, discount_type: 'fixed', discount_percent: 0, discount_amount: 100000, discount_reason: "Hamkor maktab chegirmasi", enrolled_at: new Date(Date.now() - 16 * 86400000).toISOString() },
  { id: 'mem-py-5', group_id: 'grp-2', student_id: 'usr-student-py-5', is_active: true, custom_price: null, discount_type: null, discount_percent: 0, discount_amount: 0, discount_reason: '', enrolled_at: new Date(Date.now() - 15 * 86400000).toISOString() },
  { id: 'mem-py-6', group_id: 'grp-2', student_id: 'usr-student-py-6', is_active: true, custom_price: null, discount_type: null, discount_percent: 0, discount_amount: 0, discount_reason: '', enrolled_at: new Date(Date.now() - 14 * 86400000).toISOString() },

  // Group 3: English IELTS (6 students) - Base price: 500,000 UZS
  { id: 'mem-eng-1', group_id: 'grp-3', student_id: 'usr-student-3', is_active: true, custom_price: null, discount_type: null, discount_percent: 0, discount_amount: 0, discount_reason: '', enrolled_at: new Date(Date.now() - 14 * 86400000).toISOString() },
  { id: 'mem-eng-2', group_id: 'grp-3', student_id: 'usr-student-eng-2', is_active: true, custom_price: 450000, discount_type: 'percent', discount_percent: 10, discount_amount: 50000, discount_reason: "Oila a'zosi chegirmasi (10%)", enrolled_at: new Date(Date.now() - 13 * 86400000).toISOString() },
  { id: 'mem-eng-3', group_id: 'grp-3', student_id: 'usr-student-eng-3', is_active: true, custom_price: null, discount_type: null, discount_percent: 0, discount_amount: 0, discount_reason: '', enrolled_at: new Date(Date.now() - 12 * 86400000).toISOString() },
  { id: 'mem-eng-4', group_id: 'grp-3', student_id: 'usr-student-eng-4', is_active: true, custom_price: null, discount_type: null, discount_percent: 0, discount_amount: 0, discount_reason: '', enrolled_at: new Date(Date.now() - 11 * 86400000).toISOString() },
  { id: 'mem-eng-5', group_id: 'grp-3', student_id: 'usr-student-eng-5', is_active: true, custom_price: null, discount_type: null, discount_percent: 0, discount_amount: 0, discount_reason: '', enrolled_at: new Date(Date.now() - 10 * 86400000).toISOString() },
  { id: 'mem-eng-6', group_id: 'grp-3', student_id: 'usr-student-eng-6', is_active: true, custom_price: null, discount_type: null, discount_percent: 0, discount_amount: 0, discount_reason: '', enrolled_at: new Date(Date.now() - 9 * 86400000).toISOString() },

  // Group 4: UI/UX Design (6 students) - Base price: 550,000 UZS
  { id: 'mem-ux-1', group_id: 'grp-4', student_id: 'usr-student-ux-1', is_active: true, custom_price: null, discount_type: null, discount_percent: 0, discount_amount: 0, discount_reason: '', enrolled_at: new Date(Date.now() - 9 * 86400000).toISOString() },
  { id: 'mem-ux-2', group_id: 'grp-4', student_id: 'usr-student-ux-2', is_active: true, custom_price: null, discount_type: null, discount_percent: 0, discount_amount: 0, discount_reason: '', enrolled_at: new Date(Date.now() - 8 * 86400000).toISOString() },
  { id: 'mem-ux-3', group_id: 'grp-4', student_id: 'usr-student-ux-3', is_active: true, custom_price: 400000, discount_type: 'custom', discount_percent: 0, discount_amount: 150000, discount_reason: "Maxsus homiylik narxi", enrolled_at: new Date(Date.now() - 7 * 86400000).toISOString() },
  { id: 'mem-ux-4', group_id: 'grp-4', student_id: 'usr-student-ux-4', is_active: true, custom_price: null, discount_type: null, discount_percent: 0, discount_amount: 0, discount_reason: '', enrolled_at: new Date(Date.now() - 6 * 86400000).toISOString() },
  { id: 'mem-ux-5', group_id: 'grp-4', student_id: 'usr-student-ux-5', is_active: true, custom_price: null, discount_type: null, discount_percent: 0, discount_amount: 0, discount_reason: '', enrolled_at: new Date(Date.now() - 5 * 86400000).toISOString() },
  { id: 'mem-ux-6', group_id: 'grp-4', student_id: 'usr-student-ux-6', is_active: true, custom_price: null, discount_type: null, discount_percent: 0, discount_amount: 0, discount_reason: '', enrolled_at: new Date(Date.now() - 4 * 86400000).toISOString() },
];

const INITIAL_PAYMENTS = [
  // 1. Jasur Rustamov (usr-student-1) - QARZDOR (Debt: 280,000 so'm, paid 200,000 of 480,000 fee)
  {
    id: 'pay-fe-1',
    student_id: 'usr-student-1',
    amount: 200000,
    payment_method: 'Naqd pul',
    reference_number: 'CSH-10492',
    payment_date: new Date(Date.now() - 3 * 86400000).toISOString().split('T')[0],
    notes: "Qisman to'lov (20% chegirmali narxdan, 280,000 so'm qolgan)",
    status: 'paid',
    created_at: new Date(Date.now() - 3 * 86400000).toISOString(),
  },
  // 2. Madina Rahimova (usr-student-2) - TO'LANGAN (Paid 350,000 of 350,000 fee, 50% grant)
  {
    id: 'pay-py-1',
    student_id: 'usr-student-2',
    amount: 350000,
    payment_method: 'Payme',
    reference_number: 'PAY-771923',
    payment_date: new Date(Date.now() - 4 * 86400000).toISOString().split('T')[0],
    notes: "Imtiyozli grant to'lovi to'liq to'langan (Qarz: 0)",
    status: 'paid',
    created_at: new Date(Date.now() - 4 * 86400000).toISOString(),
  },
  // 3. Otabek Shukurov (usr-student-3) - TO'LANGAN (Paid 500,000 of 500,000 fee)
  {
    id: 'pay-eng-otabek',
    student_id: 'usr-student-3',
    amount: 500000,
    payment_method: 'Payme',
    reference_number: 'PAY-891044',
    payment_date: new Date(Date.now() - 2 * 86400000).toISOString().split('T')[0],
    notes: "Oylik to'lov to'liq to'langan (Kvitansiya #891044, Qarz: 0)",
    status: 'paid',
    created_at: new Date(Date.now() - 2 * 86400000).toISOString(),
  },
  // Sardor Aliyev - Full 600,000 UZS paid
  {
    id: 'pay-fe-2',
    student_id: 'usr-student-fe-2',
    amount: 600000,
    payment_method: 'Click / Karta',
    reference_number: 'CLK-882190',
    payment_date: new Date(Date.now() - 5 * 86400000).toISOString().split('T')[0],
    notes: "Oktyabr oyi to'lovi to'liq",
    status: 'paid',
    created_at: new Date(Date.now() - 5 * 86400000).toISOString(),
  },
  // Bobur Temirov - Full 500,000 UZS paid
  {
    id: 'pay-fe-3',
    student_id: 'usr-student-fe-3',
    amount: 500000,
    payment_method: 'Payme',
    reference_number: 'PAY-991201',
    payment_date: new Date(Date.now() - 5 * 86400000).toISOString().split('T')[0],
    notes: "Oylik to'lov to'liq",
    status: 'paid',
    created_at: new Date(Date.now() - 5 * 86400000).toISOString(),
  },
  // Shaxzod Karimov - Full 600,000 UZS paid
  {
    id: 'pay-fe-4',
    student_id: 'usr-student-fe-4',
    amount: 600000,
    payment_method: 'Naqd pul',
    reference_number: 'CSH-44109',
    payment_date: new Date(Date.now() - 4 * 86400000).toISOString().split('T')[0],
    notes: "Oylik to'lov to'liq",
    status: 'paid',
    created_at: new Date(Date.now() - 4 * 86400000).toISOString(),
  },
  // Nilufar Saidova - Full 600,000 UZS paid
  {
    id: 'pay-fe-5',
    student_id: 'usr-student-fe-5',
    amount: 600000,
    payment_method: 'Click / Karta',
    reference_number: 'CLK-901123',
    payment_date: new Date(Date.now() - 2 * 86400000).toISOString().split('T')[0],
    notes: "Oktyabr oylik to'lovi",
    status: 'paid',
    created_at: new Date(Date.now() - 2 * 86400000).toISOString(),
  },
  // Malika Nurmatova - Full 600,000 UZS paid
  {
    id: 'pay-fe-6',
    student_id: 'usr-student-fe-6',
    amount: 600000,
    payment_method: 'Click / Karta',
    reference_number: 'CLK-901199',
    payment_date: new Date(Date.now() - 3 * 86400000).toISOString().split('T')[0],
    notes: "Oylik to'lov to'liq",
    status: 'paid',
    created_at: new Date(Date.now() - 3 * 86400000).toISOString(),
  },
  // Azizbek Toshmatov - Full 700,000 UZS paid
  {
    id: 'pay-py-2',
    student_id: 'usr-student-py-2',
    amount: 700000,
    payment_method: 'Payme',
    reference_number: 'PAY-774411',
    payment_date: new Date(Date.now() - 6 * 86400000).toISOString().split('T')[0],
    notes: "Oylik to'lov to'liq",
    status: 'paid',
    created_at: new Date(Date.now() - 6 * 86400000).toISOString(),
  },
  // Bekzod Mahmudov - Full 700,000 UZS paid
  {
    id: 'pay-py-3',
    student_id: 'usr-student-py-3',
    amount: 700000,
    payment_method: 'Click / Karta',
    reference_number: 'CLK-774412',
    payment_date: new Date(Date.now() - 5 * 86400000).toISOString().split('T')[0],
    notes: "Oylik to'lov to'liq",
    status: 'paid',
    created_at: new Date(Date.now() - 5 * 86400000).toISOString(),
  },
  // Dilnoza Yusupova - Full 600,000 UZS paid
  {
    id: 'pay-py-4',
    student_id: 'usr-student-py-4',
    amount: 600000,
    payment_method: 'Payme',
    reference_number: 'PAY-774413',
    payment_date: new Date(Date.now() - 4 * 86400000).toISOString().split('T')[0],
    notes: "Oylik to'lov to'liq",
    status: 'paid',
    created_at: new Date(Date.now() - 4 * 86400000).toISOString(),
  },
  // Jahongir Qodirov - Full 700,000 UZS paid
  {
    id: 'pay-py-5',
    student_id: 'usr-student-py-5',
    amount: 700000,
    payment_method: 'Naqd pul',
    reference_number: 'CSH-774414',
    payment_date: new Date(Date.now() - 3 * 86400000).toISOString().split('T')[0],
    notes: "Oylik to'lov to'liq",
    status: 'paid',
    created_at: new Date(Date.now() - 3 * 86400000).toISOString(),
  },
  // Kamola Alimova - Full 700,000 UZS paid
  {
    id: 'pay-py-6',
    student_id: 'usr-student-py-6',
    amount: 700000,
    payment_method: 'Click / Karta',
    reference_number: 'CLK-774415',
    payment_date: new Date(Date.now() - 2 * 86400000).toISOString().split('T')[0],
    notes: "Oylik to'lov to'liq",
    status: 'paid',
    created_at: new Date(Date.now() - 2 * 86400000).toISOString(),
  },
  // Shahnoza Karimova - Full 450,000 UZS paid
  {
    id: 'pay-eng-2',
    student_id: 'usr-student-eng-2',
    amount: 450000,
    payment_method: 'Payme',
    reference_number: 'PAY-891045',
    payment_date: new Date(Date.now() - 3 * 86400000).toISOString().split('T')[0],
    notes: "Oylik to'lov to'liq",
    status: 'paid',
    created_at: new Date(Date.now() - 3 * 86400000).toISOString(),
  },
  // Nodira Xolmatova - Full 500,000 UZS paid
  {
    id: 'pay-eng-3',
    student_id: 'usr-student-eng-3',
    amount: 500000,
    payment_method: 'Click / Karta',
    reference_number: 'CLK-891046',
    payment_date: new Date(Date.now() - 4 * 86400000).toISOString().split('T')[0],
    notes: "Oylik to'lov to'liq",
    status: 'paid',
    created_at: new Date(Date.now() - 4 * 86400000).toISOString(),
  },
  // Farrux Ikromov - Full 500,000 UZS paid
  {
    id: 'pay-eng-4',
    student_id: 'usr-student-eng-4',
    amount: 500000,
    payment_method: 'Naqd pul',
    reference_number: 'CSH-891047',
    payment_date: new Date(Date.now() - 2 * 86400000).toISOString().split('T')[0],
    notes: "Oylik to'lov to'liq",
    status: 'paid',
    created_at: new Date(Date.now() - 2 * 86400000).toISOString(),
  },
  // Zarina Rustamova - Full 500,000 UZS paid
  {
    id: 'pay-eng-5',
    student_id: 'usr-student-eng-5',
    amount: 500000,
    payment_method: 'Payme',
    reference_number: 'PAY-891048',
    payment_date: new Date(Date.now() - 5 * 86400000).toISOString().split('T')[0],
    notes: "Oylik to'lov to'liq",
    status: 'paid',
    created_at: new Date(Date.now() - 5 * 86400000).toISOString(),
  },
  // Akbar Jalilov - Full 500,000 UZS paid
  {
    id: 'pay-eng-6',
    student_id: 'usr-student-eng-6',
    amount: 500000,
    payment_method: 'Click / Karta',
    reference_number: 'CLK-891049',
    payment_date: new Date(Date.now() - 3 * 86400000).toISOString().split('T')[0],
    notes: "Oylik to'lov to'liq",
    status: 'paid',
    created_at: new Date(Date.now() - 3 * 86400000).toISOString(),
  },
  // Rayhona Fayzullayeva - Full 550,000 UZS paid
  {
    id: 'pay-ux-1',
    student_id: 'usr-student-ux-1',
    amount: 550000,
    payment_method: 'Payme',
    reference_number: 'PAY-900101',
    payment_date: new Date(Date.now() - 4 * 86400000).toISOString().split('T')[0],
    notes: "Oylik to'lov to'liq",
    status: 'paid',
    created_at: new Date(Date.now() - 4 * 86400000).toISOString(),
  },
  // Temur Mirzayev - Full 550,000 UZS paid
  {
    id: 'pay-ux-2',
    student_id: 'usr-student-ux-2',
    amount: 550000,
    payment_method: 'Click / Karta',
    reference_number: 'CLK-900102',
    payment_date: new Date(Date.now() - 3 * 86400000).toISOString().split('T')[0],
    notes: "Oylik to'lov to'liq",
    status: 'paid',
    created_at: new Date(Date.now() - 3 * 86400000).toISOString(),
  },
  // Zilola Sobirova - Full 400,000 UZS paid
  {
    id: 'pay-ux-3',
    student_id: 'usr-student-ux-3',
    amount: 400000,
    payment_method: 'Naqd pul',
    reference_number: 'CSH-900103',
    payment_date: new Date(Date.now() - 2 * 86400000).toISOString().split('T')[0],
    notes: "Oylik to'lov to'liq",
    status: 'paid',
    created_at: new Date(Date.now() - 2 * 86400000).toISOString(),
  },
  // Shahriyor Ergashev - Full 550,000 UZS paid
  {
    id: 'pay-ux-4',
    student_id: 'usr-student-ux-4',
    amount: 550000,
    payment_method: 'Payme',
    reference_number: 'PAY-900104',
    payment_date: new Date(Date.now() - 5 * 86400000).toISOString().split('T')[0],
    notes: "Oylik to'lov to'liq",
    status: 'paid',
    created_at: new Date(Date.now() - 5 * 86400000).toISOString(),
  },
  // Mohira Qosimova - Full 550,000 UZS paid
  {
    id: 'pay-ux-5',
    student_id: 'usr-student-ux-5',
    amount: 550000,
    payment_method: 'Click / Karta',
    reference_number: 'CLK-900105',
    payment_date: new Date(Date.now() - 3 * 86400000).toISOString().split('T')[0],
    notes: "Oylik to'lov to'liq",
    status: 'paid',
    created_at: new Date(Date.now() - 3 * 86400000).toISOString(),
  },
  // Diyorbek Rahmonov - Full 550,000 UZS paid
  {
    id: 'pay-ux-6',
    student_id: 'usr-student-ux-6',
    amount: 550000,
    payment_method: 'Naqd pul',
    reference_number: 'CSH-900106',
    payment_date: new Date(Date.now() - 2 * 86400000).toISOString().split('T')[0],
    notes: "Oylik to'lov to'liq",
    status: 'paid',
    created_at: new Date(Date.now() - 2 * 86400000).toISOString(),
  },
];

class LocalStore {
  constructor() {
    this.memoryStore = {};
  }

  getItem(key, defaultValue) {
    try {
      if (typeof window !== 'undefined' && typeof window.localStorage?.getItem === 'function') {
        const data = window.localStorage.getItem(key);
        return data ? JSON.parse(data) : (this.memoryStore[key] !== undefined ? this.memoryStore[key] : defaultValue);
      }
      return this.memoryStore[key] !== undefined ? this.memoryStore[key] : defaultValue;
    } catch {
      return this.memoryStore[key] !== undefined ? this.memoryStore[key] : defaultValue;
    }
  }

  setItem(key, value) {
    this.memoryStore[key] = value;
    try {
      if (typeof window !== 'undefined' && typeof window.localStorage?.setItem === 'function') {
        window.localStorage.setItem(key, JSON.stringify(value));
      }
      this.pushToServer({ [key]: value }).catch(() => {});
      if (typeof window !== 'undefined' && window.__educoBroadcastChannel) {
        window.__educoBroadcastChannel.postMessage({ type: 'STORE_UPDATE', key, value });
      }
    } catch (e) {
      // In-memory fallback is already active
    }
  }

  applyIncomingData(serverData) {
    if (!serverData || typeof serverData !== 'object') return;

    let hasChatChanges = false;
    let hasNotifChanges = false;
    let hasGeneralChanges = false;

    Object.values(STORAGE_KEYS).forEach((key) => {
      const serverVal = serverData[key];
      if (!serverVal || !Array.isArray(serverVal)) return;

      const localVal = this.getItem(key, []);
      const localMap = new Map();
      localVal.forEach((item) => {
        if (item && item.id) localMap.set(item.id, item);
      });

      const newItems = [];
      let collectionChanged = false;

      serverVal.forEach((serverItem) => {
        if (!serverItem || !serverItem.id) return;
        const localItem = localMap.get(serverItem.id);
        if (!localItem) {
          localMap.set(serverItem.id, serverItem);
          newItems.push(serverItem);
          collectionChanged = true;
        } else {
          const localStr = JSON.stringify(localItem);
          const serverStr = JSON.stringify(serverItem);
          if (localStr !== serverStr) {
            localMap.set(serverItem.id, serverItem);
            collectionChanged = true;
          }
        }
      });

      if (collectionChanged) {
        const mergedArr = Array.from(localMap.values());
        this.memoryStore[key] = mergedArr;
        try {
          if (typeof window !== 'undefined' && typeof window.localStorage?.setItem === 'function') {
            window.localStorage.setItem(key, JSON.stringify(mergedArr));
          }
        } catch (e) {}

        if (key === STORAGE_KEYS.CHAT_MESSAGES) {
          hasChatChanges = true;
          newItems.forEach((msg) => {
            if (typeof window !== 'undefined' && (typeof process === 'undefined' || process.env?.NODE_ENV !== 'test')) {
              window.dispatchEvent(
                new CustomEvent('educo-chat-update', {
                  detail: {
                    event: 'INSERT',
                    groupId: msg.group_id || msg.groupId,
                    message: msg,
                  },
                })
              );
            }
          });
        } else if (key === STORAGE_KEYS.NOTIFICATIONS) {
          hasNotifChanges = true;
          if (typeof window !== 'undefined' && (typeof process === 'undefined' || process.env?.NODE_ENV !== 'test')) {
            window.dispatchEvent(
              new CustomEvent('educo-notification-update', {
                detail: { newItems },
              })
            );
          }
        } else {
          hasGeneralChanges = true;
        }
      }
    });

    if (hasGeneralChanges || hasChatChanges || hasNotifChanges) {
      if (typeof window !== 'undefined' && (typeof process === 'undefined' || process.env?.NODE_ENV !== 'test')) {
        window.dispatchEvent(
          new CustomEvent('educo-data-sync', {
            detail: serverData,
          })
        );
      }
    }
  }

  async syncWithServer() {
    if (typeof window === 'undefined' || typeof fetch === 'undefined') return;
    try {
      const res = await fetch('/api/sync-store', { cache: 'no-store' });
      if (!res.ok) return;
      const serverData = await res.json();
      if (!serverData || typeof serverData !== 'object') return;

      this.applyIncomingData(serverData);

      let hasLocalChangesToPush = false;
      const localPushPayload = {};

      Object.values(STORAGE_KEYS).forEach((key) => {
        const localVal = this.getItem(key, null);
        const serverVal = serverData[key];
        if (localVal && Array.isArray(localVal) && localVal.length > 0 && (!serverVal || !serverVal.length)) {
          localPushPayload[key] = localVal;
          hasLocalChangesToPush = true;
        }
      });

      if (hasLocalChangesToPush && Object.keys(localPushPayload).length > 0) {
        await this.pushToServer(localPushPayload);
      }
    } catch (e) {}
  }

  async pushToServer(payload) {
    if (typeof window === 'undefined' || typeof fetch === 'undefined') return;
    try {
      await fetch('/api/sync-store', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
    } catch (e) {}
  }

  // --- COURSES ---
  getCourses() {
    return this.getItem(STORAGE_KEYS.COURSES, INITIAL_COURSES);
  }

  saveCourse(courseData) {
    const list = this.getCourses();
    const newCourse = {
      id: courseData.id || `crs-${Date.now()}`,
      name: courseData.name,
      code: courseData.code || `CRS-${Math.floor(1000 + Math.random() * 9000)}`,
      description: courseData.description || '',
      monthly_fee: Number(courseData.monthly_fee || courseData.monthlyFee || 0),
      color: courseData.color || '#123D78',
      is_active: courseData.is_active ?? courseData.isActive ?? true,
      created_at: courseData.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString(),
      groupsCount: 0,
      activeGroupsCount: 0,
    };

    const index = list.findIndex((c) => c.id === newCourse.id);
    if (index >= 0) {
      list[index] = { ...list[index], ...newCourse };
    } else {
      list.unshift(newCourse);
    }
    this.setItem(STORAGE_KEYS.COURSES, list);
    return newCourse;
  }

  deleteCourse(id) {
    const list = this.getCourses().filter((c) => c.id !== id);
    this.setItem(STORAGE_KEYS.COURSES, list);
    return true;
  }

  // --- USERS ---
  normalizeUserId(id) {
    const map = {
      'demo-owner-id': 'usr-owner-1',
      'demo-admin-id': 'usr-admin-1',
      'demo-teacher-id': 'usr-teacher-1',
      'demo-student-id': 'usr-student-1',
    };
    return map[id] || id;
  }

  getUsers() {
    let raw = this.getItem(STORAGE_KEYS.USERS, INITIAL_USERS);
    let needsCleanup = false;
    const migratedAvatars = {};

    // Ensure all seed INITIAL_USERS exist in raw (including newly seeded users like Abdulazizbek)
    INITIAL_USERS.forEach((initUser) => {
      const initPhoneClean = (initUser.phone || '').replace(/\D/g, '').slice(-9);
      const exists = raw.some(
        (u) =>
          u.id === initUser.id ||
          (initPhoneClean && (u.phone || '').replace(/\D/g, '').slice(-9) === initPhoneClean)
      );
      if (!exists) {
        raw.push(initUser);
        needsCleanup = true;
      }
    });

    // Identify any accidentally created legacy demo-*-id rows and rescue their avatar_url
    raw.forEach((u) => {
      const mappedId = this.normalizeUserId(u.id);
      if (mappedId !== u.id || (u.fullName === 'User' && !u.phone && !u.first_name)) {
        needsCleanup = true;
        if (u.avatar_url) {
          const targetId = mappedId !== u.id ? mappedId : 'usr-owner-1';
          migratedAvatars[targetId] = u.avatar_url;
        }
      }
    });

    const filtered = raw.filter((u) => {
      const mappedId = this.normalizeUserId(u.id);
      if (mappedId !== u.id) return false;
      if (u.fullName === 'User' && !u.phone && !u.first_name) return false;
      return true;
    });

    const normalized = filtered.map((u) => {
      const defaultRef = INITIAL_USERS.find(
        (init) =>
          init.id === u.id ||
          init.username === u.username ||
          ((init.phone || '').replace(/\D/g, '').slice(-9) &&
            (init.phone || '').replace(/\D/g, '').slice(-9) === (u.phone || '').replace(/\D/g, '').slice(-9))
      );
      return {
        ...u,
        avatar_url: u.avatar_url || migratedAvatars[u.id] || '',
        password: u.password || defaultRef?.password || 'Educo#2026!',
        password_updated_at: u.password_updated_at || u.updated_at || u.created_at,
      };
    });

    if (needsCleanup) {
      this.setItem(STORAGE_KEYS.USERS, normalized);
    }

    return normalized;
  }

  saveUser(userData) {
    const list = this.getUsers();
    const resolvedId = this.normalizeUserId(userData.id);
    const index = list.findIndex(
      (u) =>
        u.id === resolvedId ||
        (userData.username && u.username === userData.username) ||
        (userData.email && u.email === userData.email)
    );
    const existing = index >= 0 ? list[index] : null;

    const firstName =
      userData.first_name ||
      userData.firstName ||
      existing?.first_name ||
      '';
    const lastName =
      userData.last_name !== undefined
        ? userData.last_name
        : userData.lastName !== undefined
        ? userData.lastName
        : existing?.last_name || '';
    const fullName =
      userData.full_name ||
      userData.fullName ||
      `${firstName} ${lastName}`.trim() ||
      existing?.fullName ||
      userData.username ||
      existing?.username ||
      'User';

    const hasNewPassword = Boolean(userData.password && String(userData.password).trim());

    const newUser = {
      ...(existing || {}),
      id: resolvedId || existing?.id || `usr-${Date.now()}`,
      username: userData.username || existing?.username || `user_${Date.now()}`,
      first_name: firstName,
      last_name: lastName,
      fullName,
      full_name: fullName,
      avatar_url:
        userData.avatar_url !== undefined
          ? userData.avatar_url
          : existing?.avatar_url || '',
      role: userData.role || existing?.role || 'student',
      email: userData.email || existing?.email || `${(userData.username || existing?.username || 'user').toLowerCase()}@educo.app`,
      phone: userData.phone !== undefined ? userData.phone : (existing?.phone || ''),
      father_phone: userData.father_phone ?? userData.fatherPhone ?? existing?.father_phone ?? '',
      mother_phone: userData.mother_phone ?? userData.motherPhone ?? existing?.mother_phone ?? '',
      password: hasNewPassword ? String(userData.password).trim() : (existing?.password || 'Educo#2026!'),
      password_updated_at: hasNewPassword
        ? new Date().toISOString()
        : (existing?.password_updated_at || new Date().toISOString()),
      is_active: userData.is_active ?? userData.isActive ?? existing?.is_active ?? true,
      created_at: userData.created_at || existing?.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    if (index >= 0) {
      list[index] = newUser;
    } else {
      list.unshift(newUser);
    }
    this.setItem(STORAGE_KEYS.USERS, list);
    this.pushToServer({ [STORAGE_KEYS.USERS]: list }).catch(() => {});
    return newUser;
  }

  updateUserPassword(identifier, newPassword) {
    const list = this.getUsers();
    const cleanId = String(identifier || '').toLowerCase().trim();
    const index = list.findIndex(
      (u) =>
        u.id === identifier ||
        (u.email && u.email.toLowerCase() === cleanId) ||
        (u.username && u.username.toLowerCase() === cleanId) ||
        (identifier === 'demo-owner-id' && u.role === 'owner') ||
        (identifier === 'demo-admin-id' && u.role === 'admin') ||
        (identifier === 'demo-teacher-id' && u.id === 'usr-teacher-1') ||
        (identifier === 'demo-student-id' && u.id === 'usr-student-1')
    );

    if (index >= 0) {
      list[index] = {
        ...list[index],
        password: String(newPassword).trim(),
        password_updated_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      this.setItem(STORAGE_KEYS.USERS, list);
      this.pushToServer({ [STORAGE_KEYS.USERS]: list }).catch(() => {});
      return list[index];
    }
    return null;
  }

  deleteUser(id) {
    const list = this.getUsers().filter((u) => u.id !== id);
    this.setItem(STORAGE_KEYS.USERS, list);
    return true;
  }

  // --- GROUPS ---
  getGroups() {
    let raw = this.getItem(STORAGE_KEYS.GROUPS, INITIAL_GROUPS);
    let changed = false;

    INITIAL_GROUPS.forEach((initG) => {
      const idx = raw.findIndex((g) => g.id === initG.id);
      if (idx === -1) {
        raw.push(initG);
        changed = true;
      } else {
        if (!Array.isArray(raw[idx].student_ids) || raw[idx].student_ids.length < initG.student_ids.length) {
          raw[idx] = {
            ...raw[idx],
            student_ids: initG.student_ids,
            enrolled_count: initG.student_ids.length,
          };
          changed = true;
        }
      }
    });

    if (changed) {
      this.setItem(STORAGE_KEYS.GROUPS, raw);
    }
    return raw;
  }

  // --- MEMBERSHIPS ---
  getMemberships() {
    let raw = this.getItem(STORAGE_KEYS.MEMBERSHIPS, INITIAL_MEMBERSHIPS);
    let changed = false;
    if (!Array.isArray(raw) || raw.length < INITIAL_MEMBERSHIPS.length) {
      const existingIds = new Set((raw || []).map((m) => m.id));
      const merged = Array.isArray(raw) ? [...raw] : [];
      INITIAL_MEMBERSHIPS.forEach((im) => {
        if (!existingIds.has(im.id)) {
          merged.push(im);
          changed = true;
        }
      });
      raw = merged;
      this.setItem(STORAGE_KEYS.MEMBERSHIPS, raw);
    }
    return raw;
  }

  saveMembership(membership) {
    const list = this.getMemberships();
    const id = membership.id || `mem-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const idx = list.findIndex((m) => m.id === id);
    const item = { ...membership, id };
    if (idx >= 0) {
      list[idx] = item;
    } else {
      list.push(item);
    }
    this.setItem(STORAGE_KEYS.MEMBERSHIPS, list);
    try {
      if (typeof window !== 'undefined' && (typeof process === 'undefined' || process.env?.NODE_ENV !== 'test')) {
        window.dispatchEvent(
          new CustomEvent('educo_membership_updated', {
            detail: { membership: item },
          })
        );
      }
    } catch (_) {}
    return item;
  }

  // --- PAYMENTS ---
  getPayments() {
    let raw = this.getItem(STORAGE_KEYS.PAYMENTS, null);
    if (!Array.isArray(raw) || raw.length === 0) {
      this.setItem(STORAGE_KEYS.PAYMENTS, INITIAL_PAYMENTS);
      return INITIAL_PAYMENTS;
    }

    // Auto-sync missing payments (such as Otabek Shukurov and paid classmates) into active list
    let needsUpdate = false;
    for (const initPay of INITIAL_PAYMENTS) {
      const exists = raw.some(
        (p) =>
          this.normalizeUserId(p.student_id || p.studentId) ===
          this.normalizeUserId(initPay.student_id)
      );
      if (!exists) {
        raw.push(initPay);
        needsUpdate = true;
      }
    }

    // Also ensure Azizbek Toshmatov (usr-student-py-2) has full payment 700000 if previously was 200000
    const azizbekPay = raw.find((p) => this.normalizeUserId(p.student_id) === 'usr-student-py-2');
    if (azizbekPay && azizbekPay.amount < 700000) {
      azizbekPay.amount = 700000;
      needsUpdate = true;
    }

    if (needsUpdate) {
      this.setItem(STORAGE_KEYS.PAYMENTS, raw);
    }
    return raw;
  }

  savePayment(paymentData) {
    const list = this.getPayments();
    const id = paymentData.id || `pay-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const newPayment = {
      id,
      student_id: paymentData.student_id || paymentData.studentId,
      amount: Number(paymentData.amount || 0),
      payment_method: paymentData.payment_method || paymentData.paymentMethod || 'Naqd pul',
      reference_number: paymentData.reference_number || paymentData.referenceNumber || '-',
      payment_date: paymentData.payment_date || paymentData.paymentDate || new Date().toISOString().split('T')[0],
      notes: paymentData.notes || '',
      status: paymentData.status || 'paid',
      created_at: paymentData.created_at || new Date().toISOString(),
    };
    list.unshift(newPayment);
    this.setItem(STORAGE_KEYS.PAYMENTS, list);
    try {
      if (typeof window !== 'undefined' && (typeof process === 'undefined' || process.env?.NODE_ENV !== 'test')) {
        window.dispatchEvent(
          new CustomEvent('educo_tuition_updated', {
            detail: { payment: newPayment },
          })
        );
      }
    } catch (_) {}
    return newPayment;
  }

  saveGroup(groupData) {
    const list = this.getGroups();
    const index = list.findIndex((g) => g.id === groupData.id);
    const existing = index >= 0 ? list[index] : {};
    const newGroup = {
      ...existing,
      id: groupData.id || `grp-${Date.now()}`,
      name: groupData.name !== undefined ? groupData.name : existing.name,
      code: groupData.code || existing.code || `GRP-${Math.floor(1000 + Math.random() * 9000)}`,
      course_id: groupData.course_id ?? groupData.courseId ?? existing.course_id ?? '',
      course_name: groupData.course_name ?? groupData.courseName ?? existing.course_name ?? '',
      teacher_id: groupData.teacher_id ?? groupData.teacherId ?? existing.teacher_id ?? '',
      teacher_name: groupData.teacher_name ?? groupData.teacherName ?? existing.teacher_name ?? '',
      room: groupData.room !== undefined ? groupData.room : (existing.room || '101-xona'),
      capacity: Number(groupData.capacity !== undefined ? groupData.capacity : (existing.capacity || 15)),
      enrolled_count: Number(groupData.enrolled_count !== undefined ? groupData.enrolled_count : (existing.enrolled_count || 0)),
      status: groupData.status || existing.status || 'active',
      monthly_price: Number(groupData.monthly_price !== undefined ? groupData.monthly_price : (groupData.monthlyPrice !== undefined ? groupData.monthlyPrice : (existing.monthly_price || 0))),
      schedule: groupData.schedule || existing.schedule || 'Dush-Chor-Jum, 18:00 - 20:00',
      avatar_url: groupData.avatar_url !== undefined ? groupData.avatar_url : (groupData.avatarUrl !== undefined ? groupData.avatarUrl : existing.avatar_url || null),
      image_url: groupData.image_url !== undefined ? groupData.image_url : (groupData.imageUrl !== undefined ? groupData.imageUrl : (groupData.avatar_url !== undefined ? groupData.avatar_url : existing.image_url || null)),
      created_at: groupData.created_at || existing.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    if (index >= 0) {
      list[index] = newGroup;
    } else {
      list.unshift(newGroup);
    }
    this.setItem(STORAGE_KEYS.GROUPS, list);
    return newGroup;
  }

  deleteGroup(id) {
    const list = this.getGroups().filter((g) => g.id !== id);
    this.setItem(STORAGE_KEYS.GROUPS, list);
    return true;
  }

  // --- LESSON SCHEDULES (TIMETABLE) ---
  getSchedules() {
    let raw = this.getItem(STORAGE_KEYS.LESSON_SCHEDULES, INITIAL_SCHEDULES);

    // Auto-migrate legacy 5-item seed data so demo groups have full 3-day patterns
    if (
      Array.isArray(raw) &&
      raw.some((s) => s.id === 'sch-4') &&
      !raw.some((s) => s.id === 'sch-4b')
    ) {
      raw = INITIAL_SCHEDULES;
      this.setItem(STORAGE_KEYS.LESSON_SCHEDULES, raw);
    }

    const groups = this.getGroups();
    const courses = this.getCourses();
    const users = this.getUsers();

    // Enrich with group, course, teacher relationships
    return raw.map((s) => {
      const g = groups.find((grp) => grp.id === s.group_id);
      const c = g ? courses.find((crs) => crs.id === g.course_id) : null;
      const t = g ? users.find((usr) => usr.id === g.teacher_id) : null;

      return {
        ...s,
        groupName: g?.name || 'Group',
        courseName: c?.name || '',
        color: c?.color || '#123D78',
        groups: g
          ? {
              id: g.id,
              name: g.name,
              courses: c ? { id: c.id, name: c.name, color: c.color } : null,
              group_teachers: t
                ? [{ teacher_id: t.id, profiles: { id: t.id, first_name: t.first_name, last_name: t.last_name } }]
                : [],
            }
          : null,
      };
    });
  }

  saveSchedule(item) {
    const list = this.getItem(STORAGE_KEYS.LESSON_SCHEDULES, INITIAL_SCHEDULES);
    const dayNum = Number(item.day_of_week || item.dayOfWeek || 1);
    const newSchedule = {
      id: item.id || `sch-${Date.now()}-${dayNum}-${Math.random().toString(36).slice(2, 6)}`,
      group_id: item.group_id || item.groupId,
      day_of_week: dayNum,
      start_time: item.start_time || item.startTime || '09:00:00',
      end_time: item.end_time || item.endTime || '10:30:00',
      room: item.room || '101-xona',
      created_at: item.created_at || new Date().toISOString(),
    };

    const idx = list.findIndex((s) => s.id === newSchedule.id);
    if (idx >= 0) {
      list[idx] = { ...list[idx], ...newSchedule };
    } else {
      list.push(newSchedule);
    }
    this.setItem(STORAGE_KEYS.LESSON_SCHEDULES, list);
    return newSchedule;
  }

  saveSchedulePattern({ groupId, pattern, startTime, endTime, room, existingLesson = null }) {
    const days = pattern === 'even' ? [2, 4, 6] : [1, 3, 5];
    const formattedStart = startTime.length === 5 ? `${startTime}:00` : startTime;
    const formattedEnd = endTime.length === 5 ? `${endTime}:00` : endTime;

    let list = this.getItem(STORAGE_KEYS.LESSON_SCHEDULES, INITIAL_SCHEDULES);

    // If editing an existing lesson, remove its previous pattern siblings (same group & start_time or same id)
    if (existingLesson) {
      const prevGroupId = existingLesson.group_id || existingLesson.groupId;
      const prevStart = (existingLesson.start_time || existingLesson.startTime || '').slice(0, 5);
      const prevDay = Number(existingLesson.day_of_week || existingLesson.dayOfWeek || 1);
      const prevPatternDays = [2, 4, 6].includes(prevDay) ? [2, 4, 6] : [1, 3, 5];

      list = list.filter((s) => {
        if (s.id === existingLesson.id) return false;
        const sStart = (s.start_time || '').slice(0, 5);
        if (
          s.group_id === prevGroupId &&
          sStart === prevStart &&
          prevPatternDays.includes(Number(s.day_of_week))
        ) {
          return false;
        }
        return true;
      });
    }

    const savedItems = [];
    for (const dayNum of days) {
      // Avoid exact duplicate for same group + day + start_time
      const dupIdx = list.findIndex(
        (s) =>
          s.group_id === groupId &&
          Number(s.day_of_week) === dayNum &&
          (s.start_time || '').slice(0, 5) === formattedStart.slice(0, 5)
      );

      const entry = {
        id:
          dupIdx >= 0
            ? list[dupIdx].id
            : `sch-${Date.now()}-${dayNum}-${Math.random().toString(36).slice(2, 6)}`,
        group_id: groupId,
        day_of_week: dayNum,
        start_time: formattedStart,
        end_time: formattedEnd,
        room: room || '101-xona',
        created_at: new Date().toISOString(),
      };

      if (dupIdx >= 0) {
        list[dupIdx] = entry;
      } else {
        list.push(entry);
      }
      savedItems.push(entry);
    }

    this.setItem(STORAGE_KEYS.LESSON_SCHEDULES, list);

    // Also update the group's schedule summary string
    const groups = this.getGroups();
    const gIdx = groups.findIndex((g) => g.id === groupId);
    if (gIdx >= 0) {
      const dayLabel = pattern === 'even' ? 'Sesh-Pay-Shan' : 'Dush-Chor-Jum';
      groups[gIdx] = {
        ...groups[gIdx],
        room: room || groups[gIdx].room,
        schedule: `${dayLabel}, ${formattedStart.slice(0, 5)} - ${formattedEnd.slice(0, 5)}`,
        updated_at: new Date().toISOString(),
      };
      this.setItem(STORAGE_KEYS.GROUPS, groups);
    }

    return savedItems;
  }

  deleteSchedule(id) {
    const list = this.getItem(STORAGE_KEYS.LESSON_SCHEDULES, INITIAL_SCHEDULES).filter((s) => s.id !== id);
    this.setItem(STORAGE_KEYS.LESSON_SCHEDULES, list);
    return true;
  }

  // --- ATTENDANCE (STUDENTS) ---
  getAttendance() {
    const defaultAttendance = [
      {
        id: 'att-oct-02-1',
        lesson_id: 'lsn-grp-1-2026-10-02',
        student_id: 'usr-student-1',
        status: 'present',
        remark: 'React asoslari darsida juda faol qatnashdi',
        recorded_by: 'usr-teacher-1',
        date: '2026-10-02',
        created_at: '2026-10-02T09:15:00.000Z',
      },
      {
        id: 'att-oct-05-1',
        lesson_id: 'lsn-grp-1-2026-10-05',
        student_id: 'usr-student-1',
        status: 'present',
        remark: 'Uy vazifasini o‘z vaqtida to‘liq topshirdi',
        recorded_by: 'usr-teacher-1',
        date: '2026-10-05',
        created_at: '2026-10-05T09:15:00.000Z',
      },
      {
        id: 'att-oct-07-1',
        lesson_id: 'lsn-grp-1-2026-10-07',
        student_id: 'usr-student-1',
        status: 'present',
        remark: 'Darsga to‘liq qatnashdi',
        recorded_by: 'usr-teacher-1',
        date: '2026-10-07',
        created_at: '2026-10-07T09:15:00.000Z',
      },
      {
        id: 'att-oct-09-1',
        lesson_id: 'lsn-grp-1-2026-10-09',
        student_id: 'usr-student-1',
        status: 'late',
        remark: 'Tirbandlik sababli 10 daqiqa kechikib keldi',
        recorded_by: 'usr-teacher-1',
        date: '2026-10-09',
        created_at: '2026-10-09T09:25:00.000Z',
      },
      {
        id: 'att-oct-12-1',
        lesson_id: 'lsn-grp-1-2026-10-12',
        student_id: 'usr-student-1',
        status: 'present',
        remark: 'Mustaqil amaliy ishni a’lo darajada bajardi',
        recorded_by: 'usr-teacher-1',
        date: '2026-10-12',
        created_at: '2026-10-12T09:15:00.000Z',
      },
      {
        id: 'att-oct-14-1',
        lesson_id: 'lsn-grp-1-2026-10-14',
        student_id: 'usr-student-1',
        status: 'excused',
        remark: 'Shifokor ko‘rigi sababli maʼmuriyatdan ruxsat so‘ralgan',
        recorded_by: 'usr-teacher-1',
        date: '2026-10-14',
        created_at: '2026-10-14T09:15:00.000Z',
      },
      {
        id: 'att-oct-16-1',
        lesson_id: 'lsn-grp-1-2026-10-16',
        student_id: 'usr-student-1',
        status: 'present',
        remark: 'Darsga o‘z vaqtida keldi va faol qatnashdi',
        recorded_by: 'usr-teacher-1',
        date: '2026-10-16',
        created_at: '2026-10-16T09:15:00.000Z',
      },
      {
        id: 'att-oct-19-1',
        lesson_id: 'lsn-grp-1-2026-10-19',
        student_id: 'usr-student-1',
        status: 'present',
        remark: 'Bugungi darsda faol qatnashdi',
        recorded_by: 'usr-teacher-1',
        date: '2026-10-19',
        created_at: '2026-10-19T09:15:00.000Z',
      },
    ];

    let raw = this.getItem(STORAGE_KEYS.ATTENDANCE, defaultAttendance);
    if (!Array.isArray(raw) || raw.length < 5) {
      raw = defaultAttendance;
      this.setItem(STORAGE_KEYS.ATTENDANCE, raw);
    } else {
      const hasOct2 = raw.some(r => r.student_id === 'usr-student-1' && (r.date === '2026-10-02' || (r.lesson_id && r.lesson_id.includes('2026-10-02'))));
      if (!hasOct2) {
        raw = [...defaultAttendance, ...raw.filter(r => !defaultAttendance.some(d => d.id === r.id))];
        this.setItem(STORAGE_KEYS.ATTENDANCE, raw);
      }
    }
    return raw;
  }

  saveAttendance(records) {
    const list = this.getAttendance();
    const updated = [...list];
    const recs = Array.isArray(records) ? records : [records];
    for (const r of recs) {
      const idx = updated.findIndex((item) => item.student_id === r.student_id && item.lesson_id === r.lesson_id);
      if (idx >= 0) {
        updated[idx] = { ...updated[idx], ...r, updated_at: new Date().toISOString() };
      } else {
        updated.unshift({ ...r, id: r.id || `att-${Date.now()}-${Math.random()}`, created_at: new Date().toISOString() });
      }
    }
    this.setItem(STORAGE_KEYS.ATTENDANCE, updated);
    this.pushToServer({ [STORAGE_KEYS.ATTENDANCE]: updated }).catch(() => {});

    // AUTO-RECORD TEACHER ATTENDANCE:
    // If a teacher conducted the lesson or recorded student attendance,
    // automatically mark the teacher as 'present' unless already manually marked by admin!
    try {
      if (recs.length > 0 && recs[0].lesson_id) {
        const lessonId = recs[0].lesson_id;
        const recordedBy = recs[0].recorded_by;
        let lessonDate = new Date().toISOString().split('T')[0];
        let groupId = null;

        if (lessonId.startsWith('lsn-')) {
          const parts = lessonId.replace('lsn-', '').split('-');
          if (parts.length >= 4) {
            groupId = `${parts[0]}-${parts[1]}`;
            lessonDate = `${parts[2]}-${parts[3]}-${parts[4]}`;
          }
        }

        const groups = this.getGroups();
        const group = groups.find((g) => g.id === groupId);
        const teacherId = recordedBy || group?.teacher_id;

        if (teacherId) {
          const existing = this.getTeacherAttendance(lessonDate, teacherId);
          const manualAdminRecord = existing.find((r) => !r.is_auto && r.marked_by === 'admin');

          if (!manualAdminRecord) {
            this.saveTeacherAttendance({
              teacher_id: teacherId,
              date: lessonDate,
              status: 'present',
              check_in_time: new Date().toISOString(),
              notes: `${group?.name || 'Guruh'} darsida talabalar davomatini qildi (Avtomatik kelgan deb belgilandi)`,
              is_auto: true,
              lesson_id: lessonId,
              marked_by: 'system',
            });
          }
        }
      }
    } catch (e) {
      console.warn('Teacher auto-attendance trigger error:', e);
    }

    return recs;
  }

  // --- TEACHER ATTENDANCE (USTOZLAR VA XODIMLAR DAVOMATI) ---
  getTeacherAttendance(date = null, teacherId = null) {
    const list = this.getItem(STORAGE_KEYS.TEACHER_ATTENDANCE, []);
    let filtered = list;
    if (date) {
      filtered = filtered.filter((r) => r.date === date);
    }
    if (teacherId && teacherId !== 'all') {
      filtered = filtered.filter((r) => r.teacher_id === teacherId);
    }
    return filtered;
  }

  saveTeacherAttendance(record) {
    const list = this.getItem(STORAGE_KEYS.TEACHER_ATTENDANCE, []);
    const updated = [...list];

    const tId = record.teacher_id || record.teacherId;
    const d = record.date || new Date().toISOString().split('T')[0];

    const idx = updated.findIndex((r) => r.teacher_id === tId && r.date === d);
    const existing = idx >= 0 ? updated[idx] : null;

    const newRecord = {
      id: existing?.id || record.id || `tatt-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      teacher_id: tId,
      date: d,
      status: record.status || 'present', // 'present' | 'late' | 'excused' | 'absent'
      notes: record.notes !== undefined ? record.notes : (existing?.notes || ''),
      check_in_time: record.check_in_time || record.checkInTime || existing?.check_in_time || new Date().toISOString(),
      is_auto: record.is_auto !== undefined ? record.is_auto : (record.isAutoMarked ?? false),
      lesson_id: record.lesson_id || record.lessonId || existing?.lesson_id || null,
      marked_by: record.marked_by || record.markedBy || (record.is_auto ? 'system' : 'admin'),
      created_at: existing?.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    if (idx >= 0) {
      updated[idx] = newRecord;
    } else {
      updated.unshift(newRecord);
    }

    this.setItem(STORAGE_KEYS.TEACHER_ATTENDANCE, updated);
    this.pushToServer({ [STORAGE_KEYS.TEACHER_ATTENDANCE]: updated }).catch(() => {});
    return newRecord;
  }

  deleteTeacherAttendance(id) {
    const list = this.getItem(STORAGE_KEYS.TEACHER_ATTENDANCE, []).filter((r) => r.id !== id);
    this.setItem(STORAGE_KEYS.TEACHER_ATTENDANCE, list);
    this.pushToServer({ [STORAGE_KEYS.TEACHER_ATTENDANCE]: list }).catch(() => {});
    return true;
  }

  // --- GRADES ---
  getGrades() {
    return this.getItem(STORAGE_KEYS.GRADES, []);
  }

  saveGrade(gradeData) {
    const list = this.getGrades();
    const studentId = gradeData.student_id || gradeData.studentId;
    const groupId = gradeData.group_id || gradeData.groupId;
    const lessonId = gradeData.lesson_id || gradeData.lessonId;
    const existingIndex = list.findIndex(
      (item) =>
        (gradeData.id && item.id === gradeData.id) ||
        (item.student_id === studentId && (item.lesson_id === lessonId || (groupId && item.group_id === groupId)))
    );

    const newGrade = {
      id: gradeData.id || (existingIndex >= 0 ? list[existingIndex].id : `grd-${Date.now()}`),
      student_id: studentId,
      student_name: gradeData.student_name || gradeData.studentName || 'Student',
      group_id: groupId,
      lesson_id: lessonId,
      teacher_id: gradeData.teacher_id || gradeData.teacherId || gradeData.graded_by,
      grade_value: Number(gradeData.grade_value || gradeData.grade || gradeData.score || 5),
      topic: gradeData.topic || 'Dars mashgʻuloti',
      feedback: gradeData.feedback || '',
      lessons: {
        id: lessonId,
        title: gradeData.topic || 'Dars mashgʻuloti',
        group_id: groupId,
        lesson_date: new Date().toISOString().split('T')[0],
      },
      created_at: existingIndex >= 0 && list[existingIndex].created_at ? list[existingIndex].created_at : new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    if (existingIndex >= 0) {
      list[existingIndex] = { ...list[existingIndex], ...newGrade };
    } else {
      list.unshift(newGrade);
    }
    this.setItem(STORAGE_KEYS.GRADES, list);
    this.pushToServer({ [STORAGE_KEYS.GRADES]: list }).catch(() => {});
    return newGrade;
  }

  // --- ANNOUNCEMENTS ---
  getAnnouncements() {
    return this.getItem(STORAGE_KEYS.ANNOUNCEMENTS, [
      {
        id: 'ann-1',
        title: 'Yangi oʻquv mavsumi boshlanishi',
        content: 'Barcha oʻquvchilar va ustozlar diqqatiga! Darslar belgilangan jadval boʻyicha oʻz vaqtida boshlanadi.',
        author_name: 'Alisher Qodirov (Owner)',
        is_pinned: true,
        created_at: new Date(Date.now() - 2 * 86400000).toISOString(),
      },
    ]);
  }

  saveAnnouncement(annData) {
    const list = this.getAnnouncements();
    const newAnn = {
      id: annData.id || `ann-${Date.now()}`,
      title: annData.title,
      content: annData.content,
      author_name: annData.author_name || 'Administrator',
      is_pinned: annData.is_pinned || false,
      created_at: new Date().toISOString(),
    };
    list.unshift(newAnn);
    this.setItem(STORAGE_KEYS.ANNOUNCEMENTS, list);
    return newAnn;
  }

  // --- CHAT MESSAGES (STAFF CHAT & GROUP CHATS) ---
  getInitialChatMessages() {
    return [
      {
        id: 'msg-ann-init',
        group_id: 'announcements-broadcast-channel',
        sender_id: 'usr-owner-1',
        message: 'Hurmatli oʻquvchilar, ustozlar va markaz xodimlari! Yangi oʻquv mavsumi munosabati bilan barchangizga muvaffaqiyatlar tilaymiz. Ushbu kanalda markazimizning eng muhim umumiy eʻlonlari berib boriladi.',
        created_at: new Date(Date.now() - 6 * 3600000).toISOString(),
        updated_at: new Date(Date.now() - 6 * 3600000).toISOString(),
        chat_attachments: [],
        is_announcement: true,
      },
      {
        id: 'msg-staff-1',
        group_id: 'staff-general-chat',
        sender_id: 'usr-owner-1',
        message: 'Assalomu alaykum hurmatli adminlar va ustozlar! Bu yerda oʻquv markazimizning ichki masalalari, dars jadvallari va yangiliklarni muhokama qilamiz.',
        created_at: new Date(Date.now() - 3 * 3600000).toISOString(),
        updated_at: new Date(Date.now() - 3 * 3600000).toISOString(),
        chat_attachments: [],
      },
      {
        id: 'msg-staff-2',
        group_id: 'staff-general-chat',
        sender_id: 'usr-admin-1',
        message: 'Va alaykum assalom! Yangi qabul qilingan oʻquvchilarning davomat va guruh jadvallari yangilandi.',
        created_at: new Date(Date.now() - 2 * 3600000).toISOString(),
        updated_at: new Date(Date.now() - 2 * 3600000).toISOString(),
        chat_attachments: [],
      },
      {
        id: 'msg-staff-3',
        group_id: 'staff-general-chat',
        sender_id: 'usr-teacher-1',
        message: 'Tushunarli, rahmat! Bugungi Frontend va Python guruhlarimning dars materiallarini ham tizimga yuklab qoʻydim.',
        created_at: new Date(Date.now() - 45 * 60000).toISOString(),
        updated_at: new Date(Date.now() - 45 * 60000).toISOString(),
        chat_attachments: [],
      },
      {
        id: 'msg-grp1-1',
        group_id: 'grp-1',
        sender_id: 'usr-teacher-1',
        message: 'Assalomu alaykum FS-12 guruhi! Bugungi React Hooks mavzusi boʻyicha uy vazifasini vaqtida topshirishni unutmang.',
        created_at: new Date(Date.now() - 4 * 3600000).toISOString(),
        updated_at: new Date(Date.now() - 4 * 3600000).toISOString(),
        chat_attachments: [],
      },
      {
        id: 'msg-grp1-2',
        group_id: 'grp-1',
        sender_id: 'usr-student-1',
        message: 'Xoʻp boʻladi ustoz, hozir bajarib yuklayapman!',
        created_at: new Date(Date.now() - 3.5 * 3600000).toISOString(),
        updated_at: new Date(Date.now() - 3.5 * 60000).toISOString(),
        chat_attachments: [],
      },
    ];
  }

  getStaffMembers() {
    return this.getUsers().filter((u) =>
      ['owner', 'admin', 'teacher'].includes(u.role) && u.is_active !== false
    );
  }

  getChatMessages(groupId = null) {
    let raw = this.getItem(STORAGE_KEYS.CHAT_MESSAGES, this.getInitialChatMessages());
    const users = this.getUsers();
    let needsRawUpdate = false;

    // Self-healing migration for stored staff chat seen receipts
    for (let i = 0; i < raw.length; i++) {
      const m = raw[i];
      if (m.group_id === 'staff-general-chat' && Array.isArray(m.seen_by)) {
        const initialLen = m.seen_by.length;
        m.seen_by = m.seen_by
          .map((s) => {
            const sNormId = this.normalizeUserId(s.user_id);
            const found = users.find((u) => u.id === sNormId || u.id === s.user_id);
            if (found) {
              return {
                ...s,
                user_id: found.id,
                user_name: found.fullName || `${found.first_name || ''} ${found.last_name || ''}`.trim() || found.username,
                user_role: found.role || s.user_role,
                avatar_url: found.avatar_url || s.avatar_url || '',
              };
            }
            return s;
          })
          .filter((s) => s.user_role !== 'student' && s.user_name !== 'User');

        if (m.seen_by.length !== initialLen) {
          needsRawUpdate = true;
        }
      }
    }

    if (needsRawUpdate) {
      this.setItem(STORAGE_KEYS.CHAT_MESSAGES, raw);
      this.pushToServer({ [STORAGE_KEYS.CHAT_MESSAGES]: raw }).catch(() => {});
    }

    const enriched = raw.map((m) => {
      const normalizedSenderId = this.normalizeUserId(m.sender_id);
      const senderUser = users.find((u) => u.id === normalizedSenderId || u.id === m.sender_id);
      const isStaffGroup = m.group_id === 'staff-general-chat';

      // Clean & enrich seen_by viewers with latest user data
      const cleanedSeenBy = (m.seen_by || [])
        .map((s) => {
          const sNormId = this.normalizeUserId(s.user_id);
          const found = users.find((u) => u.id === sNormId || u.id === s.user_id);
          if (found) {
            return {
              ...s,
              user_id: found.id,
              user_name:
                found.fullName ||
                `${found.first_name || ''} ${found.last_name || ''}`.trim() ||
                (s.user_name && s.user_name !== 'User' ? s.user_name : found.username),
              user_role: found.role || s.user_role,
              avatar_url: found.avatar_url || s.avatar_url || '',
            };
          }
          return s;
        })
        .filter((s) => {
          // If message is in staff chat, students are NEVER allowed in seen_by!
          if (isStaffGroup && s.user_role === 'student') return false;
          return true;
        });

      return {
        ...m,
        sender_id: normalizedSenderId,
        sender: senderUser
          ? {
              id: senderUser.id,
              username: senderUser.username,
              first_name: senderUser.first_name,
              last_name: senderUser.last_name,
              role: senderUser.role,
              avatar_url: senderUser.avatar_url || null,
            }
          : m.sender || {
              id: normalizedSenderId,
              username: 'user',
              first_name: 'Foydalanuvchi',
              last_name: '',
              role: 'teacher',
            },
        chat_attachments: m.chat_attachments || [],
        seen_by: cleanedSeenBy,
      };
    });

    if (!groupId) return enriched;
    return enriched
      .filter((m) => m.group_id === groupId)
      .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
  }

  saveChatMessage(msgData) {
    const list = this.getItem(STORAGE_KEYS.CHAT_MESSAGES, this.getInitialChatMessages());
    const normalizedSenderId = this.normalizeUserId(msgData.sender_id);
    const nowIso = new Date().toISOString();

    const newMsg = {
      id: msgData.id || `msg-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      group_id: msgData.group_id,
      sender_id: normalizedSenderId,
      message: msgData.message || '',
      created_at: msgData.created_at || nowIso,
      updated_at: nowIso,
      chat_attachments: msgData.chat_attachments || [],
      seen_by: msgData.seen_by || [],
    };

    list.push(newMsg);
    this.setItem(STORAGE_KEYS.CHAT_MESSAGES, list);
    this.pushToServer({ [STORAGE_KEYS.CHAT_MESSAGES]: list }).catch(() => {});

    // Return enriched message
    const all = this.getChatMessages(msgData.group_id);
    return all.find((m) => m.id === newMsg.id) || newMsg;
  }

  markChatMessageSeen(messageId, viewerUser) {
    if (!messageId || !viewerUser) return null;
    const list = this.getItem(STORAGE_KEYS.CHAT_MESSAGES, this.getInitialChatMessages());
    const idx = list.findIndex((m) => m.id === messageId);
    if (idx >= 0) {
      const msg = list[idx];
      const isStaffChat = msg.group_id === 'staff-general-chat';
      const users = this.getUsers();
      const viewerId = this.normalizeUserId(viewerUser.id || viewerUser.user_id);
      const foundUser = users.find((u) => u.id === viewerId);

      const resolvedRole =
        viewerUser.role ||
        viewerUser.user_role ||
        viewerUser.user_metadata?.role ||
        foundUser?.role ||
        (isStaffChat ? 'teacher' : 'student');

      // SECURITY GUARD: If this message is in staff chat, students must NEVER mark it as seen!
      if (isStaffChat && resolvedRole === 'student') {
        return null;
      }

      const resolvedName =
        viewerUser.full_name ||
        viewerUser.fullName ||
        viewerUser.user_metadata?.full_name ||
        foundUser?.fullName ||
        `${viewerUser.first_name || foundUser?.first_name || ''} ${viewerUser.last_name || foundUser?.last_name || ''}`.trim() ||
        (viewerUser.user_name && viewerUser.user_name !== 'User' ? viewerUser.user_name : foundUser?.username) ||
        'Foydalanuvchi';

      const resolvedAvatar =
        viewerUser.avatar_url ||
        viewerUser.user_metadata?.avatar_url ||
        foundUser?.avatar_url ||
        '';

      if (!msg.seen_by) msg.seen_by = [];
      const alreadyIdx = msg.seen_by.findIndex((s) => s.user_id === viewerId);
      if (alreadyIdx >= 0) {
        msg.seen_by[alreadyIdx] = {
          ...msg.seen_by[alreadyIdx],
          user_name: resolvedName,
          user_role: resolvedRole,
          avatar_url: resolvedAvatar || msg.seen_by[alreadyIdx].avatar_url,
        };
      } else {
        msg.seen_by.push({
          user_id: viewerId,
          user_name: resolvedName,
          user_role: resolvedRole,
          avatar_url: resolvedAvatar,
          seen_at: new Date().toISOString(),
        });
      }

      // Sanitize: If this message belongs to staff chat, strip any student entries
      if (isStaffChat) {
        msg.seen_by = msg.seen_by.filter((s) => s.user_role !== 'student');
      }

      list[idx] = msg;
      this.setItem(STORAGE_KEYS.CHAT_MESSAGES, list);
      this.pushToServer({ [STORAGE_KEYS.CHAT_MESSAGES]: list }).catch(() => {});
      fetch('/api/chat/seen', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messageId,
          user: {
            user_id: viewerId,
            user_name: resolvedName,
            user_role: resolvedRole,
            avatar_url: resolvedAvatar,
          },
        }),
      }).catch(() => {});
      return msg;
    }
    return null;
  }

  updateChatMessage(messageId, newContent) {
    if (!messageId) return null;
    const list = this.getItem(STORAGE_KEYS.CHAT_MESSAGES, this.getInitialChatMessages());
    const idx = list.findIndex((m) => m.id === messageId);
    if (idx >= 0) {
      const nowIso = new Date().toISOString();
      const updatedMsg = {
        ...list[idx],
        message: newContent,
        is_edited: true,
        edited_at: nowIso,
        updated_at: nowIso,
      };
      list[idx] = updatedMsg;
      this.setItem(STORAGE_KEYS.CHAT_MESSAGES, list);
      this.pushToServer({ [STORAGE_KEYS.CHAT_MESSAGES]: list }).catch(() => {});
      return updatedMsg;
    }
    return null;
  }

  deleteChatMessage(messageId) {
    const list = this.getItem(STORAGE_KEYS.CHAT_MESSAGES, this.getInitialChatMessages()).filter(
      (m) => m.id !== messageId
    );
    this.setItem(STORAGE_KEYS.CHAT_MESSAGES, list);
    this.pushToServer({ [STORAGE_KEYS.CHAT_MESSAGES]: list }).catch(() => {});
    return true;
  }

  // --- STUDENT REMINDERS ---
  getStudentReminders() {
    const todayStr = new Date().toISOString().split('T')[0];
    const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];
    const in3Days = new Date(Date.now() + 3 * 86400000).toISOString().split('T')[0];

    const defaultReminders = [
      {
        id: 'rem-trial-1',
        type: 'trial_lesson',
        student_id: '',
        student_name: 'Diyorbek Karimov',
        student_phone: '+998912345678',
        father_phone: '+998909876543',
        mother_phone: '',
        group_id: 'grp-1',
        group_name: 'FE-24 React Guruh',
        course_name: 'Frontend React & JavaScript',
        teacher_name: 'Bobur Mirzayev',
        room: '101-xona',
        due_date: todayStr,
        due_time: '18:00',
        note: 'Yangi o‘quvchi 1-bepul sinov darsiga taklif qilingan. Darsdan 15 daqiqa oldin kutib olish lozim.',
        status: 'pending',
        created_at: new Date(Date.now() - 86400000).toISOString(),
        completed_at: null,
      },
      {
        id: 'rem-trial-2',
        type: 'trial_lesson',
        student_id: '',
        student_name: 'Madina Saidova',
        student_phone: '+998934445566',
        father_phone: '+998971112233',
        mother_phone: '',
        group_id: 'grp-2',
        group_name: 'PY-18 Python Dasturlash',
        course_name: 'Python Backend & Data Science',
        teacher_name: 'Bobur Mirzayev',
        room: '102-xona',
        due_date: tomorrow,
        due_time: '15:00',
        note: 'Python kursi bo‘yicha sinov darsida qatnashadi. Noutbuk olib kelishi aytilgan.',
        status: 'pending',
        created_at: new Date(Date.now() - 2 * 86400000).toISOString(),
        completed_at: null,
      },
      {
        id: 'rem-demo-1',
        type: 'call',
        student_id: 'usr-student-1',
        student_name: 'Jasur Rustamov',
        student_phone: '+998905556677',
        father_phone: '+998905551122',
        mother_phone: '',
        group_id: 'grp-1',
        group_name: 'FE-24 React Guruh',
        course_name: 'Frontend React & JavaScript',
        teacher_name: 'Bobur Mirzayev',
        room: '101-xona',
        due_date: todayStr,
        due_time: '14:30',
        note: 'Dars boshlanishi va jadvalni tasdiqlash uchun ota-onasi bilan bog‘lanish',
        status: 'pending',
        created_at: new Date(Date.now() - 3 * 86400000).toISOString(),
        completed_at: null,
      },
      {
        id: 'rem-call-3',
        type: 'call',
        student_id: '',
        student_name: 'Azizbek Rahimov',
        student_phone: '+998998889900',
        father_phone: '+998901239988',
        mother_phone: '',
        group_id: 'grp-3',
        group_name: 'ENG-05 IELTS Foundation',
        course_name: 'Ingliz tili (IELTS Intensive)',
        teacher_name: 'Nilufar Usmonova',
        room: '103-xona',
        due_date: in3Days,
        due_time: '11:00',
        note: 'Placement test natijasi chiqadi, darajasiga qarab guruh tanlash uchun qo‘ng‘iroq qilish',
        status: 'pending',
        created_at: new Date(Date.now() - 86400000).toISOString(),
        completed_at: null,
      },
      {
        id: 'rem-comp-1',
        type: 'trial_lesson',
        student_id: '',
        student_name: 'Shaxnoza Aliyeva',
        student_phone: '+998947778899',
        father_phone: '',
        mother_phone: '',
        group_id: 'grp-1',
        group_name: 'FE-24 React Guruh',
        course_name: 'Frontend React & JavaScript',
        teacher_name: 'Bobur Mirzayev',
        room: '101-xona',
        due_date: new Date(Date.now() - 2 * 86400000).toISOString().split('T')[0],
        due_time: '18:00',
        note: 'Sinov darsiga qatnashdi. Kurs yoqdi va shartnoma tuzishga kelishildi.',
        status: 'completed',
        created_at: new Date(Date.now() - 4 * 86400000).toISOString(),
        completed_at: new Date(Date.now() - 2 * 86400000).toISOString(),
        completed_note: 'Sinov darsida qatnashdi, kursga yozildi',
      },
    ];
    return this.getItem(STORAGE_KEYS.STUDENT_REMINDERS, defaultReminders);
  }

  saveStudentReminder(reminderData) {
    const list = this.getStudentReminders();
    const newRem = {
      id: reminderData.id || `rem-${Date.now()}`,
      type: reminderData.type || 'trial_lesson', // 'trial_lesson' | 'call' | 'general'
      student_id: reminderData.student_id || reminderData.studentId || '',
      student_name: reminderData.student_name || reminderData.studentName || 'O‘quvchi',
      student_phone: reminderData.student_phone || reminderData.studentPhone || '',
      father_phone: reminderData.father_phone || reminderData.fatherPhone || '',
      mother_phone: reminderData.mother_phone || reminderData.motherPhone || '',
      group_id: reminderData.group_id || reminderData.groupId || '',
      group_name: reminderData.group_name || reminderData.groupName || 'Guruhsiz',
      course_name: reminderData.course_name || reminderData.courseName || '',
      teacher_name: reminderData.teacher_name || reminderData.teacherName || '',
      room: reminderData.room || '',
      due_date: reminderData.due_date || reminderData.dueDate || new Date().toISOString().split('T')[0],
      due_time: reminderData.due_time || reminderData.dueTime || '10:00',
      note: reminderData.note || 'Dars boshlanish sanasi va guruh haqida xabar berish',
      status: reminderData.status || 'pending',
      created_at: reminderData.created_at || new Date().toISOString(),
      completed_at: reminderData.completed_at || null,
      completed_note: reminderData.completed_note || null,
    };

    const idx = list.findIndex((r) => r.id === newRem.id);
    if (idx >= 0) {
      list[idx] = { ...list[idx], ...newRem };
    } else {
      list.unshift(newRem);
    }
    this.setItem(STORAGE_KEYS.STUDENT_REMINDERS, list);
    this.pushToServer({ [STORAGE_KEYS.STUDENT_REMINDERS]: list }).catch(() => {});
    return newRem;
  }

  completeStudentReminder(id, note = '') {
    const list = this.getStudentReminders();
    const idx = list.findIndex((r) => r.id === id);
    if (idx >= 0) {
      list[idx] = {
        ...list[idx],
        status: 'completed',
        completed_at: new Date().toISOString(),
        completed_note: note || 'Gaplashildi va kelishildi',
      };
      this.setItem(STORAGE_KEYS.STUDENT_REMINDERS, list);
      this.pushToServer({ [STORAGE_KEYS.STUDENT_REMINDERS]: list }).catch(() => {});
      return list[idx];
    }
    return null;
  }

  postponeStudentReminder(id, daysToAdd = 1) {
    const list = this.getStudentReminders();
    const idx = list.findIndex((r) => r.id === id);
    if (idx >= 0) {
      const current = new Date(list[idx].due_date || Date.now());
      current.setDate(current.getDate() + daysToAdd);
      list[idx] = {
        ...list[idx],
        due_date: current.toISOString().split('T')[0],
      };
      this.setItem(STORAGE_KEYS.STUDENT_REMINDERS, list);
      this.pushToServer({ [STORAGE_KEYS.STUDENT_REMINDERS]: list }).catch(() => {});
      return list[idx];
    }
    return null;
  }

  deleteStudentReminder(id) {
    const list = this.getStudentReminders().filter((r) => r.id !== id);
    this.setItem(STORAGE_KEYS.STUDENT_REMINDERS, list);
    this.pushToServer({ [STORAGE_KEYS.STUDENT_REMINDERS]: list }).catch(() => {});
    return true;
  }

  // --- NOTIFICATIONS ---
  getNotifications(userId = null) {
    const defaultList = [
      {
        id: 'notif-1',
        user_id: 'usr-student-1',
        type: 'ATTENDANCE',
        title: 'Davomat qayd etildi',
        message: 'Frontend React guruhi bo‘yicha bugungi dars davomati "Bor" deb belgilandi.',
        link: '/student/attendance',
        is_read: false,
        created_at: new Date(Date.now() - 2 * 3600000).toISOString(),
      },
      {
        id: 'notif-2',
        user_id: 'usr-student-1',
        type: 'SYSTEM',
        title: 'Dars jadvali tasdiqlandi',
        message: 'FE-24 React guruhi darslari Dushanba, Chorshanba, Juma kunlari 09:00 - 10:30 ga belgilandi.',
        link: '/student/schedule',
        is_read: false,
        created_at: new Date(Date.now() - 5 * 3600000).toISOString(),
      },
      {
        id: 'notif-3',
        user_id: 'usr-student-1',
        type: 'PAYMENT',
        title: 'O‘qish to‘lovi qabul qilindi',
        message: 'Frontend React kursi uchun 1,200,000 so‘m oylik to‘lov muvaffaqiyatli qabul qilindi.',
        link: '/student/dashboard',
        is_read: true,
        created_at: new Date(Date.now() - 24 * 3600000).toISOString(),
      },
      {
        id: 'notif-4',
        user_id: 'usr-teacher-1',
        type: 'ATTENDANCE',
        title: 'Davomat eslatmasi',
        message: 'FE-24 React guruhining bugungi darsi uchun talabalar davomatini to‘ldirishni unutmang.',
        link: '/teacher/attendance',
        is_read: false,
        created_at: new Date(Date.now() - 1 * 3600000).toISOString(),
      },
      {
        id: 'notif-5',
        user_id: 'usr-admin-1',
        type: 'SYSTEM',
        title: 'Yangi o‘quvchi qo‘shildi',
        message: 'Jasur Rustamov FE-24 guruhiga muvaffaqiyatli biriktirildi.',
        link: '/admin/users',
        is_read: false,
        created_at: new Date(Date.now() - 3 * 3600000).toISOString(),
      },
      {
        id: 'notif-6',
        user_id: 'usr-owner-1',
        type: 'PAYMENT',
        title: 'Yangi to‘lov tushumi',
        message: 'Frontend kursi uchun yangi to‘lov qaydnomasi kiritildi.',
        link: '/owner/tuition',
        is_read: false,
        created_at: new Date(Date.now() - 2 * 3600000).toISOString(),
      },
    ];

    let list = this.getItem(STORAGE_KEYS.NOTIFICATIONS, defaultList);
    if (!Array.isArray(list) || list.length === 0) {
      list = defaultList;
      this.setItem(STORAGE_KEYS.NOTIFICATIONS, list);
    }

    if (userId) {
      const normalized = this.normalizeUserId(userId);
      return list.filter((n) => this.normalizeUserId(n.user_id) === normalized);
    }
    return list;
  }

  saveNotification(item) {
    const list = this.getItem(STORAGE_KEYS.NOTIFICATIONS, []);
    const newNotif = {
      id: item.id || `notif-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      user_id: item.user_id || item.userId,
      type: item.type || 'SYSTEM',
      title: item.title || 'Bildirishnoma',
      message: item.message || '',
      link: item.link || null,
      metadata: item.metadata || {},
      is_read: item.is_read ?? false,
      created_at: item.created_at || new Date().toISOString(),
    };
    list.unshift(newNotif);
    this.setItem(STORAGE_KEYS.NOTIFICATIONS, list);
    return newNotif;
  }

  markNotificationRead(id) {
    const list = this.getItem(STORAGE_KEYS.NOTIFICATIONS, []);
    const idx = list.findIndex((n) => n.id === id);
    if (idx >= 0) {
      list[idx] = { ...list[idx], is_read: true, read_at: new Date().toISOString() };
      this.setItem(STORAGE_KEYS.NOTIFICATIONS, list);
      return list[idx];
    }
    return null;
  }

  markAllNotificationsRead(userId) {
    const list = this.getItem(STORAGE_KEYS.NOTIFICATIONS, []);
    const normalized = userId ? this.normalizeUserId(userId) : null;
    const updated = list.map((n) => {
      if (!normalized || this.normalizeUserId(n.user_id) === normalized) {
        return { ...n, is_read: true, read_at: new Date().toISOString() };
      }
      return n;
    });
    this.setItem(STORAGE_KEYS.NOTIFICATIONS, updated);
    return true;
  }

  // --- AUTOMATED SMS REMINDER SYSTEM ---
  getSmsSettings() {
    let settings = this.getItem(STORAGE_KEYS.SMS_SETTINGS, null);
    if (!settings || typeof settings !== 'object') {
      settings = { ...INITIAL_SMS_SETTINGS };
      this.setItem(STORAGE_KEYS.SMS_SETTINGS, settings);
    }
    return settings;
  }

  saveSmsSettings(newSettings) {
    const current = this.getSmsSettings();
    const updated = {
      ...current,
      ...newSettings,
      updated_at: new Date().toISOString(),
    };
    this.setItem(STORAGE_KEYS.SMS_SETTINGS, updated);
    this.pushToServer({ [STORAGE_KEYS.SMS_SETTINGS]: updated }).catch(() => {});
    return updated;
  }

  getSmsDevices() {
    let list = this.getItem(STORAGE_KEYS.SMS_DEVICES, null);
    if (!Array.isArray(list) || list.length === 0) {
      list = [...INITIAL_SMS_DEVICES];
      this.setItem(STORAGE_KEYS.SMS_DEVICES, list);
    }
    return list;
  }

  saveSmsDevice(deviceData) {
    const list = this.getSmsDevices();
    const isNew = !deviceData.id;
    const device = {
      id: deviceData.id || `dev-${deviceData.device_role || 'device'}-${Date.now()}`,
      name: deviceData.name || 'Android SMS Gateway',
      device_role: deviceData.device_role || 'primary',
      gateway_url: deviceData.gateway_url || '',
      api_token: deviceData.api_token || '',
      is_active: deviceData.is_active !== undefined ? deviceData.is_active : true,
      status: deviceData.status || 'offline',
      last_seen_at: deviceData.last_seen_at || null,
      last_error: deviceData.last_error || null,
      phone_number: deviceData.phone_number || '',
      battery_level: deviceData.battery_level || null,
      updated_at: new Date().toISOString(),
      created_at: deviceData.created_at || new Date().toISOString(),
    };

    const idx = list.findIndex((d) => d.id === device.id || d.device_role === device.device_role);
    if (idx >= 0) {
      list[idx] = { ...list[idx], ...device };
    } else {
      list.push(device);
    }
    this.setItem(STORAGE_KEYS.SMS_DEVICES, list);
    this.pushToServer({ [STORAGE_KEYS.SMS_DEVICES]: list }).catch(() => {});
    return device;
  }

  deleteSmsDevice(id) {
    const list = this.getSmsDevices().filter((d) => d.id !== id);
    this.setItem(STORAGE_KEYS.SMS_DEVICES, list);
    this.pushToServer({ [STORAGE_KEYS.SMS_DEVICES]: list }).catch(() => {});
    return true;
  }

  getSmsQueue() {
    return this.getItem(STORAGE_KEYS.SMS_QUEUE, []);
  }

  saveSmsQueueItem(item) {
    const list = this.getSmsQueue();
    const queueItem = {
      id: item.id || `sms-job-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      student_id: item.student_id,
      recipient_phone: item.recipient_phone,
      recipient_name: item.recipient_name || '',
      recipient_type: item.recipient_type || 'parent',
      message_text: item.message_text,
      amount_due: Number(item.amount_due || 0),
      course_name: item.course_name || '',
      group_name: item.group_name || '',
      due_date: item.due_date || null,
      status: item.status || 'pending',
      device_id: item.device_id || null,
      attempts: item.attempts || 0,
      max_attempts: item.max_attempts || 3,
      last_attempt_at: item.last_attempt_at || null,
      error_message: item.error_message || null,
      billing_period: item.billing_period || new Date().toISOString().slice(0, 7),
      idempotency_key: item.idempotency_key || `idemp-${item.student_id}-${item.billing_period || new Date().toISOString().slice(0, 7)}`,
      scheduled_at: item.scheduled_at || new Date().toISOString(),
      sent_at: item.sent_at || null,
      created_at: item.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const existingIdx = list.findIndex(
      (q) => q.id === queueItem.id || q.idempotency_key === queueItem.idempotency_key
    );

    if (existingIdx >= 0) {
      list[existingIdx] = { ...list[existingIdx], ...queueItem };
    } else {
      list.unshift(queueItem);
    }
    this.setItem(STORAGE_KEYS.SMS_QUEUE, list);
    this.pushToServer({ [STORAGE_KEYS.SMS_QUEUE]: list }).catch(() => {});
    return queueItem;
  }

  updateSmsQueueItem(id, updates) {
    const list = this.getSmsQueue();
    const idx = list.findIndex((q) => q.id === id);
    if (idx >= 0) {
      list[idx] = {
        ...list[idx],
        ...updates,
        updated_at: new Date().toISOString(),
      };
      this.setItem(STORAGE_KEYS.SMS_QUEUE, list);
      this.pushToServer({ [STORAGE_KEYS.SMS_QUEUE]: list }).catch(() => {});
      return list[idx];
    }
    return null;
  }

  deleteSmsQueueItem(id) {
    const list = this.getSmsQueue().filter((q) => q.id !== id);
    this.setItem(STORAGE_KEYS.SMS_QUEUE, list);
    this.pushToServer({ [STORAGE_KEYS.SMS_QUEUE]: list }).catch(() => {});
    return true;
  }

  getSmsLogs() {
    return this.getItem(STORAGE_KEYS.SMS_LOGS, []);
  }

  addSmsLog(logData) {
    const list = this.getSmsLogs();
    const newLog = {
      id: logData.id || `sms-log-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      queue_id: logData.queue_id || null,
      device_id: logData.device_id || null,
      recipient_phone: logData.recipient_phone,
      recipient_name: logData.recipient_name || '',
      status: logData.status || 'sent',
      response_payload: logData.response_payload || {},
      error_details: logData.error_details || null,
      created_at: new Date().toISOString(),
    };
    list.unshift(newLog);
    if (list.length > 500) list.pop(); // Keep last 500 logs
    this.setItem(STORAGE_KEYS.SMS_LOGS, list);
    this.pushToServer({ [STORAGE_KEYS.SMS_LOGS]: list }).catch(() => {});
    return newLog;
  }
}

export const localStore = new LocalStore();

if (typeof window !== 'undefined' && (typeof process === 'undefined' || process.env?.NODE_ENV !== 'test')) {
  // 1. Cross-tab instant BroadcastChannel (0ms in same browser)
  try {
    if ('BroadcastChannel' in window) {
      const channel = new BroadcastChannel('educo_realtime_bus');
      window.__educoBroadcastChannel = channel;
      channel.onmessage = (event) => {
        if (event.data && event.data.type === 'STORE_UPDATE') {
          localStore.applyIncomingData({ [event.data.key]: event.data.value });
        }
      };
    }
  } catch (_) {}

  // 2. Realtime Server-Sent Events (SSE) Stream across all network devices
  let sseSource = null;
  const connectSSE = () => {
    try {
      if (sseSource) {
        sseSource.close();
      }
      sseSource = new EventSource('/api/realtime-stream');
      sseSource.onmessage = (e) => {
        try {
          const parsed = JSON.parse(e.data);
          if (parsed && parsed.payload) {
            localStore.applyIncomingData(parsed.payload);
          }
        } catch (_) {}
      };
      sseSource.onerror = () => {
        if (sseSource) {
          sseSource.close();
          sseSource = null;
        }
        setTimeout(connectSSE, 3000);
      };
    } catch (_) {
      setTimeout(connectSSE, 4000);
    }
  };

  setTimeout(connectSSE, 150);

  // 3. Initial sync and periodic 2.5s fallback poll
  setTimeout(() => {
    localStore.syncWithServer().catch(() => {});
  }, 100);

  setInterval(() => {
    localStore.syncWithServer().catch(() => {});
  }, 2500);

  window.addEventListener('focus', () => {
    localStore.syncWithServer().catch(() => {});
  });
}

export default localStore;

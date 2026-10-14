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
};

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
    id: 'usr-student-1',
    username: 'student_jasur',
    first_name: 'Jasur',
    last_name: 'Rustamov',
    fullName: 'Jasur Rustamov',
    role: 'student',
    email: 'student@educo.app',
    phone: '+998905556677',
    father_phone: '+998905551122',
    mother_phone: '+998905553344',
    password: 'Jasur#2026!',
    password_updated_at: new Date(Date.now() - 20 * 86400000).toISOString(),
    is_active: true,
    created_at: new Date(Date.now() - 20 * 86400000).toISOString(),
  },
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
    enrolled_count: 3,
    status: 'active',
    schedule: 'Dush-Chor-Jum, 18:00 - 20:00',
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
    enrolled_count: 2,
    status: 'active',
    schedule: 'Sesh-Pay-Shan, 15:00 - 17:00',
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
    enrolled_count: 3,
    status: 'active',
    schedule: 'Dush-Chor-Jum, 14:00 - 16:00',
    created_at: new Date(Date.now() - 15 * 86400000).toISOString(),
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
];

class LocalStore {
  getItem(key, defaultValue) {
    try {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : defaultValue;
    } catch {
      return defaultValue;
    }
  }

  setItem(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      console.warn('LocalStore save warning:', e);
    }
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
    const raw = this.getItem(STORAGE_KEYS.USERS, INITIAL_USERS);
    let needsCleanup = false;
    const migratedAvatars = {};

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
      const defaultRef = INITIAL_USERS.find((init) => init.id === u.id || init.username === u.username);
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
    return this.getItem(STORAGE_KEYS.GROUPS, INITIAL_GROUPS);
  }

  saveGroup(groupData) {
    const list = this.getGroups();
    const newGroup = {
      id: groupData.id || `grp-${Date.now()}`,
      name: groupData.name,
      code: groupData.code || `GRP-${Math.floor(1000 + Math.random() * 9000)}`,
      course_id: groupData.course_id || groupData.courseId || '',
      course_name: groupData.course_name || groupData.courseName || '',
      teacher_id: groupData.teacher_id || groupData.teacherId || '',
      teacher_name: groupData.teacher_name || groupData.teacherName || '',
      room: groupData.room || '101-xona',
      capacity: Number(groupData.capacity || 15),
      enrolled_count: Number(groupData.enrolled_count || 0),
      status: groupData.status || 'active',
      schedule: groupData.schedule || 'Dush-Chor-Jum, 18:00 - 20:00',
      created_at: groupData.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const index = list.findIndex((g) => g.id === newGroup.id);
    if (index >= 0) {
      list[index] = { ...list[index], ...newGroup };
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

  // --- ATTENDANCE ---
  getAttendance() {
    return this.getItem(STORAGE_KEYS.ATTENDANCE, []);
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
    return recs;
  }

  // --- GRADES ---
  getGrades() {
    return this.getItem(STORAGE_KEYS.GRADES, []);
  }

  saveGrade(gradeData) {
    const list = this.getGrades();
    const newGrade = {
      id: gradeData.id || `grd-${Date.now()}`,
      student_id: gradeData.student_id || gradeData.studentId,
      student_name: gradeData.student_name || gradeData.studentName || 'Student',
      group_id: gradeData.group_id || gradeData.groupId,
      teacher_id: gradeData.teacher_id || gradeData.teacherId,
      grade_value: Number(gradeData.grade_value || gradeData.grade || gradeData.score || 5),
      topic: gradeData.topic || 'Dars vazifasi',
      feedback: gradeData.feedback || '',
      created_at: new Date().toISOString(),
    };
    list.unshift(newGrade);
    this.setItem(STORAGE_KEYS.GRADES, list);
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
    const raw = this.getItem(STORAGE_KEYS.CHAT_MESSAGES, this.getInitialChatMessages());
    const users = this.getUsers();

    const enriched = raw.map((m) => {
      const normalizedSenderId = this.normalizeUserId(m.sender_id);
      const senderUser = users.find((u) => u.id === normalizedSenderId || u.id === m.sender_id);
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
    };

    list.push(newMsg);
    this.setItem(STORAGE_KEYS.CHAT_MESSAGES, list);

    // Return enriched message
    const all = this.getChatMessages(msgData.group_id);
    return all.find((m) => m.id === newMsg.id) || newMsg;
  }

  deleteChatMessage(messageId) {
    const list = this.getItem(STORAGE_KEYS.CHAT_MESSAGES, this.getInitialChatMessages()).filter(
      (m) => m.id !== messageId
    );
    this.setItem(STORAGE_KEYS.CHAT_MESSAGES, list);
    return true;
  }
}

export const localStore = new LocalStore();
export default localStore;

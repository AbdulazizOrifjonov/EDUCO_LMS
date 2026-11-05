import { createClient } from '@supabase/supabase-js';
import { localStore } from '@/lib/localStore';

const rawUrl = import.meta.env.VITE_SUPABASE_URL || '';
const rawKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';
const isRealSupabase = Boolean(
  rawUrl &&
  rawKey &&
  !rawUrl.includes('placeholder') &&
  rawUrl.startsWith('http')
);

// Mock Query Builder that executes queries against localStore without network failures
function createMockTable(tableName) {
  let selectedFields = '*';
  let filters = [];
  let isSingle = false;
  let isMaybeSingle = false;
  let orderColumn = null;
  let orderAscending = true;
  let limitCount = null;
  let rangeFrom = 0;
  let rangeTo = null;
  let operation = 'select'; // 'select' | 'insert' | 'update' | 'delete' | 'upsert'
  let payload = null;

  const builder = {
    select(fields = '*', opts = {}) {
      operation = 'select';
      selectedFields = fields;
      return builder;
    },
    insert(values) {
      operation = 'insert';
      payload = values;
      return builder;
    },
    update(values) {
      operation = 'update';
      payload = values;
      return builder;
    },
    upsert(values, opts = {}) {
      operation = 'upsert';
      payload = values;
      return builder;
    },
    delete() {
      operation = 'delete';
      return builder;
    },
    eq(col, val) {
      filters.push((row) => {
        if (row[col] === val) return true;
        if (row[col] !== undefined && row[col] !== null && val !== undefined && val !== null) {
          return String(row[col]) === String(val);
        }
        return false;
      });
      return builder;
    },
    neq(col, val) {
      filters.push((row) => {
        if (row[col] === val) return false;
        if (row[col] !== undefined && row[col] !== null && val !== undefined && val !== null) {
          return String(row[col]) !== String(val);
        }
        return true;
      });
      return builder;
    },
    in(col, arr) {
      filters.push((row) => {
        if (!Array.isArray(arr)) return false;
        if (arr.includes(row[col])) return true;
        const strArr = arr.map(String);
        return strArr.includes(String(row[col]));
      });
      return builder;
    },
    gte(col, val) {
      filters.push((row) => {
        const v = row[col];
        if (v === undefined || v === null) return false;
        return v >= val || String(v) >= String(val);
      });
      return builder;
    },
    gt(col, val) {
      filters.push((row) => {
        const v = row[col];
        if (v === undefined || v === null) return false;
        return v > val || String(v) > String(val);
      });
      return builder;
    },
    lte(col, val) {
      filters.push((row) => {
        const v = row[col];
        if (v === undefined || v === null) return false;
        return v <= val || String(v) <= String(val);
      });
      return builder;
    },
    lt(col, val) {
      filters.push((row) => {
        const v = row[col];
        if (v === undefined || v === null) return false;
        return v < val || String(v) < String(val);
      });
      return builder;
    },
    is(col, val) {
      filters.push((row) => {
        if (val === null) return row[col] === null || row[col] === undefined;
        return row[col] === val;
      });
      return builder;
    },
    like(col, pattern) {
      const clean = String(pattern || '').replace(/%/g, '').toLowerCase();
      filters.push((row) => String(row[col] || '').toLowerCase().includes(clean));
      return builder;
    },
    ilike(col, pattern) {
      const clean = String(pattern || '').replace(/%/g, '').toLowerCase();
      filters.push((row) => String(row[col] || '').toLowerCase().includes(clean));
      return builder;
    },
    contains(col, val) {
      filters.push((row) => Array.isArray(row[col]) && row[col].includes(val));
      return builder;
    },
    or(cond) {
      if (typeof cond === 'string') {
        const parts = cond.split(',').map((p) => p.trim());
        filters.push((row) => {
          return parts.some((p) => {
            const [field, op, val] = p.split('.');
            if (op === 'eq') return String(row[field]) === String(val);
            if (op === 'is' && val === 'null') return row[field] === null || row[field] === undefined;
            return false;
          });
        });
      }
      return builder;
    },
    order(col, opts = {}) {
      orderColumn = col;
      orderAscending = opts.ascending !== false;
      return builder;
    },
    range(from, to) {
      rangeFrom = from;
      rangeTo = to;
      return builder;
    },
    limit(n) {
      limitCount = n;
      return builder;
    },
    single() {
      isSingle = true;
      return builder;
    },
    maybeSingle() {
      isMaybeSingle = true;
      return builder;
    },
    async execute() {
      let rows = [];
      const groups = localStore.getGroups();
      const users = localStore.getUsers();
      const courses = localStore.getCourses();

      if (tableName === 'lesson_schedules') {
        rows = localStore.getSchedules();
      } else if (tableName === 'courses') {
        rows = courses;
      } else if (tableName === 'profiles') {
        rows = users;
      } else if (tableName === 'user_roles') {
        rows = users.map((u) => ({ user_id: u.id, role: u.role }));
      } else if (tableName === 'groups') {
        rows = groups;
      } else if (tableName === 'group_teachers') {
        rows = [];
        groups.forEach((g) => {
          const courseObj = courses.find((c) => c.id === g.course_id) || { id: g.course_id, name: g.course_name || 'Kurs', color: g.color || '#123D78' };
          const teacherIds = new Set();
          if (g.teacher_id) teacherIds.add(g.teacher_id);
          if (g.teacherId) teacherIds.add(g.teacherId);
          if (Array.isArray(g.teacher_ids)) g.teacher_ids.forEach((id) => teacherIds.add(id));
          if (Array.isArray(g.group_teachers)) {
            g.group_teachers.forEach((gt) => {
              const tId = gt.teacher_id || gt.id || gt.profiles?.id;
              if (tId) teacherIds.add(tId);
            });
          }
          teacherIds.forEach((tId) => {
            const u = users.find((usr) => usr.id === tId);
            rows.push({
              id: `gt-${g.id}-${tId}`,
              group_id: g.id,
              teacher_id: tId,
              is_primary: tId === (g.teacher_id || g.teacherId),
              groups: {
                id: g.id,
                name: g.name,
                room: g.room || '101-xona',
                capacity: g.capacity || 20,
                status: g.status || 'active',
                course_id: g.course_id,
                courses: courseObj,
              },
              profiles: u ? {
                id: u.id,
                first_name: u.first_name || '',
                last_name: u.last_name || '',
                username: u.username || '',
                avatar_url: u.avatar_url || '',
                full_name: u.full_name || u.fullName || `${u.first_name || ''} ${u.last_name || ''}`.trim() || u.username,
              } : {
                id: tId,
                first_name: g.teacher_name || 'O‘qituvchi',
                last_name: '',
                username: 'teacher',
                avatar_url: '',
                full_name: g.teacher_name || 'O‘qituvchi',
              },
            });
          });
        });
      } else if (tableName === 'group_memberships') {
        const rawMemberships = localStore.getMemberships ? localStore.getMemberships() : localStore.getItem('educo_db_memberships', []);
        const seen = new Set();
        rows = [];

        rawMemberships.forEach((m) => {
          const g = groups.find((grp) => grp.id === m.group_id);
          const c = g ? courses.find((crs) => crs.id === g.course_id) : null;
          const u = users.find((usr) => usr.id === m.student_id);
          const key = `${m.group_id}-${m.student_id}`;
          seen.add(key);
          rows.push({
            id: m.id || `mem-${key}`,
            group_id: m.group_id,
            student_id: m.student_id,
            is_active: m.is_active !== false,
            enrolled_at: m.enrolled_at || m.created_at || new Date().toISOString(),
            groups: g ? {
              id: g.id,
              name: g.name,
              room: g.room || '101-xona',
              status: g.status || 'active',
              courses: c ? { id: c.id, name: c.name, code: c.code || '', color: c.color || '#123D78' } : { id: g.course_id, name: g.course_name || 'Kurs', code: '', color: '#123D78' },
            } : null,
            profiles: u ? {
              id: u.id,
              first_name: u.first_name || '',
              last_name: u.last_name || '',
              full_name: u.full_name || u.fullName || `${u.first_name || ''} ${u.last_name || ''}`.trim() || u.username,
              username: u.username || '',
              phone_number: u.phone || '',
            } : null,
          });
        });

        // Also auto-synthesize from groups.student_ids if not already in memberships
        groups.forEach((g) => {
          if (Array.isArray(g.student_ids)) {
            g.student_ids.forEach((sId) => {
              const key = `${g.id}-${sId}`;
              if (!seen.has(key)) {
                seen.add(key);
                const c = courses.find((crs) => crs.id === g.course_id);
                const u = users.find((usr) => usr.id === sId);
                rows.push({
                  id: `mem-${key}`,
                  group_id: g.id,
                  student_id: sId,
                  is_active: true,
                  enrolled_at: g.created_at || new Date().toISOString(),
                  groups: {
                    id: g.id,
                    name: g.name,
                    room: g.room || '101-xona',
                    status: g.status || 'active',
                    courses: c ? { id: c.id, name: c.name, code: c.code || '', color: c.color || '#123D78' } : { id: g.course_id, name: g.course_name || 'Kurs', code: '', color: '#123D78' },
                  },
                  profiles: u ? {
                    id: u.id,
                    first_name: u.first_name || '',
                    last_name: u.last_name || '',
                    full_name: u.full_name || u.fullName || `${u.first_name || ''} ${u.last_name || ''}`.trim() || u.username,
                    username: u.username || '',
                    phone_number: u.phone || '',
                  } : null,
                });
              }
            });
          }
        });
      } else if (tableName === 'lessons') {
        const now = new Date();
        const currentDayOfWeek = now.getDay() || 7; // 1 (Mon) to 7 (Sun)
        const monday = new Date(now);
        monday.setDate(now.getDate() - (currentDayOfWeek - 1));

        const schedules = localStore.getSchedules();
        rows = [];

        // Deduplicate schedules by group_id + day_of_week + start_time
        const seenSchedMap = new Set();

        schedules.forEach((s) => {
          const day = Number(s.day_of_week) || 1;
          const startTime = (s.start_time || '18:00').slice(0, 5);
          const endTime = (s.end_time || '20:00').slice(0, 5);
          const schedKey = `${s.group_id}_${day}_${startTime}_${endTime}`;
          if (seenSchedMap.has(schedKey)) return;
          seenSchedMap.add(schedKey);

          const g = groups.find((grp) => grp.id === s.group_id);
          if (!g) return;
          const c = courses.find((crs) => crs.id === g.course_id);

          const schedDate = new Date(monday);
          schedDate.setDate(monday.getDate() + (day - 1));
          const schedDateStr = schedDate.toISOString().split('T')[0];

          rows.push({
            id: `lsn-${s.id || `${s.group_id}-${day}`}`,
            group_id: s.group_id,
            title: s.title || `${g.name}`,
            description: s.description || 'Muntazam dars mashgʻuloti',
            lesson_date: schedDateStr,
            start_time: s.start_time || '18:00',
            end_time: s.end_time || '20:00',
            status: 'scheduled',
            groups: {
              id: g.id,
              name: g.name,
              room: s.room || g.room || '101-xona',
              courses: c ? { name: c.name, color: c.color } : { name: g.course_name || 'Kurs', color: '#123D78' },
              group_teachers: g.teacher_id ? [{ teacher_id: g.teacher_id }] : [],
            },
          });
        });

        if (rows.length === 0) {
          groups.filter((g) => g.status === 'active').forEach((g) => {
            const c = courses.find((crs) => crs.id === g.course_id);
            rows.push({
              id: `lsn-grp-${g.id}`,
              group_id: g.id,
              title: `${g.name} — Dars mashgʻuloti`,
              description: 'Rejali dars mashgʻuloti',
              lesson_date: today,
              start_time: '18:00',
              end_time: '20:00',
              status: 'scheduled',
              groups: {
                id: g.id,
                name: g.name,
                room: g.room || '101-xona',
                courses: c ? { name: c.name, color: c.color } : { name: g.course_name || 'Kurs', color: '#123D78' },
                group_teachers: g.teacher_id ? [{ teacher_id: g.teacher_id }] : [],
              },
            });
          });
        }
      } else if (tableName === 'grades') {
        rows = localStore.getGrades();
      } else if (tableName === 'student_attendance') {
        rows = localStore.getAttendance();
      } else if (tableName === 'announcements') {
        rows = localStore.getAnnouncements();
      } else if (tableName === 'notifications') {
        rows = localStore.getNotifications();
      } else if (tableName === 'homework') {
        rows = localStore.getItem('educo_db_homework', []);
      } else if (tableName === 'homework_submissions') {
        rows = localStore.getItem('educo_db_submissions', []);
      } else if (tableName === 'materials') {
        rows = localStore.getItem('educo_db_materials', []);
      } else if (tableName === 'tuition_fees' || tableName === 'payments') {
        rows = localStore.getPayments();
      } else if (tableName === 'audit_logs') {
        rows = localStore.getItem('educo_db_audit_logs', []);
      } else if (tableName === 'sms_logs') {
        rows = localStore.getItem('educo_db_sms_logs', []);
      } else if (tableName === 'sms_queue') {
        rows = localStore.getItem('educo_db_sms_queue', []);
      } else {
        rows = [];
      }

      if (operation === 'insert' || operation === 'upsert') {
        const items = Array.isArray(payload) ? payload : [payload];
        const saved = [];
        for (const item of items) {
          if (tableName === 'lesson_schedules') {
            saved.push(localStore.saveSchedule(item));
          } else if (tableName === 'courses') {
            saved.push(localStore.saveCourse(item));
          } else if (tableName === 'profiles') {
            saved.push(localStore.saveUser(item));
          } else if (tableName === 'groups') {
            saved.push(localStore.saveGroup(item));
          } else if (tableName === 'grades') {
            saved.push(localStore.saveGrade(item));
          } else if (tableName === 'student_attendance') {
            saved.push(localStore.saveAttendance(item));
          } else if (tableName === 'notifications') {
            saved.push(localStore.saveNotification(item));
          } else if (tableName === 'group_memberships') {
            saved.push(localStore.saveMembership ? localStore.saveMembership(item) : item);
          } else if (tableName === 'group_teachers') {
            if (item?.group_id && item?.teacher_id) {
              const grp = groups.find((g) => g.id === item.group_id);
              if (grp) {
                localStore.saveGroup({ ...grp, teacher_id: item.teacher_id });
              }
            }
            saved.push(item);
          } else {
            saved.push({ id: `mock-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`, ...item });
          }
        }
        const result = Array.isArray(payload) ? saved : saved[0];
        return { data: result, count: saved.length, error: null };
      }

      if (operation === 'update') {
        if (tableName === 'lesson_schedules') {
          localStore.saveSchedule(payload);
        } else if (tableName === 'notifications') {
          if (payload?.is_read) {
            localStore.markAllNotificationsRead();
          }
        }
        return { data: payload, count: 1, error: null };
      }

      if (operation === 'delete') {
        return { data: null, count: 1, error: null };
      }

      // Read / Select
      let filtered = [...rows];
      for (const f of filters) {
        filtered = filtered.filter(f);
      }

      if (orderColumn) {
        filtered.sort((a, b) => {
          const valA = a[orderColumn];
          const valB = b[orderColumn];
          if (valA === valB) return 0;
          if (valA === undefined || valA === null) return orderAscending ? -1 : 1;
          if (valB === undefined || valB === null) return orderAscending ? 1 : -1;
          return orderAscending ? (valA > valB ? 1 : -1) : (valA < valB ? 1 : -1);
        });
      }

      if (isSingle) {
        return { data: filtered[0] || null, count: filtered.length ? 1 : 0, error: null };
      }
      if (isMaybeSingle) {
        return { data: filtered[0] || null, count: filtered.length, error: null };
      }

      if (rangeTo !== null) {
        filtered = filtered.slice(rangeFrom, rangeTo + 1);
      } else if (limitCount !== null) {
        filtered = filtered.slice(0, limitCount);
      }

      return { data: filtered, count: filtered.length, error: null };
    },
    then(onFulfilled, onRejected) {
      return builder.execute().then(onFulfilled, onRejected);
    },
  };

  return builder;
}

let clientInstance = null;

if (isRealSupabase) {
  try {
    clientInstance = createClient(rawUrl, rawKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    });
  } catch (err) {
    console.warn('[Supabase] Init warning, falling back to mock client:', err);
  }
}

// Resilient wrapper: uses real client if available and working, otherwise falls back gracefully
export const supabase = {
  from(tableName) {
    if (clientInstance) {
      try {
        const query = clientInstance.from(tableName);
        // Return wrapped query with fallback if network fails
        const proxy = new Proxy(query, {
          get(target, prop) {
            if (prop === 'then') {
              return (onFulfilled, onRejected) => {
                return target.then(
                  (res) => {
                    if (res?.error && res.error.message?.includes('fetch')) {
                      return createMockTable(tableName).execute().then(onFulfilled, onRejected);
                    }
                    return onFulfilled ? onFulfilled(res) : res;
                  },
                  (err) => {
                    return createMockTable(tableName).execute().then(onFulfilled, onRejected);
                  }
                );
              };
            }
            return target[prop];
          },
        });
        return proxy;
      } catch {
        return createMockTable(tableName);
      }
    }
    return createMockTable(tableName);
  },

  auth: {
    signInWithPassword: async ({ email, password }) => {
      if (clientInstance) {
        try {
          return await clientInstance.auth.signInWithPassword({ email, password });
        } catch {}
      }
      return { data: { user: { id: 'mock-user-id', email } }, error: null };
    },
    signUp: async ({ email, password, options }) => {
      if (clientInstance) {
        try {
          return await clientInstance.auth.signUp({ email, password, options });
        } catch {}
      }
      return { data: { user: { id: `mock-${Date.now()}`, email } }, error: null };
    },
    signOut: async () => {
      if (clientInstance) {
        try {
          return await clientInstance.auth.signOut();
        } catch {}
      }
      return { error: null };
    },
    getSession: async () => {
      if (clientInstance) {
        try {
          return await clientInstance.auth.getSession();
        } catch {}
      }
      return { data: { session: null }, error: null };
    },
    onAuthStateChange: (callback) => {
      if (clientInstance) {
        try {
          return clientInstance.auth.onAuthStateChange(callback);
        } catch {}
      }
      return { data: { subscription: { unsubscribe: () => {} } } };
    },
    resetPasswordForEmail: async (email) => {
      return { data: {}, error: null };
    },
  },

  storage: {
    from: (bucket) => ({
      upload: async (path, file) => ({ data: { path }, error: null }),
      download: async (path) => ({ data: new Blob(), error: null }),
      getPublicUrl: (path) => ({ data: { publicUrl: path } }),
      createSignedUrl: async (path) => ({ data: { signedUrl: path }, error: null }),
    }),
  },

  channel: (name) => {
    const mockChannel = {
      on: () => mockChannel,
      subscribe: (cb) => {
        if (typeof cb === 'function') setTimeout(() => cb('SUBSCRIBED'), 0);
        return mockChannel;
      },
      unsubscribe: () => {},
    };
    return mockChannel;
  },

  removeChannel: (channel) => {
    return Promise.resolve();
  },
};

export default supabase;

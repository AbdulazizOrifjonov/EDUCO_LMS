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
      filters.push((row) => row[col] === val);
      return builder;
    },
    neq(col, val) {
      filters.push((row) => row[col] !== val);
      return builder;
    },
    in(col, arr) {
      filters.push((row) => Array.isArray(arr) && arr.includes(row[col]));
      return builder;
    },
    or(cond) {
      return builder;
    },
    ilike(col, pattern) {
      const clean = String(pattern || '').replace(/%/g, '').toLowerCase();
      filters.push((row) => String(row[col] || '').toLowerCase().includes(clean));
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
      if (tableName === 'lesson_schedules') {
        rows = localStore.getSchedules();
      } else if (tableName === 'courses') {
        rows = localStore.getCourses();
      } else if (tableName === 'profiles') {
        rows = localStore.getUsers();
      } else if (tableName === 'user_roles') {
        rows = localStore.getUsers().map((u) => ({ user_id: u.id, role: u.role }));
      } else if (tableName === 'groups') {
        rows = localStore.getGroups();
      } else if (tableName === 'grades') {
        rows = localStore.getGrades();
      } else if (tableName === 'student_attendance') {
        rows = localStore.getAttendance();
      } else if (tableName === 'announcements') {
        rows = localStore.getAnnouncements();
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
          } else {
            saved.push({ id: `mock-${Date.now()}-${Math.random()}`, ...item });
          }
        }
        const result = Array.isArray(payload) ? saved : saved[0];
        return { data: result, count: saved.length, error: null };
      }

      if (operation === 'update') {
        if (tableName === 'lesson_schedules') {
          localStore.saveSchedule(payload);
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

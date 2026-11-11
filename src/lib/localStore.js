// Central local persistent store for EDUCO LMS
// Provides full offline/local storage for all entities

export const STORAGE_KEYS = {
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
  WEBSITE_SETTINGS: 'educo_db_website_settings',
  WEBSITE_SLIDES: 'educo_db_website_slides',
  WEBSITE_COURSES: 'educo_db_website_courses',
  WEBSITE_SUBJECTS: 'educo_db_website_subjects',
  WEBSITE_TEACHERS: 'educo_db_website_teachers',
  WEBSITE_GALLERY: 'educo_db_website_gallery',
  WEBSITE_VIDEOS: 'educo_db_website_videos',
  WEBSITE_NEWS: 'educo_db_website_news',
  WEBSITE_TESTIMONIALS: 'educo_db_website_testimonials',
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
    name: 'Asosiy Android Gateway (SMS Gate Cloud)',
    device_role: 'primary',
    gateway_url: 'https://api.sms-gate.app/3rdparty/v1/messages',
    api_token: 'EMTIDA:3x7k46xkpavev_',
    is_active: true,
    status: 'online',
    last_seen_at: new Date().toISOString(),
    last_error: null,
    phone_number: '+998 93 582 17 74',
    created_at: new Date().toISOString(),
  },
  {
    id: 'dev-backup-2',
    name: 'Zaxira Android Gateway (SMS Gate Cloud)',
    device_role: 'backup',
    gateway_url: 'https://api.sms-gate.app/3rdparty/v1/messages',
    api_token: 'EMTIDA:3x7k46xkpavev_',
    is_active: false,
    status: 'offline',
    last_seen_at: null,
    last_error: null,
    phone_number: '+998 93 582 17 74',
    created_at: new Date().toISOString(),
  },
];

const INITIAL_COURSES = [];

const INITIAL_USERS = [
  {
    id: 'usr-owner-1',
    username: 'abbosbek',
    first_name: 'Abbosbek',
    last_name: 'Boshqaruvchi',
    fullName: 'Abbosbek',
    full_name: 'Abbosbek',
    role: 'owner',
    email: 'abbosbek@educo.app',
    phone: '+998 98 800 14 15',
    password: 'AbbosBek1415',
    password_updated_at: '2026-10-31T10:12:20.835Z',
    is_active: true,
    created_at: '2026-10-31T10:12:20.835Z',
    avatar_url: '',
  },
  {
    id: 'usr-1793463763683',
    username: 'abdulazizbek_orifjonov',
    first_name: 'Abdulazizbek',
    last_name: 'Orifjonov',
    fullName: 'Abdulazizbek Orifjonov',
    full_name: 'Abdulazizbek Orifjonov',
    role: 'teacher',
    is_mentor: true,
    title: 'Mentor',
    display_role: 'mentor',
    specialty: 'Full Stack',
    subject: 'Full Stack',
    email: 'abdulazizbek_orifjonov@educo.app',
    phone: '+998 93 582 17 74',
    password: 'Hbwy%22A7',
    password_updated_at: '2026-10-31T16:22:43.684Z',
    is_active: true,
    created_at: '2026-10-31T16:22:43.684Z',
    updated_at: '2026-10-31T16:22:43.684Z',
    avatar_url: '',
  },
  {
    id: 'usr-teacher-beknazarov',
    username: 'bexruz_beknazarov',
    first_name: 'Bexruz',
    last_name: 'Beknazarov',
    fullName: 'Beknazarov Bexruz',
    full_name: 'Beknazarov Bexruz',
    role: 'teacher',
    specialty: 'Matematika',
    subject: 'Matematika',
    email: 'bexruz_beknazarov@educo.app',
    phone: '+998 93 377 22 23',
    password: 'Bexruz#2223',
    password_updated_at: new Date().toISOString(),
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    avatar_url: '',
  },
  {
    id: 'usr-teacher-yusupjonova',
    username: 'umida_yusupjonova',
    first_name: 'Umida',
    last_name: 'Yusupjonova',
    fullName: 'Yusupjonova Umida Sunnatulloh qizi',
    full_name: 'Yusupjonova Umida Sunnatulloh qizi',
    role: 'teacher',
    specialty: 'Arab tili',
    subject: 'Arab tili',
    email: 'umida_yusupjonova@educo.app',
    phone: '+998 77 714 48 71',
    password: 'Umida#4871',
    password_updated_at: new Date().toISOString(),
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    avatar_url: '',
  },
  {
    id: 'usr-teacher-toshtemirova',
    username: 'madina_toshtemirova',
    first_name: 'Madina',
    last_name: 'Toshtemirova',
    fullName: 'Toshtemirova Madina Shuxrat qizi',
    full_name: 'Toshtemirova Madina Shuxrat qizi',
    role: 'teacher',
    specialty: 'Ingliz tili',
    subject: 'Ingliz tili',
    email: 'madina_toshtemirova@educo.app',
    phone: '+998 97 732 12 09',
    password: 'Madina#1209',
    password_updated_at: new Date().toISOString(),
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    avatar_url: '',
  },
  {
    id: 'usr-teacher-ismatova',
    username: 'shaxnoza_ismatova',
    first_name: 'Shaxnoza',
    last_name: 'Ismatova',
    fullName: 'Ismatova Shaxnoza',
    full_name: 'Ismatova Shaxnoza',
    role: 'teacher',
    specialty: 'Rus tili',
    subject: 'Rus tili',
    email: 'shaxnoza_ismatova@educo.app',
    phone: '+998 94 614 29 96',
    password: 'Shaxnoza#2996',
    password_updated_at: new Date().toISOString(),
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    avatar_url: '',
  },
  {
    id: 'usr-teacher-karimberdiyeva',
    username: 'fayoza_karimberdiyeva',
    first_name: 'Fayoza',
    last_name: 'Karimberdiyeva',
    fullName: 'Fayoza Karimberdiyeva',
    full_name: 'Fayoza Karimberdiyeva',
    role: 'teacher',
    specialty: 'Mental arifmetika',
    subject: 'Mental arifmetika',
    email: 'fayoza_karimberdiyeva@educo.app',
    phone: '+998 90 668 56 79',
    password: 'Fayoza#5679',
    password_updated_at: new Date().toISOString(),
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    avatar_url: '',
  },
  {
    id: 'usr-admin-erkinova',
    username: 'zilola_erkinova',
    first_name: 'Zilola',
    last_name: 'Erkinova',
    fullName: 'Erkinova Zilola',
    full_name: 'Erkinova Zilola',
    role: 'admin',
    specialty: 'Administrator',
    email: 'zilola_erkinova@educo.app',
    phone: '+998 99 900 56 15',
    password: 'Zilola#5615',
    password_updated_at: new Date().toISOString(),
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    avatar_url: '',
  },
];

const INITIAL_GROUPS = [];
const INITIAL_SCHEDULES = [];
const INITIAL_MEMBERSHIPS = [];
const INITIAL_PAYMENTS = [];

class LocalStore {
  constructor() {
    this.memoryStore = {};
    this._deletedIds = null;
    this._pendingOutbox = new Set();
    this.ensureCleanStart();
    this.startRealtimeEngine = this.startRealtimeEngine.bind(this);
  }

  _getDeletedIds() {
    if (this._deletedIds) return this._deletedIds;
    const baseBlacklist = ['usr-test-sync-1', 'test_sync_user', 'usr-1793596191113'];
    try {
      if (typeof window !== 'undefined' && window.localStorage?.getItem) {
        const raw = window.localStorage.getItem('educo_deleted_ids');
        if (raw) {
          const arr = JSON.parse(raw);
          if (Array.isArray(arr)) {
            this._deletedIds = new Set([...arr, ...baseBlacklist]);
            return this._deletedIds;
          }
        }
      }
    } catch (_) {}
    this._deletedIds = new Set(baseBlacklist);
    return this._deletedIds;
  }

  getDeletedIds() {
    return Array.from(this._getDeletedIds());
  }

  _recordDeletedId(id) {
    if (!id) return;
    const set = this._getDeletedIds();
    set.add(String(id));
    try {
      if (typeof window !== 'undefined' && window.localStorage?.setItem) {
        window.localStorage.setItem('educo_deleted_ids', JSON.stringify(Array.from(set)));
      }
    } catch (_) {}
    this.purgeDeletedRecords();
  }

  purgeDeletedRecords() {
    const deletedIds = this._getDeletedIds();
    if (!deletedIds || deletedIds.size === 0) return;
    const keysToClean = [
      STORAGE_KEYS.USERS,
      STORAGE_KEYS.GROUPS,
      STORAGE_KEYS.COURSES,
      STORAGE_KEYS.LESSON_SCHEDULES,
      STORAGE_KEYS.MEMBERSHIPS,
      STORAGE_KEYS.PAYMENTS,
      STORAGE_KEYS.MATERIALS,
      STORAGE_KEYS.REMINDERS,
      STORAGE_KEYS.ATTENDANCE,
    ];
    keysToClean.forEach((k) => {
      const list = this.getItem(k, null);
      if (Array.isArray(list)) {
        const cleaned = list.filter((item) => {
          if (!item || typeof item !== 'object') return false;
          const id = String(item.id || item.username || '');
          return !id || !deletedIds.has(id);
        });
        if (cleaned.length !== list.length) {
          this.memoryStore[k] = cleaned;
          try {
            if (typeof window !== 'undefined' && window.localStorage) {
              window.localStorage.setItem(k, JSON.stringify(cleaned));
            }
          } catch (_) {}
        }
      }
    });
  }

  clear() {
    this.memoryStore = {};
    try {
      if (typeof window !== 'undefined' && typeof window.localStorage?.clear === 'function') {
        window.localStorage.clear();
      }
    } catch (_) {}
  }

  ensureCleanStart() {
    // SAFE STARTUP: Never overwrite production or server data with dummy arrays!
    // Simply hydrate memoryStore if localStorage already has data, otherwise let incoming
    // server data from Cloudflare D1 arrive cleanly.
    try {
      if (typeof window !== 'undefined' && typeof window.localStorage?.getItem === 'function') {
        const existingUsers = window.localStorage.getItem(STORAGE_KEYS.USERS);
        if (existingUsers) {
          try {
            this.memoryStore[STORAGE_KEYS.USERS] = JSON.parse(existingUsers);
          } catch (_) {}
        }
      }
    } catch (_) {}
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

  _getDeviceId() {
    if (this._deviceId) return this._deviceId;
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        let id = window.localStorage.getItem('educo_device_id');
        if (!id) {
          id = 'dev_' + Date.now() + '_' + Math.random().toString(36).slice(2, 9);
          window.localStorage.setItem('educo_device_id', id);
        }
        this._deviceId = id;
        return this._deviceId;
      }
    } catch (_) {}
    this._deviceId = 'dev_' + Date.now() + '_' + Math.random().toString(36).slice(2, 9);
    return this._deviceId;
  }

  broadcastToCloud(key, value, deletedId = null) {
    if (typeof window === 'undefined' || typeof fetch === 'undefined') return;
    if (typeof process !== 'undefined' && (process.env?.NODE_ENV === 'test' || process.env?.VITEST)) return;

    // Cross-tab broadcast is already executed natively via BroadcastChannel (__educoBroadcastChannel).
    // Cloud synchronization is executed via pushToServer() to /api/sync-store.
    // External third-party unauthenticated calls (ntfy.sh, restful-api.dev) removed to eliminate
    // net::ERR_CONNECTION_RESET and socket drops.
  }

  connectCloudSSE() {
    // Disabled external EventSource to eliminate ERR_CONNECTION_RESET socket hang-ups.
    // Browser tabs stay synchronized in real time via BroadcastChannel and scheduled ETag-based /api/sync-store.
    if (this._cloudEventSource) {
      try {
        this._cloudEventSource.close();
      } catch (_) {}
      this._cloudEventSource = null;
    }
  }

  applyIncomingCloudKey(key, val, deletedId = null) {
    if (!key || val === undefined) return;
    if (deletedId) {
      this._recordDeletedId(deletedId);
    }
    this.memoryStore[key] = val;
    try {
      if (typeof window !== 'undefined' && typeof window.localStorage?.setItem === 'function') {
        window.localStorage.setItem(key, JSON.stringify(val));
      }
    } catch (_) {}

    // Pass through standard merge and event propagation
    this.applyIncomingData({ [key]: val });

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('educo-data-sync', { detail: { [key]: val } }));
      window.dispatchEvent(new CustomEvent('educo-store-update', { detail: { key, val } }));
      if (key.startsWith('educo_db_website_')) {
        window.dispatchEvent(new CustomEvent('educo-website-update', { detail: { key, val } }));
      }
      if (key === STORAGE_KEYS.USERS) {
        window.dispatchEvent(new CustomEvent('educo-users-update', { detail: { users: val } }));
      }
    }
  }

  async catchUpFromCloudBus() {
    if (typeof window === 'undefined' || typeof fetch === 'undefined') return;
    if (typeof process !== 'undefined' && (process.env?.NODE_ENV === 'test' || process.env?.VITEST)) return;

    // Direct synchronization with EDUCO LMS Edge Worker (/api/sync-store)
    try {
      await this.syncWithServer();
    } catch (_) {}
  }

  setItem(key, value, deletedId = null) {
    if (deletedId) {
      this._recordDeletedId(deletedId);
    }
    if (!this._pendingOutbox) this._pendingOutbox = new Set();
    this._pendingOutbox.add(key);
    this.memoryStore[key] = value;
    try {
      if (typeof window !== 'undefined' && typeof window.localStorage?.setItem === 'function') {
        window.localStorage.setItem(key, JSON.stringify(value));
      }
      this.pushToServer({ [key]: value, deletedId: deletedId || null }).catch(() => {});
      this.broadcastToCloud(key, value, deletedId);
      if (typeof window !== 'undefined' && window.__educoBroadcastChannel) {
        window.__educoBroadcastChannel.postMessage({ type: 'STORE_UPDATE', key, value, deletedId });
      }
    } catch (e) {
      // In-memory fallback is already active
    }
  }

  applyIncomingData(serverData) {
    if (!serverData || typeof serverData !== 'object') return;

    if (Array.isArray(serverData._deleted_ids)) {
      const set = this._getDeletedIds();
      serverData._deleted_ids.forEach((id) => set.add(String(id)));
      try {
        if (typeof window !== 'undefined' && window.localStorage?.setItem) {
          window.localStorage.setItem('educo_deleted_ids', JSON.stringify(Array.from(set)));
        }
      } catch (_) {}
    }

    let hasChatChanges = false;
    let hasNotifChanges = false;
    let hasGeneralChanges = false;
    const deletedIds = this._getDeletedIds();
    const pushBackPayload = {};
    let needsPushBack = false;

    Object.values(STORAGE_KEYS).forEach((key) => {
      const serverVal = serverData[key];
      if (serverVal === undefined || serverVal === null) return;

      if (!Array.isArray(serverVal)) {
        const localVal = this.getItem(key, null);
        const localStr = JSON.stringify(localVal);
        const serverStr = JSON.stringify(serverVal);
        if (localStr !== serverStr) {
          this.memoryStore[key] = serverVal;
          try {
            if (typeof window !== 'undefined' && typeof window.localStorage?.setItem === 'function') {
              window.localStorage.setItem(key, serverStr);
            }
          } catch (_) {}
          hasGeneralChanges = true;
          if (key.startsWith('educo_db_website_') && typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('educo-website-update'));
          }
        }
        return;
      }

      const localVal = this.getItem(key, []);
      const hasLocalPendingWrites = this._pendingOutbox && this._pendingOutbox.has(key);

      // If local device has NO uncommitted writes for this key, SERVER IS 100% AUTHORITATIVE!
      // This eliminates the deletion resurrection bug across gadgets.
      if (!hasLocalPendingWrites) {
        const cleanServerList = serverVal.filter((sItem) => {
          if (!sItem || typeof sItem !== 'object') return false;
          const itemId = String(sItem.id || sItem.username || '');
          return !itemId || !deletedIds.has(itemId);
        });

        const localStr = JSON.stringify(localVal);
        const serverStr = JSON.stringify(cleanServerList);

        if (localStr !== serverStr) {
          this.memoryStore[key] = cleanServerList;
          try {
            if (typeof window !== 'undefined' && typeof window.localStorage?.setItem === 'function') {
              window.localStorage.setItem(key, serverStr);
            }
          } catch (e) {}

          if (key === STORAGE_KEYS.CHAT_MESSAGES) {
            hasChatChanges = true;
            const enrichedAll = this.getChatMessages();
            const localMap = new Map((localVal || []).map((m) => [m.id, m]));
            cleanServerList.forEach((rawMsg) => {
              if (!localMap.has(rawMsg.id)) {
                const msg = enrichedAll.find((m) => m.id === rawMsg.id) || rawMsg;
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
              }
            });
          } else if (key === STORAGE_KEYS.NOTIFICATIONS) {
            hasNotifChanges = true;
            if (typeof window !== 'undefined' && (typeof process === 'undefined' || process.env?.NODE_ENV !== 'test')) {
              window.dispatchEvent(
                new CustomEvent('educo-notification-update', {
                  detail: { newItems: cleanServerList },
                })
              );
            }
          } else {
            hasGeneralChanges = true;
            if (key.startsWith('educo_db_website_') && typeof window !== 'undefined') {
              window.dispatchEvent(new CustomEvent('educo-website-update'));
            }
          }
        }
        return;
      }

      // If local device DOES have in-flight pending writes (e.g. offline edits):
      // Smart Merge keeping in-flight local items:
      const mergedMap = new Map();
      serverVal.forEach((sItem) => {
        if (!sItem || typeof sItem !== 'object') return;
        const itemId = String(sItem.id || sItem.username || '');
        if (itemId && deletedIds.has(itemId)) return;
        if (itemId) mergedMap.set(itemId, sItem);
      });

      let localHasItemsNotInServer = false;
      localVal.forEach((lItem) => {
        if (!lItem || typeof lItem !== 'object') return;
        const itemId = String(lItem.id || lItem.username || '');
        if (!itemId || deletedIds.has(itemId)) return;

        if (!mergedMap.has(itemId)) {
          const createdTs = new Date(lItem.created_at || 0).getTime();
          if (Date.now() - createdTs < 60000) {
            mergedMap.set(itemId, lItem);
            localHasItemsNotInServer = true;
          }
        } else {
          const sItem = mergedMap.get(itemId);
          const localTs = new Date(lItem.updated_at || lItem.created_at || 0).getTime();
          const serverTs = new Date(sItem.updated_at || sItem.created_at || 0).getTime();
          if (localTs > serverTs) {
            mergedMap.set(itemId, lItem);
            localHasItemsNotInServer = true;
          }
        }
      });

      const mergedList = Array.from(mergedMap.values());
      const localStr = JSON.stringify(localVal);
      const mergedStr = JSON.stringify(mergedList);

      if (localStr !== mergedStr) {
        this.memoryStore[key] = mergedList;
        try {
          if (typeof window !== 'undefined' && typeof window.localStorage?.setItem === 'function') {
            window.localStorage.setItem(key, mergedStr);
          }
        } catch (e) {}

        if (key === STORAGE_KEYS.CHAT_MESSAGES) {
          hasChatChanges = true;
          const enrichedAll = this.getChatMessages();
          const localMap = new Map((localVal || []).map((m) => [m.id, m]));
          mergedList.forEach((rawMsg) => {
            if (!localMap.has(rawMsg.id)) {
              const msg = enrichedAll.find((m) => m.id === rawMsg.id) || rawMsg;
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
            }
          });
        } else if (key === STORAGE_KEYS.NOTIFICATIONS) {
          hasNotifChanges = true;
          if (typeof window !== 'undefined' && (typeof process === 'undefined' || process.env?.NODE_ENV !== 'test')) {
            window.dispatchEvent(
              new CustomEvent('educo-notification-update', {
                detail: { newItems: mergedList },
              })
            );
          }
        } else {
          hasGeneralChanges = true;
          if (key.startsWith('educo_db_website_') && typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('educo-website-update'));
          }
        }
      }

      if (localHasItemsNotInServer) {
        pushBackPayload[key] = mergedList;
        needsPushBack = true;
      }
    });

    if (needsPushBack && Object.keys(pushBackPayload).length > 0) {
      this.pushToServer(pushBackPayload).catch(() => {});
    }

    this.purgeDeletedRecords();

    if (hasGeneralChanges || hasChatChanges || hasNotifChanges) {
      if (typeof window !== 'undefined' && (typeof process === 'undefined' || process.env?.NODE_ENV !== 'test')) {
        window.dispatchEvent(
          new CustomEvent('educo-data-sync', {
            detail: serverData,
          })
        );
        window.dispatchEvent(new CustomEvent('educo-website-update'));
        window.dispatchEvent(new CustomEvent('educo-users-update', { detail: { users: serverData[STORAGE_KEYS.USERS] } }));
        try {
          window.dispatchEvent(new Event('storage'));
        } catch (_) {}
      }
    }
  }

  async syncWithServer(force = false) {
    if (typeof window === 'undefined' || typeof fetch === 'undefined') return;
    if (typeof process !== 'undefined' && (process.env?.NODE_ENV === 'test' || process.env?.VITEST)) return;
    // Skip if offline
    if (typeof navigator !== 'undefined' && navigator.onLine === false) return;

    if (!force && this._isSyncing) {
      if (Date.now() - (this._syncStartTime || 0) > 1500) {
        this._isSyncing = false;
      } else {
        return;
      }
    }
    this._isSyncing = true;
    this._syncStartTime = Date.now();

    try {
      const headers = {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
      };
      if (!force && this._lastServerETag) {
        headers['If-None-Match'] = this._lastServerETag;
      }
      // Always bust local browser HTTP cache while allowing server-side ETag 304 check (unless force=true)
      const syncUrl = `/api/sync-store?t=${Date.now()}${force ? '&force=1' : ''}`;
      const res = await fetch(syncUrl, { headers });
      if (!force && res.status === 304) {
        // Data on server is unchanged - ultra fast 0-byte 1-second heartbeat!
        this._isSyncing = false;
        return;
      }
      if (!res.ok) {
        this._isSyncing = false;
        return;
      }

      const contentType = res.headers.get('content-type') || '';
      if (!contentType.includes('application/json')) {
        this._isSyncing = false;
        return;
      }

      const etag = res.headers.get('ETag') || res.headers.get('etag');
      if (etag) {
        this._lastServerETag = etag;
      }

      const serverData = await res.json();
      if (!serverData || typeof serverData !== 'object') {
        this._isSyncing = false;
        return;
      }

      if (force && this._pendingOutbox) {
        this._pendingOutbox.clear();
      }

      this.applyIncomingData(serverData);
      this.purgeDeletedRecords();
    } catch (e) {
    } finally {
      this._isSyncing = false;
    }
  }

  async forceRefreshFromServer() {
    try {
      if (this._pendingOutbox) this._pendingOutbox.clear();
      this._lastServerETag = null;
      await this.syncWithServer(true);
      this.purgeDeletedRecords();
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('educo-data-sync', { detail: { full: true } }));
        window.dispatchEvent(new CustomEvent('educo-users-update'));
        window.dispatchEvent(new CustomEvent('educo-website-update'));
        window.dispatchEvent(new CustomEvent('educo-store-update'));
      }
      return true;
    } catch (e) {
      console.warn('forceRefreshFromServer exception:', e);
      return false;
    }
  }

  async pushToServer(payload) {
    if (typeof window === 'undefined' || typeof fetch === 'undefined') return;
    if (typeof process !== 'undefined' && (process.env?.NODE_ENV === 'test' || process.env?.VITEST)) return;
    try {
      if (payload?.deletedId) {
        this._recordDeletedId(payload.deletedId);
      }
      const fullPayload = {
        ...payload,
        _deleted_ids: Array.from(this._getDeletedIds()),
      };
      const res = await fetch('/api/sync-store', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(fullPayload),
      });
      if (res.ok) {
        const etag = res.headers.get('ETag') || res.headers.get('etag');
        if (etag) {
          this._lastServerETag = etag;
        }
        if (this._pendingOutbox && payload && typeof payload === 'object') {
          Object.keys(payload).forEach((k) => this._pendingOutbox.delete(k));
        }
      }
    } catch (e) {}
  }

  // --- GLOBAL REALTIME CROSS-DEVICE ENGINE ---
  startRealtimeEngine(intervalMs = 15000) {
    if (typeof window === 'undefined') return;
    if (this._realtimeTimer) return;

    // Connect Global Cloud Realtime SSE and catch up from all gadgets
    this.connectCloudSSE();
    this.catchUpFromCloudBus().catch(() => {});

    // Run initial sync right away
    this.syncWithServer().catch(() => {});

    // Gentle background heartbeat (only when tab is visible)
    this._realtimeTimer = setInterval(() => {
      if (typeof document !== 'undefined' && document.hidden) return;
      this.syncWithServer().catch(() => {});
    }, intervalMs);

    // Instant wake sync on user switching back to tab, unlocking phone, or network coming online
    const handleWake = () => {
      if (typeof document !== 'undefined' && !document.hidden) {
        this.catchUpFromCloudBus().catch(() => {});
        this.syncWithServer().catch(() => {});
      }
    };
    window.addEventListener('visibilitychange', handleWake);
    window.addEventListener('focus', handleWake);
    window.addEventListener('online', handleWake);
  }

  // --- COURSES ---
  _harmonizeCourses(rawList, rawGroups) {
    if (!Array.isArray(rawList) || rawList.length === 0) return { courses: rawList || [], groups: rawGroups || [], changed: false };

    const CANONICAL_COURSES = {
      rus: { id: 'crs-rus-tili', name: 'Rus tili', code: 'CRS-RUS1', price: 500000, color: '#f59e0b', desc: 'Rus tili bo‘yicha professional o‘quv kursi' },
      fullstack: { id: 'crs-fullstack', name: 'Full Stack', code: 'CRS-FS1', price: 600000, color: '#10b981', desc: 'Full Stack dasturlash bo‘yicha professional kurs' },
      mental: { id: 'crs-1793623377912', name: 'Mental Arifmetika', code: 'CRS-MNT1', price: 498000, color: '#ec4899', desc: 'Mental arifmetika va tezkor hisoblash' },
      math: { id: 'crs-matematika', name: 'Matematika', code: 'CRS-MAT1', price: 500000, color: '#3b82f6', desc: 'Matematika va mantiqiy fikrlash kursi' },
      english: { id: 'crs-ingliz-tili', name: 'Ingliz tili', code: 'CRS-ENG1', price: 500000, color: '#8b5cf6', desc: 'Ingliz tili bo‘yicha professional o‘quv kursi' },
      arabic: { id: 'crs-arab-tili', name: 'Arab tili', code: 'CRS-ARB1', price: 500000, color: '#10b981', desc: 'Arab tili bo‘yicha professional o‘quv kursi' },
      chess: { id: 'crs-shaxmat', name: 'Shaxmat', code: 'CRS-CHESS1', price: 400000, color: '#64748b', desc: 'Shaxmat bo‘yicha professional o‘quv kursi' },
    };

    const getSubjectKey = (c) => {
      const name = (c.name || '').trim().toLowerCase();
      const code = (c.code || '').trim().toUpperCase();
      const id = String(c.id || '').toLowerCase();
      if (id === 'crs-rus-tili' || code === 'CRS-RUS1' || code === 'CRS-1.1' || name.startsWith('рус') || name.startsWith('rus tili')) return 'rus';
      if (id === 'crs-fullstack' || id === 'crs-it' || id === 'crs-frontend' || code === 'CRS-FS1' || code === 'CRS-8784' || name.includes('full stack') || name.includes('frontend') || name.includes('it va dasturlash') || name.includes('dasturlash')) return 'fullstack';
      if (id === 'crs-1793623377912' || id === 'crs-mental' || code === 'CRS-MNT1' || name.includes('mental')) return 'mental';
      if (id === 'crs-matematika' || id === 'crs-1793615340332' || code === 'CRS-MAT1' || name.includes('matematik') || name.includes('math')) return 'math';
      if (id === 'crs-ingliz-tili' || code === 'CRS-ENG1' || name.includes('ingliz') || name.includes('english')) return 'english';
      if (id === 'crs-arab-tili' || code === 'CRS-ARB1' || name.includes('arab') || name.includes('arabic')) return 'arabic';
      if (id === 'crs-shaxmat' || code === 'CRS-CHESS1' || name.includes('shaxmat') || name.includes('chess')) return 'chess';
      return null;
    };

    let changed = false;
    let groups = Array.isArray(rawGroups) ? [...rawGroups] : [];
    const seenSubjects = new Map();
    const cleanCourses = [];

    for (const c of rawList) {
      const subKey = getSubjectKey(c);
      if (subKey) {
        if (!seenSubjects.has(subKey)) {
          const canon = CANONICAL_COURSES[subKey];
          const masterCourse = {
            ...c,
            id: canon.id,
            name: canon.name,
            code: canon.code,
            monthly_fee: c.monthly_fee || canon.price,
            price: c.price || c.monthly_fee || canon.price,
            color: c.color || canon.color,
            description: c.description || canon.desc,
            is_active: c.is_active !== false,
          };
          seenSubjects.set(subKey, masterCourse);
          cleanCourses.push(masterCourse);

          if (c.id !== canon.id || c.name !== canon.name) {
            changed = true;
            groups = groups.map((g) => {
              if (g.course_id === c.id || g.courseId === c.id) {
                return { ...g, course_id: canon.id, courseId: canon.id, course_name: canon.name, courseName: canon.name };
              }
              return g;
            });
          }
        } else {
          // Phantom duplicate course! Merge its groups to the master course & drop duplicate
          changed = true;
          const canon = seenSubjects.get(subKey);
          groups = groups.map((g) => {
            if (g.course_id === c.id || g.courseId === c.id || (g.course_name && g.course_name.toLowerCase() === c.name?.toLowerCase())) {
              return { ...g, course_id: canon.id, courseId: canon.id, course_name: canon.name, courseName: canon.name };
            }
            return g;
          });
        }
      } else {
        cleanCourses.push(c);
      }
    }

    return { courses: cleanCourses, groups, changed };
  }

  getCourses() {
    const rawList = this.getItem(STORAGE_KEYS.COURSES, INITIAL_COURSES);
    const rawGroups = this.getItem(STORAGE_KEYS.GROUPS, INITIAL_GROUPS);
    const { courses: list, groups, changed } = this._harmonizeCourses(rawList, rawGroups);

    if (changed) {
      this.memoryStore[STORAGE_KEYS.COURSES] = list;
      this.memoryStore[STORAGE_KEYS.GROUPS] = groups;
      try {
        if (typeof window !== 'undefined' && typeof window.localStorage?.setItem === 'function') {
          window.localStorage.setItem(STORAGE_KEYS.COURSES, JSON.stringify(list));
          window.localStorage.setItem(STORAGE_KEYS.GROUPS, JSON.stringify(groups));
        }
      } catch (_) {}
    }

    return list.map((c) => {
      const activeGroups = groups.filter((g) => {
        const matchesCourse =
          g.course_id === c.id ||
          g.courseId === c.id ||
          (g.course_name && c.name && g.course_name.toLowerCase() === c.name.toLowerCase()) ||
          (g.name && c.name && g.name.toLowerCase().startsWith(c.name.toLowerCase())) ||
          (g.direction && c.name && g.direction.toLowerCase() === c.name.toLowerCase());
        const isActive = g.status === 'active' || g.is_active === true || (!g.status && g.status !== 'archived');
        return matchesCourse && isActive;
      });
      return {
        ...c,
        groups: activeGroups,
        groupsCount: activeGroups.length,
        activeGroupsCount: activeGroups.length,
      };
    });
  }

  saveCourse(courseData) {
    const list = this.getCourses();
    const targetId = courseData.id || null;
    let existingIndex = targetId ? list.findIndex((c) => c.id === targetId) : -1;
    if (existingIndex < 0 && courseData.name) {
      existingIndex = list.findIndex(
        (c) => c.name?.trim().toLowerCase() === courseData.name.trim().toLowerCase()
      );
    }
    const existingCourse = existingIndex >= 0 ? list[existingIndex] : null;

    const newCourse = {
      id: targetId || existingCourse?.id || `crs-${Date.now()}`,
      name: courseData.name,
      code: courseData.code || existingCourse?.code || `CRS-${Math.floor(1000 + Math.random() * 9000)}`,
      description: courseData.description !== undefined ? courseData.description : (existingCourse?.description || ''),
      monthly_fee: Number(
        courseData.monthly_fee !== undefined
          ? courseData.monthly_fee
          : courseData.monthlyFee !== undefined
          ? courseData.monthlyFee
          : (existingCourse?.monthly_fee || 0)
      ),
      color: courseData.color || existingCourse?.color || '#123D78',
      is_active: courseData.is_active ?? courseData.isActive ?? existingCourse?.is_active ?? true,
      teacher_ids: courseData.teacher_ids || courseData.teacherIds || existingCourse?.teacher_ids || [],
      teachers: courseData.teachers || existingCourse?.teachers || [],
      created_at: courseData.created_at || existingCourse?.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString(),
      groupsCount: existingCourse?.groupsCount || 0,
      activeGroupsCount: existingCourse?.activeGroupsCount || 0,
    };

    if (existingIndex >= 0) {
      list[existingIndex] = { ...list[existingIndex], ...newCourse };
    } else {
      list.unshift(newCourse);
    }
    if (this._deletedIds && newCourse.id) {
      this._deletedIds.delete(String(newCourse.id));
    }
    this.setItem(STORAGE_KEYS.COURSES, list);
    this.pushToServer({ [STORAGE_KEYS.COURSES]: list }).catch(() => {});
    try {
      if (typeof window !== 'undefined' && (typeof process === 'undefined' || process.env?.NODE_ENV !== 'test')) {
        window.dispatchEvent(new CustomEvent('educo-data-sync', { detail: { key: STORAGE_KEYS.COURSES } }));
      }
    } catch (_) {}
    return newCourse;
  }

  deleteCourse(id) {
    this._recordDeletedId(id);
    const list = this.getCourses().filter((c) => c.id !== id);
    this.setItem(STORAGE_KEYS.COURSES, list, id);
    this.broadcastToCloud(STORAGE_KEYS.COURSES, list, id);
    this.pushToServer({ [STORAGE_KEYS.COURSES]: list, deletedId: id }).catch(() => {});
    try {
      if (typeof window !== 'undefined' && (typeof process === 'undefined' || process.env?.NODE_ENV !== 'test')) {
        window.dispatchEvent(new CustomEvent('educo-data-sync', { detail: { key: STORAGE_KEYS.COURSES } }));
      }
    } catch (_) {}
    return true;
  }

  // --- USERS ---
  normalizeUserId(id) {
    const map = {
      'demo-owner-id': 'usr-owner-1',
    };
    return map[id] || id;
  }

  getUsers() {
    let raw = this.getItem(STORAGE_KEYS.USERS, INITIAL_USERS);
    let needsCleanup = false;

    // Purge legacy demo accounts and test accounts that user requested to delete
    const legacyDemoIds = new Set([
      'usr-test-sync-1',
      'test_sync_user',
      'usr-1793596191113',
      'usr-owner-2',
      'usr-admin-1',
      'usr-teacher-1',
      'usr-teacher-2',
      'usr-student-1',
      'usr-student-fe-2',
      'usr-student-fe-3',
      'usr-student-fe-4',
      'usr-student-fe-5',
      'usr-student-fe-6',
      'usr-student-2',
      'usr-student-py-2',
      'usr-student-py-3',
      'usr-student-py-4',
      'usr-student-py-5',
      'usr-student-py-6',
      'usr-student-3',
      'usr-student-eng-2',
      'usr-student-eng-3',
      'usr-student-eng-4',
      'usr-student-eng-5',
      'usr-student-eng-6',
      'usr-student-ux-1',
      'usr-student-ux-2',
      'usr-student-ux-3',
      'usr-student-ux-4',
      'usr-student-ux-5',
      'usr-student-ux-6',
    ]);

    raw = (raw || []).filter((u) => {
      if (legacyDemoIds.has(u.id)) {
        needsCleanup = true;
        return false;
      }
      return true;
    });

    // Ensure all seed INITIAL_USERS exist in raw (Abbosbek, Zilola, Teachers)
    INITIAL_USERS.forEach((initUser) => {
      const initPhoneClean = (initUser.phone || '').replace(/\D/g, '').slice(-9);
      const exists = raw.some(
        (u) =>
          u.id === initUser.id ||
          (initPhoneClean && (u.phone || '').replace(/\D/g, '').slice(-9) === initPhoneClean && u.role === initUser.role)
      );
      if (!exists) {
        raw.push(initUser);
        needsCleanup = true;
      }
    });

    // Enforce canonical roles for core staff (Erkinova Zilola is ALWAYS admin, Abdulazizbek Orifjonov is MENTOR)
    raw.forEach((u) => {
      if (u.id === 'usr-admin-erkinova') {
        if (u.role !== 'admin') {
          u.role = 'admin';
          u.specialty = 'Administrator';
          needsCleanup = true;
        }
      }
      if (u.id === 'usr-owner-1' || (u.phone || '').replace(/\D/g, '').slice(-9) === '988001415') {
        if (u.role !== 'owner') {
          u.role = 'owner';
          needsCleanup = true;
        }
      }
      const isAbdulazizbek =
        u.id === 'usr-1793463763683' ||
        u.id === 'usr-1793466843425' ||
        u.username === 'abdulazizbek_orifjonov' ||
        (u.phone || '').replace(/\D/g, '').slice(-9) === '935821774' ||
        (u.fullName && u.fullName.toLowerCase().includes('abdulazizbek'));
      if (isAbdulazizbek) {
        if (!u.is_mentor || u.title !== 'Mentor' || u.display_role !== 'mentor') {
          u.is_mentor = true;
          u.title = 'Mentor';
          u.display_role = 'mentor';
          u.specialty = u.specialty || 'Full Stack';
          u.subject = u.subject || 'Full Stack';
          needsCleanup = true;
        }
      }
    });

    const filtered = raw.filter((u) => {
      if (u.fullName === 'User' && !u.phone && !u.first_name) return false;
      return true;
    });

    const normalized = filtered.map((u) => {
      const defaultRef = INITIAL_USERS.find(
        (init) =>
          init.id === u.id ||
          init.username === u.username ||
          (init.role === u.role &&
            (init.phone || '').replace(/\D/g, '').slice(-9) &&
            (init.phone || '').replace(/\D/g, '').slice(-9) === (u.phone || '').replace(/\D/g, '').slice(-9))
      );
      return {
        ...u,
        avatar_url: u.avatar_url || '',
        password: u.password || defaultRef?.password || 'Educo#2026!',
        password_updated_at: u.password_updated_at || u.updated_at || u.created_at,
      };
    });

    if (needsCleanup) {
      this.memoryStore[STORAGE_KEYS.USERS] = normalized;
      try {
        if (typeof window !== 'undefined' && typeof window.localStorage?.setItem === 'function') {
          window.localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(normalized));
        }
      } catch (_) {}
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
      custom_price:
        userData.custom_price !== undefined
          ? userData.custom_price
          : (existing?.custom_price ?? null),
      discount_percent:
        userData.discount_percent !== undefined
          ? Number(userData.discount_percent || 0)
          : Number(existing?.discount_percent || 0),
      discount_amount:
        userData.discount_amount !== undefined
          ? Number(userData.discount_amount || 0)
          : Number(existing?.discount_amount || 0),
      discount_type:
        userData.discount_type !== undefined
          ? userData.discount_type
          : (existing?.discount_type || null),
      discount_reason:
        userData.discount_reason !== undefined
          ? userData.discount_reason
          : (existing?.discount_reason || ''),
      is_mentor: userData.is_mentor ?? existing?.is_mentor ?? (fullName.toLowerCase().includes('abdulazizbek') || (userData.phone || existing?.phone || '').replace(/\D/g, '').endsWith('935821774')),
      display_role: userData.display_role || existing?.display_role || (fullName.toLowerCase().includes('abdulazizbek') ? 'mentor' : undefined),
      title: userData.title || existing?.title || (fullName.toLowerCase().includes('abdulazizbek') ? 'Mentor' : undefined),
      specialty: userData.specialty || existing?.specialty || (fullName.toLowerCase().includes('abdulazizbek') ? 'Full Stack' : undefined),
      subject: userData.subject || existing?.subject || (fullName.toLowerCase().includes('abdulazizbek') ? 'Full Stack' : undefined),
      group_id: userData.group_id !== undefined ? userData.group_id : (existing?.group_id || null),
      group_ids: Array.isArray(userData.group_ids)
        ? userData.group_ids
        : (Array.isArray(existing?.group_ids) ? existing.group_ids : (userData.group_id || existing?.group_id ? [userData.group_id || existing?.group_id] : [])),
      course_id: userData.course_id !== undefined ? userData.course_id : (existing?.course_id || null),
      course_ids: Array.isArray(userData.course_ids) ? userData.course_ids : (existing?.course_ids || []),
      created_at: userData.created_at || existing?.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    if (this._deletedIds && newUser.id) {
      this._deletedIds.delete(String(newUser.id));
    }
    if (index >= 0) {
      list[index] = newUser;
    } else {
      list.unshift(newUser);
    }
    this.setItem(STORAGE_KEYS.USERS, list);
    this.pushToServer({ [STORAGE_KEYS.USERS]: list }).catch(() => {});
    try {
      if (typeof window !== 'undefined' && (typeof process === 'undefined' || process.env?.NODE_ENV !== 'test')) {
        window.dispatchEvent(new CustomEvent('educo-data-sync', { detail: { key: STORAGE_KEYS.USERS } }));
      }
    } catch (_) {}
    return newUser;
  }

  saveUsers(usersList) {
    if (!Array.isArray(usersList)) return [];
    this.setItem(STORAGE_KEYS.USERS, usersList);
    this.pushToServer({ [STORAGE_KEYS.USERS]: usersList }).catch(() => {});
    try {
      if (typeof window !== 'undefined' && (typeof process === 'undefined' || process.env?.NODE_ENV !== 'test')) {
        window.dispatchEvent(new CustomEvent('educo-data-sync', { detail: { key: STORAGE_KEYS.USERS } }));
      }
    } catch (_) {}
    return usersList;
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
    const target = this.getUsers().find((u) => u.id === id);
    if (target && (target.username === 'abbosbek' || (target.role === 'owner' && this.getUsers().filter((u) => u.role === 'owner').length <= 1))) {
      console.warn('[Security] Root owner account cannot be deleted.');
      return false;
    }
    this._recordDeletedId(id);
    const list = this.getUsers().filter((u) => u.id !== id);
    this.setItem(STORAGE_KEYS.USERS, list, id);
    this.broadcastToCloud(STORAGE_KEYS.USERS, list, id);
    const memberships = this.getMemberships().filter((m) => m.user_id !== id);
    this.setItem(STORAGE_KEYS.MEMBERSHIPS, memberships);
    this.pushToServer({
      [STORAGE_KEYS.USERS]: list,
      [STORAGE_KEYS.MEMBERSHIPS]: memberships,
      deletedId: id,
    }).catch(() => {});
    try {
      if (typeof window !== 'undefined' && (typeof process === 'undefined' || process.env?.NODE_ENV !== 'test')) {
        window.dispatchEvent(new CustomEvent('educo-data-sync', { detail: { key: STORAGE_KEYS.USERS } }));
        window.dispatchEvent(new CustomEvent('educo-users-update', { detail: { users: list } }));
      }
    } catch (_) {}
    return true;
  }

  // --- GROUPS ---
  getGroups() {
    let raw = this.getItem(STORAGE_KEYS.GROUPS, INITIAL_GROUPS);
    if (!Array.isArray(raw)) raw = [];

    // Ensure Abdulazizbek Orifjonov (Mentor) has his canonical Full Stack groups with exact requested schedules
    const isTestEnv = typeof process !== 'undefined' && process.env?.NODE_ENV === 'test';
    if (raw.length > 0 || !isTestEnv) {
      const hasAbdulazizGroups = raw.some((g) => {
        const tid = String(g.teacher_id || g.teacherId || '');
        const tName = String(g.teacher_name || '').toLowerCase();
        return tid === 'usr-1793463763683' || tid === 'usr-1793466843425' || tName.includes('abdulazizbek');
      });

      if (!hasAbdulazizGroups && (!isTestEnv || raw.length > 0)) {
        const defaultMentorGroups = [
          {
            id: 'grp-fullstack-101',
            name: 'Full Stack 1.1 (FS-1.1)',
            course_id: 'crs-fullstack',
            courseId: 'crs-fullstack',
            course_name: 'Full Stack',
            courseName: 'Full Stack',
            teacher_id: 'usr-1793463763683',
            teacherId: 'usr-1793463763683',
            teacher_name: 'Abdulazizbek Orifjonov',
            teacherName: 'Abdulazizbek Orifjonov',
            schedule: 'Dush-Chor-Jum, 06:00 - 08:00',
            schedule_days: 'Dush-Chor-Jum',
            schedule_time: '06:00 - 08:00',
            start_time: '06:00',
            end_time: '08:00',
            room: '101-xona',
            capacity: 30,
            enrolled_count: 14,
            status: 'active',
            monthly_price: 600000,
            price: 600000,
            created_at: '2026-10-31T12:00:00.000Z',
          },
          {
            id: 'grp-fullstack-102',
            name: 'Full Stack 1.2 (FS-1.2)',
            course_id: 'crs-fullstack',
            courseId: 'crs-fullstack',
            course_name: 'Full Stack',
            courseName: 'Full Stack',
            teacher_id: 'usr-1793463763683',
            teacherId: 'usr-1793463763683',
            teacher_name: 'Abdulazizbek Orifjonov',
            teacherName: 'Abdulazizbek Orifjonov',
            schedule: 'Sesh-Pay-Shan, 14:00 - 16:00',
            schedule_days: 'Sesh-Pay-Shan',
            schedule_time: '14:00 - 16:00',
            start_time: '14:00',
            end_time: '16:00',
            room: '103-xona',
            capacity: 30,
            enrolled_count: 16,
            status: 'active',
            monthly_price: 600000,
            price: 600000,
            created_at: '2026-10-31T12:00:00.000Z',
          },
          {
            id: 'grp-fullstack-103',
            name: 'Full Stack 1.3 (FS-1.3)',
            course_id: 'crs-fullstack',
            courseId: 'crs-fullstack',
            course_name: 'Full Stack',
            courseName: 'Full Stack',
            teacher_id: 'usr-1793463763683',
            teacherId: 'usr-1793463763683',
            teacher_name: 'Abdulazizbek Orifjonov',
            teacherName: 'Abdulazizbek Orifjonov',
            schedule: 'Dush-Chor-Jum, 18:00 - 20:00',
            schedule_days: 'Dush-Chor-Jum',
            schedule_time: '18:00 - 20:00',
            start_time: '18:00',
            end_time: '20:00',
            room: '105-xona',
            capacity: 25,
            enrolled_count: 12,
            status: 'active',
            monthly_price: 600000,
            price: 600000,
            created_at: '2026-10-31T12:00:00.000Z',
          },
        ];
        raw = [...raw, ...defaultMentorGroups];
        this.setItem(STORAGE_KEYS.GROUPS, raw);
      }
    }
    return raw;
  }

  // --- MEMBERSHIPS ---
  getMemberships() {
    let raw = this.getItem(STORAGE_KEYS.MEMBERSHIPS, INITIAL_MEMBERSHIPS);
    if (!Array.isArray(raw)) raw = [];
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

  /**
   * Delete a single payment by ID
   */
  deletePayment(paymentId) {
    const list = this.getPayments();
    const filtered = list.filter((p) => p.id !== paymentId);
    this.setItem(STORAGE_KEYS.PAYMENTS, filtered);
    try {
      if (typeof window !== 'undefined' && (typeof process === 'undefined' || process.env?.NODE_ENV !== 'test')) {
        window.dispatchEvent(new CustomEvent('educo-data-sync'));
      }
    } catch (_) {}
    return filtered;
  }

  /**
   * Delete multiple payments by IDs
   */
  deletePayments(paymentIds) {
    const idSet = new Set(paymentIds);
    const list = this.getPayments();
    const filtered = list.filter((p) => !idSet.has(p.id));
    this.setItem(STORAGE_KEYS.PAYMENTS, filtered);
    try {
      if (typeof window !== 'undefined' && (typeof process === 'undefined' || process.env?.NODE_ENV !== 'test')) {
        window.dispatchEvent(new CustomEvent('educo-data-sync'));
      }
    } catch (_) {}
    return filtered;
  }

  /**
   * Delete ALL payments (clear entire payment history)
   */
  deleteAllPayments() {
    this.setItem(STORAGE_KEYS.PAYMENTS, []);
    try {
      if (typeof window !== 'undefined' && (typeof process === 'undefined' || process.env?.NODE_ENV !== 'test')) {
        window.dispatchEvent(new CustomEvent('educo-data-sync'));
      }
    } catch (_) {}
    return [];
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
      student_ids: Array.isArray(groupData.student_ids) ? groupData.student_ids : (existing.student_ids || []),
      status: groupData.status || existing.status || 'active',
      monthly_price: Number(groupData.monthly_price !== undefined ? groupData.monthly_price : (groupData.monthlyPrice !== undefined ? groupData.monthlyPrice : (existing.monthly_price || 0))),
      schedule: groupData.schedule || existing.schedule || 'Dush-Chor-Jum, 18:00 - 20:00',
      avatar_url: groupData.avatar_url !== undefined ? groupData.avatar_url : (groupData.avatarUrl !== undefined ? groupData.avatarUrl : existing.avatar_url || null),
      image_url: groupData.image_url !== undefined ? groupData.image_url : (groupData.imageUrl !== undefined ? groupData.imageUrl : (groupData.avatar_url !== undefined ? groupData.avatar_url : existing.image_url || null)),
      created_at: groupData.created_at || existing.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    if (this._deletedIds && newGroup.id) {
      this._deletedIds.delete(String(newGroup.id));
    }
    if (index >= 0) {
      list[index] = newGroup;
    } else {
      list.unshift(newGroup);
    }
    this.setItem(STORAGE_KEYS.GROUPS, list);
    this.pushToServer({ [STORAGE_KEYS.GROUPS]: list }).catch(() => {});
    try {
      if (typeof window !== 'undefined' && (typeof process === 'undefined' || process.env?.NODE_ENV !== 'test')) {
        window.dispatchEvent(new CustomEvent('educo-data-sync', { detail: { key: STORAGE_KEYS.GROUPS } }));
      }
    } catch (_) {}
    return newGroup;
  }

  deleteGroup(id) {
    this._recordDeletedId(id);
    const list = this.getGroups().filter((g) => g.id !== id);
    this.setItem(STORAGE_KEYS.GROUPS, list, id);
    this.broadcastToCloud(STORAGE_KEYS.GROUPS, list, id);

    // Cascade delete schedules for this group
    const schedules = this.getSchedules().filter((s) => s.group_id !== id);
    this.setItem(STORAGE_KEYS.LESSON_SCHEDULES, schedules);
    this.broadcastToCloud(STORAGE_KEYS.LESSON_SCHEDULES, schedules);

    this.pushToServer({
      [STORAGE_KEYS.GROUPS]: list,
      [STORAGE_KEYS.LESSON_SCHEDULES]: schedules,
      deletedId: id
    }).catch(() => {});
    try {
      if (typeof window !== 'undefined' && (typeof process === 'undefined' || process.env?.NODE_ENV !== 'test')) {
        window.dispatchEvent(new CustomEvent('educo-data-sync', { detail: { key: STORAGE_KEYS.GROUPS } }));
      }
    } catch (_) {}
    return true;
  }

  // --- LESSON SCHEDULES (TIMETABLE) ---
  getSchedules() {
    let raw = this.getItem(STORAGE_KEYS.LESSON_SCHEDULES, INITIAL_SCHEDULES);
    if (!Array.isArray(raw)) raw = [];

    // Deduplicate any duplicates in raw storage by group_id + day_of_week + start_time
    const seen = new Set();
    const dedupedRaw = [];
    raw.forEach((s) => {
      const key = [s.group_id, s.day_of_week, (s.start_time || '').slice(0, 5)].join('_');
      if (!seen.has(key)) {
        seen.add(key);
        dedupedRaw.push(s);
      }
    });

    const groups = this.getGroups();
    const courses = this.getCourses();
    const users = this.getUsers();

    // Enrich with group, course, teacher relationships
    return dedupedRaw.map((s) => {
      const g = groups.find((grp) => grp.id === s.group_id);
      const c = g ? courses.find((crs) => crs.id === g.course_id) : null;
      const t = g ? users.find((usr) => usr.id === g.teacher_id) : null;

      const teacherId = g?.teacher_id || t?.id || '';
      const teacherName = g?.teacher_name || (t ? `${t.first_name || ''} ${t.last_name || ''}`.trim() : '');

      return {
        ...s,
        group_id: s.group_id,
        groupName: g?.name || 'Group',
        courseName: c?.name || g?.course_name || '',
        color: c?.color || '#123D78',
        room: s.room || g?.room || '101-xona',
        teacher_id: teacherId,
        teacher_name: teacherName,
        teachers: teacherName
          ? [{ id: teacherId, first_name: teacherName, last_name: '' }]
          : (t ? [{ id: t.id, first_name: t.first_name, last_name: t.last_name }] : []),
        groups: g
          ? {
              id: g.id,
              name: g.name,
              room: g.room || s.room,
              teacher_id: teacherId,
              teacher_name: teacherName,
              courses: c ? { id: c.id, name: c.name, color: c.color } : null,
              group_teachers: teacherName
                ? [{ teacher_id: teacherId, profiles: { id: teacherId, first_name: teacherName, last_name: '' } }]
                : (t ? [{ teacher_id: t.id, profiles: { id: t.id, first_name: t.first_name, last_name: t.last_name } }] : []),
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

    try {
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('educo-data-sync'));
      }
    } catch (_) {}

    return savedItems;
  }

  deleteSchedule(id) {
    this._recordDeletedId(id);
    const list = this.getItem(STORAGE_KEYS.LESSON_SCHEDULES, INITIAL_SCHEDULES).filter((s) => s.id !== id);
    this.setItem(STORAGE_KEYS.LESSON_SCHEDULES, list, id);
    this.broadcastToCloud(STORAGE_KEYS.LESSON_SCHEDULES, list, id);
    this.pushToServer({ [STORAGE_KEYS.LESSON_SCHEDULES]: list, deletedId: id }).catch(() => {});
    try {
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('educo-data-sync'));
      }
    } catch (_) {}
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
    return [];
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
        reactions: Array.isArray(m.reactions) ? m.reactions : [],
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
      reactions: msgData.reactions || [],
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
    const idx = list.findIndex((m) => String(m.id) === String(messageId));
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
    const idx = list.findIndex((m) => String(m.id) === String(messageId));
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
      (m) => String(m.id) !== String(messageId)
    );
    this.setItem(STORAGE_KEYS.CHAT_MESSAGES, list);
    this.pushToServer({ [STORAGE_KEYS.CHAT_MESSAGES]: list }).catch(() => {});
    return true;
  }

  clearChatHistory(groupId) {
    if (!groupId) return false;
    const targetGroupId = String(groupId);
    const list = this.getItem(STORAGE_KEYS.CHAT_MESSAGES, this.getInitialChatMessages()).filter(
      (m) => String(m.group_id || m.groupId) !== targetGroupId
    );
    this.setItem(STORAGE_KEYS.CHAT_MESSAGES, list);
    this.pushToServer({ [STORAGE_KEYS.CHAT_MESSAGES]: list }).catch(() => {});
    return true;
  }

  // --- TELEGRAM-STYLE MESSAGE REACTIONS ---
  toggleMessageReaction(messageId, emoji, userId) {
    if (!messageId || !emoji || !userId) return null;
    const list = this.getItem(STORAGE_KEYS.CHAT_MESSAGES, this.getInitialChatMessages());
    const idx = list.findIndex((m) => String(m.id) === String(messageId));
    if (idx < 0) return null;

    const msg = { ...list[idx] };
    const normalizedUid = this.normalizeUserId(userId);

    // Reactions stored as array of objects: [{ emoji: '👍', count: 1, user_ids: ['usr-...'] }]
    let reactions = Array.isArray(msg.reactions) ? [...msg.reactions] : [];

    // Support legacy object format { '👍': ['usr-1'] }
    if (!Array.isArray(msg.reactions) && msg.reactions && typeof msg.reactions === 'object') {
      reactions = Object.entries(msg.reactions).map(([em, uids]) => ({
        emoji: em,
        count: Array.isArray(uids) ? uids.length : 1,
        user_ids: Array.isArray(uids) ? uids : [uids],
      }));
    }

    const rIdx = reactions.findIndex((r) => r.emoji === emoji);
    if (rIdx >= 0) {
      const existing = reactions[rIdx];
      const userList = Array.isArray(existing.user_ids) ? [...existing.user_ids] : [];
      const userIndex = userList.indexOf(normalizedUid);

      if (userIndex >= 0) {
        // User already reacted -> remove reaction (toggle off)
        userList.splice(userIndex, 1);
        if (userList.length === 0) {
          reactions.splice(rIdx, 1);
        } else {
          reactions[rIdx] = {
            ...existing,
            count: userList.length,
            user_ids: userList,
          };
        }
      } else {
        // Add user's reaction
        userList.push(normalizedUid);
        reactions[rIdx] = {
          ...existing,
          count: userList.length,
          user_ids: userList,
        };
      }
    } else {
      // New emoji reaction
      reactions.push({
        emoji,
        count: 1,
        user_ids: [normalizedUid],
      });
    }

    msg.reactions = reactions;
    msg.updated_at = new Date().toISOString();
    list[idx] = msg;

    this.setItem(STORAGE_KEYS.CHAT_MESSAGES, list);
    this.pushToServer({ [STORAGE_KEYS.CHAT_MESSAGES]: list }).catch(() => {});

    // Notify listeners locally
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('educo-chat-update', {
          detail: {
            event: 'UPDATE',
            groupId: String(msg.group_id || msg.groupId),
            message: msg,
          },
        })
      );
    }

    return msg;
  }

  // --- STUDENT REMINDERS ---
  getStudentReminders() {
    return this.getItem(STORAGE_KEYS.STUDENT_REMINDERS, []);
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
      source: reminderData.source || (reminderData.type === 'website_lead' ? 'website' : 'system'),
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
      tracking_id: item.tracking_id || null,
      student_id: item.student_id,
      recipient_phone: item.recipient_phone,
      recipient_name: item.recipient_name || '',
      recipient_type: item.recipient_type || 'parent',
      message_text: item.message_text,
      amount_due: Number(item.amount_due || 0),
      course_name: item.course_name || '',
      group_name: item.group_name || '',
      due_date: item.due_date || null,
      status: item.status || 'PENDING',
      device_id: item.device_id || null,
      attempts: item.attempts || 0,
      max_attempts: item.max_attempts || 3,
      last_attempt_at: item.last_attempt_at || null,
      error_message: item.error_message || null,
      billing_period: item.billing_period || new Date().toISOString().slice(0, 7),
      idempotency_key: item.idempotency_key || (item.student_id ? `idemp-${item.student_id}-${item.billing_period || new Date().toISOString().slice(0, 7)}` : `idemp-${item.id || item.recipient_phone || Math.random().toString(36).slice(2, 8)}-${item.billing_period || new Date().toISOString().slice(0, 7)}`),
      scheduled_at: item.scheduled_at || new Date().toISOString(),
      queued_at: item.queued_at || item.created_at || new Date().toISOString(),
      dispatched_at: item.dispatched_at || null,
      android_received_at: item.android_received_at || item.processed_at || null,
      android_sent_at: item.android_sent_at || null,
      delivered_at: item.delivered_at || null,
      failed_at: item.failed_at || null,
      lms_latency_ms: item.lms_latency_ms ?? null,
      android_latency_ms: item.android_latency_ms ?? null,
      carrier_latency_ms: item.carrier_latency_ms ?? null,
      total_latency_ms: item.total_latency_ms ?? null,
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
      tracking_id: logData.tracking_id || null,
      device_id: logData.device_id || null,
      recipient_phone: logData.recipient_phone,
      recipient_name: logData.recipient_name || '',
      status: logData.status || 'SUBMITTED',
      dispatched_at: logData.dispatched_at || null,
      android_received_at: logData.android_received_at || logData.processed_at || null,
      android_sent_at: logData.android_sent_at || null,
      delivered_at: logData.delivered_at || null,
      failed_at: logData.failed_at || null,
      response_payload: logData.response_payload || {},
      error_details: logData.error_details || null,
      created_at: logData.created_at || new Date().toISOString(),
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
          localStore.applyIncomingCloudKey(event.data.key, event.data.value, event.data.deletedId || null);
        }
      };
    }
  } catch (_) {}

  // 2. Initial sync when tab opens
  setTimeout(() => {
    localStore.syncWithServer().catch(() => {});
  }, 100);

  // 3. Instant sync on focus, page show, visibility change, and online
  window.addEventListener('focus', () => {
    localStore.syncWithServer().catch(() => {});
  });
  window.addEventListener('pageshow', () => {
    localStore.syncWithServer().catch(() => {});
  });
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) {
      localStore.syncWithServer().catch(() => {});
    }
  });
  window.addEventListener('online', () => {
    localStore.syncWithServer().catch(() => {});
  });

  // 4. Gentle periodic background sync (15 seconds, skipped when tab is in background)
  setInterval(() => {
    if (typeof document !== 'undefined' && document.hidden) return;
    localStore.syncWithServer().catch(() => {});
  }, 15000);

  // 5. Connect to SSE Realtime stream if available (dev / supported servers)
  if (typeof window !== 'undefined' && typeof EventSource !== 'undefined') {
    let sseTimeout = null;
    const connectSSE = () => {
      try {
        const es = new EventSource('/api/realtime');
        es.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            if (data?.type === 'SYNC' && data?.payload) {
              if (data.deletedId) {
                localStore._recordDeletedId(data.deletedId);
              }
              localStore.applyIncomingData(data.payload);
            }
          } catch (_) {}
        };
        es.onerror = () => {
          es.close();
          clearTimeout(sseTimeout);
          sseTimeout = setTimeout(connectSSE, 3000);
        };
      } catch (_) {}
    };
    connectSSE();
  }
}

export function startRealtimeEngine(intervalMs = 15000) {
  try {
    if (localStore && typeof localStore.startRealtimeEngine === 'function') {
      return localStore.startRealtimeEngine(intervalMs);
    }
  } catch (_) {}
}

if (!localStore.startRealtimeEngine) {
  localStore.startRealtimeEngine = function(intervalMs = 15000) {
    return startRealtimeEngine(intervalMs);
  };
}

if (typeof window !== 'undefined') {
  try {
    window.localStore = localStore;
    if (!window.localStore.startRealtimeEngine) {
      window.localStore.startRealtimeEngine = (intervalMs = 1000) => startRealtimeEngine(intervalMs);
    }
    window.startRealtimeEngine = startRealtimeEngine;
  } catch (_) {}
}

export default localStore;

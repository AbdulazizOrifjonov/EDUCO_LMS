export const ROLES = {
  OWNER: 'owner',
  ADMIN: 'admin',
  TEACHER: 'teacher',
  STUDENT: 'student',
};

export const BRAND_COLORS = {
  NAVY: '#123D78',
  NAVY_LIGHT: '#1a4f9a',
  NAVY_DARK: '#0e2f5c',
  RED: '#F12D3A',
  RED_LIGHT: '#f45561',
  RED_DARK: '#d41f2b',
  WHITE: '#FFFFFF',
  LIGHT_BG: '#F5F7FA',
  DARK_BG: '#101827',
  BG_LIGHT: '#F5F7FA',
  BG_DARK: '#101827',
};

export const ATTENDANCE_STATUSES = {
  PRESENT: 'present',
  LATE: 'late',
  EXCUSED: 'excused',
  UNEXCUSED: 'unexcused',
  PENDING: 'pending',
  ABSENT: 'absent',
};

export const ATTENDANCE_CONFIG = {
  [ATTENDANCE_STATUSES.PRESENT]: {
    label: 'attendance.present',
    color: 'emerald',
    badgeVariant: 'success',
  },
  [ATTENDANCE_STATUSES.LATE]: {
    label: 'attendance.late',
    color: 'amber',
    badgeVariant: 'warning',
  },
  [ATTENDANCE_STATUSES.EXCUSED]: {
    label: 'attendance.excused',
    color: 'blue',
    badgeVariant: 'info',
  },
  [ATTENDANCE_STATUSES.UNEXCUSED]: {
    label: 'attendance.unexcused',
    color: 'red',
    badgeVariant: 'danger',
  },
  [ATTENDANCE_STATUSES.PENDING]: {
    label: 'attendance.pending',
    color: 'gray',
    badgeVariant: 'neutral',
  },
};

export const GRADE_RANGE = {
  MIN: 1,
  MAX: 5,
};

export const USER_STATUSES = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  SUSPENDED: 'suspended',
  INVITED: 'invited',
};

export const SUPPORTED_LANGUAGES = [
  { code: 'uz', name: 'Uzbek', nativeName: "O'zbek", flag: '🇺🇿', dir: 'ltr' },
  { code: 'ru', name: 'Russian', nativeName: 'Русский', flag: '🇷🇺', dir: 'ltr' },
  { code: 'en', name: 'English', nativeName: 'English', flag: '🇺🇸', dir: 'ltr' },
];

export const THEME_MODES = {
  LIGHT: 'light',
  DARK: 'dark',
  SYSTEM: 'system',
};

export const NOTIFICATION_TYPES = {
  INFO: 'info',
  SUCCESS: 'success',
  WARNING: 'warning',
  ERROR: 'error',
  ANNOUNCEMENT: 'announcement',
  HOMEWORK: 'homework',
  GRADE: 'grade',
  ATTENDANCE: 'attendance',
};

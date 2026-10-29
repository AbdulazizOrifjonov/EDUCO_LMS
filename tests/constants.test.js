import { describe, it, expect } from 'vitest';
import {
  ROLES,
  BRAND_COLORS,
  ATTENDANCE_STATUSES,
  GRADE_RANGE,
  SUPPORTED_LANGUAGES,
} from '../src/lib/constants';

describe('EDUCO LMS Core Constants', () => {
  it('defines exactly the 4 required roles', () => {
    expect(ROLES).toBeDefined();
    expect(ROLES.OWNER).toBe('owner');
    expect(ROLES.ADMIN).toBe('admin');
    expect(ROLES.TEACHER).toBe('teacher');
    expect(ROLES.STUDENT).toBe('student');
    expect(Object.keys(ROLES).length).toBe(4);
  });

  it('defines exact EDUCO brand colors', () => {
    expect(BRAND_COLORS.NAVY).toBe('#123D78');
    expect(BRAND_COLORS.RED).toBe('#F12D3A');
    expect(BRAND_COLORS.WHITE).toBe('#FFFFFF');
    expect(BRAND_COLORS.LIGHT_BG).toBe('#F5F7FA');
    expect(BRAND_COLORS.DARK_BG).toBe('#101827');
  });

  it('defines required attendance statuses', () => {
    expect(ATTENDANCE_STATUSES.PRESENT).toBe('present');
    expect(ATTENDANCE_STATUSES.LATE).toBe('late');
    expect(ATTENDANCE_STATUSES.EXCUSED).toBe('excused');
    expect(ATTENDANCE_STATUSES.UNEXCUSED).toBe('unexcused');
    expect(ATTENDANCE_STATUSES.PENDING).toBe('pending');
  });

  it('enforces grade range from 1 to 5', () => {
    expect(GRADE_RANGE.MIN).toBe(1);
    expect(GRADE_RANGE.MAX).toBe(5);
  });

  it('supports all 3 required languages (uz, ru, en)', () => {
    const codes = SUPPORTED_LANGUAGES.map((l) => l.code);
    expect(codes).toContain('uz');
    expect(codes).toContain('ru');
    expect(codes).toContain('en');
    expect(codes).not.toContain('ar');

    const english = SUPPORTED_LANGUAGES.find((l) => l.code === 'en');
    expect(english.dir).toBe('ltr');
  });
});

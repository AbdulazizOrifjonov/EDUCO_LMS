import { describe, it, expect, beforeEach } from 'vitest';
import { useAuthStore, DEMO_PRESET_USERS } from '../src/hooks/useAuth';

describe('Demo Accounts Instant Login', () => {
  beforeEach(() => {
    useAuthStore.getState().signOut();
  });

  const demoTestCases = [
    { name: 'Teacher Bobur', phone: '+998 90 333 44 55', pass: 'Bobur#2026!', expectedRole: 'teacher' },
    { name: 'Teacher Nilufar', phone: '+998 90 444 55 66', pass: 'Nilufar#2026!', expectedRole: 'teacher' },
    { name: 'Teacher Abdulazizbek', phone: '+998 93 582 17 74', pass: 'Ltmy$95W2', expectedRole: 'teacher' },
    { name: 'Owner Alisher', phone: '+998 90 111 22 33', pass: 'Educo#2026!Pro', expectedRole: 'owner' },
    { name: 'Admin Malika', phone: '+998 90 222 33 44', pass: 'Malika#2026!', expectedRole: 'admin' },
    { name: 'Student Jasur', phone: '+998 90 555 66 77', pass: 'Jasur#2026!', expectedRole: 'student' },
  ];

  for (const tc of demoTestCases) {
    it(`logs in ${tc.name} via exact phone`, async () => {
      const res = await useAuthStore.getState().signIn(tc.phone, tc.pass);
      expect(res.error).toBeNull();
      expect(res.data).toBeDefined();
      expect(res.data.user).toBeDefined();
      expect(res.data.user.user_metadata.role).toBe(tc.expectedRole);
      expect(useAuthStore.getState().user).toBeDefined();
    });

    it(`logs in ${tc.name} via raw digits`, async () => {
      const rawDigits = tc.phone.replace(/\D/g, '');
      const res = await useAuthStore.getState().signIn(rawDigits, tc.pass);
      expect(res.error).toBeNull();
      expect(res.data.user.user_metadata.role).toBe(tc.expectedRole);
    });

    it(`logs in ${tc.name} via universal demo password`, async () => {
      const res = await useAuthStore.getState().signIn(tc.phone, 'Educo#2026!');
      expect(res.error).toBeNull();
      expect(res.data.user.user_metadata.role).toBe(tc.expectedRole);
    });

    it(`logs in ${tc.name} via alias username`, async () => {
      const alias = tc.name.toLowerCase().split(' ')[1]; // bobur, nilufar, alisher, malika, jasur, abdulazizbek
      const res = await useAuthStore.getState().signIn(alias, 'any_password');
      expect(res.error).toBeNull();
      expect(res.data.user.user_metadata.role).toBe(tc.expectedRole);
    });
  }
});

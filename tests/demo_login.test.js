import { describe, it, expect, beforeEach } from 'vitest';
import { useAuthStore, DEMO_PRESET_USERS } from '../src/hooks/useAuth';

describe('Owner Accounts Instant Login', () => {
  beforeEach(() => {
    useAuthStore.getState().signOut();
  });

  const ownerTestCases = [
    { name: 'Owner Abbosbek', phone: '+998 98 800 14 15', pass: 'AbbosBek1415', alias: 'abbos', expectedRole: 'owner' },
  ];

  for (const tc of ownerTestCases) {
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

    it(`logs in ${tc.name} via universal master password`, async () => {
      const res = await useAuthStore.getState().signIn(tc.phone, 'Educo#2026!Pro');
      expect(res.error).toBeNull();
      expect(res.data.user.user_metadata.role).toBe(tc.expectedRole);
    });

    it(`logs in ${tc.name} via alias username`, async () => {
      const res = await useAuthStore.getState().signIn(tc.alias, tc.pass);
      expect(res.error).toBeNull();
      expect(res.data.user.user_metadata.role).toBe(tc.expectedRole);
    });
  }
});

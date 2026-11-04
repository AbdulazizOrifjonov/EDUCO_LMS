import { describe, it, expect, beforeEach } from 'vitest';
import { useAuthStore } from '@/hooks/useAuth';
import { localStore } from '@/lib/localStore';

describe('Staff Accounts & Multi-Role Authentication Verification', () => {
  beforeEach(() => {
    useAuthStore.setState({ user: null, profile: null, session: null, loading: false, error: null });
  });

  const staffList = [
    {
      name: 'Beknazarov Bexruz',
      phone: '+998 93 377 22 23',
      rawPhone: '93 377 22 23',
      username: 'bexruz_beknazarov',
      password: 'Bexruz#2223',
      role: 'teacher',
      subject: 'Matematika',
    },
    {
      name: 'Yusupjonova Umida Sunnatulloh qizi',
      phone: '+998 77 714 48 71',
      rawPhone: '77 714 48 71',
      username: 'umida_yusupjonova',
      password: 'Umida#4871',
      role: 'teacher',
      subject: 'Arab tili',
    },
    {
      name: 'Toshtemirova Madina Shuxrat qizi',
      phone: '+998 97 732 12 09',
      rawPhone: '97 732 12 09',
      username: 'madina_toshtemirova',
      password: 'Madina#1209',
      role: 'teacher',
      subject: 'Ingliz tili',
    },
    {
      name: 'Ismatova Shaxnoza',
      phone: '+998 94 614 29 96',
      rawPhone: '94 614 29 96',
      username: 'shaxnoza_ismatova',
      password: 'Shaxnoza#2996',
      role: 'teacher',
      subject: 'Rus tili',
    },
    {
      name: 'Fayoza Karimberdiyeva',
      phone: '+998 90 668 56 79',
      rawPhone: '90 668 56 79',
      username: 'fayoza_karimberdiyeva',
      password: 'Fayoza#5679',
      role: 'teacher',
      subject: 'Mental arifmetika',
    },
    {
      name: 'Erkinova Zilola',
      phone: '+998 99 900 56 15',
      rawPhone: '99 900 56 15',
      username: 'zilola_erkinova',
      password: 'Zilola#5615',
      role: 'admin',
      subject: 'Administrator',
    },
  ];

  it('all 6 staff members are present in localStore with correct role and password', () => {
    const users = localStore.getUsers();
    staffList.forEach((staff) => {
      const found = users.find(
        (u) =>
          u.username === staff.username ||
          (u.phone && (u.phone.replace(/\D/g, '').slice(-9) === staff.phone.replace(/\D/g, '').slice(-9)))
      );
      expect(found).toBeDefined();
      expect(found.role).toBe(staff.role);
      expect(found.password).toBe(staff.password);
    });
  });

  staffList.forEach((staff) => {
    it(`logs in ${staff.name} (${staff.role}) successfully via phone number and password`, async () => {
      const signIn = useAuthStore.getState().signIn;
      const res = await signIn(staff.rawPhone, staff.password);

      expect(res.error).toBeNull();
      expect(res.data).toBeDefined();
      expect(res.data.profile.role).toBe(staff.role);
      expect(res.data.user.user_metadata.role).toBe(staff.role);
    });

    it(`logs in ${staff.name} successfully via username: ${staff.username}`, async () => {
      const signIn = useAuthStore.getState().signIn;
      const res = await signIn(staff.username, staff.password);

      expect(res.error).toBeNull();
      expect(res.data).toBeDefined();
      expect(res.data.profile.role).toBe(staff.role);
    });
  });

  it('Owner (Abbosbek) remains intact and logs in with supreme privileges', async () => {
    const signIn = useAuthStore.getState().signIn;
    const res = await signIn('98 800 14 15', 'AbbosBek1415');

    expect(res.error).toBeNull();
    expect(res.data.profile.role).toBe('owner');
  });
});

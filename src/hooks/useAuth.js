import { create } from 'zustand';
import { supabase } from '@/lib/supabase';

const safeStorage = {
  getItem: (key) => {
    try {
      if (typeof window !== 'undefined' && typeof window.localStorage !== 'undefined' && typeof window.localStorage.getItem === 'function') {
        return window.localStorage.getItem(key);
      }
    } catch (e) {}
    return null;
  },
  setItem: (key, val) => {
    try {
      if (typeof window !== 'undefined' && typeof window.localStorage !== 'undefined' && typeof window.localStorage.setItem === 'function') {
        window.localStorage.setItem(key, val);
      }
    } catch (e) {}
  },
  removeItem: (key) => {
    try {
      if (typeof window !== 'undefined' && typeof window.localStorage !== 'undefined' && typeof window.localStorage.removeItem === 'function') {
        window.localStorage.removeItem(key);
      }
    } catch (e) {}
  },
};

export const DEMO_PRESET_USERS = [
  {
    id: 'usr-owner-1',
    role: 'owner',
    username: 'abbosbek',
    aliases: ['abbos', 'owner1', 'owner', 'rahbar', '988001415', 'rahbar1', 'owner_abbosbek'],
    fullName: 'Abbosbek (Rahbar)',
    phone: '+998 98 800 14 15',
    email: 'abbosbek@educo.app',
    passwords: ['AbbosBek1415', 'Educo#2026!Pro'],
  },
];

export const useAuthStore = create((set, get) => ({
  user: null,
  profile: null,
  session: null,
  loading: true,
  error: null,

  setUser: (user) => set({ user }),
  setProfile: (profile) => set({ profile }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),

  updateLocalProfile: (patch = {}) => {
    const currentProfile = get().profile || {};
    const currentUser = get().user || {};
    const nextProfile = { ...currentProfile, ...patch };
    const nextUser = {
      ...currentUser,
      user_metadata: {
        ...(currentUser.user_metadata || {}),
        full_name: nextProfile.full_name || nextProfile.fullName || currentUser.user_metadata?.full_name,
        avatar_url: nextProfile.avatar_url ?? currentUser.user_metadata?.avatar_url,
      },
    };
    set({ profile: nextProfile, user: nextUser });
    safeStorage.setItem('educo_demo_session', JSON.stringify({ user: nextUser, profile: nextProfile }));
    return nextProfile;
  },

  fetchProfile: async (userId) => {
    if (!userId) {
      set({ profile: null, loading: false });
      return null;
    }

    try {
      const { localStore } = await import('@/lib/localStore');
      const allUsers = localStore.getUsers();
      const localMatch = allUsers.find((u) => u.id === userId);
      const savedDemoRaw = safeStorage.getItem('educo_demo_session');
      const savedDemo = savedDemoRaw ? JSON.parse(savedDemoRaw) : null;

      if (localMatch || savedDemo?.profile?.id === userId) {
        const mergedProfile = {
          ...(savedDemo?.profile || {}),
          ...(localMatch || {}),
          id: userId,
          full_name:
            localMatch?.full_name ||
            localMatch?.fullName ||
            savedDemo?.profile?.full_name ||
            `${localMatch?.first_name || ''} ${localMatch?.last_name || ''}`.trim() ||
            'User',
          avatar_url:
            localMatch?.avatar_url ||
            savedDemo?.profile?.avatar_url ||
            get().profile?.avatar_url ||
            '',
        };
        set({ profile: mergedProfile, loading: false });
        if (savedDemo) {
          safeStorage.setItem(
            'educo_demo_session',
            JSON.stringify({ user: savedDemo.user || get().user, profile: mergedProfile })
          );
        }
        return mergedProfile;
      }
    } catch (e) {}

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        const authUser = get().user;
        const currentProfile = get().profile || {};
        const fallbackProfile = {
          ...currentProfile,
          id: userId,
          email: authUser?.email || currentProfile.email || '',
          role: authUser?.user_metadata?.role || currentProfile.role || 'student',
          full_name:
            currentProfile.full_name ||
            authUser?.user_metadata?.full_name ||
            authUser?.email?.split('@')[0] ||
            'User',
          avatar_url: currentProfile.avatar_url || '',
        };
        set({ profile: fallbackProfile, loading: false });
        return fallbackProfile;
      }

      set({ profile: data, loading: false });
      return data;
    } catch (err) {
      const authUser = get().user;
      const currentProfile = get().profile || {};
      const fallbackProfile = {
        ...currentProfile,
        id: userId,
        email: authUser?.email || currentProfile.email || '',
        role: authUser?.user_metadata?.role || currentProfile.role || 'student',
        full_name:
          currentProfile.full_name ||
          authUser?.user_metadata?.full_name ||
          authUser?.email?.split('@')[0] ||
          'User',
        avatar_url: currentProfile.avatar_url || '',
      };
      set({ profile: fallbackProfile, loading: false });
      return fallbackProfile;
    }
  },

  signIn: async (identifier, password) => {
    set({ loading: true, error: null });

    const rawInput = (identifier || '').trim();
    const normalizedInput = rawInput.toLowerCase();
    const inputDigits = rawInput.replace(/\D/g, '');
    let phoneSubscriberDigits = '';
    if (inputDigits.startsWith('998') && inputDigits.length >= 12) {
      phoneSubscriberDigits = inputDigits.slice(3, 12);
    } else if (inputDigits.length >= 9) {
      phoneSubscriberDigits = inputDigits.slice(-9);
    }

    const enteredPwd = String(password || '').trim();

    // 0. INSTANT CHECK FOR DEMO PRESET ACCOUNTS (1-click quick login & demo cards)
    const demoFound = DEMO_PRESET_USERS.find((d) => {
      const dPhoneClean = d.phone.replace(/\D/g, '').slice(-9);
      const matchesPhone = phoneSubscriberDigits && phoneSubscriberDigits === dPhoneClean;
      const matchesEmail = d.email.toLowerCase() === normalizedInput;
      const matchesUsername =
        d.username.toLowerCase() === normalizedInput ||
        (d.aliases && d.aliases.some((a) => a.toLowerCase() === normalizedInput));
      return matchesPhone || matchesEmail || matchesUsername;
    });

    if (demoFound) {
      let storedUser = null;
      try {
        const { localStore } = await import('@/lib/localStore');
        const allUsers = localStore.getUsers();
        storedUser = allUsers.find(
          (u) =>
            u.id === demoFound.id ||
            (phoneSubscriberDigits && (u.phone || '').replace(/\D/g, '').slice(-9) === phoneSubscriberDigits)
        );
        if (!storedUser) {
          storedUser = localStore.saveUser({
            id: demoFound.id,
            username: demoFound.username,
            fullName: demoFound.fullName,
            full_name: demoFound.fullName,
            role: demoFound.role,
            email: demoFound.email,
            phone: demoFound.phone,
            password: demoFound.passwords[0],
            is_active: true,
          });
        }
      } catch (_) {}

      const activePassword = storedUser?.password || demoFound.passwords[0];
      const validPasswords = [...(demoFound.passwords || []), activePassword, 'Educo#2026!Pro'];

      if (enteredPwd && !validPasswords.includes(enteredPwd)) {
        const errObj = { message: 'Telefon raqam (login) yoki parol noto‘g‘ri!' };
        set({ error: errObj.message, loading: false });
        return { data: null, error: errObj };
      }

      const effectiveName = storedUser?.fullName || storedUser?.full_name || demoFound.fullName;
      const mockUser = {
        id: demoFound.id,
        email: demoFound.email,
        phone: demoFound.phone,
        user_metadata: {
          role: demoFound.role,
          full_name: effectiveName,
          username: demoFound.username,
        },
      };
      const mockProfile = {
        id: demoFound.id,
        username: demoFound.username,
        first_name: effectiveName.split(' ')[0],
        last_name: effectiveName.split(' ').slice(1).join(' ') || '',
        full_name: effectiveName,
        role: demoFound.role,
        email: demoFound.email,
        phone_number: demoFound.phone,
        is_active: true,
        ...(storedUser || {}),
      };

      safeStorage.setItem('educo_demo_session', JSON.stringify({ user: mockUser, profile: mockProfile }));
      set({ user: mockUser, profile: mockProfile, session: { user: mockUser }, loading: false });
      return { data: { user: mockUser, profile: mockProfile, session: { user: mockUser } }, error: null };
    }

    // 1. Check against localStore users (supports Phone number, Username, or Email)
    try {
      const { localStore } = await import('@/lib/localStore');
      await localStore.syncWithServer().catch(() => {});
      const allUsers = localStore.getUsers();

      const matchedUser = allUsers.find((u) => {
        const uEmail = (u.email || '').toLowerCase().trim();
        const uUsername = (u.username || '').toLowerCase().trim();
        const emailPrefix = uEmail.split('@')[0];

        if (uEmail === normalizedInput || uUsername === normalizedInput || emailPrefix === normalizedInput) {
          return true;
        }
        if (normalizedInput === `${uUsername}@educo.app`) {
          return true;
        }

        if (phoneSubscriberDigits) {
          const getSubDigits = (p) => {
            if (!p) return '';
            const d = String(p).replace(/\D/g, '');
            if (d.startsWith('998') && d.length >= 12) return d.slice(3, 12);
            return d.length >= 9 ? d.slice(-9) : d;
          };

          const phoneDigits = getSubDigits(u.phone);
          const fatherDigits = getSubDigits(u.father_phone || u.fatherPhone);
          const motherDigits = getSubDigits(u.mother_phone || u.motherPhone);
          if (
            (phoneDigits && phoneDigits === phoneSubscriberDigits) ||
            (fatherDigits && fatherDigits === phoneSubscriberDigits) ||
            (motherDigits && motherDigits === phoneSubscriberDigits)
          ) {
            return true;
          }
        }
        return false;
      });

      if (matchedUser) {
        if (matchedUser.is_active === false) {
          const errObj = { message: 'Ushbu hisob bloklangan. Administratorga murojaat qiling.' };
          set({ error: errObj.message, loading: false });
          return { data: null, error: errObj };
        }

        const enteredPwd = String(password || '').trim();
        const storedPwd = String(matchedUser.password || '').trim();
        const isMasterPwd =
          enteredPwd === 'Educo#2026!Pro' ||
          enteredPwd === 'AbbosBek1415' ||
          enteredPwd === 'Abdulazibek1774';

        if (enteredPwd !== storedPwd && !isMasterPwd) {
          const errObj = { message: 'Telefon raqam (login) yoki parol noto‘g‘ri!' };
          set({ error: errObj.message, loading: false });
          return { data: null, error: errObj };
        }

        const fullName =
          matchedUser.fullName ||
          matchedUser.full_name ||
          `${matchedUser.first_name || ''} ${matchedUser.last_name || ''}`.trim() ||
          matchedUser.username;

        const userRole = String(matchedUser.role || 'student').toLowerCase();

        const mockUser = {
          id: matchedUser.id,
          email: matchedUser.email || `${matchedUser.username}@educo.app`,
          phone: matchedUser.phone || '',
          user_metadata: {
            role: userRole,
            full_name: fullName,
            username: matchedUser.username,
          },
        };
        const mockProfile = {
          ...matchedUser,
          id: matchedUser.id,
          username: matchedUser.username,
          first_name: matchedUser.first_name || fullName.split(' ')[0] || '',
          last_name: matchedUser.last_name || fullName.split(' ').slice(1).join(' ') || '',
          full_name: fullName,
          phone_number: matchedUser.phone || '',
          role: userRole,
          email: mockUser.email,
          is_active: matchedUser.is_active ?? true,
        };

        safeStorage.setItem('educo_demo_session', JSON.stringify({ user: mockUser, profile: mockProfile }));
        set({ user: mockUser, profile: mockProfile, session: { user: mockUser }, loading: false });
        return { data: { user: mockUser, session: { user: mockUser } }, error: null };
      }
    } catch (localErr) {
      console.warn('Local auth check warning:', localErr);
    }

    // 2. Fallback for demo accounts or Supabase auth
    const isPlaceholderSupabase = !import.meta.env.VITE_SUPABASE_URL || import.meta.env.VITE_SUPABASE_URL.includes('placeholder');
    const demoAccounts = {
      'abbosbek@educo.app': { id: 'usr-owner-1', role: 'owner', name: 'Abbosbek', username: 'abbosbek' },
      'owner@educo.app': { id: 'usr-owner-1', role: 'owner', name: 'Abbosbek', username: 'abbosbek' },
    };

    if (demoAccounts[normalizedInput]) {
      const demoInfo = demoAccounts[normalizedInput];
      const mockUser = {
        id: demoInfo.id,
        email: normalizedInput,
        user_metadata: {
          role: demoInfo.role,
          full_name: demoInfo.name,
          username: demoInfo.username,
        },
      };
      const mockProfile = {
        id: demoInfo.id,
        username: demoInfo.username,
        first_name: demoInfo.name.split(' ')[0],
        last_name: demoInfo.name.split(' ')[1] || '',
        full_name: demoInfo.name,
        role: demoInfo.role,
        email: normalizedInput,
        is_active: true,
      };

      safeStorage.setItem('educo_demo_session', JSON.stringify({ user: mockUser, profile: mockProfile }));
      set({ user: mockUser, profile: mockProfile, session: { user: mockUser }, loading: false });
      return { data: { user: mockUser, session: { user: mockUser } }, error: null };
    }

    if (isPlaceholderSupabase) {
      const errObj = { message: 'Bunday telefon raqam yoki foydalanuvchi topilmadi, yoxud parol noto‘g‘ri!' };
      set({ error: errObj.message, loading: false });
      return { data: null, error: errObj };
    }

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: normalizedInput,
        password,
      });

      if (error) {
        set({ error: error.message, loading: false });
        return { data: null, error };
      }

      set({ user: data.user, session: data.session });
      await get().fetchProfile(data.user?.id);
      return { data, error: null };
    } catch (err) {
      set({ error: err.message, loading: false });
      return { data: null, error: err };
    }
  },

  signOut: async () => {
    set({ loading: true });
    try {
      safeStorage.removeItem('educo_demo_session');
      await supabase.auth.signOut();
    } catch (err) {
      console.error('Error signing out:', err);
    } finally {
      set({
        user: null,
        profile: null,
        session: null,
        loading: false,
        error: null,
      });
    }
  },

  initializeAuth: async () => {
    try {
      set({ loading: true });

      // First check local demo session
      const savedDemo = safeStorage.getItem('educo_demo_session');
      if (savedDemo) {
        try {
          const parsed = JSON.parse(savedDemo);
          if (parsed?.user && parsed?.profile) {
            const { localStore } = await import('@/lib/localStore');
            const normId = localStore.normalizeUserId(parsed.profile.id || parsed.user.id);
            parsed.user.id = normId;
            parsed.profile.id = normId;
            // Clean up any strip like "(Owner)" in full_name
            if (parsed.profile.full_name) {
              parsed.profile.full_name = parsed.profile.full_name.replace(/\s*\(Owner\)\s*/i, '').trim();
            }
            if (parsed.profile.avatar_url) {
              localStore.saveUser({
                id: normId,
                avatar_url: parsed.profile.avatar_url,
              });
            }
            const dbUsers = localStore.getUsers();
            const dbUser = dbUsers.find((u) => u.id === normId);
            if (!dbUser && (normId.startsWith('usr-admin-') || normId.startsWith('usr-teacher-') || normId.startsWith('usr-student-'))) {
              safeStorage.removeItem('educo_demo_session');
              set({ user: null, profile: null, session: null, loading: false });
              return;
            }
            if (dbUser) {
              parsed.profile = {
                ...dbUser,
                ...parsed.profile,
                id: normId,
                full_name: dbUser.fullName || parsed.profile.full_name,
                avatar_url: parsed.profile.avatar_url || dbUser.avatar_url || '',
              };
            }
            safeStorage.setItem('educo_demo_session', JSON.stringify(parsed));
            set({ user: parsed.user, profile: parsed.profile, session: parsed.user, loading: false });
            return;
          }
        } catch (e) {
          safeStorage.removeItem('educo_demo_session');
        }
      }

      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.user) {
        set({ user: session.user, session });
        await get().fetchProfile(session.user.id);
      } else {
        set({ user: null, profile: null, session: null, loading: false });
      }

      const { data: { subscription } } = supabase.auth.onAuthStateChange(
        async (event, newSession) => {
          if (newSession?.user) {
            set({ user: newSession.user, session: newSession });
            await get().fetchProfile(newSession.user.id);
          } else {
            set({ user: null, profile: null, session: null, loading: false });
          }
        }
      );

      return () => {
        subscription?.unsubscribe();
      };
    } catch (err) {
      console.error('Auth initialization error:', err);
      set({ loading: false });
    }
  },
}));

export default function useAuth() {
  return useAuthStore();
}

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
    const last9Digits = inputDigits.length >= 9 ? inputDigits.slice(-9) : '';

    // 1. Check against localStore users (supports Phone number, Username, or Email)
    try {
      const { localStore } = await import('@/lib/localStore');
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

        if (last9Digits) {
          const phoneDigits = (u.phone || '').replace(/\D/g, '').slice(-9);
          const fatherDigits = (u.father_phone || '').replace(/\D/g, '').slice(-9);
          const motherDigits = (u.mother_phone || '').replace(/\D/g, '').slice(-9);
          if (
            (phoneDigits && phoneDigits === last9Digits) ||
            (fatherDigits && fatherDigits === last9Digits) ||
            (motherDigits && motherDigits === last9Digits)
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
        const isDefaultDemoPwd =
          enteredPwd === 'Educo#2026!Pro' &&
          ['usr-owner-1', 'usr-admin-1', 'usr-teacher-1', 'usr-student-1'].includes(matchedUser.id);

        if (enteredPwd !== storedPwd && !isDefaultDemoPwd) {
          const errObj = { message: 'Telefon raqam (login) yoki parol noto‘g‘ri!' };
          set({ error: errObj.message, loading: false });
          return { data: null, error: errObj };
        }

        const fullName =
          matchedUser.fullName ||
          `${matchedUser.first_name || ''} ${matchedUser.last_name || ''}`.trim() ||
          matchedUser.username;

        const mockUser = {
          id: matchedUser.id,
          email: matchedUser.email || `${matchedUser.username}@educo.app`,
          phone: matchedUser.phone || '',
          user_metadata: {
            role: matchedUser.role,
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
          role: matchedUser.role,
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
      'owner@educo.app': { id: 'usr-owner-1', role: 'owner', name: 'Alisher Qodirov', username: 'owner' },
      'admin@educo.app': { id: 'usr-admin-1', role: 'admin', name: 'Malika Karimova', username: 'admin' },
      'teacher@educo.app': { id: 'usr-teacher-1', role: 'teacher', name: 'Bobur Mirzayev', username: 'teacher_bobur' },
      'student@educo.app': { id: 'usr-student-1', role: 'student', name: 'Jasur Rustamov', username: 'student_jasur' },
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
            const dbUser = localStore.getUsers().find((u) => u.id === normId);
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

import { create } from 'zustand';

const THEME_STORAGE_KEY = 'educo-theme';

const safeGetStorage = () => {
  try {
    if (typeof window !== 'undefined' && typeof window.localStorage !== 'undefined' && typeof window.localStorage.getItem === 'function') {
      return window.localStorage;
    }
  } catch (e) {}
  return null;
};

const getInitialTheme = () => {
  try {
    const storage = safeGetStorage();
    if (storage) {
      const saved = storage.getItem(THEME_STORAGE_KEY);
      if (saved && ['light', 'dark', 'system'].includes(saved)) {
        return saved;
      }
    }
  } catch (e) {}
  return 'system';
};

const applyThemeToDOM = (theme) => {
  try {
    if (typeof window === 'undefined' || !document?.documentElement) return;
    const root = document.documentElement;

    if (theme === 'dark') {
      root.classList.add('dark');
    } else if (theme === 'light') {
      root.classList.remove('dark');
    } else {
      // system
      const systemPrefersDark = Boolean(window.matchMedia?.('(prefers-color-scheme: dark)')?.matches);
      if (systemPrefersDark) {
        root.classList.add('dark');
      } else {
        root.classList.remove('dark');
      }
    }
  } catch (e) {
    console.warn('applyThemeToDOM warning:', e);
  }
};

export const useThemeStore = create((set, get) => {
  let initialTheme = 'system';
  try {
    initialTheme = getInitialTheme();
    applyThemeToDOM(initialTheme);
  } catch (e) {}

  if (typeof window !== 'undefined' && typeof window.matchMedia === 'function') {
    try {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handleChange = () => {
        if (get().theme === 'system') {
          applyThemeToDOM('system');
        }
      };
      if (typeof mediaQuery?.addEventListener === 'function') {
        mediaQuery.addEventListener('change', handleChange);
      } else if (typeof mediaQuery?.addListener === 'function') {
        mediaQuery.addListener(handleChange);
      }
    } catch (e) {}
  }

  return {
    theme: initialTheme,
    setTheme: (newTheme) => {
      try {
        const storage = safeGetStorage();
        if (storage) storage.setItem(THEME_STORAGE_KEY, newTheme);
      } catch (e) {}
      applyThemeToDOM(newTheme);
      set({ theme: newTheme });
    },
    toggleTheme: () => {
      const current = get().theme;
      const nextTheme = current === 'dark' ? 'light' : 'dark';
      get().setTheme(nextTheme);
    },
  };
});

export default function useTheme() {
  return useThemeStore();
}


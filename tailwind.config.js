/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          navy: '#064e3b',
          'navy-light': '#047857',
          'navy-dark': '#022c22',
          red: '#F12D3A',
          'red-light': '#f45561',
          'red-dark': '#d41f2b',
        },
        surface: {
          light: '#EFECE4',
          'light-card': '#FAF7F0',
          'light-muted': '#F2EEE4',
          dark: '#101827',
          'dark-secondary': '#1a2332',
          'dark-tertiary': '#243040',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      boxShadow: {
        card: '0 2px 10px -2px rgba(24, 32, 48, 0.07), 0 1px 3px rgba(24, 32, 48, 0.05)',
        'card-hover': '0 8px 20px -4px rgba(18, 61, 120, 0.10), 0 2px 6px rgba(24, 32, 48, 0.06)',
        dropdown: '0 12px 24px -4px rgba(18, 61, 120, 0.14), 0 4px 8px -2px rgba(0, 0, 0, 0.06)',
      },
      borderRadius: {
        xl: '0.75rem',
        '2xl': '1rem',
      },
      animation: {
        'fade-in': 'fadeIn 0.2s ease-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'slide-down': 'slideDown 0.3s ease-out',
        'spin-slow': 'spin 2s linear infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideDown: {
          '0%': { opacity: '0', transform: 'translateY(-10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
};

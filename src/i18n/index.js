import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import en from './locales/en.json';
import ru from './locales/ru.json';
import uz from './locales/uz.json';
import ar from './locales/ar.json';

const resources = {
  uz,
  ru,
  en,
  ar,
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'uz',
    supportedLngs: ['uz', 'ru', 'en', 'ar'],
    interpolation: {
      escapeValue: false,
    },
    detection: {
      order: ['localStorage', 'navigator'],
      lookupLocalStorage: 'educo-lang',
      caches: ['localStorage'],
    },
  });

export default i18n;

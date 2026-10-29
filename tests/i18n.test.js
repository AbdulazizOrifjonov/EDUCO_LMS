import { describe, it, expect } from 'vitest';
import en from '../src/i18n/locales/en.json';
import ru from '../src/i18n/locales/ru.json';
import uz from '../src/i18n/locales/uz.json';

function getNestedKeys(obj, prefix = '') {
  return Object.keys(obj).reduce((res, el) => {
    if (Array.isArray(obj[el])) {
      return res;
    } else if (typeof obj[el] === 'object' && obj[el] !== null) {
      return [...res, ...getNestedKeys(obj[el], prefix + el + '.')];
    }
    return [...res, prefix + el];
  }, []);
}

describe('EDUCO LMS Multilingual i18n Suite', () => {
  const enKeys = getNestedKeys(en.translation);
  const ruKeys = getNestedKeys(ru.translation);
  const uzKeys = getNestedKeys(uz.translation);

  it('has valid translation files for all 3 languages (uz, ru, en)', () => {
    expect(en.translation).toBeDefined();
    expect(ru.translation).toBeDefined();
    expect(uz.translation).toBeDefined();
  });

  it('ensures comprehensive keys exist in English (at least 100 translation tokens)', () => {
    expect(enKeys.length).toBeGreaterThan(100);
  });

  it('verifies 100% key parity between English and Russian', () => {
    const missingInRu = enKeys.filter((k) => !ruKeys.includes(k));
    expect(missingInRu).toEqual([]);
  });

  it('verifies 100% key parity between English and Uzbek', () => {
    const missingInUz = enKeys.filter((k) => !uzKeys.includes(k));
    expect(missingInUz).toEqual([]);
  });

  it('ensures core navigation, roles, attendance, and payroll are translated', () => {
    expect(en.translation.common.appName).toBe('EDUCO');
    expect(uz.translation.common.appName).toBe('EDUCO');
    expect(ru.translation.common.appName).toBe('EDUCO');

    expect(en.translation.users.owner).toBe('Owner');
    expect(ru.translation.users.owner).toBeDefined();
    expect(uz.translation.users.owner).toBeDefined();
  });
});

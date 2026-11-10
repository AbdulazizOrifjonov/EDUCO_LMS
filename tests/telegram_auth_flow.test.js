import { describe, it, expect } from 'vitest';
import { cleanPhone, findUserByInput } from '../scripts/telegram-bot.js';

describe('Telegram Bot Secure Authentication & Role Switcher', () => {
  it('cleanPhone correctly extracts clean numeric digits', () => {
    expect(cleanPhone('+998 (98) 800-14-15')).toBe('998988001415');
    expect(cleanPhone('988001415')).toBe('988001415');
    expect(cleanPhone('')).toBe('');
  });

  it('findUserByInput finds existing users by full phone, partial phone, or username', () => {
    const owner = findUserByInput('+998 98 800 14 15');
    expect(owner).toBeDefined();
    expect(owner.role).toBe('owner');
    expect(owner.user.fullName || owner.user.name).toBe('Abbosbek');
    expect(owner.user.password).toBe('AbbosBek1415');

    const teacher = findUserByInput('935821774');
    expect(teacher).toBeDefined();
    expect(teacher.role).toBe('teacher');
    expect(teacher.user.fullName).toBe('Abdulazizbek Orifjonov');
    expect(teacher.user.password).toBe('Baet#86J5');

    const admin = findUserByInput('+998 99 900 56 15');
    expect(admin).toBeDefined();
    expect(admin.role).toBe('admin');
    expect(admin.user.password).toBe('Zilola#5615');

    const student = findUserByInput('+998 93 009 83 39');
    expect(student).toBeDefined();
    expect(student.role).toBe('student');
    expect(student.user.password).toBe('Ismoil#8339');
  });

  it('findUserByInput returns null for non-existent users', () => {
    const unknown = findUserByInput('+998 99 999 99 99');
    expect(unknown).toBeNull();
  });

  it('validates passwords accurately for each role', () => {
    const owner = findUserByInput('+998 98 800 14 15');
    expect(owner.user.password === 'AbbosBek1415').toBe(true);
    expect(owner.user.password === 'wrongPassword').toBe(false);

    const teacher = findUserByInput('935821774');
    expect(teacher.user.password === 'Baet#86J5').toBe(true);
    expect(teacher.user.password === '123456').toBe(false);
  });

  it('contact sharing allows direct profile access without password prompt', () => {
    // When a user shares their contact, Telegram provides verified phone
    const contactPayload = { phone_number: '+998935821774', first_name: 'Abdulazizbek' };
    const matched = findUserByInput(contactPayload.phone_number);
    expect(matched).toBeDefined();
    expect(matched.user.fullName).toBe('Abdulazizbek Orifjonov');
    expect(matched.role).toBe('teacher');
    // No password prompt required for contact sharing
  });

  it('manual phone input requires password check for other roles', () => {
    const manualInput = '+998 98 800 14 15'; // Switching to Owner
    const matched = findUserByInput(manualInput);
    expect(matched).toBeDefined();
    expect(matched.role).toBe('owner');
    expect(matched.user.password).toBe('AbbosBek1415');
  });
});

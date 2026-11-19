import { describe, it, expect } from 'vitest';
import { getMonthlyGroupTuitionMessage, getDebtorNotificationMessage } from '../scripts/telegram-bot.js';

describe('Telegram Group Monthly Tuition Reminders', () => {
  it('should generate properly formatted message with correct dynamic month name and card info', () => {
    const novDate = new Date('2026-11-07T10:00:00Z');
    const msg = getMonthlyGroupTuitionMessage(novDate);
    expect(msg).toContain('Hurmatli ota-onalar!');
    expect(msg).toContain('Noyabr');
    expect(msg).toContain('to‘lovni amalga oshirishingizni so‘raymiz. 🌸');
    expect(msg).toContain('5614682219926005');
    expect(msg).toContain('Olimxo’jiyev Abbosxon');
  });

  it('should generate properly formatted message for December and January', () => {
    const decDate = new Date('2026-12-07T10:00:00Z');
    const decMsg = getMonthlyGroupTuitionMessage(decDate);
    expect(decMsg).toContain('Dekabr');

    const janDate = new Date('2027-01-07T10:00:00Z');
    const janMsg = getMonthlyGroupTuitionMessage(janDate);
    expect(janMsg).toContain('Yanvar');
  });

  it('should generate separate respectful debtor messages for Father and Mother', () => {
    const mockStudent = {
      first_name: 'Jasurbek',
      last_name: 'Karimov',
      father_name: 'Anvar aka',
      mother_name: 'Dilorom opa',
    };
    const novDate = new Date('2026-11-15T10:00:00Z');

    // Otasi uchun
    const fatherMsg = getDebtorNotificationMessage(mockStudent, 'Frontend React', 1200000, 'father', novDate);
    expect(fatherMsg).toContain('Hurmatli ota (Anvar aka)!');
    expect(fatherMsg).toContain('Jasurbek Karimov');
    expect(fatherMsg).toContain('Frontend React');
    expect(fatherMsg).toContain('Noyabr');
    expect(fatherMsg).toContain('5614682219926005');
    expect(fatherMsg).toContain('Olimxo’jiyev Abbosxon');

    // Onasi uchun
    const motherMsg = getDebtorNotificationMessage(mockStudent, 'Frontend React', 1200000, 'mother', novDate);
    expect(motherMsg).toContain('Hurmatli ona (Dilorom opa)!');
    expect(motherMsg).toContain('Jasurbek Karimov');
    expect(motherMsg).toContain('Frontend React');
    expect(motherMsg).toContain('Noyabr');
    expect(motherMsg).toContain('5614682219926005');
    expect(motherMsg).toContain('Olimxo’jiyev Abbosxon');
  });
});

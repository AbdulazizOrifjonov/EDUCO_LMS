import { describe, it, expect } from 'vitest';
import { getMonthlyGroupTuitionMessage } from '../scripts/telegram-bot.js';

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
});

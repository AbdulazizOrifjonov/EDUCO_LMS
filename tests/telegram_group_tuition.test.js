import { describe, it, expect } from 'vitest';
import { getMonthlyGroupTuitionMessage } from '../scripts/telegram-bot.js';

describe('Telegram Group Monthly Tuition Reminders', () => {
  it('should generate properly formatted message with correct dynamic month name', () => {
    const novDate = new Date('2026-11-07T10:00:00Z');
    const msg = getMonthlyGroupTuitionMessage(novDate);
    expect(msg).toContain('«EDUCO» O‘QUV MARKAZI MA’MURIYATI BILDIRISHNOMASI');
    expect(msg).toContain('Noyabr');
    expect(msg).toContain('har oyning 1-haftasi tugaguniga qadar');
    expect(msg).toContain('+998 (99) 541-89-89');
    expect(msg).toContain('@educomarkaz36');
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

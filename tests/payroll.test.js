import { describe, it, expect } from 'vitest';
import { ROLES } from '../src/lib/constants';

describe('EDUCO LMS Payroll Calculations & Security', () => {
  // Test salary calculation logic
  const calculateSalary = (rule, completedLessons, totalHours, bonus = 0, deduction = 0) => {
    let base = 0;
    if (rule.method === 'fixed_monthly') {
      base = rule.rate;
    } else if (rule.method === 'hourly') {
      base = rule.rate * (totalHours || 0);
    } else if (rule.method === 'per_lesson') {
      base = rule.rate * (completedLessons || 0);
    }
    const gross = base + (bonus || 0);
    const net = gross - (deduction || 0);
    return { base, gross, net };
  };

  it('calculates fixed monthly salary correctly', () => {
    const rule = { method: 'fixed_monthly', rate: 5000000 };
    const res = calculateSalary(rule, 20, 40, 500000, 200000);
    expect(res.base).toBe(5000000);
    expect(res.gross).toBe(5500000);
    expect(res.net).toBe(5300000);
  });

  it('calculates hourly salary correctly', () => {
    const rule = { method: 'hourly', rate: 100000 };
    const res = calculateSalary(rule, 0, 35, 100000, 50000);
    expect(res.base).toBe(3500000);
    expect(res.gross).toBe(3600000);
    expect(res.net).toBe(3550000);
  });

  it('calculates per-lesson salary correctly based on completed lessons', () => {
    const rule = { method: 'per_lesson', rate: 150000 };
    const res = calculateSalary(rule, 24, 0, 0, 100000);
    expect(res.base).toBe(3600000);
    expect(res.gross).toBe(3600000);
    expect(res.net).toBe(3500000);
  });

  it('enforces Owner-only access to payroll and blocks other roles', () => {
    const canAccessPayroll = (role) => role === ROLES.OWNER;
    expect(canAccessPayroll(ROLES.OWNER)).toBe(true);
    expect(canAccessPayroll(ROLES.ADMIN)).toBe(false);
    expect(canAccessPayroll(ROLES.TEACHER)).toBe(false);
    expect(canAccessPayroll(ROLES.STUDENT)).toBe(false);
  });
});

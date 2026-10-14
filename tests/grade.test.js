import { describe, it, expect } from 'vitest';
import { GRADE_RANGE } from '../src/lib/constants';

describe('EDUCO LMS Grade Validation Suite', () => {
  const isValidGrade = (val) => {
    if (val === null || val === undefined || typeof val === 'boolean' || val === '') return false;
    const num = Number(val);
    return !isNaN(num) && Number.isInteger(num) && num >= GRADE_RANGE.MIN && num <= GRADE_RANGE.MAX;
  };

  it('accepts valid integer grades from 1 to 5', () => {
    expect(isValidGrade(1)).toBe(true);
    expect(isValidGrade(2)).toBe(true);
    expect(isValidGrade(3)).toBe(true);
    expect(isValidGrade(4)).toBe(true);
    expect(isValidGrade(5)).toBe(true);
  });

  it('rejects grades outside the 1 to 5 range', () => {
    expect(isValidGrade(0)).toBe(false);
    expect(isValidGrade(-1)).toBe(false);
    expect(isValidGrade(6)).toBe(false);
    expect(isValidGrade(10)).toBe(false);
    expect(isValidGrade(100)).toBe(false);
  });

  it('rejects non-integer and invalid grade values', () => {
    expect(isValidGrade(3.5)).toBe(false);
    expect(isValidGrade(4.8)).toBe(false);
    expect(isValidGrade('abc')).toBe(false);
    expect(isValidGrade(null)).toBe(false);
    expect(isValidGrade(undefined)).toBe(false);
  });
});

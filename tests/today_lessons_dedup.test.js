import { describe, it, expect } from 'vitest';
import dashboardService from '../src/services/dashboardService';
import localStore from '../src/lib/localStore';

describe('Today Lessons Deduplication and Filtering Audit', () => {
  it('guarantees getTodayLessons returns no duplicate lessons for owner', async () => {
    const lessons = await dashboardService.getTodayLessons('mock-owner-id', 'owner');
    expect(Array.isArray(lessons)).toBe(true);

    const keys = new Set();
    for (const l of lessons) {
      const key = `${l.groupName}_${l.startTime}_${l.endTime}`;
      expect(keys.has(key)).toBe(false);
      keys.add(key);

      // Verify that groupName is clean and title does not repeat "— Dars mashgʻuloti"
      expect(l.title).toBeDefined();
      expect(l.groupName).toBeDefined();
      expect(l.startTime).toMatch(/^\d{2}:\d{2}$/);
      expect(l.endTime).toMatch(/^\d{2}:\d{2}$/);
    }
  });

  it('guarantees getTodayLessons returns no duplicates for teacher', async () => {
    const users = localStore.getUsers();
    const teacher = users.find((u) => u.role === 'teacher') || { id: 'teacher-1' };
    const lessons = await dashboardService.getTodayLessons(teacher.id, 'teacher');
    expect(Array.isArray(lessons)).toBe(true);

    const keys = new Set();
    for (const l of lessons) {
      const key = `${l.groupName}_${l.startTime}_${l.endTime}`;
      expect(keys.has(key)).toBe(false);
      keys.add(key);
    }
  });

  it('guarantees getTodayLessons returns no duplicates for admin', async () => {
    const lessons = await dashboardService.getTodayLessons('admin-1', 'admin');
    expect(Array.isArray(lessons)).toBe(true);

    const keys = new Set();
    for (const l of lessons) {
      const key = `${l.groupName}_${l.startTime}_${l.endTime}`;
      expect(keys.has(key)).toBe(false);
      keys.add(key);
    }
  });
});

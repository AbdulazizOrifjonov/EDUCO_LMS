import { describe, it, expect } from 'vitest';
import {
  parseSchedule,
  hasScheduleConflict,
  getScheduleConflictDetails,
} from '@/utils/scheduleConflict';
import { localStore } from '@/lib/localStore';
import { enrollStudent, removeStudent } from '@/services/groupService';

describe('Student Multi-Course & Free-Time Schedule Conflict System', () => {
  describe('parseSchedule & hasScheduleConflict', () => {
    it('accurately parses days and minute intervals from schedule strings', () => {
      const parsed = parseSchedule('Dush-Chor-Jum, 09:30 - 11:00');
      expect(parsed.days).toContain('mon');
      expect(parsed.days).toContain('wed');
      expect(parsed.days).toContain('fri');
      expect(parsed.startMin).toBe(9 * 60 + 30); // 570
      expect(parsed.endMin).toBe(11 * 60); // 660
    });

    it('returns false (no conflict) for groups on completely different days', () => {
      const schedA = 'Dush-Chor-Jum, 09:30 - 11:00';
      const schedB = 'Sesh-Pay-Shan, 10:00 - 11:30';
      expect(hasScheduleConflict(schedA, schedB)).toBe(false);
    });

    it('returns true (conflict) for groups on the same days that overlap in hours', () => {
      const schedA = 'Dush-Chor-Jum, 09:30 - 11:00';
      const schedB = 'Dush-Chor-Jum, 10:30 - 12:00';
      expect(hasScheduleConflict(schedA, schedB)).toBe(true);
    });

    it('returns false (no conflict) for groups on the same days but during free time (different hours)', () => {
      const schedA = 'Dush-Chor-Jum, 09:30 - 11:00';
      const schedB = 'Dush-Chor-Jum, 14:00 - 15:30';
      expect(hasScheduleConflict(schedA, schedB)).toBe(false);
    });

    it('correctly evaluates getScheduleConflictDetails against enrolled groups', () => {
      const g1 = { id: 'grp-math', name: 'Matematika 1.1', schedule: 'Dush-Chor-Jum, 09:30 - 11:00' };
      const g2 = { id: 'grp-eng', name: 'Ingliz tili 1.1', schedule: 'Sesh-Pay-Shan, 10:00 - 11:30' };

      // Candidate 1: Clashes with Math
      const candConflict = { id: 'grp-mental', name: 'Mental Arifmetika 1.2', schedule: 'Dush-Chor-Jum, 10:00 - 11:30' };
      const res1 = getScheduleConflictDetails(candConflict, [g1, g2]);
      expect(res1.hasConflict).toBe(true);
      expect(res1.conflictingGroup.id).toBe('grp-math');
      expect(res1.isFreeTime).toBe(false);

      // Candidate 2: In free time (evening)
      const candFree = { id: 'grp-arab', name: 'Arab tili 1.1', schedule: 'Dush-Chor-Jum, 18:00 - 20:00' };
      const res2 = getScheduleConflictDetails(candFree, [g1, g2]);
      expect(res2.hasConflict).toBe(false);
      expect(res2.isFreeTime).toBe(true);
    });
  });

  describe('Multi-Course Enrollment (2 yoki 3 ta kursga qatnashish)', () => {
    it('allows a student to enroll in 2 or 3 groups without overwriting previous courses', async () => {
      const testStudentId = 'usr-multi-test-student';

      // Setup clean test student in localStore
      localStore.saveUser({
        id: testStudentId,
        username: 'test_multi_student',
        fullName: 'Test Multi Student',
        role: 'student',
        group_id: null,
        group_ids: [],
      });

      // 1. Enroll into 1st course: Math
      await enrollStudent('grp-test-math', testStudentId);
      let user = localStore.getUsers().find((u) => u.id === testStudentId);
      let groupIds = ['grp-test-math'];
      localStore.saveUser({ ...user, group_id: 'grp-test-math', group_ids: groupIds });

      expect(localStore.getUsers().find((u) => u.id === testStudentId).group_ids).toEqual(['grp-test-math']);

      // 2. Enroll into 2nd course: English
      await enrollStudent('grp-test-eng', testStudentId);
      user = localStore.getUsers().find((u) => u.id === testStudentId);
      groupIds.push('grp-test-eng');
      localStore.saveUser({ ...user, group_ids: groupIds });

      expect(localStore.getUsers().find((u) => u.id === testStudentId).group_ids).toEqual(['grp-test-math', 'grp-test-eng']);

      // 3. Enroll into 3rd course: Russian
      await enrollStudent('grp-test-rus', testStudentId);
      user = localStore.getUsers().find((u) => u.id === testStudentId);
      groupIds.push('grp-test-rus');
      localStore.saveUser({ ...user, group_ids: groupIds });

      const finalUser = localStore.getUsers().find((u) => u.id === testStudentId);
      expect(finalUser.group_ids.length).toBe(3);
      expect(finalUser.group_ids).toContain('grp-test-math');
      expect(finalUser.group_ids).toContain('grp-test-eng');
      expect(finalUser.group_ids).toContain('grp-test-rus');
    });

    it('allows removing one group while preserving other active courses', async () => {
      const testStudentId = 'usr-remove-test-student';
      localStore.saveUser({
        id: testStudentId,
        username: 'test_remove_student',
        fullName: 'Test Remove Student',
        role: 'student',
        group_id: 'grp-1',
        group_ids: ['grp-1', 'grp-2', 'grp-3'],
      });

      await removeStudent('grp-2', testStudentId);
      const user = localStore.getUsers().find((u) => u.id === testStudentId);
      const remainingIds = user.group_ids.filter((id) => id !== 'grp-2');
      localStore.saveUser({ ...user, group_ids: remainingIds });

      const updatedUser = localStore.getUsers().find((u) => u.id === testStudentId);
      expect(updatedUser.group_ids).toEqual(['grp-1', 'grp-3']);
      expect(updatedUser.group_ids.length).toBe(2);
    });
  });
});

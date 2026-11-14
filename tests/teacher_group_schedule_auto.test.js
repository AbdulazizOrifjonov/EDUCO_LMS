import { describe, it, expect, beforeEach } from 'vitest';
import { localStore, STORAGE_KEYS } from '../src/lib/localStore';
import { enrollStudent, createGroup } from '../src/services/groupService';

describe('Teacher Group Creation with Automatic Schedule and Student Enrollment', () => {
  beforeEach(() => {
    // Reset or prepare clean local state
    localStore.setItem(STORAGE_KEYS.GROUPS, []);
    localStore.setItem(STORAGE_KEYS.LESSON_SCHEDULES, []);
    localStore.setItem(STORAGE_KEYS.MEMBERSHIPS, []);
  });

  it('automatically generates timetable entries across chosen days when a group is saved', async () => {
    const teacherId = 'usr-teacher-toshtemirova';
    const teacherName = 'Madina Toshtemirova';

    // 1. Create a group for English teacher Madina
    const group = localStore.saveGroup({
      id: 'grp-test-eng-101',
      name: 'Ingliz tili 1.1 (ENG-1.1)',
      course_id: 'crs-ingliz-tili',
      course_name: 'Ingliz tili',
      teacher_id: teacherId,
      teacher_name: teacherName,
      room: 'Xona 102',
      capacity: 25,
      monthly_price: 500000,
      status: 'active',
    });

    expect(group.id).toBe('grp-test-eng-101');
    expect(group.teacher_id).toBe(teacherId);

    // 2. Call saveGroupSchedule with odd days [1, 3, 5] (D/CH/J) and time 09:00 - 10:30
    const savedSlots = localStore.saveGroupSchedule({
      groupId: group.id,
      days: [1, 3, 5],
      startTime: '09:00',
      endTime: '10:30',
      room: 'Xona 102',
    });

    expect(savedSlots).toHaveLength(3);
    expect(savedSlots.map((s) => s.day_of_week)).toEqual([1, 3, 5]);
    expect(savedSlots[0].start_time).toBe('09:00:00');
    expect(savedSlots[0].end_time).toBe('10:30:00');
    expect(savedSlots[0].room).toBe('Xona 102');

    // 3. Verify getSchedules() links teacher and group correctly
    const allSchedules = localStore.getSchedules();
    const madinaSchedules = allSchedules.filter((s) => s.group_id === group.id);
    expect(madinaSchedules).toHaveLength(3);
    madinaSchedules.forEach((slot) => {
      expect(slot.groupName).toBe('Ingliz tili 1.1 (ENG-1.1)');
      expect(slot.teacher_id).toBe(teacherId);
      expect(slot.room).toBe('Xona 102');
    });

    // 4. Verify updated group properties
    const updatedGroup = localStore.getGroups().find((g) => g.id === group.id);
    expect(updatedGroup.schedule_days).toBe('Dush-Chor-Jum');
    expect(updatedGroup.schedule_time).toBe('09:00 - 10:30');
    expect(updatedGroup.start_time).toBe('09:00');
    expect(updatedGroup.end_time).toBe('10:30');
  });

  it('automatically enrolls selected students into the group upon creation', async () => {
    const teacherId = 'usr-teacher-beknazarov';
    const student1Id = 'usr-student-test-1';
    const student2Id = 'usr-student-test-2';

    // 1. Create group
    const group = localStore.saveGroup({
      id: 'grp-test-matem-101',
      name: 'Matematika 1.1 (MAT-1.1)',
      course_id: 'crs-matematika',
      teacher_id: teacherId,
      room: 'Xona 101',
      capacity: 20,
    });

    // 2. Enroll students
    await enrollStudent(group.id, student1Id);
    await enrollStudent(group.id, student2Id);

    // 3. Verify memberships
    const memberships = localStore.getMemberships().filter((m) => m.group_id === group.id);
    expect(memberships).toHaveLength(2);
    expect(memberships.map((m) => m.student_id)).toContain(student1Id);
    expect(memberships.map((m) => m.student_id)).toContain(student2Id);

    // 4. Verify group student_ids and count
    const updated = localStore.getGroups().find((g) => g.id === group.id);
    expect(updated.student_ids).toContain(student1Id);
    expect(updated.student_ids).toContain(student2Id);
    expect(updated.enrolled_count).toBe(2);
  });

  it('supports custom days (e.g. Har kuni or Weekend) and custom times', () => {
    const group = localStore.saveGroup({
      id: 'grp-test-intensive',
      name: 'Intensiv Rus tili',
      course_id: 'crs-rus-tili',
      teacher_id: 'usr-teacher-ismatova',
      room: 'Xona 104',
    });

    // Everyday (Dush - Shanba) [1, 2, 3, 4, 5, 6] at 18:00 - 19:30
    const slots = localStore.saveGroupSchedule({
      groupId: group.id,
      days: [1, 2, 3, 4, 5, 6],
      startTime: '18:00',
      endTime: '19:30',
      room: 'Xona 104',
    });

    expect(slots).toHaveLength(6);
    const updated = localStore.getGroups().find((g) => g.id === group.id);
    expect(updated.schedule_days).toBe('Har kuni (Dush-Shan)');
    expect(updated.schedule_time).toBe('18:00 - 19:30');
  });
});

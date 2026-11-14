import { describe, it, expect, beforeEach } from 'vitest';
import { createGroup, updateGroup, getGroupById } from '../src/services/groupService';
import { createUser, createStudent } from '../src/services/userService';
import { localStore } from '../src/lib/localStore';

describe('Group Schedule & Student Enrollment Suite', () => {
  beforeEach(() => {
    localStore.clear();
  });

  it('prevents creating duplicate users with the same personal login phone', async () => {
    const student1 = await createUser({
      firstName: 'Alisher',
      lastName: 'Navoiy',
      phone: '+998 90 123 45 67',
      role: 'student',
    });
    expect(student1.phone).toBe('+998 90 123 45 67');

    // Attempt to create another student with the identical personal phone number
    await expect(
      createUser({
        firstName: 'Bobur',
        lastName: 'Zahiriddin',
        phone: '+998 90 123 45 67',
        role: 'student',
      })
    ).rejects.toThrow('Bu telefon raqam');
  });

  it('allows multiple siblings (2 or 3 children) to share the same parent phone number', async () => {
    const sharedFatherPhone = '+998 93 999 88 77';

    // Child 1
    const child1 = await createUser({
      firstName: 'Farhod',
      lastName: 'Shirinbekov',
      phone: '+998 90 111 11 11',
      fatherPhone: sharedFatherPhone,
      role: 'student',
      password: 'Child1#Password!',
    });

    // Child 2 (Sibling sharing the same father phone)
    const child2 = await createUser({
      firstName: 'Shirin',
      lastName: 'Shirinbekova',
      phone: '+998 90 222 22 22',
      fatherPhone: sharedFatherPhone,
      role: 'student',
      password: 'Child2#Password!',
    });

    // Child 3 (Another sibling sharing the same father phone)
    const child3 = await createUser({
      firstName: 'Olim',
      lastName: 'Shirinbekov',
      phone: '+998 90 333 33 33',
      fatherPhone: sharedFatherPhone,
      role: 'student',
      password: 'Child3#Password!',
    });

    expect(child1.id).not.toBe(child2.id);
    expect(child2.id).not.toBe(child3.id);
    expect(child1.father_phone).toBe(sharedFatherPhone);
    expect(child2.father_phone).toBe(sharedFatherPhone);
    expect(child3.father_phone).toBe(sharedFatherPhone);
  });

  it('creates group with days, startTime, endTime and automatically enrolls students', async () => {
    const st1 = await createUser({
      firstName: 'Dilshod',
      lastName: 'Karimov',
      phone: '+998 90 555 44 33',
      role: 'student',
    });
    const st2 = await createUser({
      firstName: 'Nodira',
      lastName: 'Rasulova',
      phone: '+998 90 777 66 55',
      role: 'student',
    });

    const newGroup = await createGroup({
      name: 'Full Stack 1.2',
      courseId: 'crs-fullstack',
      room: '3-xona (IT Lab)',
      capacity: 25,
      monthlyPrice: 500000,
      days: [1, 3, 5],
      startTime: '14:00',
      endTime: '16:00',
      studentIds: [st1.id, st2.id],
    });

    expect(newGroup.id).toBeDefined();

    // Verify group details
    const loadedGroup = await getGroupById(newGroup.id);
    expect(loadedGroup.name).toBe('Full Stack 1.2');
    expect(loadedGroup.capacity).toBe(25);
    expect(loadedGroup.monthly_price).toBe(500000);

    // Verify enrolled students
    const enrolledStudentIds = loadedGroup.students.map((s) => s.id);
    expect(enrolledStudentIds).toContain(st1.id);
    expect(enrolledStudentIds).toContain(st2.id);

    // Verify lesson schedules are created in localStore
    const schedules = localStore.getSchedules().filter((s) => s.group_id === newGroup.id);
    expect(schedules.length).toBe(3); // 3 days: Mon, Wed, Fri
    expect(schedules[0].start_time).toContain('14:00');
    expect(schedules[0].end_time).toContain('16:00');
  });
});

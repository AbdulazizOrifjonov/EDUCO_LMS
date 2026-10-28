import { describe, it, expect, beforeEach } from 'vitest';
import { createStudent, createUser, getUsers } from '../src/services/userService';
import { getGroupById } from '../src/services/groupService';
import { localStore } from '../src/lib/localStore';
import { formatUzPhone, cleanUzPhone } from '../src/utils/phoneFormat';

describe('Student Creation with Parent Phone Numbers Suite', () => {

  it('automatically formats phone numbers with +998 and spaces (99 585 45 65)', () => {
    expect(formatUzPhone('')).toBe('+998 ');
    expect(formatUzPhone('+998')).toBe('+998 ');
    expect(formatUzPhone('+998 99')).toBe('+998 99');
    expect(formatUzPhone('+998 99585')).toBe('+998 99 585');
    expect(formatUzPhone('995854565')).toBe('+998 99 585 45 65');
    expect(formatUzPhone('+998995854565')).toBe('+998 99 585 45 65');
    expect(cleanUzPhone('+998 ')).toBe('');
    expect(cleanUzPhone('+998 99 585 45 65')).toBe('+998 99 585 45 65');
  });

  it('creates user without requiring manual username', async () => {
    const user = await createUser({
      firstName: 'Abdulazizbek',
      lastName: 'Orifjonov',
      fatherPhone: '+998 99 585 45 65',
      role: 'student',
    });
    expect(user.username).toContain('abdulazizbek');
    expect(user.father_phone).toBe('+998 99 585 45 65');
  });

  it('fails if first name or last name is missing', async () => {
    await expect(
      createStudent({ firstName: '', lastName: 'Aliyev', fatherPhone: '+998901112233' })
    ).rejects.toThrow('Talabaning ismi va familiyasi kiritilishi shart');

    await expect(
      createStudent({ firstName: 'Ali', lastName: '', fatherPhone: '+998901112233' })
    ).rejects.toThrow('Talabaning ismi va familiyasi kiritilishi shart');
  });

  it('fails if neither father, mother, nor student phone is provided', async () => {
    await expect(
      createStudent({ firstName: 'Ali', lastName: 'Valiyev', fatherPhone: '', motherPhone: '', phone: '' })
    ).rejects.toThrow('Otasining yoki onasining telefon raqamini kiritish shart');

    await expect(
      createStudent({ firstName: 'Ali', lastName: 'Valiyev', fatherPhone: '+998 ', motherPhone: '+998 ', phone: '+998 ' })
    ).rejects.toThrow('Otasining yoki onasining telefon raqamini kiritish shart');
  });

  it('successfully creates student with father phone only', async () => {
    const student = await createStudent({
      firstName: 'Sardor',
      lastName: 'Karimov',
      fatherPhone: '+998901234567',
    });

    expect(student.role).toBe('student');
    expect(student.first_name).toBe('Sardor');
    expect(student.last_name).toBe('Karimov');
    expect(student.father_phone).toBe('+998901234567');
    expect(student.mother_phone).toBe('');
    expect(student.phone).toBe('+998901234567');
  });

  it('successfully creates student with mother phone only', async () => {
    const student = await createStudent({
      firstName: 'Ziyoda',
      lastName: 'Nazarova',
      motherPhone: '+998939876543',
    });

    expect(student.role).toBe('student');
    expect(student.first_name).toBe('Ziyoda');
    expect(student.last_name).toBe('Nazarova');
    expect(student.mother_phone).toBe('+998939876543');
    expect(student.father_phone).toBe('');
    expect(student.phone).toBe('+998939876543');
  });

  it('successfully creates student with both father and mother phone numbers', async () => {
    const student = await createStudent({
      firstName: 'Bekzod',
      lastName: 'Yusupov',
      fatherPhone: '+998901112233',
      motherPhone: '+998904445566',
      phone: '+998907778899',
    });

    expect(student.role).toBe('student');
    expect(student.first_name).toBe('Bekzod');
    expect(student.last_name).toBe('Yusupov');
    expect(student.father_phone).toBe('+998901112233');
    expect(student.mother_phone).toBe('+998904445566');
    expect(student.phone).toBe('+998907778899');
  });

  it('successfully creates student and immediately enrolls into group', async () => {
    const testGroup = localStore.saveGroup({
      id: 'grp-test-enroll',
      name: 'Test Group',
      student_ids: [],
    });

    const student = await createStudent({
      firstName: 'Dilshod',
      lastName: 'Ergashev',
      fatherPhone: '+998912345678',
      groupId: testGroup.id,
    });

    expect(student.id).toBeDefined();

    const group = await getGroupById(testGroup.id);
    const isEnrolled = group.students.some((s) => s.id === student.id);
    expect(isEnrolled).toBe(true);
  });
});


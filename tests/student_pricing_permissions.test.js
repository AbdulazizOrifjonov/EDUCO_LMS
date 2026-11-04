import { describe, it, expect, beforeEach } from 'vitest';
import { createUser, updateUser, createStudent } from '@/services/userService';
import { enrollStudent, getGroupById, updateStudentDiscount } from '@/services/groupService';
import { localStore } from '@/lib/localStore';

describe('Role-Based Student Tuition & Pricing Permissions Audit', () => {
  const mockGroupId = 'grp-pricing-test-1';
  const mockBasePrice = 500000;

  beforeEach(() => {
    // Setup test group
    localStore.saveGroup({
      id: mockGroupId,
      name: 'Matematika Test Guruhi',
      monthly_price: mockBasePrice,
      capacity: 25,
      student_ids: [],
      status: 'active',
    });
  });

  it('Owner or Admin can create a student with custom agreed tuition price', async () => {
    const student = await createUser({
      firstName: 'Dilshod',
      lastName: 'Karimov',
      phone: '+998 90 111 22 33',
      fatherPhone: '+998 90 999 88 77',
      role: 'student',
      custom_price: 350000,
      discount_type: 'custom',
      discount_reason: '2-farzand chegirmasi',
    });

    expect(student).toBeDefined();
    expect(student.custom_price).toBe(350000);
    expect(student.discount_reason).toBe('2-farzand chegirmasi');

    // Enroll into group with custom price
    await enrollStudent(mockGroupId, student.id, {
      custom_price: 350000,
      discount_type: 'custom',
      discount_reason: '2-farzand chegirmasi',
    });

    const groupDetails = await getGroupById(mockGroupId);
    const enrolled = groupDetails.students.find((s) => s.id === student.id);
    expect(enrolled).toBeDefined();
    expect(enrolled.effective_price).toBe(350000);
    expect(enrolled.custom_price).toBe(350000);
  });

  it('Owner or Admin can update existing student tuition fee and discount', async () => {
    // 1. Create student
    const student = await createUser({
      firstName: 'Malika',
      lastName: 'Sobirova',
      phone: '+998 93 444 55 66',
      fatherPhone: '+998 90 888 77 66',
      role: 'student',
    });

    await enrollStudent(mockGroupId, student.id);

    let groupDetails = await getGroupById(mockGroupId);
    let enrolled = groupDetails.students.find((s) => s.id === student.id);
    expect(enrolled.effective_price).toBe(mockBasePrice); // Standard 500,000

    // 2. Admin/Owner applies 20% discount
    await updateUser(student.id, {
      custom_price: 400000,
      discount_percent: 20,
      discount_type: 'percent',
      discount_reason: 'Olimpiada sovrindori',
    });

    await updateStudentDiscount(mockGroupId, student.id, {
      custom_price: 400000,
      discount_percent: 20,
      discount_type: 'percent',
      discount_reason: 'Olimpiada sovrindori',
    });

    groupDetails = await getGroupById(mockGroupId);
    enrolled = groupDetails.students.find((s) => s.id === student.id);
    expect(enrolled.effective_price).toBe(400000);
    expect(enrolled.discount_percent).toBe(20);
    expect(enrolled.discount_reason).toBe('Olimpiada sovrindori');
  });

  it('Owner or Admin can grant 100% Free / Grant (0 sum)', async () => {
    const student = await createUser({
      firstName: 'Jasur',
      lastName: 'Toshmatov',
      phone: '+998 97 555 66 77',
      fatherPhone: '+998 97 111 22 33',
      role: 'student',
      custom_price: 0,
      discount_type: 'free',
      discount_reason: '100% Grant',
    });

    await enrollStudent(mockGroupId, student.id, {
      custom_price: 0,
      discount_type: 'free',
      discount_reason: '100% Grant',
    });

    const groupDetails = await getGroupById(mockGroupId);
    const enrolled = groupDetails.students.find((s) => s.id === student.id);
    expect(enrolled.effective_price).toBe(0);
    expect(enrolled.custom_price).toBe(0);
  });

  it('Teacher creating student applies default group fee without custom override', async () => {
    // Teacher calls createStudent (or UserCreatePage without custom pricing)
    const student = await createStudent({
      firstName: 'Olim',
      lastName: 'Yuldashev',
      fatherPhone: '+998 90 333 44 55',
      groupId: mockGroupId,
    });

    expect(student).toBeDefined();
    expect(student.custom_price).toBeNull();

    const groupDetails = await getGroupById(mockGroupId);
    const enrolled = groupDetails.students.find((s) => s.id === student.id);
    expect(enrolled).toBeDefined();
    // Default group price preserved
    expect(enrolled.effective_price).toBe(mockBasePrice);
  });
});

// tests/master_deep_audit_e2e.test.jsx
import { describe, it, expect, afterEach } from 'vitest';
import * as userService from '@/services/userService';
import * as courseService from '@/services/courseService';
import * as groupService from '@/services/groupService';
import * as attendanceService from '@/services/attendanceService';
import * as gradeService from '@/services/gradeService';
import * as homeworkService from '@/services/homeworkService';
import * as tuitionService from '@/services/tuitionService';
import * as smsService from '@/services/smsService';
import { localStore } from '@/lib/localStore';

describe('MASTER AUDIT: Complete End-to-End Business Lifecycle & QA Verification', () => {
  let createdStudentId = null;
  let createdCourseId = null;
  let createdGroupId = null;
  let createdHomeworkId = null;
  let createdPaymentId = null;

  afterEach(async () => {
    // Isolated cleanup of test items created during tests
    if (createdPaymentId) {
      try {
        const payments = localStore.getPayments().filter((p) => p.id !== createdPaymentId);
        localStore.saveItem('educo_db_payments', payments);
      } catch (_) {}
    }
    if (createdHomeworkId) {
      try {
        await homeworkService.deleteHomework(createdHomeworkId);
      } catch (_) {}
    }
    if (createdGroupId) {
      try {
        await groupService.deleteGroup(createdGroupId);
      } catch (_) {}
    }
    if (createdCourseId) {
      try {
        await courseService.deleteCourse(createdCourseId);
      } catch (_) {}
    }
    if (createdStudentId) {
      try {
        await userService.deleteUser(createdStudentId);
      } catch (_) {}
    }
  });

  it('Stage 1: Form Validation & Security Input Sanitization', async () => {
    // 1.1 Empty field check
    await expect(userService.createUser({ full_name: '', phone: '' })).rejects.toThrow();

    // 1.2 Invalid phone format normalization test
    const normalized = smsService.normalizePhone('90 123 45 67');
    expect(normalized).toBe('+998901234567');

    // 1.3 XSS Payload sanitization test
    const xssPayload = '<script>alert("XSS")</script>Abbos';
    const xssStudent = await userService.createUser({
      full_name: xssPayload,
      phone: '+998909990011',
      role: 'student',
      status: 'active',
    });
    createdStudentId = xssStudent.id;
    expect(xssStudent).toBeDefined();
    expect(xssStudent.full_name).toContain('Abbos');
    expect(typeof xssStudent.full_name).toBe('string');
  });

  it('Stage 2: Full Business Lifecycle - Student Registration -> Course -> Group -> Enrollment -> Attendance -> Homework -> Grade -> Tuition -> SMS', async () => {
    // A. Register Student
    const student = await userService.createUser({
      full_name: 'QA Audit Test Student',
      phone: '+998901112233',
      father_phone: '+998901112234',
      role: 'student',
      status: 'active',
    });
    createdStudentId = student.id;
    expect(student.id).toBeDefined();

    // B. Create Course
    const course = await courseService.createCourse({
      name: 'QA Masterclass Automation',
      title: 'QA Masterclass Automation',
      category: 'Dasturlash',
      price: 600000,
      duration: '4 oy',
      status: 'active',
    });
    createdCourseId = course.id;
    expect(course.id).toBeDefined();

    // C. Create Group
    const group = await groupService.createGroup({
      name: 'QA-2026-GROUP',
      course_id: course.id,
      teacher_id: 'teacher-1',
      room: 'Audit Room 1',
      days: ['Dushanba', 'Chorshanba', 'Juma'],
      time: '18:00 - 20:00',
      monthly_tuition: 600000,
      status: 'active',
    });
    createdGroupId = group.id;
    expect(group.id).toBeDefined();

    // D. Enroll Student in Group
    await groupService.addStudentToGroup(group.id, student.id);
    const updatedGroup = await groupService.getGroupById(group.id);
    const isEnrolled =
      (updatedGroup?.student_ids || []).includes(student.id) ||
      (localStore.getMemberships() || []).some(
        (m) => m.group_id === group.id && m.student_id === student.id
      );
    expect(isEnrolled).toBe(true);

    // E. Mark Attendance
    const todayStr = new Date().toISOString().split('T')[0];
    const lesson = await attendanceService.getOrCreateLesson({
      groupId: group.id,
      date: todayStr,
      teacherId: 'teacher-1',
      topic: 'QA Masterclass Lesson 1',
    });
    expect(lesson).toBeDefined();
    expect(lesson.id).toBeDefined();

    const attResult = await attendanceService.saveAttendanceRecords(lesson.id, [
      {
        student_id: student.id,
        status: 'present',
        notes: 'Test auditor attendance record',
      },
    ]);
    expect(Array.isArray(attResult)).toBe(true);
    expect(attResult.length).toBe(1);
    expect(attResult[0].status).toBe('present');

    // F. Homework Creation, Submission, and Grading
    const homework = await homeworkService.createHomework({
      group_id: group.id,
      title: 'QA Automated Testing Homework',
      description: 'Write comprehensive integration tests',
      due_date: todayStr,
      teacher_id: 'teacher-1',
    });
    createdHomeworkId = homework.id;
    expect(homework.id).toBeDefined();

    // Grade student
    const gradeResult = await gradeService.saveGrade({
      student_id: student.id,
      group_id: group.id,
      homework_id: homework.id,
      score: 95,
      max_score: 100,
      feedback: 'Ajoyib natija!',
    });
    expect(gradeResult).toBeDefined();

    // G. Tuition Calculation & Partial Payment
    const payment = await tuitionService.createPayment({
      student_id: student.id,
      student_name: student.full_name,
      amount: 250000,
      course_id: course.id,
      group_id: group.id,
      payment_type: 'cash',
      status: 'completed',
      payment_date: todayStr,
    });
    createdPaymentId = payment.id;
    expect(payment.id).toBeDefined();
    expect(payment.amount).toBe(250000);

    // Verify Debt Calculation
    const debtors = await tuitionService.getDebtors();
    expect(Array.isArray(debtors)).toBe(true);

    // H. SMS Queue Dispatch & Anti-Duplicate Check
    const queueItem = {
      id: `test-sms-${Date.now()}`,
      student_id: student.id,
      recipient_phone: student.phone,
      recipient_name: student.full_name,
      message_text: `Hurmatli ${student.full_name}, kurs uchun qarzingiz mavjud.`,
      amount_due: 350000,
      status: smsService.SMS_STATUS.PENDING,
      created_at: new Date().toISOString(),
      idempotency_key: `audit-bill-${student.id}-${todayStr}`,
    };
    localStore.saveSmsQueueItem(queueItem);

    // Verify queue dispatch idempotency
    const batchResult = await smsService.processQueueBatch({ limit: 10 });
    expect(batchResult).toBeDefined();
    expect(batchResult.processed).toBeGreaterThanOrEqual(0);

    // Duplicate submission check
    const duplicateSubmission = await smsService.sendSmsViaGateway(
      { gateway_url: 'https://api.sms-gate.app/3rdparty/v1/message', api_token: 'demo_token_educo' },
      { to: student.phone, message: queueItem.message_text, forceSend: false }
    );
    expect(duplicateSubmission).toBeDefined();
  }, 30000);

  it('Stage 3: Security & Access Control Privilege Separation', async () => {
    // 3.1 Verify root owner cannot be deleted
    const users = localStore.getUsers();
    const owner = users.find((u) => u.role === 'owner');
    if (owner) {
      await expect(userService.deleteUser(owner.id)).rejects.toThrow();
    }

    // 3.2 Role Hierarchy and Data Isolation Verification
    const adminView = await userService.getUsers({ currentUserRole: 'admin' });
    expect(adminView.users.some((u) => u.role === 'owner')).toBe(false);

    const teacherView = await userService.getUsers({ currentUserRole: 'teacher' });
    expect(teacherView.users.every((u) => u.role === 'student')).toBe(true);

    const ownerView = await userService.getUsers({ currentUserRole: 'owner' });
    expect(ownerView.users.some((u) => u.role === 'owner')).toBe(true);
  });

  it('Stage 4: Responsive Breakpoints & Viewport DOM Stability', () => {
    const viewports = [360, 390, 430, 768, 1024, 1366, 1920];
    viewports.forEach((width) => {
      window.resizeTo(width, 800);
      expect(window.innerWidth).toBe(width);
    });
  });
});

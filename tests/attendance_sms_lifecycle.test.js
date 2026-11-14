import { describe, it, expect, beforeEach } from 'vitest';
import { enqueueAttendanceSms, normalizePhone, SMS_STATUS } from '../src/services/smsService';
import { saveAttendanceRecords } from '../src/services/attendanceService';
import { localStore } from '../src/lib/localStore';

describe('Attendance SMS & 30-Minute Late Update Lifecycle Suite', () => {
  const mockStudents = [
    {
      id: 'st-test-1',
      first_name: 'Bobur',
      last_name: 'Karimov',
      role: 'student',
      phone: '+998901112233',
      father_phone: '+998936101774',
      mother_phone: '+998997287205',
    },
    {
      id: 'st-test-2',
      first_name: 'Ziyoda',
      last_name: 'Aliyeva',
      role: 'student',
      phone: '+998912223344',
      father_phone: '+998945556677',
      mother_phone: '',
    },
    {
      id: 'st-test-3-nophone',
      first_name: 'Sarvar',
      last_name: 'Nazarov',
      role: 'student',
      phone: '+998939998877',
      father_phone: '',
      mother_phone: '',
    },
  ];

  beforeEach(() => {
    // Reset localStore
    localStore.setItem('educo_db_users', mockStudents);
    localStore.setItem('educo_db_sms_queue', []);
    localStore.setItem('educo_db_sms_logs', []);
    localStore.setItem('educo_db_student_attendance', []);
    localStore.setItem('educo_db_sms_settings', {
      id: 'sms-settings-1',
      is_enabled: true,
      debtor_sms_enabled: false,
      target_recipient: 'father_first',
      max_retries: 3,
    });
  });

  it('1. Initial Attendance: sends Absent SMS to parents when marked absent', async () => {
    const queueItem = await enqueueAttendanceSms({
      studentId: 'st-test-1',
      studentName: 'Bobur Karimov',
      courseName: 'Matematika 1.2',
      lessonTime: '08:30 - 10:00',
      status: 'absent',
      date: '2026-11-14',
      teacherName: 'Abdulazizbek Orifjonov',
    });

    expect(queueItem).toBeDefined();
    expect(queueItem.recipient_phone).toBe('+998936101774'); // Father's phone
    expect(queueItem.category).toBe('attendance');
    expect(queueItem.attendance_status).toBe('absent');
    expect(queueItem.message_text).toContain('QATNASHMADI');
    expect(queueItem.message_text).toContain('Darsga kelmadi');
    expect(queueItem.message_text).toContain('Matematika 1.2');
    expect(queueItem.message_text).toContain('Bobur Karimov');
  });

  it('2. Anti-spam: does NOT send duplicate SMS if teacher re-saves with same status', async () => {
    // 1st save
    const firstItem = await enqueueAttendanceSms({
      studentId: 'st-test-1',
      studentName: 'Bobur Karimov',
      courseName: 'Matematika 1.2',
      lessonTime: '08:30 - 10:00',
      status: 'absent',
      date: '2026-11-14',
      teacherName: 'Abdulazizbek Orifjonov',
    });

    const queueAfterFirst = localStore.getSmsQueue();
    expect(queueAfterFirst.length).toBe(1);

    // 2nd save with same status (prevStatus = 'absent', status = 'absent')
    const secondItem = await enqueueAttendanceSms({
      studentId: 'st-test-1',
      studentName: 'Bobur Karimov',
      courseName: 'Matematika 1.2',
      lessonTime: '08:30 - 10:00',
      status: 'absent',
      prevStatus: 'absent',
      date: '2026-11-14',
      teacherName: 'Abdulazizbek Orifjonov',
    });

    const queueAfterSecond = localStore.getSmsQueue();
    expect(queueAfterSecond.length).toBe(1); // No duplicate queued!
  });

  it('3. 30-min Late Arrival: cancels pending absent SMS and sends Late SMS when student arrives late', async () => {
    // Student was marked absent first
    await enqueueAttendanceSms({
      studentId: 'st-test-1',
      studentName: 'Bobur Karimov',
      courseName: 'Matematika 1.2',
      lessonTime: '08:30 - 10:00',
      status: 'absent',
      date: '2026-11-14',
      teacherName: 'Abdulazizbek Orifjonov',
    });

    const queue1 = localStore.getSmsQueue();
    expect(queue1.length).toBe(1);
    expect(queue1[0].status).toBe(SMS_STATUS.PENDING);
    expect(queue1[0].attendance_status).toBe('absent');

    // 15 minutes later, student arrives and teacher updates status to 'late'
    const lateItem = await enqueueAttendanceSms({
      studentId: 'st-test-1',
      studentName: 'Bobur Karimov',
      courseName: 'Matematika 1.2',
      lessonTime: '08:30 - 10:00',
      status: 'late',
      prevStatus: 'absent',
      date: '2026-11-14',
      teacherName: 'Abdulazizbek Orifjonov',
    });

    const queue2 = localStore.getSmsQueue();
    const oldItem = queue2.find((q) => q.id === queue1[0].id);
    expect(oldItem.status).toBe('CANCELLED'); // Old absent item cancelled!

    expect(lateItem).toBeDefined();
    expect(lateItem.attendance_status).toBe('late');
    expect(lateItem.message_text).toContain('KECHIKIB');
    expect(lateItem.recipient_phone).toBe('+998936101774');
  });

  it('4. Reassuring Late Update: if absent SMS was already sent, sends late update explaining arrival', async () => {
    // Simulate that the absent SMS was already sent/delivered by Android SMS Gateway
    const firstItem = await enqueueAttendanceSms({
      studentId: 'st-test-2',
      studentName: 'Ziyoda Aliyeva',
      courseName: 'Arab tili 1.2',
      lessonTime: '07:00 - 08:30',
      status: 'absent',
      date: '2026-11-14',
    });

    localStore.updateSmsQueueItem(firstItem.id, {
      status: SMS_STATUS.DELIVERED,
      delivered_at: new Date().toISOString(),
    });

    // Later teacher marks student as late
    const lateUpdate = await enqueueAttendanceSms({
      studentId: 'st-test-2',
      studentName: 'Ziyoda Aliyeva',
      courseName: 'Arab tili 1.2',
      lessonTime: '07:00 - 08:30',
      status: 'late',
      prevStatus: 'absent',
      date: '2026-11-14',
    });

    expect(lateUpdate).toBeDefined();
    expect(lateUpdate.attendance_status).toBe('late');
    expect(lateUpdate.message_text).toContain('KECHIKIB yetib keldi');
    expect(lateUpdate.message_text).toContain('Avvalroq darsga kelmadi deb qayd etilgan edi');
  });

  it('5. Students without parent phones: silently skips without error', async () => {
    const res = await enqueueAttendanceSms({
      studentId: 'st-test-3-nophone',
      studentName: 'Sarvar Nazarov',
      status: 'absent',
      date: '2026-11-14',
    });

    expect(res).toBeNull();
  });

  it('6. saveAttendanceRecords: full integration saves records, creates attendance SMS and checks prevStatus', async () => {
    const lessonId = 'lsn-grp-math-2026-11-14';

    // 1st take: Bobur is absent, Ziyoda is present
    await saveAttendanceRecords(
      lessonId,
      [
        { student_id: 'st-test-1', status: 'absent' },
        { student_id: 'st-test-2', status: 'present' },
      ],
      'teacher-1'
    );

    let queue = localStore.getSmsQueue();
    const boburAbsent = queue.find((q) => q.student_id === 'st-test-1');
    expect(boburAbsent).toBeDefined();
    expect(boburAbsent.attendance_status).toBe('absent');

    // 2nd take (after 20 mins): Bobur arrives late!
    await saveAttendanceRecords(
      lessonId,
      [
        { student_id: 'st-test-1', status: 'late' },
        { student_id: 'st-test-2', status: 'present' },
      ],
      'teacher-1'
    );

    queue = localStore.getSmsQueue();
    const boburLate = queue.find((q) => q.student_id === 'st-test-1' && q.attendance_status === 'late');
    expect(boburLate).toBeDefined();
    expect(boburLate.message_text).toContain('KECHIKIB');
  });
});

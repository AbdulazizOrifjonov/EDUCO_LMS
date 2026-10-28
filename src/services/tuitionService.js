import { supabase } from '@/lib/supabase';
import { localStore } from '@/lib/localStore';
import { createAuditLog } from './auditService';
import { exportToCSV, formatDate, formatCurrency } from '@/utils/csvExport';

const isPlaceholder = !import.meta.env.VITE_SUPABASE_URL || import.meta.env.VITE_SUPABASE_URL.includes('placeholder');

/**
 * Gets student tuition summary list with calculated paid, due, balance.
 * Accurately takes into account the student's active group(s), group monthly price,
 * and individual student discount (percentage, fixed discount, or custom agreed fee).
 */
export async function getTuitionSummary(filters = {}) {
  const { status, search } = filters;

  const allUsers = localStore.getUsers ? localStore.getUsers() : [];
  const allStudents = allUsers.filter((u) => u.role === 'student');
  const allGroups = localStore.getGroups ? localStore.getGroups() : [];
  const allCourses = localStore.getCourses ? localStore.getCourses() : [];
  const allMemberships = localStore.getMemberships ? localStore.getMemberships() : [];
  const allPayments = localStore.getPayments ? localStore.getPayments() : [];

  let studentList = allStudents;
  if (search && search.trim()) {
    const q = search.trim().toLowerCase();
    studentList = studentList.filter(
      (s) =>
        (s.fullName && s.fullName.toLowerCase().includes(q)) ||
        (s.first_name && s.first_name.toLowerCase().includes(q)) ||
        (s.last_name && s.last_name.toLowerCase().includes(q)) ||
        (s.username && s.username.toLowerCase().includes(q)) ||
        (s.email && s.email.toLowerCase().includes(q)) ||
        (s.phone && s.phone.includes(q))
    );
  }

  const list = studentList.map((student) => {
    const normId = localStore.normalizeUserId(student.id);

    // Find student's active group memberships
    const studentMemberships = allMemberships.filter(
      (m) => localStore.normalizeUserId(m.student_id) === normId && m.is_active !== false
    );

    // Also check student_ids on group objects
    const enrolledGroups = allGroups.filter((g) => {
      const hasInList = Array.isArray(g.student_ids) && g.student_ids.some((id) => localStore.normalizeUserId(id) === normId);
      const hasInMem = studentMemberships.some((m) => m.group_id === g.id);
      return hasInList || hasInMem;
    });

    const primaryGroup = enrolledGroups[0] || null;
    const primaryCourse = primaryGroup ? allCourses.find((c) => c.id === primaryGroup.course_id) : null;

    let totalDue = 0;
    let totalBaseFee = 0;
    let totalDiscount = 0;
    let discountDetails = [];

    if (enrolledGroups.length > 0) {
      enrolledGroups.forEach((group) => {
        const course = allCourses.find((c) => c.id === group.course_id);
        const baseFee = Number(group.monthly_price || group.monthly_fee || course?.monthly_fee || 0);
        totalBaseFee += baseFee;

        const mem = studentMemberships.find((m) => m.group_id === group.id);

        let groupDue = baseFee;
        let groupDiscount = 0;

        if (mem?.custom_price != null && mem?.custom_price !== '') {
          groupDue = Number(mem.custom_price);
          groupDiscount = Math.max(0, baseFee - groupDue);
          discountDetails.push({
            group_id: group.id,
            group_name: group.name,
            type: 'custom',
            label: "Maxsus kelishilgan to'lov",
            amount: groupDiscount,
            reason: mem?.discount_reason || '',
          });
        } else if (Number(mem?.discount_percent) > 0) {
          const pct = Number(mem.discount_percent);
          groupDiscount = Math.round(baseFee * (pct / 100));
          groupDue = Math.max(0, baseFee - groupDiscount);
          discountDetails.push({
            group_id: group.id,
            group_name: group.name,
            type: 'percent',
            percent: pct,
            label: `${pct}% chegirma`,
            amount: groupDiscount,
            reason: mem?.discount_reason || '',
          });
        } else if (Number(mem?.discount_amount) > 0) {
          const amt = Number(mem.discount_amount);
          groupDiscount = amt;
          groupDue = Math.max(0, baseFee - groupDiscount);
          discountDetails.push({
            group_id: group.id,
            group_name: group.name,
            type: 'fixed',
            label: `-${amt.toLocaleString()} so'm`,
            amount: groupDiscount,
            reason: mem?.discount_reason || '',
          });
        }

        totalDue += groupDue;
        totalDiscount += groupDiscount;
      });
    } else {
      totalDue = 0;
      totalBaseFee = 0;
    }

    // Student payments
    const studentPayments = allPayments.filter(
      (p) => localStore.normalizeUserId(p.student_id) === normId
    );
    const totalPaid = studentPayments.reduce((acc, p) => acc + Number(p.amount || 0), 0);
    const balance = Math.max(0, totalDue - totalPaid);

    let paymentStatus = 'unpaid';
    if (totalDue === 0) {
      paymentStatus = totalPaid > 0 ? 'paid' : 'unpaid';
    } else if (balance === 0) {
      paymentStatus = 'paid';
    } else if (totalPaid > 0 && balance > 0) {
      paymentStatus = 'partial';
    }

    const sortedPayments = [...studentPayments].sort(
      (a, b) => new Date(b.payment_date || b.created_at) - new Date(a.payment_date || a.created_at)
    );
    const lastPayment = sortedPayments[0];

    const studentFullName = `${student.first_name || ''} ${student.last_name || ''}`.trim() || student.fullName || student.username;

    return {
      id: student.id,
      studentId: student.id,
      studentName: studentFullName,
      studentEmail: student.email || 'N/A',
      studentPhone: student.phone || student.phone_number || '',
      fatherPhone: student.father_phone || '',
      motherPhone: student.mother_phone || '',
      groupId: primaryGroup?.id || null,
      groupName: primaryGroup?.name || "Biriktirilmagan",
      courseName: primaryGroup?.course_name || primaryCourse?.name || "Umumiy ta'lim",
      baseFee: totalBaseFee,
      discountAmount: totalDiscount,
      discountDetails,
      amountDue: totalDue,
      amountPaid: totalPaid,
      balance: balance,
      status: paymentStatus,
      lastPaymentDate: lastPayment ? lastPayment.payment_date || lastPayment.created_at : null,
    };
  });

  if (status && status !== 'ALL') {
    return list.filter((item) => item.status === status);
  }

  return list;
}

/**
 * Gets payment transaction records.
 */
export async function getTuitionPayments(filters = {}) {
  const { studentId, status, startDate, endDate } = filters;
  const allPayments = localStore.getPayments ? localStore.getPayments() : [];
  const allUsers = localStore.getUsers ? localStore.getUsers() : [];

  let list = allPayments.map((p) => {
    const student = allUsers.find(
      (u) => localStore.normalizeUserId(u.id) === localStore.normalizeUserId(p.student_id)
    );
    return {
      id: p.id,
      studentId: p.student_id,
      studentName: student ? `${student.first_name || ''} ${student.last_name || ''}`.trim() || student.fullName : 'Talaba',
      studentEmail: student?.email || 'N/A',
      amount: Number(p.amount || 0),
      paymentMethod: p.payment_method || 'Naqd pul',
      referenceNumber: p.reference_number || '-',
      paymentDate: p.payment_date || p.created_at,
      status: p.status || 'paid',
      notes: p.notes || '',
    };
  });

  if (studentId && studentId !== 'ALL') {
    list = list.filter((p) => localStore.normalizeUserId(p.studentId) === localStore.normalizeUserId(studentId));
  }
  if (status && status !== 'ALL') {
    list = list.filter((p) => p.status === status);
  }
  if (startDate) {
    list = list.filter((p) => p.paymentDate >= startDate);
  }
  if (endDate) {
    list = list.filter((p) => p.paymentDate <= endDate);
  }

  return list;
}

/**
 * Records a new tuition payment.
 * @param {Object} paymentData - { student_id, amount, payment_method, reference_number, payment_date, notes }
 */
export async function recordPayment(paymentData) {
  try {
    const payload = {
      student_id: paymentData.student_id || paymentData.studentId,
      amount: Number(paymentData.amount),
      payment_method: paymentData.payment_method || paymentData.paymentMethod || 'Naqd pul',
      reference_number: paymentData.reference_number || paymentData.referenceNumber || null,
      payment_date: paymentData.payment_date || paymentData.paymentDate || new Date().toISOString().split('T')[0],
      notes: paymentData.notes || null,
      status: 'paid',
      created_at: new Date().toISOString(),
    };

    const savedLocally = localStore.savePayment ? localStore.savePayment(payload) : payload;

    if (!isPlaceholder) {
      try {
        await supabase.from('tuition_payments').insert([payload]);
      } catch (e) {
        console.warn('Supabase recordPayment note:', e);
      }
    }

    // Log the transaction in audit logs
    try {
      await createAuditLog('RECORD_PAYMENT', `student:${payload.student_id}`, {
        amount: payload.amount,
        method: payload.payment_method,
        paymentId: savedLocally?.id,
      });
    } catch (_) {}

    return savedLocally;
  } catch (err) {
    console.error('recordPayment error:', err);
    throw err;
  }
}

/**
 * Exports tuition records to CSV.
 */
export function exportTuitionCSV(data, filename = 'tuition_report.csv') {
  const columns = [
    { key: 'studentName', label: 'Talaba ismi' },
    { key: 'courseName', label: 'Kurs / Fan' },
    { key: 'groupName', label: 'Guruh' },
    { key: 'baseFee', label: 'Asosiy to\'lov (so\'m)' },
    { key: 'discountAmount', label: 'Chegirma (so\'m)' },
    { key: 'amountDue', label: 'To\'lanishi kerak (so\'m)' },
    { key: 'amountPaid', label: 'To\'langan summa (so\'m)' },
    { key: 'balance', label: 'Qoldiq qarz (so\'m)' },
    { key: 'status', label: 'Holati' },
    { key: 'lastPaymentDate', label: 'So\'nggi to\'lov sanasi' },
  ];

  exportToCSV(columns, data, filename);
}

export default {
  getTuitionSummary,
  getTuitionPayments,
  recordPayment,
  exportTuitionCSV,
};

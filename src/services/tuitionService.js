import { supabase } from '@/lib/supabase';
import { createAuditLog } from './auditService';
import { exportToCSV, formatDate, formatCurrency } from '@/utils/csvExport';

/**
 * Gets student tuition summary list with calculated paid, due, balance.
 */
export async function getTuitionSummary(filters = {}) {
  const { status, search } = filters;

  try {
    // 1. Get students
    let studentQuery = supabase
      .from('profiles')
      .select('id, full_name, email, phone_number, role')
      .eq('role', 'student')
      .order('full_name');

    if (search && search.trim()) {
      studentQuery = studentQuery.ilike('full_name', `%${search.trim()}%`);
    }

    const { data: students, error: stErr } = await studentQuery;
    if (stErr) {
      console.warn('getTuitionSummary students error:', stErr.message);
      return [];
    }

    // 2. Get tuition fees and payments
    const { data: fees } = await supabase
      .from('tuition_fees')
      .select('*');

    const { data: payments } = await supabase
      .from('tuition_payments')
      .select('*');

    // Default monthly fee fallback if student has no custom fee record
    const defaultMonthlyFee = 1200000;

    const list = (students || []).map((student) => {
      const studentFees = (fees || []).filter((f) => f.student_id === student.id);
      const studentPayments = (payments || []).filter((p) => p.student_id === student.id);

      const totalDue = studentFees.length > 0
        ? studentFees.reduce((acc, f) => acc + Number(f.amount_due || 0), 0)
        : defaultMonthlyFee;

      const totalPaid = studentPayments.reduce((acc, p) => acc + Number(p.amount || 0), 0);
      const balance = totalDue - totalPaid;

      let paymentStatus = 'unpaid';
      if (balance <= 0 && totalPaid > 0) {
        paymentStatus = 'paid';
      } else if (totalPaid > 0 && balance > 0) {
        paymentStatus = 'partial';
      }

      // Latest payment date
      const sortedPayments = [...studentPayments].sort((a, b) => new Date(b.payment_date || b.created_at) - new Date(a.payment_date || a.created_at));
      const lastPayment = sortedPayments[0];

      return {
        id: student.id,
        studentId: student.id,
        studentName: student.full_name || 'N/A',
        studentEmail: student.email || 'N/A',
        studentPhone: student.phone_number || '',
        amountDue: totalDue,
        amountPaid: totalPaid,
        balance: balance > 0 ? balance : 0,
        status: paymentStatus,
        lastPaymentDate: lastPayment ? lastPayment.payment_date || lastPayment.created_at : null,
      };
    });

    if (status && status !== 'ALL') {
      return list.filter((item) => item.status === status);
    }

    return list;
  } catch (err) {
    console.error('getTuitionSummary error:', err);
    return [];
  }
}

/**
 * Gets payment transaction records.
 */
export async function getTuitionPayments(filters = {}) {
  const { studentId, status, startDate, endDate } = filters;

  try {
    let query = supabase
      .from('tuition_payments')
      .select(`
        id,
        amount,
        payment_method,
        reference_number,
        payment_date,
        notes,
        status,
        created_at,
        student:student_id(id, full_name, email)
      `)
      .order('payment_date', { ascending: false });

    if (studentId && studentId !== 'ALL') {
      query = query.eq('student_id', studentId);
    }
    if (status && status !== 'ALL') {
      query = query.eq('status', status);
    }
    if (startDate) {
      query = query.gte('payment_date', startDate);
    }
    if (endDate) {
      query = query.lte('payment_date', endDate);
    }

    const { data, error } = await query;
    if (error) {
      console.warn('getTuitionPayments warning:', error.message);
      return [];
    }

    return (data || []).map((p) => ({
      id: p.id,
      studentId: p.student?.id,
      studentName: p.student?.full_name || 'N/A',
      studentEmail: p.student?.email || 'N/A',
      amount: Number(p.amount || 0),
      paymentMethod: p.payment_method || 'Cash',
      referenceNumber: p.reference_number || '-',
      paymentDate: p.payment_date || p.created_at,
      status: p.status || 'paid',
      notes: p.notes || '',
    }));
  } catch (err) {
    console.error('getTuitionPayments error:', err);
    return [];
  }
}

/**
 * Records a new tuition payment.
 * @param {Object} paymentData - { student_id, amount, payment_method, reference_number, payment_date, notes }
 */
export async function recordPayment(paymentData) {
  try {
    const payload = {
      student_id: paymentData.student_id,
      amount: Number(paymentData.amount),
      payment_method: paymentData.payment_method || 'Cash',
      reference_number: paymentData.reference_number || null,
      payment_date: paymentData.payment_date || new Date().toISOString().split('T')[0],
      notes: paymentData.notes || null,
      status: 'paid',
      created_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('tuition_payments')
      .insert([payload])
      .select(`
        id,
        amount,
        payment_method,
        reference_number,
        payment_date,
        notes,
        status,
        student:student_id(id, full_name, email)
      `)
      .single();

    if (error) {
      throw error;
    }

    // Log the transaction in audit logs
    await createAuditLog('RECORD_PAYMENT', `student:${paymentData.student_id}`, {
      amount: payload.amount,
      method: payload.payment_method,
      paymentId: data?.id,
    });

    return data;
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
    { key: 'studentName', label: 'Student Name' },
    { key: 'studentEmail', label: 'Email' },
    { key: 'amountDue', label: 'Amount Due (UZS)' },
    { key: 'amountPaid', label: 'Amount Paid (UZS)' },
    { key: 'balance', label: 'Balance (UZS)' },
    { key: 'status', label: 'Status' },
    { key: 'lastPaymentDate', label: 'Last Payment Date' },
  ];

  exportToCSV(columns, data, filename);
}

export default {
  getTuitionSummary,
  getTuitionPayments,
  recordPayment,
  exportTuitionCSV,
};

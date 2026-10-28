import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  normalizePhone,
  formatSmsMessage,
  isDemoGateway,
  getSmsSettings,
  updateSmsSettings,
  getSmsDevices,
  saveSmsDevice,
  pingDevice,
  sendTestSms,
  generateDebtorQueue,
  getProspectiveRecipients,
  processQueueBatch,
  retryQueueItem,
  cancelQueueItem,
} from '../src/services/smsService';
import { localStore } from '../src/lib/localStore';

describe('SMS Service - Comprehensive Suite', () => {
  beforeEach(() => {
    // Reset localStore SMS queue & logs if any
    localStore.setItem('educo_db_sms_queue', []);
    localStore.setItem('educo_db_sms_logs', []);
    localStore.setItem('educo_db_sms_devices', [
      {
        id: 'dev-demo-test',
        name: 'Demo SMS Gateway',
        device_role: 'primary',
        gateway_url: 'https://example.com/placeholder',
        api_token: 'demo_token_educo',
        is_active: true,
        status: 'online',
      },
    ]);
  });

  describe('normalizePhone', () => {
    it('normalizes 9-digit Uzbek phone number to +998 format', () => {
      expect(normalizePhone('936101774')).toBe('+998936101774');
      expect(normalizePhone('90 123 45 67')).toBe('+998901234567');
    });

    it('handles already normalized or prefixed phone numbers', () => {
      expect(normalizePhone('+998936101774')).toBe('+998936101774');
      expect(normalizePhone('998936101774')).toBe('+998936101774');
    });

    it('returns empty string on null or undefined input', () => {
      expect(normalizePhone('')).toBe('');
      expect(normalizePhone(null)).toBe('');
      expect(normalizePhone(undefined)).toBe('');
    });
  });

  describe('formatSmsMessage', () => {
    it('replaces all debtor variables in template', () => {
      const template = 'Hurmatli {parent_name}! Farzandingiz {student_name}ning {course_name} uchun qarzi: {amount}. Muddat: {due_date}.';
      const formatted = formatSmsMessage(template, {
        parent_name: 'Alisher aka',
        student_name: 'Jasur',
        course_name: 'Frontend React',
        amount: 350000,
        due_date: '2026-11-01',
      });

      expect(formatted).toContain('Alisher aka');
      expect(formatted).toContain('Jasur');
      expect(formatted).toContain('Frontend React');
      expect(formatted).toContain('350,000');
      expect(formatted).toContain('2026-11-01');
    });
  });

  describe('isDemoGateway', () => {
    it('correctly identifies default demo devices and tokens', () => {
      expect(isDemoGateway({ api_token: 'demo_token_educo' })).toBe(true);
      expect(isDemoGateway({ api_token: 'demo_token_123' })).toBe(true);
      expect(isDemoGateway(null, 'https://example.com/placeholder')).toBe(true);
      expect(isDemoGateway({ api_token: 'SXP6_F:_8_-fv9uvdsyrp' })).toBe(false);
      expect(isDemoGateway({ api_token: 'my_real_secret_token_987654321', gateway_url: 'https://my-real-gateway.com/send' })).toBe(false);
    });
  });

  describe('pingDevice', () => {
    it('returns online and simulated: true for demo devices', async () => {
      const demoDevice = {
        id: 'dev-demo-test-1',
        name: 'Demo Gateway',
        device_role: 'primary',
        gateway_url: 'https://example.com/placeholder',
        api_token: 'demo_token_educo',
        is_active: true,
      };

      const res = await pingDevice(demoDevice);
      expect(res.success).toBe(true);
      expect(res.status).toBe('online');
      expect(res.simulated).toBe(true);
    });

    it('returns error when gateway_url is missing', async () => {
      const res = await pingDevice({ id: 'bad-dev', gateway_url: '' });
      expect(res.success).toBe(false);
      expect(res.error).toBe('Gateway URL ko‘rsatilmagan');
    });
  });

  describe('sendTestSms', () => {
    it('sends test SMS cleanly with simulated delivery in demo mode', async () => {
      const res = await sendTestSms({
        phone: '+998936101774',
        message: 'Salom, test SMS tekshiruvi!',
      });

      expect(res.success).toBe(true);
      expect(res.simulated).toBe(true);
      expect(res.device).toBeDefined();

      // Check that it logged to sms_logs
      const logs = localStore.getSmsLogs();
      const testLog = logs.find((l) => l.recipient_phone === '+998936101774');
      expect(testLog).toBeDefined();
      expect(testLog.status).toBe('sent');
    });
  });

  describe('generateDebtorQueue and processQueueBatch', () => {
    it('generates queue for students with unpaid tuition balances', async () => {
      const queueRes = await generateDebtorQueue({ forceRequeue: true });
      expect(queueRes).toBeDefined();
      expect(typeof queueRes.queuedCount).toBe('number');

      const queue = localStore.getSmsQueue();
      expect(Array.isArray(queue)).toBe(true);

      if (queue.length > 0) {
        // Test batch processing
        const batchRes = await processQueueBatch({ limit: 5 });
        expect(batchRes.processed).toBeGreaterThan(0);
        expect(batchRes.sent).toBeGreaterThan(0);

        // Check updated status in queue
        const updatedQueue = localStore.getSmsQueue();
        const sentItems = updatedQueue.filter((q) => q.status === 'sent');
        expect(sentItems.length).toBeGreaterThan(0);
      }
    });

    it('supports retrying and cancelling queue items', async () => {
      const mockItem = {
        id: 'test-queue-item-1',
        recipient_phone: '+998901234567',
        recipient_name: 'Test Talaba',
        message_text: 'Test eslatma',
        status: 'failed',
        attempts: 3,
      };
      localStore.saveSmsQueueItem(mockItem);

      // Retry
      await retryQueueItem('test-queue-item-1');
      let item = localStore.getSmsQueue().find((q) => q.id === 'test-queue-item-1');
      expect(item.status).toBe('pending');
      expect(item.attempts).toBe(0);

      // Cancel
      await cancelQueueItem('test-queue-item-1');
      item = localStore.getSmsQueue().find((q) => q.id === 'test-queue-item-1');
      expect(item.status).toBe('cancelled');
    });
  });

  describe('getProspectiveRecipients', () => {
    it('returns array of prospective recipients with properly formatted messages', async () => {
      // Seed a test student and group so prospective recipients has mock debtor data
      localStore.saveUser({
        id: 'usr-debtor-test',
        fullName: 'Test Talaba',
        first_name: 'Test',
        last_name: 'Talaba',
        phone: '+998 90 123 45 67',
        father_phone: '+998 90 765 43 21',
        role: 'student',
        is_active: true,
      });
      localStore.saveCourse({
        id: 'crs-debtor-test',
        name: 'Test Kurs',
        monthly_fee: 500000,
        is_active: true,
      });
      localStore.saveGroup({
        id: 'grp-debtor-test',
        course_id: 'crs-debtor-test',
        name: 'Test Guruh',
        student_ids: ['usr-debtor-test'],
      });

      const recipients = await getProspectiveRecipients();
      expect(Array.isArray(recipients)).toBe(true);
      expect(recipients.length).toBeGreaterThan(0);

      const first = recipients[0];
      expect(first).toHaveProperty('studentId');
      expect(first).toHaveProperty('studentName');
      expect(first).toHaveProperty('messageText');
      expect(first).toHaveProperty('hasPhone');
      expect(typeof first.messageText).toBe('string');
      expect(first.messageText.length).toBeGreaterThan(0);
    });
  });
});

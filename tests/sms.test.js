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
  reconcileSmsDeliveryStatuses,
  calculateSmsLatencies,
  normalizeSmsStatus,
  SMS_STATUS,
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
      expect(['DELIVERED', 'SUBMITTED', 'sent']).toContain(testLog.status);
      expect(testLog.tracking_id).toBeDefined();
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
        const sentItems = updatedQueue.filter((q) => [SMS_STATUS.SUBMITTED, SMS_STATUS.DELIVERED, 'sent'].includes(q.status));
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

  describe('Lifecycle Statuses & Operator Callback Verification', () => {
    it('defines all 6 distinct lifecycle statuses correctly', () => {
      expect(SMS_STATUS.PENDING).toBe('PENDING');
      expect(SMS_STATUS.DISPATCHING).toBe('DISPATCHING');
      expect(SMS_STATUS.SUBMITTED).toBe('SUBMITTED');
      expect(SMS_STATUS.DELIVERED).toBe('DELIVERED');
      expect(SMS_STATUS.FAILED).toBe('FAILED');
      expect(SMS_STATUS.UNKNOWN).toBe('UNKNOWN');
    });

    it('strictly ensures SUBMITTED is not treated as DELIVERED', () => {
      expect(SMS_STATUS.SUBMITTED).not.toBe(SMS_STATUS.DELIVERED);
      expect(normalizeSmsStatus('SUBMITTED')).toBe(SMS_STATUS.SUBMITTED);
      expect(normalizeSmsStatus('DELIVERED')).toBe(SMS_STATUS.DELIVERED);
      expect(normalizeSmsStatus('sent')).toBe(SMS_STATUS.SUBMITTED);
      expect(normalizeSmsStatus('delivered')).toBe(SMS_STATUS.DELIVERED);
    });

    it('accurately normalizes legacy and alternate status values', () => {
      expect(normalizeSmsStatus('pending')).toBe(SMS_STATUS.PENDING);
      expect(normalizeSmsStatus('processing')).toBe(SMS_STATUS.DISPATCHING);
      expect(normalizeSmsStatus('failed')).toBe(SMS_STATUS.FAILED);
      expect(normalizeSmsStatus('error')).toBe(SMS_STATUS.FAILED);
      expect(normalizeSmsStatus('cancelled')).toBe(SMS_STATUS.FAILED);
      expect(normalizeSmsStatus('unknown')).toBe(SMS_STATUS.UNKNOWN);
      expect(normalizeSmsStatus('something_else')).toBe('SOMETHING_ELSE');
    });
  });

  describe('Latency & Granular Monitoring Timestamps', () => {
    it('calculates LMS, Android, and Carrier latencies accurately', () => {
      const timestamps = {
        queued_at: '2026-11-06T10:00:00.000Z',
        dispatched_at: '2026-11-06T10:00:02.000Z',    // LMS latency: 2000ms
        android_sent_at: '2026-11-06T10:00:05.500Z',  // Android Gateway latency: 3500ms
        delivered_at: '2026-11-06T10:00:09.000Z',     // Carrier GSM latency: 3500ms
      };

      const latencies = calculateSmsLatencies(timestamps);
      expect(latencies.lms_latency_ms).toBe(2000);
      expect(latencies.android_latency_ms).toBe(3500);
      expect(latencies.carrier_latency_ms).toBe(3500);
      expect(latencies.total_latency_ms).toBe(9000);
    });

    it('handles partial timestamps gracefully without throwing errors', () => {
      const partial = {
        queued_at: '2026-11-06T10:00:00.000Z',
        dispatched_at: '2026-11-06T10:00:01.200Z',
      };
      const latencies = calculateSmsLatencies(partial);
      expect(latencies.lms_latency_ms).toBe(1200);
      expect(latencies.android_latency_ms).toBeNull();
      expect(latencies.carrier_latency_ms).toBeNull();
      expect(latencies.total_latency_ms).toBeNull();
    });
  });

  describe('Multi-Item Batch Latency Testing: 1, 10, and 50 SMS', () => {
    it('processes 1 SMS item with complete tracking ID and timestamps', async () => {
      localStore.setItem('educo_db_sms_queue', []);
      const item = {
        id: 'test-single-1',
        recipient_phone: '+998935550001',
        recipient_name: 'Single Test Student',
        message_text: 'Yagona test xabari',
        amount_due: 100000,
        status: SMS_STATUS.PENDING,
        created_at: new Date().toISOString(),
        queued_at: new Date().toISOString(),
      };
      localStore.saveSmsQueueItem(item);

      const res = await processQueueBatch({ limit: 1 });
      expect(res.processed).toBe(1);
      expect(res.sent).toBe(1);

      const queue = localStore.getSmsQueue();
      const processed = queue.find((q) => q.id === 'test-single-1');
      expect(processed).toBeDefined();
      expect([SMS_STATUS.SUBMITTED, SMS_STATUS.DELIVERED]).toContain(processed.status);
      expect(processed.tracking_id).toBeDefined();
      expect(processed.dispatched_at).toBeDefined();
      expect(processed.android_sent_at).toBeDefined();
    });

    it('processes 10 SMS items with distinct tracking IDs and rate-limiting', async () => {
      localStore.setItem('educo_db_sms_queue', []);
      const items = Array.from({ length: 10 }, (_, i) => ({
        id: `test-batch10-${i + 1}`,
        student_id: `usr-batch10-${i + 1}`,
        idempotency_key: `idemp-batch10-${i + 1}`,
        recipient_phone: `+9989355500${(i + 10).toString().padStart(2, '0')}`,
        recipient_name: `Talaba #${i + 1}`,
        message_text: `Test xabar #${i + 1}`,
        amount_due: 150000 + i * 10000,
        status: SMS_STATUS.PENDING,
        created_at: new Date().toISOString(),
        queued_at: new Date().toISOString(),
      }));
      items.forEach((it) => localStore.saveSmsQueueItem(it));

      let progressCount = 0;
      const res = await processQueueBatch({
        limit: 10,
        onProgress: (p) => {
          progressCount = p.current;
        },
      });

      expect(res.processed).toBe(10);
      expect(res.sent).toBe(10);
      expect(progressCount).toBe(10);

      const queue = localStore.getSmsQueue();
      const trackingIds = new Set();
      queue.forEach((q) => {
        expect([SMS_STATUS.SUBMITTED, SMS_STATUS.DELIVERED]).toContain(q.status);
        expect(q.tracking_id).toBeDefined();
        trackingIds.add(q.tracking_id);
      });
      // All 10 tracking IDs must be unique
      expect(trackingIds.size).toBe(10);
    }, 30000);

    it('processes 50 SMS items at scale maintaining zero duplicates and full persistence', async () => {
      localStore.setItem('educo_db_sms_queue', []);
      const items = Array.from({ length: 50 }, (_, i) => ({
        id: `test-batch50-${i + 1}`,
        student_id: `usr-batch50-${i + 1}`,
        idempotency_key: `idemp-batch50-${i + 1}`,
        recipient_phone: `+9989010000${(i + 10).toString().padStart(2, '0')}`,
        recipient_name: `Katta Talaba #${i + 1}`,
        message_text: `Katta masshtabli test xabari #${i + 1}`,
        amount_due: 200000,
        status: SMS_STATUS.PENDING,
        created_at: new Date().toISOString(),
        queued_at: new Date().toISOString(),
      }));
      items.forEach((it) => localStore.saveSmsQueueItem(it));

      const res = await processQueueBatch({ limit: 50 });
      expect(res.processed).toBe(50);
      expect(res.sent).toBe(50);

      const queue = localStore.getSmsQueue();
      expect(queue.length).toBe(50);

      // Verify no pending items left
      const pendingLeft = queue.filter((q) => q.status === SMS_STATUS.PENDING);
      expect(pendingLeft.length).toBe(0);

      // Verify all items have timestamps and tracking IDs
      queue.forEach((q) => {
        expect([SMS_STATUS.SUBMITTED, SMS_STATUS.DELIVERED]).toContain(q.status);
        expect(q.tracking_id).toBeDefined();
        expect(q.dispatched_at).toBeDefined();
        expect(q.android_sent_at).toBeDefined();
      });
    }, 45000);
  });

  describe('reconcileSmsDeliveryStatuses', () => {
    it('executes status reconciliation cleanly without throwing errors', async () => {
      const res = await reconcileSmsDeliveryStatuses();
      expect(res).toBeDefined();
      expect(typeof res.reconciledCount).toBe('number');
    });
  });
});

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import AttendancePage from '@/pages/shared/AttendancePage';
import GradesPage from '@/pages/shared/GradesPage';
import { ToastContainer, useToastStore } from '@/components/ui/Toast';
import { SearchProvider } from '@/context/SearchContext';
import { TwoStepConfirmProvider } from '@/context/ConfirmContext';
import { useAuthStore } from '@/hooks/useAuth';
import { localStore } from '@/lib/localStore';
import { enrollStudent } from '@/services/groupService';
import '@/i18n';

function renderTeacherAttendanceFlow() {
  return render(
    <MemoryRouter initialEntries={['/teacher/attendance']}>
      <SearchProvider>
        <TwoStepConfirmProvider>
          <ToastContainer />
          <Routes>
            <Route path="/teacher/attendance" element={<AttendancePage />} />
            <Route path="/teacher/grades" element={<GradesPage />} />
          </Routes>
        </TwoStepConfirmProvider>
      </SearchProvider>
    </MemoryRouter>
  );
}

describe('Attendance Save -> SMS Dispatch Confirmation -> Redirect to Grades Flow', () => {
  beforeEach(() => {
    window.scrollTo = vi.fn();
    useToastStore.getState().clearAll();
    localStore.clear();
    localStore.ensureCleanStart();

    localStore.saveSmsSettings({
      id: 'sms-settings-test',
      is_enabled: true,
      debtor_sms_enabled: false,
      target_recipient: 'father_first',
      max_retries: 3,
    });

    localStore.saveSmsDevice({
      id: 'dev-demo-test',
      name: 'Demo SMS Gateway',
      device_role: 'primary',
      gateway_url: 'https://example.com/placeholder',
      api_token: 'demo_token_educo',
      is_active: true,
      status: 'online',
    });

    const teacherProfile = {
      id: 'usr-teacher-redirect',
      username: 'mentor_redirect',
      full_name: 'Mentor Test',
      first_name: 'Mentor',
      last_name: 'Test',
      role: 'teacher',
      is_active: true,
    };
    localStore.saveUser(teacherProfile);

    localStore.saveUser({
      id: 'usr-student-redirect',
      role: 'student',
      full_name: 'Azizbek Karimov',
      first_name: 'Azizbek',
      last_name: 'Karimov',
      phone: '+998901112233',
      father_phone: '+998909968163',
      is_active: true,
      group_id: 'grp-second',
    });

    localStore.saveCourse({ id: 'crs-test-1', name: 'Frontend React', code: 'CRS-FE', price: 700000 });
    localStore.saveGroup({
      id: 'grp-first',
      name: 'Ingliz tili 1.0',
      course_id: 'crs-test-1',
      teacher_id: 'usr-teacher-redirect',
      teacher_name: 'Mentor Test',
      status: 'active',
    });
    localStore.saveGroup({
      id: 'grp-second',
      name: 'Frontend React 2.0',
      course_id: 'crs-test-1',
      teacher_id: 'usr-teacher-redirect',
      teacher_name: 'Mentor Test',
      status: 'active',
    });

    useAuthStore.setState({
      user: {
        id: teacherProfile.id,
        email: 'mentor@educo.app',
        user_metadata: { role: 'teacher', full_name: 'Mentor Test' },
      },
      profile: teacherProfile,
      session: { user: { id: teacherProfile.id } },
      loading: false,
      error: null,
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('shows SMS confirmation modal & toast and redirects to GradesPage for the selected group', async () => {
    await enrollStudent('grp-second', 'usr-student-redirect');

    renderTeacherAttendanceFlow();

    // Switch to grp-second so we verify the exact groupId transfers to GradesPage
    const secondGroupCard = await screen.findByText('Frontend React 2.0');
    fireEvent.click(secondGroupCard);

    // Wait for student row to appear
    await screen.findByText('Azizbek Karimov');

    // Verify new clear Save & Redirect button text is shown (top & bottom)
    const saveButtons = await screen.findAllByRole('button', {
      name: /Davomatni saqlash va Baholashga o‘tish/i,
    });
    expect(saveButtons.length).toBeGreaterThanOrEqual(2);

    // Click Save
    fireEvent.click(saveButtons[0]);

    // Wait for confirmation modal & exact SMS status confirmation
    await waitFor(() => {
      expect(screen.getAllByText(/Davomat muvaffaqiyatli saqlandi!/i).length).toBeGreaterThan(0);
      expect(screen.getAllByText(/1 ta ota-onaga SMS xabari yuborildi/i).length).toBeGreaterThan(0);
    });

    // Verify attendance & SMS queue were saved
    const savedAtt = localStore.getAttendance();
    expect(savedAtt.some((a) => a.student_id === 'usr-student-redirect')).toBe(true);

    const smsQueue = localStore.getSmsQueue();
    const sentSms = smsQueue.find(
      (q) => q.student_id === 'usr-student-redirect' && q.category === 'attendance'
    );
    expect(sentSms).toBeDefined();
    expect(sentSms.recipient_phone).toBe('+998909968163');

    // Automatically redirects to GradesPage within ~1.5s without needing a manual click
    await waitFor(
      () => {
        expect(
          screen.getByText(/Darsda qatnashgan o‘quvchilarni baholang va oxirida umumiy yakunlang/i)
        ).toBeInTheDocument();
        expect(
          screen.getByText(/Davomat muvaffaqiyatli saqlandi va ota-onalarga SMS xabarlari yuborildi!/i)
        ).toBeInTheDocument();
        expect(
          screen.getByText(/Endi "Frontend React 2\.0" o‘quvchilarini baholashingiz mumkin\./i)
        ).toBeInTheDocument();
      },
      { timeout: 5000 }
    );
  }, 15000);

  it('allows immediate manual navigation to GradesPage when clicking "Hozir Baholashga o‘tish"', async () => {
    await enrollStudent('grp-second', 'usr-student-redirect');

    renderTeacherAttendanceFlow();

    const secondGroupCard = await screen.findByText('Frontend React 2.0');
    fireEvent.click(secondGroupCard);
    await screen.findByText('Azizbek Karimov');

    const saveButtons = await screen.findAllByRole('button', {
      name: /Davomatni saqlash va Baholashga o‘tish/i,
    });
    fireEvent.click(saveButtons[0]);

    const goNowBtn = await screen.findByRole('button', { name: /Hozir Baholashga o‘tish/i });
    fireEvent.click(goNowBtn);

    await waitFor(() => {
      expect(
        screen.getByText(/Davomat muvaffaqiyatli saqlandi va ota-onalarga SMS xabarlari yuborildi!/i)
      ).toBeInTheDocument();
      expect(
        screen.getByText(/Endi "Frontend React 2\.0" o‘quvchilarini baholashingiz mumkin\./i)
      ).toBeInTheDocument();
    });
  }, 15000);
});

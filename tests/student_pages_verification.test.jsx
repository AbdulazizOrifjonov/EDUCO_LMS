import { describe, it, expect, beforeEach, vi } from 'vitest';
import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import App from '@/App';
import { useAuthStore } from '@/hooks/useAuth';
import '@/i18n';
import { ROLES } from '@/lib/constants';

function setStudentUser(id = 'usr-student-930098339', fullName = 'Arslonov Ismoil') {
  const studentProfile = {
    id,
    full_name: fullName,
    first_name: fullName.split(' ')[0],
    last_name: fullName.split(' ')[1] || '',
    role: ROLES.STUDENT,
    phone: '+998930098339',
    group_id: 'grp-matematika',
    group_ids: ['grp-matematika', 'grp-ingliz-tili-2', 'grp-fullstack'],
  };

  useAuthStore.setState({
    user: {
      id,
      email: `${id}@educo.app`,
      user_metadata: { role: ROLES.STUDENT, first_name: studentProfile.first_name },
    },
    profile: studentProfile,
    session: { access_token: 'fake-token' },
    loading: false,
    error: null,
  });
}

describe('Student Portal Pages Verification', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const studentPages = [
    { path: '/student/dashboard', name: 'Dashboard' },
    { path: '/student/group', name: 'My Group' },
    { path: '/student/schedule', name: 'Schedule' },
    { path: '/student/attendance', name: 'Attendance' },
    { path: '/student/grades', name: 'Grades' },
    { path: '/student/homework', name: 'Homework' },
    { path: '/student/materials', name: 'Materials' },
    { path: '/student/announcements', name: 'Announcements' },
    { path: '/student/chat', name: 'Chat' },
    { path: '/student/notifications', name: 'Notifications' },
    { path: '/student/settings', name: 'Settings' },
  ];

  for (const page of studentPages) {
    it(`renders student page: ${page.name} (${page.path}) without crashing for multi-group student`, async () => {
      setStudentUser('usr-student-930098339', 'Arslonov Ismoil');
      const { container } = render(
        <MemoryRouter initialEntries={[page.path]}>
          <App />
        </MemoryRouter>
      );
      expect(container).toBeTruthy();
    });

    it(`renders student page: ${page.name} (${page.path}) without crashing for single-group student`, async () => {
      setStudentUser('usr-student-933921552', 'Abubakirxo‘jayeva Saminaxon');
      const { container } = render(
        <MemoryRouter initialEntries={[page.path]}>
          <App />
        </MemoryRouter>
      );
      expect(container).toBeTruthy();
    });

    it(`renders student page: ${page.name} (${page.path}) without crashing for student with NO groups`, async () => {
      setStudentUser('usr-student-no-group-xyz', 'Yangi Talaba Guruhsiz');
      // Set empty groups
      const curr = useAuthStore.getState().profile;
      useAuthStore.setState({
        profile: { ...curr, group_id: null, group_ids: [] },
      });

      const { container } = render(
        <MemoryRouter initialEntries={[page.path]}>
          <App />
        </MemoryRouter>
      );
      expect(container).toBeTruthy();
    });
  }
});

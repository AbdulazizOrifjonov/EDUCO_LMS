import { describe, it, expect, beforeEach, vi } from 'vitest';
import React from 'react';
import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import App from '@/App';
import { useAuthStore } from '@/hooks/useAuth';
import { localStore } from '@/lib/localStore';
import '@/i18n';

beforeEach(() => {
  window.scrollTo = vi.fn();
  localStore.clear();
  localStore.ensureCleanStart();
  localStore.saveUser({
    id: 'usr-student-1',
    role: 'student',
    full_name: 'Ismoil Arslonov',
    first_name: 'Ismoil',
    last_name: 'Arslonov',
    phone: '+998930098339',
    is_active: true,
    group_id: 'grp-fullstack',
  });
  localStore.saveCourse({ id: 'crs-fullstack', name: 'Full Stack', code: 'CRS-FS1', price: 600000 });
  localStore.saveGroup({
    id: 'grp-fullstack',
    name: 'Full Stack guruhi (IT-1.1)',
    course_id: 'crs-fullstack',
    teacher_id: 'usr-1793466843425',
    student_ids: ['usr-student-1'],
    room: '3-xona (IT Lab)',
  });

  const mockTeacher = {
    id: 'usr-1793466843425',
    email: 'abdulazizbek_orifjonov@educo.app',
    user_metadata: {
      role: 'teacher',
      full_name: 'Abdulazizbek Orifjonov',
      username: 'abdulazizbek_orifjonov',
    },
  };
  const mockProfile = {
    id: 'usr-1793466843425',
    username: 'abdulazizbek_orifjonov',
    full_name: 'Abdulazizbek Orifjonov',
    role: 'teacher',
    specialty: 'Full Stack',
    subject: 'Full Stack',
    email: 'abdulazizbek_orifjonov@educo.app',
    is_active: true,
  };
  useAuthStore.setState({
    user: mockTeacher,
    profile: mockProfile,
    session: { user: mockTeacher },
    loading: false,
    error: null,
  });
});

describe('Comprehensive Teacher Pages Audit', () => {
  const teacherRoutes = [
    '/teacher/dashboard',
    '/teacher/courses',
    '/teacher/groups',
    '/teacher/groups/grp-fullstack',
    '/teacher/groups/create',
    '/teacher/groups/edit/grp-fullstack',
    '/teacher/users',
    '/teacher/students',
    '/teacher/teachers',
    '/teacher/users/create',
    '/teacher/students/create',
    '/teacher/users/edit/usr-student-1',
    '/teacher/users/profile/usr-student-1',
    '/teacher/passwords',
    '/teacher/schedule',
    '/teacher/homework',
    '/teacher/materials',
    '/teacher/attendance',
    '/teacher/attendance/teachers',
    '/teacher/attendance/reports',
    '/teacher/grades',
    '/teacher/announcements',
    '/teacher/reminders',
    '/teacher/chat',
    '/teacher/notifications',
    '/teacher/settings',
    '/teachers',
    '/students',
    '/attendance/teachers',
  ];

  for (const route of teacherRoutes) {
    it(`renders Teacher route: ${route} without crashing`, async () => {
      const { container } = render(
        <MemoryRouter initialEntries={[route]}>
          <App />
        </MemoryRouter>
      );
      expect(container).toBeDefined();
    });
  }
});

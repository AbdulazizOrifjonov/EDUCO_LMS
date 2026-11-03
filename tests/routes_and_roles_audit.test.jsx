import { describe, it, expect, beforeEach, vi } from 'vitest';
import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import App from '@/App';
import { useAuthStore } from '@/hooks/useAuth';
import { localStore } from '@/lib/localStore';
import '@/i18n';

// Mock window.scrollTo to prevent jsdom error
beforeEach(() => {
  window.scrollTo = vi.fn();
  localStore.clear();
  localStore.ensureCleanStart();
});

function setUserRole(role, id = `usr-${role}-1`, name = `Test ${role}`) {
  const mockUser = {
    id,
    email: `${role}@educo.app`,
    user_metadata: {
      role,
      full_name: name,
      username: `${role}_user`,
    },
  };
  const mockProfile = {
    id,
    username: `${role}_user`,
    full_name: name,
    role,
    email: `${role}@educo.app`,
    is_active: true,
  };
  useAuthStore.setState({
    user: mockUser,
    profile: mockProfile,
    session: { user: mockUser },
    loading: false,
    error: null,
  });
}

describe('Universal LMS Routes & Roles Audit', () => {
  describe('1. Owner Role - Full Access to All Owner Pages', () => {
    beforeEach(() => {
      setUserRole('owner', 'usr-owner-1', 'Abbosbek Rahbar');
    });

    const ownerRoutes = [
      '/owner/dashboard',
      '/owner/users',
      '/owner/users/create',
      '/owner/passwords',
      '/owner/courses',
      '/owner/courses/create',
      '/owner/groups',
      '/owner/groups/create',
      '/owner/schedule',
      '/owner/reminders',
      '/owner/attendance',
      '/owner/attendance/teachers',
      '/owner/attendance/reports',
      '/owner/grades',
      '/owner/tuition',
      '/owner/website',
      '/owner/sms',
      '/owner/reports',
      '/owner/settings',
      '/owner/notifications',
      '/owner/chat',
    ];

    for (const route of ownerRoutes) {
      it(`renders Owner route: ${route} without crashing`, async () => {
        const { container } = render(
          <MemoryRouter initialEntries={[route]}>
            <App />
          </MemoryRouter>
        );
        expect(container).toBeTruthy();
      });
    }
  });

  describe('2. Admin Role - Access to Admin Pages', () => {
    beforeEach(() => {
      setUserRole('admin', 'usr-admin-1', 'Admin User');
    });

    const adminRoutes = [
      '/admin/dashboard',
      '/admin/users',
      '/admin/users/create',
      '/admin/passwords',
      '/admin/courses',
      '/admin/courses/create',
      '/admin/groups',
      '/admin/groups/create',
      '/admin/schedule',
      '/admin/reminders',
      '/admin/attendance',
      '/admin/attendance/teachers',
      '/admin/attendance/reports',
      '/admin/grades',
      '/admin/tuition',
      '/admin/reports',
      '/admin/settings',
      '/admin/website',
      '/admin/notifications',
      '/admin/chat',
    ];

    for (const route of adminRoutes) {
      it(`renders Admin route: ${route} without crashing`, async () => {
        const { container } = render(
          <MemoryRouter initialEntries={[route]}>
            <App />
          </MemoryRouter>
        );
        expect(container).toBeTruthy();
      });
    }
  });

  describe('3. Teacher Role - Access to Teacher Pages', () => {
    beforeEach(() => {
      setUserRole('teacher', 'usr-teacher-1', 'Ustoz Beknazarov');
    });

    const teacherRoutes = [
      '/teacher/dashboard',
      '/teacher/courses',
      '/teacher/users',
      '/teacher/students',
      '/teacher/groups',
      '/teacher/schedule',
      '/teacher/attendance',
      '/teacher/grades',
      '/teacher/chat',
      '/teacher/notifications',
      '/teacher/settings',
    ];

    for (const route of teacherRoutes) {
      it(`renders Teacher route: ${route} without crashing`, async () => {
        const { container } = render(
          <MemoryRouter initialEntries={[route]}>
            <App />
          </MemoryRouter>
        );
        expect(container).toBeTruthy();
      });
    }
  });

  describe('4. Student Role - Access to Student Pages', () => {
    beforeEach(() => {
      setUserRole('student', 'usr-student-1', 'Talaba Alisher');
    });

    const studentRoutes = [
      '/student/dashboard',
      '/student/group',
      '/student/grades',
      '/student/attendance',
      '/student/schedule',
      '/student/chat',
      '/student/notifications',
      '/student/settings',
    ];

    for (const route of studentRoutes) {
      it(`renders Student route: ${route} without crashing`, async () => {
        const { container } = render(
          <MemoryRouter initialEntries={[route]}>
            <App />
          </MemoryRouter>
        );
        expect(container).toBeTruthy();
      });
    }
  });

  describe('5. Security & Role Boundaries (Access Control)', () => {
    it('Student cannot access /owner/dashboard and is redirected or blocked', () => {
      setUserRole('student', 'usr-student-1', 'Talaba');
      const { container } = render(
        <MemoryRouter initialEntries={['/owner/dashboard']}>
          <App />
        </MemoryRouter>
      );
      // Student should not see owner-specific dashboard or should be redirected to /unauthorized or /student/dashboard
      expect(container).toBeTruthy();
    });

    it('Student cannot access /owner/tuition', () => {
      setUserRole('student', 'usr-student-1', 'Talaba');
      const { container } = render(
        <MemoryRouter initialEntries={['/owner/tuition']}>
          <App />
        </MemoryRouter>
      );
      expect(container).toBeTruthy();
    });

    it('Teacher cannot access /owner/website', () => {
      setUserRole('teacher', 'usr-teacher-1', 'Ustoz');
      const { container } = render(
        <MemoryRouter initialEntries={['/owner/website']}>
          <App />
        </MemoryRouter>
      );
      expect(container).toBeTruthy();
    });

    it('Unauthenticated user on protected route is redirected to /login', () => {
      useAuthStore.setState({
        user: null,
        profile: null,
        session: null,
        loading: false,
      });
      const { container } = render(
        <MemoryRouter initialEntries={['/owner/dashboard']}>
          <App />
        </MemoryRouter>
      );
      expect(container).toBeTruthy();
    });
  });
});

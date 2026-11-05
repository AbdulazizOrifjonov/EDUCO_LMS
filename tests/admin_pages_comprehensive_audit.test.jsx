import { describe, it, expect, beforeEach, vi } from 'vitest';
import React from 'react';
import { render, screen } from '@testing-library/react';
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
    full_name: 'Test Student',
    first_name: 'Test',
    last_name: 'Student',
    phone: '+998901234567',
    is_active: true,
  });
  localStore.saveCourse({ id: 'crs-1', name: 'Test Course', code: 'CRS-1', price: 500000 });
  localStore.saveGroup({ id: 'grp-1', name: 'Test Group', course_id: 'crs-1', room: '101' });
  try {
    localStorage.setItem('educo_db_homework', JSON.stringify([{ id: 'hw-1', title: 'Test HW', group_id: 'grp-1' }]));
  } catch (_) {}

  // Admin user
  const adminUser = {
    id: 'usr-admin-erkinova',
    email: 'admin@educo.app',
    user_metadata: {
      role: 'admin',
      full_name: 'Erkinova Zilola',
      username: 'zilola_admin',
    },
  };
  const adminProfile = {
    id: 'usr-admin-erkinova',
    username: 'zilola_admin',
    full_name: 'Erkinova Zilola',
    role: 'admin',
    email: 'admin@educo.app',
    is_active: true,
  };
  useAuthStore.setState({
    user: adminUser,
    profile: adminProfile,
    session: { user: adminUser },
    loading: false,
    error: null,
  });
});

const adminRoutesToTest = [
  '/admin',
  '/admin/dashboard',
  '/admin/users',
  '/admin/users?role=all',
  '/admin/users?role=student',
  '/admin/users?role=teacher',
  '/admin/users?role=admin',
  '/admin/users/create',
  '/admin/users/create?role=student',
  '/admin/users/create?role=teacher',
  '/admin/students/create',
  '/admin/users/edit/usr-student-1',
  '/admin/users/usr-student-1/edit',
  '/admin/users/profile/usr-student-1',
  '/admin/users/usr-student-1',
  '/admin/passwords',
  '/admin/courses',
  '/admin/courses/create',
  '/admin/courses/edit/crs-1',
  '/admin/courses/crs-1/edit',
  '/admin/groups',
  '/admin/groups/create',
  '/admin/groups/edit/grp-1',
  '/admin/groups/grp-1/edit',
  '/admin/groups/grp-1',
  '/admin/groups/grp-1/add-student',
  '/admin/schedule',
  '/admin/attendance',
  '/admin/attendance/teachers',
  '/admin/attendance/reports',
  '/admin/grades',
  '/admin/homework',
  '/admin/homework/hw-1',
  '/admin/materials',
  '/admin/announcements',
  '/admin/tuition',
  '/admin/reports',
  '/admin/audit',
  '/admin/settings',
  '/admin/website',
  '/admin/website?tab=overview',
  '/admin/website?tab=slider',
  '/admin/website?tab=courses',
  '/admin/website?tab=subjects',
  '/admin/website?tab=teachers',
  '/admin/website?tab=news',
  '/admin/website?tab=videos',
  '/admin/website?tab=gallery',
  '/admin/website?tab=testimonials',
  '/admin/website?tab=about',
  '/admin/website?tab=settings',
  '/admin/notifications',
  '/admin/reminders',
  '/admin/chat',
  '/admin/sms',
];

describe('Admin Section Comprehensive Pages Audit', () => {
  for (const route of adminRoutesToTest) {
    it(`renders route ${route} properly without 404 or crashing`, async () => {
      const { container, findByText } = render(
        <MemoryRouter initialEntries={[route]}>
          <App />
        </MemoryRouter>
      );
      // Wait for page to finish lazy loading
      await new Promise((r) => setTimeout(r, 50));
      expect(container.textContent).not.toContain('Sahifa topilmadi');
      expect(container.textContent).not.toContain('Page not found');
      expect(container.textContent).not.toContain('404');
    }, 15000);
  }
});

import React from 'react';
import { Outlet } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  BookOpen,
  GraduationCap,
  Calendar,
  CheckSquare,
  Award,
  MessageSquare,
  Receipt,
  BarChart3,
  Bell,
  BellRing,
  Settings,
  KeyRound,
} from 'lucide-react';
import DashboardLayout from './DashboardLayout';

const ADMIN_NAV_ITEMS = [
  {
    labelKey: 'nav.dashboard',
    label: 'Dashboard',
    path: '/admin',
    icon: LayoutDashboard,
  },
  {
    labelKey: 'nav.users',
    label: 'Users',
    path: '/admin/users',
    icon: Users,
  },
  {
    labelKey: 'nav.passwords',
    label: 'Parollar',
    path: '/admin/passwords',
    icon: KeyRound,
  },
  {
    labelKey: 'nav.courses',
    label: 'Courses',
    path: '/admin/courses',
    icon: BookOpen,
  },
  {
    labelKey: 'nav.groups',
    label: 'Groups',
    path: '/admin/groups',
    icon: GraduationCap,
  },
  {
    labelKey: 'nav.schedule',
    label: 'Schedule',
    path: '/admin/schedule',
    icon: Calendar,
  },
  {
    labelKey: 'nav.reminders',
    label: 'Eslatmalar',
    path: '/admin/reminders',
    icon: BellRing,
  },
  {
    labelKey: 'nav.attendance',
    label: 'Attendance',
    path: '/admin/attendance',
    icon: CheckSquare,
  },
  {
    labelKey: 'nav.grades',
    label: 'Grades',
    path: '/admin/grades',
    icon: Award,
  },
  {
    labelKey: 'nav.chat',
    label: 'Chat',
    path: '/admin/chat',
    icon: MessageSquare,
  },
  {
    labelKey: 'nav.tuition',
    label: 'Tuition',
    path: '/admin/tuition',
    icon: Receipt,
  },
  {
    labelKey: 'nav.reports',
    label: 'Reports',
    path: '/admin/reports',
    icon: BarChart3,
  },
  {
    labelKey: 'nav.notifications',
    label: 'Notifications',
    path: '/admin/notifications',
    icon: Bell,
  },
  {
    labelKey: 'nav.settings',
    label: 'Settings',
    path: '/admin/settings',
    icon: Settings,
  },
];

export default function AdminLayout() {
  return (
    <DashboardLayout role="admin" sidebarItems={ADMIN_NAV_ITEMS}>
      <Outlet />
    </DashboardLayout>
  );
}

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
  Smartphone,
} from 'lucide-react';
import DashboardLayout from './DashboardLayout';

const OWNER_NAV_ITEMS = [
  {
    labelKey: 'nav.dashboard',
    label: 'Dashboard',
    path: '/owner',
    icon: LayoutDashboard,
  },
  {
    labelKey: 'nav.users',
    label: 'Users',
    path: '/owner/users',
    icon: Users,
  },
  {
    labelKey: 'nav.passwords',
    label: 'Parollar',
    path: '/owner/passwords',
    icon: KeyRound,
  },
  {
    labelKey: 'nav.courses',
    label: 'Courses',
    path: '/owner/courses',
    icon: BookOpen,
  },
  {
    labelKey: 'nav.groups',
    label: 'Groups',
    path: '/owner/groups',
    icon: GraduationCap,
  },
  {
    labelKey: 'nav.schedule',
    label: 'Schedule',
    path: '/owner/schedule',
    icon: Calendar,
  },
  {
    labelKey: 'nav.reminders',
    label: 'Eslatmalar',
    path: '/owner/reminders',
    icon: BellRing,
  },
  {
    labelKey: 'nav.attendance',
    label: 'Attendance',
    path: '/owner/attendance',
    icon: CheckSquare,
  },
  {
    labelKey: 'nav.grades',
    label: 'Grades',
    path: '/owner/grades',
    icon: Award,
  },
  {
    labelKey: 'nav.chat',
    label: 'Chat',
    path: '/owner/chat',
    icon: MessageSquare,
  },
  {
    labelKey: 'nav.tuition',
    label: 'Tuition',
    path: '/owner/tuition',
    icon: Receipt,
  },
  {
    labelKey: 'nav.sms',
    label: 'SMS Xabarnomalar',
    path: '/owner/sms',
    icon: Smartphone,
  },
  {
    labelKey: 'nav.reports',
    label: 'Reports',
    path: '/owner/reports',
    icon: BarChart3,
  },
  {
    labelKey: 'nav.notifications',
    label: 'Notifications',
    path: '/owner/notifications',
    icon: Bell,
  },
  {
    labelKey: 'nav.settings',
    label: 'Settings',
    path: '/owner/settings',
    icon: Settings,
  },
];

export default function OwnerLayout() {
  return (
    <DashboardLayout role="owner" sidebarItems={OWNER_NAV_ITEMS}>
      <Outlet />
    </DashboardLayout>
  );
}

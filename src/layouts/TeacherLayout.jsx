import React from 'react';
import { Outlet } from 'react-router-dom';
import {
  LayoutDashboard,
  BookOpen,
  Users2,
  KeyRound,
  Calendar,
  CheckSquare,
  Award,
  Clock,
  MessageSquare,
  Bell,
  Settings,
  GraduationCap,
} from 'lucide-react';
import DashboardLayout from './DashboardLayout';

const TEACHER_NAV_ITEMS = [
  {
    labelKey: 'nav.dashboard',
    label: 'Dashboard',
    path: '/teacher',
    icon: LayoutDashboard,
  },
  {
    labelKey: 'nav.courses',
    label: 'Kurslar & Yo‘nalishlar',
    path: '/teacher/courses',
    icon: BookOpen,
  },
  {
    labelKey: 'dashboard.myGroups',
    label: 'Guruhlarim',
    path: '/teacher/groups',
    icon: Users2,
  },
  {
    labelKey: 'nav.students',
    label: 'O‘quvchilar',
    path: '/teacher/users',
    icon: GraduationCap,
  },
  {
    labelKey: 'nav.passwords',
    label: 'O‘quvchilar parollari',
    path: '/teacher/passwords',
    icon: KeyRound,
  },
  {
    labelKey: 'nav.schedule',
    label: 'Dars jadvali',
    path: '/teacher/schedule',
    icon: Calendar,
  },
  {
    labelKey: 'nav.attendance',
    label: 'Davomat',
    path: '/teacher/attendance',
    icon: CheckSquare,
  },
  {
    labelKey: 'nav.grades',
    label: 'Baholar & Jurnal',
    path: '/teacher/grades',
    icon: Award,
  },
  {
    labelKey: 'nav.chat',
    label: 'Chat & Kanallar',
    path: '/teacher/chat',
    icon: MessageSquare,
  },
  {
    labelKey: 'nav.notifications',
    label: 'Xabarnomalar',
    path: '/teacher/notifications',
    icon: Bell,
  },
  {
    labelKey: 'nav.settings',
    label: 'Sozlamalar',
    path: '/teacher/settings',
    icon: Settings,
  },
];

export default function TeacherLayout() {
  return (
    <DashboardLayout role="teacher" sidebarItems={TEACHER_NAV_ITEMS}>
      <Outlet />
    </DashboardLayout>
  );
}

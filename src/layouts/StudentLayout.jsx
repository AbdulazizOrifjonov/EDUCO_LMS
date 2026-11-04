import React from 'react';
import { Outlet } from 'react-router-dom';
import {
  LayoutDashboard,
  GraduationCap,
  Calendar,
  Award,
  CheckSquare,
  MessageSquare,
  Bell,
  Settings,
  FileCheck,
  BookOpen,
  Megaphone,
} from 'lucide-react';
import DashboardLayout from './DashboardLayout';

const STUDENT_NAV_ITEMS = [
  {
    labelKey: 'nav.dashboard',
    label: 'Dashboard',
    path: '/student',
    icon: LayoutDashboard,
  },
  {
    labelKey: 'dashboard.myGroup',
    label: 'My Group',
    path: '/student/group',
    icon: GraduationCap,
  },
  {
    labelKey: 'dashboard.mySchedule',
    label: 'Schedule',
    path: '/student/schedule',
    icon: Calendar,
  },
  {
    label: 'Uyga vazifalar',
    path: '/student/homework',
    icon: FileCheck,
  },
  {
    label: 'O‘quv materiallari',
    path: '/student/materials',
    icon: BookOpen,
  },
  {
    labelKey: 'dashboard.myGrades',
    label: 'Grades',
    path: '/student/grades',
    icon: Award,
  },
  {
    labelKey: 'dashboard.myAttendance',
    label: 'Attendance',
    path: '/student/attendance',
    icon: CheckSquare,
  },
  {
    label: 'Eʼlonlar',
    path: '/student/announcements',
    icon: Megaphone,
  },
  {
    labelKey: 'nav.chat',
    label: 'Chat',
    path: '/student/chat',
    icon: MessageSquare,
  },
  {
    labelKey: 'nav.notifications',
    label: 'Notifications',
    path: '/student/notifications',
    icon: Bell,
  },
  {
    labelKey: 'nav.settings',
    label: 'Settings',
    path: '/student/settings',
    icon: Settings,
  },
];

export default function StudentLayout() {
  return (
    <DashboardLayout role="student" sidebarItems={STUDENT_NAV_ITEMS}>
      <Outlet />
    </DashboardLayout>
  );
}

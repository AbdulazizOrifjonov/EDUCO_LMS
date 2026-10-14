import React from 'react';
import { Outlet } from 'react-router-dom';
import {
  LayoutDashboard,
  Users2,
  Calendar,
  CheckSquare,
  Award,
  FileText,
  FolderOpen,
  Megaphone,
  MessageSquare,
  Bell,
  Settings,
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
    labelKey: 'dashboard.myGroups',
    label: 'My Groups',
    path: '/teacher/groups',
    icon: Users2,
  },
  {
    labelKey: 'nav.schedule',
    label: 'Schedule',
    path: '/teacher/schedule',
    icon: Calendar,
  },
  {
    labelKey: 'nav.attendance',
    label: 'Attendance',
    path: '/teacher/attendance',
    icon: CheckSquare,
  },
  {
    labelKey: 'nav.grades',
    label: 'Grades',
    path: '/teacher/grades',
    icon: Award,
  },
  {
    labelKey: 'nav.homework',
    label: 'Homework',
    path: '/teacher/homework',
    icon: FileText,
  },
  {
    labelKey: 'nav.materials',
    label: 'Materials',
    path: '/teacher/materials',
    icon: FolderOpen,
  },
  {
    labelKey: 'nav.announcements',
    label: 'Announcements',
    path: '/teacher/announcements',
    icon: Megaphone,
  },
  {
    labelKey: 'nav.chat',
    label: 'Chat',
    path: '/teacher/chat',
    icon: MessageSquare,
  },
  {
    labelKey: 'nav.notifications',
    label: 'Notifications',
    path: '/teacher/notifications',
    icon: Bell,
  },
  {
    labelKey: 'nav.settings',
    label: 'Settings',
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

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
  Globe,
  Sliders,
  Newspaper,
  Video,
  Image as ImageIcon,
  MessageSquareQuote,
  Sparkles,
  Layers,
  FileCheck,
  Megaphone,
  ShieldAlert,
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
    label: 'Uyga vazifalar',
    path: '/admin/homework',
    icon: FileCheck,
  },
  {
    label: 'O‘quv materiallari',
    path: '/admin/materials',
    icon: BookOpen,
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
    label: 'Eʼlonlar',
    path: '/admin/announcements',
    icon: Megaphone,
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
    label: 'Audit jurnali',
    path: '/admin/audit',
    icon: ShieldAlert,
  },
  {
    labelKey: 'nav.notifications',
    label: 'Notifications',
    path: '/admin/notifications',
    icon: Bell,
  },
  {
    label: 'Website',
    path: '/admin/website',
    icon: Globe,
    children: [
      { label: 'Umumiy hisobot', tab: 'overview', icon: Layers },
      { label: 'Bosh sahifa slayderi', tab: 'slider', icon: Sliders },
      { label: 'Kurslar', tab: 'courses', icon: BookOpen },
      { label: 'Fanlar', tab: 'subjects', icon: GraduationCap },
      { label: 'Ustozlar', tab: 'teachers', icon: Users },
      { label: 'Yangiliklar', tab: 'news', icon: Newspaper },
      { label: 'Video lavhalar', tab: 'videos', icon: Video },
      { label: 'Darslardan lavhalar', tab: 'gallery', icon: ImageIcon },
      { label: 'Fikrlar va sharhlar', tab: 'testimonials', icon: MessageSquareQuote },
      { label: 'Biz haqimizda & Statistika', tab: 'about', icon: Sparkles },
      { label: 'Website sozlamalari', tab: 'settings', icon: Settings },
    ],
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

import React, { useEffect, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import useAuth from '@/hooks/useAuth';
import ProtectedRoute from '@/components/ProtectedRoute';
import ToastContainer from '@/components/ui/Toast';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { ROLES } from '@/lib/constants';

// Layouts
import OwnerLayout from '@/layouts/OwnerLayout';
import AdminLayout from '@/layouts/AdminLayout';
import TeacherLayout from '@/layouts/TeacherLayout';
import StudentLayout from '@/layouts/StudentLayout';

// Auth & Error Pages
import LoginPage from '@/pages/auth/LoginPage';
import InvitePage from '@/pages/auth/InvitePage';
import ResetPasswordPage from '@/pages/auth/ResetPasswordPage';
import UnauthorizedPage from '@/pages/auth/UnauthorizedPage';
import NotFoundPage from '@/pages/auth/NotFoundPage';

// Dashboards & Primary Entry Pages
import OwnerDashboard from '@/pages/owner/OwnerDashboard';
import AdminDashboard from '@/pages/admin/AdminDashboard';
import TeacherDashboard from '@/pages/teacher/TeacherDashboard';
import StudentDashboard from '@/pages/student/StudentDashboard';
import UserManagement from '@/pages/shared/UserManagement';
import CourseManagement from '@/pages/shared/CourseManagement';
import GroupManagement from '@/pages/shared/GroupManagement';
import AttendancePage from '@/pages/shared/AttendancePage';
import GradesPage from '@/pages/shared/GradesPage';
import TuitionPage from '@/pages/shared/TuitionPage';

// Lazy Loaded Sub-Pages & Heavy Feature Modules
const StudentSchedulePage = React.lazy(() => import('@/pages/student/StudentSchedulePage'));
const StudentGroupPage = React.lazy(() => import('@/pages/student/StudentGroupPage'));
const StudentAttendancePage = React.lazy(() => import('@/pages/student/StudentAttendancePage'));
const UserCreatePage = React.lazy(() => import('@/pages/shared/UserCreatePage'));
const PasswordsPage = React.lazy(() => import('@/pages/shared/PasswordsPage'));
const CourseCreatePage = React.lazy(() => import('@/pages/shared/CourseCreatePage'));
const GroupCreatePage = React.lazy(() => import('@/pages/shared/GroupCreatePage'));
const GroupDetail = React.lazy(() => import('@/pages/shared/GroupDetail'));
const ScheduleManagement = React.lazy(() => import('@/pages/shared/ScheduleManagement'));
const TeacherAttendance = React.lazy(() => import('@/pages/shared/TeacherAttendance'));
const AttendanceReport = React.lazy(() => import('@/pages/shared/AttendanceReport'));
const ReportsPage = React.lazy(() => import('@/pages/shared/ReportsPage'));
const SettingsPage = React.lazy(() => import('@/pages/shared/SettingsPage'));
const NotificationsPage = React.lazy(() => import('@/pages/shared/NotificationsPage'));
const ChatPage = React.lazy(() => import('@/pages/shared/ChatPage'));
const RemindersPage = React.lazy(() => import('@/pages/shared/RemindersPage'));
const SmsManagementPage = React.lazy(() => import('@/pages/owner/SmsManagementPage'));

export default function App() {
  const { initializeAuth } = useAuth();

  useEffect(() => {
    const unsubscribe = initializeAuth();
    return () => {
      if (typeof unsubscribe === 'function') unsubscribe();
    };
  }, [initializeAuth]);

  return (
    <>
      <Suspense fallback={<LoadingSpinner fullPage text="Loading EDUCO LMS..." />}>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/invite/:token" element={<InvitePage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route path="/unauthorized" element={<UnauthorizedPage />} />

          {/* Owner Role Routes */}
          <Route
            path="/owner"
            element={
              <ProtectedRoute allowedRoles={[ROLES.OWNER]}>
                <OwnerLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<OwnerDashboard />} />
            <Route path="users" element={<UserManagement />} />
            <Route path="users/create" element={<UserCreatePage />} />
            <Route path="students/create" element={<UserCreatePage />} />
            <Route path="users/edit/:id" element={<UserCreatePage />} />
            <Route path="passwords" element={<PasswordsPage />} />
            <Route path="courses" element={<CourseManagement />} />
            <Route path="courses/create" element={<CourseCreatePage />} />
            <Route path="courses/edit/:id" element={<CourseCreatePage />} />
            <Route path="groups" element={<GroupManagement />} />
            <Route path="groups/create" element={<GroupCreatePage />} />
            <Route path="groups/edit/:id" element={<GroupCreatePage />} />
            <Route path="groups/:id" element={<GroupDetail />} />
            <Route path="schedule" element={<ScheduleManagement />} />
            <Route path="attendance" element={<AttendancePage />} />
            <Route path="attendance/teachers" element={<TeacherAttendance />} />
            <Route path="attendance/reports" element={<AttendanceReport />} />
            <Route path="grades" element={<GradesPage />} />
            <Route path="homework" element={<Navigate to="/owner/dashboard" replace />} />
            <Route path="homework/*" element={<Navigate to="/owner/dashboard" replace />} />
            <Route path="materials" element={<Navigate to="/owner/dashboard" replace />} />
            <Route path="announcements" element={<Navigate to="/owner/chat?channel=announcements" replace />} />
            <Route path="payroll" element={<Navigate to="/owner/dashboard" replace />} />
            <Route path="tuition" element={<TuitionPage />} />
            <Route path="sms" element={<SmsManagementPage />} />
            <Route path="reports" element={<ReportsPage />} />
            <Route path="audit" element={<Navigate to="/owner/dashboard" replace />} />
            <Route path="settings" element={<SettingsPage />} />
            <Route path="notifications" element={<NotificationsPage />} />
            <Route path="reminders" element={<RemindersPage />} />
            <Route path="chat" element={<ChatPage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Route>

          {/* Admin Role Routes */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute allowedRoles={[ROLES.ADMIN, ROLES.OWNER]}>
                <AdminLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<AdminDashboard />} />
            <Route path="users" element={<UserManagement />} />
            <Route path="users/create" element={<UserCreatePage />} />
            <Route path="students/create" element={<UserCreatePage />} />
            <Route path="users/edit/:id" element={<UserCreatePage />} />
            <Route path="passwords" element={<PasswordsPage />} />
            <Route path="courses" element={<CourseManagement />} />
            <Route path="courses/create" element={<CourseCreatePage />} />
            <Route path="courses/edit/:id" element={<CourseCreatePage />} />
            <Route path="groups" element={<GroupManagement />} />
            <Route path="groups/create" element={<GroupCreatePage />} />
            <Route path="groups/edit/:id" element={<GroupCreatePage />} />
            <Route path="groups/:id" element={<GroupDetail />} />
            <Route path="schedule" element={<ScheduleManagement />} />
            <Route path="attendance" element={<AttendancePage />} />
            <Route path="attendance/teachers" element={<TeacherAttendance />} />
            <Route path="attendance/reports" element={<AttendanceReport />} />
            <Route path="grades" element={<GradesPage />} />
            <Route path="homework" element={<Navigate to="/admin/dashboard" replace />} />
            <Route path="homework/*" element={<Navigate to="/admin/dashboard" replace />} />
            <Route path="materials" element={<Navigate to="/admin/dashboard" replace />} />
            <Route path="announcements" element={<Navigate to="/admin/chat?channel=announcements" replace />} />
            <Route path="tuition" element={<TuitionPage />} />
            <Route path="reports" element={<ReportsPage />} />
            <Route path="settings" element={<SettingsPage />} />
            <Route path="notifications" element={<NotificationsPage />} />
            <Route path="reminders" element={<RemindersPage />} />
            <Route path="chat" element={<ChatPage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Route>

          {/* Teacher Role Routes */}
          <Route
            path="/teacher"
            element={
              <ProtectedRoute allowedRoles={[ROLES.TEACHER]}>
                <TeacherLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<TeacherDashboard />} />
            <Route path="users/create" element={<UserCreatePage />} />
            <Route path="students/create" element={<UserCreatePage />} />
            <Route path="groups" element={<GroupManagement />} />
            <Route path="groups/create" element={<GroupCreatePage />} />
            <Route path="groups/edit/:id" element={<GroupCreatePage />} />
            <Route path="groups/:id" element={<GroupDetail />} />
            <Route path="groups/:id/add-student" element={<UserCreatePage />} />
            <Route path="schedule" element={<ScheduleManagement />} />
            <Route path="attendance" element={<AttendancePage />} />
            <Route path="grades" element={<GradesPage />} />
            <Route path="homework" element={<Navigate to="/teacher/dashboard" replace />} />
            <Route path="homework/*" element={<Navigate to="/teacher/dashboard" replace />} />
            <Route path="materials" element={<Navigate to="/teacher/dashboard" replace />} />
            <Route path="announcements" element={<Navigate to="/teacher/chat?channel=announcements" replace />} />
            <Route path="chat" element={<ChatPage />} />
            <Route path="notifications" element={<NotificationsPage />} />
            <Route path="settings" element={<SettingsPage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Route>

          {/* Student Role Routes */}
          <Route
            path="/student"
            element={
              <ProtectedRoute allowedRoles={[ROLES.STUDENT]}>
                <StudentLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<StudentDashboard />} />
            <Route path="group" element={<StudentGroupPage />} />
            <Route path="grades" element={<GradesPage />} />
            <Route path="attendance" element={<StudentAttendancePage />} />
            <Route path="homework" element={<Navigate to="/student/dashboard" replace />} />
            <Route path="homework/*" element={<Navigate to="/student/dashboard" replace />} />
            <Route path="materials" element={<Navigate to="/student/dashboard" replace />} />
            <Route path="announcements" element={<Navigate to="/student/chat?channel=announcements" replace />} />
            <Route path="schedule" element={<StudentSchedulePage />} />
            <Route path="chat" element={<ChatPage />} />
            <Route path="notifications" element={<NotificationsPage />} />
            <Route path="settings" element={<SettingsPage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Route>

          {/* Global Fallback 404 */}
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </Suspense>

      {/* Global Toast Notifications Container */}
      <ToastContainer />
    </>
  );
}

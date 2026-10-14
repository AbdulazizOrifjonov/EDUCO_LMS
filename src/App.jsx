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

// Dashboards
import OwnerDashboard from '@/pages/owner/OwnerDashboard';
import AdminDashboard from '@/pages/admin/AdminDashboard';
import TeacherDashboard from '@/pages/teacher/TeacherDashboard';
import StudentDashboard from '@/pages/student/StudentDashboard';

// Owner Specific
import PayrollPage from '@/pages/owner/PayrollPage';
import AuditLogPage from '@/pages/owner/AuditLogPage';

// Shared Pages
import UserManagement from '@/pages/shared/UserManagement';
import PasswordsPage from '@/pages/shared/PasswordsPage';
import CourseManagement from '@/pages/shared/CourseManagement';
import GroupManagement from '@/pages/shared/GroupManagement';
import GroupDetail from '@/pages/shared/GroupDetail';
import ScheduleManagement from '@/pages/shared/ScheduleManagement';
import AttendancePage from '@/pages/shared/AttendancePage';
import TeacherAttendance from '@/pages/shared/TeacherAttendance';
import AttendanceReport from '@/pages/shared/AttendanceReport';
import GradesPage from '@/pages/shared/GradesPage';
import HomeworkPage from '@/pages/shared/HomeworkPage';
import HomeworkDetail from '@/pages/shared/HomeworkDetail';
import MaterialsPage from '@/pages/shared/MaterialsPage';
import AnnouncementsPage from '@/pages/shared/AnnouncementsPage';
import TuitionPage from '@/pages/shared/TuitionPage';
import ReportsPage from '@/pages/shared/ReportsPage';
import SettingsPage from '@/pages/shared/SettingsPage';
import NotificationsPage from '@/pages/shared/NotificationsPage';
import ChatPage from '@/pages/shared/ChatPage';

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
            <Route path="passwords" element={<PasswordsPage />} />
            <Route path="courses" element={<CourseManagement />} />
            <Route path="groups" element={<GroupManagement />} />
            <Route path="groups/:id" element={<GroupDetail />} />
            <Route path="schedule" element={<ScheduleManagement />} />
            <Route path="attendance" element={<AttendancePage />} />
            <Route path="attendance/teachers" element={<TeacherAttendance />} />
            <Route path="attendance/reports" element={<AttendanceReport />} />
            <Route path="grades" element={<GradesPage />} />
            <Route path="homework" element={<HomeworkPage />} />
            <Route path="homework/:id" element={<HomeworkDetail />} />
            <Route path="materials" element={<MaterialsPage />} />
            <Route path="announcements" element={<AnnouncementsPage />} />
            <Route path="payroll" element={<PayrollPage />} />
            <Route path="tuition" element={<TuitionPage />} />
            <Route path="reports" element={<ReportsPage />} />
            <Route path="audit" element={<AuditLogPage />} />
            <Route path="settings" element={<SettingsPage />} />
            <Route path="notifications" element={<NotificationsPage />} />
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
            <Route path="passwords" element={<PasswordsPage />} />
            <Route path="courses" element={<CourseManagement />} />
            <Route path="groups" element={<GroupManagement />} />
            <Route path="groups/:id" element={<GroupDetail />} />
            <Route path="schedule" element={<ScheduleManagement />} />
            <Route path="attendance" element={<AttendancePage />} />
            <Route path="attendance/teachers" element={<TeacherAttendance />} />
            <Route path="attendance/reports" element={<AttendanceReport />} />
            <Route path="grades" element={<GradesPage />} />
            <Route path="homework" element={<HomeworkPage />} />
            <Route path="homework/:id" element={<HomeworkDetail />} />
            <Route path="materials" element={<MaterialsPage />} />
            <Route path="announcements" element={<AnnouncementsPage />} />
            <Route path="tuition" element={<TuitionPage />} />
            <Route path="reports" element={<ReportsPage />} />
            <Route path="settings" element={<SettingsPage />} />
            <Route path="notifications" element={<NotificationsPage />} />
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
            <Route path="groups" element={<GroupManagement />} />
            <Route path="groups/:id" element={<GroupDetail />} />
            <Route path="schedule" element={<ScheduleManagement />} />
            <Route path="attendance" element={<AttendancePage />} />
            <Route path="grades" element={<GradesPage />} />
            <Route path="homework" element={<HomeworkPage />} />
            <Route path="homework/:id" element={<HomeworkDetail />} />
            <Route path="materials" element={<MaterialsPage />} />
            <Route path="announcements" element={<AnnouncementsPage />} />
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
            <Route path="grades" element={<GradesPage />} />
            <Route path="attendance" element={<AttendancePage />} />
            <Route path="homework" element={<HomeworkPage />} />
            <Route path="homework/:id" element={<HomeworkDetail />} />
            <Route path="materials" element={<MaterialsPage />} />
            <Route path="announcements" element={<AnnouncementsPage />} />
            <Route path="schedule" element={<ScheduleManagement />} />
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

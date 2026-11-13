import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useSearchParams, useNavigate, useLocation } from 'react-router-dom';
import {
  Users,
  UserPlus,
  UserCheck,
  GraduationCap,
  BookOpen,
  Layers,
  AlertCircle,
  RefreshCw,
  ArrowRight,
  Shield,
  Search,
  Filter,
  Download,
  Edit2,
  KeyRound,
  ShieldAlert,
  CheckCircle,
  XCircle,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  MoreVertical,
  Phone,
  Trash2,
  Eye,
  EyeOff,
  Copy,
  Check,
  FileSpreadsheet,
} from 'lucide-react';
import useAuth from '@/hooks/useAuth';
import OwnerMasterLiveSheet from '@/components/owner/OwnerMasterLiveSheet';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Badge from '@/components/ui/Badge';
import Table from '@/components/ui/Table';
import Select from '@/components/ui/Select';
import Modal from '@/components/ui/Modal';
import RoleBadge from '@/components/ui/RoleBadge';
import { toast } from '@/components/ui/Toast';
import UserForm from './UserForm';
import {
  getUsers,
  getTeacherStudentIds,
  toggleUserStatus,
  resetUserPassword,
  exportUsersToCSV,
  exportUsersToExcel,
  deleteUser,
} from '@/services/userService';
import { ROLES } from '@/lib/constants';
import { getGroups, enrollStudent } from '@/services/groupService';
import { localStore } from '@/lib/localStore';
import { formatUzPhone } from '@/utils/phoneFormat';
import { useSearch } from '@/context/SearchContext';
import { useTwoStepConfirm } from '@/context/ConfirmContext';

export default function UserManagement() {
  const { t, i18n } = useTranslation();
  const { profile, user } = useAuth();
  const { confirmDelete } = useTwoStepConfirm();
  const currentUserRole = profile?.role || ROLES.OWNER;
  const currentUserId = user?.id || profile?.id;
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const urlRole = searchParams.get('role');
  const { searchQuery, setSearchQuery } = useSearch();
  const [viewMode, setViewMode] = useState('list'); // 'list' | 'live-sheet'

  const isTeacher = String(currentUserRole).toLowerCase() === 'teacher';
  const isTeachersPath = location.pathname.endsWith('/teachers') || location.pathname.includes('/teachers');
  const isStudentsPath = location.pathname.endsWith('/students') || location.pathname.includes('/students');

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState(searchQuery || '');
  const [roleFilter, setRoleFilter] = useState(() => {
    if (isTeacher) return ROLES.STUDENT;
    if (isTeachersPath) return ROLES.TEACHER;
    if (isStudentsPath) return ROLES.STUDENT;
    return urlRole || 'all';
  });
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const pageSize = 50;

  // Synchronize with global navbar search bar
  useEffect(() => {
    if (searchQuery !== undefined) {
      setSearch(searchQuery);
      setPage(1);
    }
  }, [searchQuery]);

  // Modal state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedUserForView, setSelectedUserForView] = useState(null);
  const [showModalPassword, setShowModalPassword] = useState(true);
  const [copiedModalPassword, setCopiedModalPassword] = useState(false);
  const [formDefaultRole, setFormDefaultRole] = useState(ROLES.STUDENT);

  // Teacher: Enroll existing student modal state
  const [isEnrollExistingModalOpen, setIsEnrollExistingModalOpen] = useState(false);
  const [enrollModalSearch, setEnrollModalSearch] = useState('');
  const [enrollModalGroupId, setEnrollModalGroupId] = useState('');
  const [isEnrollingStudent, setIsEnrollingStudent] = useState(false);

  // Sync roleFilter if URL changes
  useEffect(() => {
    if (isTeacher) {
      setRoleFilter(ROLES.STUDENT);
      setPage(1);
      return;
    }
    if (location.pathname.endsWith('/teachers') || location.pathname.includes('/teachers')) {
      setRoleFilter(ROLES.TEACHER);
      setPage(1);
      return;
    }
    if (location.pathname.endsWith('/students') || location.pathname.includes('/students')) {
      setRoleFilter(ROLES.STUDENT);
      setPage(1);
      return;
    }
    if (urlRole && ['owner', 'admin', 'teacher', 'student', 'all'].includes(urlRole)) {
      setRoleFilter(urlRole);
      setPage(1);
    }
  }, [urlRole, isTeacher, location.pathname]);

  // Clamps page if page > totalPages to prevent blank screen
  useEffect(() => {
    if (page > totalPages && totalPages > 0) {
      setPage(1);
    }
  }, [page, totalPages]);

  const fetchUsers = useCallback(async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    try {
      const data = await getUsers({
        role: roleFilter,
        status: statusFilter,
        search,
        page,
        limit: pageSize,
        currentUserRole,
        currentUserId,
        currentUser: profile || user,
      });
      setUsers(data.users || []);
      setTotalPages(data.totalPages || 1);
      setTotalCount(data.totalCount || 0);
    } catch (err) {
      console.error(err);
      if (!isSilent) {
        toast.error(t('users.fetchError', 'Failed to load users'));
      }
    } finally {
      if (!isSilent) setLoading(false);
    }
  }, [roleFilter, statusFilter, search, page, currentUserRole, currentUserId, profile, user, t]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const userStats = useMemo(() => {
    let all = localStore.getUsers ? localStore.getUsers() : [];
    if (currentUserRole === 'admin') {
      all = all.filter((u) => u.role !== 'owner');
    } else if (currentUserRole === 'teacher') {
      const teacherStudentIds = getTeacherStudentIds(currentUserId, profile || user);
      all = all.filter((u) => u.role === 'student' && teacherStudentIds.has(String(u.id)));
    }
    const total = all.length;
    const students = all.filter((u) => u.role === 'student').length;
    const teachers = all.filter((u) => u.role === 'teacher').length;
    const admins = all.filter((u) => u.role === 'admin').length;
    const owners = all.filter((u) => u.role === 'owner').length;
    const active = all.filter((u) => u.is_active !== false).length;
    const inactive = all.filter((u) => u.is_active === false).length;
    return { total, students, teachers, admins, owners, active, inactive };
  }, [currentUserRole, currentUserId, profile, user, users]);

  const teacherGroupsCount = useMemo(() => {
    if (!isTeacher) return 0;
    const groups = localStore.getGroups ? localStore.getGroups() : [];
    const normTeacherId = localStore.normalizeUserId ? localStore.normalizeUserId(currentUserId) : currentUserId;
    const teacherUser = profile || user;
    const teacherName = (teacherUser?.fullName || `${teacherUser?.first_name || ''} ${teacherUser?.last_name || ''}`).trim().toLowerCase();
    const teacherSpecialty = (teacherUser?.specialty || teacherUser?.subject || '').trim().toLowerCase();
    const teacherPhoneClean = (teacherUser?.phone || '').replace(/\D/g, '').slice(-9);

    return groups.filter((g) => {
      const gTeacherId = localStore.normalizeUserId ? localStore.normalizeUserId(g.teacherId || g.teacher_id) : (g.teacherId || g.teacher_id);
      const gTeacherName = (g.teacherName || g.teacher_name || '').toLowerCase();
      const gTeacherPhone = (g.teacherPhone || g.teacher_phone || '').replace(/\D/g, '').slice(-9);

      if (gTeacherId && (gTeacherId === normTeacherId || gTeacherId === currentUserId || (teacherUser && gTeacherId === teacherUser.id))) return true;
      if (teacherUser?.group_ids && teacherUser.group_ids.includes(g.id)) return true;
      if (teacherPhoneClean && gTeacherPhone && teacherPhoneClean === gTeacherPhone) return true;
      if (teacherName && gTeacherName && (gTeacherName.includes(teacherName) || teacherName.includes(gTeacherName))) return true;
      if (teacherSpecialty && g.name?.toLowerCase().includes(teacherSpecialty)) return true;
      return false;
    }).length;
  }, [isTeacher, currentUserId, profile, user]);

  const myTeacherGroups = useMemo(() => {
    if (!isTeacher) return [];
    const groups = localStore.getGroups ? localStore.getGroups() : [];
    const normTeacherId = localStore.normalizeUserId ? localStore.normalizeUserId(currentUserId) : currentUserId;
    const teacherUser = profile || user;
    const teacherName = (teacherUser?.fullName || `${teacherUser?.first_name || ''} ${teacherUser?.last_name || ''}`).trim().toLowerCase();
    const teacherSpecialty = (teacherUser?.specialty || teacherUser?.subject || '').trim().toLowerCase();
    const teacherPhoneClean = (teacherUser?.phone || '').replace(/\D/g, '').slice(-9);

    const list = groups.filter((g) => {
      const gTeacherId = localStore.normalizeUserId ? localStore.normalizeUserId(g.teacherId || g.teacher_id) : (g.teacherId || g.teacher_id);
      const gTeacherName = (g.teacherName || g.teacher_name || '').toLowerCase();
      const gTeacherPhone = (g.teacherPhone || g.teacher_phone || '').replace(/\D/g, '').slice(-9);

      if (gTeacherId && (gTeacherId === normTeacherId || gTeacherId === currentUserId || (teacherUser && gTeacherId === teacherUser.id))) return true;
      if (teacherUser?.group_ids && teacherUser.group_ids.includes(g.id)) return true;
      if (teacherPhoneClean && gTeacherPhone && teacherPhoneClean === gTeacherPhone) return true;
      if (teacherName && gTeacherName && (gTeacherName.includes(teacherName) || teacherName.includes(gTeacherName))) return true;
      if (teacherSpecialty && g.name?.toLowerCase().includes(teacherSpecialty)) return true;
      return false;
    });

    return list.length > 0 ? list : groups.filter((g) => g.id === 'grp-fullstack' || g.name?.toLowerCase().includes('full stack'));
  }, [isTeacher, currentUserId, profile, user]);

  const allCenterStudents = useMemo(() => {
    const list = localStore.getUsers ? localStore.getUsers() : [];
    return list.filter((u) => u.role === ROLES.STUDENT && u.is_active !== false);
  }, [users, isEnrollExistingModalOpen]);

  const filteredCenterStudents = useMemo(() => {
    if (!enrollModalSearch.trim()) return allCenterStudents.slice(0, 35);
    const q = enrollModalSearch.trim().toLowerCase();
    const qDigits = q.replace(/\D/g, '');
    return allCenterStudents.filter((st) => {
      const name = (st.fullName || `${st.first_name || ''} ${st.last_name || ''}`).toLowerCase();
      const phoneDigits = (st.phone || '').replace(/\D/g, '');
      return name.includes(q) || (qDigits && phoneDigits.includes(qDigits));
    }).slice(0, 35);
  }, [allCenterStudents, enrollModalSearch]);

  const handleEnrollExistingStudent = async (studentId, groupId, studentName) => {
    setIsEnrollingStudent(true);
    try {
      const targetGid = groupId || myTeacherGroups[0]?.id || 'grp-fullstack';
      await enrollStudent(targetGid, studentId);

      // Synchronize student's group_ids in localStore
      const allUsers = localStore.getUsers ? localStore.getUsers() : [];
      const userObj = allUsers.find((u) => u.id === studentId);
      if (userObj) {
        const curGids = Array.isArray(userObj.group_ids) ? [...userObj.group_ids] : (userObj.group_id ? [userObj.group_id] : []);
        if (!curGids.includes(targetGid)) curGids.push(targetGid);
        userObj.group_ids = curGids;
        if (!userObj.group_id) userObj.group_id = targetGid;
        if (localStore.saveUser) localStore.saveUser(userObj);
      }

      toast.success(`${studentName} muvaffaqiyatli guruhingizga biriktirildi!`);
      await fetchUsers(true);
      await loadGroupsData();
    } catch (err) {
      console.error(err);
      toast.error('O‘quvchini guruhga biriktirishda xatolik yuz berdi');
    } finally {
      setIsEnrollingStudent(false);
    }
  };

  const [groupsMap, setGroupsMap] = useState(() => {
    try {
      const all = localStore.getGroups ? localStore.getGroups() : [];
      const map = {};
      all.forEach((g) => { map[g.id] = g; });
      return map;
    } catch (_) {
      return {};
    }
  });

  const loadGroupsData = useCallback(async () => {
    try {
      const res = await getGroups({ status: 'all', limit: 200 });
      const map = {};
      (res.groups || []).forEach((g) => {
        map[g.id] = g;
      });
      setGroupsMap(map);
    } catch (_) {}
  }, []);

  useEffect(() => {
    loadGroupsData();
  }, [loadGroupsData]);

  const getStudentGroups = useCallback((user) => {
    if (!user || user.role !== ROLES.STUDENT) return [];
    const gids = [];
    if (Array.isArray(user.group_ids) && user.group_ids.length > 0) {
      user.group_ids.forEach((gid) => { if (gid && !gids.includes(gid)) gids.push(gid); });
    }
    if (user.group_id && !gids.includes(user.group_id)) {
      gids.push(user.group_id);
    }

    try {
      const allG = Object.values(groupsMap).length > 0 ? Object.values(groupsMap) : (localStore.getGroups ? localStore.getGroups() : []);
      const normId = localStore.normalizeUserId ? localStore.normalizeUserId(user.id) : String(user.id);

      const memberships = localStore.getMemberships ? localStore.getMemberships() : [];
      memberships
        .filter((m) => localStore.normalizeUserId(m.student_id) === normId && m.is_active !== false)
        .forEach((m) => {
          if (m.group_id && !gids.includes(m.group_id)) gids.push(m.group_id);
        });

      allG.forEach((g) => {
        if (Array.isArray(g.student_ids) && (g.student_ids.includes(user.id) || g.student_ids.map(String).includes(String(user.id)))) {
          if (!gids.includes(g.id)) gids.push(g.id);
        }
      });
    } catch (_) {}

    return gids
      .map((gid) => groupsMap[gid] || localStore.getGroups?.()?.find((g) => g.id === gid))
      .filter(Boolean);
  }, [groupsMap]);

  const getStudentGroup = useCallback((user) => {
    const list = getStudentGroups(user);
    return list[0] || null;
  }, [getStudentGroups]);

  const getTeacherGroups = useCallback((user) => {
    if (!user) return [];
    const allG = Object.values(groupsMap).length > 0 ? Object.values(groupsMap) : (localStore.getGroups ? localStore.getGroups() : []);
    const userId = String(user.id || '');
    const userName = String(user.fullName || user.full_name || `${user.first_name || ''} ${user.last_name || ''}`).toLowerCase();
    return allG.filter((g) => {
      const tid = String(g.teacher_id || g.teacherId || g.primaryTeacher?.id || '');
      const tName = String(g.teacher_name || g.teacherName || g.primaryTeacher?.fullName || '').toLowerCase();
      return (
        (tid && tid === userId) ||
        (tName && userName && (tName.includes(userName) || userName.includes(tName))) ||
        (userName.includes('abdulazizbek') && (tName.includes('abdulazizbek') || g.course_name?.toLowerCase().includes('full stack') || g.name?.toLowerCase().includes('full stack')))
      );
    });
  }, [groupsMap]);

  // Realtime cross-role sync: auto-refresh silently when another user/role adds or modifies users
  useEffect(() => {
    const handleSync = () => {
      fetchUsers(true);
      loadGroupsData();
    };
    window.addEventListener('educo-data-sync', handleSync);
    return () => window.removeEventListener('educo-data-sync', handleSync);
  }, [fetchUsers, loadGroupsData]);

  const handleToggleStatus = async (user) => {
    const nextStatus = !user.is_active;
    if (!nextStatus) {
      // Suspending / blocking user
      const ok = await confirmDelete({
        title: 'Foydalanuvchi hisobini bloklash',
        itemName: user.fullName || user.username,
        description: 'Ushbu foydalanuvchi hisobi to‘xtatiladi va u tizimga (LMS ga) kira olmaydi.',
        confirmButtonText: 'Ha, hisob to‘xtatilsin',
      });
      if (!ok) return;
    }
    try {
      await toggleUserStatus(user.id, nextStatus);
      toast.success(
        nextStatus
          ? t('users.activated', 'User account activated')
          : t('users.suspended', 'User account suspended')
      );
      fetchUsers();
    } catch (err) {
      toast.error(t('common.error', 'Failed to update user status'));
    }
  };

  const handleResetPassword = (user) => {
    if (!user) return;
    const q = user.username || user.fullName || user.first_name || user.phone || '';
    navigate(`/${currentUserRole}/passwords?q=${encodeURIComponent(q)}`);
  };

  /**
   * Strict Hierarchical Delete Permissions:
   * - Owner: Can delete Admin, Teacher, Student (cannot delete other Owner or self).
   * - Admin: Can delete Teacher, Student (cannot delete other Admin, Owner, or self).
   * - Teacher: Can ONLY delete Student (cannot delete other Teacher, Admin, Owner, or self).
   */
  const canDeleteUser = (row) => {
    if (!row || !profile) return false;
    // Cannot delete own active account
    if (row.id === profile.id) return false;

    const myRole = String(profile.role || currentUserRole || '').toLowerCase();
    const theirRole = String(row.role || 'student').toLowerCase();

    // Owner can delete anyone below Owner
    if (myRole === ROLES.OWNER || myRole === 'owner') {
      return theirRole !== ROLES.OWNER && theirRole !== 'owner';
    }

    // Admin can delete Teacher and Student (cannot delete other Admin or Owner)
    if (myRole === ROLES.ADMIN || myRole === 'admin') {
      return (
        theirRole === ROLES.TEACHER ||
        theirRole === ROLES.STUDENT ||
        theirRole === 'teacher' ||
        theirRole === 'student'
      );
    }

    // Teacher can ONLY delete Student
    if (myRole === ROLES.TEACHER || myRole === 'teacher') {
      return theirRole === ROLES.STUDENT || theirRole === 'student';
    }

    return false;
  };

  const handleDeleteUser = async (user) => {
    if (!canDeleteUser(user)) {
      toast.error(t('users.cannotDeleteRole', "Siz ushbu roldagi foydalanuvchini o'chira olmaysiz!"));
      return;
    }

    const roleLabel = t(`roles.${user.role}`, user.role);
    const ok = await confirmDelete({
      title: t('users.deleteConfirmTitle', "Foydalanuvchini butunlay o‘chirish"),
      itemName: `${user.fullName || user.username} (${roleLabel})`,
      description: t(
        'users.deleteConfirmDesc',
        "Ushbu foydalanuvchi hisobi va unga tegishli barcha ma’lumotlar tizimdan butunlay o‘chiriladi. Ushbu amalni qaytarib bo‘lmaydi!"
      ),
      confirmButtonText: t('common.yesDelete', "Ha, o‘chirilsin"),
    });

    if (!ok) return;

    try {
      await deleteUser(user.id);
      toast.success(t('users.deletedSuccess', "Foydalanuvchi tizimdan muvaffaqiyatli o‘chirildi"));
      fetchUsers();
    } catch (err) {
      console.error('Delete user error:', err);
      toast.error(err.message || t('common.error', "Foydalanuvchini o‘chirishda xatolik yuz berdi"));
    }
  };

  const handleExportExcel = () => {
    if (!users.length) {
      toast.warning(t('common.noData', 'Yuklab olish uchun foydalanuvchilar mavjud emas'));
      return;
    }
    exportUsersToExcel(users);
    toast.success('Barcha foydalanuvchilar va xodimlar bazasi Excel formatida (dashboard va formulalar bilan) yuklab olindi!');
  };

  const handleExportCSV = () => {
    if (!users.length) {
      toast.warning(t('common.noData', 'No users to export'));
      return;
    }
    exportUsersToCSV(users);
    toast.success(t('users.exported', 'Users exported to CSV'));
  };

  const roleBadgeVariants = {
    [ROLES.OWNER]: 'danger',
    [ROLES.ADMIN]: 'purple',
    [ROLES.TEACHER]: 'warning',
    [ROLES.STUDENT]: 'success',
  };

  const columns = [
    {
      header: t('common.name', 'Foydalanuvchi'),
      key: 'name',
      className: 'whitespace-nowrap',
      cellClassName: 'whitespace-nowrap',
      render: (row) => {
        const initials =
          `${row.first_name?.[0] || ''}${row.last_name?.[0] || ''}`.toUpperCase() ||
          row.fullName?.[0]?.toUpperCase() ||
          'U';
        const avatarSrc =
          row.avatar_url ||
          (row.id === profile?.id ? profile?.avatar_url : '');
        const avatarGradients = {
          [ROLES.OWNER]: 'from-rose-500 to-red-600',
          [ROLES.ADMIN]: 'from-purple-600 to-indigo-600',
          [ROLES.TEACHER]: 'from-amber-500 to-orange-600',
          [ROLES.STUDENT]: 'from-blue-600 to-indigo-600',
        };
        const grad = avatarGradients[row.role] || 'from-blue-600 to-indigo-600';
        return (
          <div
            onClick={() => navigate(`/${currentUserRole}/users/profile/${row.id}`)}
            className="flex items-center gap-2.5 whitespace-nowrap cursor-pointer group"
            title={t('users.viewProfile', 'Foydalanuvchi profilini ko‘rish va sozlash')}
          >
            <div className={`w-8 h-8 rounded-full overflow-hidden bg-gradient-to-tr ${grad} text-white flex items-center justify-center font-bold text-xs uppercase shrink-0 shadow-sm ring-2 ring-gray-100 dark:ring-gray-800 group-hover:scale-105 transition-transform`}>
              {avatarSrc ? (
                <img
                  src={avatarSrc}
                  alt={row.fullName}
                  className="w-full h-full object-cover"
                />
              ) : (
                initials
              )}
            </div>
            <p
              className="font-semibold text-gray-900 dark:text-gray-100 group-hover:text-blue-600 dark:group-hover:text-emerald-400 group-hover:underline transition-colors max-w-[140px] md:max-w-[170px] lg:max-w-[210px] truncate"
              title={row.fullName}
            >
              {row.fullName}
            </p>
          </div>
        );
      },
    },
    {
      header: t('users.role', 'Role'),
      key: 'role',
      className: 'whitespace-nowrap w-[90px]',
      cellClassName: 'whitespace-nowrap w-[90px]',
      render: (row) => (
        <RoleBadge
          role={row.role}
          user={row}
          size="sm"
          onClick={() => navigate(`/${currentUserRole}/users/profile/${row.id}`)}
          title={t('users.viewProfile', 'Foydalanuvchi profilini ochish')}
        />
      ),
    },
    {
      header: t('users.group', 'O‘quv guruhi'),
      key: 'group',
      className: 'whitespace-nowrap',
      cellClassName: 'whitespace-nowrap',
      render: (row) => {
        if (row.role === ROLES.STUDENT) {
          const studentGroups = getStudentGroups(row);
          if (studentGroups.length > 0) {
            return (
              <div className="flex items-center gap-1 flex-wrap max-w-[220px]">
                {studentGroups.slice(0, 2).map((sg) => {
                  const rawName = sg.name || '';
                  const cleanName = rawName.replace(/\s*\([^)]*\)/g, '').trim() || rawName;
                  const roomNumber = (sg.room || '').replace(/^xona\s*/i, '').trim();
                  const roomLabel = i18n?.language?.startsWith('en')
                    ? `Room ${roomNumber}`
                    : i18n?.language?.startsWith('ru')
                    ? `Каб. ${roomNumber}`
                    : `Xona: ${roomNumber}`;

                  return (
                    <button
                      key={sg.id}
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/${currentUserRole}/users/profile/${row.id}`);
                      }}
                      className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-lg text-xs font-semibold bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/25 transition-all group/gbtn cursor-pointer shadow-2xs max-w-[170px]"
                      title={`${rawName}${sg.room ? ` • ${roomLabel}` : ''}`}
                    >
                      <GraduationCap className="w-3 h-3 text-emerald-600 dark:text-emerald-400 shrink-0" />
                      <span className="font-semibold truncate max-w-[85px]" title={rawName}>
                        {cleanName}
                      </span>
                      {roomNumber && (
                        <span className="text-[10px] px-1 py-0.2 rounded bg-white/80 dark:bg-gray-800 text-gray-700 dark:text-gray-200 border border-emerald-300 dark:border-emerald-700 font-mono shrink-0">
                          🚪 {roomNumber}
                        </span>
                      )}
                    </button>
                  );
                })}
                {studentGroups.length > 2 && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/${currentUserRole}/users/profile/${row.id}`);
                    }}
                    className="px-1.5 py-0.5 rounded-md text-[10px] font-black bg-blue-500/15 text-blue-700 dark:text-blue-300 border border-blue-500/30 hover:bg-blue-500/25 cursor-pointer shadow-2xs"
                    title={`+${studentGroups.length - 2}`}
                  >
                    +{studentGroups.length - 2}
                  </button>
                )}
              </div>
            );
          }
          return (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                navigate(`/${currentUserRole}/users/profile/${row.id}`);
              }}
              className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg text-[11px] font-semibold bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/25 hover:bg-amber-500/20 transition-all cursor-pointer"
              title={t('users.noGroup', 'Guruhsiz')}
            >
              <AlertCircle className="w-3 h-3 text-amber-500 shrink-0" />
              <span>{t('users.noGroup', 'Guruhsiz')}</span>
            </button>
          );
        }

        if (row.role === ROLES.TEACHER || row.role === 'teacher' || row.role === 'mentor') {
          const teacherGroups = getTeacherGroups(row);
          const subject = row.subject || row.specialty || row.direction || (teacherGroups[0]?.course_name || 'Fan');
          const groupCountText = i18n?.language?.startsWith('en')
            ? `${teacherGroups.length} ${teacherGroups.length === 1 ? 'group' : 'groups'}`
            : i18n?.language?.startsWith('ru')
            ? `${teacherGroups.length} ${teacherGroups.length === 1 ? 'группа' : 'групп'}`
            : `${teacherGroups.length} ta guruh`;

          return (
            <div className="flex items-center gap-1.5 flex-wrap max-w-[240px]">
              {subject && (
                <span
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs font-semibold bg-blue-500/10 text-blue-700 dark:text-blue-300 border border-blue-500/20 max-w-[130px]"
                  title={subject}
                >
                  <BookOpen className="w-3 h-3 text-blue-600 dark:text-blue-400 shrink-0" />
                  <span className="truncate">{subject}</span>
                </span>
              )}
              {teacherGroups.length > 0 && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/${currentUserRole}/users/profile/${row.id}`);
                  }}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs font-bold bg-amber-500/15 text-amber-800 dark:text-amber-300 border border-amber-500/30 hover:bg-amber-500/25 transition-all cursor-pointer shadow-2xs"
                  title={teacherGroups.map((tg) => `${tg.name}: ${tg.schedule || tg.schedule_time || 'Jadval'}`).join('\n')}
                >
                  <Users className="w-3 h-3 text-amber-600 dark:text-amber-400 shrink-0" />
                  <span>{groupCountText}</span>
                </button>
              )}
            </div>
          );
        }

        return <span className="text-xs text-gray-400">—</span>;
      },
    },
    {
      header: t('common.phone', 'Phone'),
      key: 'phone',
      className: 'whitespace-nowrap',
      cellClassName: 'whitespace-nowrap',
      render: (row) => {
        const primaryPhone = row.phone || row.father_phone || row.mother_phone || '';
        const hasParentPhone = row.role === 'student' && (row.father_phone || row.mother_phone);

        return (
          <div className="flex items-center gap-1.5 whitespace-nowrap">
            {/* Primary Phone Badge */}
            <span className="inline-flex items-center gap-1 font-mono text-[11px] font-bold text-gray-800 dark:text-gray-200 bg-gray-100/90 dark:bg-gray-800/90 px-2 py-0.5 rounded-lg border border-gray-200 dark:border-gray-700/80 shadow-2xs">
              <Phone className="w-2.5 h-2.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
              {primaryPhone ? formatUzPhone(primaryPhone) : '—'}
            </span>

            {/* Compact Parent Popover Badge */}
            {hasParentPhone && (
              <div className="relative group/parent inline-block">
                <button
                  type="button"
                  className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-lg text-[10px] font-bold bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30 hover:bg-amber-500/25 transition-all cursor-pointer shadow-2xs"
                  title={t('groups.parentContacts', 'Ota-onasi raqamlari')}
                >
                  <Users className="w-2.5 h-2.5 text-amber-600 dark:text-amber-400 shrink-0" />
                  <span>{t('groups.parents', 'Ota-onasi')}</span>
                  <ChevronDown className="w-2.5 h-2.5 opacity-70 group-hover/parent:rotate-180 transition-transform" />
                </button>

                {/* Floating Popover on Hover */}
                <div className="invisible group-hover/parent:visible opacity-0 group-hover/parent:opacity-100 transition-all duration-200 pointer-events-none group-hover/parent:pointer-events-auto absolute left-0 top-full mt-1.5 w-64 p-3 rounded-2xl bg-white dark:bg-[#1a2332] shadow-2xl border border-gray-200 dark:border-gray-700 z-50 text-left">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-400 mb-2 pb-1.5 border-b border-gray-100 dark:border-gray-700/60 flex items-center justify-between">
                    <span>{t('groups.parentContacts', 'Ota-onasi raqamlari')}</span>
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-bold">
                      Aloqa
                    </span>
                  </div>
                  <div className="space-y-1.5">
                    {row.father_phone && (
                      <a
                        href={`tel:${row.father_phone}`}
                        className="flex items-center justify-between p-2 rounded-xl bg-indigo-50/70 hover:bg-indigo-100/70 dark:bg-indigo-950/40 dark:hover:bg-indigo-900/50 border border-indigo-200/50 dark:border-indigo-800/50 transition-colors group/call"
                      >
                        <div className="flex flex-col">
                          <span className="text-[10px] font-bold uppercase text-indigo-600 dark:text-indigo-400">
                            {t('groups.father', 'Otasi')}
                          </span>
                          <span className="font-mono text-xs font-bold text-gray-800 dark:text-gray-200">
                            {formatUzPhone(row.father_phone)}
                          </span>
                        </div>
                        <Phone className="w-3.5 h-3.5 text-indigo-500 group-hover/call:scale-110 transition-transform shrink-0" />
                      </a>
                    )}
                    {row.mother_phone && (
                      <a
                        href={`tel:${row.mother_phone}`}
                        className="flex items-center justify-between p-2 rounded-xl bg-rose-50/70 hover:bg-rose-100/70 dark:bg-rose-950/40 dark:hover:bg-rose-900/50 border border-rose-200/50 dark:border-rose-800/50 transition-colors group/call"
                      >
                        <div className="flex flex-col">
                          <span className="text-[10px] font-bold uppercase text-rose-600 dark:text-rose-400">
                            {t('groups.mother', 'Onasi')}
                          </span>
                          <span className="font-mono text-xs font-bold text-gray-800 dark:text-gray-200">
                            {formatUzPhone(row.mother_phone)}
                          </span>
                        </div>
                        <Phone className="w-3.5 h-3.5 text-rose-500 group-hover/call:scale-110 transition-transform shrink-0" />
                      </a>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        );
      },
    },
    {
      header: t('common.status', 'Status'),
      key: 'status',
      className: 'whitespace-nowrap w-[80px]',
      cellClassName: 'whitespace-nowrap w-[80px]',
      render: (row) => (
        <span
          className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-bold transition-all ${
            row.is_active
              ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 ring-1 ring-emerald-500/20'
              : 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30 ring-1 ring-rose-500/20'
          }`}
        >
          <span
            className={`w-1.5 h-1.5 rounded-full ${
              row.is_active ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'
            }`}
          />
          {row.is_active ? t('common.active', 'Faol') : t('common.inactive', 'Nofaol')}
        </span>
      ),
    },
    {
      header: t('common.date', 'Joined'),
      key: 'created_at',
      className: 'whitespace-nowrap w-[85px]',
      cellClassName: 'whitespace-nowrap w-[85px]',
      render: (row) => (
        <span className="text-[11px] text-gray-500 dark:text-gray-400">
          {row.created_at ? new Date(row.created_at).toLocaleDateString() : '—'}
        </span>
      ),
    },
    {
      header: t('common.actions', 'Actions'),
      key: 'actions',
      className: 'text-right rtl:text-left whitespace-nowrap w-[150px] shrink-0',
      cellClassName: 'text-right rtl:text-left whitespace-nowrap w-[150px] shrink-0',
      render: (row) => (
        <div className="flex items-center justify-end gap-1">
          <Button
            variant="ghost"
            size="sm"
            className="!p-1 h-7 w-7 text-blue-600 dark:text-blue-400 hover:bg-blue-500/15 rounded-lg"
            title={t('users.viewProfile', 'Profilni ko‘rish va sozlash')}
            onClick={() => navigate(`/${currentUserRole}/users/profile/${row.id}`)}
          >
            <Eye className="w-3.5 h-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="!p-1 h-7 w-7 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-500/15 rounded-lg"
            title={t('common.edit', 'Tahrirlash')}
            onClick={() => navigate(`/${currentUserRole}/users/edit/${row.id}`)}
          >
            <Edit2 className="w-3.5 h-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="!p-1 h-7 w-7 text-amber-600 dark:text-amber-400 hover:bg-amber-500/15 rounded-lg"
            title={t('auth.resetPassword', 'Parolni tiklash')}
            onClick={() => handleResetPassword(row)}
          >
            <KeyRound className="w-3.5 h-3.5" />
          </Button>
          {row.role !== ROLES.OWNER && (
            <Button
              variant="ghost"
              size="sm"
              className={`!p-1 h-7 w-7 rounded-lg ${
                row.is_active
                  ? 'text-rose-600 dark:text-rose-400 hover:bg-rose-500/15'
                  : 'text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/15'
              }`}
              title={row.is_active ? t('users.suspend', 'Bloklash') : t('users.activate', 'Faollashtirish')}
              onClick={() => handleToggleStatus(row)}
            >
              {row.is_active ? (
                <XCircle className="w-3.5 h-3.5" />
              ) : (
                <CheckCircle className="w-3.5 h-3.5" />
              )}
            </Button>
          )}
          {canDeleteUser(row) && (
            <Button
              variant="ghost"
              size="sm"
              className="!p-1 h-7 w-7 text-rose-600 dark:text-rose-400 hover:bg-rose-500/15 rounded-lg"
              title={t('common.delete', 'O‘chirish')}
              onClick={() => handleDeleteUser(row)}
            >
              <Trash2 className="w-3.5 h-3.5" />
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in pb-24 sm:pb-12">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2.5 flex-wrap">
            <Users className="w-7 h-7 text-brand-navy dark:text-blue-400" />
            <span>{isTeacher ? "Mening o‘quvchilarim" : t('nav.users', 'User Management')}</span>
            <span className="px-3 py-0.5 rounded-full text-xs font-black bg-blue-100 text-blue-800 dark:bg-blue-950/70 dark:text-blue-300 border border-blue-200 dark:border-blue-800/80 shadow-2xs">
              {isTeacher ? `Mening o‘quvchilarim: ${userStats.students} ta` : `Jami: ${userStats.total} ta odam`}
            </span>
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {isTeacher
              ? `Faqat siz dars berayotgan guruhlardagi o‘quvchilar ro‘yxati • `
              : `${t('users.pageSubtitle', 'Manage system accounts, credentials, and access roles')} • `}
            <span className="font-semibold text-emerald-600 dark:text-emerald-400">{userStats.active} faol</span> / <span className="font-semibold text-gray-400">{userStats.inactive} nofaol</span>
          </p>
        </div>

        <div className="grid grid-cols-2 sm:flex sm:items-center gap-2 w-full sm:w-auto [&>*:last-child:nth-child(odd)]:col-span-2">
          <Button
            variant="outline"
            size="md"
            icon={Download}
            onClick={handleExportExcel}
            className="w-full sm:w-auto justify-center font-bold text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700 bg-emerald-50/70 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 shadow-xs px-2.5 sm:px-4 text-xs sm:text-sm"
            title={isTeacher ? "Guruhlaringizdagi barcha o‘quvchilarni Excel formatida yuklab olish" : "Barcha foydalanuvchilar va xodimlar bazasini Excel formatida yuklab olish"}
          >
            <span className="hidden sm:inline">{isTeacher ? "O‘quvchilarim bazasi (Excel)" : "Excel Baza yuklab olish"}</span>
            <span className="sm:hidden">Excel</span>
          </Button>

          {isTeacher && (
            <Button
              variant="outline"
              size="md"
              icon={UserPlus}
              className="w-full sm:w-auto justify-center font-bold text-blue-700 dark:text-blue-300 border-blue-300 dark:border-blue-700 bg-blue-50/70 dark:bg-blue-950/40 hover:bg-blue-100 dark:hover:bg-blue-900/40 shadow-xs px-2.5 sm:px-4 text-xs sm:text-sm"
              onClick={() => setIsEnrollExistingModalOpen(true)}
              title="Markazda ro‘yxatdan o‘tgan mavjud o‘quvchini o‘z guruhingizga biriktirish"
            >
              <span className="hidden sm:inline">Mavjud o‘quvchini qo‘shish</span>
              <span className="sm:hidden">Mavjud talaba</span>
            </Button>
          )}

          {!isTeacher && (
            <Button
              variant="outline"
              size="md"
              icon={UserCheck}
              className="border-amber-400/80 text-amber-700 hover:bg-amber-50 dark:border-amber-600/60 dark:text-amber-300 dark:hover:bg-amber-950/40 font-semibold w-full sm:w-auto justify-center px-2.5 sm:px-4 text-xs sm:text-sm shadow-xs"
              onClick={() => navigate(`/${currentUserRole}/users/create?role=${ROLES.TEACHER}`)}
            >
              <span className="hidden sm:inline">{t('users.createTeacher', "O'qituvchi qo'shish")}</span>
              <span className="sm:hidden">O'qituvchi</span>
            </Button>
          )}

          <Button
            variant="primary"
            size="md"
            icon={GraduationCap}
            className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-600/30 ring-1 ring-emerald-400/40 font-semibold w-full sm:w-auto justify-center px-2.5 sm:px-4 text-xs sm:text-sm"
            onClick={() => navigate(`/${currentUserRole}/users/create?role=${ROLES.STUDENT}`)}
          >
            <span className="hidden sm:inline">{isTeacher ? "Yangi o‘quvchi qo‘shish" : t('users.createStudent', "Yangi o'quvchi qo'shish")}</span>
            <span className="sm:hidden">O'quvchi</span>
          </Button>

          {currentUserRole === ROLES.OWNER && (
            <Button
              variant="ghost"
              size="md"
              icon={Shield}
              className="text-purple-700 dark:text-purple-300 hover:bg-purple-100/70 dark:hover:bg-purple-950/50 border border-purple-300/80 dark:border-purple-800/60 bg-purple-50/50 dark:bg-purple-950/20 font-semibold w-full sm:w-auto justify-center px-2.5 sm:px-4 text-xs sm:text-sm shadow-xs"
              onClick={() => navigate(`/${currentUserRole}/users/create?role=${ROLES.ADMIN}`)}
            >
              <span className="hidden sm:inline">{t('users.createAdmin', "Admin qo'shish")}</span>
              <span className="sm:hidden">Admin</span>
            </Button>
          )}
        </div>
      </div>

      {/* Owner Mode Switcher: Standard List vs Live Master Excel Sheet */}
      {currentUserRole === ROLES.OWNER && (
        <div className="flex items-center justify-between gap-3 p-1.5 rounded-2xl bg-gray-100 dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700/80">
          <div className="flex items-center gap-1.5 w-full sm:w-auto">
            <button
              type="button"
              onClick={() => setViewMode('list')}
              className={`flex-1 sm:flex-initial px-3.5 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-black transition-all flex items-center justify-center gap-2 cursor-pointer ${
                viewMode === 'list'
                  ? 'bg-white dark:bg-gray-900 text-gray-900 dark:text-white shadow-xs'
                  : 'text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'
              }`}
            >
              <Users className="w-4 h-4 shrink-0" />
              <span>Standart Ro‘yxat</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('live-sheet')}
              className={`flex-1 sm:flex-initial px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-black transition-all flex items-center justify-center gap-1.5 sm:gap-2 cursor-pointer ${
                viewMode === 'live-sheet'
                  ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md shadow-emerald-700/30 ring-1 ring-emerald-400/40'
                  : 'text-gray-600 hover:text-gray-950 dark:text-gray-300 dark:hover:text-white'
              }`}
            >
              <FileSpreadsheet className="w-4 h-4 shrink-0" />
              <span className="truncate">Jonli Master Excel</span>
              <span
                className={`px-1.5 sm:px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] font-black shrink-0 transition-colors ${
                  viewMode === 'live-sheet'
                    ? 'bg-white text-emerald-950 shadow-xs'
                    : 'bg-black/10 text-gray-950 border border-black/10 dark:bg-white/20 dark:text-white dark:border-white/20'
                }`}
              >
                JONLI
              </span>
            </button>
          </div>
        </div>
      )}

      {currentUserRole === ROLES.OWNER && viewMode === 'live-sheet' ? (
        <OwnerMasterLiveSheet />
      ) : (
        <>
          {/* Quick Role & Population Stats Bar */}
          {isTeacher ? (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-3">
              {/* Teacher's Students */}
              <div className="p-3 sm:p-4 rounded-2xl border text-left bg-emerald-50/80 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-700 shadow-sm ring-2 ring-emerald-500/20 overflow-hidden relative">
                <div className="flex items-start justify-between gap-1.5 sm:gap-2">
                  <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-300 min-w-0 flex-1 leading-snug break-words">
                    Mening o‘quvchilarim
                  </span>
                  <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 flex items-center justify-center shrink-0">
                    <GraduationCap className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  </div>
                </div>
                <div className="mt-2 flex items-baseline gap-1.5 sm:gap-2">
                  <span className="text-xl sm:text-3xl font-black text-emerald-700 dark:text-emerald-300">
                    {userStats.students}
                  </span>
                  <span className="text-[11px] sm:text-xs font-semibold text-emerald-600 dark:text-emerald-400">nafar o‘quvchi</span>
                </div>
                <div className="mt-1 text-[10px] sm:text-[11px] text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5 truncate">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                  <span className="truncate">{userStats.active} faol ta’lim oluvchi</span>
                </div>
              </div>

              {/* Teacher's Groups */}
              <div className="p-3 sm:p-4 rounded-2xl border text-left bg-blue-50/80 dark:bg-blue-950/40 border-blue-300 dark:border-blue-700 shadow-sm ring-2 ring-blue-500/20 overflow-hidden relative">
                <div className="flex items-start justify-between gap-1.5 sm:gap-2">
                  <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-blue-800 dark:text-blue-300 min-w-0 flex-1 leading-snug break-words">
                    Dars berayotgan guruhlarim
                  </span>
                  <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-blue-500/20 text-blue-700 dark:text-blue-300 flex items-center justify-center shrink-0">
                    <Layers className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  </div>
                </div>
                <div className="mt-2 flex items-baseline gap-1.5 sm:gap-2">
                  <span className="text-xl sm:text-3xl font-black text-blue-700 dark:text-blue-300">
                    {teacherGroupsCount || 1}
                  </span>
                  <span className="text-[11px] sm:text-xs font-semibold text-blue-600 dark:text-blue-400">faol guruh</span>
                </div>
                <div className="mt-1 text-[10px] sm:text-[11px] text-blue-600 dark:text-blue-400 truncate">
                  Full Stack guruhi (IT-1.1)
                </div>
              </div>

              {/* Teacher's Subject / Specialty */}
              <div className="p-3 sm:p-4 rounded-2xl border text-left bg-amber-50/80 dark:bg-amber-950/40 border-amber-300 dark:border-amber-700 shadow-sm ring-2 ring-amber-500/20 overflow-hidden relative">
                <div className="flex items-start justify-between gap-1.5 sm:gap-2">
                  <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-amber-800 dark:text-amber-300 min-w-0 flex-1 leading-snug break-words">
                    Fan / Ta’lim yo‘nalishingiz
                  </span>
                  <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-amber-500/20 text-amber-700 dark:text-amber-300 flex items-center justify-center shrink-0">
                    <BookOpen className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  </div>
                </div>
                <div className="mt-2 flex items-baseline gap-1.5 sm:gap-2">
                  <span className="text-lg sm:text-2xl font-black text-amber-800 dark:text-amber-300 truncate">
                    {profile?.specialty || profile?.subject || 'Full Stack'}
                  </span>
                </div>
                <div className="mt-1 text-[10px] sm:text-[11px] text-amber-700 dark:text-amber-400 truncate">
                  Dasturlash va axborot texnologiyalari
                </div>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3">
              {/* Total Users */}
              <button
                type="button"
                onClick={() => {
                  setRoleFilter('all');
                  setSearchParams({});
                  setPage(1);
                }}
                className={`p-3 sm:p-4 rounded-2xl border text-left transition-all cursor-pointer overflow-hidden relative ${
                  roleFilter === 'all'
                    ? 'bg-blue-50/80 dark:bg-blue-950/40 border-blue-300 dark:border-blue-700 shadow-sm ring-2 ring-blue-500/20'
                    : 'bg-white dark:bg-surface-dark-secondary border-gray-200/90 dark:border-gray-800 hover:border-blue-300 dark:hover:border-blue-800/60 shadow-2xs'
                }`}
              >
                <div className="flex items-start justify-between gap-1.5 sm:gap-2">
                  <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 min-w-0 flex-1 leading-snug break-words [overflow-wrap:anywhere] pr-1">
                    Jami foydalanuvchilar
                  </span>
                  <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-blue-500/15 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                    <Users className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  </div>
                </div>
                <div className="mt-2 flex items-baseline gap-1.5 sm:gap-2">
                  <span className="text-xl sm:text-3xl font-black text-gray-900 dark:text-white">
                    {userStats.total}
                  </span>
                  <span className="text-[11px] sm:text-xs font-semibold text-gray-400">odam</span>
                </div>
                <div className="mt-1 text-[10px] sm:text-[11px] text-gray-500 dark:text-gray-400 flex items-center gap-1.5 truncate">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                  <span className="truncate">{userStats.active} faol hisob</span>
                </div>
              </button>

              {/* Students */}
              <button
                type="button"
                onClick={() => {
                  setRoleFilter(ROLES.STUDENT);
                  setSearchParams({ role: ROLES.STUDENT });
                  setPage(1);
                }}
                className={`p-3 sm:p-4 rounded-2xl border text-left transition-all cursor-pointer overflow-hidden relative ${
                  roleFilter === ROLES.STUDENT
                    ? 'bg-emerald-50/80 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-700 shadow-sm ring-2 ring-emerald-500/20'
                    : 'bg-white dark:bg-surface-dark-secondary border-gray-200/90 dark:border-gray-800 hover:border-emerald-300 dark:hover:border-emerald-800/60 shadow-2xs'
                }`}
              >
                <div className="flex items-start justify-between gap-1.5 sm:gap-2">
                  <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 min-w-0 flex-1 leading-snug break-words [overflow-wrap:anywhere] pr-1">
                    O‘quvchilar
                  </span>
                  <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                    <GraduationCap className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  </div>
                </div>
                <div className="mt-2 flex items-baseline gap-1.5 sm:gap-2">
                  <span className="text-xl sm:text-3xl font-black text-emerald-700 dark:text-emerald-300">
                    {userStats.students}
                  </span>
                  <span className="text-[11px] sm:text-xs font-semibold text-gray-400">o‘quvchi</span>
                </div>
                <div className="mt-1 text-[10px] sm:text-[11px] text-gray-500 dark:text-gray-400 truncate">
                  Markaz talabalari
                </div>
              </button>

              {/* Teachers */}
              <button
                type="button"
                onClick={() => {
                  if (isTeacher) return;
                  setRoleFilter(ROLES.TEACHER);
                  setSearchParams({ role: ROLES.TEACHER });
                  setPage(1);
                }}
                disabled={isTeacher}
                className={`p-3 sm:p-4 rounded-2xl border text-left transition-all cursor-pointer overflow-hidden relative ${
                  roleFilter === ROLES.TEACHER
                    ? 'bg-amber-50/80 dark:bg-amber-950/40 border-amber-300 dark:border-amber-700 shadow-sm ring-2 ring-amber-500/20'
                    : 'bg-white dark:bg-surface-dark-secondary border-gray-200/90 dark:border-gray-800 hover:border-amber-300 dark:hover:border-amber-800/60 shadow-2xs'
                } ${isTeacher ? 'opacity-60 cursor-not-allowed' : ''}`}
              >
                <div className="flex items-start justify-between gap-1.5 sm:gap-2">
                  <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 min-w-0 flex-1 leading-snug break-words [overflow-wrap:anywhere] pr-1">
                    Ustozlar (O‘qituvchi)
                  </span>
                  <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                    <UserCheck className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  </div>
                </div>
                <div className="mt-2 flex items-baseline gap-1.5 sm:gap-2">
                  <span className="text-xl sm:text-3xl font-black text-amber-700 dark:text-amber-300">
                    {userStats.teachers}
                  </span>
                  <span className="text-[11px] sm:text-xs font-semibold text-gray-400">ustoz</span>
                </div>
                <div className="mt-1 text-[10px] sm:text-[11px] text-gray-500 dark:text-gray-400 truncate">
                  Dars beruvchi xodimlar
                </div>
              </button>

              {/* Administrator */}
              <button
                type="button"
                onClick={() => {
                  if (isTeacher) return;
                  setRoleFilter(ROLES.ADMIN);
                  setSearchParams({ role: ROLES.ADMIN });
                  setPage(1);
                }}
                disabled={isTeacher}
                className={`p-3 sm:p-4 rounded-2xl border text-left transition-all cursor-pointer overflow-hidden relative ${
                  roleFilter === ROLES.ADMIN
                    ? 'bg-purple-50/80 dark:bg-purple-950/40 border-purple-300 dark:border-purple-700 shadow-sm ring-2 ring-purple-500/20'
                    : 'bg-white dark:bg-surface-dark-secondary border-gray-200/90 dark:border-gray-800 hover:border-purple-300 dark:hover:border-purple-800/60 shadow-2xs'
                } ${isTeacher ? 'opacity-60 cursor-not-allowed' : ''}`}
              >
                <div className="flex items-start justify-between gap-1.5 sm:gap-2">
                  <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 min-w-0 flex-1 leading-snug break-words [overflow-wrap:anywhere] pr-1">
                    Administrator
                  </span>
                  <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-purple-500/15 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
                    <Shield className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  </div>
                </div>
                <div className="mt-2 flex items-baseline gap-1.5 sm:gap-2">
                  <span className="text-xl sm:text-3xl font-black text-purple-700 dark:text-purple-300">
                    {userStats.admins}
                  </span>
                  <span className="text-[11px] sm:text-xs font-semibold text-gray-400">admin</span>
                </div>
                <div className="mt-1 text-[10px] sm:text-[11px] text-gray-500 dark:text-gray-400 truncate">
                  Erkinova Zilola
                </div>
              </button>
            </div>
          )}

          {/* Role Navigation Tabs */}
          <div className="flex items-center gap-1.5 sm:gap-2 border-b border-gray-200 dark:border-gray-800 pb-3 flex-wrap">
        {(() => {
          const tabColorMap = {
            all: {
              active: 'bg-blue-600 dark:bg-emerald-600 text-white shadow-md shadow-blue-600/30 dark:shadow-emerald-600/30 ring-2 ring-blue-400/40 dark:ring-emerald-400/40',
              inactive: 'bg-white dark:bg-surface-dark-secondary text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-surface-dark-tertiary border border-gray-200/80 dark:border-gray-700/60',
            },
            [ROLES.STUDENT]: {
              active: 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30 ring-2 ring-emerald-400/60',
              inactive: 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 border border-emerald-300/80 dark:border-emerald-800/60 hover:bg-emerald-100 dark:hover:bg-emerald-900/40',
            },
            [ROLES.TEACHER]: {
              active: 'bg-amber-600 text-white shadow-md shadow-amber-600/30 ring-2 ring-amber-400/60',
              inactive: 'bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 border border-amber-300/80 dark:border-amber-800/60 hover:bg-amber-100 dark:hover:bg-amber-900/40',
            },
            [ROLES.ADMIN]: {
              active: 'bg-purple-600 text-white shadow-md shadow-purple-600/30 ring-2 ring-purple-300/60',
              inactive: 'bg-purple-50 dark:bg-purple-950/30 text-purple-700 dark:text-purple-400 border border-purple-300/80 dark:border-purple-800/60 hover:bg-purple-100 dark:hover:bg-purple-900/40',
            },
            [ROLES.OWNER]: {
              active: 'bg-rose-600 text-white shadow-md shadow-rose-600/30 ring-2 ring-rose-400/60',
              inactive: 'bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-400 border border-rose-300/80 dark:border-rose-800/60 hover:bg-rose-100 dark:hover:bg-rose-900/40',
            },
          };

          const tabs = isTeacher
            ? [{ key: ROLES.STUDENT, label: t('users.studentsTab', "O'quvchilar"), count: userStats.students, icon: GraduationCap }]
            : [
                { key: 'all', label: t('users.allMembersTab', 'Barcha foydalanuvchilar'), count: userStats.total, icon: Users },
                { key: ROLES.STUDENT, label: t('users.studentsTab', "O'quvchilar"), count: userStats.students, icon: GraduationCap },
                { key: ROLES.TEACHER, label: t('users.teachersTab', "O'qituvchilar"), count: userStats.teachers, icon: UserCheck },
                ...(currentUserRole === ROLES.OWNER || currentUserRole === 'owner' || currentUserRole === ROLES.ADMIN || currentUserRole === 'admin'
                  ? [{ key: ROLES.ADMIN, label: t('users.adminsTab', 'Administrator'), count: userStats.admins, icon: Shield }]
                  : []),
                ...(currentUserRole === ROLES.OWNER || currentUserRole === 'owner'
                  ? [{ key: ROLES.OWNER, label: t('users.ownersTab', 'Rahbar (Owner)'), count: userStats.owners, icon: Shield }]
                  : []),
              ];

          return tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = roleFilter === tab.key;
            const cfg = tabColorMap[tab.key] || tabColorMap.all;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => {
                  setRoleFilter(tab.key);
                  setSearchParams(tab.key === 'all' ? {} : { role: tab.key });
                  setPage(1);
                }}
                className={`
                  flex items-center gap-2 px-3.5 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all shrink-0 cursor-pointer
                  ${isActive ? cfg.active : cfg.inactive}
                `}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span>{tab.label}</span>
                <span
                  className={`ml-1 text-[11px] font-black px-2 py-0.5 rounded-full ${
                    isActive
                      ? 'bg-white/20 text-white'
                      : 'bg-gray-200/80 dark:bg-gray-800 text-gray-700 dark:text-gray-300'
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            );
          });
        })()}
      </div>

      {/* Filter and Search Bar */}
      <Card noPadding>
        <div className={`p-4 grid grid-cols-1 sm:grid-cols-2 ${isTeacher ? 'lg:grid-cols-3' : 'lg:grid-cols-4'} gap-3 items-center`}>
          {/* Search */}
          <div className={isTeacher ? 'lg:col-span-2' : 'lg:col-span-2'}>
            <Input
              icon={Search}
              size="md"
              placeholder={isTeacher ? "O‘quvchini ismi yoki telefoni bo‘yicha qidirish..." : t('users.searchPlaceholder', 'Ism, foydalanuvchi nomi yoki telefon bo‘yicha qidirish...')}
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setSearchQuery(e.target.value);
                setPage(1);
              }}
            />
          </div>

          {/* Role Filter (hidden for teachers) */}
          {!isTeacher && (
            <Select
              value={roleFilter}
              size="md"
              onChange={(e) => {
                setRoleFilter(e.target.value);
                setPage(1);
              }}
              placeholder={t('users.allRoles', 'Barcha rollar')}
              headerTitle={t('users.filterByRole', 'Rol bo‘yicha saralash')}
              icon={Shield}
              options={[
                { value: 'all', label: t('users.allRoles', 'Barcha rollar') },
                ...(currentUserRole === 'owner'
                  ? [
                      { value: ROLES.OWNER, label: t('roles.owner', 'Asoschi (Owner)'), color: '#f59e0b', subtitle: 'Tizim rahbari' },
                    ]
                  : []),
                ...(currentUserRole === 'owner' || currentUserRole === 'admin'
                  ? [
                      { value: ROLES.ADMIN, label: t('roles.admin', 'Administrator'), color: '#8b5cf6', subtitle: 'Markaz ma’muri' },
                    ]
                  : []),
                { value: ROLES.TEACHER, label: t('roles.teacher', 'O‘qituvchi'), color: '#3b82f6', subtitle: 'Pedagog / Ustoz' },
                { value: ROLES.STUDENT, label: t('roles.student', 'O‘quvchi'), color: '#10b981', subtitle: 'Tinglovchi / Talaba' },
              ]}
            />
          )}

          {/* Status Filter */}
          <Select
            value={statusFilter}
            size="md"
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            placeholder={t('users.allStatuses', 'Barcha holatlar')}
            headerTitle={t('common.status', 'Akkaunt holati')}
            icon={CheckCircle}
            options={[
              { value: 'all', label: t('users.allStatuses', 'Barcha holatlar') },
              { value: 'active', label: t('common.active', 'Faol akkauntlar'), color: '#10b981', subtitle: 'Kirish huquqiga ega' },
              { value: 'inactive', label: t('common.inactive', 'Nofaol / Bloklangan'), color: '#ef4444', subtitle: 'Kirish cheklangan' },
            ]}
          />
        </div>

        {/* Population & Result Summary Bar */}
        <div className="px-4 py-2.5 bg-gray-50/80 dark:bg-surface-dark-tertiary border-t border-b border-gray-100 dark:border-gray-800 flex items-center justify-between text-xs text-gray-600 dark:text-gray-400 flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <span className="font-bold text-gray-900 dark:text-gray-100">
              {isTeacher
                ? `${totalCount} ta o‘quvchingiz ko‘rsatilmoqda`
                : `${totalCount} ta foydalanuvchi ko‘rsatilmoqda`}
            </span>
            {search && (
              <span className="text-[11px] text-blue-600 dark:text-blue-400 font-medium">
                («{search}» bo‘yicha)
              </span>
            )}
          </div>
          <span className="text-[11px] text-gray-500 dark:text-gray-400">
            {isTeacher ? (
              <>
                {i18n.language?.startsWith('en')
                  ? 'Total in your groups: '
                  : i18n.language?.startsWith('ru')
                  ? 'Всего в ваших группах: '
                  : 'Guruhlaringizda jami: '}
                <strong className="text-gray-800 dark:text-gray-200">
                  {userStats.students} {i18n.language?.startsWith('en') ? 'students' : i18n.language?.startsWith('ru') ? 'студентов' : 'nafar o‘quvchi'}
                </strong>
              </>
            ) : (
              <>
                {i18n.language?.startsWith('en')
                  ? 'Total in system: '
                  : i18n.language?.startsWith('ru')
                  ? 'Всего в системе: '
                  : 'Jami tizimda: '}
                <strong className="text-gray-800 dark:text-gray-200">
                  {userStats.total} {i18n.language?.startsWith('en') ? '' : i18n.language?.startsWith('ru') ? '' : 'ta'}
                </strong> ({userStats.students} {i18n.language?.startsWith('en') ? 'students' : i18n.language?.startsWith('ru') ? 'студентов' : 'o‘quvchi'}, {userStats.teachers} {i18n.language?.startsWith('en') ? 'teachers' : i18n.language?.startsWith('ru') ? 'учителей' : 'ustoz'}, {userStats.admins} admin{userStats.owners > 0 ? `, ${userStats.owners} ${i18n.language?.startsWith('en') ? 'owner' : i18n.language?.startsWith('ru') ? 'руководитель' : 'rahbar'}` : ''})
              </>
            )}
          </span>
        </div>

        {/* Desktop User Table */}
        <div className="hidden md:block">
          <Table
            dense
            columns={columns}
            data={users}
            isLoading={loading}
            emptyMessage={t('users.noUsersFound', 'No users found matching current filters')}
          />
        </div>

        {/* Mobile User Cards (Zero horizontal scroll) */}
        <div className="block md:hidden">
          {loading ? (
            <div className="py-12 text-center text-gray-500">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-brand-navy"></div>
              <p className="mt-2 text-xs">{t('common.loading', 'Yuklanmoqda...')}</p>
            </div>
          ) : users.length === 0 ? (
            <div className="py-12 text-center text-gray-500">
              <Users className="w-10 h-10 mx-auto mb-2 text-gray-400" />
              <p className="text-sm font-semibold">{t('users.noUsersFound', 'Foydalanuvchilar topilmadi')}</p>
            </div>
          ) : (
            <div className="p-3 space-y-3">
              {users.map((row) => {
                const initials =
                  `${row.first_name?.[0] || ''}${row.last_name?.[0] || ''}`.toUpperCase() || 'U';
                const avatarSrc = row.avatar_url || row.profiles?.avatar_url;
                const primaryPhone = row.phone || row.father_phone || row.mother_phone || '';

                return (
                  <div
                    key={row.id}
                    className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-surface-dark-secondary p-4 shadow-sm space-y-3 overflow-hidden w-full max-w-full"
                  >
                    {/* Header: Avatar, Name, Role, Status */}
                    <div className="flex items-start justify-between gap-2.5">
                      <div
                        onClick={() => navigate(`/${currentUserRole}/users/profile/${row.id}`)}
                        className="flex items-center gap-3 min-w-0 flex-1 cursor-pointer group"
                        title={t('users.viewProfile', 'Profilni ko‘rish va sozlash')}
                      >
                        <div className={`w-10 h-10 rounded-full bg-gradient-to-tr ${
                          row.role === ROLES.OWNER
                            ? 'from-rose-500 to-red-600'
                            : row.role === ROLES.ADMIN
                            ? 'from-purple-600 to-indigo-600'
                            : row.role === ROLES.TEACHER
                            ? 'from-amber-500 to-orange-600'
                            : 'from-blue-600 to-indigo-600'
                        } text-white font-bold flex items-center justify-center text-xs uppercase shrink-0 overflow-hidden shadow-sm ring-2 ring-gray-100 dark:ring-gray-800 group-hover:scale-105 transition-transform`}>
                          {avatarSrc ? (
                            <img src={avatarSrc} alt={row.fullName} className="w-full h-full object-cover" />
                          ) : (
                            initials
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-bold text-sm text-gray-900 dark:text-gray-100 truncate group-hover:text-blue-600 dark:group-hover:text-emerald-400 transition-colors">
                            {row.fullName}
                          </p>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <RoleBadge role={row.role} user={row} size="sm" />
                          </div>
                        </div>
                      </div>

                      <span
                        className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-bold shrink-0 ${
                          row.is_active
                            ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 ring-1 ring-emerald-500/20'
                            : 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30 ring-1 ring-rose-500/20'
                        }`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${row.is_active ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
                        {row.is_active ? t('common.active', 'Faol') : t('common.inactive', 'Nofaol')}
                      </span>
                    </div>

                    {/* Phones Row (Compact 1-row layout with parents popover) */}
                    <div className="pt-2 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between gap-2 text-xs">
                      {primaryPhone ? (
                        <div className="flex items-center gap-2 font-mono font-bold text-gray-800 dark:text-gray-200 bg-gray-100/80 dark:bg-gray-800/80 px-2 py-1 rounded-lg border border-gray-200 dark:border-gray-700/80 text-[11px]">
                          <Phone className="w-3 h-3 text-emerald-600 dark:text-emerald-400 shrink-0" />
                          <span>{formatUzPhone(primaryPhone)}</span>
                        </div>
                      ) : (
                        <span className="text-gray-400 text-xs">—</span>
                      )}

                      {row.role === 'student' && (row.father_phone || row.mother_phone) && (
                        <div className="relative group/mobileParent inline-block">
                          <button
                            type="button"
                            className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-bold bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30 shadow-xs cursor-pointer"
                          >
                            <Users className="w-3 h-3 text-amber-600 dark:text-amber-400 shrink-0" />
                            <span>{t('groups.parents', 'Ota-onasi')}</span>
                            <ChevronDown className="w-2.5 h-2.5 opacity-70 group-hover/mobileParent:rotate-180 transition-transform" />
                          </button>

                          {/* Floating Popover on Hover/Focus */}
                          <div className="invisible group-hover/mobileParent:visible opacity-0 group-hover/mobileParent:opacity-100 transition-all duration-200 pointer-events-none group-hover/mobileParent:pointer-events-auto absolute right-0 bottom-full mb-1.5 w-60 p-2.5 rounded-xl bg-white dark:bg-[#1a2332] shadow-2xl border border-gray-200 dark:border-gray-700 z-50 text-left">
                            <div className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1.5 pb-1 border-b border-gray-100 dark:border-gray-700/60">
                              {t('groups.parentContacts', 'Ota-onasi raqamlari')}
                            </div>
                            <div className="space-y-1.5">
                              {row.father_phone && (
                                <a
                                  href={`tel:${row.father_phone}`}
                                  className="flex items-center justify-between p-1.5 rounded-lg bg-indigo-50/70 hover:bg-indigo-100 dark:bg-indigo-950/40 dark:hover:bg-indigo-900/50 border border-indigo-200/50 dark:border-indigo-800/50 transition-colors"
                                >
                                  <div>
                                    <span className="text-[9px] font-bold uppercase text-indigo-600 dark:text-indigo-400 block">
                                      {t('groups.father', 'Otasi')}
                                    </span>
                                    <span className="font-mono text-xs font-bold text-gray-800 dark:text-gray-200">
                                      {formatUzPhone(row.father_phone)}
                                    </span>
                                  </div>
                                  <Phone className="w-3 h-3 text-indigo-500" />
                                </a>
                              )}
                              {row.mother_phone && (
                                <a
                                  href={`tel:${row.mother_phone}`}
                                  className="flex items-center justify-between p-1.5 rounded-lg bg-rose-50/70 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-900/50 border border-rose-200/50 dark:border-rose-800/50 transition-colors"
                                >
                                  <div>
                                    <span className="text-[9px] font-bold uppercase text-rose-600 dark:text-rose-400 block">
                                      {t('groups.mother', 'Onasi')}
                                    </span>
                                    <span className="font-mono text-xs font-bold text-gray-800 dark:text-gray-200">
                                      {formatUzPhone(row.mother_phone)}
                                    </span>
                                  </div>
                                  <Phone className="w-3 h-3 text-rose-500" />
                                </a>
                              )}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Groups Row for Mobile */}
                    {(() => {
                      const studentGroups = getStudentGroups(row);
                      if (row.role !== 'student' || studentGroups.length === 0) return null;
                      return (
                        <div className="pt-2 border-t border-gray-100 dark:border-gray-800 flex items-center gap-1.5 flex-wrap">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                            Guruhlar:
                          </span>
                          {studentGroups.map((sg) => (
                            <span
                              key={sg.id}
                              onClick={() => navigate(`/${currentUserRole}/users/profile/${row.id}`)}
                              className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[11px] font-bold bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 border border-emerald-500/30 cursor-pointer"
                            >
                              <GraduationCap className="w-3 h-3 text-emerald-600" />
                              <span>{sg.name}</span>
                            </span>
                          ))}
                        </div>
                      );
                    })()}

                    {/* Actions (Structured 2-row layout for mobile: never squished, no text wraps) */}
                    <div className="pt-2.5 border-t border-gray-100 dark:border-gray-800 space-y-2">
                      <div className="grid grid-cols-2 gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          icon={Eye}
                          className="w-full justify-center text-xs py-2 font-medium text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800/60 hover:bg-blue-50 dark:hover:bg-blue-950/40"
                          onClick={() => navigate(`/${currentUserRole}/users/profile/${row.id}`)}
                        >
                          {t('common.view', 'Batafsil')}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          icon={Edit2}
                          className="w-full justify-center text-xs py-2 font-medium text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/60 hover:bg-emerald-50 dark:hover:bg-emerald-950/40"
                          onClick={() => navigate(`/${currentUserRole}/users/edit/${row.id}`)}
                        >
                          {t('common.edit', 'Tahrirlash')}
                        </Button>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <Button
                          variant="ghost"
                          size="sm"
                          icon={KeyRound}
                          className="flex-1 justify-center text-xs py-1.5 font-medium whitespace-nowrap text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/40 border border-amber-200/80 dark:border-amber-800/50"
                          title={t('users.resetPassword', 'Parolni tiklash')}
                          onClick={() => handleResetPassword(row)}
                        >
                          <span>{t('users.resetPasswordShort', 'Parol')}</span>
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className={`flex-1 justify-center px-2 py-1.5 text-xs font-medium whitespace-nowrap rounded-lg border flex items-center gap-1.5 ${
                            row.is_active
                              ? 'text-rose-600 dark:text-rose-400 border-rose-200/80 dark:border-rose-900/50 hover:bg-rose-50 dark:hover:bg-rose-950/40'
                              : 'text-emerald-600 dark:text-emerald-400 border-emerald-200/80 dark:border-emerald-900/50 hover:bg-emerald-50 dark:hover:bg-emerald-950/40'
                          }`}
                          title={row.is_active ? t('users.suspend', 'Bloklash') : t('users.activate', 'Faollashtirish')}
                          onClick={() => handleToggleStatus(row)}
                        >
                          {row.is_active ? <XCircle className="w-3.5 h-3.5 shrink-0" /> : <CheckCircle className="w-3.5 h-3.5 shrink-0" />}
                          <span>{row.is_active ? t('users.suspend', 'Bloklash') : t('users.activate', 'Faol')}</span>
                        </Button>
                        {canDeleteUser(row) && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="!p-2 shrink-0 rounded-lg text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-rose-200/80 dark:border-rose-900/50"
                            title={t('common.delete', 'O‘chirish')}
                            onClick={() => handleDeleteUser(row)}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Pagination Bar */}
        <div className="p-4 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between flex-wrap gap-3 text-xs text-gray-500 dark:text-gray-400">
          <div className="flex items-center gap-2 flex-wrap">
            <span>
              {t('common.showing', 'Ko‘rsatilmoqda')}:{' '}
              <span className="font-semibold text-gray-800 dark:text-gray-200">
                {users.length > 0 ? (page - 1) * pageSize + 1 : 0}
              </span>{' '}
              -{' '}
              <span className="font-semibold text-gray-800 dark:text-gray-200">
                {Math.min(page * pageSize, totalCount)}
              </span>{' '}
              {t('common.of', 'jami')}{' '}
              <span className="font-bold text-gray-900 dark:text-white">{totalCount}</span> ta
            </span>
            <span className="hidden sm:inline-block px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200/60 dark:border-blue-800/60">
              Har sahifada 50 ta
            </span>
          </div>

          <div className="flex items-center gap-1 sm:gap-1.5 flex-wrap">
            <button
              type="button"
              disabled={page <= 1 || loading}
              onClick={() => setPage((p) => Math.max(p - 1, 1))}
              className="h-8 w-8 flex items-center justify-center rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#1a2332] text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-2xs cursor-pointer"
              title="Oldingi sahifa"
            >
              <ChevronLeft className="w-4 h-4 rtl:rotate-180" />
            </button>

            {(() => {
              const total = totalPages || 1;
              const pages = [];
              if (total <= 7) {
                for (let i = 1; i <= total; i++) pages.push(i);
              } else {
                if (page <= 4) {
                  pages.push(1, 2, 3, 4, 5, '...', total);
                } else if (page >= total - 3) {
                  pages.push(1, '...', total - 4, total - 3, total - 2, total - 1, total);
                } else {
                  pages.push(1, '...', page - 1, page, page + 1, '...', total);
                }
              }

              return pages.map((item, idx) => {
                if (item === '...') {
                  return (
                    <span
                      key={`ellipsis-${idx}`}
                      className="h-8 min-w-[28px] px-1 flex items-center justify-center text-xs font-bold text-gray-400 select-none"
                    >
                      •••
                    </span>
                  );
                }
                const isActive = item === page;
                return (
                  <button
                    key={`page-${item}`}
                    type="button"
                    onClick={() => setPage(item)}
                    className={`h-8 min-w-[32px] px-2.5 flex items-center justify-center rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      isActive
                        ? 'bg-brand-navy dark:bg-emerald-600 text-white shadow-xs ring-1 ring-brand-navy/30 dark:ring-emerald-500/40'
                        : 'bg-white dark:bg-[#1a2332] border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 hover:border-gray-300'
                    }`}
                  >
                    {item}
                  </button>
                );
              });
            })()}

            <button
              type="button"
              disabled={page >= totalPages || loading}
              onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
              className="h-8 w-8 flex items-center justify-center rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#1a2332] text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-2xs cursor-pointer"
              title="Keyingi sahifa"
            >
              <ChevronRight className="w-4 h-4 rtl:rotate-180" />
            </button>
          </div>
        </div>
      </Card>
        </>
      )}

      {/* User Create/Edit Modal */}
      {isFormOpen && (
        <UserForm
          isOpen={isFormOpen}
          onClose={() => {
            setIsFormOpen(false);
            setSelectedUser(null);
          }}
          user={selectedUser}
          currentUserRole={currentUserRole}
          defaultRole={formDefaultRole}
          onSuccess={fetchUsers}
        />
      )}

      {/* User Details (Read / View) Modal */}
      <Modal
        isOpen={Boolean(selectedUserForView)}
        onClose={() => setSelectedUserForView(null)}
        title="Foydalanuvchi ma‘lumotlari"
        subtitle="Hisob tafsilotlari, roli va bog‘lanish ma‘lumotlari"
        size="md"
      >
        {selectedUserForView && (
          <div className="space-y-4">
            {/* Header info */}
            <div className="flex items-center gap-3.5 p-4 rounded-2xl bg-gray-50 dark:bg-surface-dark-tertiary border border-gray-100 dark:border-gray-800">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-black text-xl flex items-center justify-center shrink-0 shadow-md">
                {selectedUserForView.avatar_url ? (
                  <img
                    src={selectedUserForView.avatar_url}
                    alt={selectedUserForView.fullName}
                    className="w-full h-full object-cover rounded-2xl"
                  />
                ) : (
                  selectedUserForView.fullName?.charAt(0) || selectedUserForView.first_name?.charAt(0) || 'U'
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-extrabold text-base text-gray-900 dark:text-gray-100">
                    {selectedUserForView.fullName || `${selectedUserForView.first_name || ''} ${selectedUserForView.last_name || ''}`.trim() || selectedUserForView.username}
                  </h3>
                  <RoleBadge role={selectedUserForView.role} user={selectedUserForView} size="sm" />
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 font-mono">
                  Login / Username: @{selectedUserForView.username || selectedUserForView.id}
                </p>
                <div className="flex items-center gap-2 mt-1.5">
                  <Badge variant={selectedUserForView.is_active ? 'success' : 'danger'} size="sm">
                    {selectedUserForView.is_active ? 'Faol hisob' : 'Bloklangan'}
                  </Badge>
                  {selectedUserForView.created_at && (
                    <span className="text-[11px] text-gray-400">
                      Qo‘shilgan: {new Date(selectedUserForView.created_at).toLocaleDateString()}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Contacts card */}
            <div className="space-y-2">
              <p className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                Bog‘lanish ma‘lumotlari:
              </p>
              <div className="p-3.5 rounded-xl border border-gray-100 dark:border-gray-800 bg-gray-50/60 dark:bg-surface-dark-secondary space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-gray-500 dark:text-gray-400">Asosiy telefon raqami:</span>
                  <span className="font-mono font-bold text-gray-900 dark:text-gray-100">
                    {selectedUserForView.phone ? formatUzPhone(selectedUserForView.phone) : 'Kiritilmagan'}
                  </span>
                </div>

                {selectedUserForView.father_phone && (
                  <div className="flex items-center justify-between pt-1 border-t border-gray-200/60 dark:border-gray-700/60">
                    <span className="text-indigo-600 dark:text-indigo-400 font-semibold">Otasi raqami:</span>
                    <span className="font-mono font-bold text-gray-800 dark:text-gray-200">
                      {formatUzPhone(selectedUserForView.father_phone)}
                    </span>
                  </div>
                )}

                {selectedUserForView.mother_phone && (
                  <div className="flex items-center justify-between pt-1 border-t border-gray-200/60 dark:border-gray-700/60">
                    <span className="text-rose-600 dark:text-rose-400 font-semibold">Onasi raqami:</span>
                    <span className="font-mono font-bold text-gray-800 dark:text-gray-200">
                      {formatUzPhone(selectedUserForView.mother_phone)}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Password Display Box */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-amber-900 dark:text-amber-300 flex items-center gap-1.5">
                  <KeyRound className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                  <span>Kabinetga kirish paroli:</span>
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30">
                  Amaldagi parol
                </span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-xl border border-amber-500/30 bg-amber-500/10 dark:bg-amber-500/5">
                <span className="font-mono font-extrabold text-sm text-gray-900 dark:text-gray-100 select-all">
                  {showModalPassword ? (selectedUserForView.password || 'Educo#2026!') : '••••••••••••'}
                </span>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setShowModalPassword(!showModalPassword)}
                    className="p-1.5 rounded-lg text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white hover:bg-white/80 dark:hover:bg-gray-800 transition-colors cursor-pointer"
                    title={showModalPassword ? 'Yashirish' : 'Ko‘rish'}
                  >
                    {showModalPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const pwd = selectedUserForView.password || 'Educo#2026!';
                      navigator.clipboard.writeText(pwd);
                      setCopiedModalPassword(true);
                      toast.success('Parol nusxalandi!');
                      setTimeout(() => setCopiedModalPassword(false), 2000);
                    }}
                    className="p-1.5 rounded-lg text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white hover:bg-white/80 dark:hover:bg-gray-800 transition-colors cursor-pointer"
                    title="Nusxalash"
                  >
                    {copiedModalPassword ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="pt-3 border-t border-gray-100 dark:border-gray-800 flex items-center justify-end gap-2">
              <Button
                variant="outline"
                size="sm"
                icon={Edit2}
                onClick={() => {
                  const uid = selectedUserForView.id;
                  setSelectedUserForView(null);
                  navigate(`/${currentUserRole}/users/edit/${uid}`);
                }}
              >
                Tahrirlash
              </Button>
              <Button
                variant="outline"
                size="sm"
                icon={KeyRound}
                className="text-amber-600 dark:text-amber-400"
                onClick={() => {
                  const u = selectedUserForView;
                  setSelectedUserForView(null);
                  handleResetPassword(u);
                }}
              >
                Parolni tiklash
              </Button>
              {canDeleteUser(selectedUserForView) && (
                <Button
                  variant="danger"
                  size="sm"
                  icon={Trash2}
                  onClick={() => handleDeleteUser(selectedUserForView)}
                >
                  O‘chirish
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedUserForView(null)}
              >
                Yopish
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Teacher: Enroll Existing Center Student Modal */}
      {isTeacher && isEnrollExistingModalOpen && (
        <Modal
          isOpen={isEnrollExistingModalOpen}
          onClose={() => {
            setIsEnrollExistingModalOpen(false);
            setEnrollModalSearch('');
          }}
          title="Mavjud o‘quvchini guruhga qo‘shish"
          subtitle="Markaz o‘quvchilari bazasidan talabani tanlab, o‘z guruhingizga biriktiring"
          size="lg"
        >
          <div className="space-y-4">
            {/* Target Group Selector */}
            <div>
              <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">
                Qaysi guruhingizga qo‘shmoqchisiz:
              </label>
              <select
                value={enrollModalGroupId || (myTeacherGroups[0]?.id || '')}
                onChange={(e) => setEnrollModalGroupId(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-surface-dark-secondary text-sm font-bold text-gray-900 dark:text-white"
              >
                {myTeacherGroups.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.name} ({g.courseName || g.course_name || 'Fan'}) • {g.schedule || g.schedule_time || 'Jadval'}
                  </option>
                ))}
              </select>
            </div>

            {/* Student Search Box */}
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={enrollModalSearch}
                onChange={(e) => setEnrollModalSearch(e.target.value)}
                placeholder="Talaba ismi yoki telefon raqami bo‘yicha qidirish..."
                className="w-full pl-9 pr-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-surface-dark text-sm placeholder-gray-400 focus:outline-hidden focus:border-blue-500"
                autoFocus
              />
            </div>

            {/* Students List */}
            <div className="max-h-[320px] overflow-y-auto space-y-2 pr-1 divide-y divide-gray-100 dark:divide-gray-800">
              {filteredCenterStudents.length === 0 ? (
                <div className="p-4 text-center text-xs text-gray-500 dark:text-gray-400">
                  Mos o‘quvchi topilmadi. Qidiruv so‘zini o‘zgartirib ko‘ring.
                </div>
              ) : (
                filteredCenterStudents.map((st) => {
                  const targetGid = enrollModalGroupId || (myTeacherGroups[0]?.id || '');
                  const currentGids = Array.isArray(st.group_ids) ? st.group_ids : (st.group_id ? [st.group_id] : []);
                  const isAlreadyInGroup = currentGids.includes(targetGid);

                  return (
                    <div key={st.id} className="pt-2 flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <div className="font-bold text-sm text-gray-900 dark:text-white truncate">
                          {st.fullName || `${st.first_name || ''} ${st.last_name || ''}`}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-2 mt-0.5">
                          <span className="font-mono">{formatUzPhone(st.phone)}</span>
                          {currentGids.length > 0 && (
                            <span className="text-[10px] px-1.5 py-0.2 rounded-md bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300">
                              {currentGids.length} ta guruhda
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="shrink-0">
                        {isAlreadyInGroup ? (
                          <span className="text-xs px-2.5 py-1 rounded-lg bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 font-bold border border-emerald-500/30 flex items-center gap-1">
                            <Check className="w-3.5 h-3.5" />
                            <span>Guruhda bor</span>
                          </span>
                        ) : (
                          <Button
                            size="sm"
                            variant="primary"
                            icon={UserPlus}
                            disabled={isEnrollingStudent}
                            onClick={() => handleEnrollExistingStudent(st.id, targetGid, st.fullName || `${st.first_name || ''} ${st.last_name || ''}`)}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs"
                          >
                            Guruhga qo‘shish
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <div className="pt-2 border-t border-gray-100 dark:border-gray-800 flex justify-end">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setIsEnrollExistingModalOpen(false);
                  setEnrollModalSearch('');
                }}
              >
                Yopish
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

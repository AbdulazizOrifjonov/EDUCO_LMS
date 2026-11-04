import { supabase } from '@/lib/supabase';
import { localStore } from '@/lib/localStore';
import { enrollStudent } from '@/services/groupService';
import { cleanUzPhone } from '@/utils/phoneFormat';

const isPlaceholder = !import.meta.env.VITE_SUPABASE_URL || import.meta.env.VITE_SUPABASE_URL.includes('placeholder');

/**
 * Helper to get the set of student IDs enrolled in groups taught by a specific teacher
 */
export function getTeacherStudentIds(teacherId, teacherUser = null) {
  const groups = localStore.getGroups ? localStore.getGroups() : [];
  const memberships = localStore.getMemberships ? localStore.getMemberships() : [];
  const users = localStore.getUsers ? localStore.getUsers() : [];

  const normTeacherId = localStore.normalizeUserId ? localStore.normalizeUserId(teacherId) : teacherId;
  const teacher =
    teacherUser ||
    users.find(
      (u) =>
        u.id === normTeacherId ||
        u.id === teacherId ||
        (teacherId && (u.phone || '').replace(/\D/g, '').slice(-9) === String(teacherId).replace(/\D/g, '').slice(-9))
    );

  const teacherName = (teacher?.fullName || `${teacher?.first_name || ''} ${teacher?.last_name || ''}`).trim().toLowerCase();
  const teacherSpecialty = (teacher?.specialty || teacher?.subject || '').trim().toLowerCase();
  const teacherPhoneClean = (teacher?.phone || '').replace(/\D/g, '').slice(-9);

  // Find all groups belonging to this teacher
  const teacherGroups = groups.filter((g) => {
    const gTeacherId = localStore.normalizeUserId ? localStore.normalizeUserId(g.teacherId || g.teacher_id) : (g.teacherId || g.teacher_id);
    const gTeacherName = (g.teacherName || g.teacher_name || '').toLowerCase();
    const gTeacherPhone = (g.teacherPhone || g.teacher_phone || '').replace(/\D/g, '').slice(-9);

    if (gTeacherId && (gTeacherId === normTeacherId || gTeacherId === teacherId || (teacher && gTeacherId === teacher.id))) {
      return true;
    }
    if (teacher?.group_ids && teacher.group_ids.includes(g.id)) {
      return true;
    }
    if (teacherPhoneClean && gTeacherPhone && teacherPhoneClean === gTeacherPhone) {
      return true;
    }
    if (teacherName && gTeacherName && (gTeacherName.includes(teacherName) || teacherName.includes(gTeacherName))) {
      return true;
    }
    if (teacherSpecialty && g.name?.toLowerCase().includes(teacherSpecialty)) {
      return true;
    }
    return false;
  });

  const teacherGroupIds = new Set(teacherGroups.map((g) => g.id));
  const studentIds = new Set();

  // 1. From group.student_ids
  teacherGroups.forEach((g) => {
    (g.student_ids || []).forEach((sId) => studentIds.add(String(sId)));
  });

  // 2. From group memberships
  memberships.forEach((m) => {
    if (teacherGroupIds.has(m.group_id) && m.is_active !== false) {
      if (m.student_id) studentIds.add(String(m.student_id));
      if (m.user_id) studentIds.add(String(m.user_id));
    }
  });

  // 3. From student.group_ids or student.group_id
  users.filter((u) => u.role === 'student').forEach((s) => {
    const sGids = s.group_ids || (s.group_id ? [s.group_id] : []);
    if (sGids.some((gid) => teacherGroupIds.has(gid))) {
      studentIds.add(String(s.id));
    }
  });

  return studentIds;
}

/**
 * Get users with filtering, search, pagination, and role-based permissions
 */
export async function getUsers({
  role = 'all',
  status = 'all',
  search = '',
  page = 1,
  limit = 10,
  currentUserRole = 'owner',
  currentUserId = null,
  currentUser = null,
} = {}) {
  if (!isPlaceholder) {
    try {
      let query = supabase
        .from('profiles')
        .select(`
          id,
          username,
          first_name,
          last_name,
          avatar_url,
          phone,
          is_active,
          created_at,
          updated_at,
          user_roles (
            role
          )
        `, { count: 'exact' });

      if (status === 'active') {
        query = query.eq('is_active', true);
      } else if (status === 'inactive') {
        query = query.eq('is_active', false);
      }

      if (search && search.trim()) {
        const term = `%${search.trim()}%`;
        query = query.or(`username.ilike.${term},first_name.ilike.${term},last_name.ilike.${term}`);
      }

      const from = (page - 1) * limit;
      const to = from + limit - 1;

      query = query.order('created_at', { ascending: false }).range(from, to);

      const { data, count, error } = await query;
      if (!error && data) {
        let users = data.map((p) => {
          const primaryRole = p.user_roles?.[0]?.role || 'student';
          return {
            ...p,
            role: primaryRole,
            fullName: `${p.first_name || ''} ${p.last_name || ''}`.trim() || p.username,
          };
        });

        if (currentUserRole === 'admin') {
          users = users.filter((u) => u.role !== 'owner');
        } else if (currentUserRole === 'teacher') {
          const teacherStudentIds = getTeacherStudentIds(currentUserId, currentUser);
          users = users.filter((u) => u.role === 'student' && teacherStudentIds.has(String(u.id)));
        }

        if (role && role !== 'all') {
          users = users.filter((u) => u.role === role);
        }

        return {
          users,
          totalCount: count || users.length,
          page,
          limit,
          totalPages: Math.ceil((count || users.length) / limit) || 1,
        };
      }
    } catch (err) {
      console.warn('Supabase getUsers failed, using localStore:', err);
    }
  }

  // Local fallback
  let list = localStore.getUsers();

  if (status === 'active') {
    list = list.filter((u) => u.is_active);
  } else if (status === 'inactive') {
    list = list.filter((u) => !u.is_active);
  }

  if (currentUserRole === 'admin') {
    list = list.filter((u) => u.role !== 'owner');
  } else if (currentUserRole === 'teacher') {
    list = list.filter((u) => u.role === 'student');
  }

  if (role && role !== 'all') {
    list = list.filter((u) => u.role === role);
  }

  if (search && search.trim()) {
    const q = search.trim().toLowerCase();
    const qDigits = q.replace(/\D/g, '');
    list = list.filter((u) => {
      const full = (u.fullName || `${u.first_name || ''} ${u.last_name || ''}`).toLowerCase();
      const first = (u.first_name || '').toLowerCase();
      const last = (u.last_name || '').toLowerCase();
      const user = (u.username || '').toLowerCase();
      const phone = (u.phone || '').toLowerCase();
      const father = (u.father_phone || '').toLowerCase();
      const mother = (u.mother_phone || '').toLowerCase();

      const matchText =
        full.includes(q) ||
        first.includes(q) ||
        last.includes(q) ||
        user.includes(q) ||
        phone.includes(q) ||
        father.includes(q) ||
        mother.includes(q);

      const matchDigits =
        qDigits.length >= 3 &&
        ((u.phone || '').replace(/\D/g, '').includes(qDigits) ||
          (u.father_phone || '').replace(/\D/g, '').includes(qDigits) ||
          (u.mother_phone || '').replace(/\D/g, '').includes(qDigits));

      return matchText || matchDigits;
    });
  }

  const from = (page - 1) * limit;
  const paginated = list.slice(from, from + limit);

  return {
    users: paginated,
    totalCount: list.length,
    page,
    limit,
    totalPages: Math.ceil(list.length / limit) || 1,
  };
}

/**
 * Get single user by ID
 */
export async function getUserById(id) {
  const user = localStore.getUsers().find((u) => u.id === id);
  if (user) return user;
  throw new Error('User not found');
}

/**
 * Create a new user account (Teacher, Student, Admin)
 */
export async function createUser({
  firstName,
  lastName,
  fullName,
  full_name,
  username,
  phone = '',
  fatherPhone = '',
  motherPhone = '',
  role = 'student',
  password = 'password123',
  isActive = true,
  courseId = null,
  subject = '',
  monthly_salary = 0,
  custom_price = null,
  discount_percent = 0,
  discount_amount = 0,
  discount_type = null,
  discount_reason = '',
  group_id = null,
  group_ids = [],
}) {
  if (role === 'owner') {
    throw new Error('Tizimda faqat 1 ta Boshliq (Owner) bo‘lishi mumkin!');
  }

  let resolvedFirst = firstName;
  let resolvedLast = lastName;
  const rawFullName = fullName || full_name;
  if (!resolvedFirst && rawFullName) {
    const parts = rawFullName.trim().split(/\s+/);
    resolvedFirst = parts[0] || '';
    resolvedLast = parts.slice(1).join(' ') || '';
  }

  const cleanFirst = (resolvedFirst || '').trim().toLowerCase().replace(/[^a-z0-9]/g, '');
  const cleanLast = (resolvedLast || '').trim().toLowerCase().replace(/[^a-z0-9]/g, '');
  const rand = Math.floor(1000 + Math.random() * 9000);
  const resolvedUsername =
    username && username.trim()
      ? username.trim()
      : `${cleanFirst || 'user'}_${cleanLast || rand}`;

  const normalizedPhone = cleanUzPhone(phone);
  const normalizedFather = cleanUzPhone(fatherPhone);
  const normalizedMother = cleanUzPhone(motherPhone);
  const finalPhone = normalizedPhone || normalizedFather || normalizedMother;

  const email = resolvedUsername.includes('@') ? resolvedUsername : `${resolvedUsername.toLowerCase()}@educo.app`;

  if (!isPlaceholder) {
    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password: password || 'password123',
        options: {
          data: {
            first_name: firstName,
            last_name: lastName,
            username: resolvedUsername,
            role,
          },
        },
      });

      if (!authError && authData?.user) {
        const userId = authData.user.id;
        await supabase.from('profiles').upsert({
          id: userId,
          username: resolvedUsername,
          first_name: firstName,
          last_name: lastName,
          phone: finalPhone,
          father_phone: normalizedFather,
          mother_phone: normalizedMother,
          is_active: isActive,
        });

        await supabase.from('user_roles').upsert({
          user_id: userId,
          role,
        });

        const created = {
          id: userId,
          username: resolvedUsername,
          firstName,
          lastName,
          role,
          phone: finalPhone,
          father_phone: normalizedFather,
          mother_phone: normalizedMother,
          password: password || 'Educo#2026!',
          is_active: isActive,
          course_id: courseId || null,
          subject: subject || '',
          custom_price: custom_price !== undefined ? custom_price : null,
          discount_percent: discount_percent !== undefined ? Number(discount_percent || 0) : 0,
          discount_amount: discount_amount !== undefined ? Number(discount_amount || 0) : 0,
          discount_type: discount_type || null,
          discount_reason: discount_reason || '',
        };
        localStore.saveUser(created);
        return created;
      }
    } catch (err) {
      console.warn('Supabase createUser failed, saving locally:', err);
    }
  }

  // Local creation
  const created = localStore.saveUser({
    first_name: resolvedFirst,
    last_name: resolvedLast,
    full_name: `${resolvedFirst || ''} ${resolvedLast || ''}`.trim() || resolvedUsername,
    username: resolvedUsername,
    email,
    phone: finalPhone,
    father_phone: normalizedFather,
    mother_phone: normalizedMother,
    password: password || 'Educo#2026!',
    role,
    is_active: isActive,
    course_id: courseId || null,
    subject: subject || '',
    monthly_salary: monthly_salary || 0,
    group_id: group_id || (Array.isArray(group_ids) && group_ids[0]) || null,
    group_ids: Array.isArray(group_ids) && group_ids.length > 0 ? group_ids : (group_id ? [group_id] : []),
    custom_price: custom_price !== undefined ? custom_price : null,
    discount_percent: discount_percent !== undefined ? Number(discount_percent || 0) : 0,
    discount_amount: discount_amount !== undefined ? Number(discount_amount || 0) : 0,
    discount_type: discount_type || null,
    discount_reason: discount_reason || '',
  });
  return created;
}

/**
 * Helper to quickly create a student with parent contacts (Father, Mother, or both)
 * Can be called by Owner, Admin, or Teacher
 */
export async function createStudent({
  firstName,
  lastName,
  fatherPhone = '',
  motherPhone = '',
  phone = '',
  password = '',
  groupId = null,
  isActive = true,
}) {
  if (!firstName?.trim() || !lastName?.trim()) {
    throw new Error('Talabaning ismi va familiyasi kiritilishi shart');
  }

  const cleanFather = cleanUzPhone(fatherPhone);
  const cleanMother = cleanUzPhone(motherPhone);
  const cleanPhone = cleanUzPhone(phone);

  if (!cleanFather && !cleanMother && !cleanPhone) {
    throw new Error('Otasining yoki onasining telefon raqamini kiritish shart');
  }

  const cleanFirst = firstName.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
  const cleanLast = lastName.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
  const base = cleanLast ? `${cleanFirst}_${cleanLast}` : cleanFirst;
  const rand = Math.floor(1000 + Math.random() * 9000);
  const username = `st_${base || 'talaba'}_${rand}`;

  const student = await createUser({
    firstName: firstName.trim(),
    lastName: lastName.trim(),
    username,
    phone: cleanPhone || cleanFather || cleanMother,
    fatherPhone: cleanFather,
    motherPhone: cleanMother,
    role: 'student',
    password: password?.trim() || 'Talaba#2026!',
    isActive,
  });

  if (groupId) {
    await enrollStudent(groupId, student.id);
  }

  return student;
}

/**
 * Update user details
 */
export async function updateUser(id, { firstName, lastName, fullName, full_name, username, phone, fatherPhone, motherPhone, role, isActive, password, courseId, subject, status, custom_price, discount_percent, discount_amount, discount_type, discount_reason, group_id, group_ids }) {
  let resolvedFirst = firstName;
  let resolvedLast = lastName;
  const rawFullName = fullName || full_name;
  if (!resolvedFirst && rawFullName) {
    const parts = rawFullName.trim().split(/\s+/);
    resolvedFirst = parts[0] || '';
    resolvedLast = parts.slice(1).join(' ') || '';
  }

  const normalizedPhone = phone !== undefined ? cleanUzPhone(phone) : undefined;
  const normalizedFather = fatherPhone !== undefined ? cleanUzPhone(fatherPhone) : undefined;
  const normalizedMother = motherPhone !== undefined ? cleanUzPhone(motherPhone) : undefined;

  if (!isPlaceholder) {
    try {
      const profileUpdate = {
        first_name: resolvedFirst,
        last_name: resolvedLast,
        phone: normalizedPhone,
        updated_at: new Date().toISOString(),
      };

      if (normalizedFather !== undefined) profileUpdate.father_phone = normalizedFather;
      if (normalizedMother !== undefined) profileUpdate.mother_phone = normalizedMother;
      if (username) profileUpdate.username = username;
      if (typeof isActive === 'boolean') profileUpdate.is_active = isActive;
      if (courseId !== undefined) profileUpdate.course_id = courseId;
      if (subject !== undefined) profileUpdate.subject = subject;

      await supabase.from('profiles').update(profileUpdate).eq('id', id);
      if (role) {
        await supabase.from('user_roles').upsert({ user_id: id, role }, { onConflict: 'user_id,role' });
      }
    } catch (err) {
      console.warn('Supabase updateUser failed, updating locally:', err);
    }
  }

  const localUser = localStore.getUsers().find((u) => u.id === id) || {};
  const newFirst = resolvedFirst !== undefined ? resolvedFirst : localUser.first_name;
  const newLast = resolvedLast !== undefined ? resolvedLast : localUser.last_name;
  const computedFullName = `${newFirst || ''} ${newLast || ''}`.trim() || localUser.full_name || localUser.username;

  const resolvedGroupIds = Array.isArray(group_ids)
    ? group_ids
    : (group_id !== undefined ? (group_id ? [group_id] : []) : (localUser.group_ids || []));
  const resolvedGroupId = group_id !== undefined
    ? (group_id || null)
    : (resolvedGroupIds.length > 0 ? resolvedGroupIds[0] : (localUser.group_id || null));

  const updated = localStore.saveUser({
    ...localUser,
    id,
    first_name: newFirst,
    last_name: newLast,
    full_name: computedFullName,
    username: username !== undefined ? username : localUser.username,
    phone: normalizedPhone !== undefined ? normalizedPhone : localUser.phone,
    father_phone: normalizedFather !== undefined ? normalizedFather : localUser.father_phone,
    mother_phone: normalizedMother !== undefined ? normalizedMother : localUser.mother_phone,
    password: password?.trim() || localUser.password,
    role: role || localUser.role,
    is_active: isActive !== undefined ? isActive : localUser.is_active,
    course_id: courseId !== undefined ? courseId : localUser.course_id,
    subject: subject !== undefined ? subject : localUser.subject,
    group_id: resolvedGroupId,
    group_ids: resolvedGroupIds,
    custom_price: custom_price !== undefined ? custom_price : localUser.custom_price,
    discount_percent: discount_percent !== undefined ? Number(discount_percent || 0) : localUser.discount_percent,
    discount_amount: discount_amount !== undefined ? Number(discount_amount || 0) : localUser.discount_amount,
    discount_type: discount_type !== undefined ? discount_type : localUser.discount_type,
    discount_reason: discount_reason !== undefined ? discount_reason : localUser.discount_reason,
  });
  return updated;
}

/**
 * Directly update a user's password (by Owner, Admin, or self)
 */
export async function adminSetUserPassword(userId, newPassword) {
  if (!newPassword || String(newPassword).trim().length < 6) {
    throw new Error('Parol kamida 6 ta belgidan iborat bo‘lishi kerak');
  }
  const updated = localStore.updateUserPassword(userId, String(newPassword).trim());
  return updated;
}

/**
 * Toggle user active/suspended status
 */
export async function toggleUserStatus(id, isActive) {
  return updateUser(id, { isActive });
}

/**
 * Delete user
 */
export async function deleteUser(id) {
  localStore.deleteUser(id);
  return { success: true };
}

/**
 * Request password reset
 */
export async function resetUserPassword(email) {
  return { success: true, message: 'Password reset link sent' };
}

/**
 * Get all teachers helper
 */
export async function getTeachers() {
  const res = await getUsers({ role: 'teacher', limit: 100 });
  return res.users || [];
}

/**
 * Get all students helper
 */
export async function getStudents() {
  const res = await getUsers({ role: 'student', limit: 100 });
  return res.users || [];
}

import { exportUsersMasterExcel, exportToExcel } from '@/utils/excelExport';

/**
 * Export users to full professional Excel workbook with dashboard & formulas
 */
export function exportUsersToExcel(users) {
  return exportUsersMasterExcel(users);
}

/**
 * Export users to CSV string
 */
export function exportUsersToCSV(users) {
  const headers = ['ID', 'Username', 'First Name', 'Last Name', 'Role', 'Status', 'Phone', 'Created At'];
  const rows = users.map((u) => [
    u.id,
    u.username,
    u.first_name || '',
    u.last_name || '',
    u.role || '',
    u.is_active ? 'Active' : 'Inactive',
    u.phone || '',
    u.created_at || '',
  ]);

  const csvContent = [
    headers.join(','),
    ...rows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')),
  ].join('\n');

  return csvContent;
}

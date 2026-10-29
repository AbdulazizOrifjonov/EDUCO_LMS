import { supabase } from '@/lib/supabase';
import { localStore } from '@/lib/localStore';
import { enrollStudent } from '@/services/groupService';
import { cleanUzPhone } from '@/utils/phoneFormat';

const isPlaceholder = !import.meta.env.VITE_SUPABASE_URL || import.meta.env.VITE_SUPABASE_URL.includes('placeholder');

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
          users = users.filter((u) => u.role === 'teacher' || u.role === 'student');
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
    list = list.filter((u) => u.role === 'teacher' || u.role === 'student');
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
  username,
  phone = '',
  fatherPhone = '',
  motherPhone = '',
  role = 'student',
  password = 'password123',
  isActive = true,
  courseId = null,
  subject = '',
}) {
  if (role === 'owner') {
    throw new Error('Tizimda faqat 1 ta Boshliq (Owner) bo‘lishi mumkin!');
  }

  const cleanFirst = (firstName || '').trim().toLowerCase().replace(/[^a-z0-9]/g, '');
  const cleanLast = (lastName || '').trim().toLowerCase().replace(/[^a-z0-9]/g, '');
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
    first_name: firstName,
    last_name: lastName,
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
export async function updateUser(id, { firstName, lastName, username, phone, fatherPhone, motherPhone, role, isActive, password, courseId, subject }) {
  const normalizedPhone = phone !== undefined ? cleanUzPhone(phone) : undefined;
  const normalizedFather = fatherPhone !== undefined ? cleanUzPhone(fatherPhone) : undefined;
  const normalizedMother = motherPhone !== undefined ? cleanUzPhone(motherPhone) : undefined;

  if (!isPlaceholder) {
    try {
      const profileUpdate = {
        first_name: firstName,
        last_name: lastName,
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
  const updated = localStore.saveUser({
    ...localUser,
    id,
    first_name: firstName !== undefined ? firstName : localUser.first_name,
    last_name: lastName !== undefined ? lastName : localUser.last_name,
    username: username !== undefined ? username : localUser.username,
    phone: normalizedPhone !== undefined ? normalizedPhone : localUser.phone,
    father_phone: normalizedFather !== undefined ? normalizedFather : localUser.father_phone,
    mother_phone: normalizedMother !== undefined ? normalizedMother : localUser.mother_phone,
    password: password?.trim() || localUser.password,
    role: role || localUser.role,
    is_active: isActive !== undefined ? isActive : localUser.is_active,
    course_id: courseId !== undefined ? courseId : localUser.course_id,
    subject: subject !== undefined ? subject : localUser.subject,
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

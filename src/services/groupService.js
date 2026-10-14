import { supabase } from '@/lib/supabase';
import { localStore } from '@/lib/localStore';

const isPlaceholder = !import.meta.env.VITE_SUPABASE_URL || import.meta.env.VITE_SUPABASE_URL.includes('placeholder');

/**
 * Get all groups with filters
 */
export async function getGroups({
  search = '',
  courseId = 'all',
  teacherId = 'all',
  status = 'all',
  page = 1,
  limit = 20,
} = {}) {
  if (!isPlaceholder) {
    try {
      let query = supabase
        .from('groups')
        .select(`
          id,
          course_id,
          name,
          room,
          capacity,
          status,
          start_date,
          end_date,
          created_at,
          courses (
            id,
            name,
            code,
            color
          ),
          group_memberships (
            id,
            student_id,
            is_active
          ),
          group_teachers (
            id,
            is_primary,
            profiles (
              id,
              first_name,
              last_name,
              username,
              avatar_url
            )
          ),
          lesson_schedules (
            id,
            day_of_week,
            start_time,
            end_time,
            room
          )
        `, { count: 'exact' });

      if (status && status !== 'all') {
        query = query.eq('status', status);
      }

      if (courseId && courseId !== 'all') {
        query = query.eq('course_id', courseId);
      }

      if (search && search.trim()) {
        const term = `%${search.trim()}%`;
        query = query.or(`name.ilike.${term},room.ilike.${term}`);
      }

      const from = (page - 1) * limit;
      const to = from + limit - 1;

      query = query.order('created_at', { ascending: false }).range(from, to);

      const { data, count, error } = await query;
      if (!error && data) {
        let groups = data.map((g) => {
          const activeStudents = (g.group_memberships || []).filter((m) => m.is_active);
          const primaryTeacher = g.group_teachers?.find((t) => t.is_primary)?.profiles ||
            g.group_teachers?.[0]?.profiles || null;

          return {
            ...g,
            courseName: g.courses?.name || 'Unassigned Course',
            courseCode: g.courses?.code || '',
            courseColor: g.courses?.color || '#123D78',
            studentCount: activeStudents.length,
            capacity: g.capacity || 20,
            primaryTeacher: primaryTeacher
              ? {
                  ...primaryTeacher,
                  fullName: `${primaryTeacher.first_name || ''} ${primaryTeacher.last_name || ''}`.trim() || primaryTeacher.username,
                }
              : null,
            schedules: g.lesson_schedules || [],
          };
        });

        if (teacherId && teacherId !== 'all') {
          groups = groups.filter((g) => g.group_teachers?.some((t) => t.profiles?.id === teacherId));
        }

        return {
          groups,
          totalCount: count || groups.length,
          page,
          limit,
          totalPages: Math.ceil((count || groups.length) / limit) || 1,
        };
      }
    } catch (err) {
      console.warn('Supabase getGroups failed, falling back to localStore:', err);
    }
  }

  // Local fallback
  let list = localStore.getGroups();

  if (status && status !== 'all') {
    list = list.filter((g) => g.status === status);
  }

  if (courseId && courseId !== 'all') {
    list = list.filter((g) => g.course_id === courseId);
  }

  if (teacherId && teacherId !== 'all') {
    list = list.filter((g) => g.teacher_id === teacherId);
  }

  if (search && search.trim()) {
    const q = search.trim().toLowerCase();
    list = list.filter((g) => g.name.toLowerCase().includes(q) || (g.room && g.room.toLowerCase().includes(q)));
  }

  const from = (page - 1) * limit;
  const paginated = list.slice(from, from + limit).map((g) => ({
    ...g,
    courseName: g.course_name || 'Frontend React',
    courseColor: '#123D78',
    studentCount: g.enrolled_count || 0,
    primaryTeacher: g.teacher_name ? { fullName: g.teacher_name } : null,
  }));

  return {
    groups: paginated,
    totalCount: list.length,
    page,
    limit,
    totalPages: Math.ceil(list.length / limit) || 1,
  };
}

/**
 * Get detailed group info by ID
 */
export async function getGroupById(id) {
  const groups = localStore.getGroups();
  const found = groups.find((g) => g.id === id);
  if (found) {
    const allUsers = localStore.getUsers();
    let groupStudents = [];
    if (Array.isArray(found.student_ids)) {
      groupStudents = allUsers.filter((u) => found.student_ids.includes(u.id));
    } else {
      groupStudents = allUsers.filter((u) => u.role === 'student').slice(0, found.enrolled_count || 3);
      found.student_ids = groupStudents.map((s) => s.id);
    }
    return {
      ...found,
      courseName: found.course_name || 'Course',
      students: groupStudents,
      teachers: allUsers.filter((u) => u.role === 'teacher').slice(0, 1),
      studentCount: groupStudents.length,
      capacity: found.capacity || 20,
      schedules: [],
    };
  }
  throw new Error('Group not found');
}

/**
 * Create a new group
 */
export async function createGroup({
  name,
  courseId,
  teacherId,
  room,
  capacity = 20,
  status = 'active',
  startDate,
  endDate,
}) {
  const allCourses = localStore.getCourses();
  const allUsers = localStore.getUsers();
  const course = allCourses.find((c) => c.id === courseId);
  const teacher = allUsers.find((u) => u.id === teacherId);

  if (!isPlaceholder) {
    try {
      const { data: newGroup, error } = await supabase
        .from('groups')
        .insert({
          name,
          course_id: courseId,
          room,
          capacity: Number(capacity) || 20,
          status: status || 'active',
          start_date: startDate || null,
          end_date: endDate || null,
        })
        .select()
        .single();

      if (!error && newGroup) {
        if (teacherId && newGroup?.id) {
          await supabase.from('group_teachers').insert({
            group_id: newGroup.id,
            teacher_id: teacherId,
            is_primary: true,
          });
        }
        localStore.saveGroup({
          ...newGroup,
          course_name: course?.name,
          teacher_name: teacher?.fullName,
        });
        return newGroup;
      }
    } catch (err) {
      console.warn('Supabase createGroup failed, saving locally:', err);
    }
  }

  const created = localStore.saveGroup({
    name,
    course_id: courseId,
    course_name: course?.name || 'Standard Course',
    teacher_id: teacherId,
    teacher_name: teacher?.fullName || 'Assigned Teacher',
    room: room || '101-xona',
    capacity: Number(capacity) || 20,
    status: status || 'active',
    enrolled_count: 0,
    start_date: startDate,
    end_date: endDate,
  });

  return created;
}

/**
 * Update an existing group
 */
export async function updateGroup(id, payload) {
  return localStore.saveGroup({ id, ...payload });
}

/**
 * Enroll student into group
 */
export async function enrollStudent(groupId, studentId) {
  const groups = localStore.getGroups();
  const target = groups.find((g) => g.id === groupId);
  if (target) {
    if (!Array.isArray(target.student_ids)) {
      const allStudents = localStore.getUsers().filter((u) => u.role === 'student');
      target.student_ids = allStudents.slice(0, target.enrolled_count || 0).map((u) => u.id);
    }
    if (!target.student_ids.includes(studentId)) {
      target.student_ids.push(studentId);
    }
    target.enrolled_count = target.student_ids.length;
    localStore.saveGroup(target);
  }
  return { success: true };
}

/**
 * Remove student from group
 */
export async function removeStudent(groupId, studentId) {
  const groups = localStore.getGroups();
  const target = groups.find((g) => g.id === groupId);
  if (target) {
    if (!Array.isArray(target.student_ids)) {
      const allStudents = localStore.getUsers().filter((u) => u.role === 'student');
      target.student_ids = allStudents.slice(0, target.enrolled_count || 0).map((u) => u.id);
    }
    target.student_ids = target.student_ids.filter((id) => id !== studentId);
    target.enrolled_count = target.student_ids.length;
    localStore.saveGroup(target);
  }
  return { success: true };
}

/**
 * Transfer student from one group to another
 */
export async function transferStudent(fromGroupId, toGroupId, studentId) {
  await removeStudent(fromGroupId, studentId);
  await enrollStudent(toGroupId, studentId);
  return { success: true };
}

/**
 * Save weekly lesson schedule for group
 */
export async function saveGroupSchedule(groupId, scheduleItems = []) {
  return scheduleItems;
}

/**
 * Delete a group
 */
export async function deleteGroup(id) {
  localStore.deleteGroup(id);
  return { success: true };
}

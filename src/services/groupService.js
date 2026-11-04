import { supabase } from '@/lib/supabase';
import { localStore } from '@/lib/localStore';
import { fileToCompressedDataUrl } from '@/services/settingsService';

const isPlaceholder = !import.meta.env.VITE_SUPABASE_URL || import.meta.env.VITE_SUPABASE_URL.includes('placeholder');

/**
 * Get all groups with filters
 */
export async function getGroups({
  search = '',
  courseId = 'all',
  teacherId = 'all',
  teacherName = '',
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
            courseColor: g.courses?.color || '#064e3b',
            monthly_price: Number(g.monthly_price || g.courses?.monthly_fee || 0),
            avatar_url: g.avatar_url || g.image_url || null,
            image_url: g.image_url || g.avatar_url || null,
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

        if ((teacherId && teacherId !== 'all') || (teacherName && teacherName.trim())) {
          const cleanTName = (teacherName || '').trim().toLowerCase();
          groups = groups.filter((g) => {
            const matchSupabaseGt = (teacherId && teacherId !== 'all') && g.group_teachers?.some((t) => t.profiles?.id === teacherId);
            const matchTeacherId = (teacherId && teacherId !== 'all') && (g.teacher_id === teacherId || g.teacherId === teacherId || g.primaryTeacher?.id === teacherId);
            const gTeacherFullName = (g.primaryTeacher?.fullName || g.teacher_name || g.teacherName || '').trim().toLowerCase();
            const matchName = cleanTName && gTeacherFullName && (gTeacherFullName.includes(cleanTName) || cleanTName.includes(gTeacherFullName));
            return matchSupabaseGt || matchTeacherId || matchName;
          });
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
    const allCourses = localStore.getCourses();
    const targetCourse = allCourses.find((c) => c.id === courseId || c.code === courseId);
    const targetName = (targetCourse?.name || '').trim().toLowerCase();
    const targetCode = (targetCourse?.code || '').trim().toLowerCase();

    list = list.filter((g) => {
      if (g.course_id === courseId || g.courseId === courseId) return true;
      if (targetName) {
        const gCourseName = (g.course_name || g.courseName || '').trim().toLowerCase();
        if (gCourseName && (gCourseName === targetName || gCourseName.startsWith(targetName) || targetName.startsWith(gCourseName))) return true;
        const gName = (g.name || '').trim().toLowerCase();
        if (gName && (gName.startsWith(targetName) || gName.includes(targetName))) return true;
      }
      if (targetCode && g.code && g.code.toLowerCase().startsWith(targetCode.slice(0, 4))) return true;
      return false;
    });
  }

  if ((teacherId && teacherId !== 'all') || (teacherName && teacherName.trim())) {
    const cleanTName = (teacherName || '').trim().toLowerCase();
    list = list.filter((g) => {
      const matchId = (teacherId && teacherId !== 'all') && (g.teacher_id === teacherId || g.teacherId === teacherId || g.primaryTeacher?.id === teacherId);
      const matchGt = Array.isArray(g.group_teachers) && (teacherId && teacherId !== 'all') && g.group_teachers.some(t => (t.teacher_id || t.id || t.profiles?.id) === teacherId);
      const gName = (g.teacher_name || g.teacherName || g.primaryTeacher?.fullName || '').trim().toLowerCase();
      const matchName = cleanTName && gName && (gName.includes(cleanTName) || cleanTName.includes(gName));
      return matchId || matchGt || matchName;
    });
  }

  if (search && search.trim()) {
    const q = search.trim().toLowerCase();
    list = list.filter(
      (g) =>
        (g.name || '').toLowerCase().includes(q) ||
        (g.code || '').toLowerCase().includes(q) ||
        (g.course_name || '').toLowerCase().includes(q) ||
        (g.teacher_name || '').toLowerCase().includes(q) ||
        (g.room && g.room.toLowerCase().includes(q))
    );
  }

  const from = (page - 1) * limit;
  const allSchedules = localStore.getSchedules ? localStore.getSchedules() : [];
  const paginated = list.slice(from, from + limit).map((g) => {
    const grpSchedules = allSchedules.filter((s) => s.group_id === g.id);
    return {
      ...g,
      avatar_url: g.avatar_url || g.image_url || null,
      image_url: g.image_url || g.avatar_url || null,
      courseName: g.course_name || 'Frontend React',
      courseColor: '#064e3b',
      studentCount: g.enrolled_count || 0,
      primaryTeacher: g.teacher_name ? { fullName: g.teacher_name } : null,
      schedules: grpSchedules,
    };
  });

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
    const memberships = localStore.getMemberships ? localStore.getMemberships() : [];
    const groupMemberIds = memberships
      .filter((m) => m.group_id === id && m.is_active !== false)
      .map((m) => localStore.normalizeUserId(m.student_id));

    let groupStudents = [];
    if (Array.isArray(found.student_ids) && found.student_ids.length > 0) {
      groupStudents = allUsers.filter((u) =>
        found.student_ids.includes(u.id) || groupMemberIds.includes(localStore.normalizeUserId(u.id))
      );
    } else if (groupMemberIds.length > 0) {
      groupStudents = allUsers.filter((u) => groupMemberIds.includes(localStore.normalizeUserId(u.id)));
      found.student_ids = groupStudents.map((s) => s.id);
    } else {
      groupStudents = allUsers.filter((u) => u.role === 'student').slice(0, found.enrolled_count || 6);
      found.student_ids = groupStudents.map((s) => s.id);
    }

    const studentMemberships = memberships.filter((m) => m.group_id === id && m.is_active !== false);
    const baseFee = Number(found.monthly_price || 0);

    const enrichedStudents = groupStudents.map((s) => {
      const normId = localStore.normalizeUserId(s.id);
      const mem = studentMemberships.find((m) => localStore.normalizeUserId(m.student_id) === normId);

      let effectiveFee = baseFee;
      let discountLabel = '';

      if (mem?.custom_price != null && mem?.custom_price !== '') {
        effectiveFee = Number(mem.custom_price);
        discountLabel = "Kelishilgan maxsus to'lov";
      } else if (Number(mem?.discount_percent) > 0) {
        const pct = Number(mem.discount_percent);
        const discountVal = Math.round(baseFee * (pct / 100));
        effectiveFee = Math.max(0, baseFee - discountVal);
        discountLabel = `${pct}% chegirma (-${discountVal.toLocaleString()} so'm)`;
      } else if (Number(mem?.discount_amount) > 0) {
        const amt = Number(mem.discount_amount);
        effectiveFee = Math.max(0, baseFee - amt);
        discountLabel = `-${amt.toLocaleString()} so'm chegirma`;
      }

      return {
        ...s,
        membership_id: mem?.id || null,
        custom_price: mem?.custom_price ?? null,
        discount_type: mem?.discount_type || null,
        discount_percent: Number(mem?.discount_percent || 0),
        discount_amount: Number(mem?.discount_amount || 0),
        discount_reason: mem?.discount_reason || '',
        effective_price: effectiveFee,
        discount_label: discountLabel,
      };
    });

    return {
      ...found,
      monthly_price: baseFee,
      avatar_url: found.avatar_url || found.image_url || null,
      image_url: found.image_url || found.avatar_url || null,
      courseName: found.course_name || 'Course',
      students: enrichedStudents,
      teachers: allUsers.filter((u) => u.role === 'teacher').slice(0, 1),
      studentCount: enrichedStudents.length,
      capacity: found.capacity || 20,
      schedules: localStore.getSchedules ? localStore.getSchedules().filter((s) => s.group_id === id) : [],
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
  monthly_price,
  monthlyPrice,
  startDate,
  endDate,
  avatar_url,
  image_url,
}) {
  const allCourses = localStore.getCourses();
  const allUsers = localStore.getUsers();
  const course = allCourses.find((c) => c.id === courseId);
  const teacher = allUsers.find((u) => u.id === teacherId);

  const groupAvatar = avatar_url || image_url || null;
  const price = Number(monthly_price !== undefined ? monthly_price : (monthlyPrice !== undefined ? monthlyPrice : (course?.monthly_fee || 0)));

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
          monthly_price: price,
          start_date: startDate || null,
          end_date: endDate || null,
          avatar_url: groupAvatar,
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
          monthly_price: price,
          avatar_url: groupAvatar,
          image_url: groupAvatar,
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
    monthly_price: price,
    enrolled_count: 0,
    start_date: startDate,
    end_date: endDate,
    avatar_url: groupAvatar,
    image_url: groupAvatar,
  });

  try {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('educo_group_updated', {
          detail: { groupId: created.id, group: created },
        })
      );
    }
  } catch (e) {}

  return created;
}

/**
 * Update an existing group
 */
export async function updateGroup(id, payload) {
  const updated = localStore.saveGroup({ id, ...payload });
  try {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('educo_group_updated', {
          detail: { groupId: id, group: updated },
        })
      );
    }
  } catch (e) {}
  return updated;
}

/**
 * Upload an avatar/picture for a group and update it everywhere.
 * @param {string} groupId 
 * @param {File|null} file - Pass null to remove avatar
 * @returns {Promise<string>}
 */
export async function uploadGroupAvatar(groupId, file) {
  if (!groupId) throw new Error('Group ID is required');
  const avatarUrl = file ? await fileToCompressedDataUrl(file, 320) : '';
  const groups = localStore.getGroups();
  const target = groups.find((g) => g.id === groupId);
  if (target) {
    target.avatar_url = avatarUrl;
    target.image_url = avatarUrl;
    localStore.saveGroup(target);
  }

  if (!isPlaceholder) {
    try {
      await supabase
        .from('groups')
        .update({ avatar_url: avatarUrl })
        .eq('id', groupId);
    } catch (e) {
      console.warn('Supabase group avatar update note:', e);
    }
  }

  try {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('educo_group_updated', {
          detail: { groupId, avatar_url: avatarUrl },
        })
      );
    }
  } catch (e) {}

  return avatarUrl;
}

/**
 * Enroll student into group with optional discount / custom pricing
 */
export async function enrollStudent(groupId, studentId, options = {}) {
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
  if (localStore.saveMembership) {
    localStore.saveMembership({
      id: `mem-${groupId}-${studentId}`,
      group_id: groupId,
      student_id: studentId,
      is_active: true,
      custom_price: options.custom_price !== undefined ? options.custom_price : null,
      discount_type: options.discount_type || null,
      discount_percent: Number(options.discount_percent || 0),
      discount_amount: Number(options.discount_amount || 0),
      discount_reason: options.discount_reason || '',
      enrolled_at: new Date().toISOString(),
    });
  }
  return { success: true };
}

/**
 * Update student's tuition discount or custom price in a group
 */
export async function updateStudentDiscount(groupId, studentId, discountData) {
  const memberships = localStore.getMemberships ? localStore.getMemberships() : [];
  const normalizedStudentId = localStore.normalizeUserId(studentId);
  let mem = memberships.find(
    (m) => m.group_id === groupId && localStore.normalizeUserId(m.student_id) === normalizedStudentId
  );

  const updatedMembership = {
    ...(mem || {}),
    id: mem?.id || `mem-${groupId}-${studentId}`,
    group_id: groupId,
    student_id: studentId,
    is_active: true,
    custom_price: discountData.custom_price !== undefined ? discountData.custom_price : (mem?.custom_price ?? null),
    discount_type: discountData.discount_type !== undefined ? discountData.discount_type : (mem?.discount_type ?? null),
    discount_percent: discountData.discount_percent !== undefined ? Number(discountData.discount_percent || 0) : Number(mem?.discount_percent || 0),
    discount_amount: discountData.discount_amount !== undefined ? Number(discountData.discount_amount || 0) : Number(mem?.discount_amount || 0),
    discount_reason: discountData.discount_reason !== undefined ? discountData.discount_reason : (mem?.discount_reason || ''),
    updated_at: new Date().toISOString(),
  };

  localStore.saveMembership(updatedMembership);

  if (!isPlaceholder) {
    try {
      await supabase
        .from('group_memberships')
        .upsert({
          id: updatedMembership.id,
          group_id: groupId,
          student_id: studentId,
          custom_price: updatedMembership.custom_price,
          discount_percent: updatedMembership.discount_percent,
          discount_amount: updatedMembership.discount_amount,
          discount_reason: updatedMembership.discount_reason,
          is_active: true,
        });
    } catch (e) {
      console.warn('Supabase updateStudentDiscount note:', e);
    }
  }

  try {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('educo_student_discount_updated', {
          detail: { groupId, studentId, membership: updatedMembership },
        })
      );
    }
  } catch (_) {}

  return updatedMembership;
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
  if (localStore.getMemberships) {
    const list = localStore.getMemberships().map((m) => {
      if (m.group_id === groupId && localStore.normalizeUserId(m.student_id) === localStore.normalizeUserId(studentId)) {
        return { ...m, is_active: false };
      }
      return m;
    });
    localStore.setItem('educo_db_memberships', list);
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
 * Helper to generate smart subgroup suggestions
 * e.g., course "Ingliz tili" -> prefix "ENG" -> "ENG-1.1", "ENG-1.2", "ENG-1.3"
 */
export function generateSubgroupSuggestions(courseName = '', existingGroupsCount = 0) {
  const norm = (courseName || '').toLowerCase();
  let prefix = 'GRP';
  if (norm.includes('ingliz') || norm.includes('english')) prefix = 'ENG';
  else if (norm.includes('rus')) prefix = 'RUS';
  else if (norm.includes('matem') || norm.includes('math')) prefix = 'MAT';
  else if (norm.includes('arab') || norm.includes('arabic')) prefix = 'ARB';
  else if (norm.includes('it') || norm.includes('dastur') || norm.includes('frontend') || norm.includes('backend')) prefix = 'IT';
  else if (norm.includes('mental')) prefix = 'MNT';
  else if (norm.includes('shaxmat') || norm.includes('chess')) prefix = 'CHS';
  else if (norm.includes('fizik') || norm.includes('physic')) prefix = 'FIZ';
  else if (norm.includes('kimyo') || norm.includes('chem')) prefix = 'KIM';
  else if (norm.includes('biolog')) prefix = 'BIO';
  else if (courseName && courseName.trim().length >= 3) {
    prefix = courseName.trim().slice(0, 3).toUpperCase();
  }

  const cleanCourse = courseName.trim() || 'Kurs';
  const nextNum = Math.max(1, existingGroupsCount + 1);

  return {
    prefix,
    nextSubgroupCode: `${prefix}-1.${nextNum}`,
    nextSubgroupName: `${cleanCourse} 1.${nextNum} (${prefix}-1.${nextNum})`,
    suggestions: [
      {
        code: `${prefix}-1.1`,
        name: `${cleanCourse} 1.1 (${prefix}-1.1)`,
        label: `${prefix}-1.1`,
      },
      {
        code: `${prefix}-1.2`,
        name: `${cleanCourse} 1.2 (${prefix}-1.2)`,
        label: `${prefix}-1.2`,
      },
      {
        code: `${prefix}-1.3`,
        name: `${cleanCourse} 1.3 (${prefix}-1.3)`,
        label: `${prefix}-1.3`,
      },
      {
        code: `${prefix}-1.4`,
        name: `${cleanCourse} 1.4 (${prefix}-1.4)`,
        label: `${prefix}-1.4`,
      },
      {
        code: `${prefix}-A1`,
        name: `${cleanCourse} (Boshlang‘ich / A1)`,
        label: `A1 (Boshlang‘ich)`,
      },
      {
        code: `${prefix}-B1`,
        name: `${cleanCourse} (O‘rta / B1)`,
        label: `B1 (O‘rta)`,
      },
    ],
  };
}

/**
 * Split an existing group into two (e.g. ENG-1.1 and ENG-1.2)
 * Distributes students between the source group and the newly created second group.
 */
export async function splitGroup({
  sourceGroupId,
  renameSourceGroupTo,
  newGroupName,
  newGroupCode,
  room,
  teacherId,
  capacity,
  studentIdsToMove = [],
}) {
  const groups = localStore.getGroups();
  const sourceGroup = groups.find((g) => g.id === sourceGroupId);
  if (!sourceGroup) {
    throw new Error('Asosiy guruh topilmadi');
  }

  // 1. Rename source group if requested (e.g. "Ingliz tili 1.1 (ENG-1.1)")
  if (renameSourceGroupTo && renameSourceGroupTo.trim()) {
    sourceGroup.name = renameSourceGroupTo.trim();
  }

  // 2. Create the new second group (e.g. "Ingliz tili 1.2 (ENG-1.2)")
  const newGroupId = `grp-${Date.now()}`;
  const allCourses = localStore.getCourses ? localStore.getCourses() : [];
  const allUsers = localStore.getUsers ? localStore.getUsers() : [];
  const course = allCourses.find((c) => c.id === (sourceGroup.course_id || sourceGroup.courseId));
  const teacher = allUsers.find((u) => u.id === (teacherId || sourceGroup.teacher_id || sourceGroup.teacherId));

  const newGroupObj = {
    id: newGroupId,
    name: newGroupName || `${sourceGroup.name} (2-guruh)`,
    code: newGroupCode || `${sourceGroup.code || 'GRP'}.2`,
    course_id: sourceGroup.course_id || sourceGroup.courseId || '',
    courseId: sourceGroup.course_id || sourceGroup.courseId || '',
    course_name: sourceGroup.course_name || sourceGroup.courseName || course?.name || 'Kurs',
    courseName: sourceGroup.course_name || sourceGroup.courseName || course?.name || 'Kurs',
    teacher_id: teacherId || sourceGroup.teacher_id || sourceGroup.teacherId || '',
    teacherId: teacherId || sourceGroup.teacher_id || sourceGroup.teacherId || '',
    teacher_name: teacher?.fullName || (teacher?.first_name ? `${teacher.first_name} ${teacher.last_name || ''}`.trim() : (sourceGroup.teacher_name || '')),
    teacherName: teacher?.fullName || (teacher?.first_name ? `${teacher.first_name} ${teacher.last_name || ''}`.trim() : (sourceGroup.teacher_name || '')),
    room: room || sourceGroup.room || 'Xona 102',
    capacity: Number(capacity || sourceGroup.capacity || 20),
    monthly_price: Number(sourceGroup.monthly_price || 0),
    monthlyPrice: Number(sourceGroup.monthly_price || 0),
    status: 'active',
    student_ids: [],
    enrolled_count: 0,
    avatar_url: sourceGroup.avatar_url || '',
    image_url: sourceGroup.image_url || '',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  // 3. Move selected student IDs from source group to new group
  const moveSet = new Set(studentIdsToMove.map((id) => localStore.normalizeUserId(id)));
  const currentSourceStudentIds = sourceGroup.student_ids || [];

  const remainingSourceIds = [];
  const movedIds = [];

  for (const sId of currentSourceStudentIds) {
    if (moveSet.has(localStore.normalizeUserId(sId))) {
      movedIds.push(sId);
    } else {
      remainingSourceIds.push(sId);
    }
  }

  for (const sId of studentIdsToMove) {
    if (!movedIds.some((id) => localStore.normalizeUserId(id) === localStore.normalizeUserId(sId))) {
      movedIds.push(sId);
    }
  }

  sourceGroup.student_ids = remainingSourceIds;
  sourceGroup.enrolled_count = remainingSourceIds.length;
  newGroupObj.student_ids = movedIds;
  newGroupObj.enrolled_count = movedIds.length;

  localStore.saveGroup(sourceGroup);
  const createdGroup = localStore.saveGroup(newGroupObj);

  // 4. Update student users' group_id and memberships
  const users = localStore.getUsers();
  let usersChanged = false;
  for (const u of users) {
    const norm = localStore.normalizeUserId(u.id);
    if (moveSet.has(norm)) {
      u.group_id = newGroupId;
      u.groupId = newGroupId;
      u.groupName = newGroupObj.name;
      usersChanged = true;
    } else if (u.group_id === sourceGroupId || u.groupId === sourceGroupId) {
      if (renameSourceGroupTo && renameSourceGroupTo.trim()) {
        u.groupName = renameSourceGroupTo.trim();
        usersChanged = true;
      }
    }
  }
  if (usersChanged) {
    localStore.saveUsers(users);
  }

  // 5. Update memberships if exists
  if (localStore.getMemberships) {
    const mems = localStore.getMemberships();
    for (const m of mems) {
      if (m.group_id === sourceGroupId && moveSet.has(localStore.normalizeUserId(m.student_id))) {
        m.group_id = newGroupId;
      }
    }
    localStore.setItem('educo_db_memberships', mems);
  }

  // 6. Broadcast updates
  try {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('educo_group_updated', {
          detail: { groupId: sourceGroupId, group: sourceGroup },
        })
      );
      window.dispatchEvent(
        new CustomEvent('educo_group_updated', {
          detail: { groupId: newGroupId, group: createdGroup },
        })
      );
    }
  } catch (_) {}

  // 7. Auto sync to remote if connected
  try {
    if (typeof window !== 'undefined' && window.educoSyncRemote) {
      window.educoSyncRemote();
    }
  } catch (_) {}

  return {
    success: true,
    sourceGroup,
    newGroup: createdGroup,
    movedCount: movedIds.length,
    remainingCount: remainingSourceIds.length,
  };
}

/**
 * Delete a group
 */
export async function deleteGroup(id) {
  localStore.deleteGroup(id);
  return { success: true };
}

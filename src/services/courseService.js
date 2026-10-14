import { supabase } from '@/lib/supabase';
import { localStore } from '@/lib/localStore';

const isPlaceholder = !import.meta.env.VITE_SUPABASE_URL || import.meta.env.VITE_SUPABASE_URL.includes('placeholder');

/**
 * Get all courses with groups count and filters
 */
export async function getCourses({
  search = '',
  status = 'all',
  page = 1,
  limit = 20,
} = {}) {
  if (!isPlaceholder) {
    try {
      let query = supabase
        .from('courses')
        .select(`
          id,
          name,
          code,
          description,
          monthly_fee,
          color,
          is_active,
          created_at,
          updated_at,
          groups (
            id,
            name,
            status
          )
        `, { count: 'exact' });

      if (status === 'active') {
        query = query.eq('is_active', true);
      } else if (status === 'archived' || status === 'inactive') {
        query = query.eq('is_active', false);
      }

      if (search && search.trim()) {
        const term = `%${search.trim()}%`;
        query = query.or(`name.ilike.${term},code.ilike.${term},description.ilike.${term}`);
      }

      const from = (page - 1) * limit;
      const to = from + limit - 1;

      query = query.order('created_at', { ascending: false }).range(from, to);

      const { data, count, error } = await query;
      if (!error && data) {
        const courses = data.map((c) => ({
          ...c,
          groupsCount: c.groups?.length || 0,
          activeGroupsCount: c.groups?.filter((g) => g.status === 'active').length || 0,
        }));

        return {
          courses,
          totalCount: count || courses.length,
          page,
          limit,
          totalPages: Math.ceil((count || courses.length) / limit) || 1,
        };
      }
    } catch (err) {
      console.warn('Supabase fetch failed, falling back to local storage:', err);
    }
  }

  // Local fallback
  let list = localStore.getCourses();
  if (status === 'active') {
    list = list.filter((c) => c.is_active);
  } else if (status === 'archived' || status === 'inactive') {
    list = list.filter((c) => !c.is_active);
  }

  if (search && search.trim()) {
    const q = search.trim().toLowerCase();
    list = list.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.code.toLowerCase().includes(q) ||
        (c.description && c.description.toLowerCase().includes(q))
    );
  }

  const from = (page - 1) * limit;
  const paginated = list.slice(from, from + limit);

  return {
    courses: paginated,
    totalCount: list.length,
    page,
    limit,
    totalPages: Math.ceil(list.length / limit) || 1,
  };
}

/**
 * Get single course by ID
 */
export async function getCourseById(id) {
  if (!isPlaceholder) {
    try {
      const { data, error } = await supabase
        .from('courses')
        .select(`
          *,
          groups (
            id,
            name,
            status,
            capacity
          )
        `)
        .eq('id', id)
        .single();

      if (!error && data) {
        return {
          ...data,
          groupsCount: data.groups?.length || 0,
        };
      }
    } catch (err) {
      console.warn('Supabase getCourseById failed, falling back:', err);
    }
  }

  const course = localStore.getCourses().find((c) => c.id === id);
  if (!course) throw new Error('Course not found');
  return course;
}

/**
 * Create course
 */
export async function createCourse({
  name,
  code,
  description,
  monthlyFee = 0,
  color = '#123D78',
  isActive = true,
}) {
  if (!isPlaceholder) {
    try {
      const { data, error } = await supabase
        .from('courses')
        .insert({
          name,
          code: code || `CRS-${Math.floor(1000 + Math.random() * 9000)}`,
          description,
          monthly_fee: Number(monthlyFee) || 0,
          color: color || '#123D78',
          is_active: isActive,
        })
        .select()
        .single();

      if (!error && data) {
        // Also save to localStore cache
        localStore.saveCourse(data);
        return data;
      }
    } catch (err) {
      console.warn('Supabase createCourse failed, using localStore:', err);
    }
  }

  // Local creation
  const created = localStore.saveCourse({
    name,
    code,
    description,
    monthly_fee: monthlyFee,
    color,
    is_active: isActive,
  });
  return created;
}

/**
 * Update course
 */
export async function updateCourse(id, {
  name,
  code,
  description,
  monthlyFee,
  color,
  isActive,
}) {
  if (!isPlaceholder) {
    try {
      const payload = {
        updated_at: new Date().toISOString(),
      };
      if (name !== undefined) payload.name = name;
      if (code !== undefined) payload.code = code;
      if (description !== undefined) payload.description = description;
      if (monthlyFee !== undefined) payload.monthly_fee = Number(monthlyFee);
      if (color !== undefined) payload.color = color;
      if (isActive !== undefined) payload.is_active = isActive;

      const { data, error } = await supabase
        .from('courses')
        .update(payload)
        .eq('id', id)
        .select()
        .single();

      if (!error && data) {
        localStore.saveCourse(data);
        return data;
      }
    } catch (err) {
      console.warn('Supabase updateCourse failed, updating locally:', err);
    }
  }

  return localStore.saveCourse({
    id,
    name,
    code,
    description,
    monthly_fee: monthlyFee,
    color,
    is_active: isActive,
  });
}

/**
 * Archive or activate course
 */
export async function archiveCourse(id, isActive = false) {
  return updateCourse(id, { isActive });
}

/**
 * Delete course
 */
export async function deleteCourse(id) {
  if (!isPlaceholder) {
    try {
      const { error } = await supabase
        .from('courses')
        .delete()
        .eq('id', id);

      if (!error) {
        localStore.deleteCourse(id);
        return { success: true };
      }
    } catch (err) {
      console.warn('Supabase deleteCourse failed, deleting locally:', err);
    }
  }

  localStore.deleteCourse(id);
  return { success: true };
}

/**
 * Get distinct learning directions or categories
 */
export async function getLearningDirections() {
  return [
    { id: 'it', name: 'Software & IT', code: 'DEV' },
    { id: 'languages', name: 'Foreign Languages', code: 'LANG' },
    { id: 'design', name: 'Graphic & UI/UX Design', code: 'DSGN' },
    { id: 'business', name: 'Business & Management', code: 'MGMT' },
    { id: 'science', name: 'Mathematics & Science', code: 'SCI' },
  ];
}

import { supabase } from '@/lib/supabase';
import { localStore } from '@/lib/localStore';

const isPlaceholder = !import.meta.env.VITE_SUPABASE_URL || import.meta.env.VITE_SUPABASE_URL.includes('placeholder');

/**
 * Grade color config for 1-5 scale
 */
export const GRADE_COLORS = {
  1: { bg: 'bg-red-100 dark:bg-red-950/60', text: 'text-brand-red dark:text-red-400', border: 'border-red-400', label: '1 - Yomon' },
  2: { bg: 'bg-orange-100 dark:bg-orange-950/60', text: 'text-orange-600 dark:text-orange-400', border: 'border-orange-400', label: '2 - Qoniqarsiz' },
  3: { bg: 'bg-yellow-100 dark:bg-yellow-950/60', text: 'text-yellow-600 dark:text-yellow-400', border: 'border-yellow-400', label: '3 - Qoniqarli' },
  4: { bg: 'bg-blue-100 dark:bg-blue-950/60', text: 'text-brand-navy dark:text-blue-300', border: 'border-blue-400', label: '4 - Yaxshi' },
  5: { bg: 'bg-emerald-100 dark:bg-emerald-950/60', text: 'text-emerald-600 dark:text-emerald-400', border: 'border-emerald-400', label: '5 - A\'lo' },
};

/**
 * Get grades by group
 */
export async function getGradesByGroup(groupId) {
  if (!isPlaceholder) {
    try {
      const { data, error } = await supabase
        .from('grades')
        .select(`
          id,
          lesson_id,
          student_id,
          grade_value,
          feedback,
          created_at,
          updated_at,
          lessons (
            id,
            title,
            lesson_date,
            group_id
          ),
          profiles:student_id (
            id,
            first_name,
            last_name,
            username,
            avatar_url
          )
        `)
        .order('created_at', { ascending: false });

      if (!error && data && data.length > 0) {
        return data.filter((g) => g.lessons?.group_id === groupId || !groupId);
      }
    } catch (err) {
      console.warn('Supabase getGradesByGroup failed, using localStore:', err);
    }
  }

  const grades = localStore.getGrades();
  return grades
    .filter((g) => {
      if (!groupId || groupId === 'all') return true;
      if (g.group_id === groupId) return true;
      if (g.lesson_id && g.lesson_id.includes(groupId)) return true;
      return false;
    })
    .sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
}

/**
 * Get grades for a specific student
 */
export async function getGradesByStudent(studentId) {
  const grades = localStore.getGrades();
  return grades
    .filter((g) => g.student_id === studentId)
    .sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
}

/**
 * Save or record grade (1-5)
 */
export async function saveGrade({
  lessonId,
  groupId = null,
  studentId,
  studentName = '',
  gradeValue,
  topic = '',
  feedback = '',
  gradedBy = null,
}) {
  const numericGrade = Number(gradeValue);
  if (numericGrade < 1 || numericGrade > 5) {
    throw new Error('Grade value must be between 1 and 5');
  }

  // Derive groupId from lessonId if missing (e.g. lsn-grp-1-2026-10-19)
  let resolvedGroupId = groupId;
  if (!resolvedGroupId && lessonId && lessonId.startsWith('lsn-')) {
    const raw = lessonId.replace(/^lsn-/, '');
    const parts = raw.split('-');
    if (parts.length >= 2) {
      resolvedGroupId = `${parts[0]}-${parts[1]}`;
    }
  }

  if (!isPlaceholder) {
    try {
      const { data, error } = await supabase
        .from('grades')
        .upsert({
          lesson_id: lessonId,
          student_id: studentId,
          grade_value: numericGrade,
          feedback: feedback || null,
          graded_by: gradedBy || null,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'lesson_id,student_id' })
        .select()
        .single();

      if (!error && data) {
        localStore.saveGrade({
          ...data,
          group_id: resolvedGroupId,
          student_name: studentName,
          topic: topic || 'Dars mashgʻuloti',
        });
        return data;
      }
    } catch (err) {
      console.warn('Supabase saveGrade failed, saving locally:', err);
    }
  }

  const saved = localStore.saveGrade({
    lesson_id: lessonId,
    group_id: resolvedGroupId,
    student_id: studentId,
    student_name: studentName,
    grade_value: numericGrade,
    topic: topic || 'Dars mashgʻuloti',
    feedback,
    graded_by: gradedBy,
  });
  return saved;
}

/**
 * Delete a grade
 */
/**
 * Delete a grade
 */
export async function deleteGrade(id) {
  if (!isPlaceholder) {
    try {
      await supabase.from('grades').delete().eq('id', id);
    } catch (e) {
      console.warn('Supabase deleteGrade error:', e);
    }
  }
  const grades = localStore.getGrades().filter((g) => g.id !== id);
  localStore.setItem('educo_db_grades', grades);
  localStore.pushToServer({ educo_db_grades: grades }).catch(() => {});
  return { success: true };
}


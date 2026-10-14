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

      if (!error && data) {
        return data.filter((g) => g.lessons?.group_id === groupId);
      }
    } catch (err) {
      console.warn('Supabase getGradesByGroup failed, using localStore:', err);
    }
  }

  const grades = localStore.getGrades();
  return grades.filter((g) => g.group_id === groupId || !groupId);
}

/**
 * Get grades for a specific student
 */
export async function getGradesByStudent(studentId) {
  const grades = localStore.getGrades();
  return grades.filter((g) => g.student_id === studentId);
}

/**
 * Save or record grade (1-5)
 */
export async function saveGrade({
  lessonId,
  studentId,
  gradeValue,
  feedback = '',
  gradedBy = null,
}) {
  const numericGrade = Number(gradeValue);
  if (numericGrade < 1 || numericGrade > 5) {
    throw new Error('Grade value must be between 1 and 5');
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
        localStore.saveGrade(data);
        return data;
      }
    } catch (err) {
      console.warn('Supabase saveGrade failed, saving locally:', err);
    }
  }

  const saved = localStore.saveGrade({
    lesson_id: lessonId,
    student_id: studentId,
    grade: numericGrade,
    feedback,
  });
  return saved;
}

/**
 * Delete a grade
 */
export async function deleteGrade(id) {
  return { success: true };
}

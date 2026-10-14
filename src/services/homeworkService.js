import { supabase } from '@/lib/supabase';

/**
 * Get homework list with submissions count
 */
export async function getHomeworkList({
  groupId = 'all',
  teacherId = 'all',
  studentId = null,
} = {}) {
  try {
    let query = supabase
      .from('homework')
      .select(`
        id,
        group_id,
        lesson_id,
        teacher_id,
        title,
        description,
        due_date,
        max_score,
        attachments,
        created_at,
        groups (
          id,
          name,
          courses (
            id,
            name
          )
        ),
        profiles:teacher_id (
          id,
          first_name,
          last_name,
          username
        ),
        homework_submissions (
          id,
          student_id,
          status,
          score,
          submitted_at
        )
      `)
      .order('due_date', { ascending: false });

    if (groupId && groupId !== 'all') {
      query = query.eq('group_id', groupId);
    }

    if (teacherId && teacherId !== 'all') {
      query = query.eq('teacher_id', teacherId);
    }

    const { data, error } = await query;
    if (error) throw error;

    return (data || []).map((h) => {
      const submissions = h.homework_submissions || [];
      const userSubmission = studentId
        ? submissions.find((s) => s.student_id === studentId)
        : null;

      return {
        ...h,
        groupName: h.groups?.name || 'Group',
        courseName: h.groups?.courses?.name || '',
        teacherName: `${h.profiles?.first_name || ''} ${h.profiles?.last_name || ''}`.trim() || h.profiles?.username,
        submissionsCount: submissions.length,
        userSubmission,
        isPastDue: new Date(h.due_date) < new Date(),
      };
    });
  } catch (err) {
    console.error('Error fetching homework list:', err);
    throw err;
  }
}

/**
 * Get homework details by ID
 */
export async function getHomeworkById(id) {
  try {
    const { data, error } = await supabase
      .from('homework')
      .select(`
        *,
        groups (
          id,
          name,
          courses (
            id,
            name
          )
        ),
        profiles:teacher_id (
          id,
          first_name,
          last_name,
          username
        ),
        homework_submissions (
          id,
          student_id,
          submission_text,
          attachments,
          status,
          score,
          feedback,
          submitted_at,
          graded_at,
          profiles:student_id (
            id,
            first_name,
            last_name,
            username,
            avatar_url
          )
        )
      `)
      .eq('id', id)
      .single();

    if (error) throw error;
    return {
      ...data,
      teacherName: `${data.profiles?.first_name || ''} ${data.profiles?.last_name || ''}`.trim() || data.profiles?.username,
      submissions: data.homework_submissions || [],
    };
  } catch (err) {
    console.error(`Error fetching homework ${id}:`, err);
    throw err;
  }
}

/**
 * Create homework
 */
export async function createHomework({
  groupId,
  lessonId = null,
  teacherId,
  title,
  description,
  dueDate,
  maxScore = 100,
  attachments = [],
}) {
  try {
    const { data, error } = await supabase
      .from('homework')
      .insert({
        group_id: groupId,
        lesson_id: lessonId || null,
        teacher_id: teacherId,
        title,
        description,
        due_date: dueDate,
        max_score: Number(maxScore) || 100,
        attachments: attachments || [],
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (err) {
    console.error('Error creating homework:', err);
    throw err;
  }
}

/**
 * Update homework
 */
export async function updateHomework(id, payload) {
  try {
    const { data, error } = await supabase
      .from('homework')
      .update({
        ...payload,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (err) {
    console.error(`Error updating homework ${id}:`, err);
    throw err;
  }
}

/**
 * Delete homework
 */
export async function deleteHomework(id) {
  try {
    const { error } = await supabase.from('homework').delete().eq('id', id);
    if (error) throw error;
    return { success: true };
  } catch (err) {
    console.error(`Error deleting homework ${id}:`, err);
    throw err;
  }
}

/**
 * Submit homework assignment as a student
 */
export async function submitHomework({
  homeworkId,
  studentId,
  submissionText,
  attachments = [],
}) {
  try {
    const { data, error } = await supabase
      .from('homework_submissions')
      .upsert({
        homework_id: homeworkId,
        student_id: studentId,
        submission_text: submissionText,
        attachments: attachments || [],
        status: 'submitted',
        submitted_at: new Date().toISOString(),
      }, { onConflict: 'homework_id,student_id' })
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (err) {
    console.error('Error submitting homework:', err);
    throw err;
  }
}

/**
 * Grade a student homework submission
 */
export async function gradeHomeworkSubmission({
  submissionId,
  score,
  feedback,
  gradedBy,
}) {
  try {
    const { data, error } = await supabase
      .from('homework_submissions')
      .update({
        score: Number(score),
        feedback,
        status: 'graded',
        graded_by: gradedBy,
        graded_at: new Date().toISOString(),
      })
      .eq('id', submissionId)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (err) {
    console.error(`Error grading submission ${submissionId}:`, err);
    throw err;
  }
}

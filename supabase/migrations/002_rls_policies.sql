-- ==============================================================================
-- EDUCO LMS - 002_rls_policies.sql
-- Row Level Security (RLS) Policies & Auth Helper Functions
-- ==============================================================================

-- ==============================================================================
-- 1. HELPER FUNCTIONS (STABLE, SECURITY DEFINER)
-- ==============================================================================

-- Helper function to get current user's role
CREATE OR REPLACE FUNCTION auth.user_role() RETURNS TEXT AS $$
  SELECT role FROM public.user_roles WHERE user_id = auth.uid() LIMIT 1;
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- Helper function to check if current user is owner
CREATE OR REPLACE FUNCTION auth.is_owner() RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'owner'
  );
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- Helper function to check if current user is admin or owner
CREATE OR REPLACE FUNCTION auth.is_admin_or_owner() RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
  );
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- Helper function to check if current user is teacher
CREATE OR REPLACE FUNCTION auth.is_teacher() RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'teacher'
  );
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- Helper function to check if current user is teacher of a specific group
CREATE OR REPLACE FUNCTION auth.is_teacher_of_group(target_group_id UUID) RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.group_teachers 
    WHERE teacher_id = auth.uid() AND group_id = target_group_id
  );
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- Helper function to check if current user is student of a specific group
CREATE OR REPLACE FUNCTION auth.is_student_of_group(target_group_id UUID) RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.group_memberships 
    WHERE student_id = auth.uid() AND group_id = target_group_id AND is_active = true
  );
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- Helper function to check if user has access to a group (owner, admin, assigned teacher, enrolled student)
CREATE OR REPLACE FUNCTION auth.has_group_access(target_group_id UUID) RETURNS BOOLEAN AS $$
  SELECT (
    auth.is_admin_or_owner() 
    OR auth.is_teacher_of_group(target_group_id) 
    OR auth.is_student_of_group(target_group_id)
  );
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- Helper function to check if teacher teaches a student in any group
CREATE OR REPLACE FUNCTION auth.is_teacher_of_student(target_student_id UUID) RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM public.group_teachers gt
    JOIN public.group_memberships gm ON gm.group_id = gt.group_id
    WHERE gt.teacher_id = auth.uid() 
      AND gm.student_id = target_student_id 
      AND gm.is_active = true
  );
$$ LANGUAGE SQL SECURITY DEFINER STABLE;


-- ==============================================================================
-- 2. ENABLE ROW LEVEL SECURITY ON ALL TABLES
-- ==============================================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_teachers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lesson_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teacher_attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.grades ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.homework ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.homework_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.learning_materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.salary_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.salary_periods ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.salary_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.center_settings ENABLE ROW LEVEL SECURITY;


-- ==============================================================================
-- 3. PROFILES POLICIES
-- Users can read own; Owner/Admin can read all; Teachers can read their students
-- Users can update own non-role fields; Owner/Admin can update all
-- ==============================================================================

DROP POLICY IF EXISTS "profiles_select_policy" ON public.profiles;
CREATE POLICY "profiles_select_policy" ON public.profiles
  FOR SELECT TO authenticated
  USING (
    id = auth.uid() 
    OR auth.is_admin_or_owner() 
    OR auth.is_teacher_of_student(id)
  );

DROP POLICY IF EXISTS "profiles_insert_policy" ON public.profiles;
CREATE POLICY "profiles_insert_policy" ON public.profiles
  FOR INSERT TO authenticated
  WITH CHECK (
    id = auth.uid() 
    OR auth.is_admin_or_owner()
  );

DROP POLICY IF EXISTS "profiles_update_policy" ON public.profiles;
CREATE POLICY "profiles_update_policy" ON public.profiles
  FOR UPDATE TO authenticated
  USING (
    id = auth.uid() 
    OR auth.is_admin_or_owner()
  )
  WITH CHECK (
    id = auth.uid() 
    OR auth.is_admin_or_owner()
  );

DROP POLICY IF EXISTS "profiles_delete_policy" ON public.profiles;
CREATE POLICY "profiles_delete_policy" ON public.profiles
  FOR DELETE TO authenticated
  USING (auth.is_admin_or_owner());


-- ==============================================================================
-- 4. USER_ROLES POLICIES
-- Owner can CRUD all; Admin can read all, create teacher/student; Users can read own
-- ==============================================================================

DROP POLICY IF EXISTS "user_roles_select_policy" ON public.user_roles;
CREATE POLICY "user_roles_select_policy" ON public.user_roles
  FOR SELECT TO authenticated
  USING (
    user_id = auth.uid() 
    OR auth.is_admin_or_owner()
  );

DROP POLICY IF EXISTS "user_roles_insert_policy" ON public.user_roles;
CREATE POLICY "user_roles_insert_policy" ON public.user_roles
  FOR INSERT TO authenticated
  WITH CHECK (
    auth.is_owner() 
    OR (auth.is_admin_or_owner() AND role IN ('teacher', 'student'))
  );

DROP POLICY IF EXISTS "user_roles_update_policy" ON public.user_roles;
CREATE POLICY "user_roles_update_policy" ON public.user_roles
  FOR UPDATE TO authenticated
  USING (
    auth.is_owner() 
    OR (auth.is_admin_or_owner() AND role IN ('teacher', 'student'))
  )
  WITH CHECK (
    auth.is_owner() 
    OR (auth.is_admin_or_owner() AND role IN ('teacher', 'student'))
  );

DROP POLICY IF EXISTS "user_roles_delete_policy" ON public.user_roles;
CREATE POLICY "user_roles_delete_policy" ON public.user_roles
  FOR DELETE TO authenticated
  USING (
    auth.is_owner() 
    OR (auth.is_admin_or_owner() AND role IN ('teacher', 'student'))
  );


-- ==============================================================================
-- 5. COURSES POLICIES
-- Owner/Admin can CRUD; Teacher/Student can read
-- ==============================================================================

DROP POLICY IF EXISTS "courses_select_policy" ON public.courses;
CREATE POLICY "courses_select_policy" ON public.courses
  FOR SELECT TO authenticated
  USING (true);

DROP POLICY IF EXISTS "courses_insert_policy" ON public.courses;
CREATE POLICY "courses_insert_policy" ON public.courses
  FOR INSERT TO authenticated
  WITH CHECK (auth.is_admin_or_owner());

DROP POLICY IF EXISTS "courses_update_policy" ON public.courses;
CREATE POLICY "courses_update_policy" ON public.courses
  FOR UPDATE TO authenticated
  USING (auth.is_admin_or_owner())
  WITH CHECK (auth.is_admin_or_owner());

DROP POLICY IF EXISTS "courses_delete_policy" ON public.courses;
CREATE POLICY "courses_delete_policy" ON public.courses
  FOR DELETE TO authenticated
  USING (auth.is_admin_or_owner());


-- ==============================================================================
-- 6. GROUPS POLICIES
-- Owner/Admin can CRUD; Teacher can read assigned; Student can read enrolled
-- ==============================================================================

DROP POLICY IF EXISTS "groups_select_policy" ON public.groups;
CREATE POLICY "groups_select_policy" ON public.groups
  FOR SELECT TO authenticated
  USING (
    auth.is_admin_or_owner() 
    OR auth.is_teacher_of_group(id) 
    OR auth.is_student_of_group(id)
  );

DROP POLICY IF EXISTS "groups_insert_policy" ON public.groups;
CREATE POLICY "groups_insert_policy" ON public.groups
  FOR INSERT TO authenticated
  WITH CHECK (auth.is_admin_or_owner());

DROP POLICY IF EXISTS "groups_update_policy" ON public.groups;
CREATE POLICY "groups_update_policy" ON public.groups
  FOR UPDATE TO authenticated
  USING (auth.is_admin_or_owner())
  WITH CHECK (auth.is_admin_or_owner());

DROP POLICY IF EXISTS "groups_delete_policy" ON public.groups;
CREATE POLICY "groups_delete_policy" ON public.groups
  FOR DELETE TO authenticated
  USING (auth.is_admin_or_owner());


-- ==============================================================================
-- 7. GROUP_MEMBERSHIPS POLICIES
-- Owner/Admin can CRUD; Teacher can read for assigned groups; Student can read own
-- ==============================================================================

DROP POLICY IF EXISTS "group_memberships_select_policy" ON public.group_memberships;
CREATE POLICY "group_memberships_select_policy" ON public.group_memberships
  FOR SELECT TO authenticated
  USING (
    auth.is_admin_or_owner() 
    OR auth.is_teacher_of_group(group_id) 
    OR student_id = auth.uid()
  );

DROP POLICY IF EXISTS "group_memberships_insert_policy" ON public.group_memberships;
CREATE POLICY "group_memberships_insert_policy" ON public.group_memberships
  FOR INSERT TO authenticated
  WITH CHECK (auth.is_admin_or_owner());

DROP POLICY IF EXISTS "group_memberships_update_policy" ON public.group_memberships;
CREATE POLICY "group_memberships_update_policy" ON public.group_memberships
  FOR UPDATE TO authenticated
  USING (auth.is_admin_or_owner())
  WITH CHECK (auth.is_admin_or_owner());

DROP POLICY IF EXISTS "group_memberships_delete_policy" ON public.group_memberships;
CREATE POLICY "group_memberships_delete_policy" ON public.group_memberships
  FOR DELETE TO authenticated
  USING (auth.is_admin_or_owner());


-- ==============================================================================
-- 8. GROUP_TEACHERS POLICIES
-- Owner/Admin can CRUD; Teacher can read own
-- ==============================================================================

DROP POLICY IF EXISTS "group_teachers_select_policy" ON public.group_teachers;
CREATE POLICY "group_teachers_select_policy" ON public.group_teachers
  FOR SELECT TO authenticated
  USING (
    auth.is_admin_or_owner() 
    OR teacher_id = auth.uid()
  );

DROP POLICY IF EXISTS "group_teachers_insert_policy" ON public.group_teachers;
CREATE POLICY "group_teachers_insert_policy" ON public.group_teachers
  FOR INSERT TO authenticated
  WITH CHECK (auth.is_admin_or_owner());

DROP POLICY IF EXISTS "group_teachers_update_policy" ON public.group_teachers;
CREATE POLICY "group_teachers_update_policy" ON public.group_teachers
  FOR UPDATE TO authenticated
  USING (auth.is_admin_or_owner())
  WITH CHECK (auth.is_admin_or_owner());

DROP POLICY IF EXISTS "group_teachers_delete_policy" ON public.group_teachers;
CREATE POLICY "group_teachers_delete_policy" ON public.group_teachers
  FOR DELETE TO authenticated
  USING (auth.is_admin_or_owner());


-- ==============================================================================
-- 9. LESSON_SCHEDULES POLICIES
-- Owner/Admin can CRUD; Teacher/Student can read for their groups
-- ==============================================================================

DROP POLICY IF EXISTS "lesson_schedules_select_policy" ON public.lesson_schedules;
CREATE POLICY "lesson_schedules_select_policy" ON public.lesson_schedules
  FOR SELECT TO authenticated
  USING (
    auth.is_admin_or_owner() 
    OR auth.is_teacher_of_group(group_id) 
    OR auth.is_student_of_group(group_id)
  );

DROP POLICY IF EXISTS "lesson_schedules_insert_policy" ON public.lesson_schedules;
CREATE POLICY "lesson_schedules_insert_policy" ON public.lesson_schedules
  FOR INSERT TO authenticated
  WITH CHECK (auth.is_admin_or_owner());

DROP POLICY IF EXISTS "lesson_schedules_update_policy" ON public.lesson_schedules;
CREATE POLICY "lesson_schedules_update_policy" ON public.lesson_schedules
  FOR UPDATE TO authenticated
  USING (auth.is_admin_or_owner())
  WITH CHECK (auth.is_admin_or_owner());

DROP POLICY IF EXISTS "lesson_schedules_delete_policy" ON public.lesson_schedules;
CREATE POLICY "lesson_schedules_delete_policy" ON public.lesson_schedules
  FOR DELETE TO authenticated
  USING (auth.is_admin_or_owner());


-- ==============================================================================
-- 10. LESSONS POLICIES
-- Owner/Admin can CRUD; Teacher can CRUD for assigned groups; Student can read for enrolled groups
-- ==============================================================================

DROP POLICY IF EXISTS "lessons_select_policy" ON public.lessons;
CREATE POLICY "lessons_select_policy" ON public.lessons
  FOR SELECT TO authenticated
  USING (
    auth.is_admin_or_owner() 
    OR auth.is_teacher_of_group(group_id) 
    OR auth.is_student_of_group(group_id)
  );

DROP POLICY IF EXISTS "lessons_insert_policy" ON public.lessons;
CREATE POLICY "lessons_insert_policy" ON public.lessons
  FOR INSERT TO authenticated
  WITH CHECK (
    auth.is_admin_or_owner() 
    OR auth.is_teacher_of_group(group_id)
  );

DROP POLICY IF EXISTS "lessons_update_policy" ON public.lessons;
CREATE POLICY "lessons_update_policy" ON public.lessons
  FOR UPDATE TO authenticated
  USING (
    auth.is_admin_or_owner() 
    OR auth.is_teacher_of_group(group_id)
  )
  WITH CHECK (
    auth.is_admin_or_owner() 
    OR auth.is_teacher_of_group(group_id)
  );

DROP POLICY IF EXISTS "lessons_delete_policy" ON public.lessons;
CREATE POLICY "lessons_delete_policy" ON public.lessons
  FOR DELETE TO authenticated
  USING (
    auth.is_admin_or_owner() 
    OR auth.is_teacher_of_group(group_id)
  );


-- ==============================================================================
-- 11. STUDENT_ATTENDANCE POLICIES
-- Owner/Admin can read all; Teacher can CRUD for assigned groups; Student can read own
-- ==============================================================================

DROP POLICY IF EXISTS "student_attendance_select_policy" ON public.student_attendance;
CREATE POLICY "student_attendance_select_policy" ON public.student_attendance
  FOR SELECT TO authenticated
  USING (
    auth.is_admin_or_owner() 
    OR student_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.lessons l 
      WHERE l.id = student_attendance.lesson_id 
        AND auth.is_teacher_of_group(l.group_id)
    )
  );

DROP POLICY IF EXISTS "student_attendance_insert_policy" ON public.student_attendance;
CREATE POLICY "student_attendance_insert_policy" ON public.student_attendance
  FOR INSERT TO authenticated
  WITH CHECK (
    auth.is_admin_or_owner() 
    OR EXISTS (
      SELECT 1 FROM public.lessons l 
      WHERE l.id = student_attendance.lesson_id 
        AND auth.is_teacher_of_group(l.group_id)
    )
  );

DROP POLICY IF EXISTS "student_attendance_update_policy" ON public.student_attendance;
CREATE POLICY "student_attendance_update_policy" ON public.student_attendance
  FOR UPDATE TO authenticated
  USING (
    auth.is_admin_or_owner() 
    OR EXISTS (
      SELECT 1 FROM public.lessons l 
      WHERE l.id = student_attendance.lesson_id 
        AND auth.is_teacher_of_group(l.group_id)
    )
  )
  WITH CHECK (
    auth.is_admin_or_owner() 
    OR EXISTS (
      SELECT 1 FROM public.lessons l 
      WHERE l.id = student_attendance.lesson_id 
        AND auth.is_teacher_of_group(l.group_id)
    )
  );

DROP POLICY IF EXISTS "student_attendance_delete_policy" ON public.student_attendance;
CREATE POLICY "student_attendance_delete_policy" ON public.student_attendance
  FOR DELETE TO authenticated
  USING (
    auth.is_admin_or_owner() 
    OR EXISTS (
      SELECT 1 FROM public.lessons l 
      WHERE l.id = student_attendance.lesson_id 
        AND auth.is_teacher_of_group(l.group_id)
    )
  );


-- ==============================================================================
-- 12. TEACHER_ATTENDANCE POLICIES
-- Owner/Admin can CRUD; Teacher can read/update own
-- ==============================================================================

DROP POLICY IF EXISTS "teacher_attendance_select_policy" ON public.teacher_attendance;
CREATE POLICY "teacher_attendance_select_policy" ON public.teacher_attendance
  FOR SELECT TO authenticated
  USING (
    auth.is_admin_or_owner() 
    OR teacher_id = auth.uid()
  );

DROP POLICY IF EXISTS "teacher_attendance_insert_policy" ON public.teacher_attendance;
CREATE POLICY "teacher_attendance_insert_policy" ON public.teacher_attendance
  FOR INSERT TO authenticated
  WITH CHECK (
    auth.is_admin_or_owner() 
    OR teacher_id = auth.uid()
  );

DROP POLICY IF EXISTS "teacher_attendance_update_policy" ON public.teacher_attendance;
CREATE POLICY "teacher_attendance_update_policy" ON public.teacher_attendance
  FOR UPDATE TO authenticated
  USING (
    auth.is_admin_or_owner() 
    OR teacher_id = auth.uid()
  )
  WITH CHECK (
    auth.is_admin_or_owner() 
    OR teacher_id = auth.uid()
  );

DROP POLICY IF EXISTS "teacher_attendance_delete_policy" ON public.teacher_attendance;
CREATE POLICY "teacher_attendance_delete_policy" ON public.teacher_attendance
  FOR DELETE TO authenticated
  USING (auth.is_admin_or_owner());


-- ==============================================================================
-- 13. GRADES POLICIES
-- Owner/Admin can read all; Teacher can CRUD for assigned groups; Student can read own
-- ==============================================================================

DROP POLICY IF EXISTS "grades_select_policy" ON public.grades;
CREATE POLICY "grades_select_policy" ON public.grades
  FOR SELECT TO authenticated
  USING (
    auth.is_admin_or_owner() 
    OR student_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.lessons l 
      WHERE l.id = grades.lesson_id 
        AND auth.is_teacher_of_group(l.group_id)
    )
  );

DROP POLICY IF EXISTS "grades_insert_policy" ON public.grades;
CREATE POLICY "grades_insert_policy" ON public.grades
  FOR INSERT TO authenticated
  WITH CHECK (
    auth.is_admin_or_owner() 
    OR EXISTS (
      SELECT 1 FROM public.lessons l 
      WHERE l.id = grades.lesson_id 
        AND auth.is_teacher_of_group(l.group_id)
    )
  );

DROP POLICY IF EXISTS "grades_update_policy" ON public.grades;
CREATE POLICY "grades_update_policy" ON public.grades
  FOR UPDATE TO authenticated
  USING (
    auth.is_admin_or_owner() 
    OR EXISTS (
      SELECT 1 FROM public.lessons l 
      WHERE l.id = grades.lesson_id 
        AND auth.is_teacher_of_group(l.group_id)
    )
  )
  WITH CHECK (
    auth.is_admin_or_owner() 
    OR EXISTS (
      SELECT 1 FROM public.lessons l 
      WHERE l.id = grades.lesson_id 
        AND auth.is_teacher_of_group(l.group_id)
    )
  );

DROP POLICY IF EXISTS "grades_delete_policy" ON public.grades;
CREATE POLICY "grades_delete_policy" ON public.grades
  FOR DELETE TO authenticated
  USING (
    auth.is_admin_or_owner() 
    OR EXISTS (
      SELECT 1 FROM public.lessons l 
      WHERE l.id = grades.lesson_id 
        AND auth.is_teacher_of_group(l.group_id)
    )
  );


-- ==============================================================================
-- 14. HOMEWORK POLICIES
-- Owner/Admin can read all; Teacher can CRUD for assigned groups; Student can read for enrolled groups
-- ==============================================================================

DROP POLICY IF EXISTS "homework_select_policy" ON public.homework;
CREATE POLICY "homework_select_policy" ON public.homework
  FOR SELECT TO authenticated
  USING (
    auth.is_admin_or_owner() 
    OR auth.is_teacher_of_group(group_id) 
    OR auth.is_student_of_group(group_id)
  );

DROP POLICY IF EXISTS "homework_insert_policy" ON public.homework;
CREATE POLICY "homework_insert_policy" ON public.homework
  FOR INSERT TO authenticated
  WITH CHECK (
    auth.is_admin_or_owner() 
    OR auth.is_teacher_of_group(group_id)
  );

DROP POLICY IF EXISTS "homework_update_policy" ON public.homework;
CREATE POLICY "homework_update_policy" ON public.homework
  FOR UPDATE TO authenticated
  USING (
    auth.is_admin_or_owner() 
    OR auth.is_teacher_of_group(group_id)
  )
  WITH CHECK (
    auth.is_admin_or_owner() 
    OR auth.is_teacher_of_group(group_id)
  );

DROP POLICY IF EXISTS "homework_delete_policy" ON public.homework;
CREATE POLICY "homework_delete_policy" ON public.homework
  FOR DELETE TO authenticated
  USING (
    auth.is_admin_or_owner() 
    OR auth.is_teacher_of_group(group_id)
  );


-- ==============================================================================
-- 15. HOMEWORK_SUBMISSIONS POLICIES
-- Teacher can read/grade for assigned groups; Student can CRUD own
-- ==============================================================================

DROP POLICY IF EXISTS "homework_submissions_select_policy" ON public.homework_submissions;
CREATE POLICY "homework_submissions_select_policy" ON public.homework_submissions
  FOR SELECT TO authenticated
  USING (
    auth.is_admin_or_owner() 
    OR student_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.homework h 
      WHERE h.id = homework_submissions.homework_id 
        AND auth.is_teacher_of_group(h.group_id)
    )
  );

DROP POLICY IF EXISTS "homework_submissions_insert_policy" ON public.homework_submissions;
CREATE POLICY "homework_submissions_insert_policy" ON public.homework_submissions
  FOR INSERT TO authenticated
  WITH CHECK (
    student_id = auth.uid() 
    OR auth.is_admin_or_owner()
  );

DROP POLICY IF EXISTS "homework_submissions_update_policy" ON public.homework_submissions;
CREATE POLICY "homework_submissions_update_policy" ON public.homework_submissions
  FOR UPDATE TO authenticated
  USING (
    student_id = auth.uid() 
    OR auth.is_admin_or_owner()
    OR EXISTS (
      SELECT 1 FROM public.homework h 
      WHERE h.id = homework_submissions.homework_id 
        AND auth.is_teacher_of_group(h.group_id)
    )
  )
  WITH CHECK (
    student_id = auth.uid() 
    OR auth.is_admin_or_owner()
    OR EXISTS (
      SELECT 1 FROM public.homework h 
      WHERE h.id = homework_submissions.homework_id 
        AND auth.is_teacher_of_group(h.group_id)
    )
  );

DROP POLICY IF EXISTS "homework_submissions_delete_policy" ON public.homework_submissions;
CREATE POLICY "homework_submissions_delete_policy" ON public.homework_submissions
  FOR DELETE TO authenticated
  USING (
    student_id = auth.uid() 
    OR auth.is_admin_or_owner()
  );


-- ==============================================================================
-- 16. LEARNING_MATERIALS POLICIES
-- Owner/Admin can CRUD; Teacher can CRUD for assigned groups; Student can read for enrolled groups
-- ==============================================================================

DROP POLICY IF EXISTS "materials_select_policy" ON public.learning_materials;
CREATE POLICY "materials_select_policy" ON public.learning_materials
  FOR SELECT TO authenticated
  USING (
    auth.is_admin_or_owner() 
    OR is_public = true 
    OR auth.is_teacher_of_group(group_id) 
    OR auth.is_student_of_group(group_id)
  );

DROP POLICY IF EXISTS "materials_insert_policy" ON public.learning_materials;
CREATE POLICY "materials_insert_policy" ON public.learning_materials
  FOR INSERT TO authenticated
  WITH CHECK (
    auth.is_admin_or_owner() 
    OR auth.is_teacher_of_group(group_id)
  );

DROP POLICY IF EXISTS "materials_update_policy" ON public.learning_materials;
CREATE POLICY "materials_update_policy" ON public.learning_materials
  FOR UPDATE TO authenticated
  USING (
    auth.is_admin_or_owner() 
    OR auth.is_teacher_of_group(group_id)
  )
  WITH CHECK (
    auth.is_admin_or_owner() 
    OR auth.is_teacher_of_group(group_id)
  );

DROP POLICY IF EXISTS "materials_delete_policy" ON public.learning_materials;
CREATE POLICY "materials_delete_policy" ON public.learning_materials
  FOR DELETE TO authenticated
  USING (
    auth.is_admin_or_owner() 
    OR auth.is_teacher_of_group(group_id)
  );


-- ==============================================================================
-- 17. ANNOUNCEMENTS POLICIES
-- Owner/Admin can CRUD; Teacher can CRUD for assigned groups; Student can read enrolled
-- ==============================================================================

DROP POLICY IF EXISTS "announcements_select_policy" ON public.announcements;
CREATE POLICY "announcements_select_policy" ON public.announcements
  FOR SELECT TO authenticated
  USING (
    auth.is_admin_or_owner()
    OR (group_id IS NULL AND (target_role IS NULL OR target_role = 'all' OR target_role = auth.user_role()))
    OR (group_id IS NOT NULL AND (auth.is_teacher_of_group(group_id) OR auth.is_student_of_group(group_id)))
  );

DROP POLICY IF EXISTS "announcements_insert_policy" ON public.announcements;
CREATE POLICY "announcements_insert_policy" ON public.announcements
  FOR INSERT TO authenticated
  WITH CHECK (
    auth.is_admin_or_owner() 
    OR (group_id IS NOT NULL AND auth.is_teacher_of_group(group_id))
  );

DROP POLICY IF EXISTS "announcements_update_policy" ON public.announcements;
CREATE POLICY "announcements_update_policy" ON public.announcements
  FOR UPDATE TO authenticated
  USING (
    auth.is_admin_or_owner() 
    OR (group_id IS NOT NULL AND auth.is_teacher_of_group(group_id) AND author_id = auth.uid())
  )
  WITH CHECK (
    auth.is_admin_or_owner() 
    OR (group_id IS NOT NULL AND auth.is_teacher_of_group(group_id) AND author_id = auth.uid())
  );

DROP POLICY IF EXISTS "announcements_delete_policy" ON public.announcements;
CREATE POLICY "announcements_delete_policy" ON public.announcements
  FOR DELETE TO authenticated
  USING (
    auth.is_admin_or_owner() 
    OR (group_id IS NOT NULL AND auth.is_teacher_of_group(group_id) AND author_id = auth.uid())
  );


-- ==============================================================================
-- 18. CHAT_MESSAGES POLICIES
-- Users can read/insert for their groups only
-- ==============================================================================

DROP POLICY IF EXISTS "chat_messages_select_policy" ON public.chat_messages;
CREATE POLICY "chat_messages_select_policy" ON public.chat_messages
  FOR SELECT TO authenticated
  USING (auth.has_group_access(group_id));

DROP POLICY IF EXISTS "chat_messages_insert_policy" ON public.chat_messages;
CREATE POLICY "chat_messages_insert_policy" ON public.chat_messages
  FOR INSERT TO authenticated
  WITH CHECK (
    sender_id = auth.uid() 
    AND auth.has_group_access(group_id)
  );

DROP POLICY IF EXISTS "chat_messages_update_policy" ON public.chat_messages;
CREATE POLICY "chat_messages_update_policy" ON public.chat_messages
  FOR UPDATE TO authenticated
  USING (
    sender_id = auth.uid() 
    OR auth.is_admin_or_owner()
  )
  WITH CHECK (
    sender_id = auth.uid() 
    OR auth.is_admin_or_owner()
  );

DROP POLICY IF EXISTS "chat_messages_delete_policy" ON public.chat_messages;
CREATE POLICY "chat_messages_delete_policy" ON public.chat_messages
  FOR DELETE TO authenticated
  USING (
    sender_id = auth.uid() 
    OR auth.is_admin_or_owner()
  );


-- ==============================================================================
-- 19. CHAT_ATTACHMENTS POLICIES
-- Same access rules as chat_messages
-- ==============================================================================

DROP POLICY IF EXISTS "chat_attachments_select_policy" ON public.chat_attachments;
CREATE POLICY "chat_attachments_select_policy" ON public.chat_attachments
  FOR SELECT TO authenticated
  USING (auth.has_group_access(group_id));

DROP POLICY IF EXISTS "chat_attachments_insert_policy" ON public.chat_attachments;
CREATE POLICY "chat_attachments_insert_policy" ON public.chat_attachments
  FOR INSERT TO authenticated
  WITH CHECK (auth.has_group_access(group_id));

DROP POLICY IF EXISTS "chat_attachments_delete_policy" ON public.chat_attachments;
CREATE POLICY "chat_attachments_delete_policy" ON public.chat_attachments
  FOR DELETE TO authenticated
  USING (
    auth.is_admin_or_owner() 
    OR EXISTS (
      SELECT 1 FROM public.chat_messages cm 
      WHERE cm.id = chat_attachments.message_id 
        AND cm.sender_id = auth.uid()
    )
  );


-- ==============================================================================
-- 20. NOTIFICATIONS POLICIES
-- Users can read/update own only
-- ==============================================================================

DROP POLICY IF EXISTS "notifications_select_policy" ON public.notifications;
CREATE POLICY "notifications_select_policy" ON public.notifications
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "notifications_insert_policy" ON public.notifications;
CREATE POLICY "notifications_insert_policy" ON public.notifications
  FOR INSERT TO authenticated
  WITH CHECK (true); -- Functions and server triggers can notify any user

DROP POLICY IF EXISTS "notifications_update_policy" ON public.notifications;
CREATE POLICY "notifications_update_policy" ON public.notifications
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "notifications_delete_policy" ON public.notifications;
CREATE POLICY "notifications_delete_policy" ON public.notifications
  FOR DELETE TO authenticated
  USING (user_id = auth.uid());


-- ==============================================================================
-- 21. SALARY_RULES POLICIES (Owner ONLY - NO access for admin/teacher/student)
-- ==============================================================================

DROP POLICY IF EXISTS "salary_rules_select_policy" ON public.salary_rules;
CREATE POLICY "salary_rules_select_policy" ON public.salary_rules
  FOR SELECT TO authenticated
  USING (auth.is_owner());

DROP POLICY IF EXISTS "salary_rules_insert_policy" ON public.salary_rules;
CREATE POLICY "salary_rules_insert_policy" ON public.salary_rules
  FOR INSERT TO authenticated
  WITH CHECK (auth.is_owner());

DROP POLICY IF EXISTS "salary_rules_update_policy" ON public.salary_rules;
CREATE POLICY "salary_rules_update_policy" ON public.salary_rules
  FOR UPDATE TO authenticated
  USING (auth.is_owner())
  WITH CHECK (auth.is_owner());

DROP POLICY IF EXISTS "salary_rules_delete_policy" ON public.salary_rules;
CREATE POLICY "salary_rules_delete_policy" ON public.salary_rules
  FOR DELETE TO authenticated
  USING (auth.is_owner());


-- ==============================================================================
-- 22. SALARY_PERIODS POLICIES (Owner ONLY)
-- ==============================================================================

DROP POLICY IF EXISTS "salary_periods_select_policy" ON public.salary_periods;
CREATE POLICY "salary_periods_select_policy" ON public.salary_periods
  FOR SELECT TO authenticated
  USING (auth.is_owner());

DROP POLICY IF EXISTS "salary_periods_insert_policy" ON public.salary_periods;
CREATE POLICY "salary_periods_insert_policy" ON public.salary_periods
  FOR INSERT TO authenticated
  WITH CHECK (auth.is_owner());

DROP POLICY IF EXISTS "salary_periods_update_policy" ON public.salary_periods;
CREATE POLICY "salary_periods_update_policy" ON public.salary_periods
  FOR UPDATE TO authenticated
  USING (auth.is_owner())
  WITH CHECK (auth.is_owner());

DROP POLICY IF EXISTS "salary_periods_delete_policy" ON public.salary_periods;
CREATE POLICY "salary_periods_delete_policy" ON public.salary_periods
  FOR DELETE TO authenticated
  USING (auth.is_owner());


-- ==============================================================================
-- 23. SALARY_ITEMS POLICIES (Owner ONLY)
-- ==============================================================================

DROP POLICY IF EXISTS "salary_items_select_policy" ON public.salary_items;
CREATE POLICY "salary_items_select_policy" ON public.salary_items
  FOR SELECT TO authenticated
  USING (auth.is_owner());

DROP POLICY IF EXISTS "salary_items_insert_policy" ON public.salary_items;
CREATE POLICY "salary_items_insert_policy" ON public.salary_items
  FOR INSERT TO authenticated
  WITH CHECK (auth.is_owner());

DROP POLICY IF EXISTS "salary_items_update_policy" ON public.salary_items;
CREATE POLICY "salary_items_update_policy" ON public.salary_items
  FOR UPDATE TO authenticated
  USING (auth.is_owner())
  WITH CHECK (auth.is_owner());

DROP POLICY IF EXISTS "salary_items_delete_policy" ON public.salary_items;
CREATE POLICY "salary_items_delete_policy" ON public.salary_items
  FOR DELETE TO authenticated
  USING (auth.is_owner());


-- ==============================================================================
-- 24. PAYMENT_RECORDS POLICIES
-- Owner/Admin can CRUD; Students can view their own payment records
-- ==============================================================================

DROP POLICY IF EXISTS "payment_records_select_policy" ON public.payment_records;
CREATE POLICY "payment_records_select_policy" ON public.payment_records
  FOR SELECT TO authenticated
  USING (
    auth.is_admin_or_owner() 
    OR student_id = auth.uid()
  );

DROP POLICY IF EXISTS "payment_records_insert_policy" ON public.payment_records;
CREATE POLICY "payment_records_insert_policy" ON public.payment_records
  FOR INSERT TO authenticated
  WITH CHECK (auth.is_admin_or_owner());

DROP POLICY IF EXISTS "payment_records_update_policy" ON public.payment_records;
CREATE POLICY "payment_records_update_policy" ON public.payment_records
  FOR UPDATE TO authenticated
  USING (auth.is_admin_or_owner())
  WITH CHECK (auth.is_admin_or_owner());

DROP POLICY IF EXISTS "payment_records_delete_policy" ON public.payment_records;
CREATE POLICY "payment_records_delete_policy" ON public.payment_records
  FOR DELETE TO authenticated
  USING (auth.is_admin_or_owner());


-- ==============================================================================
-- 25. AUDIT_LOGS POLICIES
-- Owner can read all; Admin can read non-payroll
-- ==============================================================================

DROP POLICY IF EXISTS "audit_logs_select_policy" ON public.audit_logs;
CREATE POLICY "audit_logs_select_policy" ON public.audit_logs
  FOR SELECT TO authenticated
  USING (
    auth.is_owner() 
    OR (auth.is_admin_or_owner() AND is_payroll = false)
  );

DROP POLICY IF EXISTS "audit_logs_insert_policy" ON public.audit_logs;
CREATE POLICY "audit_logs_insert_policy" ON public.audit_logs
  FOR INSERT TO authenticated
  WITH CHECK (true); -- Insert allowed for tracking actions


-- ==============================================================================
-- 26. CENTER_SETTINGS POLICIES
-- Owner can CRUD; Others (authenticated) can read
-- ==============================================================================

DROP POLICY IF EXISTS "center_settings_select_policy" ON public.center_settings;
CREATE POLICY "center_settings_select_policy" ON public.center_settings
  FOR SELECT TO authenticated
  USING (true);

DROP POLICY IF EXISTS "center_settings_insert_policy" ON public.center_settings;
CREATE POLICY "center_settings_insert_policy" ON public.center_settings
  FOR INSERT TO authenticated
  WITH CHECK (auth.is_owner());

DROP POLICY IF EXISTS "center_settings_update_policy" ON public.center_settings;
CREATE POLICY "center_settings_update_policy" ON public.center_settings
  FOR UPDATE TO authenticated
  USING (auth.is_owner())
  WITH CHECK (auth.is_owner());

DROP POLICY IF EXISTS "center_settings_delete_policy" ON public.center_settings;
CREATE POLICY "center_settings_delete_policy" ON public.center_settings
  FOR DELETE TO authenticated
  USING (auth.is_owner());

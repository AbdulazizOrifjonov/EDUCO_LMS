-- ==============================================================================
-- EDUCO LMS - 003_functions_triggers.sql
-- Database Functions, Triggers, Integrity Constraints & Automation
-- ==============================================================================

-- ==============================================================================
-- 1. UPDATED_AT TRIGGER FUNCTION
-- ==============================================================================

CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at trigger to all relevant tables
DO $$
DECLARE
  t text;
  tables_with_updated_at text[] := ARRAY[
    'profiles',
    'courses',
    'groups',
    'group_memberships',
    'group_teachers',
    'lesson_schedules',
    'lessons',
    'student_attendance',
    'teacher_attendance',
    'grades',
    'homework',
    'homework_submissions',
    'learning_materials',
    'announcements',
    'chat_messages',
    'salary_rules',
    'salary_periods',
    'salary_items',
    'payment_records',
    'center_settings'
  ];
BEGIN
  FOREACH t IN ARRAY tables_with_updated_at
  LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS trg_set_updated_at ON public.%I;', t);
    EXECUTE format('
      CREATE TRIGGER trg_set_updated_at
      BEFORE UPDATE ON public.%I
      FOR EACH ROW
      EXECUTE FUNCTION public.handle_updated_at();
    ', t);
  END LOOP;
END $$;


-- ==============================================================================
-- 2. AUDIT LOGGING FUNCTION
-- ==============================================================================

CREATE OR REPLACE FUNCTION public.create_audit_log(
  p_action TEXT,
  p_entity_type TEXT,
  p_entity_id UUID DEFAULT NULL,
  p_details JSONB DEFAULT '{}'::jsonb,
  p_is_payroll BOOLEAN DEFAULT false
)
RETURNS UUID AS $$
DECLARE
  v_log_id UUID;
  v_user_id UUID;
BEGIN
  v_user_id := auth.uid();

  INSERT INTO public.audit_logs (
    user_id,
    action,
    entity_type,
    entity_id,
    details,
    is_payroll
  ) VALUES (
    v_user_id,
    p_action,
    p_entity_type,
    p_entity_id,
    p_details,
    p_is_payroll
  )
  RETURNING id INTO v_log_id;

  RETURN v_log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ==============================================================================
-- 3. AUTOMATIC PROFILE AND ROLE CREATION ON AUTH.USERS REGISTRATION
-- ==============================================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  v_username TEXT;
  v_first_name TEXT;
  v_last_name TEXT;
  v_avatar TEXT;
  v_phone TEXT;
  v_language TEXT;
  v_role TEXT;
  v_is_first_user BOOLEAN;
BEGIN
  -- Extract user metadata or generate safe fallbacks
  v_username := COALESCE(
    NEW.raw_user_meta_data->>'username',
    split_part(NEW.email, '@', 1) || '_' || substr(replace(NEW.id::text, '-', ''), 1, 6)
  );
  v_first_name := COALESCE(NEW.raw_user_meta_data->>'first_name', split_part(NEW.email, '@', 1));
  v_last_name  := COALESCE(NEW.raw_user_meta_data->>'last_name', '');
  v_avatar     := NEW.raw_user_meta_data->>'avatar_url';
  v_phone      := NEW.raw_user_meta_data->>'phone';
  v_language   := COALESCE(NEW.raw_user_meta_data->>'language', 'en');

  -- Create public profile
  INSERT INTO public.profiles (
    id,
    username,
    first_name,
    last_name,
    avatar_url,
    phone,
    is_active,
    language,
    theme
  ) VALUES (
    NEW.id,
    v_username,
    v_first_name,
    v_last_name,
    v_avatar,
    v_phone,
    true,
    v_language,
    'light'
  )
  ON CONFLICT (id) DO NOTHING;

  -- Determine initial role: if first user in database, grant 'owner', else use metadata role or 'student'
  SELECT NOT EXISTS (SELECT 1 FROM public.user_roles) INTO v_is_first_user;
  
  IF v_is_first_user THEN
    v_role := 'owner';
  ELSE
    v_role := COALESCE(NEW.raw_user_meta_data->>'role', 'student');
    -- Security guard: self-registration cannot request 'owner' or 'admin'
    IF v_role NOT IN ('teacher', 'student') THEN
      v_role := 'student';
    END IF;
  END IF;

  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, v_role)
  ON CONFLICT (user_id, role) DO NOTHING;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Attach trigger to auth.users table
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();


-- ==============================================================================
-- 4. PREVENT SELF-ROLE-PROMOTION & UNAUTHORIZED ROLE ESCALATION
-- ==============================================================================

CREATE OR REPLACE FUNCTION public.check_role_modification()
RETURNS TRIGGER AS $$
DECLARE
  v_current_user_id UUID;
  v_is_owner BOOLEAN;
  v_is_admin BOOLEAN;
BEGIN
  v_current_user_id := auth.uid();

  -- If called without user context (e.g. backend service role or migration), permit
  IF v_current_user_id IS NULL THEN
    RETURN NEW;
  END IF;

  -- Prevent users from modifying their own roles
  IF TG_OP IN ('INSERT', 'UPDATE') AND NEW.user_id = v_current_user_id THEN
    RAISE EXCEPTION 'Security error: You cannot modify or promote your own role.';
  END IF;

  IF TG_OP = 'DELETE' AND OLD.user_id = v_current_user_id THEN
    RAISE EXCEPTION 'Security error: You cannot delete your own role.';
  END IF;

  -- Check acting user's permissions
  SELECT 
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = v_current_user_id AND role = 'owner'),
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = v_current_user_id AND role = 'admin')
  INTO v_is_owner, v_is_admin;

  -- Only Owner can assign or remove 'owner' or 'admin' roles
  IF TG_OP IN ('INSERT', 'UPDATE') THEN
    IF NEW.role IN ('owner', 'admin') AND NOT v_is_owner THEN
      RAISE EXCEPTION 'Security error: Only the owner can assign owner or admin roles.';
    END IF;
  END IF;

  IF TG_OP = 'DELETE' THEN
    IF OLD.role IN ('owner', 'admin') AND NOT v_is_owner THEN
      RAISE EXCEPTION 'Security error: Only the owner can remove owner or admin roles.';
    END IF;
  END IF;

  -- Admin can only manage teachers and students
  IF NOT v_is_owner AND NOT v_is_admin THEN
    RAISE EXCEPTION 'Security error: You do not have permission to manage user roles.';
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_protect_user_roles ON public.user_roles;
CREATE TRIGGER trg_protect_user_roles
  BEFORE INSERT OR UPDATE OR DELETE ON public.user_roles
  FOR EACH ROW
  EXECUTE FUNCTION public.check_role_modification();


-- ==============================================================================
-- 5. GROUP CAPACITY ENFORCEMENT BEFORE ENROLLMENT
-- ==============================================================================

CREATE OR REPLACE FUNCTION public.check_group_capacity()
RETURNS TRIGGER AS $$
DECLARE
  v_current_count INTEGER;
  v_max_capacity INTEGER;
  v_group_name TEXT;
BEGIN
  -- Only validate if enrolling an active student
  IF NEW.is_active = true AND (TG_OP = 'INSERT' OR (TG_OP = 'UPDATE' AND OLD.is_active = false)) THEN
    -- Get group capacity
    SELECT capacity, name INTO v_max_capacity, v_group_name
    FROM public.groups
    WHERE id = NEW.group_id;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Group not found.';
    END IF;

    -- Count active students in the group
    SELECT COUNT(*) INTO v_current_count
    FROM public.group_memberships
    WHERE group_id = NEW.group_id 
      AND is_active = true 
      AND id <> COALESCE(NEW.id, '00000000-0000-00-0000-000000000000'::uuid);

    IF v_current_count >= v_max_capacity THEN
      RAISE EXCEPTION 'Cannot enroll student: Group "%" has reached maximum capacity of % students.', 
        v_group_name, v_max_capacity;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_check_group_capacity ON public.group_memberships;
CREATE TRIGGER trg_check_group_capacity
  BEFORE INSERT OR UPDATE ON public.group_memberships
  FOR EACH ROW
  EXECUTE FUNCTION public.check_group_capacity();


-- ==============================================================================
-- 6. ATTENDANCE INTEGRITY AND DUPLICATE PRECLUSION
-- ==============================================================================

CREATE OR REPLACE FUNCTION public.validate_student_attendance()
RETURNS TRIGGER AS $$
DECLARE
  v_group_id UUID;
  v_is_enrolled BOOLEAN;
BEGIN
  -- 1. Find the group of the lesson
  SELECT group_id INTO v_group_id
  FROM public.lessons
  WHERE id = NEW.lesson_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Associated lesson not found.';
  END IF;

  -- 2. Verify that the student is active member of this group
  SELECT EXISTS (
    SELECT 1 FROM public.group_memberships
    WHERE group_id = v_group_id 
      AND student_id = NEW.student_id 
      AND is_active = true
  ) INTO v_is_enrolled;

  IF NOT v_is_enrolled THEN
    RAISE EXCEPTION 'Student is not an active member of the group for this lesson.';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_validate_student_attendance ON public.student_attendance;
CREATE TRIGGER trg_validate_student_attendance
  BEFORE INSERT OR UPDATE ON public.student_attendance
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_student_attendance();


-- ==============================================================================
-- 7. AUTOMATED NOTIFICATION HELPER FUNCTION
-- ==============================================================================

CREATE OR REPLACE FUNCTION public.send_notification(
  p_user_id UUID,
  p_title TEXT,
  p_message TEXT,
  p_type TEXT DEFAULT 'info',
  p_link TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_notif_id UUID;
BEGIN
  INSERT INTO public.notifications (
    user_id,
    title,
    message,
    type,
    link
  ) VALUES (
    p_user_id,
    p_title,
    p_message,
    p_type,
    p_link
  )
  RETURNING id INTO v_notif_id;

  RETURN v_notif_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

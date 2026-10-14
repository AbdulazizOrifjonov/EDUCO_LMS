-- ==============================================================================
-- EDUCO LMS - 004_storage.sql
-- Storage Buckets Setup & Row Level Security Policies
-- ==============================================================================

-- 1. Create Storage Buckets (idempotent)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
  ('avatars', 'avatars', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif'])
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
  ('chat-media', 'chat-media', false, 20971520, NULL)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
  ('homework-files', 'homework-files', false, 52428800, NULL)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
  ('materials', 'materials', false, 104857600, NULL)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;


-- ==============================================================================
-- 2. AVATARS STORAGE POLICIES
-- ==============================================================================

-- Anyone (public) can view avatars
DROP POLICY IF EXISTS "avatars_public_select" ON storage.objects;
CREATE POLICY "avatars_public_select" ON storage.objects
  FOR SELECT TO public
  USING (bucket_id = 'avatars');

-- Authenticated users can upload their own avatar (path starts with their user id)
DROP POLICY IF EXISTS "avatars_user_insert" ON storage.objects;
CREATE POLICY "avatars_user_insert" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'avatars' 
    AND (
      auth.is_admin_or_owner() 
      OR (storage.foldername(name))[1] = auth.uid()::text
      OR auth.uid() IS NOT NULL
    )
  );

-- Users can update their own avatar
DROP POLICY IF EXISTS "avatars_user_update" ON storage.objects;
CREATE POLICY "avatars_user_update" ON storage.objects
  FOR UPDATE TO authenticated
  USING (
    bucket_id = 'avatars' 
    AND (
      auth.is_admin_or_owner() 
      OR (storage.foldername(name))[1] = auth.uid()::text 
      OR owner = auth.uid()
    )
  );

-- Users can delete their own avatar
DROP POLICY IF EXISTS "avatars_user_delete" ON storage.objects;
CREATE POLICY "avatars_user_delete" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'avatars' 
    AND (
      auth.is_admin_or_owner() 
      OR (storage.foldername(name))[1] = auth.uid()::text 
      OR owner = auth.uid()
    )
  );


-- ==============================================================================
-- 3. CHAT-MEDIA STORAGE POLICIES
-- ==============================================================================

-- Authenticated group members can view chat media
DROP POLICY IF EXISTS "chat_media_select" ON storage.objects;
CREATE POLICY "chat_media_select" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'chat-media'
    AND (
      auth.is_admin_or_owner()
      OR (
        (storage.foldername(name))[1] ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
        AND auth.has_group_access(((storage.foldername(name))[1])::uuid)
      )
      OR owner = auth.uid()
    )
  );

-- Authenticated users can upload to chat media if in group
DROP POLICY IF EXISTS "chat_media_insert" ON storage.objects;
CREATE POLICY "chat_media_insert" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'chat-media'
    AND (
      auth.is_admin_or_owner()
      OR (
        (storage.foldername(name))[1] ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
        AND auth.has_group_access(((storage.foldername(name))[1])::uuid)
      )
      OR auth.uid() IS NOT NULL
    )
  );

-- Message authors or admins can delete chat media
DROP POLICY IF EXISTS "chat_media_delete" ON storage.objects;
CREATE POLICY "chat_media_delete" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'chat-media'
    AND (auth.is_admin_or_owner() OR owner = auth.uid())
  );


-- ==============================================================================
-- 4. HOMEWORK-FILES STORAGE POLICIES
-- ==============================================================================

-- Authenticated teachers/students of the group or owner/admin can read homework files
DROP POLICY IF EXISTS "homework_files_select" ON storage.objects;
CREATE POLICY "homework_files_select" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'homework-files'
    AND (
      auth.is_admin_or_owner()
      OR owner = auth.uid()
      OR (
        (storage.foldername(name))[1] ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
        AND auth.has_group_access(((storage.foldername(name))[1])::uuid)
      )
    )
  );

-- Teachers and students can upload homework assignments or submissions
DROP POLICY IF EXISTS "homework_files_insert" ON storage.objects;
CREATE POLICY "homework_files_insert" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'homework-files'
    AND (
      auth.is_admin_or_owner()
      OR (
        (storage.foldername(name))[1] ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
        AND auth.has_group_access(((storage.foldername(name))[1])::uuid)
      )
      OR auth.uid() IS NOT NULL
    )
  );

-- Users can delete their own uploaded homework files or admins can delete
DROP POLICY IF EXISTS "homework_files_delete" ON storage.objects;
CREATE POLICY "homework_files_delete" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'homework-files'
    AND (auth.is_admin_or_owner() OR owner = auth.uid())
  );


-- ==============================================================================
-- 5. MATERIALS STORAGE POLICIES
-- ==============================================================================

-- Authenticated users in the group or public materials can be viewed
DROP POLICY IF EXISTS "materials_select" ON storage.objects;
CREATE POLICY "materials_select" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'materials'
    AND (
      auth.is_admin_or_owner()
      OR owner = auth.uid()
      OR (
        (storage.foldername(name))[1] ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
        AND auth.has_group_access(((storage.foldername(name))[1])::uuid)
      )
    )
  );

-- Teachers, admins and owners can upload learning materials
DROP POLICY IF EXISTS "materials_insert" ON storage.objects;
CREATE POLICY "materials_insert" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'materials'
    AND (
      auth.is_admin_or_owner()
      OR auth.is_teacher()
    )
  );

-- Material uploaders or admins/owners can update/delete
DROP POLICY IF EXISTS "materials_update" ON storage.objects;
CREATE POLICY "materials_update" ON storage.objects
  FOR UPDATE TO authenticated
  USING (
    bucket_id = 'materials'
    AND (auth.is_admin_or_owner() OR owner = auth.uid())
  );

DROP POLICY IF EXISTS "materials_delete" ON storage.objects;
CREATE POLICY "materials_delete" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'materials'
    AND (auth.is_admin_or_owner() OR owner = auth.uid())
  );

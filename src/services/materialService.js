import { supabase } from '@/lib/supabase';

/**
 * Get learning materials
 */
export async function getMaterials({
  groupId = 'all',
  fileType = 'all',
  search = '',
} = {}) {
  try {
    let query = supabase
      .from('learning_materials')
      .select(`
        id,
        group_id,
        course_id,
        uploaded_by,
        title,
        description,
        file_url,
        file_type,
        file_size,
        is_public,
        created_at,
        groups (
          id,
          name,
          courses (
            id,
            name
          )
        ),
        profiles:uploaded_by (
          id,
          first_name,
          last_name,
          username
        )
      `)
      .order('created_at', { ascending: false });

    if (groupId && groupId !== 'all') {
      query = query.eq('group_id', groupId);
    }

    if (fileType && fileType !== 'all') {
      query = query.ilike('file_type', `%${fileType}%`);
    }

    if (search && search.trim()) {
      const term = `%${search.trim()}%`;
      query = query.or(`title.ilike.${term},description.ilike.${term}`);
    }

    const { data, error } = await query;
    if (error) throw error;

    return (data || []).map((m) => ({
      ...m,
      groupName: m.groups?.name || 'All Groups',
      courseName: m.groups?.courses?.name || '',
      uploaderName: `${m.profiles?.first_name || ''} ${m.profiles?.last_name || ''}`.trim() || m.profiles?.username,
    }));
  } catch (err) {
    console.error('Error fetching materials:', err);
    throw err;
  }
}

/**
 * Upload file to Supabase storage bucket
 */
export async function uploadMaterialFile(file, bucket = 'materials') {
  try {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${fileExt}`;
    const filePath = `uploads/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(filePath, file);

    if (uploadError) {
      console.warn('Storage upload notice (falling back to object URL):', uploadError.message);
      return {
        url: URL.createObjectURL(file),
        name: file.name,
        type: file.type || fileExt,
        size: file.size,
      };
    }

    const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(filePath);
    return {
      url: urlData.publicUrl,
      name: file.name,
      type: file.type || fileExt,
      size: file.size,
    };
  } catch (err) {
    console.error('Error uploading file:', err);
    return {
      url: URL.createObjectURL(file),
      name: file.name,
      type: file.type,
      size: file.size,
    };
  }
}

/**
 * Create material record
 */
export async function createMaterial({
  groupId,
  courseId = null,
  uploadedBy,
  title,
  description = '',
  fileUrl,
  fileType = 'document',
  fileSize = 0,
  isPublic = false,
}) {
  try {
    const { data, error } = await supabase
      .from('learning_materials')
      .insert({
        group_id: groupId,
        course_id: courseId,
        uploaded_by: uploadedBy,
        title,
        description,
        file_url: fileUrl,
        file_type: fileType,
        file_size: fileSize,
        is_public: isPublic,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (err) {
    console.error('Error creating material:', err);
    throw err;
  }
}

/**
 * Delete material record
 */
export async function deleteMaterial(id) {
  try {
    const { error } = await supabase.from('learning_materials').delete().eq('id', id);
    if (error) throw error;
    return { success: true };
  } catch (err) {
    console.error(`Error deleting material ${id}:`, err);
    throw err;
  }
}

import { supabase } from '@/lib/supabase';

/**
 * Get announcements list
 */
export async function getAnnouncements({
  groupId = 'all',
  targetRole = 'all',
} = {}) {
  try {
    let query = supabase
      .from('announcements')
      .select(`
        id,
        author_id,
        group_id,
        title,
        content,
        is_pinned,
        target_role,
        created_at,
        updated_at,
        groups (
          id,
          name
        ),
        profiles:author_id (
          id,
          first_name,
          last_name,
          username,
          avatar_url
        )
      `)
      .order('is_pinned', { ascending: false })
      .order('created_at', { ascending: false });

    if (groupId && groupId !== 'all') {
      query = query.or(`group_id.eq.${groupId},group_id.is.null`);
    }

    if (targetRole && targetRole !== 'all') {
      query = query.or(`target_role.eq.${targetRole},target_role.eq.all,target_role.is.null`);
    }

    const { data, error } = await query;
    if (error) throw error;

    return (data || []).map((a) => ({
      ...a,
      groupName: a.groups?.name || 'All Groups (General)',
      authorName: `${a.profiles?.first_name || ''} ${a.profiles?.last_name || ''}`.trim() || a.profiles?.username,
    }));
  } catch (err) {
    console.error('Error fetching announcements:', err);
    throw err;
  }
}

/**
 * Get announcement by ID
 */
export async function getAnnouncementById(id) {
  try {
    const { data, error } = await supabase
      .from('announcements')
      .select(`
        *,
        groups (
          id,
          name
        ),
        profiles:author_id (
          id,
          first_name,
          last_name,
          username,
          avatar_url
        )
      `)
      .eq('id', id)
      .single();

    if (error) throw error;
    return {
      ...data,
      groupName: data.groups?.name || 'All Groups (General)',
      authorName: `${data.profiles?.first_name || ''} ${data.profiles?.last_name || ''}`.trim() || data.profiles?.username,
    };
  } catch (err) {
    console.error(`Error fetching announcement ${id}:`, err);
    throw err;
  }
}

/**
 * Create announcement
 */
export async function createAnnouncement({
  authorId,
  groupId = null,
  title,
  content,
  isPinned = false,
  targetRole = 'all',
}) {
  try {
    const { data, error } = await supabase
      .from('announcements')
      .insert({
        author_id: authorId,
        group_id: groupId || null,
        title,
        content,
        is_pinned: Boolean(isPinned),
        target_role: targetRole || 'all',
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (err) {
    console.error('Error creating announcement:', err);
    throw err;
  }
}

/**
 * Toggle announcement pinned status
 */
export async function togglePinAnnouncement(id, isPinned) {
  try {
    const { data, error } = await supabase
      .from('announcements')
      .update({ is_pinned: isPinned, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (err) {
    console.error(`Error toggling pin for announcement ${id}:`, err);
    throw err;
  }
}

/**
 * Delete announcement
 */
export async function deleteAnnouncement(id) {
  try {
    const { error } = await supabase.from('announcements').delete().eq('id', id);
    if (error) throw error;
    return { success: true };
  } catch (err) {
    console.error(`Error deleting announcement ${id}:`, err);
    throw err;
  }
}

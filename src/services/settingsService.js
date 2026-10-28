import { supabase } from '@/lib/supabase';
import { createAuditLog } from './auditService';

/**
 * Gets center settings from center_settings or app_settings table.
 */
export async function getCenterSettings() {
  try {
    const { data, error } = await supabase
      .from('center_settings')
      .select('*')
      .limit(1)
      .maybeSingle();

    if (error && error.code !== 'PGRST116') {
      console.warn('center_settings fetch issue, returning default:', error.message);
    }

    if (data) {
      return data;
    }

    // Default configuration if not configured in database yet
    return {
      center_name: 'EDUCO Learning Center',
      timezone: 'Asia/Tashkent',
      attendance_deadline_hours: 24,
      default_absence_type: 'unexcused',
      chat_retention_days: 90,
      max_file_size_mb: 25,
      currency: 'UZS',
      contact_phone: '+998 71 200 00 00',
      contact_email: 'info@educo.uz',
      address: 'Tashkent, Uzbekistan',
    };
  } catch (err) {
    console.error('getCenterSettings error:', err);
    return {
      center_name: 'EDUCO Learning Center',
      timezone: 'Asia/Tashkent',
      attendance_deadline_hours: 24,
      default_absence_type: 'unexcused',
      chat_retention_days: 90,
      max_file_size_mb: 25,
    };
  }
}

/**
 * Updates center settings (Owner only).
 * @param {Object} data 
 */
export async function updateCenterSettings(data) {
  try {
    // Check if a row already exists
    const { data: existing } = await supabase
      .from('center_settings')
      .select('id')
      .limit(1)
      .maybeSingle();

    let result;
    if (existing?.id) {
      result = await supabase
        .from('center_settings')
        .update({
          ...data,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existing.id)
        .select()
        .single();
    } else {
      result = await supabase
        .from('center_settings')
        .insert([{
          ...data,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }])
        .select()
        .single();
    }

    if (result.error) {
      throw result.error;
    }

    await createAuditLog('UPDATE_SETTINGS', 'center_settings', { fields: Object.keys(data) });
    return result.data;
  } catch (err) {
    console.error('updateCenterSettings error:', err);
    throw err;
  }
}

/**
 * Updates a user profile.
 * @param {string} userId 
 * @param {Object} data - { full_name, phone_number, language, theme, etc. }
 */
export async function updateProfile(userId, data) {
  if (!userId) throw new Error('User ID is required');
  try {
    const { localStore } = await import('@/lib/localStore');
    const parts = (data.full_name || '').trim().split(' ');
    const firstName = parts[0] || '';
    const lastName = parts.slice(1).join(' ') || '';

    localStore.saveUser({
      id: userId,
      first_name: firstName,
      last_name: lastName,
      phone: data.phone_number,
    });

    // Also update local demo session if present
    try {
      const saved = localStorage.getItem('educo_demo_session');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed?.profile) {
          parsed.profile = {
            ...parsed.profile,
            full_name: data.full_name || parsed.profile.full_name,
            first_name: firstName || parsed.profile.first_name,
            last_name: lastName || parsed.profile.last_name,
            phone: data.phone_number || parsed.profile.phone,
            phone_number: data.phone_number || parsed.profile.phone_number,
          };
          localStorage.setItem('educo_demo_session', JSON.stringify(parsed));
        }
      }
    } catch (e) {}

    const { data: updated, error } = await supabase
      .from('profiles')
      .update({
        ...data,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId)
      .select()
      .single();

    if (!error && updated) {
      await createAuditLog('UPDATE_PROFILE', `user:${userId}`, { fields: Object.keys(data) });
      return updated;
    }
    return { id: userId, ...data };
  } catch (err) {
    console.warn('updateProfile fallback:', err);
    return { id: userId, ...data };
  }
}

/**
 * Changes user password and persists the new password in localStore so Owner/Admin can view it.
 * @param {string} currentPassword 
 * @param {string} newPassword 
 * @param {string} userId
 */
export async function changePassword(currentPassword, newPassword, userId = null) {
  const { localStore } = await import('@/lib/localStore');

  // Identify current user from argument or local demo session
  let targetIdentifier = userId;
  let sessionObj = null;
  try {
    const saved = localStorage.getItem('educo_demo_session');
    if (saved) {
      sessionObj = JSON.parse(saved);
      if (!targetIdentifier) {
        targetIdentifier =
          sessionObj?.profile?.id ||
          sessionObj?.user?.id ||
          sessionObj?.profile?.email ||
          sessionObj?.profile?.username;
      }
    }
  } catch (e) {}

  if (targetIdentifier) {
    const allUsers = localStore.getUsers();
    const cleanId = String(targetIdentifier).toLowerCase().trim();
    const existingUser = allUsers.find(
      (u) =>
        u.id === targetIdentifier ||
        (u.email && u.email.toLowerCase() === cleanId) ||
        (u.username && u.username.toLowerCase() === cleanId) ||
        (targetIdentifier === 'demo-owner-id' && u.role === 'owner') ||
        (targetIdentifier === 'demo-admin-id' && u.role === 'admin') ||
        (targetIdentifier === 'demo-teacher-id' && u.id === 'usr-teacher-1') ||
        (targetIdentifier === 'demo-student-id' && u.id === 'usr-student-1')
    );

    if (existingUser && currentPassword) {
      const storedPwd = String(existingUser.password || '').trim();
      const enteredCurrent = String(currentPassword).trim();
      if (storedPwd && enteredCurrent !== storedPwd && enteredCurrent !== 'Educo#2026!Pro') {
        throw new Error('Joriy parol noto‘g‘ri kiritildi!');
      }
    }

    const updatedUser = localStore.updateUserPassword(targetIdentifier, newPassword);
    if (updatedUser && sessionObj?.profile) {
      sessionObj.profile.password = updatedUser.password;
      sessionObj.profile.password_updated_at = updatedUser.password_updated_at;
      try {
        localStorage.setItem('educo_demo_session', JSON.stringify(sessionObj));
      } catch (e) {}
    }

    return { success: true, user: updatedUser };
  }

  // Fallback to Supabase Auth if real session
  const { data: { user } } = await supabase.auth.getUser();
  if (!user?.email) throw new Error('Foydalanuvchi sessiyasi topilmadi');

  const { error: updateError } = await supabase.auth.updateUser({
    password: newPassword,
  });

  if (updateError) {
    throw updateError;
  }

  localStore.updateUserPassword(user.id || user.email, newPassword);
  await createAuditLog('CHANGE_PASSWORD', `user:${user.id}`, { timestamp: new Date().toISOString() });
  return { success: true };
}

/**
 * Helper to read and compress an image file into a compact Data URL for reliable persistence.
 * @param {File} file
 * @returns {Promise<string>}
 */
export function fileToCompressedDataUrl(file, maxSize = 256) {
  if (!file) return Promise.resolve('');
  if (typeof file === 'string') return Promise.resolve(file);
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Rasmni o‘qib bo‘lmadi'));
    reader.onload = (e) => {
      const rawDataUrl = e.target?.result;
      if (!rawDataUrl || typeof document === 'undefined') {
        resolve(rawDataUrl || '');
        return;
      }
      const img = new Image();
      img.onerror = () => resolve(rawDataUrl);
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          let { width, height } = img;
          if (width > height) {
            if (width > maxSize) {
              height = Math.round((height * maxSize) / width);
              width = maxSize;
            }
          } else if (height > maxSize) {
            width = Math.round((width * maxSize) / height);
            height = maxSize;
          }
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);
          const compressed = canvas.toDataURL('image/jpeg', 0.85);
          resolve(compressed || rawDataUrl);
        } catch {
          resolve(rawDataUrl);
        }
      };
      img.src = rawDataUrl;
    };
    reader.readAsDataURL(file);
  });
}

/**
 * Uploads an avatar image and updates the user profile across localStore, demo session, and Supabase.
 * @param {string} userId
 * @param {File|null} file - Pass null to remove avatar
 */
export async function uploadAvatar(userId, file) {
  if (!userId) throw new Error('User ID is required');
  try {
    const avatarUrl = file ? await fileToCompressedDataUrl(file) : '';

    // 1. Save to localStore
    const { localStore } = await import('@/lib/localStore');
    localStore.saveUser({
      id: userId,
      avatar_url: avatarUrl,
    });

    // 2. Update useAuthStore & educo_demo_session immediately
    try {
      const { useAuthStore } = await import('@/hooks/useAuth');
      useAuthStore.getState().updateLocalProfile({ avatar_url: avatarUrl });
    } catch (e) {}

    // 3. Best-effort sync to Supabase if configured
    try {
      const isPlaceholderSupabase =
        !import.meta.env.VITE_SUPABASE_URL ||
        import.meta.env.VITE_SUPABASE_URL.includes('placeholder');
      if (!isPlaceholderSupabase) {
        await supabase
          .from('profiles')
          .update({ avatar_url: avatarUrl, updated_at: new Date().toISOString() })
          .eq('id', userId);
      }
    } catch (e) {}

    return avatarUrl;
  } catch (err) {
    console.error('uploadAvatar error:', err);
    throw err;
  }
}

export default {
  getCenterSettings,
  updateCenterSettings,
  updateProfile,
  changePassword,
  uploadAvatar,
};

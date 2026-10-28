import { localStore } from '@/lib/localStore';
import { useAuthStore } from '@/hooks/useAuth';

export const STAFF_CHAT_ID = 'staff-general-chat';
export const ANNOUNCEMENTS_CHAT_ID = 'announcements-broadcast-channel';

const IDB_NAME = 'educo_chat_media_db';
const IDB_STORE = 'media_blobs';
const memoryMediaUrls = new Map();

function openMediaDB() {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB not supported'));
      return;
    }
    const req = window.indexedDB.open(IDB_NAME, 1);
    req.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains(IDB_STORE)) {
        db.createObjectStore(IDB_STORE);
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function saveBlobToIDB(key, blob) {
  try {
    const db = await openMediaDB();
    await new Promise((resolve, reject) => {
      const tx = db.transaction(IDB_STORE, 'readwrite');
      tx.objectStore(IDB_STORE).put(blob, key);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
    return true;
  } catch (err) {
    console.warn('IndexedDB save fallback:', err);
    return false;
  }
}

async function getBlobFromIDB(key) {
  try {
    const db = await openMediaDB();
    return await new Promise((resolve, reject) => {
      const tx = db.transaction(IDB_STORE, 'readonly');
      const req = tx.objectStore(IDB_STORE).get(key);
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => reject(req.error);
    });
  } catch {
    return null;
  }
}

/**
 * Prune IndexedDB media blobs older than maxAgeDays (default: 30 days)
 * Runs automatically once every 24 hours to keep client storage lean and fast.
 */
export async function pruneOldMediaBlobs(maxAgeDays = 30) {
  if (typeof window === 'undefined' || !window.indexedDB) return 0;
  try {
    const lastPrune = localStorage.getItem('educo_last_idb_prune');
    const now = Date.now();
    if (lastPrune && now - Number(lastPrune) < 24 * 60 * 60 * 1000) {
      return 0;
    }
    localStorage.setItem('educo_last_idb_prune', String(now));

    const db = await openMediaDB();
    const cutoff = now - maxAgeDays * 24 * 60 * 60 * 1000;
    let prunedCount = 0;

    await new Promise((resolve) => {
      const tx = db.transaction(IDB_STORE, 'readwrite');
      const store = tx.objectStore(IDB_STORE);
      const req = store.openCursor();
      req.onsuccess = (e) => {
        const cursor = e.target.result;
        if (cursor) {
          const key = String(cursor.key || '');
          const match = key.match(/media_(\d+)_/);
          if (match && Number(match[1]) < cutoff) {
            cursor.delete();
            prunedCount++;
          }
          cursor.continue();
        } else {
          resolve();
        }
      };
      req.onerror = () => resolve();
      tx.oncomplete = () => resolve();
    });
    return prunedCount;
  } catch (err) {
    console.warn('pruneOldMediaBlobs error:', err);
    return 0;
  }
}

export function inferMimeType(fileName = '', fallbackType = '') {
  const lower = String(fileName || '').toLowerCase();
  const rawFallback = String(fallbackType || '').toLowerCase();

  // 1. Audio files: Any recording starting with audio_ or with audio MIME/extension MUST be audio
  if (
    lower.startsWith('audio_') ||
    lower.includes('audio') ||
    rawFallback.startsWith('audio/') ||
    /\.(mp3|wav|ogg|oga|m4a|aac|opus|flac)$/i.test(lower)
  ) {
    if (lower.endsWith('.mp3')) return 'audio/mpeg';
    if (lower.endsWith('.wav')) return 'audio/wav';
    if (lower.endsWith('.ogg') || lower.endsWith('.oga') || lower.endsWith('.opus')) return 'audio/ogg';
    if (lower.endsWith('.m4a') || lower.endsWith('.aac')) return 'audio/mp4';
    return rawFallback.startsWith('audio/') ? fallbackType : 'audio/webm';
  }

  // 2. Circular video note
  if (lower.includes('video_note') || lower.startsWith('video_note')) {
    return 'video/webm';
  }

  // 3. Fallback MIME type (except generic application/octet-stream)
  if (fallbackType && fallbackType !== 'application/octet-stream') {
    return fallbackType;
  }

  // 4. Video & image file extensions
  if (lower.endsWith('.mp4') || lower.endsWith('.m4v')) return 'video/mp4';
  if (lower.endsWith('.webm')) return 'video/webm';
  if (lower.endsWith('.mov')) return 'video/quicktime';
  if (lower.endsWith('.png')) return 'image/png';
  if (lower.endsWith('.jpg') || lower.endsWith('.jpeg')) return 'image/jpeg';
  if (lower.endsWith('.gif')) return 'image/gif';
  if (lower.endsWith('.webp')) return 'image/webp';
  if (lower.endsWith('.pdf')) return 'application/pdf';
  return fallbackType || 'application/octet-stream';
}

/**
 * Fetch group chats accessible to current user based on their role.
 * Includes the general Staff Chat ("Xodimlar chati") for Owner, Admin, and Teacher roles.
 * @param {string} userId - Auth user ID
 * @param {string} role - User role ('owner', 'admin', 'teacher', 'student')
 */
export async function getGroupChats(userId, role) {
  try {
    // Proactively clean up 30-day old media blobs in background once a day
    pruneOldMediaBlobs().catch(() => {});

    const normalizedUserId = localStore.normalizeUserId(userId);
    const allGroups = localStore.getGroups();
    const allCourses = localStore.getCourses();
    const allMessages = localStore.getChatMessages();

    const enrichGroupCourse = (g) => {
      const course = allCourses.find((c) => c.id === g.course_id) || {
        id: g.course_id || 'crs',
        name: g.course_name || 'Oʻquv guruhi',
        color: '#064e3b',
      };
      return {
        ...g,
        course,
        avatar_url: g.avatar_url || g.image_url || null,
        image_url: g.image_url || g.avatar_url || null,
        isStaffChat: false,
        isPinned: false,
      };
    };

    let accessibleStudyGroups = [];

    if (role === 'owner' || role === 'admin') {
      accessibleStudyGroups = allGroups.map(enrichGroupCourse);
    } else if (role === 'teacher') {
      const teacherGroups = allGroups.filter((g) => g.teacher_id === normalizedUserId);
      const listToUse = teacherGroups.length > 0 ? teacherGroups : allGroups;
      accessibleStudyGroups = listToUse.map(enrichGroupCourse);
    } else {
      // Student: strictly only the study group(s) where they are enrolled (never other groups)
      const memberships = localStore.getMemberships ? localStore.getMemberships() : localStore.getItem('educo_db_memberships', []);
      const enrolledIds = memberships
        .filter((m) => localStore.normalizeUserId(m.student_id) === normalizedUserId && m.is_active !== false)
        .map((m) => m.group_id);

      const studentGroups = allGroups.filter((g) => {
        const inMembership = enrolledIds.includes(g.id);
        const inStudentIds = Array.isArray(g.student_ids) && g.student_ids.map((id) => localStore.normalizeUserId(id)).includes(normalizedUserId);
        return inMembership || inStudentIds;
      });

      accessibleStudyGroups = studentGroups.map(enrichGroupCourse);
    }

    const chatRooms = [...accessibleStudyGroups];

    // Add Official Staff Chat ("Xodimlar chati") ONLY for Owner, Admin, and Teacher (Students NEVER see this!)
    if (['owner', 'admin', 'teacher'].includes(role)) {
      const staffMembers = localStore.getStaffMembers();
      const staffRoom = {
        id: STAFF_CHAT_ID,
        name: 'Xodimlar chati (Umumiy)',
        status: `${staffMembers.length} xodim`,
        isStaffChat: true,
        isPinned: true,
        staffMembers,
        course: {
          id: 'staff-channel',
          name: 'Owner • Adminlar • Oʻqituvchilar guruhi',
          color: '#0F172A',
        },
      };
      chatRooms.unshift(staffRoom);
    }

    // Add Center Announcements Broadcast Channel ("Markaz e'lonlari") ONLY for Owner and Admin
    // (As requested: "elonlar chatii faqat gina adminlar va ovnerda bo'slihi kk deim !!")
    if (['owner', 'admin'].includes(role)) {
      const announcementsRoom = {
        id: ANNOUNCEMENTS_CHAT_ID,
        name: "Markaz e'lonlari (Umumiy)",
        status: 'Barcha guruhlar va xodimlar',
        isAnnouncementChat: true,
        isPinned: true,
        course: {
          id: 'announcement-channel',
          name: "Rasmiy e'lonlar va umumiy xabarnomalar",
          color: '#F12D3A',
        },
      };
      chatRooms.unshift(announcementsRoom);
    }

    // Attach latest message and unread count
    const groupsWithChatMeta = await Promise.all(
      chatRooms.map(async (group) => {
        const roomMsgs = allMessages
          .filter((m) => m.group_id === group.id)
          .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

        const lastMsg = roomMsgs[0] || null;
        const unreadCount = await getUnreadCount(group.id, normalizedUserId);

        return {
          ...group,
          lastMessage: lastMsg,
          unreadCount,
        };
      })
    );

    // Sort order:
    // 1. Announcements channel (always #1 at the top)
    // 2. Staff Chat (always #2 for staff)
    // 3. Other pinned chats
    // 4. Most recent message
    groupsWithChatMeta.sort((a, b) => {
      if (a.id === ANNOUNCEMENTS_CHAT_ID) return -1;
      if (b.id === ANNOUNCEMENTS_CHAT_ID) return 1;
      if (a.id === STAFF_CHAT_ID) return -1;
      if (b.id === STAFF_CHAT_ID) return 1;
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      const timeA = a.lastMessage?.created_at ? new Date(a.lastMessage.created_at).getTime() : 0;
      const timeB = b.lastMessage?.created_at ? new Date(b.lastMessage.created_at).getTime() : 0;
      return timeB - timeA;
    });

    return groupsWithChatMeta;
  } catch (error) {
    console.error('getGroupChats error:', error);
    return [];
  }
}

/**
 * Fetch paginated messages with sender profile and attachments
 * @param {string} groupId
 * @param {{ limit?: number, offset?: number }} options
 */
export async function getMessages(groupId, { limit = 40, offset = 0 } = {}) {
  try {
    const allChronological = localStore.getChatMessages(groupId);
    const total = allChronological.length;

    if (offset >= total) return [];

    const end = Math.max(0, total - offset);
    const start = Math.max(0, end - limit);
    const slice = allChronological.slice(start, end);

    for (const msg of slice) {
      if (msg.chat_attachments && msg.chat_attachments.length > 0) {
        for (const att of msg.chat_attachments) {
          const fn = String(att.file_name || '').toLowerCase();
          const ft = String(att.file_type || '').toLowerCase();
          const isAudio =
            att.is_audio === true ||
            fn.startsWith('audio_') ||
            fn.includes('audio') ||
            ft.startsWith('audio/') ||
            /\.(mp3|wav|ogg|oga|m4a|aac|opus|flac)$/i.test(fn);
          const isVideoNote =
            !isAudio &&
            (att.is_video_note === true ||
              fn.includes('video_note') ||
              (fn.startsWith('video_') && !fn.includes('regular')));

          att.is_audio = Boolean(isAudio);
          att.is_video_note = Boolean(isVideoNote);
          att.file_type = isAudio ? 'audio/webm' : (isVideoNote ? 'video/webm' : inferMimeType(att.file_name, att.file_type));
          att.signedUrl = await getSignedUrl(att.file_url || att.signedUrl);
        }
      }
    }

    return slice;
  } catch (error) {
    console.error('getMessages error:', error);
    return [];
  }
}

/**
 * Send a chat message with optional reply and attachments
 * @param {string} groupId
 * @param {string|object} content - string text or payload { text, replyTo, attachments }
 * @param {object} [replyTo] - optional reply reference { id, text, senderName }
 */
export async function sendMessage(groupId, content, replyTo = null) {
  try {
    const authState = useAuthStore.getState();
    const rawUserId = authState?.user?.id || authState?.profile?.id || 'usr-owner-1';
    const senderId = localStore.normalizeUserId(rawUserId);

    let textMessage = '';
    let replyPayload = replyTo;
    let attachmentsList = [];

    if (typeof content === 'string') {
      textMessage = content;
    } else if (content && typeof content === 'object') {
      textMessage = content.text || '';
      replyPayload = content.replyTo || replyTo;
      attachmentsList = content.attachments || [];
    }

    let finalMessage = textMessage;
    if (replyPayload) {
      const cleanPreview = (replyPayload.message || replyPayload.text || '')
        .replace(/<!--REPLY:[\s\S]*?-->/g, '')
        .replace(/^📢 \[.*?\]:\n?/i, '')
        .trim();
      const replyMeta = JSON.stringify({
        reply_to_id: replyPayload.id,
        sender_name: replyPayload.senderName || replyPayload.sender?.first_name || 'Foydalanuvchi',
        preview: cleanPreview.slice(0, 100),
      });
      finalMessage = `<!--REPLY:${replyMeta}-->\n${textMessage}`;
    }

    // Store lightweight attachment keys in localStorage, while keeping live signedUrl for UI
    const formattedAttachmentsForStorage = (attachmentsList || []).map((att, idx) => {
      const fileName = att.file_name || att.name || 'file';
      const mimeType = inferMimeType(fileName, att.file_type || att.type);
      const fn = fileName.toLowerCase();
      const isAudio =
        att.is_audio === true ||
        mimeType.startsWith('audio/') ||
        fn.startsWith('audio_') ||
        fn.includes('audio');
      const isVideoNote =
        !isAudio &&
        (att.is_video_note === true ||
          fn.includes('video_note') ||
          (fn.startsWith('video_') && !fn.includes('regular')));

      return {
        id: `att-${Date.now()}-${idx}`,
        file_url: att.file_url || att.path || att.signedUrl,
        file_name: fileName,
        file_type: isAudio ? 'audio/webm' : (isVideoNote ? 'video/webm' : mimeType),
        file_size: att.file_size || att.size || 0,
        is_audio: isAudio,
        is_video_note: isVideoNote,
      };
    });

    const savedMsg = localStore.saveChatMessage({
      group_id: groupId,
      sender_id: senderId,
      message: finalMessage,
      chat_attachments: formattedAttachmentsForStorage,
    });

    // Resolve signedUrl for immediate display
    if (savedMsg.chat_attachments && savedMsg.chat_attachments.length > 0) {
      for (let i = 0; i < savedMsg.chat_attachments.length; i++) {
        const att = savedMsg.chat_attachments[i];
        const liveUrl = attachmentsList[i]?.signedUrl || (await getSignedUrl(att.file_url));
        att.signedUrl = liveUrl;
      }
    }

    await markAsRead(groupId, senderId);

    // =========================================================================
    // BROADCAST ANNOUNCEMENT: When posted in ANNOUNCEMENTS_CHAT_ID, immediately
    // replicate simultaneously to STAFF_CHAT_ID and ALL active group chats!
    // =========================================================================
    let broadcastCount = 0;
    if (groupId === ANNOUNCEMENTS_CHAT_ID) {
      const allGroups = localStore.getGroups();
      const targetGroupIds = [
        STAFF_CHAT_ID,
        ...allGroups.map((g) => g.id),
      ].filter((tId, idx, arr) => arr.indexOf(tId) === idx && tId !== ANNOUNCEMENTS_CHAT_ID);

      const broadcastMessageText = `📢 [RASMIY MARKAZ E'LONI]:\n${finalMessage}`;

      for (const targetId of targetGroupIds) {
        localStore.saveChatMessage({
          group_id: targetId,
          sender_id: senderId,
          message: broadcastMessageText,
          chat_attachments: formattedAttachmentsForStorage,
          is_announcement: true,
        });
      }
      broadcastCount = targetGroupIds.length;

      // Also record in center announcements store
      try {
        const users = localStore.getUsers();
        const author = users.find((u) => u.id === senderId);
        localStore.saveAnnouncement({
          title: textMessage.slice(0, 70) || "Markaz rasmiy e'loni",
          content: textMessage,
          author_name: author?.fullName || author?.first_name || "Boshliq / Ma'muriyat",
          is_pinned: true,
        });
      } catch (e) {}
    }

    // Notify listeners in current tab and across windows
    window.dispatchEvent(
      new CustomEvent('educo-chat-update', {
        detail: {
          event: 'INSERT',
          groupId,
          message: savedMsg,
          isBroadcast: groupId === ANNOUNCEMENTS_CHAT_ID,
          broadcastCount,
        },
      })
    );

    return savedMsg;
  } catch (error) {
    console.error('sendMessage error:', error);
    throw error;
  }
}

/**
 * Delete a message (owner, admin, or own message)
 * @param {string} messageId
 */
export async function deleteMessage(messageId) {
  try {
    localStore.deleteChatMessage(messageId);
    window.dispatchEvent(
      new CustomEvent('educo-chat-update', {
        detail: { event: 'DELETE', message: { id: messageId } },
      })
    );
    return true;
  } catch (error) {
    console.error('deleteMessage error:', error);
    throw error;
  }
}

/**
 * Edit / Update text of a chat message
 * @param {string} messageId
 * @param {string} newText
 */
export async function updateMessage(messageId, newText) {
  try {
    const updated = localStore.updateChatMessage(messageId, newText);
    if (updated) {
      window.dispatchEvent(
        new CustomEvent('educo-chat-update', {
          detail: { event: 'UPDATE', message: updated },
        })
      );
    }
    return updated;
  } catch (error) {
    console.error('updateMessage error:', error);
    throw error;
  }
}

/**
 * Upload attachment file (image, video, audio, document) to Cloudflare /api/chat/upload and IndexedDB
 */
export async function uploadAttachment(groupId, file, customFileName = null, onProgress = null) {
  try {
    const timestamp = Date.now();
    const randomId = Math.random().toString(36).slice(2, 8);
    const originalName = customFileName || file.name || `recording_${timestamp}`;
    const mimeType = inferMimeType(originalName, file.type);

    if (onProgress) onProgress(20);

    const blobToStore =
      file instanceof Blob && file.type === mimeType
        ? file
        : new Blob([file], { type: mimeType });

    // 1. Create immediate Blob URL for instant sender preview
    const localBlobUrl = URL.createObjectURL(blobToStore);

    // 2. Also save in local IndexedDB
    const mediaKey = `idb://media_${timestamp}_${randomId}`;
    memoryMediaUrls.set(mediaKey, localBlobUrl);
    saveBlobToIDB(mediaKey, blobToStore).catch(() => {});

    if (onProgress) onProgress(50);

    let cloudMediaUrl = null;

    // 3. Upload to Cloudflare /api/chat/upload for cross-device access
    try {
      const formData = new FormData();
      formData.append('file', blobToStore, originalName);

      const res = await fetch('/api/chat/upload', {
        method: 'POST',
        body: formData,
      });

      if (res.ok) {
        const data = await res.json();
        if (data && data.url) {
          cloudMediaUrl = data.url;
        }
      }
    } catch (netErr) {
      console.warn('Cloud upload fallback to local URL:', netErr);
    }

    if (onProgress) onProgress(100);

    const finalPath = cloudMediaUrl || mediaKey;
    const finalDisplayUrl = cloudMediaUrl || localBlobUrl;

    const fn = originalName.toLowerCase();
    const isAudio =
      mimeType.startsWith('audio/') ||
      fn.startsWith('audio_') ||
      fn.includes('audio');
    const isVideoNote =
      !isAudio &&
      (fn.includes('video_note') ||
        (fn.startsWith('video_') && !fn.includes('regular')));

    return {
      path: finalPath,
      file_url: finalPath,
      bucket: cloudMediaUrl ? 'cloudflare-r2' : 'local-idb',
      name: originalName,
      file_name: originalName,
      type: isAudio ? 'audio/webm' : (isVideoNote ? 'video/webm' : mimeType),
      file_type: isAudio ? 'audio/webm' : (isVideoNote ? 'video/webm' : mimeType),
      size: file.size || blobToStore.size || 0,
      file_size: file.size || blobToStore.size || 0,
      signedUrl: finalDisplayUrl,
      is_audio: isAudio,
      is_video_note: isVideoNote,
    };
  } catch (error) {
    console.error('uploadAttachment error:', error);
    throw error;
  }
}

export async function getSignedUrl(path) {
  if (!path) return '';
  if (path.startsWith('blob:') || path.startsWith('data:') || path.startsWith('http') || path.startsWith('/api/')) {
    return path;
  }
  if (path.startsWith('idb://')) {
    if (memoryMediaUrls.has(path)) {
      return memoryMediaUrls.get(path);
    }
    const blob = await getBlobFromIDB(path);
    if (blob) {
      const url = URL.createObjectURL(blob);
      memoryMediaUrls.set(path, url);
      return url;
    }
  }
  return path;
}

/**
 * Get unread message count for a group and user
 */
export async function getUnreadCount(groupId, userId) {
  try {
    const normalizedUserId = localStore.normalizeUserId(userId);
    const storageKey = `educo_chat_last_read_${normalizedUserId}_${groupId}`;
    const lastReadIso = localStorage.getItem(storageKey);

    const msgs = localStore
      .getChatMessages(groupId)
      .filter((m) => localStore.normalizeUserId(m.sender_id) !== normalizedUserId);

    if (!lastReadIso) return 0;
    const lastReadTime = new Date(lastReadIso).getTime();
    return msgs.filter((m) => new Date(m.created_at).getTime() > lastReadTime).length;
  } catch {
    return 0;
  }
}

/**
 * Mark a group's chat as read for the user
 */
export async function markAsRead(groupId, userId) {
  if (!groupId || !userId) return;
  const normalizedUserId = localStore.normalizeUserId(userId);
  const storageKey = `educo_chat_last_read_${normalizedUserId}_${groupId}`;
  localStorage.setItem(storageKey, new Date().toISOString());
}

/**
 * Mark an individual message as seen with user info
 */
export async function markMessageAsSeen(messageId, currentUser) {
  if (!messageId || !currentUser) return null;
  return localStore.markChatMessageSeen(messageId, currentUser);
}

/**
 * Mark all messages in a group as seen by current user
 */
export async function markAllMessagesAsSeen(groupId, currentUser) {
  if (!groupId || !currentUser) return;
  const isStaffChat = groupId === STAFF_CHAT_ID;
  const userRole = currentUser.role || currentUser.user_role || currentUser.user_metadata?.role || 'student';
  if (isStaffChat && !['owner', 'admin', 'teacher'].includes(userRole)) {
    // Strictly forbid students from staff chat seen receipts
    return;
  }
  const currentUserId = localStore.normalizeUserId(currentUser.id || currentUser.user_id);
  const msgs = localStore.getChatMessages(groupId);
  for (const msg of msgs) {
    if (localStore.normalizeUserId(msg.sender_id) !== currentUserId) {
      localStore.markChatMessageSeen(msg.id, currentUser);
    }
  }
}

/**
 * Subscribe to live message events (both same-tab custom events and cross-tab localStorage events)
 */
export function subscribeToMessages(groupId, callback) {
  if (!groupId) return null;

  const handleLocalEvent = (e) => {
    const detail = e.detail;
    if (!detail) return;
    if (detail.event === 'INSERT' && detail.groupId === groupId && detail.message) {
      callback({ event: 'INSERT', message: detail.message });
    } else if (detail.event === 'UPDATE' && detail.message) {
      callback({ event: 'UPDATE', message: detail.message });
    } else if (detail.event === 'DELETE' && detail.message) {
      callback({ event: 'DELETE', message: detail.message });
    }
  };

  const handleStorageEvent = (e) => {
    if (e.key === 'educo_db_chat_messages') {
      const latestMsgs = localStore.getChatMessages(groupId);
      if (latestMsgs.length > 0) {
        callback({ event: 'INSERT', message: latestMsgs[latestMsgs.length - 1] });
      }
    }
  };

  window.addEventListener('educo-chat-update', handleLocalEvent);
  window.addEventListener('storage', handleStorageEvent);

  return {
    unsubscribe() {
      window.removeEventListener('educo-chat-update', handleLocalEvent);
      window.removeEventListener('storage', handleStorageEvent);
    },
  };
}


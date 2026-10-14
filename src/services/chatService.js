import { localStore } from '@/lib/localStore';
import { useAuthStore } from '@/hooks/useAuth';

export const STAFF_CHAT_ID = 'staff-general-chat';

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

export function inferMimeType(fileName = '', fallbackType = '') {
  if (fallbackType && fallbackType !== 'application/octet-stream') {
    return fallbackType;
  }
  const lower = String(fileName || '').toLowerCase();
  if (lower.endsWith('.mp4') || lower.endsWith('.m4v')) return 'video/mp4';
  if (lower.endsWith('.webm')) return 'video/webm';
  if (lower.endsWith('.mov')) return 'video/quicktime';
  if (lower.endsWith('.mp3')) return 'audio/mpeg';
  if (lower.endsWith('.wav')) return 'audio/wav';
  if (lower.endsWith('.ogg') || lower.endsWith('.oga')) return 'audio/ogg';
  if (lower.endsWith('.m4a') || lower.endsWith('.aac')) return 'audio/mp4';
  if (lower.endsWith('.png')) return 'image/png';
  if (lower.endsWith('.jpg') || lower.endsWith('.jpeg')) return 'image/jpeg';
  if (lower.endsWith('.gif')) return 'image/gif';
  if (lower.endsWith('.webp')) return 'image/webp';
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
    const normalizedUserId = localStore.normalizeUserId(userId);
    const allGroups = localStore.getGroups();
    const allCourses = localStore.getCourses();
    const allMessages = localStore.getChatMessages();

    const enrichGroupCourse = (g) => {
      const course = allCourses.find((c) => c.id === g.course_id) || {
        id: g.course_id || 'crs',
        name: g.course_name || 'Oʻquv guruhi',
        color: '#123D78',
      };
      return {
        ...g,
        course,
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
      // Student: only study groups (never staff chat)
      const memberships = localStore.getItem('educo_db_memberships', []);
      const enrolledIds = memberships
        .filter((m) => localStore.normalizeUserId(m.student_id) === normalizedUserId && m.is_active !== false)
        .map((m) => m.group_id);

      const studentGroups =
        enrolledIds.length > 0
          ? allGroups.filter((g) => enrolledIds.includes(g.id))
          : allGroups.slice(0, 1);

      accessibleStudyGroups = studentGroups.map(enrichGroupCourse);
    }

    const chatRooms = [...accessibleStudyGroups];

    // Add Official Staff Chat ("Xodimlar chati") for Owner, Admin, and Teacher
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

    // Keep pinned (Staff Chat) at top, then sort rest by most recent message
    groupsWithChatMeta.sort((a, b) => {
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
          att.file_type = inferMimeType(att.file_name, att.file_type);
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
      const replyMeta = JSON.stringify({
        reply_to_id: replyPayload.id,
        sender_name: replyPayload.senderName || replyPayload.sender?.first_name || 'Foydalanuvchi',
        preview: (replyPayload.message || replyPayload.text || '').slice(0, 100),
      });
      finalMessage = `<!--REPLY:${replyMeta}-->\n${textMessage}`;
    }

    // Store lightweight attachment keys in localStorage, while keeping live signedUrl for UI
    const formattedAttachmentsForStorage = (attachmentsList || []).map((att, idx) => {
      const fileName = att.file_name || att.name || 'file';
      const mimeType = inferMimeType(fileName, att.file_type || att.type);
      return {
        id: `att-${Date.now()}-${idx}`,
        file_url: att.file_url || att.path || att.signedUrl,
        file_name: fileName,
        file_type: mimeType,
        file_size: att.file_size || att.size || 0,
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

    // Notify listeners in current tab
    window.dispatchEvent(
      new CustomEvent('educo-chat-update', {
        detail: { event: 'INSERT', groupId, message: savedMsg },
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
 * Upload attachment file (image, video, audio, document) to IndexedDB + Memory URL cache
 */
export async function uploadAttachment(groupId, file, customFileName = null, onProgress = null) {
  try {
    const timestamp = Date.now();
    const randomId = Math.random().toString(36).slice(2, 8);
    const originalName = customFileName || file.name || `recording_${timestamp}`;
    const mimeType = inferMimeType(originalName, file.type);

    if (onProgress) onProgress(30);

    const mediaKey = `idb://media_${timestamp}_${randomId}`;
    const blobToStore =
      file instanceof Blob && file.type === mimeType
        ? file
        : new Blob([file], { type: mimeType });

    // Create immediate Blob URL in memory
    const blobUrl = URL.createObjectURL(blobToStore);
    memoryMediaUrls.set(mediaKey, blobUrl);

    // Persist in IndexedDB for page reloads
    await saveBlobToIDB(mediaKey, blobToStore);

    if (onProgress) onProgress(100);

    return {
      path: mediaKey,
      bucket: 'local-idb',
      name: originalName,
      type: mimeType,
      size: file.size || blobToStore.size || 0,
      signedUrl: blobUrl,
    };
  } catch (error) {
    console.error('uploadAttachment error:', error);
    throw error;
  }
}

export async function getSignedUrl(path) {
  if (!path) return '';
  if (path.startsWith('blob:') || path.startsWith('data:') || path.startsWith('http')) {
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
 * Subscribe to live message events (both same-tab custom events and cross-tab localStorage events)
 */
export function subscribeToMessages(groupId, callback) {
  if (!groupId) return null;

  const handleLocalEvent = (e) => {
    const detail = e.detail;
    if (!detail) return;
    if (detail.event === 'INSERT' && detail.groupId === groupId && detail.message) {
      callback({ event: 'INSERT', message: detail.message });
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


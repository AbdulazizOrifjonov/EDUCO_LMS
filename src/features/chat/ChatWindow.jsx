import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  Users,
  Briefcase,
  ChevronDown,
  ChevronUp,
  ChevronRight,
  ArrowDown,
  Loader2,
  AlertCircle,
  MessageSquare,
  ArrowLeft,
  Info,
  Eye,
  X,
  CheckCheck,
  Megaphone,
  Lock,
  Camera,
  Trash2,
  Pin,
  Forward,
  Search,
  Bell,
  BellOff,
  Copy,
  QrCode,
  FileText,
  Image as ImageIcon,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from '@/components/ui/Toast';
import { useTwoStepConfirm } from '@/context/ConfirmContext';
import { localStore } from '@/lib/localStore';
import MessageBubble from './MessageBubble';
import ChatInput from './ChatInput';
import ImagePreview from './ImagePreview';
import { uploadGroupAvatar } from '@/services/groupService';
import ImageCropperModal from '@/components/ui/ImageCropperModal';
import {
  getMessages,
  sendMessage,
  updateMessage,
  deleteMessage,
  clearChatHistory,
  uploadAttachment,
  subscribeToMessages,
  markAsRead,
  markAllMessagesAsSeen,
} from '@/services/chatService';

export default function ChatWindow({
  activeGroup,
  currentUser,
  userRole,
  allGroups = [],
  onBackToList,
}) {
  const { t } = useTranslation();
  const { confirmDelete } = useTwoStepConfirm();

  const [messages, setMessages] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const [hasMoreOlder, setHasMoreOlder] = useState(true);
  const [replyingTo, setReplyingTo] = useState(null);
  const [editingMessage, setEditingMessage] = useState(null);
  const [previewImageSrc, setPreviewImageSrc] = useState(null);
  const [showStaffList, setShowStaffList] = useState(false);
  const [seenModalMessage, setSeenModalMessage] = useState(null);
  const [forwardModalMessage, setForwardModalMessage] = useState(null);

  const [isScrolledUp, setIsScrolledUp] = useState(false);
  const [newMessagesBadge, setNewMessagesBadge] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(null);

  // In-Chat Search & Group Info States (Telegram-style)
  const [isSearching, setIsSearching] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchMatchIndex, setSearchMatchIndex] = useState(0);
  const [showGroupInfoModal, setShowGroupInfoModal] = useState(false);
  const [isMuted, setIsMuted] = useState(() => {
    try {
      return localStorage.getItem(`educo_mute_${activeGroup?.id}`) === 'true';
    } catch (_) {
      return false;
    }
  });

  const toggleMute = () => {
    setIsMuted((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(`educo_mute_${activeGroup?.id}`, String(next));
      } catch (_) {}
      toast.success(
        next
          ? "Guruh bildirishnomalari o'chirildi (Mute)"
          : "Guruh bildirishnomalari yoqildi"
      );
      return next;
    });
  };

  // Group Avatar State
  const [activeGroupAvatar, setActiveGroupAvatar] = useState(
    activeGroup?.avatar_url || activeGroup?.image_url || ''
  );
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [cropModalFile, setCropModalFile] = useState(null);

  useEffect(() => {
    setActiveGroupAvatar(activeGroup?.avatar_url || activeGroup?.image_url || '');
  }, [activeGroup?.id, activeGroup?.avatar_url, activeGroup?.image_url]);

  useEffect(() => {
    const handleGroupUpdated = (e) => {
      if (e.detail?.groupId === activeGroup?.id) {
        if (e.detail?.avatar_url !== undefined) {
          setActiveGroupAvatar(e.detail.avatar_url);
        } else if (e.detail?.group?.avatar_url !== undefined) {
          setActiveGroupAvatar(e.detail.group.avatar_url);
        }
      }
    };
    window.addEventListener('educo_group_updated', handleGroupUpdated);
    return () => window.removeEventListener('educo_group_updated', handleGroupUpdated);
  }, [activeGroup?.id]);

  const handleGroupAvatarSelect = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setCropModalFile(file);
    }
    e.target.value = '';
  };

  const handleApplyCroppedGroupAvatar = async (croppedDataUrl, croppedFile) => {
    setCropModalFile(null);
    if (!activeGroup?.id) return;
    try {
      setAvatarUploading(true);
      const url = await uploadGroupAvatar(activeGroup.id, croppedFile || croppedDataUrl);
      setActiveGroupAvatar(url);
      if (activeGroup) {
        activeGroup.avatar_url = url;
        activeGroup.image_url = url;
      }
      toast.success(t('groups.avatarUpdated', "Guruh profil rasmi muvaffaqiyatli o'rnatildi!"));
    } catch (err) {
      console.error('Group avatar upload failed:', err);
      toast.error(t('groups.avatarFailed', "Rasmni yuklab bo'lmadi"));
    } finally {
      setAvatarUploading(false);
    }
  };

  const handleRemoveGroupAvatar = async () => {
    if (!activeGroup?.id) return;
    const ok = await confirmDelete({
      title: 'Guruh rasmini olib tashlash',
      itemName: activeGroup.name,
      description: 'Guruhning asosiy profil rasmi o‘chiriladi.',
      confirmButtonText: 'Ha, rasm olib tashlansin',
    });
    if (!ok) return;
    try {
      setAvatarUploading(true);
      await uploadGroupAvatar(activeGroup.id, null);
      setActiveGroupAvatar('');
      if (activeGroup) {
        activeGroup.avatar_url = null;
        activeGroup.image_url = null;
      }
      toast.success(t('groups.avatarRemoved', "Guruh profil rasmi olib tashlandi"));
    } catch (err) {
      console.error('Remove avatar error:', err);
    } finally {
      setAvatarUploading(false);
    }
  };

  const isStaffUser = ['owner', 'admin', 'teacher'].includes(userRole);
  const isStaffChat = Boolean(activeGroup?.isStaffChat || activeGroup?.id === 'staff-general-chat');

  // Telegram-style Member count and dynamic online count
  const groupMembersCount = useMemo(() => {
    if (!activeGroup) return 0;
    if (activeGroup.isStaffChat) {
      return activeGroup.staffMembers?.length || 2;
    }
    if (activeGroup.isAnnouncementChat) {
      return 'Barcha a‘zolar';
    }
    const groupStudents = activeGroup.group_students || [];
    const teacherCount = activeGroup.teacher_id ? 1 : 0;
    return Math.max(1, groupStudents.length + teacherCount);
  }, [activeGroup]);

  const onlineCount = useMemo(() => {
    if (typeof groupMembersCount === 'number') {
      return Math.max(1, Math.min(groupMembersCount, Math.ceil(groupMembersCount * 0.4)));
    }
    return 3;
  }, [groupMembersCount]);

  const canClearHistory = userRole === 'owner' || userRole === 'admin';
  const [showClearHistoryModal, setShowClearHistoryModal] = useState(false);
  const [isClearingHistory, setIsClearingHistory] = useState(false);
  const [messageToDeleteId, setMessageToDeleteId] = useState(null);

  const handleClearHistory = async () => {
    if (!activeGroup?.id) return;
    setIsClearingHistory(true);
    try {
      await clearChatHistory(activeGroup.id);
      setMessages([]);
      setShowClearHistoryModal(false);
      toast.success(t('chat.historyCleared', 'Chat tarixi muvaffaqiyatli tozalandi!'));
    } catch (err) {
      console.error('Failed to clear history:', err);
      toast.error('Chat tarixini tozalashda xatolik yuz berdi');
    } finally {
      setIsClearingHistory(false);
    }
  };

  const messagesContainerRef = useRef(null);
  const isInitialLoadRef = useRef(true);
  const currentGroupIdRef = useRef(activeGroup?.id);

  currentGroupIdRef.current = activeGroup?.id;

  const scrollToBottom = () => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
    setIsScrolledUp(false);
    setNewMessagesBadge(false);
  };

  const scrollToBottomSmooth = () => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTo({
        top: messagesContainerRef.current.scrollHeight,
        behavior: 'smooth',
      });
    }
    setIsScrolledUp(false);
    setNewMessagesBadge(false);
  };

  // Load message history & subscribe to Realtime
  useEffect(() => {
    if (!activeGroup?.id || (isStaffChat && userRole === 'student')) {
      setMessages([]);
      setLoadingHistory(false);
      return;
    }

    setLoadingHistory(true);
    setHasMoreOlder(true);
    isInitialLoadRef.current = true;

    // Fetch initial messages
    getMessages(activeGroup.id, { limit: 40, offset: 0 })
      .then((data) => {
        setMessages(data);
        setLoadingHistory(false);
        if (currentUser?.id) {
          markAsRead(activeGroup.id, currentUser.id);
        }
        // Check if there may be more messages
        if (data.length < 40) {
          setHasMoreOlder(false);
        }
      })
      .catch((err) => {
        console.error('Error fetching messages:', err);
        setLoadingHistory(false);
      });

    // Realtime subscription
    const channel = subscribeToMessages(activeGroup.id, (payload) => {
      if (payload.event === 'INSERT' && payload.message) {
        setMessages((prev) => {
          // Prevent duplicates
          if (prev.some((m) => m.id === payload.message.id)) {
            return prev;
          }
          return [...prev, payload.message];
        });

        if (currentUser?.id) {
          markAsRead(activeGroup.id, currentUser.id);
        }

        // Check if user is scrolled up
        if (messagesContainerRef.current) {
          const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current;
          const distanceToBottom = scrollHeight - (scrollTop + clientHeight);
          if (distanceToBottom > 150) {
            setNewMessagesBadge(true);
          } else {
            scrollToBottomSmooth();
          }
        }
      } else if (payload.event === 'UPDATE' && payload.message) {
        setMessages((prev) =>
          prev.map((m) => (m.id === payload.message.id ? { ...m, ...payload.message } : m))
        );
      } else if (payload.event === 'DELETE' && payload.message) {
        setMessages((prev) => prev.filter((m) => m.id !== payload.message.id));
      } else if (payload.event === 'CLEAR_HISTORY') {
        if (!payload.groupId || String(payload.groupId) === String(activeGroup.id)) {
          setMessages([]);
        }
      }
    });

    // Active Chat High-Frequency Poller (every 1s while user is viewing chat room)
    let isPolling = false;
    const syncAndRefresh = async () => {
      if (isPolling) return;
      if (typeof document !== 'undefined' && document.hidden) return;
      isPolling = true;
      try {
        await localStore.syncWithServer();
        if (activeGroup?.id) {
          const fresh = localStore.getChatMessages(activeGroup.id);
          setMessages((prev) => {
            const hasChanged =
              fresh.length !== prev.length ||
              fresh.some((m, i) => {
                const p = prev[i];
                if (!p || p.id !== m.id) return true;
                if (p.updated_at !== m.updated_at) return true;
                if (JSON.stringify(p.reactions || []) !== JSON.stringify(m.reactions || [])) return true;
                if ((p.seen_by?.length || 0) !== (m.seen_by?.length || 0)) return true;
                return false;
              });

            if (hasChanged) {
              const isNewMessageAtBottom =
                fresh.length > prev.length ||
                (fresh.length > 0 && fresh[fresh.length - 1]?.id !== prev[prev.length - 1]?.id);

              if (isNewMessageAtBottom) {
                setTimeout(() => {
                  if (messagesContainerRef.current) {
                    const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current;
                    const distanceToBottom = scrollHeight - (scrollTop + clientHeight);
                    if (distanceToBottom < 200) {
                      scrollToBottomSmooth();
                    } else {
                      setNewMessagesBadge(true);
                    }
                  }
                }, 50);
              }
              return fresh;
            }
            return prev;
          });
        }
      } catch (_) {}
      isPolling = false;
    };

    const chatPollTimer = setInterval(syncAndRefresh, 1000);

    const handleSyncEvent = () => {
      if (activeGroup?.id) {
        const fresh = localStore.getChatMessages(activeGroup.id);
        setMessages((prev) => {
          const hasChanged =
            fresh.length !== prev.length ||
            fresh.some((m, i) => {
              const p = prev[i];
              if (!p || p.id !== m.id) return true;
              if (p.updated_at !== m.updated_at) return true;
              if (JSON.stringify(p.reactions || []) !== JSON.stringify(m.reactions || [])) return true;
              if ((p.seen_by?.length || 0) !== (m.seen_by?.length || 0)) return true;
              return false;
            });

          if (hasChanged) {
            const isNewMessageAtBottom =
              fresh.length > prev.length ||
              (fresh.length > 0 && fresh[fresh.length - 1]?.id !== prev[prev.length - 1]?.id);

            if (isNewMessageAtBottom) {
              setTimeout(() => {
                if (messagesContainerRef.current) {
                  const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current;
                  const distanceToBottom = scrollHeight - (scrollTop + clientHeight);
                  if (distanceToBottom < 200) {
                    scrollToBottomSmooth();
                  } else {
                    setNewMessagesBadge(true);
                  }
                }
              }, 50);
            }
            return fresh;
          }
          return prev;
        });
      }
    };

    window.addEventListener('educo-data-sync', handleSyncEvent);
    window.addEventListener('educo-chat-update', handleSyncEvent);

    return () => {
      clearInterval(chatPollTimer);
      window.removeEventListener('educo-data-sync', handleSyncEvent);
      window.removeEventListener('educo-chat-update', handleSyncEvent);
      if (channel) {
        channel.unsubscribe();
      }
    };
  }, [activeGroup?.id, currentUser?.id]);

  // Scroll to bottom on initial message load
  useEffect(() => {
    if (!loadingHistory && messages.length > 0 && isInitialLoadRef.current) {
      scrollToBottom();
      isInitialLoadRef.current = false;
    }
  }, [loadingHistory, messages]);

  // Auto-mark messages as seen when chat is active
  useEffect(() => {
    if (activeGroup?.id && currentUser && messages.length > 0) {
      if (isStaffChat && userRole === 'student') return;
      markAllMessagesAsSeen(activeGroup.id, currentUser);
    }
  }, [activeGroup?.id, currentUser, messages.length, isStaffChat, userRole]);



  const handleScroll = async () => {
    if (!messagesContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current;
    const distanceToBottom = scrollHeight - (scrollTop + clientHeight);

    setIsScrolledUp(distanceToBottom > 150);
    if (distanceToBottom <= 80) {
      setNewMessagesBadge(false);
    }

    // Infinite scroll: Load older messages when scrolling near top
    if (scrollTop <= 30 && !loadingOlder && hasMoreOlder && messages.length > 0) {
      setLoadingOlder(true);
      const currentScrollHeight = scrollHeight;

      try {
        const older = await getMessages(activeGroup.id, {
          limit: 30,
          offset: messages.length,
        });

        if (!older || older.length === 0) {
          setHasMoreOlder(false);
        } else {
          setMessages((prev) => [...older, ...prev]);
          if (older.length < 30) {
            setHasMoreOlder(false);
          }
          // Maintain scroll position after prepending older messages
          requestAnimationFrame(() => {
            if (messagesContainerRef.current) {
              const newScrollHeight = messagesContainerRef.current.scrollHeight;
              messagesContainerRef.current.scrollTop = newScrollHeight - currentScrollHeight;
            }
          });
        }
      } catch (err) {
        console.error('Failed to load older messages:', err);
      } finally {
        setLoadingOlder(false);
      }
    }
  };

  const handleSendMessage = async ({ text, files, replyTo, isEdit, editingMessageId }) => {
    if (!activeGroup?.id) return;

    // Telegram-style Message Edit
    if (isEdit && editingMessageId) {
      try {
        const updated = await updateMessage(editingMessageId, text);
        if (updated) {
          setMessages((prev) =>
            prev.map((m) =>
              m.id === editingMessageId
                ? {
                    ...m,
                    ...updated,
                    message: text,
                    is_edited: true,
                    edited_at: new Date().toISOString(),
                  }
                : m
            )
          );
          toast.success("Xabar muvaffaqiyatli tahrirlandi");
        }
      } catch (err) {
        console.error('Failed to update message:', err);
        toast.error("Xabarni tahrirlashda xatolik yuz berdi");
      } finally {
        setEditingMessage(null);
      }
      return;
    }

    try {
      setUploading(true);
      let attachmentsData = [];

      if (files && files.length > 0) {
        setUploadProgress(10);
        for (let i = 0; i < files.length; i++) {
          const file = files[i];
          const uploadRes = await uploadAttachment(
            activeGroup.id,
            file,
            file.name,
            (pct) => setUploadProgress(Math.round(((i + pct / 100) / files.length) * 100))
          );
          attachmentsData.push({
            file_url: uploadRes.path,
            file_name: uploadRes.name,
            file_type: uploadRes.type,
            file_size: uploadRes.size,
            signedUrl: uploadRes.signedUrl,
          });
        }
      }

      setUploadProgress(95);

      const sentMsg = await sendMessage(
        activeGroup.id,
        {
          text,
          replyTo,
          attachments: attachmentsData,
        },
        replyTo
      );

      // Append locally if not already received by realtime channel
      if (sentMsg) {
        setMessages((prev) => {
          if (prev.some((m) => m.id === sentMsg.id)) return prev;
          return [...prev, sentMsg];
        });
      }

      scrollToBottomSmooth();
      setReplyingTo(null);

      if (activeGroup?.isAnnouncementChat) {
        toast.success("E'lon barcha o'quv guruhlari va xodimlar chatiga darhol tarqatildi!");
      }
    } catch (err) {
      console.error('Failed to send message:', err);
      alert(t('chat.uploadFailed', 'Failed to send message or upload attachments.'));
    } finally {
      setUploading(false);
      setUploadProgress(null);
    }
  };

  const handleDeleteMessage = (messageId) => {
    setMessageToDeleteId(messageId);
  };

  const confirmDeleteChatMsg = async () => {
    if (!messageToDeleteId) return;
    const id = messageToDeleteId;
    setMessageToDeleteId(null);
    try {
      setMessages((prev) => prev.filter((m) => String(m.id) !== String(id)));
      await deleteMessage(id);
      toast.success('Xabar o‘chirildi');
    } catch (err) {
      console.error('Failed to delete message:', err);
      toast.error('Xabarni o‘chirishda xatolik yuz berdi');
    }
  };

  const handleToggleReaction = async (messageId, emoji) => {
    if (!currentUser?.id || !messageId) return;
    try {
      const updated = localStore.toggleMessageReaction(messageId, emoji, currentUser.id);
      if (updated) {
        setMessages((prev) =>
          prev.map((m) => (String(m.id) === String(messageId) ? { ...m, reactions: updated.reactions } : m))
        );
      }
    } catch (err) {
      console.error('Failed to toggle reaction:', err);
    }
  };

  const handlePinMessage = async (msg) => {
    if (!msg?.id) return;
    try {
      const newPinned = !msg.is_pinned;
      await updateMessage(msg.id, { is_pinned: newPinned });
      setMessages((prev) =>
        prev.map((m) => (m.id === msg.id ? { ...m, is_pinned: newPinned } : m))
      );
      toast.success(newPinned ? 'Xabar chatga qadab qo‘yildi 📌' : 'Xabar qadashdan olindi');
    } catch (err) {
      console.error('Failed to pin message:', err);
      toast.error('Xabarni qadashda xatolik yuz berdi');
    }
  };

  const handleForwardMessage = (msg) => {
    setForwardModalMessage(msg);
  };

  const handleConfirmForward = async (targetGroupId) => {
    if (!forwardModalMessage || !targetGroupId) return;
    try {
      const forwardPrefix = forwardModalMessage.sender?.first_name
        ? `↪ Uzatilgan xabar (${forwardModalMessage.sender.first_name}):\n`
        : '↪ Uzatilgan xabar:\n';
      const cleanText = forwardModalMessage.message
        ? `${forwardPrefix}${forwardModalMessage.message}`
        : '';
      await sendMessage({
        groupId: targetGroupId,
        senderId: currentUser.id,
        text: cleanText,
        attachments: forwardModalMessage.chat_attachments || [],
      });
      setForwardModalMessage(null);
      toast.success('Xabar muvaffaqiyatli uzatildi! 🚀');
    } catch (err) {
      console.error('Failed to forward message:', err);
      toast.error('Xabarni uzatishda xatolik yuz berdi');
    }
  };

  const pinnedMessage = useMemo(() => {
    return messages.filter((m) => m.is_pinned).slice(-1)[0] || null;
  }, [messages]);

  // Telegram-style Search Matches (Searching message text, sender name, and attachment names)
  const searchMatches = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return [];
    return messages
      .map((msg, index) => {
        const text = (msg.message || '').toLowerCase();
        const attachmentsText = (msg.chat_attachments || [])
          .map((a) => (a.file_name || '').toLowerCase())
          .join(' ');
        const senderName = `${msg.sender?.first_name || ''} ${msg.sender?.last_name || ''}`.toLowerCase();
        if (text.includes(q) || attachmentsText.includes(q) || senderName.includes(q)) {
          return { id: msg.id, index };
        }
        return null;
      })
      .filter(Boolean);
  }, [messages, searchQuery]);

  const scrollToMessage = useCallback((msgId) => {
    const el = document.getElementById(`msg-${msgId}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      el.classList.add('ring-4', 'ring-amber-500/70', 'bg-amber-500/10', 'transition-all');
      setTimeout(() => {
        el.classList.remove('ring-4', 'ring-amber-500/70', 'bg-amber-500/10');
      }, 2000);
    }
  }, []);

  const handleNextMatch = () => {
    if (searchMatches.length === 0) return;
    const nextIndex = (searchMatchIndex + 1) % searchMatches.length;
    setSearchMatchIndex(nextIndex);
    scrollToMessage(searchMatches[nextIndex].id);
  };

  const handlePrevMatch = () => {
    if (searchMatches.length === 0) return;
    const prevIndex = (searchMatchIndex - 1 + searchMatches.length) % searchMatches.length;
    setSearchMatchIndex(prevIndex);
    scrollToMessage(searchMatches[prevIndex].id);
  };

  useEffect(() => {
    if (searchMatches.length > 0) {
      setSearchMatchIndex(0);
      scrollToMessage(searchMatches[0].id);
    }
  }, [searchQuery, searchMatches, scrollToMessage]);

  // Media & Docs counts for Group Info Drawer (Screenshot 1)
  const { mediaCount, docsCount } = useMemo(() => {
    let media = 0;
    let docs = 0;
    messages.forEach((m) => {
      (m.chat_attachments || []).forEach((att) => {
        const type = (att.file_type || '').toLowerCase();
        const name = (att.file_name || '').toLowerCase();
        if (
          type.startsWith('image/') ||
          type.startsWith('video/') ||
          /\.(png|jpg|jpeg|gif|webp|mp4|webm|mov|mkv)$/i.test(name)
        ) {
          media++;
        } else {
          docs++;
        }
      });
    });
    return { mediaCount: media, docsCount: docs };
  }, [messages]);

  if (!activeGroup) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-gray-50 dark:bg-gray-900/50">
        <div className="w-16 h-16 rounded-full bg-blue-50 dark:bg-gray-800 flex items-center justify-center text-[#123D78] dark:text-blue-400 mb-4 shadow-sm">
          <MessageSquare className="w-8 h-8" />
        </div>
        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
          {t('chat.selectGroup', 'Select a group to start chatting')}
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 max-w-sm mt-1">
          Choose a group from the list on the left to see course discussions, announcements, and recorded video messages.
        </p>
      </div>
    );
  }

  // SECURITY GUARD: If active group is staff chat and current user is a student, BLOCK completely!
  if (isStaffChat && userRole === 'student') {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-gray-50 dark:bg-gray-900/50">
        <div className="w-16 h-16 rounded-3xl bg-rose-50 dark:bg-rose-950/50 flex items-center justify-center text-rose-600 dark:text-rose-400 mb-4 shadow-sm border border-rose-200 dark:border-rose-900/60">
          <Lock className="w-8 h-8" />
        </div>
        <h3 className="text-lg font-bold text-gray-900 dark:text-white">
          Ruxsat cheklangan
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 max-w-sm mt-1">
          Ushbu guruh faqat o‘quv markazi xodimlari (Boshliq, Adminlar va O‘qituvchilar) uchun mo‘ljallangan. O‘quvchilar bu chatga kira olmaydi.
        </p>
        {onBackToList && (
          <button
            type="button"
            onClick={onBackToList}
            className="mt-4 px-4 py-2 bg-[#123D78] hover:bg-[#0e2f5d] text-white text-xs font-semibold rounded-xl shadow-xs transition-colors"
          >
            Guruhlar ro‘yxatiga qaytish
          </button>
        )}
      </div>
    );
  }

  const courseColor = activeGroup.course?.color || '#123D78';

  return (
    <div
      style={{ height: '100%', minHeight: 0 }}
      className="flex-1 min-h-0 min-w-0 max-w-full flex flex-col h-full bg-[#F5F7FA] dark:bg-[#101827] relative overflow-hidden"
    >
      {/* Chat Header (Telegram 1-to-1 Style) */}
      <div className="h-14 sm:h-16 px-3 sm:px-5 flex items-center justify-between bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 shadow-xs z-10 shrink-0">
        <div className="flex items-center space-x-2.5 sm:space-x-3 rtl:space-x-reverse min-w-0">
          {/* Mobile Back Button */}
          <button
            type="button"
            onClick={onBackToList}
            className="md:hidden -ml-1 p-2 rounded-xl text-gray-700 hover:text-gray-900 dark:text-gray-200 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors shrink-0"
            title="Guruhlar ro'yxatiga qaytish"
          >
            <ArrowLeft className="w-5 h-5 rtl:rotate-180" />
          </button>

          {/* Group Avatar (Click opens Guruh ma'lumotlari modal) */}
          <div
            onClick={() => setShowGroupInfoModal(true)}
            className="cursor-pointer transition-transform hover:scale-105 active:scale-95 shrink-0"
            title="Guruh ma'lumotlarini ko'rish"
          >
            {activeGroup.isAnnouncementChat ? (
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white shadow-sm flex-shrink-0 ring-2 ring-emerald-400/40">
                <Megaphone className="w-5 h-5" />
              </div>
            ) : activeGroup.isStaffChat ? (
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#064e3b] to-emerald-700 flex items-center justify-center text-white shadow-sm flex-shrink-0 ring-2 ring-amber-400/50">
                <Briefcase className="w-5 h-5" />
              </div>
            ) : (
              <div className="relative group/avatar shrink-0">
                <div
                  className="w-10 h-10 rounded-2xl overflow-hidden flex items-center justify-center text-white font-bold text-sm shadow-sm border border-black/5 dark:border-white/10"
                  style={{ backgroundColor: courseColor }}
                >
                  {activeGroupAvatar ? (
                    <img
                      src={activeGroupAvatar}
                      alt={activeGroup.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    activeGroup.name?.charAt(0) || 'G'
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Group Title & Subtitle (Click opens Guruh ma'lumotlari modal) */}
          <div
            onClick={() => setShowGroupInfoModal(true)}
            className="min-w-0 cursor-pointer group/title"
            title="Guruh ma'lumotlarini ko'rish"
          >
            <div className="flex items-center gap-2">
              <h2 className="text-sm sm:text-base font-bold text-gray-900 dark:text-white truncate group-hover/title:text-blue-600 dark:group-hover/title:text-emerald-400 transition-colors">
                {activeGroup.name}
              </h2>
              {activeGroup.isAnnouncementChat ? (
                <span className="px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase tracking-wider bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 flex items-center gap-1 border border-emerald-300/40">
                  <Megaphone className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                  Broadcast
                </span>
              ) : activeGroup.isStaffChat ? (
                <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300">
                  Xodimlar
                </span>
              ) : null}
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 truncate flex items-center gap-1.5 mt-0.5">
              {activeGroup.isAnnouncementChat ? (
                <span>Rasmiy e&apos;lonlar kanali • Barcha a&apos;zolar</span>
              ) : (
                <>
                  <span>{typeof groupMembersCount === 'number' ? `${groupMembersCount} ta a'zo` : groupMembersCount}</span>
                  <span>•</span>
                  <span className="text-emerald-600 dark:text-emerald-400 font-semibold inline-flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    {onlineCount} ta onlayn
                  </span>
                </>
              )}
            </p>
          </div>
        </div>

        {/* Telegram Header Action Controls: Search, Mute, Info, Camera */}
        <div className="flex items-center space-x-1 sm:space-x-1.5 rtl:space-x-reverse shrink-0">
          {/* Telegram In-Chat Search Button */}
          <button
            type="button"
            onClick={() => {
              setIsSearching((prev) => !prev);
              if (isSearching) setSearchQuery('');
            }}
            className={`p-2 rounded-xl transition-colors cursor-pointer ${
              isSearching
                ? 'bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400'
                : 'text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800'
            }`}
            title="Xabarlarni qidirish (Telegram)"
          >
            <Search className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>

          {/* Mute Notifications Button */}
          <button
            type="button"
            onClick={toggleMute}
            className={`p-2 rounded-xl transition-colors cursor-pointer ${
              isMuted
                ? 'text-rose-500 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100'
                : 'text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800'
            }`}
            title={isMuted ? "Ovozni yoqish" : "Ovozni o‘chirish (Mute)"}
          >
            {isMuted ? (
              <BellOff className="w-4 h-4 sm:w-5 sm:h-5 text-rose-500" />
            ) : (
              <Bell className="w-4 h-4 sm:w-5 sm:h-5" />
            )}
          </button>

          {/* Group Info Drawer Button */}
          <button
            type="button"
            onClick={() => setShowGroupInfoModal(true)}
            className="p-2 rounded-xl text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer"
            title="Guruh ma'lumotlari (A'zolar, Media, Qadalgan xabarlar)"
          >
            <Info className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>

          {/* Group Avatar Upload for Staff */}
          {isStaffUser && !activeGroup.isAnnouncementChat && (
            <label
              title="Guruh profiliga rasm qo‘yish"
              className="p-2 rounded-xl text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer"
            >
              <Camera className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-600 dark:text-emerald-400" />
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleGroupAvatarSelect}
                disabled={avatarUploading}
              />
            </label>
          )}
        </div>
      </div>

      {/* Telegram-Style In-Chat Search Bar */}
      {isSearching && (
        <div className="px-3 sm:px-6 py-2 bg-white/95 dark:bg-gray-900/95 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between gap-2 shadow-xs z-20 animate-in fade-in slide-in-from-top-1 duration-150 shrink-0">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <Search className="w-4 h-4 text-blue-600 dark:text-emerald-400 shrink-0" />
            <input
              type="text"
              autoFocus
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Xabarlarni qidirish... (so'z yoki ism kiriting)"
              className="w-full bg-transparent border-0 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-0 py-1"
            />
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {searchQuery.trim() && (
              <span className="text-xs px-2 py-0.5 rounded-md font-mono font-semibold bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300">
                {searchMatches.length > 0
                  ? `${searchMatchIndex + 1} / ${searchMatches.length}`
                  : "0 ta topildi"}
              </span>
            )}

            {searchMatches.length > 0 && (
              <>
                <button
                  type="button"
                  onClick={handlePrevMatch}
                  className="p-1 rounded-lg text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800 transition-colors cursor-pointer"
                  title="Oldingi xabar"
                >
                  <ChevronUp className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={handleNextMatch}
                  className="p-1 rounded-lg text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800 transition-colors cursor-pointer"
                  title="Keyingi xabar"
                >
                  <ChevronDown className="w-4 h-4" />
                </button>
              </>
            )}

            <button
              type="button"
              onClick={() => {
                setIsSearching(false);
                setSearchQuery('');
              }}
              className="p-1 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors ml-1 cursor-pointer"
              title="Qidiruvni yopish"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Top Banner Notice for Announcements Chat */}
      {activeGroup.isAnnouncementChat && (
        <div className="mx-3 sm:mx-6 mt-3 mb-1 px-4 py-2.5 bg-emerald-500/10 dark:bg-emerald-500/15 border border-emerald-500/30 dark:border-emerald-500/35 rounded-2xl flex items-center justify-between text-xs font-semibold text-emerald-950 dark:text-emerald-200 shrink-0 shadow-xs">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-6 h-6 rounded-lg bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
              <Megaphone className="w-3.5 h-3.5" />
            </div>
            <span className="truncate sm:whitespace-normal">
              <strong>Umumiy E&apos;lonlar kanali:</strong> Bu yerga yozilgan xabar darhol <strong>Xodimlar chati</strong> va barcha <strong>o&apos;quv guruhlariga</strong> bir vaqtda avtomatik tarqatiladi!
            </span>
          </div>
          <span className="hidden md:inline-flex px-2.5 py-1 rounded-xl bg-emerald-600 text-white text-[10px] font-black uppercase tracking-wider shrink-0 shadow-xs ml-3">
            1 marta yoziladi &rarr; Hammaga boradi
          </span>
        </div>
      )}

      {/* Expandable Staff Members Strip for Xodimlar chati */}
      {activeGroup.isStaffChat && showStaffList && (
        <div className="px-4 py-3 bg-indigo-50/70 dark:bg-gray-800/90 border-b border-indigo-100 dark:border-gray-700 flex flex-wrap items-center gap-2 z-10 shrink-0">
          <span className="text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mr-1">
            Guruh a&apos;zolari:
          </span>
          {(activeGroup.staffMembers || []).map((member) => {
            const roleLabel =
              member.role === 'owner'
                ? 'Owner'
                : member.role === 'admin'
                ? 'Admin'
                : 'Oʻqituvchi';
            const badgeColor =
              member.role === 'owner'
                ? 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950/60 dark:text-amber-300'
                : member.role === 'admin'
                ? 'bg-purple-100 text-purple-800 border-purple-300 dark:bg-purple-950/60 dark:text-purple-300'
                : 'bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-950/60 dark:text-blue-300';
            return (
              <div
                key={member.id}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-xs shadow-2xs"
              >
                <span className="font-semibold text-gray-800 dark:text-gray-200">
                  {member.first_name} {member.last_name}
                </span>
                <span className={`px-1.5 py-0.2 rounded text-[10px] font-bold border ${badgeColor}`}>
                  {roleLabel}
                </span>
              </div>
            );
          })}
        </div>
      )}

      {/* Pinned Message Banner (Telegram Style - Screenshot 2) */}
      {pinnedMessage && (
        <div
          onClick={() => {
            const el = document.getElementById(`msg-${pinnedMessage.id}`);
            if (el) {
              el.scrollIntoView({ behavior: 'smooth', block: 'center' });
              el.classList.add('ring-4', 'ring-amber-500/70', 'bg-amber-500/10', 'transition-all');
              setTimeout(() => el.classList.remove('ring-4', 'ring-amber-500/70', 'bg-amber-500/10'), 2000);
            }
          }}
          className="px-3 sm:px-5 py-2 bg-white/95 dark:bg-gray-800/95 backdrop-blur-md border-b border-gray-200 dark:border-gray-700/80 flex items-center justify-between shadow-xs z-10 cursor-pointer select-none transition-colors hover:bg-gray-50 dark:hover:bg-gray-750 shrink-0"
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-1 h-8 rounded-full bg-blue-600 dark:bg-emerald-500 shrink-0" />
            <div className="w-7 h-7 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
              <FileText className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <span className="text-[11px] font-bold text-blue-600 dark:text-emerald-400 block truncate">
                Qadalgan xabar • {pinnedMessage.sender?.first_name || 'Foydalanuvchi'}
              </span>
              <p className="text-xs text-gray-700 dark:text-gray-300 truncate font-medium">
                {(pinnedMessage.message || '').replace(/<!--REPLY:[\s\S]*?-->/g, '').trim() || 'Media / Fayl xabari'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0 ml-2">
            <Pin className="w-4 h-4 text-amber-500 rotate-45" />
          </div>
        </div>
      )}

      {/* Message List Area - Telegram Wallpaper & Bottom alignment */}
      <div
        ref={messagesContainerRef}
        onScroll={handleScroll}
        className="flex-1 min-h-0 min-w-0 max-w-full overflow-y-auto overflow-x-hidden overscroll-contain p-3 sm:p-4 md:p-6 relative flex flex-col bg-[#F3F4F6] dark:bg-[#0c1322] bg-[radial-gradient(#d1d5db_1.2px,transparent_1.2px)] dark:bg-[radial-gradient(#1e293b_1.2px,transparent_1.2px)] [background-size:22px_22px]"
      >
        <div className="min-h-full flex flex-col justify-end">
          {/* Loading History Spinner */}
          {loadingHistory && (
            <div className="flex flex-col items-center justify-center py-12 space-y-3 my-auto">
              <Loader2 className="w-8 h-8 text-[#123D78] animate-spin" />
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {t('common.loading', 'Loading messages...')}
              </p>
            </div>
          )}

          {/* Loading Older indicator at top */}
          {loadingOlder && (
            <div className="flex items-center justify-center py-2 shrink-0">
              <Loader2 className="w-5 h-5 text-gray-400 animate-spin" />
            </div>
          )}

          {/* No Messages Empty State */}
          {!loadingHistory && messages.length === 0 && (
            <div className="flex flex-col items-center justify-center my-auto text-center p-8 space-y-3">
              {activeGroup.isAnnouncementChat ? (
                <>
                  <div className="w-16 h-16 rounded-3xl bg-gradient-to-br from-emerald-500/20 to-teal-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shadow-sm">
                    <Megaphone className="w-8 h-8" />
                  </div>
                  <div>
                    <p className="text-base font-bold text-gray-800 dark:text-gray-200">
                      Hozircha rasmiy e&apos;lonlar yo&apos;q
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 max-w-sm mt-1 leading-relaxed">
                      Ushbu kanal orqali yozilgan xabarlar markazdagi barcha xodimlar va barcha o&apos;quv guruhlariga bir zumda avtomatik yetkaziladi.
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <div className="w-16 h-16 rounded-3xl bg-blue-50 dark:bg-gray-800/80 border border-blue-100 dark:border-gray-700/60 flex items-center justify-center text-[#123D78] dark:text-blue-400 shadow-sm">
                    <MessageSquare className="w-8 h-8" />
                  </div>
                  <div>
                    <p className="text-base font-bold text-gray-800 dark:text-gray-200">
                      {t('chat.noMessages', 'Hozircha xabarlar yo‘q')}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 max-w-sm mt-1 leading-relaxed">
                      Suhbatni boshlash uchun matn, rasm, audio yoki video xabar yuboring!
                    </p>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Messages List - Telegram-style bottom alignment with mt-auto */}
          {!loadingHistory && messages.length > 0 && (
            <div className="mt-auto space-y-2.5 flex flex-col">
              {messages.map((msg) => (
                <MessageBubble
                  key={msg.id}
                  message={msg}
                  currentUserId={currentUser?.id}
                  searchQuery={searchQuery}
                  canDelete={
                    userRole === 'owner' ||
                    userRole === 'admin' ||
                    (Boolean(currentUser?.id) &&
                      (String(msg.sender_id) === String(currentUser?.id) ||
                        String(msg.sender?.id) === String(currentUser?.id)))
                  }
                  onReply={(m) => setReplyingTo(m)}
                  onDelete={handleDeleteMessage}
                  onImageClick={(src) => setPreviewImageSrc(src)}
                  onViewSeen={(m) => setSeenModalMessage(m)}
                  onToggleReaction={handleToggleReaction}
                  onPin={handlePinMessage}
                  onForward={handleForwardMessage}
                  onEdit={(m) => {
                    setReplyingTo(null);
                    setEditingMessage(m);
                  }}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* "New Messages" / Scroll to bottom float button */}
      {isScrolledUp && (
        <div className="absolute bottom-20 left-1/2 -translate-x-1/2 z-20 animate-in fade-in slide-in-from-bottom-2">
          <button
            type="button"
            onClick={scrollToBottomSmooth}
            className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-full bg-[#123D78] text-white text-xs font-semibold shadow-lg hover:bg-[#0e2f5c] transition-transform active:scale-95"
          >
            <ArrowDown className="w-3.5 h-3.5" />
            <span>
              {newMessagesBadge
                ? t('chat.newMessages', 'New messages')
                : 'Scroll to bottom'}
            </span>
          </button>
        </div>
      )}

      {/* Chat Input Bar */}
      {(!activeGroup.isAnnouncementChat || ['owner', 'admin', 'teacher'].includes(userRole)) ? (
        <ChatInput
          onSendMessage={handleSendMessage}
          replyingTo={replyingTo}
          onCancelReply={() => setReplyingTo(null)}
          editingMessage={editingMessage}
          onCancelEdit={() => setEditingMessage(null)}
          uploading={uploading}
          uploadProgress={uploadProgress}
          isAnnouncementChat={activeGroup.isAnnouncementChat}
        />
      ) : (
        <div className="p-4 bg-gray-100 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 text-center text-xs text-gray-500 dark:text-gray-400 font-medium flex items-center justify-center gap-2">
          <Lock className="w-4 h-4 text-rose-500 shrink-0" />
          <span>
            Ushbu kanal faqat ma&apos;muriyat e&apos;lonlari uchun. E&apos;lonlar dars guruhlaringizda ham avtomatik aks etadi.
          </span>
        </div>
      )}

      {/* Lightbox Image Preview Modal */}
      {previewImageSrc && (
        <ImagePreview
          src={previewImageSrc}
          onClose={() => setPreviewImageSrc(null)}
        />
      )}

      {/* "Kimlar ko'rdi" (Seen Receipts) Modal */}
      {seenModalMessage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150"
          onClick={() => setSeenModalMessage(null)}
        >
          <div
            className="w-full max-w-md bg-white dark:bg-gray-900 rounded-3xl shadow-2xl border border-gray-200 dark:border-gray-800 p-6 space-y-4 animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-[#123D78] dark:text-blue-400 flex items-center justify-center shadow-xs">
                  <Eye className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-gray-900 dark:text-white">
                    Xabarni ko‘rganlar
                  </h3>
                  <p className="text-xs text-gray-400">
                    O‘qigan foydalanuvchilar ro‘yxati
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSeenModalMessage(null)}
                className="p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Message Preview snippet */}
            <div className="p-3 rounded-2xl bg-gray-50 dark:bg-gray-800/60 border border-gray-100 dark:border-gray-700/60 text-xs">
              <div className="text-[11px] font-semibold text-gray-400 mb-1">
                {seenModalMessage.sender?.first_name || 'Foydalanuvchi'} xabari:
              </div>
              <p className="text-gray-700 dark:text-gray-300 font-medium truncate">
                {seenModalMessage.message ||
                  (seenModalMessage.chat_attachments?.length ? '📷 [Media fayl / Video]' : 'Xabar')}
              </p>
            </div>

            {/* Viewers List */}
            <div className="max-h-72 overflow-y-auto space-y-2 pr-1">
              {(() => {
                const modalIsStaffChat =
                  activeGroup?.isStaffChat ||
                  activeGroup?.id === 'staff-general-chat' ||
                  seenModalMessage.group_id === 'staff-general-chat';
                const allUsers = localStore.getUsers ? localStore.getUsers() : [];

                const viewers = (seenModalMessage.seen_by || [])
                  .filter((v) => String(v.user_id) !== String(seenModalMessage.sender_id))
                  .map((v) => {
                    const normId = localStore.normalizeUserId ? localStore.normalizeUserId(v.user_id) : v.user_id;
                    const found = allUsers.find((u) => u.id === normId || u.id === v.user_id);
                    if (found) {
                      return {
                        ...v,
                        user_name:
                          found.fullName ||
                          `${found.first_name || ''} ${found.last_name || ''}`.trim() ||
                          (v.user_name && v.user_name !== 'User' ? v.user_name : found.username),
                        user_role: found.role || v.user_role,
                        avatar_url: found.avatar_url || v.avatar_url || '',
                      };
                    }
                    return v;
                  })
                  .filter((v) => {
                    // In staff chat, students MUST NEVER appear in seen list!
                    if (modalIsStaffChat && v.user_role === 'student') return false;
                    return true;
                  });

                if (viewers.length === 0) {
                  return (
                    <div className="py-8 text-center text-gray-400 space-y-2">
                      <div className="w-10 h-10 mx-auto rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-400">
                        <Eye className="w-5 h-5" />
                      </div>
                      <p className="text-xs font-medium">Hali hech kim ko‘rmadi</p>
                      <p className="text-[11px] text-gray-400">
                        (Boshqa foydalanuvchilar chatga kirganda 2 ta ptichka bo‘ladi)
                      </p>
                    </div>
                  );
                }

                return viewers.map((v, idx) => {
                  const roleBadge =
                    v.user_role === 'owner'
                      ? { label: 'Owner', cls: 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300' }
                      : v.user_role === 'admin'
                      ? { label: 'Admin', cls: 'bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300' }
                      : v.user_role === 'teacher'
                      ? { label: 'Oʻqituvchi', cls: 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300' }
                      : { label: 'Oʻquvchi', cls: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300' };

                  let timeDisplay = '';
                  if (v.seen_at) {
                    try {
                      const d = new Date(v.seen_at);
                      timeDisplay = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                    } catch {}
                  }

                  return (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-2.5 rounded-2xl hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-8 h-8 rounded-full bg-[#123D78] text-white flex items-center justify-center font-bold text-xs shrink-0 overflow-hidden shadow-xs">
                          {v.avatar_url ? (
                            <img src={v.avatar_url} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <span>{(v.user_name || 'U').charAt(0).toUpperCase()}</span>
                          )}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-bold text-gray-900 dark:text-white truncate">
                              {v.user_name || 'Foydalanuvchi'}
                            </span>
                            <span className={`px-1.5 py-0.2 rounded text-[9px] font-bold ${roleBadge.cls}`}>
                              {roleBadge.label}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 text-[11px] text-gray-400 font-mono shrink-0 pl-2">
                        <CheckCheck className="w-3.5 h-3.5 text-cyan-500" />
                        <span>{timeDisplay}</span>
                      </div>
                    </div>
                  );
                });
              })()}
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setSeenModalMessage(null)}
                className="px-4 py-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
              >
                Yopish
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Forward Message Modal (Telegram Style) */}
      {forwardModalMessage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150"
          onClick={() => setForwardModalMessage(null)}
        >
          <div
            className="w-full max-w-md bg-white dark:bg-gray-900 rounded-3xl shadow-2xl border border-gray-200 dark:border-gray-800 p-5 space-y-4 animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-cyan-50 dark:bg-cyan-950/60 text-cyan-600 dark:text-cyan-400 flex items-center justify-center shadow-xs">
                  <Forward className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-gray-900 dark:text-white">
                    Xabarni uzatish
                  </h3>
                  <p className="text-xs text-gray-400">
                    Qaysi guruh yoki chatga yubormoqchisiz?
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setForwardModalMessage(null)}
                className="p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Snippet */}
            <div className="p-3 rounded-2xl bg-gray-50 dark:bg-gray-800/60 border border-gray-100 dark:border-gray-700/60 text-xs">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">
                Uzatilayotgan xabar:
              </span>
              <p className="text-gray-800 dark:text-gray-200 font-medium truncate">
                {forwardModalMessage.message || 'Media / Fayl'}
              </p>
            </div>

            {/* Group targets */}
            <div className="max-h-64 overflow-y-auto space-y-1.5 pr-1">
              {allGroups
                .filter((g) => g.id !== activeGroup?.id)
                .map((g) => (
                  <button
                    key={g.id}
                    type="button"
                    onClick={() => handleConfirmForward(g.id)}
                    className="w-full flex items-center justify-between p-3 rounded-2xl hover:bg-gray-50 dark:hover:bg-gray-800/80 border border-gray-100 dark:border-gray-800 text-left transition-colors cursor-pointer group"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-xs shrink-0">
                        {g.name?.charAt(0).toUpperCase() || 'G'}
                      </div>
                      <div className="min-w-0">
                        <span className="text-xs font-bold text-gray-900 dark:text-white block truncate">
                          {g.name}
                        </span>
                        <span className="text-[10px] text-gray-400 truncate block">
                          {g.isStaffChat ? 'Xodimlar chati' : g.course?.name || 'Guruh'}
                        </span>
                      </div>
                    </div>
                    <Forward className="w-4 h-4 text-gray-300 group-hover:text-cyan-500 transition-colors shrink-0" />
                  </button>
                ))}
            </div>
          </div>
        </div>
      )}

      {/* Clear Chat History Confirmation Modal (Owner and Admin) */}
      {showClearHistoryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white dark:bg-gray-800 rounded-3xl max-w-md w-full p-6 shadow-2xl border border-gray-100 dark:border-gray-700 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-red-100 dark:bg-red-950/60 text-red-600 dark:text-red-400 flex items-center justify-center mx-auto shadow-xs">
              <Trash2 className="w-6 h-6" />
            </div>
            <div className="text-center space-y-1">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                Chat tarixini tozalash
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                <strong>{activeGroup.name}</strong> guruhidagi barcha xabarlar butunlay o‘chiriladi. Ushbu amalni ortga qaytarib bo‘lmaydi.
              </p>
            </div>
            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                disabled={isClearingHistory}
                onClick={() => setShowClearHistoryModal(false)}
                className="flex-1 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/60 text-gray-700 dark:text-gray-200 hover:bg-gray-100 text-xs font-bold transition-colors cursor-pointer"
              >
                Bekor qilish
              </button>
              <button
                type="button"
                disabled={isClearingHistory}
                onClick={handleClearHistory}
                className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition-all shadow-md shadow-red-600/30 cursor-pointer disabled:opacity-50 inline-flex items-center justify-center gap-2"
              >
                {isClearingHistory ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Tozalanmoqda...</span>
                  </>
                ) : (
                  <span>Ha, tozalansin</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Telegram-style 1-Click Message Delete Confirmation Modal */}
      {messageToDeleteId && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150"
          onClick={() => setMessageToDeleteId(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-sm rounded-2xl bg-white dark:bg-gray-800 p-5 shadow-2xl border border-gray-100 dark:border-gray-700 space-y-4 animate-in zoom-in-95 duration-150"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-100 dark:bg-red-950/60 text-red-600 dark:text-red-400 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-gray-900 dark:text-white">
                  Xabarni o‘chirish
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Ushbu xabar barcha foydalanuvchilar chatidan butunlay o‘chiriladi.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-gray-100 dark:border-gray-700">
              <button
                type="button"
                onClick={() => setMessageToDeleteId(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors cursor-pointer"
              >
                Bekor qilish
              </button>
              <button
                type="button"
                onClick={confirmDeleteChatMsg}
                className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-red-600 hover:bg-red-700 transition-all shadow-sm active:scale-95 cursor-pointer"
              >
                O‘chirish
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Telegram Style "Guruh ma'lumotlari" Modal (Screenshot 1) */}
      {showGroupInfoModal && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-150"
          onClick={() => setShowGroupInfoModal(false)}
        >
          <div
            className="w-full max-w-md bg-[#182533] text-white rounded-3xl shadow-2xl border border-gray-700/60 overflow-hidden flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="px-5 py-4 border-b border-gray-700/50 flex items-center justify-between shrink-0">
              <h3 className="text-base font-bold text-white tracking-wide">
                Guruh ma&apos;lumotlari
              </h3>
              <button
                type="button"
                onClick={() => setShowGroupInfoModal(false)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-gray-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body (Scrollable) */}
            <div className="p-5 overflow-y-auto space-y-5">
              {/* Profile Avatar & Title */}
              <div className="flex flex-col items-center text-center">
                <div
                  className="w-24 h-24 rounded-full flex items-center justify-center text-2xl font-black text-white shadow-xl ring-4 ring-white/10 overflow-hidden relative"
                  style={{ backgroundColor: courseColor }}
                >
                  {activeGroupAvatar ? (
                    <img
                      src={activeGroupAvatar}
                      alt={activeGroup.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span>{activeGroup.name?.slice(0, 3).toUpperCase() || 'AT1'}</span>
                  )}
                </div>

                <h4 className="text-lg font-bold text-white mt-3 leading-snug">
                  {activeGroup.name}
                </h4>
                <p className="text-xs text-gray-400 mt-1">
                  EDUCO LMS • Faol guruh
                </p>

                {/* Action Buttons: Xabar yozish & Ovozni o'chirish */}
                <div className="grid grid-cols-2 gap-3 w-full mt-4">
                  <button
                    type="button"
                    onClick={() => setShowGroupInfoModal(false)}
                    className="flex flex-col items-center justify-center py-2.5 px-3 rounded-2xl bg-white/10 hover:bg-white/15 text-white transition-colors cursor-pointer"
                  >
                    <MessageSquare className="w-5 h-5 text-blue-400 mb-1" />
                    <span className="text-xs font-semibold">Xabar yozish</span>
                  </button>

                  <button
                    type="button"
                    onClick={toggleMute}
                    className="flex flex-col items-center justify-center py-2.5 px-3 rounded-2xl bg-white/10 hover:bg-white/15 text-white transition-colors cursor-pointer"
                  >
                    {isMuted ? (
                      <>
                        <BellOff className="w-5 h-5 text-rose-400 mb-1" />
                        <span className="text-xs font-semibold text-rose-300">Ovozni yoqish</span>
                      </>
                    ) : (
                      <>
                        <Bell className="w-5 h-5 text-blue-400 mb-1" />
                        <span className="text-xs font-semibold">Ovozni o‘chirish</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Group Schedule & Room Info Card */}
              <div className="bg-[#101827]/80 rounded-2xl p-4 border border-gray-700/50 space-y-3 text-left">
                {/* Room */}
                <div>
                  <h5 className="text-sm font-bold text-white">
                    {activeGroup.room?.name || activeGroup.room_name || 'Atelier 1 (Bichish zali)'}
                  </h5>
                  <p className="text-xs text-gray-400">Atelye zali / Dars xonasi</p>
                </div>

                {/* Time */}
                <div className="pt-2 border-t border-gray-800">
                  <h5 className="text-sm font-bold text-white">
                    {activeGroup.schedule || activeGroup.lesson_time || '09:00 - 12:00'}
                  </h5>
                  <p className="text-xs text-gray-400">
                    Dars vaqti (Monday, Wednesday, Friday)
                  </p>
                </div>

                {/* Group Code */}
                <div className="pt-2 border-t border-gray-800 flex items-center justify-between">
                  <div>
                    <h5 className="text-sm font-bold text-blue-400 font-mono">
                      @{activeGroup.code || ('educo_' + (activeGroup.id || '').slice(0, 6))}
                    </h5>
                    <p className="text-xs text-gray-400">Guruh kodi</p>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <QrCode className="w-4 h-4 text-gray-400" />
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard?.writeText?.(
                          `@${activeGroup.code || ('educo_' + (activeGroup.id || '').slice(0, 6))}`
                        );
                        toast.success('Guruh kodi nusxalandi!');
                      }}
                      className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white transition-colors cursor-pointer"
                      title="Nusxalash"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Interactive Sections List (Matching Screenshot 1) */}
              <div className="bg-[#101827]/80 rounded-2xl border border-gray-700/50 divide-y divide-gray-800 text-left">
                {/* Members */}
                <div className="p-3.5 flex items-center justify-between hover:bg-white/5 transition-colors cursor-pointer rounded-t-2xl">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center shrink-0">
                      <Users className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-xs font-bold text-white block">
                        {typeof groupMembersCount === 'number' ? `${groupMembersCount} ta talaba` : groupMembersCount}
                      </span>
                      <span className="text-[10px] text-gray-400">Guruh a&apos;zolari ro&apos;yxati</span>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-400" />
                </div>

                {/* Pinned Messages */}
                <div
                  onClick={() => {
                    setShowGroupInfoModal(false);
                    if (pinnedMessage) {
                      const el = document.getElementById(`msg-${pinnedMessage.id}`);
                      el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                      el?.classList.add('ring-4', 'ring-amber-500/70', 'bg-amber-500/10');
                      setTimeout(() => el?.classList.remove('ring-4', 'ring-amber-500/70', 'bg-amber-500/10'), 2000);
                    } else {
                      toast.info("Bu guruhda qadalgan xabarlar mavjud emas");
                    }
                  }}
                  className="p-3.5 flex items-center justify-between hover:bg-white/5 transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
                      <Pin className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-xs font-bold text-white block">
                        {pinnedMessage ? '1 ta qadalgan xabar' : "Qadalgan xabarlar yo'q"}
                      </span>
                      <span className="text-[10px] text-gray-400">Xabarga o‘tish uchun bosing</span>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-400" />
                </div>

                {/* Media files */}
                <div className="p-3.5 flex items-center justify-between hover:bg-white/5 transition-colors cursor-pointer">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                      <ImageIcon className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-xs font-bold text-white block">
                        {mediaCount} ta media fayl
                      </span>
                      <span className="text-[10px] text-gray-400">Rasmlar va videolar</span>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-400" />
                </div>

                {/* Documents / Files */}
                <div className="p-3.5 flex items-center justify-between hover:bg-white/5 transition-colors cursor-pointer rounded-b-2xl">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-purple-500/20 text-purple-400 flex items-center justify-center shrink-0">
                      <FileText className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-xs font-bold text-white block">
                        {docsCount} ta andoza hujjati
                      </span>
                      <span className="text-[10px] text-gray-400">Fayllar va loyihalar</span>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-400" />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Telegram-style Image Cropper Modal for Group Avatar in Chat */}
      <ImageCropperModal
        isOpen={Boolean(cropModalFile)}
        imageFile={cropModalFile}
        onClose={() => setCropModalFile(null)}
        onCrop={handleApplyCroppedGroupAvatar}
        title="Guruh profil rasmini moslashtirish"
        subtitle="Rasmni suring, kattalashtiring va o‘lchamini sozlang"
      />
    </div>
  );
}

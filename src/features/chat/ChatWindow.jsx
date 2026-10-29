import React, { useState, useEffect, useRef } from 'react';
import {
  Users,
  Briefcase,
  ChevronDown,
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
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from '@/components/ui/Toast';
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
  uploadAttachment,
  subscribeToMessages,
  markAsRead,
  markAllMessagesAsSeen,
} from '@/services/chatService';

export default function ChatWindow({
  activeGroup,
  currentUser,
  userRole,
  onBackToList,
}) {
  const { t } = useTranslation();

  const [messages, setMessages] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const [hasMoreOlder, setHasMoreOlder] = useState(true);
  const [replyingTo, setReplyingTo] = useState(null);
  const [editingMessage, setEditingMessage] = useState(null);
  const [previewImageSrc, setPreviewImageSrc] = useState(null);
  const [showStaffList, setShowStaffList] = useState(false);
  const [seenModalMessage, setSeenModalMessage] = useState(null);

  const [isScrolledUp, setIsScrolledUp] = useState(false);
  const [newMessagesBadge, setNewMessagesBadge] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(null);

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
    if (!window.confirm("Guruh profil rasmini olib tashlamoqchimisiz?")) return;
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

  const messagesContainerRef = useRef(null);
  const isInitialLoadRef = useRef(true);
  const currentGroupIdRef = useRef(activeGroup?.id);

  currentGroupIdRef.current = activeGroup?.id;

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
      }
    });

    return () => {
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

  const handleDeleteMessage = async (messageId) => {
    if (!window.confirm(t('common.confirm', 'Are you sure you want to delete this message?'))) {
      return;
    }
    try {
      await deleteMessage(messageId);
      setMessages((prev) => prev.filter((m) => m.id !== messageId));
    } catch (err) {
      console.error('Failed to delete message:', err);
      alert('Failed to delete message.');
    }
  };

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
    <div className="flex-1 min-h-0 min-w-0 max-w-full flex flex-col h-full bg-[#F5F7FA] dark:bg-[#101827] relative overflow-hidden">
      {/* Chat Header */}
      <div className="h-14 sm:h-16 px-3 sm:px-6 flex items-center justify-between bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 shadow-xs z-10 shrink-0">
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

          {/* Group Avatar badge */}
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

              {isStaffUser && (
                <label
                  title="Guruh profil rasmini o‘zgartirish"
                  className="absolute -bottom-1 -right-1 p-1 bg-blue-600 hover:bg-blue-700 dark:bg-emerald-600 dark:hover:bg-emerald-700 text-white rounded-full cursor-pointer shadow-md transition-all hover:scale-110 flex items-center justify-center"
                >
                  <Camera className="w-2.5 h-2.5" />
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
          )}

          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-gray-900 dark:text-white truncate">
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
            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
              {activeGroup.isAnnouncementChat
                ? "Rasmiy e'lonlar • Barcha chatlarga avtomatik tarqatiladi"
                : activeGroup.course?.name || t('chat.title', 'Group Chat')}
            </p>
          </div>
        </div>

        {/* Group Info Badge */}
        <div className="flex items-center space-x-2 rtl:space-x-reverse">
          {activeGroup.isAnnouncementChat ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-300/60 dark:border-emerald-700/60 shadow-2xs">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="hidden sm:inline">Barcha chatlarga tarqatiladi</span>
              <span className="sm:hidden">Hammaga</span>
            </span>
          ) : activeGroup.isStaffChat ? (
            <button
              type="button"
              onClick={() => setShowStaffList((prev) => !prev)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/60 text-[#064e3b] dark:text-indigo-300 border border-indigo-200/70 dark:border-indigo-800 transition-colors"
            >
              <Users className="w-3.5 h-3.5" />
              <span>{activeGroup.staffMembers?.length || 0} ta xodim</span>
              <ChevronDown
                className={`w-3.5 h-3.5 transition-transform ${showStaffList ? 'rotate-180' : ''}`}
              />
            </button>
          ) : (
            <div className="flex items-center gap-2">
              {isStaffUser && (
                <div className="flex items-center gap-1.5">
                  <label
                    title="Guruh profiliga rasm qo‘yish"
                    className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-emerald-300/80 dark:border-emerald-800 bg-emerald-50/80 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-100 text-xs font-semibold cursor-pointer transition-colors shadow-2xs"
                  >
                    <Camera className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                    <span className="hidden sm:inline">
                      {activeGroupAvatar ? "Rasmni almashtirish" : "Guruh rasmi qo'yish"}
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleGroupAvatarSelect}
                      disabled={avatarUploading}
                    />
                  </label>

                  {activeGroupAvatar && (
                    <button
                      type="button"
                      onClick={handleRemoveGroupAvatar}
                      disabled={avatarUploading}
                      title="Guruh rasmini olib tashlash"
                      className="p-1.5 rounded-xl border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 hover:bg-red-100 text-xs transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              )}

              <span className="hidden md:inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300">
                <Users className="w-3.5 h-3.5 mr-1 rtl:mr-0 rtl:ml-1" />
                {activeGroup.status || 'Active'}
              </span>
            </div>
          )}
        </div>
      </div>

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
        <div className="px-4 py-3 bg-indigo-50/70 dark:bg-gray-800/90 border-b border-indigo-100 dark:border-gray-700 flex flex-wrap items-center gap-2 z-10">
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

      {/* Message List Area */}
      <div
        ref={messagesContainerRef}
        onScroll={handleScroll}
        className="flex-1 min-h-0 min-w-0 max-w-full overflow-y-auto overflow-x-hidden overscroll-contain p-3 sm:p-4 md:p-6 space-y-2 relative"
      >
        {/* Loading History Spinner */}
        {loadingHistory && (
          <div className="flex flex-col items-center justify-center py-12 space-y-3">
            <Loader2 className="w-8 h-8 text-[#123D78] animate-spin" />
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {t('common.loading', 'Loading messages...')}
            </p>
          </div>
        )}

        {/* Loading Older indicator at top */}
        {loadingOlder && (
          <div className="flex items-center justify-center py-2">
            <Loader2 className="w-5 h-5 text-gray-400 animate-spin" />
          </div>
        )}

        {/* No Messages Empty State */}
        {!loadingHistory && messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center p-8 space-y-3">
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

        {/* Messages List */}
        {!loadingHistory &&
          messages.map((msg) => (
            <MessageBubble
              key={msg.id}
              message={msg}
              currentUserId={currentUser?.id}
              canDelete={
                msg.sender_id === currentUser?.id ||
                userRole === 'owner' ||
                userRole === 'admin'
              }
              onReply={(m) => setReplyingTo(m)}
              onDelete={handleDeleteMessage}
              onImageClick={(src) => setPreviewImageSrc(src)}
              onViewSeen={(m) => setSeenModalMessage(m)}
              onEdit={(m) => {
                setReplyingTo(null);
                setEditingMessage(m);
              }}
            />
          ))}
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

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
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import MessageBubble from './MessageBubble';
import ChatInput from './ChatInput';
import ImagePreview from './ImagePreview';
import {
  getMessages,
  sendMessage,
  deleteMessage,
  uploadAttachment,
  subscribeToMessages,
  markAsRead,
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
  const [previewImageSrc, setPreviewImageSrc] = useState(null);
  const [showStaffList, setShowStaffList] = useState(false);

  const [isScrolledUp, setIsScrolledUp] = useState(false);
  const [newMessagesBadge, setNewMessagesBadge] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(null);

  const messagesContainerRef = useRef(null);
  const isInitialLoadRef = useRef(true);
  const currentGroupIdRef = useRef(activeGroup?.id);

  currentGroupIdRef.current = activeGroup?.id;

  // Load message history & subscribe to Realtime
  useEffect(() => {
    if (!activeGroup?.id) {
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

  const handleSendMessage = async ({ text, files, replyTo }) => {
    if (!activeGroup?.id) return;

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

  const courseColor = activeGroup.course?.color || '#123D78';

  return (
    <div className="flex-1 flex flex-col h-full bg-[#F5F7FA] dark:bg-[#101827] relative overflow-hidden">
      {/* Chat Header */}
      <div className="h-16 px-4 md:px-6 flex items-center justify-between bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 shadow-xs z-10">
        <div className="flex items-center space-x-3 rtl:space-x-reverse min-w-0">
          {/* Mobile Back Button */}
          <button
            type="button"
            onClick={onBackToList}
            className="md:hidden p-2 rounded-full text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 rtl:rotate-180" />
          </button>

          {/* Group Avatar badge */}
          {activeGroup.isStaffChat ? (
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#123D78] to-indigo-700 flex items-center justify-center text-white shadow-sm flex-shrink-0 ring-2 ring-amber-400/50">
              <Briefcase className="w-5 h-5" />
            </div>
          ) : (
            <div
              className="w-10 h-10 rounded-2xl flex items-center justify-center text-white font-bold text-sm shadow-sm flex-shrink-0"
              style={{ backgroundColor: courseColor }}
            >
              {activeGroup.name?.charAt(0) || 'G'}
            </div>
          )}

          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-gray-900 dark:text-white truncate">
                {activeGroup.name}
              </h2>
              {activeGroup.isStaffChat && (
                <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300">
                  Xodimlar
                </span>
              )}
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
              {activeGroup.course?.name || t('chat.title', 'Group Chat')}
            </p>
          </div>
        </div>

        {/* Group Info Badge */}
        <div className="flex items-center space-x-2 rtl:space-x-reverse">
          {activeGroup.isStaffChat ? (
            <button
              type="button"
              onClick={() => setShowStaffList((prev) => !prev)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/60 text-[#123D78] dark:text-indigo-300 border border-indigo-200/70 dark:border-indigo-800 transition-colors"
            >
              <Users className="w-3.5 h-3.5" />
              <span>{activeGroup.staffMembers?.length || 0} ta xodim</span>
              <ChevronDown
                className={`w-3.5 h-3.5 transition-transform ${showStaffList ? 'rotate-180' : ''}`}
              />
            </button>
          ) : (
            <span className="hidden sm:inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300">
              <Users className="w-3.5 h-3.5 mr-1 rtl:mr-0 rtl:ml-1" />
              {activeGroup.status || 'Active'}
            </span>
          )}
        </div>
      </div>

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
        className="flex-1 overflow-y-auto p-4 md:p-6 space-y-1 relative"
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
          <div className="flex flex-col items-center justify-center h-full text-center p-8 space-y-2">
            <div className="w-12 h-12 rounded-full bg-blue-50 dark:bg-gray-800 flex items-center justify-center text-[#123D78] dark:text-blue-400">
              <MessageSquare className="w-6 h-6" />
            </div>
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {t('chat.noMessages', 'No messages yet')}
            </p>
            <p className="text-xs text-gray-400 max-w-xs">
              Start the conversation by sending a text, photo, voice note, or rectangular video!
            </p>
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
      <ChatInput
        onSendMessage={handleSendMessage}
        replyingTo={replyingTo}
        onCancelReply={() => setReplyingTo(null)}
        uploading={uploading}
        uploadProgress={uploadProgress}
      />

      {/* Lightbox Image Preview Modal */}
      {previewImageSrc && (
        <ImagePreview
          src={previewImageSrc}
          onClose={() => setPreviewImageSrc(null)}
        />
      )}
    </div>
  );
}

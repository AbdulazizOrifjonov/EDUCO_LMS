import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  Reply,
  Trash2,
  Download,
  FileText,
  File,
  MoreVertical,
  Check,
  CheckCheck,
  Eye,
  Megaphone,
  Pencil,
  Smile,
  Pin,
  Copy,
  Forward,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from '@/components/ui/Toast';
import TelegramVoicePlayer from './TelegramVoicePlayer';
import TelegramVideoPlayer from './TelegramVideoPlayer';

const TELEGRAM_REACTIONS = ['👍', '❤️', '🔥', '👏', '😂', '⚡', '🎉', '🤩', '🙏', '👎'];

export default function MessageBubble({
  message,
  currentUserId,
  canDelete = false,
  onReply,
  onDelete,
  onImageClick,
  onViewSeen,
  onEdit,
  onToggleReaction,
  onPin,
  onForward,
}) {
  const { t, i18n } = useTranslation();
  const [showContextMenu, setShowContextMenu] = useState(false);
  const [showReactionPicker, setShowReactionPicker] = useState(false);
  const [reactionPlacement, setReactionPlacement] = useState('top');
  const [menuPlacement, setMenuPlacement] = useState('bottom');
  const menuRef = useRef(null);
  const contextMenuRef = useRef(null);
  const reactionPickerRef = useRef(null);
  const bubbleRef = useRef(null);
  const clickTimerRef = useRef(null);

  const toggleReactionPicker = (e) => {
    e?.stopPropagation?.();
    if (!showReactionPicker && bubbleRef.current) {
      const rect = bubbleRef.current.getBoundingClientRect();
      // If message is within 140px of top of screen, flip downward so it never clips off-screen
      if (rect.top < 140) {
        setReactionPlacement('bottom');
      } else {
        setReactionPlacement('top');
      }
    }
    setShowReactionPicker((prev) => !prev);
  };

  const handleBubbleClick = (e) => {
    // If clicked on an interactive control (audio player, link, button), don't open context menu
    if (e.target.closest('button, a, input, audio, video')) {
      return;
    }

    if (clickTimerRef.current) {
      // Double click/tap detected: quick Telegram like 👍
      clearTimeout(clickTimerRef.current);
      clickTimerRef.current = null;
      setShowContextMenu(false);
      onToggleReaction?.(message.id, '👍');
      return;
    }

    clickTimerRef.current = setTimeout(() => {
      clickTimerRef.current = null;
      // Single tap/click detected: Open Telegram Menu!
      if (bubbleRef.current) {
        const rect = bubbleRef.current.getBoundingClientRect();
        const spaceBelow = window.innerHeight - rect.bottom;
        if (spaceBelow < 340 && rect.top > 250) {
          setMenuPlacement('top');
        } else {
          setMenuPlacement('bottom');
        }
      }
      setShowContextMenu((prev) => !prev);
    }, 220);
  };

  const handleCopy = (e) => {
    e?.stopPropagation?.();
    setShowContextMenu(false);
    const contentToCopy = displayMessageText || message.chat_attachments?.[0]?.file_name || '';
    if (contentToCopy) {
      navigator.clipboard?.writeText(contentToCopy);
      toast.success(t('chat.copied', 'Xabar nusxalandi! 📋'));
    }
  };

  const handlePin = (e) => {
    e?.stopPropagation?.();
    setShowContextMenu(false);
    onPin?.(message);
  };

  const handleForward = (e) => {
    e?.stopPropagation?.();
    setShowContextMenu(false);
    onForward?.(message);
  };

  const handleEdit = (e) => {
    e?.stopPropagation?.();
    setShowContextMenu(false);
    onEdit?.(message);
  };

  const handleReply = (e) => {
    e?.stopPropagation?.();
    setShowContextMenu(false);
    onReply?.(message);
  };

  const handleDelete = (e) => {
    e?.stopPropagation?.();
    setShowContextMenu(false);
    onDelete?.(message.id);
  };

  const handleReact = (emoji) => {
    setShowContextMenu(false);
    onToggleReaction?.(message.id, emoji);
  };

  const isRtl = i18n.language === 'ar' || document.documentElement.dir === 'rtl';
  const isOwn =
    Boolean(currentUserId) &&
    (String(message.sender_id) === String(currentUserId) ||
      String(message.sender?.id) === String(currentUserId));

  // Parse reply header and announcement metadata safely using Regex
  let replyData = null;
  let rawText = message.message || '';

  // 1. Extract reply metadata if embedded anywhere in the text
  const replyMatch = rawText.match(/<!--REPLY:([\s\S]*?)-->/);
  if (replyMatch) {
    try {
      replyData = JSON.parse(replyMatch[1]);
      if (replyData && replyData.preview) {
        // Strip any nested tags or prefixes from preview
        replyData.preview = replyData.preview
          .replace(/<!--REPLY:[\s\S]*?-->/g, '')
          .replace(/📢 \[RASMIY.*?\]:\n?/g, '')
          .trim();
      }
    } catch {}
    rawText = rawText.replace(replyMatch[0], '').trim();
  }

  // 2. Identify if this is an official announcement
  const isAnnouncement =
    Boolean(message.is_announcement) ||
    /📢 \[RASMIY/i.test(message.message || '') ||
    message.group_id === 'announcements-broadcast-channel';

  // 3. Clean all announcement prefixes and any residual comments
  let displayMessageText = rawText
    .replace(/^📢 \[RASMIY MARKAZ E'LONI\]:\n?/i, '')
    .replace(/^📢 \[RASMIY E'LON\]:\n?/i, '')
    .replace(/^📢 \[.*?\]:\n?/i, '')
    .replace(/<!--REPLY:[\s\S]*?-->/g, '')
    .trim();

  // Close context menu on outside click or touch
  useEffect(() => {
    function handleClickOutside(e) {
      if (
        contextMenuRef.current &&
        !contextMenuRef.current.contains(e.target) &&
        !bubbleRef.current?.contains(e.target)
      ) {
        setShowContextMenu(false);
      }
      if (reactionPickerRef.current && !reactionPickerRef.current.contains(e.target)) {
        setShowReactionPicker(false);
      }
    }
    if (showContextMenu || showReactionPicker) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [showContextMenu, showReactionPicker]);

  // Extract message reactions safely (supports array or dictionary)
  const rawReactions = message.reactions || [];
  const reactions = useMemo(() => {
    if (Array.isArray(rawReactions)) {
      return rawReactions.filter(
        (r) => r && r.emoji && (r.count > 0 || (r.user_ids && r.user_ids.length > 0))
      );
    }
    if (typeof rawReactions === 'object') {
      return Object.entries(rawReactions)
        .map(([emoji, uids]) => ({
          emoji,
          count: Array.isArray(uids) ? uids.length : 1,
          user_ids: Array.isArray(uids) ? uids : [uids],
        }))
        .filter((r) => r.count > 0);
    }
    return [];
  }, [rawReactions]);

  // Telegram-style quick double click reaction (adds 👍)
  const handleDoubleClick = (e) => {
    e.stopPropagation();
    onToggleReaction?.(message.id, '👍');
  };



  const formatTime = (isoString) => {
    if (!isoString) return '';
    try {
      const d = new Date(isoString);
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  };

  const senderName = message.sender
    ? `${message.sender.first_name || ''} ${message.sender.last_name || ''}`.trim() ||
      message.sender.username ||
      'User'
    : 'User';

  const senderRole = message.sender?.role || '';
  const getRoleBadge = (role) => {
    switch (role) {
      case 'owner':
        return {
          label: 'Asoschi (Owner)',
          cls: 'bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300',
        };
      case 'admin':
        return {
          label: 'Admin',
          cls: 'bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-300',
        };
      case 'teacher':
        return {
          label: 'Oʻqituvchi',
          cls: 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300',
        };
      case 'student':
        return {
          label: 'Oʻquvchi',
          cls: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300',
        };
      default:
        return null;
    }
  };
  const roleBadge = getRoleBadge(senderRole);

  const avatarInitial = senderName.charAt(0).toUpperCase() || 'U';

  const formatFileSize = (bytes) => {
    if (!bytes) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const otherViewers = (message.seen_by || []).filter(
    (s) => String(s.user_id) !== String(message.sender_id)
  );
  const isSeenByOthers = otherViewers.length > 0;
  const isEdited = Boolean(message.is_edited || message.edited_at);

  const circularVideoAttachment = (message.chat_attachments || []).find((att) => {
    const fn = String(att.file_name || '').toLowerCase();
    const ft = String(att.file_type || '').toLowerCase();
    const isAudio =
      att.is_audio === true ||
      fn.startsWith('audio_') ||
      fn.includes('audio') ||
      ft.startsWith('audio/');
    if (isAudio) return false;
    return (
      att.is_video_note === true ||
      fn.includes('video_note') ||
      (fn.startsWith('video_') && !fn.includes('regular'))
    );
  });
  const isPureVideoNote = Boolean(
    circularVideoAttachment &&
      (!displayMessageText || !displayMessageText.trim()) &&
      (!message.chat_attachments || message.chat_attachments.length === 1)
  );

  return (
    <div
      id={`msg-${message.id}`}
      className={`group flex items-end mb-4 relative min-w-0 max-w-full ${
        isOwn ? 'justify-end' : 'justify-start'
      }`}
      onContextMenu={(e) => {
        e.preventDefault();
        if (bubbleRef.current) {
          const rect = bubbleRef.current.getBoundingClientRect();
          const spaceBelow = window.innerHeight - rect.bottom;
          if (spaceBelow < 340 && rect.top > 250) {
            setMenuPlacement('top');
          } else {
            setMenuPlacement('bottom');
          }
        }
        setShowContextMenu(true);
      }}
    >
      {/* Sender Avatar (for others' messages) */}
      {!isOwn && (
        <div className="w-8 h-8 rounded-full overflow-hidden bg-[#123D78] text-white flex-shrink-0 flex items-center justify-center font-bold text-xs mr-2 rtl:mr-0 rtl:ml-2 shadow-sm select-none">
          {message.sender?.avatar_url ? (
            <img
              src={message.sender.avatar_url}
              alt={senderName}
              className="w-full h-full object-cover"
            />
          ) : (
            <span>{avatarInitial}</span>
          )}
        </div>
      )}

      {/* Message Bubble Container */}
      <div ref={bubbleRef} className={`relative max-w-[85%] sm:max-w-[70%] md:max-w-[60%] min-w-0`}>
        {/* Sender Name & Role Badge in Group Chat for others */}
        {!isOwn && (
          <div className="flex items-center gap-1.5 mb-1 ml-1 rtl:ml-0 rtl:mr-1">
            <span className="text-[11px] font-bold text-gray-700 dark:text-gray-300">
              {senderName}
            </span>
            {roleBadge && (
              <span className={`px-1.5 py-0.2 rounded text-[9px] font-bold uppercase tracking-wider ${roleBadge.cls}`}>
                {roleBadge.label}
              </span>
            )}
          </div>
        )}

        {isPureVideoNote ? (
          /* Pure Circular Video Note - Freestanding Telegram Style (NO background box!) */
          <div
            onClick={handleBubbleClick}
            className={`relative select-none my-1 flex flex-col cursor-pointer ${isOwn ? 'items-end' : 'items-start'}`}
          >
            <TelegramVideoPlayer
              src={circularVideoAttachment.signedUrl || circularVideoAttachment.file_url}
              fileName={circularVideoAttachment.file_name}
              isCircular={true}
              isOwn={isOwn}
              message={message}
              onViewSeen={onViewSeen}
              formatTime={formatTime}
              showTimestamp={true}
            />
          </div>
        ) : (
          <div
            onClick={handleBubbleClick}
            className={`rounded-2xl px-3.5 py-2.5 shadow-sm text-sm break-words relative transition-colors cursor-pointer select-none ${
            isOwn
              ? isAnnouncement
                ? 'bg-gradient-to-r from-rose-900 to-[#123D78] text-white rounded-br-xs ring-2 ring-rose-500/50'
                : 'bg-[#123D78] text-white rounded-br-xs'
              : isAnnouncement
              ? 'bg-rose-50/80 dark:bg-rose-950/25 text-gray-900 dark:text-gray-100 border-2 border-rose-500/50 rounded-bl-xs'
              : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border border-gray-100 dark:border-gray-700/60 rounded-bl-xs'
          }`}
        >
          {/* Official Announcement Header */}
          {isAnnouncement && (
            <div
              className={`mb-2.5 px-3 py-1.5 rounded-xl flex items-center justify-between gap-2 font-bold text-xs uppercase tracking-wider ${
                isOwn
                  ? 'bg-rose-500/30 text-rose-100 border border-rose-400/40'
                  : 'bg-rose-500/15 text-rose-700 dark:text-rose-300 border border-rose-500/30'
              }`}
            >
              <div className="flex items-center gap-1.5">
                <Megaphone className="w-4 h-4 text-rose-500 shrink-0 animate-pulse" />
                <span>Markaz Rasmiy E&apos;loni</span>
              </div>
              <span className="text-[10px] px-2 py-0.2 rounded-full bg-rose-600 text-white font-black">
                Hammaga
              </span>
            </div>
          )}

          {/* Replying-to Preview Quote */}
          {replyData && (
            <div
              className={`mb-2 pl-2.5 rtl:pl-0 rtl:pr-2.5 border-l-2 rtl:border-l-0 rtl:border-r-2 rounded text-xs py-1.5 transition-colors ${
                isOwn
                  ? 'border-white/70 bg-white/10 text-white/90'
                  : isAnnouncement
                  ? 'border-rose-500 bg-rose-100/70 dark:bg-rose-900/40 text-rose-950 dark:text-rose-100'
                  : 'border-[#123D78] bg-gray-50 dark:bg-gray-700/50 text-gray-700 dark:text-gray-300'
              }`}
            >
              <div className="font-bold text-[11px] opacity-95 flex items-center gap-1">
                <Reply className="w-3 h-3 rotate-180 inline-block opacity-70" />
                <span>{replyData.sender_name}</span>
              </div>
              <div className="truncate opacity-90 mt-0.5">{replyData.preview}</div>
            </div>
          )}

          {/* Attachments rendering */}
          {message.chat_attachments && message.chat_attachments.length > 0 && (
            <div className="space-y-2 mb-2">
              {message.chat_attachments.map((att) => {
                const fileName = String(att.file_name || '').toLowerCase();
                const fileType = String(att.file_type || '').toLowerCase();

                const isAudio =
                  att.is_audio === true ||
                  fileName.startsWith('audio_') ||
                  fileName.includes('audio') ||
                  fileType.startsWith('audio/') ||
                  /\.(mp3|wav|ogg|oga|m4a|aac|opus|flac)$/i.test(fileName);

                const isCircularVideoNote =
                  !isAudio &&
                  (att.is_video_note === true ||
                    fileName.includes('video_note') ||
                    (fileName.startsWith('video_') && !fileName.includes('regular')));

                const isVideo =
                  !isAudio &&
                  !isCircularVideoNote &&
                  (att.is_video === true ||
                    fileType.startsWith('video/') ||
                    /\.(mp4|webm|mov|m4v|mkv)$/i.test(fileName));

                const isImage =
                  !isAudio &&
                  !isVideo &&
                  !isCircularVideoNote &&
                  (att.is_image === true ||
                    fileType.startsWith('image/') ||
                    /\.(png|jpg|jpeg|gif|webp|svg)$/i.test(fileName));

                const url = att.signedUrl || att.file_url;

                if (isImage) {
                  return (
                    <div
                      key={att.id}
                      className="rounded-xl overflow-hidden cursor-pointer max-h-72 bg-black/10 relative group/img"
                      onClick={() => onImageClick?.(url)}
                    >
                      <img
                        src={url}
                        alt={att.file_name}
                        className="w-full h-auto object-cover max-h-72 hover:scale-[1.02] transition-transform duration-200"
                        loading="lazy"
                      />
                    </div>
                  );
                }

                if (isCircularVideoNote) {
                  return (
                    <div
                      key={att.id}
                      className="my-1.5 flex items-center justify-center select-none"
                    >
                      <TelegramVideoPlayer
                        src={url}
                        fileName={att.file_name}
                        isCircular={true}
                        isOwn={isOwn}
                        message={message}
                        onViewSeen={onViewSeen}
                        formatTime={formatTime}
                        showTimestamp={false}
                      />
                    </div>
                  );
                }

                if (isVideo) {
                  return (
                    <div key={att.id} className="my-1.5 select-none">
                      <TelegramVideoPlayer
                        src={url}
                        fileName={att.file_name}
                        isCircular={false}
                        isOwn={isOwn}
                        message={message}
                        onViewSeen={onViewSeen}
                        formatTime={formatTime}
                      />
                    </div>
                  );
                }

                if (isAudio) {
                  return (
                    <div key={att.id} className="my-1 select-none">
                      <TelegramVoicePlayer
                        src={url}
                        fileName={att.file_name || 'Ovozli xabar'}
                        isOwn={isOwn}
                      />
                    </div>
                  );
                }

                // Generic document / file
                return (
                  <a
                    key={att.id}
                    href={url}
                    download={att.file_name}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`flex items-center justify-between p-2.5 rounded-xl border transition-colors ${
                      isOwn
                        ? 'bg-white/10 hover:bg-white/20 border-white/20 text-white'
                        : 'bg-gray-50 hover:bg-gray-100 dark:bg-gray-700/40 dark:hover:bg-gray-700/80 border-gray-200 dark:border-gray-700 text-gray-800 dark:text-gray-200'
                    }`}
                  >
                    <div className="flex items-center space-x-2.5 rtl:space-x-reverse min-w-0 pr-2">
                      <FileText className="w-5 h-5 flex-shrink-0 opacity-80" />
                      <div className="min-w-0">
                        <div className="truncate text-xs font-medium">
                          {att.file_name}
                        </div>
                        {att.file_size && (
                          <div className="text-[10px] opacity-75">
                            {formatFileSize(att.file_size)}
                          </div>
                        )}
                      </div>
                    </div>
                    <Download className="w-4 h-4 flex-shrink-0 opacity-70" />
                  </a>
                );
              })}
            </div>
          )}

          {/* Text Message Content */}
          {displayMessageText && (
            <p className="whitespace-pre-wrap leading-relaxed select-text font-normal">
              {displayMessageText}
            </p>
          )}

          {/* Telegram-style Reactions list (Pills like Image 2: ⚡ 1, 👍 2) */}
          {reactions.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5 mt-1.5 pt-0.5">
              {reactions.map((r) => {
                const hasReacted = (r.user_ids || []).includes(currentUserId);
                return (
                  <button
                    key={r.emoji}
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleReaction?.(message.id, r.emoji);
                    }}
                    className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs transition-all cursor-pointer select-none active:scale-95 shadow-xs ${
                      hasReacted
                        ? isOwn
                          ? 'bg-white/30 text-white border border-white/50 ring-1 ring-white/60 font-bold'
                          : 'bg-blue-100 dark:bg-emerald-950/80 text-blue-700 dark:text-emerald-300 border border-blue-400 dark:border-emerald-500 font-bold'
                        : isOwn
                          ? 'bg-black/20 text-white/95 hover:bg-black/30 border border-white/15'
                          : 'bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-200 border border-gray-200 dark:border-gray-700'
                    }`}
                    title={`${r.emoji} (${r.count || r.user_ids?.length || 1} kishi)`}
                  >
                    <span className="text-sm leading-none">{r.emoji}</span>
                    <span className="text-[11px] font-bold">{r.count || r.user_ids?.length || 1}</span>
                  </button>
                );
              })}
            </div>
          )}

          {/* Time, edit status & delivery status */}
          {(() => {
            const otherViewers = (message.seen_by || []).filter(
              (s) => String(s.user_id) !== String(message.sender_id)
            );
            const isSeenByOthers = otherViewers.length > 0;
            const isEdited = Boolean(message.is_edited || message.edited_at);

            return (
              <div
                className={`flex items-center justify-end space-x-1.5 rtl:space-x-reverse text-[10px] mt-1 select-none cursor-pointer hover:opacity-90 transition-opacity ${
                  isOwn ? 'text-blue-100/90' : 'text-gray-400 dark:text-gray-500'
                }`}
                onClick={(e) => {
                  e.stopPropagation();
                  onViewSeen?.(message);
                }}
                title={
                  isOwn
                    ? isSeenByOthers
                      ? `Ko‘rildi: ${otherViewers.map((v) => v.user_name).join(', ')}`
                      : 'Yuborildi (hali ko‘rilmadi)'
                    : 'Xabar ma’lumoti'
                }
              >
                {/* Telegram-style pencil icon when message was edited */}
                {isEdited && (
                  <span
                    className={`inline-flex items-center gap-0.5 text-[9px] font-medium mr-1 ${
                      isOwn ? 'text-emerald-200' : 'text-emerald-600 dark:text-emerald-400'
                    }`}
                    title={message.edited_at ? `Tahrirlangan: ${formatTime(message.edited_at)}` : 'Tahrirlangan'}
                  >
                    <Pencil className="w-2.5 h-2.5 inline stroke-[2.5]" />
                    <span>tahrirlangan</span>
                  </span>
                )}
                <span>{formatTime(message.created_at)}</span>
                {message.is_pinned && (
                  <span className="inline-flex items-center text-amber-400 dark:text-amber-300 ml-0.5" title="Qadalgan xabar">
                    <Pin className="w-2.5 h-2.5 rotate-45 stroke-[2.5]" />
                  </span>
                )}
                {isOwn && (
                  isSeenByOthers ? (
                    <span className="inline-flex items-center text-cyan-300 font-bold" title={`Ko'rildi (${otherViewers.length} kishi)`}>
                      <CheckCheck className="w-3.5 h-3.5 stroke-[2.5]" />
                    </span>
                  ) : (
                    <span className="inline-flex items-center text-blue-200/80" title="Yuborildi (hali ko'rilmadi)">
                      <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                    </span>
                  )
                )}
              </div>
            );
          })()}
        </div>
      )}

        {/* Floating Telegram Reaction Bar - Smart Directional Opening (Downwards near top, Upwards near bottom) */}
        {showReactionPicker && (
          <div
            ref={reactionPickerRef}
            className={`absolute z-50 flex items-center gap-1 px-2.5 py-1.5 bg-white dark:bg-gray-800 rounded-full shadow-2xl border border-gray-200 dark:border-gray-700 animate-in fade-in zoom-in-95 duration-150 ${
              reactionPlacement === 'bottom'
                ? 'top-full mt-2'
                : 'bottom-full mb-2'
            } ${isOwn ? 'right-0' : 'left-0'}`}
          >
            {TELEGRAM_REACTIONS.map((emoji) => {
              const existing = reactions.find((r) => r.emoji === emoji);
              const hasReacted = existing?.user_ids?.includes(currentUserId);
              return (
                <button
                  key={emoji}
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleReaction?.(message.id, emoji);
                    setShowReactionPicker(false);
                  }}
                  className={`w-7 h-7 flex items-center justify-center rounded-full text-base hover:scale-130 transition-transform active:scale-90 cursor-pointer select-none ${
                    hasReacted
                      ? 'bg-blue-100 dark:bg-emerald-900/60 ring-2 ring-blue-500 dark:ring-emerald-400'
                      : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                  title={emoji}
                >
                  {emoji}
                </button>
              );
            })}
          </div>
        )}

        {/* Hover / Context Actions */}
        <div
          ref={menuRef}
          className={`hidden sm:flex absolute -top-3.5 opacity-0 group-hover:opacity-100 transition-opacity items-center space-x-1 rtl:space-x-reverse z-20 ${
            isOwn ? 'right-1' : 'left-1'
          }`}
        >
          <button
            type="button"
            onClick={toggleReactionPicker}
            className="p-1 rounded-full bg-white dark:bg-gray-700 text-amber-500 hover:text-amber-600 dark:text-amber-400 shadow-sm border border-gray-200 dark:border-gray-600 transition-transform active:scale-95 cursor-pointer"
            title="Emoji reaksiya"
          >
            <Smile className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={() => onViewSeen?.(message)}
            className="p-1 rounded-full bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/40 shadow-sm border border-gray-200 dark:border-gray-600 transition-transform active:scale-95 cursor-pointer"
            title="Kimlar ko‘rdi"
          >
            <Eye className="w-3.5 h-3.5" />
          </button>

          {isOwn && (
            <button
              type="button"
              onClick={() => onEdit?.(message)}
              className="p-1 rounded-full bg-white dark:bg-gray-700 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 shadow-sm border border-gray-200 dark:border-gray-600 transition-transform active:scale-95 cursor-pointer"
              title="Tahrirlash"
            >
              <Pencil className="w-3.5 h-3.5" />
            </button>
          )}

          <button
            type="button"
            onClick={() => onReply?.(message)}
            className="p-1 rounded-full bg-white dark:bg-gray-700 text-gray-500 hover:text-[#123D78] dark:hover:text-white shadow-sm border border-gray-200 dark:border-gray-600 transition-transform active:scale-95 cursor-pointer"
            title={t('chat.reply', 'Reply')}
          >
            <Reply className="w-3.5 h-3.5" />
          </button>

          {canDelete && (
            <button
              type="button"
              onClick={() => onDelete?.(message.id)}
              className="p-1 rounded-full bg-white dark:bg-gray-700 text-gray-500 hover:text-red-600 dark:hover:text-red-400 shadow-sm border border-gray-200 dark:border-gray-600 transition-transform active:scale-95 cursor-pointer"
              title={t('chat.delete', 'Delete')}
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Telegram-style Action & Reaction Menu on Single Tap / Long Press / Right Click */}
        {showContextMenu && (
          <>
            {/* Touch Backdrop for mobile / desktop outside dismiss */}
            <div
              className="fixed inset-0 z-40 bg-black/20 sm:bg-transparent"
              onClick={(e) => {
                e.stopPropagation();
                setShowContextMenu(false);
              }}
            />

            {/* Telegram Popup Menu with Emojis & Actions */}
            <div
              ref={contextMenuRef}
              className={`absolute z-50 bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 py-1.5 w-64 sm:w-72 text-xs font-medium animate-in fade-in zoom-in-95 duration-100 ${
                menuPlacement === 'top' ? 'bottom-full mb-2' : 'top-full mt-2'
              } ${isOwn ? 'right-0' : 'left-0'}`}
            >
              {/* 1. Quick Emoji Reactions Bar (All 10 Telegram Reactions) */}
              <div className="flex items-center gap-1 px-2.5 py-2 border-b border-gray-100 dark:border-gray-700/60 bg-gray-50/80 dark:bg-gray-900/40 overflow-x-auto no-scrollbar">
                {TELEGRAM_REACTIONS.map((emoji) => {
                  const existing = reactions.find((r) => r.emoji === emoji);
                  const hasReacted = existing?.user_ids?.includes(currentUserId);
                  return (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() => handleReact(emoji)}
                      className={`w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center rounded-full hover:scale-125 transition-transform active:scale-90 text-base sm:text-lg cursor-pointer shrink-0 select-none ${
                        hasReacted
                          ? 'bg-blue-100 dark:bg-emerald-900/60 ring-2 ring-blue-500 dark:ring-emerald-400'
                          : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                      }`}
                      title={emoji}
                    >
                      {emoji}
                    </button>
                  );
                })}
              </div>

              {/* 2. Action Menu Items (Exactly as in Telegram) */}
              <div className="py-1">
                {/* Reply */}
                <button
                  type="button"
                  onClick={handleReply}
                  className="w-full flex items-center space-x-2.5 rtl:space-x-reverse px-3.5 py-2 hover:bg-gray-100 dark:hover:bg-gray-700/60 text-gray-700 dark:text-gray-200 text-left font-semibold cursor-pointer transition-colors"
                >
                  <Reply className="w-4 h-4 text-blue-500 shrink-0" />
                  <span>{t('chat.reply', 'Reply')}</span>
                </button>

                {/* Edit (if own message) */}
                {isOwn && (
                  <button
                    type="button"
                    onClick={handleEdit}
                    className="w-full flex items-center space-x-2.5 rtl:space-x-reverse px-3.5 py-2 hover:bg-gray-100 dark:hover:bg-gray-700/60 text-gray-700 dark:text-gray-200 text-left font-semibold cursor-pointer transition-colors"
                  >
                    <Pencil className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>Tahrirlash</span>
                  </button>
                )}

                {/* Pin */}
                <button
                  type="button"
                  onClick={handlePin}
                  className="w-full flex items-center space-x-2.5 rtl:space-x-reverse px-3.5 py-2 hover:bg-gray-100 dark:hover:bg-gray-700/60 text-gray-700 dark:text-gray-200 text-left font-semibold cursor-pointer transition-colors"
                >
                  <Pin className="w-4 h-4 text-amber-500 rotate-45 shrink-0" />
                  <span>{message.is_pinned ? 'Qadashdan olish' : 'Xabarni qadash'}</span>
                </button>

                {/* Copy */}
                <button
                  type="button"
                  onClick={handleCopy}
                  className="w-full flex items-center space-x-2.5 rtl:space-x-reverse px-3.5 py-2 hover:bg-gray-100 dark:hover:bg-gray-700/60 text-gray-700 dark:text-gray-200 text-left font-semibold cursor-pointer transition-colors"
                >
                  <Copy className="w-4 h-4 text-gray-500 dark:text-gray-400 shrink-0" />
                  <span>Nusxa olish</span>
                </button>

                {/* Forward */}
                <button
                  type="button"
                  onClick={handleForward}
                  className="w-full flex items-center space-x-2.5 rtl:space-x-reverse px-3.5 py-2 hover:bg-gray-100 dark:hover:bg-gray-700/60 text-gray-700 dark:text-gray-200 text-left font-semibold cursor-pointer transition-colors"
                >
                  <Forward className="w-4 h-4 text-cyan-500 shrink-0" />
                  <span>Uzatish (Forward)</span>
                </button>

                {/* Kimlar ko'rdi (Viewers) */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowContextMenu(false);
                    onViewSeen?.(message);
                  }}
                  className="w-full flex items-center justify-between px-3.5 py-2 hover:bg-gray-100 dark:hover:bg-gray-700/60 text-gray-700 dark:text-gray-200 text-left font-semibold cursor-pointer transition-colors"
                >
                  <div className="flex items-center space-x-2.5 rtl:space-x-reverse">
                    <Eye className="w-4 h-4 text-indigo-500 shrink-0" />
                    <span>Kimlar ko‘rdi</span>
                  </div>
                  <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300">
                    {(message.seen_by || []).filter((s) => String(s.user_id) !== String(message.sender_id)).length}
                  </span>
                </button>

                {/* Delete (if allowed) */}
                {canDelete && (
                  <button
                    type="button"
                    onClick={handleDelete}
                    className="w-full flex items-center space-x-2.5 rtl:space-x-reverse px-3.5 py-2 hover:bg-red-50 dark:hover:bg-red-950/40 text-red-600 dark:text-red-400 text-left font-semibold cursor-pointer transition-colors border-t border-gray-100 dark:border-gray-700/60 mt-1"
                  >
                    <Trash2 className="w-4 h-4 text-red-500 shrink-0" />
                    <span>{t('chat.delete', 'Delete')}</span>
                  </button>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

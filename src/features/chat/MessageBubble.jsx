import React, { useState, useRef, useEffect } from 'react';
import {
  Reply,
  Trash2,
  Download,
  Play,
  Pause,
  FileText,
  File,
  MoreVertical,
  Check,
  CheckCheck,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';

export default function MessageBubble({
  message,
  currentUserId,
  canDelete = false,
  onReply,
  onDelete,
  onImageClick,
}) {
  const { t, i18n } = useTranslation();
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [audioProgress, setAudioProgress] = useState(0);
  const [showContextMenu, setShowContextMenu] = useState(false);

  const audioRef = useRef(null);
  const menuRef = useRef(null);

  const isRtl = i18n.language === 'ar' || document.documentElement.dir === 'rtl';
  const isOwn = message.sender_id === currentUserId;

  // Parse reply header if present
  let replyData = null;
  let cleanMessageText = message.message || '';

  if (cleanMessageText.startsWith('<!--REPLY:')) {
    const endTagIndex = cleanMessageText.indexOf('-->');
    if (endTagIndex !== -1) {
      try {
        const jsonStr = cleanMessageText.substring(10, endTagIndex);
        replyData = JSON.parse(jsonStr);
        cleanMessageText = cleanMessageText.substring(endTagIndex + 3).trim();
      } catch {}
    }
  }

  // Close context menu on outside click
  useEffect(() => {
    function handleClickOutside(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setShowContextMenu(false);
      }
    }
    if (showContextMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showContextMenu]);

  const handleAudioToggle = () => {
    if (!audioRef.current) return;
    if (isPlayingAudio) {
      audioRef.current.pause();
      setIsPlayingAudio(false);
    } else {
      audioRef.current
        .play()
        .then(() => {
          setIsPlayingAudio(true);
        })
        .catch((err) => {
          console.warn('Audio play error:', err);
        });
    }
  };

  const handleAudioTimeUpdate = () => {
    if (!audioRef.current) return;
    const cur = audioRef.current.currentTime;
    const dur = audioRef.current.duration;
    if (dur && isFinite(dur)) {
      setAudioProgress((cur / dur) * 100);
    }
  };

  const handleAudioEnded = () => {
    setIsPlayingAudio(false);
    setAudioProgress(0);
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

  return (
    <div
      className={`group flex items-end mb-4 relative ${
        isOwn ? 'justify-end' : 'justify-start'
      }`}
      onContextMenu={(e) => {
        e.preventDefault();
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
      <div className={`relative max-w-[85%] sm:max-w-[70%] md:max-w-[60%]`}>
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

        <div
          className={`rounded-2xl px-3.5 py-2.5 shadow-sm text-sm break-words relative transition-colors ${
            isOwn
              ? 'bg-[#123D78] text-white rounded-br-xs'
              : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border border-gray-100 dark:border-gray-700/60 rounded-bl-xs'
          }`}
        >
          {/* Replying-to Preview Quote */}
          {replyData && (
            <div
              className={`mb-2 pl-2.5 rtl:pl-0 rtl:pr-2.5 border-l-2 rtl:border-l-0 rtl:border-r-2 rounded text-xs py-1 ${
                isOwn
                  ? 'border-white/60 bg-white/10 text-white/90'
                  : 'border-[#123D78] bg-gray-50 dark:bg-gray-700/50 text-gray-700 dark:text-gray-300'
              }`}
            >
              <div className="font-semibold text-[11px] opacity-90">
                {replyData.sender_name}
              </div>
              <div className="truncate opacity-80">{replyData.preview}</div>
            </div>
          )}

          {/* Attachments rendering */}
          {message.chat_attachments && message.chat_attachments.length > 0 && (
            <div className="space-y-2 mb-2">
              {message.chat_attachments.map((att) => {
                const fileName = att.file_name || '';
                const isImage =
                  att.file_type?.startsWith('image/') ||
                  /\.(png|jpg|jpeg|gif|webp|svg)$/i.test(fileName);
                const isVideo =
                  att.file_type?.startsWith('video/') ||
                  /\.(mp4|webm|mov|m4v|mkv)$/i.test(fileName);
                const isAudio =
                  !isVideo &&
                  (att.file_type?.startsWith('audio/') ||
                    /\.(mp3|wav|ogg|m4a|aac|opus)$/i.test(fileName));
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

                if (isVideo) {
                  return (
                    <div
                      key={att.id}
                      className="rounded-2xl overflow-hidden bg-black aspect-video w-64 sm:w-80 md:w-96 max-w-full shadow-md"
                    >
                      <video
                        src={url}
                        controls
                        playsInline
                        preload="metadata"
                        className="w-full h-full object-contain"
                      />
                    </div>
                  );
                }

                if (isAudio) {
                  return (
                    <div
                      key={att.id}
                      className={`flex items-center space-x-2.5 rtl:space-x-reverse p-2.5 rounded-2xl min-w-[220px] sm:min-w-[260px] ${
                        isOwn ? 'bg-white/15' : 'bg-gray-100 dark:bg-gray-700/60'
                      }`}
                    >
                      <audio
                        ref={audioRef}
                        src={url}
                        onTimeUpdate={handleAudioTimeUpdate}
                        onEnded={handleAudioEnded}
                        preload="metadata"
                      />
                      <button
                        type="button"
                        onClick={handleAudioToggle}
                        className={`p-2 rounded-full transition-transform active:scale-95 ${
                          isOwn
                            ? 'bg-white text-[#123D78]'
                            : 'bg-[#123D78] text-white'
                        }`}
                      >
                        {isPlayingAudio ? (
                          <Pause className="w-3.5 h-3.5 fill-current" />
                        ) : (
                          <Play className="w-3.5 h-3.5 fill-current ml-0.5 rtl:ml-0 rtl:mr-0.5" />
                        )}
                      </button>

                      <div className="flex-1 min-w-[120px]">
                        <div
                          className={`w-full h-1.5 rounded-full overflow-hidden ${
                            isOwn ? 'bg-white/30' : 'bg-gray-300 dark:bg-gray-600'
                          }`}
                        >
                          <div
                            className={`h-full transition-all duration-150 ${
                              isOwn ? 'bg-white' : 'bg-[#123D78]'
                            }`}
                            style={{ width: `${audioProgress}%` }}
                          />
                        </div>
                        <span className="text-[10px] opacity-75 mt-0.5 block font-mono">
                          {att.file_name || 'Ovozli xabar'}
                        </span>
                      </div>
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
          {cleanMessageText && (
            <p className="whitespace-pre-wrap leading-relaxed select-text font-normal">
              {cleanMessageText}
            </p>
          )}

          {/* Time & status badge */}
          <div
            className={`flex items-center justify-end space-x-1 rtl:space-x-reverse text-[10px] mt-1 select-none ${
              isOwn ? 'text-blue-100/80' : 'text-gray-400 dark:text-gray-500'
            }`}
          >
            <span>{formatTime(message.created_at)}</span>
            {isOwn && <CheckCheck className="w-3 h-3 text-blue-200" />}
          </div>
        </div>

        {/* Hover / Context Actions */}
        <div
          ref={menuRef}
          className={`absolute top-0 opacity-0 group-hover:opacity-100 transition-opacity flex items-center space-x-1 rtl:space-x-reverse z-10 ${
            isOwn ? 'left-0 -translate-x-full pr-1.5' : 'right-0 translate-x-full pl-1.5'
          }`}
        >
          <button
            type="button"
            onClick={() => onReply?.(message)}
            className="p-1 rounded-full bg-white dark:bg-gray-700 text-gray-500 hover:text-[#123D78] dark:hover:text-white shadow-sm border border-gray-200 dark:border-gray-600 transition-transform active:scale-95"
            title={t('chat.reply', 'Reply')}
          >
            <Reply className="w-3.5 h-3.5" />
          </button>

          {canDelete && (
            <button
              type="button"
              onClick={() => onDelete?.(message.id)}
              className="p-1 rounded-full bg-white dark:bg-gray-700 text-gray-500 hover:text-red-600 dark:hover:text-red-400 shadow-sm border border-gray-200 dark:border-gray-600 transition-transform active:scale-95"
              title={t('chat.delete', 'Delete')}
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Right-click Context Menu dropdown if activated */}
        {showContextMenu && (
          <div
            className={`absolute top-2 z-40 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 py-1 min-w-[120px] text-xs font-medium ${
              isOwn ? 'right-0' : 'left-0'
            }`}
          >
            <button
              type="button"
              onClick={() => {
                setShowContextMenu(false);
                onReply?.(message);
              }}
              className="w-full flex items-center space-x-2 rtl:space-x-reverse px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 text-left"
            >
              <Reply className="w-3.5 h-3.5" />
              <span>{t('chat.reply', 'Reply')}</span>
            </button>

            {canDelete && (
              <button
                type="button"
                onClick={() => {
                  setShowContextMenu(false);
                  onDelete?.(message.id);
                }}
                className="w-full flex items-center space-x-2 rtl:space-x-reverse px-3 py-2 hover:bg-red-50 dark:hover:bg-red-950/40 text-red-600 dark:text-red-400 text-left"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{t('chat.delete', 'Delete')}</span>
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

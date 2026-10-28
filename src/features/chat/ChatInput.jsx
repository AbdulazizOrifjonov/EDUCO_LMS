import React, { useState, useRef, useEffect } from 'react';
import {
  Send,
  Paperclip,
  Smile,
  Mic,
  Video,
  X,
  File,
  Image as ImageIcon,
  Loader2,
  Lock,
  ChevronUp,
  Megaphone,
  Sparkles,
  Pencil,
  Check,
  Camera,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import EmojiPicker from './EmojiPicker';
import AudioRecorder from './AudioRecorder';
import VideoRecorder from './VideoRecorder';

export default function ChatInput({
  onSendMessage,
  onUploadFile,
  replyingTo,
  onCancelReply,
  editingMessage = null,
  onCancelEdit,
  uploading = false,
  uploadProgress = null,
  isAnnouncementChat = false,
}) {
  const { t, i18n } = useTranslation();
  const [inputText, setInputText] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showAudioRecorder, setShowAudioRecorder] = useState(false);
  const [showVideoRecorder, setShowVideoRecorder] = useState(false);
  const [videoAutoStart, setVideoAutoStart] = useState(false);
  const [recordMode, setRecordMode] = useState('video'); // 'video' (circular) or 'audio'
  const [isSwipingVideo, setIsSwipingVideo] = useState(false);
  const [swipeOffsetY, setSwipeOffsetY] = useState(0);
  const pointerStartYRef = useRef(null);
  const pointerHoldTimerRef = useRef(null);
  const isHeldDownRef = useRef(false);
  const [selectedAttachments, setSelectedAttachments] = useState([]);

  const textareaRef = useRef(null);
  const fileInputRef = useRef(null);

  // Auto-resize textarea as user types
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 140)}px`;
    }
  }, [inputText]);

  // Focus input when replying to a message
  useEffect(() => {
    if (replyingTo && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [replyingTo]);

  // Prepopulate and focus input when editing a message (Telegram-style)
  useEffect(() => {
    if (editingMessage) {
      let rawText = editingMessage.message || '';
      // Strip out <!--REPLY:...--> if present
      rawText = rawText.replace(/<!--REPLY:[\s\S]*?-->/g, '').trim();
      // Strip out announcement prefix if present
      rawText = rawText
        .replace(/^📢 \[RASMIY MARKAZ E'LONI\]:\n?/i, '')
        .replace(/^📢 \[RASMIY E'LON\]:\n?/i, '')
        .replace(/^📢 \[.*?\]:\n?/i, '')
        .trim();
      setInputText(rawText);
      if (textareaRef.current) {
        textareaRef.current.focus();
        setTimeout(() => {
          if (textareaRef.current) {
            textareaRef.current.selectionStart = textareaRef.current.selectionEnd = textareaRef.current.value.length;
          }
        }, 50);
      }
    }
  }, [editingMessage]);

  const handleTextChange = (e) => {
    setInputText(e.target.value);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleEmojiSelect = (emoji) => {
    setInputText((prev) => prev + emoji);
    setShowEmojiPicker(false);
    textareaRef.current?.focus();
  };

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    // Validate size (max 50MB per file)
    const validFiles = files.filter((f) => {
      if (f.size > 50 * 1024 * 1024) {
        alert(`${f.name} exceeds the maximum file size limit of 50MB.`);
        return false;
      }
      return true;
    });

    setSelectedAttachments((prev) => [...prev, ...validFiles]);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeAttachment = (index) => {
    setSelectedAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSend = async () => {
    const trimmed = inputText.trim();
    if (!trimmed && selectedAttachments.length === 0) return;
    if (uploading) return;

    if (editingMessage) {
      const textToUpdate = trimmed;
      setInputText('');
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
      await onSendMessage({
        text: textToUpdate,
        isEdit: true,
        editingMessageId: editingMessage.id,
      });
      onCancelEdit?.();
      return;
    }

    const attachmentsToSend = [...selectedAttachments];
    const textToSend = trimmed;

    // Clear state immediately for responsive feel
    setInputText('');
    setSelectedAttachments([]);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }

    await onSendMessage({
      text: textToSend,
      files: attachmentsToSend,
      replyTo: replyingTo,
    });

    onCancelReply?.();
  };

  const handleAudioRecordingDone = async (audioFile) => {
    setShowAudioRecorder(false);
    if (!audioFile) return;
    await onSendMessage({
      text: '',
      files: [audioFile],
      replyTo: replyingTo,
    });
    onCancelReply?.();
  };

  const handleVideoRecordingDone = async (videoFile) => {
    setShowVideoRecorder(false);
    setVideoAutoStart(false);
    if (!videoFile) return;
    await onSendMessage({
      text: '',
      files: [videoFile],
      replyTo: replyingTo,
    });
    onCancelReply?.();
  };

  const handleActionPointerDown = (e) => {
    pointerStartYRef.current = e.clientY;
    setIsSwipingVideo(true);
    setSwipeOffsetY(0);
    isHeldDownRef.current = false;

    // Press & hold starts recording after 350ms (just like Telegram)
    if (pointerHoldTimerRef.current) clearTimeout(pointerHoldTimerRef.current);
    pointerHoldTimerRef.current = setTimeout(() => {
      isHeldDownRef.current = true;
      if (recordMode === 'video') {
        setVideoAutoStart(true);
        setShowVideoRecorder(true);
      } else {
        setShowAudioRecorder(true);
      }
    }, 350);
  };

  const handleActionPointerMove = (e) => {
    if (!isSwipingVideo || pointerStartYRef.current === null) return;
    const currentY = e.clientY;
    const deltaY = currentY - pointerStartYRef.current;
    if (deltaY < 0) {
      setSwipeOffsetY(Math.min(50, Math.abs(deltaY)));
      // Swipe up locks recording
      if (deltaY <= -25) {
        if (pointerHoldTimerRef.current) clearTimeout(pointerHoldTimerRef.current);
        setIsSwipingVideo(false);
        pointerStartYRef.current = null;
        if (recordMode === 'video') {
          setVideoAutoStart(true);
          setShowVideoRecorder(true);
        } else {
          setShowAudioRecorder(true);
        }
      }
    }
  };

  const handleActionPointerUp = () => {
    if (pointerHoldTimerRef.current) {
      clearTimeout(pointerHoldTimerRef.current);
      pointerHoldTimerRef.current = null;
    }
    setIsSwipingVideo(false);
    pointerStartYRef.current = null;
  };

  const handleActionClick = () => {
    if (isHeldDownRef.current) {
      isHeldDownRef.current = false;
      return;
    }
    // Single click opens recorder directly
    if (recordMode === 'video') {
      setVideoAutoStart(true);
      setShowVideoRecorder(true);
    } else {
      setShowAudioRecorder(true);
    }
  };

  const toggleRecordMode = (e) => {
    e.stopPropagation();
    setRecordMode((prev) => (prev === 'video' ? 'audio' : 'video'));
  };

  return (
    <div className="relative shrink-0 border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-2.5 sm:p-3 md:p-4 pb-[max(0.625rem,env(safe-area-inset-bottom))] mb-0">
      {/* Upload Progress Bar */}
      {uploading && uploadProgress !== null && (
        <div className="absolute top-0 left-0 right-0 h-1 bg-gray-200 dark:bg-gray-700 overflow-hidden">
          <div
            className="h-full bg-[#123D78] transition-all duration-150"
            style={{ width: `${uploadProgress}%` }}
          />
        </div>
      )}

      {/* Editing Message Banner (Telegram style) */}
      {editingMessage && (
        <div className="flex items-center justify-between mb-2.5 px-3.5 py-2 bg-emerald-50 dark:bg-emerald-950/40 border-l-4 rtl:border-l-0 rtl:border-r-4 border-emerald-600 rounded-r-2xl rtl:rounded-r-none rtl:rounded-l-2xl animate-in fade-in slide-in-from-bottom-2 duration-150 shadow-2xs">
          <div className="flex items-center gap-2.5 min-w-0 pr-2">
            <div className="w-7 h-7 rounded-lg bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 flex items-center justify-center shrink-0">
              <Pencil className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <span className="text-xs font-bold text-emerald-800 dark:text-emerald-300 block">
                Xabarni tahrirlash
              </span>
              <p className="text-xs text-gray-600 dark:text-gray-300 truncate font-medium">
                {editingMessage.message?.replace(/<!--REPLY:[\s\S]*?-->\n?/, '').replace(/📢 \[RASMIY.*?\]:\n?/, '') || ''}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              setInputText('');
              onCancelEdit?.();
            }}
            className="p-1 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-emerald-100/60 dark:hover:bg-emerald-900/40 transition-colors cursor-pointer"
            title="Tahrirlashni bekor qilish"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Replying Preview Bar */}
      {replyingTo && !editingMessage && (
        <div className="flex items-center justify-between mb-2.5 px-3 py-1.5 bg-blue-50 dark:bg-blue-950/40 border-l-4 rtl:border-l-0 rtl:border-r-4 border-[#123D78] rounded-r-lg rtl:rounded-r-none rtl:rounded-l-lg animate-in fade-in slide-in-from-bottom-2 duration-150">
          <div className="min-w-0 pr-2">
            <span className="text-xs font-semibold text-[#123D78] dark:text-blue-400 block">
              {t('chat.reply', 'Replying to')}{' '}
              {replyingTo.sender?.first_name || replyingTo.senderName || 'User'}
            </span>
            <p className="text-xs text-gray-600 dark:text-gray-300 truncate">
              {(replyingTo.message || '')
                .replace(/<!--REPLY:[\s\S]*?-->/g, '')
                .replace(/^📢 \[.*?\]:\n?/i, '')
                .trim() ||
                (replyingTo.chat_attachments?.length ? t('chat.attachment', 'Biriktirilgan fayl') : '')}
            </p>
          </div>
          <button
            type="button"
            onClick={onCancelReply}
            className="p-1 rounded-full text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Selected Attachments Preview */}
      {selectedAttachments.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-2.5">
          {selectedAttachments.map((file, idx) => (
            <div
              key={idx}
              className="flex items-center space-x-1.5 rtl:space-x-reverse bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 px-2.5 py-1 rounded-xl text-xs text-gray-700 dark:text-gray-300"
            >
              <File className="w-3.5 h-3.5 text-[#123D78] flex-shrink-0" />
              <span className="max-w-[120px] truncate">{file.name}</span>
              <button
                type="button"
                onClick={() => removeAttachment(idx)}
                className="text-gray-400 hover:text-red-500 ml-1 rtl:ml-0 rtl:mr-1"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Audio Recorder Mode */}
      {showAudioRecorder ? (
        <AudioRecorder
          onRecordingComplete={handleAudioRecordingDone}
          onCancel={() => setShowAudioRecorder(false)}
        />
      ) : (
        /* Telegram 1-to-1 Style Input Bar */
        <div className="flex flex-col gap-2 min-w-0 w-full">
          {/* Quick template suggestions for Announcements when empty */}
          {isAnnouncementChat && !inputText.trim() && selectedAttachments.length === 0 && (
            <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 select-none scrollbar-none">
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 shrink-0 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-emerald-500" />
                Namuna:
              </span>
              <button
                type="button"
                onClick={() => setInputText("Assalomu alaykum! Barcha xodimlar va talabalarni bayram bilan tabriklaymiz! Dam olish kunlari haqida: ")}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-300/60 dark:border-emerald-700/60 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 transition-colors shrink-0 cursor-pointer"
              >
                🎉 Bayram tabrigi
              </button>
              <button
                type="button"
                onClick={() => setInputText("Hurmatli o'quvchilar va xodimlar! Dars jadvallari va markaz faoliyati bo'yicha muhim xabar: ")}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium bg-teal-50 dark:bg-teal-950/40 text-teal-800 dark:text-teal-300 border border-teal-300/60 dark:border-teal-700/60 hover:bg-teal-100 dark:hover:bg-teal-900/50 transition-colors shrink-0 cursor-pointer"
              >
                📢 Muhim xabarnoma
              </button>
              <button
                type="button"
                onClick={() => setInputText("Diqqat: Bugungi darslar va mashg'ulotlar grafigida quyidagi o'zgarishlar mavjud: ")}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border border-amber-300/60 dark:border-amber-700/60 hover:bg-amber-100 dark:hover:bg-amber-900/50 transition-colors shrink-0 cursor-pointer"
              >
                ⏰ Dars jadvali
              </button>
            </div>
          )}

          {/* TELEGRAM STYLE INPUT CAPSULE & FLOATING ROUND BUTTON */}
          <div className="flex items-end gap-2 w-full">
            {/* Telegram Input Capsule Pill */}
            <div
              className={`flex-1 min-w-0 rounded-[28px] bg-white dark:bg-[#182533] border transition-all duration-150 flex items-end px-2.5 sm:px-3 py-1 shadow-sm ${
                isAnnouncementChat
                  ? 'border-emerald-500/50 dark:border-emerald-600/50 focus-within:border-emerald-500'
                  : 'border-gray-200 dark:border-gray-700/70 focus-within:border-emerald-500 dark:focus-within:border-emerald-400 focus-within:ring-1 focus-within:ring-emerald-500/30'
              }`}
            >
              {/* Left: Smile Emoji button */}
              <div className="relative shrink-0 mb-0.5">
                <button
                  type="button"
                  onClick={() => setShowEmojiPicker((prev) => !prev)}
                  className="p-1.5 sm:p-2 rounded-full text-gray-500 dark:text-gray-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer"
                  title={t('chat.emoji', 'Emoji')}
                >
                  <Smile className="w-5 h-5 sm:w-5 sm:h-5" />
                </button>
                <EmojiPicker
                  isOpen={showEmojiPicker}
                  onClose={() => setShowEmojiPicker(false)}
                  onEmojiSelect={handleEmojiSelect}
                />
              </div>

              {/* Center: Textarea auto-resize */}
              <textarea
                ref={textareaRef}
                rows={1}
                value={inputText}
                onChange={handleTextChange}
                onKeyDown={handleKeyDown}
                placeholder={
                  isAnnouncementChat
                    ? "Barcha xodimlar va guruhlarga e'lon yozing..."
                    : t('chat.typeMessage', 'Xabar...')
                }
                disabled={uploading}
                className="flex-1 min-w-0 bg-transparent border-0 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 text-sm leading-relaxed max-h-32 resize-none py-2 px-1 focus:outline-none focus:ring-0"
              />

              {/* Right inside pill: File Paperclip */}
              <div className="shrink-0 mb-0.5">
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="p-1.5 sm:p-2 rounded-full text-gray-500 dark:text-gray-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer"
                  title={t('chat.attachment', 'Fayl biriktirish')}
                >
                  <Paperclip className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Telegram Round Action Button */}
            <div className="shrink-0 mb-0.5 select-none relative">
              {inputText.trim() || selectedAttachments.length > 0 ? (
                /* Telegram Send Button */
                <button
                  type="button"
                  onClick={handleSend}
                  disabled={uploading}
                  className="w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-blue-600 hover:bg-blue-700 dark:bg-emerald-600 dark:hover:bg-emerald-500 text-white flex items-center justify-center shadow-lg shadow-blue-600/30 dark:shadow-emerald-600/30 active:scale-90 transition-transform cursor-pointer"
                  title={isAnnouncementChat ? "E'lonni tarqatish" : t('chat.send', 'Yuborish')}
                >
                  {uploading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : editingMessage ? (
                    <Check className="w-5 h-5 stroke-[2.5]" />
                  ) : isAnnouncementChat ? (
                    <Megaphone className="w-5 h-5" />
                  ) : (
                    <Send className="w-5 h-5 ml-0.5" />
                  )}
                </button>
              ) : (
                /* Telegram Round Video / Voice Note Button */
                <div className="relative">
                  {isSwipingVideo && (
                    <div className="absolute -top-12 left-1/2 -translate-x-1/2 flex items-center gap-1.5 px-3 py-1 bg-blue-600 dark:bg-emerald-600 text-white rounded-full shadow-2xl text-[11px] font-bold z-30 animate-bounce whitespace-nowrap pointer-events-none">
                      <Lock className="w-3.5 h-3.5 text-amber-300" />
                      <span>Qulflash uchun tepaga suring</span>
                      <ChevronUp className="w-3.5 h-3.5 text-white" />
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={handleActionClick}
                    onPointerDown={handleActionPointerDown}
                    onPointerMove={handleActionPointerMove}
                    onPointerUp={handleActionPointerUp}
                    onPointerCancel={handleActionPointerUp}
                    className="w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-blue-600 hover:bg-blue-700 dark:bg-emerald-600 dark:hover:bg-emerald-500 text-white flex items-center justify-center shadow-lg shadow-blue-600/30 dark:shadow-emerald-600/30 active:scale-90 transition-transform cursor-pointer group"
                    title={
                      recordMode === 'video'
                        ? "Dumaloq video xabar (Bosib turing yoki bosing)"
                        : "Ovozli xabar (Bosib turing yoki bosing)"
                    }
                  >
                    {recordMode === 'video' ? (
                      <Camera className="w-5 h-5 group-hover:scale-110 transition-transform" />
                    ) : (
                      <Mic className="w-5 h-5 group-hover:scale-110 transition-transform" />
                    )}
                  </button>

                  {/* Quick Mode Toggle Pill (Camera / Mic) */}
                  <button
                    type="button"
                    onClick={toggleRecordMode}
                    className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-gray-900 border border-emerald-400 text-emerald-400 flex items-center justify-center shadow-xs cursor-pointer hover:scale-110 transition-transform"
                    title="Video va ovoz rejimini almashtirish"
                  >
                    {recordMode === 'video' ? (
                      <Mic className="w-2.5 h-2.5" />
                    ) : (
                      <Camera className="w-2.5 h-2.5" />
                    )}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Video Recorder Modal */}
      {showVideoRecorder && (
        <VideoRecorder
          onRecordingComplete={handleVideoRecordingDone}
          onCancel={() => {
            setShowVideoRecorder(false);
            setVideoAutoStart(false);
          }}
          uploadProgress={uploading ? uploadProgress : null}
          autoStart={videoAutoStart}
        />
      )}
    </div>
  );
}

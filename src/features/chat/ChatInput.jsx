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
  uploading = false,
  uploadProgress = null,
}) {
  const { t, i18n } = useTranslation();
  const [inputText, setInputText] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showAudioRecorder, setShowAudioRecorder] = useState(false);
  const [showVideoRecorder, setShowVideoRecorder] = useState(false);
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
    if (!videoFile) return;
    await onSendMessage({
      text: '',
      files: [videoFile],
      replyTo: replyingTo,
    });
    onCancelReply?.();
  };

  return (
    <div className="relative border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-3 sm:p-4">
      {/* Upload Progress Bar */}
      {uploading && uploadProgress !== null && (
        <div className="absolute top-0 left-0 right-0 h-1 bg-gray-200 dark:bg-gray-700 overflow-hidden">
          <div
            className="h-full bg-[#123D78] transition-all duration-150"
            style={{ width: `${uploadProgress}%` }}
          />
        </div>
      )}

      {/* Replying Preview Bar */}
      {replyingTo && (
        <div className="flex items-center justify-between mb-2.5 px-3 py-1.5 bg-blue-50 dark:bg-blue-950/40 border-l-4 rtl:border-l-0 rtl:border-r-4 border-[#123D78] rounded-r-lg rtl:rounded-r-none rtl:rounded-l-lg animate-in fade-in slide-in-from-bottom-2 duration-150">
          <div className="min-w-0 pr-2">
            <span className="text-xs font-semibold text-[#123D78] dark:text-blue-400 block">
              {t('chat.reply', 'Replying to')}{' '}
              {replyingTo.sender?.first_name || replyingTo.senderName || 'User'}
            </span>
            <p className="text-xs text-gray-600 dark:text-gray-300 truncate">
              {replyingTo.message || (replyingTo.chat_attachments?.length ? 'Attachment' : '')}
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
        /* Standard Input Bar */
        <div className="flex items-end space-x-1.5 sm:space-x-2 rtl:space-x-reverse">
          {/* Emoji Picker Button & Popup */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowEmojiPicker((prev) => !prev)}
              className="p-2 sm:p-2.5 rounded-full text-gray-500 hover:text-[#123D78] dark:text-gray-400 dark:hover:text-blue-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              title={t('chat.emoji', 'Emoji')}
            >
              <Smile className="w-5 h-5" />
            </button>
            <EmojiPicker
              isOpen={showEmojiPicker}
              onClose={() => setShowEmojiPicker(false)}
              onEmojiSelect={handleEmojiSelect}
            />
          </div>

          {/* Attachment Button */}
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
            className="p-2 sm:p-2.5 rounded-full text-gray-500 hover:text-[#123D78] dark:text-gray-400 dark:hover:text-blue-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            title={t('chat.attachment', 'Attach file')}
          >
            <Paperclip className="w-5 h-5" />
          </button>

          {/* Video Recorder Trigger */}
          <button
            type="button"
            onClick={() => setShowVideoRecorder(true)}
            className="p-2 sm:p-2.5 rounded-full text-gray-500 hover:text-[#123D78] dark:text-gray-400 dark:hover:text-blue-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            title={t('chat.recordVideo', 'Record Video')}
          >
            <Video className="w-5 h-5" />
          </button>

          {/* Audio Recorder Trigger */}
          <button
            type="button"
            onClick={() => setShowAudioRecorder(true)}
            className="p-2 sm:p-2.5 rounded-full text-gray-500 hover:text-[#123D78] dark:text-gray-400 dark:hover:text-blue-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            title={t('chat.recordAudio', 'Record Audio')}
          >
            <Mic className="w-5 h-5" />
          </button>

          {/* Textarea Input */}
          <div className="flex-1 min-w-0">
            <textarea
              ref={textareaRef}
              rows={1}
              value={inputText}
              onChange={handleTextChange}
              onKeyDown={handleKeyDown}
              placeholder={t('chat.typeMessage', 'Type a message...')}
              disabled={uploading}
              className="w-full resize-none max-h-36 py-2.5 px-3.5 bg-gray-100 dark:bg-gray-800 border-0 rounded-2xl text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:ring-2 focus:ring-[#123D78] dark:focus:ring-blue-500 text-sm leading-relaxed"
            />
          </div>

          {/* Send Button */}
          <button
            type="button"
            onClick={handleSend}
            disabled={uploading || (!inputText.trim() && selectedAttachments.length === 0)}
            className={`p-2.5 rounded-full font-semibold transition-all duration-150 ${
              inputText.trim() || selectedAttachments.length > 0
                ? 'bg-[#123D78] hover:bg-[#0e2f5c] text-white shadow-md active:scale-95'
                : 'bg-gray-200 dark:bg-gray-800 text-gray-400 cursor-not-allowed'
            }`}
            title={t('chat.send', 'Send')}
          >
            {uploading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </button>
        </div>
      )}

      {/* Video Recorder Modal */}
      {showVideoRecorder && (
        <VideoRecorder
          onRecordingComplete={handleVideoRecordingDone}
          onCancel={() => setShowVideoRecorder(false)}
          uploadProgress={uploading ? uploadProgress : null}
        />
      )}
    </div>
  );
}

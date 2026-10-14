import React, { useEffect, useRef } from 'react';
import EmojiPickerReact, { Theme } from 'emoji-picker-react';
import { useTranslation } from 'react-i18next';

export default function EmojiPicker({ onEmojiSelect, onClose, isOpen }) {
  const { i18n } = useTranslation();
  const pickerRef = useRef(null);

  // Detect dark mode from html class
  const isDark = typeof document !== 'undefined' && document.documentElement.classList.contains('dark');
  const isRtl = i18n.language === 'ar' || document.documentElement.dir === 'rtl';

  useEffect(() => {
    if (!isOpen) return;

    function handleClickOutside(event) {
      if (pickerRef.current && !pickerRef.current.contains(event.target)) {
        onClose?.();
      }
    }

    function handleKeyDown(event) {
      if (event.key === 'Escape') {
        onClose?.();
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleEmojiClick = (emojiData) => {
    if (emojiData && emojiData.emoji) {
      onEmojiSelect?.(emojiData.emoji);
    }
  };

  return (
    <div
      ref={pickerRef}
      className={`absolute bottom-full mb-3 z-50 shadow-2xl rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden animate-in fade-in zoom-in-95 duration-150 ${
        isRtl ? 'right-2 md:right-4' : 'left-2 md:left-4'
      }`}
    >
      <EmojiPickerReact
        onEmojiClick={handleEmojiClick}
        theme={isDark ? Theme.DARK : Theme.LIGHT}
        searchPlaceHolder="Search emoji..."
        lazyLoadEmojis
        previewConfig={{ showPreview: false }}
        width={340}
        height={380}
      />
    </div>
  );
}

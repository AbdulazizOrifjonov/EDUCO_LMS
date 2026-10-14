import React, { useEffect } from 'react';
import { X, Download, ExternalLink } from 'lucide-react';

export default function ImagePreview({ src, alt = 'Image preview', onClose }) {
  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === 'Escape') {
        onClose?.();
      }
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!src) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4 animate-in fade-in duration-200"
      onClick={onClose}
    >
      {/* Top action buttons */}
      <div
        className="absolute top-4 right-4 flex items-center space-x-3 rtl:space-x-reverse z-10"
        onClick={(e) => e.stopPropagation()}
      >
        <a
          href={src}
          download
          target="_blank"
          rel="noopener noreferrer"
          className="p-2.5 rounded-full bg-white/10 hover:bg-white/25 text-white transition-colors"
          title="Open in new tab / download"
        >
          <Download className="w-5 h-5" />
        </a>
        <button
          type="button"
          onClick={onClose}
          className="p-2.5 rounded-full bg-white/10 hover:bg-red-600/80 text-white transition-colors"
          title="Close"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Image container */}
      <div
        className="max-w-4xl max-h-[90vh] overflow-hidden flex items-center justify-center"
        onClick={(e) => e.stopPropagation()}
      >
        <img
          src={src}
          alt={alt}
          className="max-h-[85vh] max-w-full object-contain rounded-lg shadow-2xl select-none"
        />
      </div>
    </div>
  );
}

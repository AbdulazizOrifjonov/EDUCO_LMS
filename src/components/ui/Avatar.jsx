import React, { useState } from 'react';

export default function Avatar({
  src,
  alt = '',
  name = '',
  size = 'md',
  status,
  className = '',
}) {
  const [imageError, setImageError] = useState(false);

  const sizeClasses = {
    xs: 'w-6 h-6 text-[10px]',
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-12 h-12 text-base',
    xl: 'w-16 h-16 text-lg',
  }[size] || 'w-10 h-10 text-sm';

  const statusSizeClasses = {
    xs: 'w-1.5 h-1.5',
    sm: 'w-2 h-2',
    md: 'w-2.5 h-2.5',
    lg: 'w-3 h-3',
    xl: 'w-3.5 h-3.5',
  }[size] || 'w-2.5 h-2.5';

  const getInitials = (str) => {
    if (!str) return 'U';
    const parts = str.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  const getBackgroundColor = (str) => {
    const colors = [
      'bg-blue-600',
      'bg-indigo-600',
      'bg-emerald-600',
      'bg-amber-600',
      'bg-purple-600',
      'bg-teal-600',
      'bg-brand-navy',
    ];
    if (!str) return 'bg-brand-navy';
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
  };

  const statusColors = {
    online: 'bg-emerald-500',
    offline: 'bg-gray-400',
    busy: 'bg-brand-red',
    away: 'bg-amber-500',
  };

  return (
    <div className={`relative inline-block shrink-0 ${className}`}>
      <div
        className={`
          ${sizeClasses} rounded-full overflow-hidden flex items-center justify-center font-semibold text-white select-none
          ${src && !imageError ? 'bg-gray-200 dark:bg-gray-700' : getBackgroundColor(name || alt)}
        `}
      >
        {src && !imageError ? (
          <img
            src={src}
            alt={alt || name}
            onError={() => setImageError(true)}
            className="w-full h-full object-cover"
          />
        ) : (
          <span>{getInitials(name || alt)}</span>
        )}
      </div>

      {status && statusColors[status] && (
        <span
          className={`
            absolute bottom-0 right-0 rtl:right-auto rtl:left-0 rounded-full ring-2 ring-white dark:ring-surface-dark-secondary
            ${statusSizeClasses}
            ${statusColors[status]}
          `}
        />
      )}
    </div>
  );
}

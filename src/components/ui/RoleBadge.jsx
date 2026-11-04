// src/components/ui/RoleBadge.jsx
import React from 'react';
import { ROLES } from '@/lib/constants';

export const ROLE_CONFIG = {
  [ROLES.OWNER]: {
    label: 'RAHBAR',
    icon: '👑',
    className:
      'bg-[#FFE4E6] dark:bg-rose-950/50 text-[#BE123C] dark:text-rose-300 border border-[#FECDD3] dark:border-rose-800/60 shadow-xs',
  },
  [ROLES.ADMIN]: {
    label: 'ADMIN',
    icon: '🛡️',
    className:
      'bg-[#EDE9FE] dark:bg-purple-950/50 text-[#6D28D9] dark:text-purple-300 border border-[#DDD6FE] dark:border-purple-800/60 shadow-xs',
  },
  [ROLES.TEACHER]: {
    label: 'USTOZ',
    icon: '👨‍🏫',
    className:
      'bg-[#FEF3C7] dark:bg-amber-950/50 text-[#B45309] dark:text-amber-300 border border-[#FDE68A] dark:border-amber-800/60 shadow-xs',
  },
  [ROLES.STUDENT]: {
    label: "O'QUVCHI",
    icon: '🎓',
    className:
      'bg-[#D1FAE5] dark:bg-emerald-950/50 text-[#047857] dark:text-emerald-300 border border-[#A7F3D0] dark:border-emerald-800/60 shadow-xs',
  },
};

export default function RoleBadge({ role, className = '', size = 'md', onClick }) {
  const normRole = String(role || '').toLowerCase();
  const cfg =
    normRole === 'owner' || normRole === ROLES.OWNER
      ? ROLE_CONFIG[ROLES.OWNER]
      : normRole === 'admin' || normRole === 'administrator' || normRole === ROLES.ADMIN
      ? ROLE_CONFIG[ROLES.ADMIN]
      : normRole === 'teacher' || normRole === 'ustoz' || normRole === ROLES.TEACHER
      ? ROLE_CONFIG[ROLES.TEACHER]
      : ROLE_CONFIG[ROLES.STUDENT];

  const sizeClasses = {
    sm: 'text-[10px] px-2 py-0.5 gap-1',
    md: 'text-[11px] sm:text-xs px-2.5 py-0.5 gap-1.5',
    lg: 'text-xs sm:text-sm px-3.5 py-1 gap-2',
  }[size] || 'text-[11px] sm:text-xs px-2.5 py-0.5 gap-1.5';

  const Comp = onClick ? 'button' : 'span';

  return (
    <Comp
      type={onClick ? 'button' : undefined}
      onClick={onClick}
      className={`inline-flex items-center font-black uppercase tracking-wider rounded-full transition-all select-none ${cfg.className} ${sizeClasses} ${
        onClick ? 'cursor-pointer hover:scale-105 active:scale-95' : ''
      } ${className}`}
    >
      <span className="shrink-0 text-xs sm:text-sm leading-none" role="img" aria-label={cfg.label}>
        {cfg.icon}
      </span>
      <span className="font-extrabold">{cfg.label}</span>
    </Comp>
  );
}

import React, { useState } from 'react';
import { Search, Users, Briefcase, Pin } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export default function ChatSidebar({
  groups = [],
  activeGroupId = null,
  onSelectGroup,
  loading = false,
  userRole = 'student',
}) {
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all'); // 'all' | 'staff' | 'groups'

  const isStaffUser = ['owner', 'admin', 'teacher'].includes(userRole);

  const filteredGroups = groups.filter((g) => {
    if (categoryFilter === 'staff' && !g.isStaffChat) return false;
    if (categoryFilter === 'groups' && g.isStaffChat) return false;

    const nameMatch = g.name?.toLowerCase().includes(searchQuery.toLowerCase());
    const courseMatch = g.course?.name?.toLowerCase().includes(searchQuery.toLowerCase());
    return nameMatch || courseMatch;
  });

  const formatMessageTime = (isoString) => {
    if (!isoString) return '';
    try {
      const date = new Date(isoString);
      const now = new Date();
      const isToday =
        date.getDate() === now.getDate() &&
        date.getMonth() === now.getMonth() &&
        date.getFullYear() === now.getFullYear();

      if (isToday) {
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      }
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    } catch {
      return '';
    }
  };

  const getMessageSnippet = (group) => {
    if (!group.lastMessage) {
      return t('chat.noMessages', 'Xabarlar hali yoʻq');
    }
    const msg = group.lastMessage;
    const senderPrefix = msg.sender?.first_name ? `${msg.sender.first_name}: ` : '';
    let text = msg.message || '';
    if (text.startsWith('<!--REPLY:')) {
      const endTag = text.indexOf('-->');
      if (endTag !== -1) {
        text = text.substring(endTag + 3).trim();
      }
    }

    if (text) return `${senderPrefix}${text}`;
    if (msg.chat_attachments && msg.chat_attachments.length > 0) {
      const att = msg.chat_attachments[0];
      if (att.file_type?.startsWith('image/')) return `${senderPrefix}📷 ${t('chat.image', 'Rasm')}`;
      if (att.file_type?.startsWith('video/')) return `${senderPrefix}🎥 ${t('chat.video', 'Video')}`;
      if (att.file_type?.startsWith('audio/')) return `${senderPrefix}🎤 ${t('chat.audio', 'Ovozli xabar')}`;
      return `${senderPrefix}📎 ${t('chat.attachment', 'Fayl')}`;
    }
    return `${senderPrefix}${t('chat.message', 'Xabar')}`;
  };

  return (
    <div className="w-full md:w-80 lg:w-96 h-full flex flex-col bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800">
      {/* Sidebar Header & Search */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-800 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2 rtl:space-x-reverse">
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">
              {t('chat.title', 'Guruh chati')}
            </h1>
            <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/50 text-[#123D78] dark:text-blue-300 font-semibold">
              {groups.length}
            </span>
          </div>
        </div>

        {/* Search Input */}
        <div className="relative">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 rtl:left-auto rtl:right-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t('common.search', 'Qidirish...')}
            className="w-full pl-9 pr-4 rtl:pr-9 rtl:pl-4 py-2 bg-gray-100 dark:bg-gray-800 border-0 rounded-xl text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:ring-2 focus:ring-[#123D78] dark:focus:ring-blue-500 transition-all"
          />
        </div>

        {/* Category Filter Tabs for Staff (Owner, Admin, Teacher) */}
        {isStaffUser && (
          <div className="grid grid-cols-3 gap-1 p-1 rounded-xl bg-gray-100 dark:bg-gray-800">
            <button
              type="button"
              onClick={() => setCategoryFilter('all')}
              className={`py-1.5 px-2 rounded-lg text-xs font-bold transition-all ${
                categoryFilter === 'all'
                  ? 'bg-white dark:bg-gray-900 text-[#123D78] dark:text-blue-400 shadow-xs'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900'
              }`}
            >
              Barchasi
            </button>
            <button
              type="button"
              onClick={() => setCategoryFilter('staff')}
              className={`py-1.5 px-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1 ${
                categoryFilter === 'staff'
                  ? 'bg-white dark:bg-gray-900 text-[#123D78] dark:text-blue-400 shadow-xs'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900'
              }`}
            >
              <Briefcase className="w-3 h-3 shrink-0" />
              <span>Xodimlar</span>
            </button>
            <button
              type="button"
              onClick={() => setCategoryFilter('groups')}
              className={`py-1.5 px-2 rounded-lg text-xs font-bold transition-all ${
                categoryFilter === 'groups'
                  ? 'bg-white dark:bg-gray-900 text-[#123D78] dark:text-blue-400 shadow-xs'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900'
              }`}
            >
              Guruhlar
            </button>
          </div>
        )}
      </div>

      {/* Groups List */}
      <div className="flex-1 overflow-y-auto divide-y divide-gray-100 dark:divide-gray-800/60">
        {loading ? (
          <div className="p-4 space-y-3">
            {[1, 2, 3, 4].map((n) => (
              <div key={n} className="flex items-center space-x-3 rtl:space-x-reverse animate-pulse">
                <div className="w-12 h-12 rounded-2xl bg-gray-200 dark:bg-gray-800 flex-shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-3/4" />
                  <div className="h-3 bg-gray-200 dark:bg-gray-800 rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredGroups.length === 0 ? (
          <div className="p-8 text-center text-gray-400 dark:text-gray-500">
            <Users className="w-8 h-8 mx-auto mb-2 opacity-40" />
            <p className="text-sm font-medium">
              {searchQuery ? t('common.noData', 'Hech narsa topilmadi') : t('chat.noChats', 'Guruh chatlari mavjud emas')}
            </p>
          </div>
        ) : (
          filteredGroups.map((group) => {
            const isActive = group.id === activeGroupId;
            const courseColor = group.course?.color || '#123D78';
            const snippet = getMessageSnippet(group);
            const timeStr = formatMessageTime(group.lastMessage?.created_at);

            return (
              <button
                key={group.id}
                type="button"
                onClick={() => onSelectGroup(group)}
                className={`w-full p-3.5 flex items-start space-x-3 rtl:space-x-reverse text-left transition-colors relative ${
                  isActive
                    ? 'bg-blue-50/80 dark:bg-blue-950/30'
                    : group.isStaffChat
                    ? 'bg-amber-50/40 dark:bg-amber-950/10 hover:bg-amber-50/70 dark:hover:bg-amber-950/20'
                    : 'hover:bg-gray-50 dark:hover:bg-gray-800/50'
                }`}
              >
                {/* Active Indicator Bar */}
                {isActive && (
                  <div className="absolute left-0 rtl:left-auto rtl:right-0 top-0 bottom-0 w-1 bg-[#123D78] rounded-r" />
                )}

                {/* Avatar */}
                {group.isStaffChat ? (
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#123D78] to-indigo-700 flex items-center justify-center text-white shadow-sm flex-shrink-0 select-none ring-2 ring-amber-400/50">
                    <Briefcase className="w-5 h-5" />
                  </div>
                ) : (
                  <div
                    className="w-12 h-12 rounded-2xl flex items-center justify-center text-white font-bold text-base shadow-sm flex-shrink-0 select-none"
                    style={{ backgroundColor: courseColor }}
                  >
                    {group.name?.charAt(0) || 'G'}
                  </div>
                )}

                {/* Group Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-0.5 gap-1">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className="font-bold text-sm text-gray-900 dark:text-gray-100 truncate">
                        {group.name}
                      </span>
                      {group.isPinned && (
                        <Pin className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0 rotate-45" />
                      )}
                    </div>
                    {timeStr && (
                      <span className="text-[11px] text-gray-400 dark:text-gray-500 flex-shrink-0 font-medium">
                        {timeStr}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5 mb-1">
                    {group.isStaffChat && (
                      <span className="px-1.5 py-0.2 rounded text-[10px] font-bold uppercase tracking-wider bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300 shrink-0">
                        Rasmiy
                      </span>
                    )}
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                      {group.course?.name || ''}
                    </p>
                  </div>

                  <div className="flex items-center justify-between">
                    <p className="text-xs text-gray-600 dark:text-gray-400 truncate pr-2 max-w-[190px]">
                      {snippet}
                    </p>

                    {/* Unread badge */}
                    {group.unreadCount > 0 && (
                      <span className="flex-shrink-0 min-w-[20px] h-5 px-1.5 rounded-full bg-[#F12D3A] text-white text-[11px] font-bold flex items-center justify-center shadow-xs">
                        {group.unreadCount > 99 ? '99+' : group.unreadCount}
                      </span>
                    )}
                  </div>
                </div>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}


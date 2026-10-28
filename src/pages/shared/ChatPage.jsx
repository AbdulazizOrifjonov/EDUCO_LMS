import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '@/hooks/useAuth';
import { localStore } from '@/lib/localStore';
import { toast } from '@/components/ui/Toast';
import ChatSidebar from '@/features/chat/ChatSidebar';
import ChatWindow from '@/features/chat/ChatWindow';
import { getGroupChats, ANNOUNCEMENTS_CHAT_ID, STAFF_CHAT_ID } from '@/services/chatService';

export default function ChatPage() {
  const { i18n } = useTranslation();
  const { user, profile } = useAuthStore();
  const [searchParams] = useSearchParams();

  const [groups, setGroups] = useState([]);
  const [activeGroup, setActiveGroup] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showMobileChat, setShowMobileChat] = useState(false);

  const role = profile?.role || user?.user_metadata?.role || 'student';
  const normalizedUserId = localStore.normalizeUserId(user?.id || profile?.id);
  const isRtl = i18n.language === 'ar' || document.documentElement.dir === 'rtl';
  const channelParam = searchParams.get('channel');

  const fullName =
    profile?.full_name ||
    user?.user_metadata?.full_name ||
    `${profile?.first_name || ''} ${profile?.last_name || ''}`.trim() ||
    user?.email?.split('@')[0] ||
    'Foydalanuvchi';

  const currentUser = {
    ...user,
    id: normalizedUserId,
    role: role,
    user_role: role,
    full_name: fullName,
    fullName: fullName,
    first_name: profile?.first_name || fullName.split(' ')[0] || '',
    last_name: profile?.last_name || fullName.split(' ').slice(1).join(' ') || '',
    avatar_url: profile?.avatar_url || user?.user_metadata?.avatar_url || '',
  };

  const loadChats = useCallback(
    async (isInitial = false) => {
      if (!normalizedUserId) return;
      if (isInitial) setLoading(true);
      try {
        const data = await getGroupChats(normalizedUserId, role);
        setGroups(data);
        setActiveGroup((prev) => {
          if (channelParam === 'announcements') {
            const annGroup = data.find((g) => g.id === ANNOUNCEMENTS_CHAT_ID || g.isAnnouncementChat);
            if (annGroup) return annGroup;
          }
          if (prev) {
            // SECURITY FIX: Only keep prev if this user/role has permission and it's present in data!
            const updated = data.find((g) => g.id === prev.id);
            if (updated) return updated;
          }
          if (data.length > 0 && window.innerWidth >= 768) {
            return data[0];
          }
          return null;
        });
      } catch (err) {
        console.error('Failed to load group chats in ChatPage:', err);
      } finally {
        if (isInitial) setLoading(false);
      }
    },
    [normalizedUserId, role, channelParam]
  );

  useEffect(() => {
    loadChats(true);
  }, [loadChats]);

  useEffect(() => {
    const handleRefresh = () => loadChats(false);
    window.addEventListener('educo-chat-update', handleRefresh);
    window.addEventListener('storage', handleRefresh);
    return () => {
      window.removeEventListener('educo-chat-update', handleRefresh);
      window.removeEventListener('storage', handleRefresh);
    };
  }, [loadChats]);

  const handleSelectGroup = (group) => {
    // SECURITY GUARD: Students can NEVER enter staff chat
    if (group.id === STAFF_CHAT_ID || group.isStaffChat) {
      if (!['owner', 'admin', 'teacher'].includes(role)) {
        toast.error("Ushbu chat faqat markaz xodimlari uchun!");
        return;
      }
    }
    setActiveGroup(group);
    setShowMobileChat(true);
  };

  const handleBackToList = () => {
    setShowMobileChat(false);
  };

  return (
    <div
      dir={isRtl ? 'rtl' : 'ltr'}
      className="flex h-full w-full max-w-full overflow-hidden bg-[#F5F7FA] dark:bg-[#101827] border-0 md:border border-gray-200 dark:border-gray-800 rounded-none md:rounded-2xl shadow-none md:shadow-sm my-0"
    >
      {/* Sidebar: Group list */}
      <div
        className={`w-full md:w-80 lg:w-96 flex-shrink-0 h-full overflow-hidden ${
          showMobileChat ? 'hidden md:flex' : 'flex'
        }`}
      >
        <ChatSidebar
          groups={groups}
          activeGroupId={activeGroup?.id}
          onSelectGroup={handleSelectGroup}
          loading={loading}
          userRole={role}
        />
      </div>

      {/* Main chat window */}
      <div
        className={`flex-1 min-w-0 max-w-full h-full flex flex-col overflow-hidden ${
          showMobileChat ? 'flex' : 'hidden md:flex'
        }`}
      >
        <ChatWindow
          activeGroup={activeGroup}
          currentUser={currentUser}
          userRole={role}
          onBackToList={handleBackToList}
        />
      </div>
    </div>
  );
}


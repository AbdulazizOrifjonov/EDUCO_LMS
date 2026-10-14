import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '@/hooks/useAuth';
import { localStore } from '@/lib/localStore';
import ChatSidebar from '@/features/chat/ChatSidebar';
import ChatWindow from '@/features/chat/ChatWindow';
import { getGroupChats } from '@/services/chatService';

export default function ChatPage() {
  const { i18n } = useTranslation();
  const { user, profile } = useAuthStore();

  const [groups, setGroups] = useState([]);
  const [activeGroup, setActiveGroup] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showMobileChat, setShowMobileChat] = useState(false);

  const role = profile?.role || user?.user_metadata?.role || 'student';
  const normalizedUserId = localStore.normalizeUserId(user?.id || profile?.id);
  const isRtl = i18n.language === 'ar' || document.documentElement.dir === 'rtl';

  const loadChats = useCallback(
    async (isInitial = false) => {
      if (!normalizedUserId) return;
      if (isInitial) setLoading(true);
      try {
        const data = await getGroupChats(normalizedUserId, role);
        setGroups(data);
        setActiveGroup((prev) => {
          if (prev) {
            const updated = data.find((g) => g.id === prev.id);
            return updated || prev;
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
    [normalizedUserId, role]
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
    setActiveGroup(group);
    setShowMobileChat(true);
  };

  const handleBackToList = () => {
    setShowMobileChat(false);
  };

  return (
    <div
      dir={isRtl ? 'rtl' : 'ltr'}
      className="flex h-[calc(100vh-5.5rem)] w-full overflow-hidden bg-[#F5F7FA] dark:bg-[#101827] border border-gray-200 dark:border-gray-800 rounded-2xl shadow-sm my-1"
    >
      {/* Sidebar: Group list */}
      <div
        className={`w-full md:w-80 lg:w-96 flex-shrink-0 h-full ${
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
        className={`flex-1 h-full flex flex-col ${
          showMobileChat ? 'flex' : 'hidden md:flex'
        }`}
      >
        <ChatWindow
          activeGroup={activeGroup}
          currentUser={{ ...user, id: normalizedUserId }}
          userRole={role}
          onBackToList={handleBackToList}
        />
      </div>
    </div>
  );
}


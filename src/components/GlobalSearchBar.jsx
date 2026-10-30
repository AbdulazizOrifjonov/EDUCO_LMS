import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Search,
  X,
  Users,
  GraduationCap,
  BookOpen,
  Calendar,
  KeyRound,
  CheckCircle2,
  DollarSign,
  MessageSquare,
  ArrowRight,
  ShieldCheck,
  ChevronRight,
  Zap,
} from 'lucide-react';
import { useSearch } from '@/context/SearchContext';
import { localStore } from '@/lib/localStore';
import Avatar from '@/components/ui/Avatar';

export default function GlobalSearchBar({
  role = 'admin',
  isRtl = false,
  autoFocus = false,
  onClose = null,
}) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { searchQuery, setSearchQuery, clearSearch, pagePlaceholder } = useSearch();

  const [isOpen, setIsOpen] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef(null);
  const dropdownRef = useRef(null);

  // Auto focus if requested
  useEffect(() => {
    if (autoFocus && inputRef.current) {
      inputRef.current.focus();
      setIsOpen(true);
    }
  }, [autoFocus]);

  // Global Ctrl+K / Cmd+K shortcut
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
        setIsOpen(true);
      }
      if (e.key === 'Escape') {
        setIsOpen(false);
        inputRef.current?.blur();
        if (onClose) onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target) &&
        inputRef.current &&
        !inputRef.current.contains(e.target)
      ) {
        setIsOpen(false);
        if (onClose) onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [onClose]);

  // Compute Current Page Information
  const currentPageInfo = useMemo(() => {
    const path = location.pathname;
    if (path.includes('/passwords')) {
      return { title: 'Parollar va Loginlar bazasi', type: 'passwords', icon: KeyRound };
    }
    if (path.includes('/attendance')) {
      return { title: 'Davomat bo‘limi', type: 'attendance', icon: CheckCircle2 };
    }
    if (path.includes('/users')) {
      return { title: 'Foydalanuvchilar ro‘yxati', type: 'users', icon: Users };
    }
    if (path.includes('/groups')) {
      return { title: 'Guruhlar boshqaruvi', type: 'groups', icon: Users };
    }
    if (path.includes('/courses')) {
      return { title: 'Kurslar ro‘yxati', type: 'courses', icon: BookOpen };
    }
    if (path.includes('/schedule')) {
      return { title: 'Dars jadvali', type: 'schedule', icon: Calendar };
    }
    if (path.includes('/tuition')) {
      return { title: 'O‘qish to‘lovlari', type: 'tuition', icon: DollarSign };
    }
    if (path.includes('/chat')) {
      return { title: 'Guruhlar chati', type: 'chat', icon: MessageSquare };
    }
    return { title: 'Boshqaruv paneli', type: 'dashboard', icon: Zap };
  }, [location.pathname]);

  // Global Cross-Section Matches
  const searchResults = useMemo(() => {
    const q = (searchQuery || '').trim().toLowerCase();
    if (!q) return null;

    const qDigits = q.replace(/\D/g, '');

    // 1. Users (Teachers & Students)
    const allUsers = localStore.getUsers() || [];
    const matchedUsers = allUsers
      .filter((u) => {
        const firstName = (u.first_name || '').toLowerCase();
        const lastName = (u.last_name || '').toLowerCase();
        const fullName = (u.fullName || `${u.first_name || ''} ${u.last_name || ''}`).toLowerCase();
        const username = (u.username || '').toLowerCase();
        const phone = (u.phone || '').toLowerCase();
        const fatherPhone = (u.father_phone || '').toLowerCase();
        const motherPhone = (u.mother_phone || '').toLowerCase();
        const roleStr = (u.role || '').toLowerCase();

        const matchText =
          fullName.includes(q) ||
          firstName.includes(q) ||
          lastName.includes(q) ||
          username.includes(q) ||
          roleStr.includes(q) ||
          phone.includes(q);

        const matchDigits =
          qDigits.length >= 3 &&
          ((u.phone || '').replace(/\D/g, '').includes(qDigits) ||
            (u.father_phone || '').replace(/\D/g, '').includes(qDigits));

        return matchText || matchDigits;
      })
      .slice(0, 5);

    // 2. Groups
    const allGroups = localStore.getGroups() || [];
    const matchedGroups = allGroups
      .filter((g) => {
        const name = (g.name || '').toLowerCase();
        const code = (g.code || '').toLowerCase();
        const course = (g.course_name || '').toLowerCase();
        const teacher = (g.teacher_name || '').toLowerCase();
        return name.includes(q) || code.includes(q) || course.includes(q) || teacher.includes(q);
      })
      .slice(0, 4);

    // 3. Courses
    const allCourses = localStore.getCourses() || [];
    const matchedCourses = allCourses
      .filter((c) => {
        const name = (c.name || '').toLowerCase();
        const code = (c.code || '').toLowerCase();
        return name.includes(q) || code.includes(q);
      })
      .slice(0, 3);

    // 4. Quick Page Navigation
    const allPages = [
      { name: 'Parollar va loginlar', path: `/${role}/passwords`, icon: KeyRound, keywords: 'parol login kod kalit' },
      { name: 'Davomat boshqaruvi', path: `/${role}/attendance`, icon: CheckCircle2, keywords: 'davomat attendance dars yoqlama' },
      { name: 'Ustozlar davomati', path: `/${role}/attendance/teachers`, icon: GraduationCap, keywords: 'ustoz davomat xodim oqituvchi' },
      { name: 'Foydalanuvchilar', path: `/${role}/users`, icon: Users, keywords: 'foydalanuvchi user odam oquvchi' },
      { name: 'Guruhlar', path: `/${role}/groups`, icon: Users, keywords: 'guruh group sinf' },
      { name: 'Kurslar', path: `/${role}/courses`, icon: BookOpen, keywords: 'kurs course dars' },
      { name: 'Dars jadvali', path: `/${role}/schedule`, icon: Calendar, keywords: 'jadval schedule soat kun vaqt' },
      { name: 'O‘qish to‘lovi', path: `/${role}/tuition`, icon: DollarSign, keywords: 'tolov pul kontrakt kvitansiya' },
      { name: 'Chat va xabarlar', path: `/${role}/chat`, icon: MessageSquare, keywords: 'chat xabar yozishma' },
    ];

    const matchedPages = allPages
      .filter((p) => p.name.toLowerCase().includes(q) || p.keywords.includes(q))
      .slice(0, 3);

    return {
      users: matchedUsers,
      groups: matchedGroups,
      courses: matchedCourses,
      pages: matchedPages,
      totalCount: matchedUsers.length + matchedGroups.length + matchedCourses.length + matchedPages.length,
    };
  }, [searchQuery, role]);

  const handleSelectUser = (u) => {
    setIsOpen(false);
    navigate(`/${role}/passwords`);
    setSearchQuery(u.fullName || u.first_name);
    if (onClose) onClose();
  };

  const handleSelectGroup = (g) => {
    setIsOpen(false);
    navigate(`/${role}/attendance?tab=roster&group=${g.id}`);
    setSearchQuery('');
    if (onClose) onClose();
  };

  const handleSelectCourse = (c) => {
    setIsOpen(false);
    navigate(`/${role}/courses`);
    setSearchQuery(c.name);
    if (onClose) onClose();
  };

  const handleSelectPage = (p) => {
    setIsOpen(false);
    navigate(p.path);
    setSearchQuery('');
    if (onClose) onClose();
  };

  return (
    <div className="relative w-full">
      {/* Search Input Bar */}
      <div className="relative">
        <div
          className={`pointer-events-none absolute inset-y-0 flex items-center text-gray-500 transition-colors ${
            isRtl ? 'right-3.5' : 'left-3.5'
          } ${isFocused ? 'text-emerald-600 dark:text-emerald-400' : ''}`}
        >
          <Search className="h-4 w-4" />
        </div>

        <input
          ref={inputRef}
          type="text"
          value={searchQuery}
          onFocus={() => {
            setIsFocused(true);
            setIsOpen(true);
          }}
          onBlur={() => setIsFocused(false)}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            if (!isOpen) setIsOpen(true);
          }}
          placeholder={pagePlaceholder}
          className={`w-full rounded-xl border border-[#D4CCB9] bg-[#EFECE2] py-2 text-xs sm:text-sm text-gray-900 placeholder-gray-500 outline-none transition-all shadow-xs focus:border-emerald-600 focus:bg-[#FAF7F0] focus:ring-2 focus:ring-emerald-600/20 dark:border-gray-700 dark:bg-gray-800/80 dark:text-gray-100 dark:placeholder-gray-500 dark:focus:border-emerald-500 dark:focus:bg-gray-800
            ${isRtl ? 'pr-9 pl-9' : 'pl-9 pr-9'}
          `}
        />

        {/* Clear (X) or Ctrl+K Indicator */}
        <div
          className={`absolute inset-y-0 flex items-center ${
            isRtl ? 'left-2.5' : 'right-2.5'
          }`}
        >
          {searchQuery ? (
            <button
              type="button"
              onClick={() => {
                clearSearch();
                inputRef.current?.focus();
              }}
              className="p-1 rounded-md text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          ) : (
            <kbd className="hidden lg:inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded border border-gray-300 dark:border-gray-600 text-[10px] font-mono text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700">
              Ctrl+K
            </kbd>
          )}
        </div>
      </div>

      {/* Mobile Backdrop Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/20 dark:bg-black/50 z-40 md:hidden backdrop-blur-xs transition-opacity"
          onClick={() => {
            setIsOpen(false);
            if (onClose) onClose();
          }}
          aria-hidden="true"
        />
      )}

      {/* Interactive Live Search Dropdown */}
      {isOpen && (
        <div
          ref={dropdownRef}
          className="fixed left-3 right-3 top-[58px] sm:top-[64px] mx-auto max-w-lg z-50 md:absolute md:top-full md:mt-2 md:inset-x-auto md:left-1/2 md:-translate-x-1/2 md:w-full md:min-w-[420px] md:max-w-xl rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-surface-dark-secondary shadow-2xl overflow-hidden animate-fade-in"
        >
          {/* Header Indicator */}
          <div className="p-3 bg-gray-50 dark:bg-surface-dark-tertiary border-b border-gray-100 dark:border-gray-800 flex items-center justify-between text-xs">
            <div className="flex items-center gap-1.5 font-semibold text-gray-700 dark:text-gray-300">
              <currentPageInfo.icon className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>Joriy sahifa:</span>
              <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                {currentPageInfo.title}
              </span>
            </div>

            {searchQuery && (
              <span className="text-[11px] text-gray-400">
                Jonli filtrlash faol
              </span>
            )}
          </div>

          <div className="max-h-[50vh] sm:max-h-96 overflow-y-auto divide-y divide-gray-100 dark:divide-gray-800">
            {/* If query entered */}
            {searchQuery.trim() ? (
              searchResults?.totalCount === 0 ? (
                <div className="p-8 text-center text-gray-400">
                  <Search className="w-8 h-8 mx-auto text-gray-300 dark:text-gray-600 mb-2" />
                  <p className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                    «{searchQuery}» bo‘yicha hech narsa topilmadi
                  </p>
                  <p className="text-[11px] text-gray-400 mt-1">
                    Ism, familiya, telefon yoki boshqa so‘zni tekshirib ko‘ring
                  </p>
                </div>
              ) : (
                <div className="p-2 space-y-3">
                  {/* Category 1: Users */}
                  {searchResults?.users.length > 0 && (
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 px-2.5 py-1 block">
                        Foydalanuvchilar va Ustozlar ({searchResults.users.length})
                      </span>
                      <div className="space-y-1">
                        {searchResults.users.map((u) => (
                          <div
                            key={u.id}
                            onClick={() => handleSelectUser(u)}
                            className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-surface-dark-tertiary flex items-center justify-between gap-3 cursor-pointer transition-colors"
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <Avatar name={u.fullName} size="sm" src={u.avatar_url} />
                              <div className="min-w-0">
                                <p className="text-xs font-bold text-gray-900 dark:text-white truncate">
                                  {u.fullName || `${u.first_name} ${u.last_name}`}
                                </p>
                                <p className="text-[11px] text-gray-400 truncate">
                                  @{u.username} {u.phone ? `• ${u.phone}` : ''}
                                </p>
                              </div>
                            </div>

                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase shrink-0 ${
                                u.role === 'teacher'
                                  ? 'bg-amber-500/15 text-amber-700 dark:text-amber-400'
                                  : u.role === 'student'
                                  ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400'
                                  : 'bg-purple-500/15 text-purple-700 dark:text-purple-400'
                              }`}
                            >
                              {u.role === 'teacher' ? 'Ustoz' : u.role === 'student' ? 'O‘quvchi' : 'Admin'}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Category 2: Groups */}
                  {searchResults?.groups.length > 0 && (
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 px-2.5 py-1 block">
                        Guruhlar ({searchResults.groups.length})
                      </span>
                      <div className="space-y-1">
                        {searchResults.groups.map((g) => (
                          <div
                            key={g.id}
                            onClick={() => handleSelectGroup(g)}
                            className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-surface-dark-tertiary flex items-center justify-between gap-3 cursor-pointer transition-colors"
                          >
                            <div className="min-w-0">
                              <p className="text-xs font-bold text-gray-900 dark:text-white truncate">
                                {g.name}
                              </p>
                              <p className="text-[11px] text-gray-400 truncate">
                                {g.course_name} • Ustoz: {g.teacher_name}
                              </p>
                            </div>
                            <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 shrink-0 flex items-center gap-1">
                              Davomatga o‘tish <ChevronRight className="w-3 h-3" />
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Category 3: Courses */}
                  {searchResults?.courses.length > 0 && (
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 px-2.5 py-1 block">
                        Kurslar ({searchResults.courses.length})
                      </span>
                      <div className="space-y-1">
                        {searchResults.courses.map((c) => (
                          <div
                            key={c.id}
                            onClick={() => handleSelectCourse(c)}
                            className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-surface-dark-tertiary flex items-center justify-between gap-3 cursor-pointer transition-colors"
                          >
                            <div className="min-w-0">
                              <p className="text-xs font-bold text-gray-900 dark:text-white truncate">
                                {c.name}
                              </p>
                              <p className="text-[11px] text-gray-400 truncate font-mono">
                                {c.code}
                              </p>
                            </div>
                            <span className="text-[11px] font-semibold text-gray-500 shrink-0">
                              Kurs sahifasi
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Category 4: Navigation */}
                  {searchResults?.pages.length > 0 && (
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 px-2.5 py-1 block">
                        Bo‘limlarga tezkor o‘tish
                      </span>
                      <div className="space-y-1">
                        {searchResults.pages.map((p, idx) => (
                          <div
                            key={idx}
                            onClick={() => handleSelectPage(p)}
                            className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-surface-dark-tertiary flex items-center justify-between gap-3 cursor-pointer transition-colors"
                          >
                            <div className="flex items-center gap-2">
                              <p.icon className="w-4 h-4 text-emerald-600" />
                              <span className="text-xs font-bold text-gray-800 dark:text-gray-200">
                                {p.name}
                              </span>
                            </div>
                            <ArrowRight className="w-3.5 h-3.5 text-gray-400" />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )
            ) : (
              /* If query is empty, show quick navigation prompts */
              <div className="p-3 space-y-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 px-1.5 block">
                  Tezkor bo‘limlar
                </span>
                <div className="grid grid-cols-2 gap-1.5">
                  {[
                    { name: 'Parollar bazasi', path: `/${role}/passwords`, icon: KeyRound },
                    { name: 'Davomat tahlili', path: `/${role}/attendance`, icon: CheckCircle2 },
                    { name: 'Ustozlar davomati', path: `/${role}/attendance/teachers`, icon: GraduationCap },
                    { name: 'Foydalanuvchilar', path: `/${role}/users`, icon: Users },
                    { name: 'Guruhlar', path: `/${role}/groups`, icon: Users },
                    { name: 'Dars jadvali', path: `/${role}/schedule`, icon: Calendar },
                  ].map((item, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleSelectPage(item)}
                      className="p-2 rounded-xl text-left hover:bg-gray-100 dark:hover:bg-surface-dark-tertiary flex items-center gap-2 transition-colors cursor-pointer"
                    >
                      <item.icon className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                      <span className="text-xs font-semibold text-gray-800 dark:text-gray-200 truncate">
                        {item.name}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Footer shortcut tips */}
          <div className="p-2.5 bg-gray-50 dark:bg-surface-dark-tertiary border-t border-gray-100 dark:border-gray-800 flex items-center justify-between text-[11px] text-gray-400 px-3">
            <span>Yozishingiz bilan joriy sahifa ham avtomatik filtrlanadi</span>
            <kbd className="px-1.5 py-0.5 rounded border border-gray-300 dark:border-gray-600 text-[9px] font-mono">
              ESC
            </kbd>
          </div>
        </div>
      )}
    </div>
  );
}

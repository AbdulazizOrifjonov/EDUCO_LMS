import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';

const SearchContext = createContext({
  searchQuery: '',
  setSearchQuery: () => {},
  clearSearch: () => {},
  pagePlaceholder: 'Qidirish (Ctrl+K)...',
  setPagePlaceholder: () => {},
  isDropdownOpen: false,
  setIsDropdownOpen: () => {},
});

export function SearchProvider({ children }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [pagePlaceholder, setPagePlaceholder] = useState('Qidirish (Ctrl+K)...');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const location = useLocation();

  // Dynamic placeholder based on current URL path
  useEffect(() => {
    const path = location.pathname;
    // Clear search on page navigation to avoid stale filters
    setSearchQuery('');
    setIsDropdownOpen(false);

    if (path.includes('/passwords')) {
      setPagePlaceholder('Parollar bo‘yicha qidirish (ism, familiya, telefon)...');
    } else if (path.includes('/attendance')) {
      setPagePlaceholder('Davomat bo‘yicha qidirish (ustoz ismi, familiyasi, guruh)...');
    } else if (path.includes('/users')) {
      setPagePlaceholder('Foydalanuvchilarni qidirish (ism, familiya, rol, telefon)...');
    } else if (path.includes('/groups')) {
      setPagePlaceholder('Guruhlarni qidirish (guruh nomi, fani, ustozi)...');
    } else if (path.includes('/courses')) {
      setPagePlaceholder('Kurslarni qidirish (kurs nomi, kodi)...');
    } else if (path.includes('/schedule')) {
      setPagePlaceholder('Dars jadvalini qidirish (guruh, xona, ustoz)...');
    } else if (path.includes('/tuition')) {
      setPagePlaceholder('To‘lovlarni qidirish (o‘quvchi ismi, guruhi)...');
    } else if (path.includes('/grades')) {
      setPagePlaceholder('Baholarni qidirish (o‘quvchi ismi, mavzu)...');
    } else if (path.includes('/chat')) {
      setPagePlaceholder('Xabarlar va guruhlarni qidirish...');
    } else {
      setPagePlaceholder('Qidirish (Ctrl+K)...');
    }
  }, [location.pathname]);

  const updateSearchQuery = useCallback((query) => {
    setSearchQuery(query);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('educo:search', { detail: query }));
    }
  }, []);

  const clearSearch = useCallback(() => {
    setSearchQuery('');
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('educo:search', { detail: '' }));
    }
  }, []);

  return (
    <SearchContext.Provider
      value={{
        searchQuery,
        setSearchQuery: updateSearchQuery,
        clearSearch,
        pagePlaceholder,
        setPagePlaceholder,
        isDropdownOpen,
        setIsDropdownOpen,
      }}
    >
      {children}
    </SearchContext.Provider>
  );
}

export function useSearch() {
  const context = useContext(SearchContext);
  if (!context) {
    return {
      searchQuery: '',
      setSearchQuery: () => {},
      clearSearch: () => {},
      pagePlaceholder: 'Qidirish (Ctrl+K)...',
      setPagePlaceholder: () => {},
      isDropdownOpen: false,
      setIsDropdownOpen: () => {},
    };
  }
  return context;
}

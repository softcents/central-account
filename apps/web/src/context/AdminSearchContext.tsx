'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';

interface AdminSearchContextType {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  clearSearch: () => void;
}

const AdminSearchContext = createContext<AdminSearchContextType | undefined>(undefined);

export function AdminSearchProvider({ children }: { children: React.ReactNode }) {
  const [searchQuery, setSearchQuery] = useState('');

  const clearSearch = useCallback(() => {
    setSearchQuery('');
  }, []);

  return (
    <AdminSearchContext.Provider value={{ searchQuery, setSearchQuery, clearSearch }}>
      {children}
    </AdminSearchContext.Provider>
  );
}

export function useAdminSearch() {
  const context = useContext(AdminSearchContext);
  if (!context) {
    throw new Error('useAdminSearch must be used within an AdminSearchProvider');
  }
  return context;
}

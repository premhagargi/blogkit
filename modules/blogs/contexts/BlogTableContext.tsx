'use client';

import React, { createContext, useState, useContext, ReactNode } from 'react';

interface BlogTableContextType {
  pinnedIds: Set<string>;
  togglePin: (id: string) => void;
  selectedIds: Set<string>;
  toggleSelection: (id: string) => void;
  selectAll: (allIds: string[]) => void;
  clearSelection: () => void;
  isAllSelected: (allIds: string[]) => boolean;
  isIndeterminate: (allIds: string[]) => boolean;
}

const BlogTableContext = createContext<BlogTableContextType | undefined>(
  undefined
);

export const useBlogTable = () => {
  const context = useContext(BlogTableContext);
  if (!context) {
    throw new Error('useBlogTable must be used within a BlogTableProvider');
  }
  return context;
};

export const BlogTableProvider = ({ children }: { children: ReactNode }) => {
  const [pinnedIds, setPinnedIds] = useState<Set<string>>(new Set());
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const togglePin = (id: string) => {
    setPinnedIds((prev) => {
      const newPinned = new Set(prev);
      if (newPinned.has(id)) {
        newPinned.delete(id);
      } else {
        newPinned.add(id);
      }
      return newPinned;
    });
  };

  const toggleSelection = (id: string) => {
    setSelectedIds((prev) => {
      const newSelected = new Set(prev);
      if (newSelected.has(id)) {
        newSelected.delete(id);
      } else {
        newSelected.add(id);
      }
      return newSelected;
    });
  };

  const selectAll = (allIds: string[]) => {
    const allSelected = isAllSelected(allIds);
    if (allSelected) {
      // Deselect all
      setSelectedIds(new Set());
    } else {
      // Select all visible items
      setSelectedIds(new Set(allIds));
    }
  };

  const clearSelection = () => {
    setSelectedIds(new Set());
  };

  const isAllSelected = (allIds: string[]) => {
    return allIds.length > 0 && allIds.every((id) => selectedIds.has(id));
  };

  const isIndeterminate = (allIds: string[]) => {
    const selectedCount = allIds.filter((id) => selectedIds.has(id)).length;
    return selectedCount > 0 && selectedCount < allIds.length;
  };

  return (
    <BlogTableContext.Provider
      value={{
        pinnedIds,
        togglePin,
        selectedIds,
        toggleSelection,
        selectAll,
        clearSelection,
        isAllSelected,
        isIndeterminate,
      }}
    >
      {children}
    </BlogTableContext.Provider>
  );
};

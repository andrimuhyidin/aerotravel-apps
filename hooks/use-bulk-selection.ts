'use client';

import { useState, useCallback, useMemo } from 'react';

export type BulkSelectionState<T> = {
  selectedIds: Set<string>;
  selectedItems: T[];
  selectAll: boolean;
  isSelected: (id: string) => boolean;
  toggle: (id: string) => void;
  toggleAll: (items: T[], getKey: (item: T) => string) => void;
  select: (ids: string[]) => void;
  deselect: (ids: string[]) => void;
  clear: () => void;
  selectAllItems: (items: T[], getKey: (item: T) => string) => void;
  count: number;
  hasSelection: boolean;
};

/**
 * Custom hook for managing bulk selection state in list views
 * 
 * @example
 * ```tsx
 * const { selectedIds, toggle, toggleAll, clear, isSelected } = useBulkSelection<User>();
 * 
 * // In your table
 * <Checkbox
 *   checked={isSelected(user.id)}
 *   onCheckedChange={() => toggle(user.id)}
 * />
 * ```
 */
export function useBulkSelection<T>(
  items?: T[],
  getKey?: (item: T) => string
): BulkSelectionState<T> {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [selectAll, setSelectAll] = useState(false);

  const isSelected = useCallback((id: string): boolean => {
    return selectedIds.has(id);
  }, [selectedIds]);

  const toggle = useCallback((id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
    setSelectAll(false);
  }, []);

  const toggleAll = useCallback((allItems: T[], keyFn: (item: T) => string) => {
    setSelectedIds(prev => {
      const allIds = allItems.map(keyFn);
      const allSelected = allIds.every(id => prev.has(id));
      
      if (allSelected) {
        // Deselect all
        return new Set();
      } else {
        // Select all
        return new Set(allIds);
      }
    });
    setSelectAll(prev => !prev);
  }, []);

  const select = useCallback((ids: string[]) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      ids.forEach(id => next.add(id));
      return next;
    });
  }, []);

  const deselect = useCallback((ids: string[]) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      ids.forEach(id => next.delete(id));
      return next;
    });
    setSelectAll(false);
  }, []);

  const clear = useCallback(() => {
    setSelectedIds(new Set());
    setSelectAll(false);
  }, []);

  const selectAllItems = useCallback((allItems: T[], keyFn: (item: T) => string) => {
    const allIds = allItems.map(keyFn);
    setSelectedIds(new Set(allIds));
    setSelectAll(true);
  }, []);

  const selectedItems = useMemo((): T[] => {
    if (!items || !getKey) return [];
    return items.filter(item => selectedIds.has(getKey(item)));
  }, [items, getKey, selectedIds]);

  const count = selectedIds.size;
  const hasSelection = count > 0;

  return {
    selectedIds,
    selectedItems,
    selectAll,
    isSelected,
    toggle,
    toggleAll,
    select,
    deselect,
    clear,
    selectAllItems,
    count,
    hasSelection,
  };
}


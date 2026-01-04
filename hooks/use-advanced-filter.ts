'use client';

import { useState, useCallback, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { FilterPreset, getPresetsByModule } from '@/lib/filters/filter-presets';
import { logger } from '@/lib/utils/logger';

export type FilterCondition = {
  field: string;
  operator: string;
  value: unknown;
};

export type SavedFilter = {
  id: string;
  filter_name: string;
  module: string;
  filter_conditions: Record<string, unknown>;
  is_default: boolean;
  is_shared: boolean;
  isOwner: boolean;
};

export type UseAdvancedFilterResult = {
  // Current filter state
  conditions: FilterCondition[];
  setConditions: (conditions: FilterCondition[]) => void;
  addCondition: (condition: FilterCondition) => void;
  removeCondition: (index: number) => void;
  updateCondition: (index: number, condition: FilterCondition) => void;
  clearConditions: () => void;

  // Presets
  presets: FilterPreset[];
  applyPreset: (presetId: string) => void;

  // Saved filters
  savedFilters: SavedFilter[];
  isLoadingSaved: boolean;
  saveFilter: (name: string, options?: { isDefault?: boolean; isShared?: boolean }) => void;
  applySavedFilter: (filter: SavedFilter) => void;
  deleteSavedFilter: (filterId: string) => void;
  isSaving: boolean;

  // Active filter info
  activeFilterName: string | null;
  hasActiveFilter: boolean;

  // Build query params
  getQueryParams: () => Record<string, string>;
};

async function fetchSavedFilters(module: string): Promise<{ filters: SavedFilter[] }> {
  const response = await fetch(`/api/admin/filters?module=${module}`);
  if (!response.ok) throw new Error('Failed to fetch filters');
  return response.json();
}

/**
 * Custom hook for advanced filtering with saved filters support
 */
export function useAdvancedFilter(module: string): UseAdvancedFilterResult {
  const queryClient = useQueryClient();
  const [conditions, setConditions] = useState<FilterCondition[]>([]);
  const [activeFilterName, setActiveFilterName] = useState<string | null>(null);

  // Get presets for this module
  const presets = getPresetsByModule(module);

  // Fetch saved filters
  const { data: savedFiltersData, isLoading: isLoadingSaved } = useQuery({
    queryKey: ['saved-filters', module],
    queryFn: () => fetchSavedFilters(module),
    staleTime: 60_000,
  });

  const savedFilters = savedFiltersData?.filters || [];

  // Apply default filter on mount
  useEffect(() => {
    const defaultFilter = savedFilters.find(f => f.is_default && f.isOwner);
    if (defaultFilter && conditions.length === 0) {
      applySavedFilter(defaultFilter);
    }
  }, [savedFilters]);

  // Save filter mutation
  const saveMutation = useMutation({
    mutationFn: async (data: { name: string; isDefault?: boolean; isShared?: boolean }) => {
      const response = await fetch('/api/admin/filters', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          module,
          filterName: data.name,
          filterConditions: Object.fromEntries(
            conditions.map(c => [c.field, { operator: c.operator, value: c.value }])
          ),
          isDefault: data.isDefault || false,
          isShared: data.isShared || false,
        }),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to save filter');
      }
      return response.json();
    },
    onSuccess: () => {
      toast.success('Filter berhasil disimpan');
      queryClient.invalidateQueries({ queryKey: ['saved-filters', module] });
    },
    onError: (error) => {
      logger.error('Save filter error', error);
      toast.error(error instanceof Error ? error.message : 'Gagal menyimpan filter');
    },
  });

  // Delete filter mutation
  const deleteMutation = useMutation({
    mutationFn: async (filterId: string) => {
      const response = await fetch(`/api/admin/filters/${filterId}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to delete filter');
      return response.json();
    },
    onSuccess: () => {
      toast.success('Filter berhasil dihapus');
      queryClient.invalidateQueries({ queryKey: ['saved-filters', module] });
    },
    onError: (error) => {
      logger.error('Delete filter error', error);
      toast.error('Gagal menghapus filter');
    },
  });

  const addCondition = useCallback((condition: FilterCondition) => {
    setConditions(prev => [...prev, condition]);
    setActiveFilterName(null);
  }, []);

  const removeCondition = useCallback((index: number) => {
    setConditions(prev => prev.filter((_, i) => i !== index));
    setActiveFilterName(null);
  }, []);

  const updateCondition = useCallback((index: number, condition: FilterCondition) => {
    setConditions(prev => prev.map((c, i) => i === index ? condition : c));
    setActiveFilterName(null);
  }, []);

  const clearConditions = useCallback(() => {
    setConditions([]);
    setActiveFilterName(null);
  }, []);

  const applyPreset = useCallback((presetId: string) => {
    const preset = presets.find(p => p.id === presetId);
    if (preset) {
      setConditions(preset.conditions);
      setActiveFilterName(preset.name);
    }
  }, [presets]);

  const applySavedFilter = useCallback((filter: SavedFilter) => {
    const filterConditions = filter.filter_conditions;
    const newConditions: FilterCondition[] = Object.entries(filterConditions).map(
      ([field, value]) => {
        const condValue = value as { operator: string; value: unknown };
        return {
          field,
          operator: condValue.operator,
          value: condValue.value,
        };
      }
    );
    setConditions(newConditions);
    setActiveFilterName(filter.filter_name);
  }, []);

  const saveFilter = useCallback((name: string, options?: { isDefault?: boolean; isShared?: boolean }) => {
    saveMutation.mutate({ name, ...options });
  }, [saveMutation]);

  const deleteSavedFilter = useCallback((filterId: string) => {
    deleteMutation.mutate(filterId);
  }, [deleteMutation]);

  const getQueryParams = useCallback((): Record<string, string> => {
    const params: Record<string, string> = {};
    
    conditions.forEach(c => {
      const key = `filter_${c.field}_${c.operator}`;
      params[key] = String(c.value);
    });

    return params;
  }, [conditions]);

  const hasActiveFilter = conditions.length > 0;

  return {
    conditions,
    setConditions,
    addCondition,
    removeCondition,
    updateCondition,
    clearConditions,
    presets,
    applyPreset,
    savedFilters,
    isLoadingSaved,
    saveFilter,
    applySavedFilter,
    deleteSavedFilter,
    isSaving: saveMutation.isPending,
    activeFilterName,
    hasActiveFilter,
    getQueryParams,
  };
}


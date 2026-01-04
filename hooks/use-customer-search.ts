/**
 * Hook: Smart Customer Search
 * 
 * Features:
 * - Debounced search
 * - Fuzzy match by phone/name
 * - Returns history + auto-fill suggestions
 */

'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { logger } from '@/lib/utils/logger';

const DEBOUNCE_MS = 300;

export type CustomerSearchResult = {
  source: 'history' | 'customer';
  id: string;
  customerId: string | null;
  customerName: string | null;
  customerPhone: string;
  customerEmail: string | null;
  bookingCount: number;
  lastBookingDate: string | null;
  avgPaxCount: number | null;
  preferredPackageTypes: string[] | null;
  suggestedPax: number;
  isRepeatingCustomer?: boolean;
};

export function useCustomerSearch() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<CustomerSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Debounced search function
  const search = useCallback(async (searchQuery: string) => {
    if (!searchQuery || searchQuery.length < 2) {
      setResults([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/partner/customers/search?q=${encodeURIComponent(searchQuery)}&limit=10`
      );

      if (!response.ok) {
        throw new Error('Failed to search customers');
      }

      const data = await response.json();
      setResults(data.results || []);
      logger.info('Customer search completed', {
        query: searchQuery,
        resultCount: data.results?.length || 0,
      });
    } catch (err) {
      logger.error('Customer search failed', err, { query: searchQuery });
      setError('Gagal mencari customer');
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Debounced query handler
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (query.length >= 2) {
      searchTimeoutRef.current = setTimeout(() => {
        search(query);
      }, DEBOUNCE_MS);
    } else {
      setResults([]);
    }

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [query, search]);

  // Manual search trigger
  const performSearch = useCallback(
    (searchQuery: string) => {
      setQuery(searchQuery);
    },
    []
  );

  // Clear results
  const clear = useCallback(() => {
    setQuery('');
    setResults([]);
    setError(null);
  }, []);

  return {
    query,
    results,
    loading,
    error,
    search: performSearch, // Alias for consistency
    performSearch,
    clear,
  };
}


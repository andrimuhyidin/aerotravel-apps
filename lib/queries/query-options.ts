/**
 * React Query Default Options
 * Centralized caching strategy untuk Partner Portal
 */

export const defaultQueryOptions = {
  // Static/semi-static data (packages, tiers)
  static: {
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 30 * 60 * 1000, // 30 minutes
    refetchOnWindowFocus: false,
  },
  // Dashboard and analytics
  dashboard: {
    staleTime: 30 * 1000, // 30 seconds
    cacheTime: 5 * 60 * 1000, // 5 minutes
    refetchInterval: 60 * 1000, // 1 minute
  },
  // List data (bookings, customers, invoices)
  list: {
    staleTime: 1 * 60 * 1000, // 1 minute
    cacheTime: 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus: true,
  },
  // Detail pages
  detail: {
    staleTime: 2 * 60 * 1000, // 2 minutes
    cacheTime: 15 * 60 * 1000, // 15 minutes
    refetchOnWindowFocus: true,
  },
  // Real-time data (notifications, wallet balance)
  realtime: {
    staleTime: 0, // Always fresh
    cacheTime: 1 * 60 * 1000, // 1 minute
    refetchInterval: 30 * 1000, // 30 seconds
  },
};

/**
 * Helper to get query options by type
 */
export function getQueryOptions(type: keyof typeof defaultQueryOptions) {
  return defaultQueryOptions[type];
}


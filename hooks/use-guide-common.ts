/**
 * Shared Hooks for Guide App
 * Common patterns untuk reuse di multiple components
 */

import queryKeys from '@/lib/queries/query-keys';
import { useQuery } from '@tanstack/react-query';

/**
 * Hook untuk fetch guide status
 */
export function useGuideStatus() {
  return useQuery({
    queryKey: queryKeys.guide.status(),
    queryFn: async () => {
      const res = await fetch('/api/guide/status');
      if (!res.ok) {
        throw new Error('Failed to load guide status');
      }
      return (await res.json()) as {
        status: {
          current_status: 'standby' | 'on_trip' | 'not_available';
          upcoming_availability?: string;
        };
      };
    },
  });
}

/**
 * Hook untuk fetch guide trips
 */
export function useGuideTrips() {
  return useQuery({
    queryKey: queryKeys.guide.trips.all(),
    queryFn: async () => {
      const res = await fetch('/api/guide/trips');
      if (!res.ok) {
        throw new Error('Failed to load guide trips');
      }
      return (await res.json()) as {
        trips: Array<{
          id: string;
          trip_code: string;
          date: string;
          status: string;
          name?: string;
          code?: string;
          guests?: number;
          destination?: string | null;
          duration?: number | null;
          meeting_point?: string | null;
        }>;
      };
    },
  });
}

/**
 * Hook untuk fetch guide stats
 */
export function useGuideStats() {
  return useQuery({
    queryKey: queryKeys.guide.stats(),
    queryFn: async () => {
      const res = await fetch('/api/guide/stats');
      if (!res.ok) {
        throw new Error('Failed to load guide stats');
      }
      return (await res.json()) as {
        averageRating: number;
        totalRatings: number;
        totalTrips: number;
        completedThisMonth: number;
        joinDate?: string;
      };
    },
  });
}

/**
 * Hook untuk fetch quick actions
 */
export function useGuideQuickActions() {
  return useQuery({
    queryKey: queryKeys.guide.quickActions(),
    queryFn: async () => {
      const res = await fetch('/api/guide/quick-actions');
      if (!res.ok) {
        throw new Error(`Failed to load quick actions: ${res.status}`);
      }
      return (await res.json()) as {
        actions: Array<{
          id: string;
          href: string;
          label: string;
          icon_name: string;
          color: string;
          description?: string;
        }>;
      };
    },
    retry: 2,
    staleTime: 300000, // Cache 5 minutes
  });
}

/**
 * Hook untuk fetch menu items
 */
export function useGuideMenuItems() {
  return useQuery({
    queryKey: queryKeys.guide.menuItems(),
    queryFn: async () => {
      const res = await fetch('/api/guide/menu-items');
      if (!res.ok) {
        throw new Error(`Failed to fetch menu items: ${res.status}`);
      }
      return (await res.json()) as {
        menuItems: Array<{
          section: string;
          items: Array<{
            href: string;
            label: string;
            icon_name: string;
            description?: string;
          }>;
        }>;
      };
    },
    retry: 2,
    staleTime: 300000, // Cache 5 minutes
  });
}


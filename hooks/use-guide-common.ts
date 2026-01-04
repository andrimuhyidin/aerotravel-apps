/**
 * Shared Hooks for Guide App
 * Common patterns untuk reuse di multiple components
 */

import queryKeys from '@/lib/queries/query-keys';
import { useQuery } from '@tanstack/react-query';

/**
 * Hook untuk fetch guide status
 */
export function useGuideStatus(initialData?: {
  status: {
    current_status: 'standby' | 'on_trip' | 'not_available';
    note: string | null;
    updated_at: string | null;
  };
  upcoming: Array<{
    id: string;
    available_from: string;
    available_until: string;
    status: string;
    reason: string | null;
  }>;
}) {
  return useQuery({
    queryKey: queryKeys.guide.status(),
    queryFn: async () => {
      try {
        const res = await fetch('/api/guide/status');
        if (!res.ok) {
          const errorData = await res.json().catch(() => ({ error: 'Failed to load guide status' }));
          throw new Error(errorData.error || errorData.message || `Failed to load guide status: ${res.status}`);
        }
        const response = await res.json();
        // API returns { data: { status, upcoming } }
        return (response.data ?? response) as {
        status: {
          current_status: 'standby' | 'on_trip' | 'not_available';
          note: string | null;
          updated_at: string | null;
        };
        upcoming: Array<{
          id: string;
          available_from: string;
          available_until: string;
          status: string;
          reason: string | null;
        }>;
      };
      } catch (error) {
        if (error instanceof Error) {
          throw error;
        }
        throw new Error('Failed to load guide status');
      }
    },
    initialData,
    staleTime: 60000, // 1 minute
    retry: 2,
  });
}

/**
 * Hook untuk fetch guide trips
 */
export function useGuideTrips(initialData?: {
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
    assignment_status?: 'pending_confirmation' | 'confirmed' | 'rejected' | 'expired' | 'auto_reassigned' | null;
    confirmation_deadline?: string | null;
    confirmed_at?: string | null;
    rejected_at?: string | null;
    fee_amount?: number | null;
  }>;
}) {
  return useQuery({
    queryKey: queryKeys.guide.trips.all(),
    queryFn: async () => {
      try {
        const res = await fetch('/api/guide/trips');
        if (!res.ok) {
          const errorData = await res.json().catch(() => ({ error: 'Failed to load guide trips' }));
          throw new Error(errorData.error || errorData.message || `Failed to load guide trips: ${res.status}`);
        }
        const response = await res.json();
        // API returns { data: {...} } or direct object
        return (response.data ?? response) as {
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
          assignment_status?: 'pending_confirmation' | 'confirmed' | 'rejected' | 'expired' | 'auto_reassigned' | null;
          confirmation_deadline?: string | null;
          confirmed_at?: string | null;
          rejected_at?: string | null;
          fee_amount?: number | null;
        }>;
      };
      } catch (error) {
        if (error instanceof Error) {
          throw error;
        }
        throw new Error('Failed to load guide trips');
      }
    },
    initialData,
    staleTime: 120000, // 2 minutes
    retry: 2,
  });
}

/**
 * Hook untuk fetch guide stats
 */
export function useGuideStats(initialData?: {
  averageRating: number;
  totalRatings: number;
  totalTrips: number;
  completedThisMonth: number;
  joinDate?: string;
  currentLevel?: 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond';
  currentLevelProgress?: number;
  nextLevelTripsRequired?: number;
  badges?: Array<{
    id: string;
    name: string;
    description: string;
    icon: string;
    earned: boolean;
  }>;
  complaints?: number;
  penalties?: number;
}) {
  return useQuery({
    queryKey: queryKeys.guide.stats(),
    queryFn: async () => {
      try {
        const res = await fetch('/api/guide/stats');
        if (!res.ok) {
          const errorData = await res.json().catch(() => ({ error: 'Failed to load guide stats' }));
          throw new Error(errorData.error || errorData.message || `Failed to load guide stats: ${res.status}`);
        }
        const response = await res.json();
        // API returns stats directly (not wrapped in data property)
        const stats = (response.data ?? response) as {
        averageRating: number;
        totalRatings: number;
        totalTrips: number;
        completedThisMonth: number;
        joinDate?: string;
        currentLevel?: 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond';
        currentLevelProgress?: number;
        nextLevelTripsRequired?: number;
        badges?: Array<{
          id: string;
          name: string;
          description: string;
          icon: string;
          earned: boolean;
        }>;
        complaints?: number;
        penalties?: number;
      };
      
      // Ensure required fields have defaults
      return {
        averageRating: stats.averageRating ?? 0,
        totalRatings: stats.totalRatings ?? 0,
        totalTrips: stats.totalTrips ?? 0,
        completedThisMonth: stats.completedThisMonth ?? 0,
        joinDate: stats.joinDate,
        currentLevel: stats.currentLevel ?? 'bronze',
        currentLevelProgress: stats.currentLevelProgress ?? 0,
        nextLevelTripsRequired: stats.nextLevelTripsRequired ?? 0,
        badges: stats.badges ?? [],
        complaints: stats.complaints ?? 0,
        penalties: stats.penalties ?? 0,
      };
      } catch (error) {
        if (error instanceof Error) {
          throw error;
        }
        throw new Error('Failed to load guide stats');
      }
    },
    initialData,
    staleTime: 300000, // 5 minutes
    retry: 2,
  });
}

/**
 * Hook untuk fetch quick actions
 */
export function useGuideQuickActions() {
  return useQuery({
    queryKey: queryKeys.guide.quickActions(),
    queryFn: async () => {
      try {
        const res = await fetch('/api/guide/quick-actions');
        if (!res.ok) {
          const errorData = await res.json().catch(() => ({ error: `Failed to load quick actions: ${res.status}` }));
          throw new Error(errorData.error || errorData.message || `Failed to load quick actions: ${res.status}`);
        }
        const data = await res.json();
        return (data.data ?? data) as {
          actions: Array<{
            id: string;
            href: string;
            label: string;
            icon_name: string;
            color: string;
            description?: string;
          }>;
        };
      } catch (error) {
        if (error instanceof Error) {
          throw error;
        }
        throw new Error('Failed to load quick actions');
      }
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
      try {
        const res = await fetch('/api/guide/menu-items');
        if (!res.ok) {
          const errorData = await res.json().catch(() => ({ error: `Failed to fetch menu items: ${res.status}` }));
          throw new Error(errorData.error || errorData.message || `Failed to fetch menu items: ${res.status}`);
        }
        const data = await res.json();
        return (data.data ?? data) as {
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
      } catch (error) {
        if (error instanceof Error) {
          throw error;
        }
        throw new Error('Failed to fetch menu items');
      }
    },
    retry: 2,
    staleTime: 300000, // Cache 5 minutes
  });
}


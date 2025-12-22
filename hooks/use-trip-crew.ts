/**
 * Hook untuk mendapatkan crew role dan permissions untuk trip
 */

import type { CrewRole } from '@/lib/guide/crew-permissions';
import queryKeys from '@/lib/queries/query-keys';
import { useQuery } from '@tanstack/react-query';

type TripCrewResponse = {
  crew: Array<{
    id: string;
    guide_id: string;
    role: 'lead' | 'support';
    status: string;
  }>;
  currentUserRole: CrewRole;
  currentUserId?: string; // Current user ID for matching
  isLeadGuide: boolean;
  isSupportGuide: boolean;
  isCrewMember: boolean;
  isOpsAdmin: boolean;
};

/**
 * Hook untuk mendapatkan crew role current user untuk trip
 */
export function useTripCrew(tripId: string) {
  return useQuery<TripCrewResponse>({
    queryKey: queryKeys.guide.team.tripTeam(tripId),
    queryFn: async () => {
      try {
        const res = await fetch(`/api/guide/crew/trip/${tripId}`);
        if (!res.ok) {
          const errorData = await res.json().catch(() => ({ error: 'Failed to fetch crew' }));
          throw new Error(errorData.error || errorData.message || `Failed to fetch crew: ${res.status}`);
        }
        const data = await res.json();
        return (data.data ?? data) as TripCrewResponse;
      } catch (error) {
        if (error instanceof Error) {
          throw error;
        }
        throw new Error('Failed to fetch crew');
      }
    },
    staleTime: 60000, // 1 minute
  });
}

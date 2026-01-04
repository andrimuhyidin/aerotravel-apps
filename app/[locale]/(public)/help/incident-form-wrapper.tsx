'use client';

/**
 * Incident Form Wrapper
 * Client component wrapper for IncidentForm to be used in server components
 */

import { IncidentForm } from '@/app/[locale]/(mobile)/guide/incidents/incident-form';

type IncidentFormWrapperProps = {
  guideId: string;
  tripId?: string;
};

export function IncidentFormWrapper({ guideId, tripId }: IncidentFormWrapperProps) {
  return <IncidentForm guideId={guideId} tripId={tripId} />;
}

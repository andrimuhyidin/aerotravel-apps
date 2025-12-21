'use client';

/**
 * Waste Log Section Component
 * Allows guide to log waste per trip with photo upload
 * Uses extracted WasteLogForm component for backward compatibility
 */

import { useQuery } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import queryKeys from '@/lib/queries/query-keys';
import { WasteLogForm } from './waste-log-form';

type WasteLogSectionProps = {
  tripId: string;
  locale: string;
};

type WasteLog = {
  id: string;
  waste_type: 'plastic' | 'organic' | 'glass' | 'hazmat';
  quantity: number;
  unit: 'kg' | 'pieces';
  disposal_method: 'landfill' | 'recycling' | 'incineration' | 'ocean';
  notes: string | null;
  logged_at: string;
  photos?: Array<{
    id: string;
    photo_url: string;
    photo_gps: { latitude?: number; longitude?: number } | null;
    captured_at: string | null;
  }>;
};

type WasteTypeOption = {
  value: string;
  label: string;
  description?: string;
};

type DisposalMethodOption = {
  value: string;
  label: string;
  description?: string;
};

export function WasteLogSection({ tripId, locale }: WasteLogSectionProps) {
  // Fetch waste types for display
  const { data: wasteTypesData } = useQuery<{ data: { wasteTypes: WasteTypeOption[] } }>({
    queryKey: queryKeys.guide.wasteTypes(),
    queryFn: async () => {
      const res = await fetch('/api/guide/waste-types');
      if (!res.ok) throw new Error('Failed to fetch waste types');
      return res.json();
    },
    staleTime: 300000,
  });

  // Fetch disposal methods for display
  const { data: disposalMethodsData } = useQuery<{ data: { disposalMethods: DisposalMethodOption[] } }>({
    queryKey: queryKeys.guide.disposalMethods(),
    queryFn: async () => {
      const res = await fetch('/api/guide/disposal-methods');
      if (!res.ok) throw new Error('Failed to fetch disposal methods');
      return res.json();
    },
    staleTime: 300000,
  });

  // Fetch existing waste logs
  const { data: wasteLogsData, isLoading } = useQuery<{ waste_logs: WasteLog[] }>({
    queryKey: queryKeys.guide.trips.wasteLog(tripId),
    queryFn: async () => {
      const res = await fetch(`/api/guide/trips/${tripId}/waste-log`);
      if (!res.ok) throw new Error('Failed to fetch waste logs');
      return res.json();
    },
  });

  const WASTE_TYPES = wasteTypesData?.data?.wasteTypes || [];
  const DISPOSAL_METHODS = disposalMethodsData?.data?.disposalMethods || [];
  const wasteLogs = wasteLogsData?.waste_logs || [];

  return (
    <Card className="border-slate-200">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <span>Waste Logging</span>
          <span className="text-xs font-normal text-slate-500">(ISO 14001 Compliance)</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Existing Waste Logs */}
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-5 w-5 animate-spin text-slate-400" />
          </div>
        ) : wasteLogs.length > 0 ? (
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-slate-700">Log Terdaftar</h4>
            {wasteLogs.map((log) => (
              <div
                key={log.id}
                className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm"
              >
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <div className="font-medium">
                      {WASTE_TYPES.find((t) => t.value === log.waste_type)?.label || log.waste_type}
                    </div>
                    <div className="text-slate-600">
                      {log.quantity} {log.unit}
                    </div>
                    <div className="text-slate-500">
                      {DISPOSAL_METHODS.find((m) => m.value === log.disposal_method)?.label ||
                        log.disposal_method}
                    </div>
                    {log.notes && (
                      <div className="text-slate-500 italic">{log.notes}</div>
                    )}
                  </div>
                  <div className="text-xs text-slate-400">
                    {new Date(log.logged_at).toLocaleDateString('id-ID')}
                  </div>
                </div>
                {log.photos && log.photos.length > 0 && (
                  <div className="mt-2 flex gap-2">
                    {log.photos.map((photo) => (
                      <img
                        key={photo.id}
                        src={photo.photo_url}
                        alt="Waste photo"
                        className="h-16 w-16 rounded object-cover"
                      />
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : null}

        {/* Waste Log Form - Using extracted component */}
        <WasteLogForm tripId={tripId} locale={locale} />
      </CardContent>
    </Card>
  );
}


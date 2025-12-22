'use client';

/**
 * Waste Log Button Component
 * Button dengan badge count dan list existing logs
 * Opens modal on click
 */

import { useQuery } from '@tanstack/react-query';
import { Loader2, Trash2 } from 'lucide-react';
import { useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import queryKeys from '@/lib/queries/query-keys';
import { WasteLogModal } from './waste-log-modal';

type WasteLogButtonProps = {
  tripId: string;
  locale: string;
};

type WasteLog = {
  id: string;
  waste_type: 'plastic' | 'organic' | 'glass' | 'hazmat';
  waste_type_label?: string;
  quantity: number;
  quantity_kg?: number;
  unit: 'kg' | 'pieces';
  disposal_method: 'landfill' | 'recycling' | 'incineration' | 'ocean';
  disposal_method_label?: string;
  notes: string | null;
  logged_by?: {
    id: string;
    name: string;
    email?: string | null;
  } | null;
  logged_at: string;
  photos?: Array<{
    id: string;
    photo_url: string;
    photo_gps: { latitude?: number; longitude?: number; accuracy?: number } | null;
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

export function WasteLogButton({ tripId, locale }: WasteLogButtonProps) {
  const [modalOpen, setModalOpen] = useState(false);

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
  const logCount = wasteLogs.length;

  return (
    <>
      <Card className="border-slate-200">
        <CardContent className="p-4 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <h4 className="text-sm font-semibold text-slate-900">Waste Logging</h4>
              <p className="text-xs text-slate-600 mt-0.5">
                {logCount > 0
                  ? `${logCount} log terdaftar`
                  : 'Belum ada log'}
              </p>
            </div>
            <Button onClick={() => setModalOpen(true)} size="sm">
              <Trash2 className="h-4 w-4 mr-2" />
              {logCount > 0 ? 'Tambah Log' : 'Log Waste'}
              {logCount > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {logCount}
                </Badge>
              )}
            </Button>
          </div>

          {/* Existing Logs List */}
          {isLoading ? (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="h-4 w-4 animate-spin text-slate-400" />
            </div>
          ) : wasteLogs.length > 0 ? (
            <div className="space-y-2">
              {wasteLogs.map((log) => (
                <div
                  key={log.id}
                  className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-1.5 flex-1 min-w-0">
                      <div className="font-semibold text-slate-900">
                        {log.waste_type_label || WASTE_TYPES.find((t) => t.value === log.waste_type)?.label || log.waste_type}
                      </div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-slate-700 font-medium">
                          {log.quantity} {log.unit}
                        </span>
                        {log.quantity_kg && log.unit !== 'kg' && (
                          <span className="text-xs text-slate-500">
                            (~{log.quantity_kg.toFixed(2)} kg)
                          </span>
                        )}
                      </div>
                      <div className="text-slate-600">
                        {log.disposal_method_label || DISPOSAL_METHODS.find((m) => m.value === log.disposal_method)?.label ||
                          log.disposal_method}
                      </div>
                      {log.notes && (
                        <div className="text-slate-500 italic text-xs bg-white/50 rounded px-2 py-1">
                          {log.notes}
                        </div>
                      )}
                      {log.logged_by && (
                        <div className="text-xs text-slate-500">
                          Dicatat oleh: <span className="font-medium">{log.logged_by.name}</span>
                        </div>
                      )}
                    </div>
                    <div className="text-xs text-slate-400 whitespace-nowrap">
                      {new Date(log.logged_at).toLocaleDateString('id-ID', {
                        day: 'numeric',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </div>
                  </div>
                  {log.photos && log.photos.length > 0 && (
                    <div className="mt-2 grid grid-cols-4 gap-2">
                      {log.photos.map((photo) => (
                        <div key={photo.id} className="relative aspect-square">
                          <img
                            src={photo.photo_url}
                            alt="Waste photo"
                            className="h-full w-full rounded object-cover"
                          />
                          {photo.photo_gps && (
                            <div className="absolute bottom-1 right-1 bg-black/50 rounded px-1 py-0.5 text-[10px] text-white">
                              📍
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : null}
        </CardContent>
      </Card>

      <WasteLogModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        tripId={tripId}
        locale={locale}
      />
    </>
  );
}


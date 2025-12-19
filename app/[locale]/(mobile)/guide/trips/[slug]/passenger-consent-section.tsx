'use client';

/**
 * Passenger Consent Section
 * Display passengers and collect digital signatures for consent
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CheckCircle2, Loader2, Users } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { SignaturePad, type SignatureData } from '@/components/ui/signature-pad';
import { cn } from '@/lib/utils';
import { logger } from '@/lib/utils/logger';

type PassengerConsentSectionProps = {
  tripId: string;
  locale: string;
};

type Passenger = {
  id: string;
  name: string;
  age?: number | null;
  passenger_type?: string | null;
};

type Consent = {
  id: string;
  passenger_id: string;
  consent_given: boolean;
  signature_data?: string | null;
  signature_method?: string | null;
  briefing_acknowledged: boolean;
};

export function PassengerConsentSection({ tripId, locale: _locale }: PassengerConsentSectionProps) {
  const [selectedPassenger, setSelectedPassenger] = useState<Passenger | null>(null);
  const [consentDialogOpen, setConsentDialogOpen] = useState(false);
  const [signature, setSignature] = useState<SignatureData | null>(null);
  const [acknowledgedPoints, setAcknowledgedPoints] = useState<Set<string>>(new Set());
  const queryClient = useQueryClient();

  // Fetch passengers from manifest
  const { data: manifestData } = useQuery<{ passengers: Array<{ id: string; name: string; age?: number | null; type?: string | null }> }>({
    queryKey: ['trip-manifest', tripId],
    queryFn: async () => {
      const res = await fetch(`/api/guide/manifest?tripId=${tripId}`);
      if (!res.ok) {
        throw new Error('Failed to fetch manifest');
      }
      const data = (await res.json()) as { 
        passengers?: Array<{ 
          id?: string; 
          name: string; 
          age?: number | null; 
          type?: string | null;
          phone?: string;
        }> 
      };
      // Map to Passenger format (use booking_passengers.id)
      return {
        passengers: (data.passengers || []).map((p, idx) => ({
          id: p.id || `passenger-${idx}`, // booking_passengers.id
          name: p.name,
          age: p.age || null,
          passenger_type: p.type || null,
        })),
      };
    },
  });

  // Fetch consents
  const { data: consentData } = useQuery<{
    consents: Consent[];
    all_consented: boolean;
  }>({
    queryKey: ['trip-consents', tripId],
    queryFn: async () => {
      const res = await fetch(`/api/guide/trips/${tripId}/briefing/consent`);
      if (!res.ok) {
        throw new Error('Failed to fetch consents');
      }
      return res.json();
    },
  });

  const passengers = manifestData?.passengers || [];
  const consents = consentData?.consents || [];
  const allConsented = consentData?.all_consented || false;

  const consentMutation = useMutation({
    mutationFn: async (payload: {
      passenger_id: string;
      signature: SignatureData;
      acknowledged_points: string[];
    }) => {
      const res = await fetch(`/api/guide/trips/${tripId}/briefing/consent`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          passenger_id: payload.passenger_id,
          consent_given: true,
          signature: {
            method: payload.signature.method,
            data: payload.signature.data,
          },
          briefing_acknowledged: true,
          acknowledged_points: payload.acknowledged_points,
        }),
      });

      if (!res.ok) {
        const error = (await res.json()) as { error?: string };
        throw new Error(error.error || 'Failed to save consent');
      }

      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['trip-consents', tripId] });
      setConsentDialogOpen(false);
      setSelectedPassenger(null);
      setSignature(null);
      setAcknowledgedPoints(new Set());
      
      if (data.all_consented) {
        toast.success('Semua penumpang telah memberikan consent. Trip dapat dimulai.');
      } else {
        toast.success('Consent berhasil disimpan');
      }
    },
    onError: (error) => {
      logger.error('Failed to save consent', error);
      toast.error(error instanceof Error ? error.message : 'Gagal menyimpan consent');
    },
  });

  const handleOpenConsent = (passenger: Passenger) => {
    setSelectedPassenger(passenger);
    setConsentDialogOpen(true);
    
    // Check if already consented
    const existingConsent = consents.find((c) => c.passenger_id === passenger.id);
    if (existingConsent?.signature_data) {
      // Pre-fill signature if exists
      setSignature({
        method: (existingConsent.signature_method as 'draw' | 'upload' | 'typed') || 'typed',
        data: existingConsent.signature_data,
        timestamp: new Date().toISOString(),
      });
    }
  };

  const handleSubmitConsent = () => {
    if (!selectedPassenger || !signature) {
      toast.error('Mohon berikan tanda tangan');
      return;
    }

    consentMutation.mutate({
      passenger_id: selectedPassenger.id,
      signature,
      acknowledged_points: Array.from(acknowledgedPoints),
    });
  };

  const getPassengerConsent = (passengerId: string) => {
    return consents.find((c) => c.passenger_id === passengerId);
  };

  if (passengers.length === 0) {
    return null;
  }

  return (
    <>
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base font-semibold">
            <Users className="h-5 w-5 text-emerald-600" />
            Passenger Consent
            {allConsented && (
              <span className="ml-auto text-xs font-normal text-emerald-600 flex items-center gap-1">
                <CheckCircle2 className="h-4 w-4" />
                Semua sudah consent
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {passengers.map((passenger) => {
              const consent = getPassengerConsent(passenger.id);
              const hasConsented = consent?.consent_given || false;

              return (
                <div
                  key={passenger.id}
                  className={cn(
                    'flex items-center justify-between rounded-lg border p-3',
                    hasConsented
                      ? 'border-emerald-200 bg-emerald-50'
                      : 'border-amber-200 bg-amber-50',
                  )}
                >
                  <div className="flex-1">
                    <p className="text-sm font-medium text-slate-900">{passenger.name}</p>
                    {passenger.age && (
                      <p className="text-xs text-slate-500">Usia: {passenger.age} tahun</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {hasConsented ? (
                      <div className="flex items-center gap-1 text-xs text-emerald-600">
                        <CheckCircle2 className="h-4 w-4" />
                        <span>Sudah consent</span>
                      </div>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleOpenConsent(passenger)}
                        className="border-amber-300 text-amber-700 hover:bg-amber-100"
                      >
                        Ambil Consent
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {!allConsented && (
            <div className="mt-4 rounded-lg bg-amber-50 p-3">
              <p className="text-xs font-medium text-amber-900">
                ⚠️ Semua penumpang harus memberikan consent sebelum trip dapat dimulai
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Consent Dialog */}
      <Dialog open={consentDialogOpen} onOpenChange={setConsentDialogOpen}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Passenger Consent</DialogTitle>
            <DialogDescription>
              {selectedPassenger?.name} - Mohon berikan tanda tangan untuk persetujuan
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Briefing Acknowledgment */}
            <div className="space-y-2">
              <Label className="text-sm font-semibold">Acknowledgment</Label>
              <p className="text-xs text-slate-600">
                Saya telah membaca dan memahami briefing keselamatan yang disampaikan oleh guide
              </p>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="acknowledge-briefing"
                  checked={acknowledgedPoints.has('briefing')}
                  onChange={(e) => {
                    const newSet = new Set(acknowledgedPoints);
                    if (e.target.checked) {
                      newSet.add('briefing');
                    } else {
                      newSet.delete('briefing');
                    }
                    setAcknowledgedPoints(newSet);
                  }}
                  className="h-4 w-4 rounded border-slate-300"
                />
                <Label htmlFor="acknowledge-briefing" className="text-sm cursor-pointer">
                  Saya memahami briefing keselamatan
                </Label>
              </div>
            </div>

            {/* Signature */}
            <div className="space-y-2">
              <Label className="text-sm font-semibold">
                Tanda Tangan <span className="text-red-500">*</span>
              </Label>
              <SignaturePad
                value={signature}
                onChange={setSignature}
                label=""
                required
                showGPS={false}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setConsentDialogOpen(false)}>
              Batal
            </Button>
            <Button
              onClick={handleSubmitConsent}
              disabled={consentMutation.isPending || !signature || !acknowledgedPoints.has('briefing')}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              {consentMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Menyimpan...
                </>
              ) : (
                <>
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  Simpan Consent
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

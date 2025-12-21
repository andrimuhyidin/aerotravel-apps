'use client';

/**
 * Passenger Consent Section
 * Display passengers and collect digital signatures for consent
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CheckCircle2, ChevronDown, ChevronUp, Loader2, Sparkles, Users } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { SignaturePad, type SignatureData } from '@/components/ui/signature-pad';
import { cacheBriefingTemplate, getCachedBriefingTemplate } from '@/lib/guide/offline-sync';
import { getTripManifest, type TripManifest } from '@/lib/guide/manifest';
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

type BriefingPoints = {
  sections: Array<{
    title: string;
    points: string[];
    priority: 'high' | 'medium' | 'low';
  }>;
  estimatedDuration: number;
  targetAudience: string;
  summary: string;
};

export function PassengerConsentSection({ tripId, locale }: PassengerConsentSectionProps) {
  const [selectedPassenger, setSelectedPassenger] = useState<Passenger | null>(null);
  const [consentDialogOpen, setConsentDialogOpen] = useState(false);
  const [signature, setSignature] = useState<SignatureData | null>(null);
  const [acknowledgedPoints, setAcknowledgedPoints] = useState<Set<string>>(new Set());
  const [briefingLanguage, setBriefingLanguage] = useState<'id' | 'en' | 'zh' | 'ja'>('id');
  const [showBriefing, setShowBriefing] = useState(false);
  const queryClient = useQueryClient();

  // Fetch passengers from manifest (using consistent query key)
  const { data: manifestData } = useQuery<TripManifest>({
    queryKey: ['guide', 'manifest', tripId],
    queryFn: () => getTripManifest(tripId),
  });

  // Map TripManifest passengers to Passenger format (must be before queries that use it)
  const passengers: Passenger[] = (manifestData?.passengers || []).map((p) => ({
    id: p.id,
    name: p.name,
    age: undefined, // TripManifest.Passenger doesn't have age
    passenger_type: p.type || null,
  }));

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

  // Fetch or generate briefing
  const { data: briefingData, isLoading: briefingLoading, refetch: refetchBriefing } = useQuery<{
    briefing: BriefingPoints | null;
    generatedAt?: string;
    updatedAt?: string;
    cached?: boolean;
  }>({
    queryKey: ['trip-briefing', tripId, briefingLanguage],
    queryFn: async () => {
      // Check cached template first (for offline access)
      if (!navigator.onLine) {
        const cached = await getCachedBriefingTemplate(tripId);
        if (cached && cached.briefingPoints) {
          logger.info('Using cached briefing template', { tripId });
          return {
            briefing: cached.briefingPoints as BriefingPoints,
            generatedAt: cached.generatedAt,
            cached: true,
          };
        }
        throw new Error('No cached briefing available and offline');
      }

      // Try to get existing briefing first
      const getRes = await fetch(`/api/guide/trips/${tripId}/briefing`);
      if (getRes.ok) {
        const data = await getRes.json();
        if (data.briefing) {
          // Cache the briefing template
          await cacheBriefingTemplate(tripId, {
            briefingPoints: data.briefing,
            generatedAt: data.generatedAt || new Date().toISOString(),
            generatedBy: data.generatedBy,
          });
          return data;
        }
      }
      
      // Generate new briefing if not exists
      const generateRes = await fetch(`/api/guide/trips/${tripId}/briefing/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ language: briefingLanguage }),
      });
      
      if (!generateRes.ok) {
        // If generation fails, try cached template
        const cached = await getCachedBriefingTemplate(tripId);
        if (cached && cached.briefingPoints) {
          logger.warn('Briefing generation failed, using cached template', { tripId });
          return {
            briefing: cached.briefingPoints as BriefingPoints,
            generatedAt: cached.generatedAt,
            cached: true,
          };
        }
        throw new Error('Failed to generate briefing');
      }
      
      const generated = await generateRes.json();
      
      // Cache the generated briefing template
      if (generated.briefing) {
        await cacheBriefingTemplate(tripId, {
          briefingPoints: generated.briefing,
          generatedAt: new Date().toISOString(),
          generatedBy: undefined,
        });
      }
      
      return { briefing: generated.briefing };
    },
    enabled: passengers.length > 0, // Only fetch if passengers exist
  });
  
  // Extract consents and allConsented from consentData
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
    return (
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold text-slate-900">Konsensus Penumpang</CardTitle>
        </CardHeader>
        <CardContent>
          <EmptyState
            icon={Users}
            title="Belum ada penumpang"
            description="Penumpang akan muncul di sini setelah ditambahkan ke manifest"
            variant="subtle"
          />
        </CardContent>
      </Card>
    );
  }

  const briefing = briefingData?.briefing || null;

  return (
    <>
      {/* Safety Briefing Section */}
      {briefing && (
        <Card className="border-0 shadow-sm mb-4">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-base font-semibold">
                <Sparkles className="h-5 w-5 text-blue-600" />
                Safety Briefing
              </CardTitle>
              <Select value={briefingLanguage} onValueChange={(value) => setBriefingLanguage(value as typeof briefingLanguage)}>
                <SelectTrigger className="w-32 h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="id">🇮🇩 ID</SelectItem>
                  <SelectItem value="en">🇬🇧 EN</SelectItem>
                  <SelectItem value="zh">🇨🇳 中文</SelectItem>
                  <SelectItem value="ja">🇯🇵 日本語</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {briefing.summary && (
              <p className="text-xs text-slate-600 mt-2">{briefing.summary}</p>
            )}
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowBriefing(!showBriefing)}
                className="w-full"
              >
                {showBriefing ? (
                  <>
                    <ChevronUp className="mr-2 h-4 w-4" />
                    Sembunyikan Briefing
                  </>
                ) : (
                  <>
                    <ChevronDown className="mr-2 h-4 w-4" />
                    Tampilkan Briefing ({briefing.estimatedDuration} menit)
                  </>
                )}
              </Button>
              
              {showBriefing && (
                <Accordion type="single" className="w-full">
                  {briefing.sections.map((section, idx) => (
                    <AccordionItem key={idx} value={`section-${idx}`}>
                      <AccordionTrigger value={`section-${idx}`} className="text-sm font-medium">
                        <div className="flex items-center gap-2">
                          <span
                            className={cn(
                              'h-2 w-2 rounded-full',
                              section.priority === 'high' && 'bg-red-500',
                              section.priority === 'medium' && 'bg-amber-500',
                              section.priority === 'low' && 'bg-emerald-500'
                            )}
                          />
                          {section.title}
                        </div>
                      </AccordionTrigger>
                      <AccordionContent value={`section-${idx}`}>
                        <ul className="space-y-2 text-sm text-slate-700">
                          {section.points.map((point, pointIdx) => (
                            <li key={pointIdx} className="flex items-start gap-2">
                              <span className="text-emerald-600 mt-1">•</span>
                              <span>{point}</span>
                            </li>
                          ))}
                        </ul>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {briefingLoading && (
        <Card className="border-0 shadow-sm mb-4">
          <CardContent className="py-6">
            <div className="flex items-center justify-center gap-2 text-slate-500">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="text-sm">Generating briefing...</span>
            </div>
          </CardContent>
        </Card>
      )}

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
            {/* Briefing Checklist */}
            {briefing && (
              <div className="space-y-3 rounded-lg border border-blue-200 bg-blue-50 p-3">
                <Label className="text-sm font-semibold text-blue-900">Briefing Checklist</Label>
                <p className="text-xs text-blue-700">
                  Guide telah membaca poin-poin berikut kepada penumpang:
                </p>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {briefing.sections.map((section, idx) => (
                    <div key={idx} className="space-y-1">
                      <div className="flex items-center gap-2 text-xs font-medium text-blue-900">
                        <span
                          className={cn(
                            'h-1.5 w-1.5 rounded-full',
                            section.priority === 'high' && 'bg-red-500',
                            section.priority === 'medium' && 'bg-amber-500',
                            section.priority === 'low' && 'bg-emerald-500'
                          )}
                        />
                        {section.title}
                      </div>
                      <ul className="ml-4 space-y-1">
                        {section.points.slice(0, 2).map((point, pointIdx) => (
                          <li key={pointIdx} className="text-xs text-blue-700">
                            • {point}
                          </li>
                        ))}
                        {section.points.length > 2 && (
                          <li className="text-xs text-blue-600 italic">
                            + {section.points.length - 2} poin lainnya
                          </li>
                        )}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>
            )}

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

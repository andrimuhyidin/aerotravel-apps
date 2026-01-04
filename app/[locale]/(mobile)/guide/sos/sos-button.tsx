'use client';

/**
 * SOS Button Component
 * Emergency panic button with GPS tracking
 */

import { AlertTriangle, Loader2, Phone, Shield, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
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
import { Textarea } from '@/components/ui/textarea';
import {
    getCurrentPosition,
    SOSAlertType,
    startEmergencyTracking,
    triggerSOSAlert,
} from '@/lib/guide';
import { startSOSStreaming } from '@/lib/guide/sos-streaming';
import { logger } from '@/lib/utils/logger';
import { cn } from '@/lib/utils';

type SOSButtonProps = {
  guideId: string;
  tripId?: string;
};

const sosTypes: { type: SOSAlertType; label: string; icon: React.ReactNode }[] = [
  { type: 'medical', label: 'Medis', icon: '🏥' },
  { type: 'security', label: 'Keamanan', icon: '🚨' },
  { type: 'weather', label: 'Cuaca Buruk', icon: '⛈️' },
  { type: 'accident', label: 'Kecelakaan', icon: '⚠️' },
  { type: 'other', label: 'Lainnya', icon: '📞' },
];

export function SOSButton({ guideId, tripId }: SOSButtonProps) {
  const [showPanel, setShowPanel] = useState(false);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [tracking, setTracking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [holdProgress, setHoldProgress] = useState(0);
  const [currentSosId, setCurrentSosId] = useState<string | null>(null);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [etaRemaining, setEtaRemaining] = useState<number | null>(null);

  const holdTimeoutRef = useRef<number | null>(null);
  const holdProgressRef = useRef<number | null>(null);
  const etaPollIntervalRef = useRef<number | null>(null);

  const handleSOS = async (type: SOSAlertType) => {
    setSending(true);
    setError(null);

    try {
      const location = await getCurrentPosition();
      const result = await triggerSOSAlert(type, guideId, location, tripId);

      if (result.success && result.alertId) {
        setSent(true);
        setCurrentSosId(result.alertId);
        
        // Start GPS streaming (every 10 seconds)
        const stopStreaming = startSOSStreaming(result.alertId);
        setTracking(true);

        // Also start emergency tracking for local updates
        const stopTracking = startEmergencyTracking(guideId, () => {
          // Location updates are handled by streaming service
        });

        // Start polling for ETA updates
        if (etaPollIntervalRef.current) {
          window.clearInterval(etaPollIntervalRef.current);
        }
        etaPollIntervalRef.current = window.setInterval(async () => {
          if (!result.alertId) return;
          try {
            const statusRes = await fetch(`/api/guide/sos/${result.alertId}/status`);
            if (statusRes.ok) {
              const status = await statusRes.json();
              setEtaRemaining(status.remainingMinutes);
            }
          } catch {
            // Silently fail - don't spam logs for polling errors
          }
        }, 5000); // Poll every 5 seconds

        // Auto-stop after 30 minutes
        setTimeout(() => {
          stopStreaming();
          stopTracking();
          setTracking(false);
          if (etaPollIntervalRef.current) {
            window.clearInterval(etaPollIntervalRef.current);
            etaPollIntervalRef.current = null;
          }
        }, 30 * 60 * 1000);
      } else {
        setError(result.message);
      }
    } catch (_err) {
      setError('Gagal mengirim SOS. Periksa koneksi internet.');
    }

    setSending(false);
  };

  const handleCancelSOS = async () => {
    if (!currentSosId || !cancelReason || cancelReason.length < 10) {
      setError('Mohon berikan alasan pembatalan (minimal 10 karakter)');
      return;
    }

    try {
      const res = await fetch(`/api/guide/sos/${currentSosId}/cancel`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: cancelReason }),
      });

      if (!res.ok) {
        throw new Error('Failed to cancel SOS');
      }

      setSent(false);
      setTracking(false);
      setShowCancelModal(false);
      setCancelReason('');
      setCurrentSosId(null);
      toast.success('SOS berhasil dibatalkan');
    } catch (err) {
      logger.error('Failed to cancel SOS', err);
      setError('Gagal membatalkan SOS');
    }
  };

  const handleCancel = () => {
    setSent(false);
    setTracking(false);
    setShowPanel(false);
    if (etaPollIntervalRef.current) {
      window.clearInterval(etaPollIntervalRef.current);
      etaPollIntervalRef.current = null;
    }
    setEtaRemaining(null);
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (etaPollIntervalRef.current) {
        window.clearInterval(etaPollIntervalRef.current);
      }
    };
  }, []);

  const startHold = () => {
    if (sending) return;
    setError(null);
    setHoldProgress(0);
    
    if (holdTimeoutRef.current !== null) {
      window.clearTimeout(holdTimeoutRef.current);
    }
    if (holdProgressRef.current !== null) {
      window.clearInterval(holdProgressRef.current);
    }

    // Animate progress bar
    const startTime = Date.now();
    holdProgressRef.current = window.setInterval(() => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min((elapsed / 3000) * 100, 100);
      setHoldProgress(progress);
    }, 50);

    holdTimeoutRef.current = window.setTimeout(() => {
      setShowPanel(true);
      if (holdProgressRef.current !== null) {
        window.clearInterval(holdProgressRef.current);
        holdProgressRef.current = null;
      }
      setHoldProgress(100);
    }, 3000);
  };

  const cancelHold = () => {
    if (holdTimeoutRef.current !== null) {
      window.clearTimeout(holdTimeoutRef.current);
      holdTimeoutRef.current = null;
    }
    if (holdProgressRef.current !== null) {
      window.clearInterval(holdProgressRef.current);
      holdProgressRef.current = null;
    }
    setHoldProgress(0);
  };

  if (sent) {
    return (
      <Card className="border-0 bg-red-50 shadow-sm">
        <CardContent className="p-6 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 animate-pulse items-center justify-center rounded-full bg-red-100">
            <AlertTriangle className="h-8 w-8 text-red-600" />
          </div>
          <h2 className="text-xl font-bold text-red-700">SOS Terkirim!</h2>
          <p className="mt-2 text-red-600">
            Tim operasional akan segera menghubungi Anda.
          </p>
          {tracking && (
            <p className="mt-2 text-sm text-red-500">
              🔴 Lokasi Anda sedang dipantau...
            </p>
          )}
          <div className="mt-4 flex gap-2">
            <Button
              variant="outline"
              className="flex-1 border-red-200 text-red-700"
              onClick={handleCancel}
            >
              <X className="mr-2 h-4 w-4" />
              Batalkan
            </Button>
            <Button className="flex-1 bg-red-600 hover:bg-red-700">
              <Phone className="mr-2 h-4 w-4" />
              Hubungi Ops
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (showPanel) {
    return (
      <div className="space-y-4">
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <Shield className="h-5 w-5 text-red-600" />
              Pilih Jenis Darurat
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              {sosTypes.map((item) => (
                <Button
                  key={item.type}
                  variant="outline"
                  className="h-auto flex-col gap-2 py-4 hover:border-red-300 hover:bg-red-50"
                  disabled={sending}
                  onClick={() => handleSOS(item.type)}
                >
                  <span className="text-2xl">{item.icon}</span>
                  <span className="text-sm font-medium">{item.label}</span>
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        {error && (
          <div className="rounded-lg bg-red-50 p-4 text-center text-red-700">
            {error}
          </div>
        )}

        <Button
          variant="ghost"
          className="w-full"
          onClick={() => setShowPanel(false)}
        >
          Batal
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Main SOS Button */}
      <div className="relative mx-auto w-40">
        <button
          className={cn(
            'relative flex h-40 w-40 flex-col items-center justify-center rounded-full',
            'bg-red-600 text-white shadow-lg transition-all',
            'hover:bg-red-700 hover:shadow-xl active:scale-95',
            sending && 'animate-pulse',
            holdProgress > 0 && holdProgress < 100 && 'ring-4 ring-red-300'
          )}
          onMouseDown={startHold}
          onMouseUp={cancelHold}
          onMouseLeave={cancelHold}
          onTouchStart={startHold}
          onTouchEnd={cancelHold}
          onTouchCancel={cancelHold}
          disabled={sending}
        >
          {sending ? (
            <Loader2 className="h-12 w-12 animate-spin" />
          ) : (
            <>
              <AlertTriangle className="h-12 w-12" />
              <span className="mt-2 text-xl font-bold">SOS</span>
            </>
          )}
          {/* Progress Ring */}
          {holdProgress > 0 && holdProgress < 100 && (
            <svg className="absolute inset-0 h-full w-full -rotate-90 transform">
              <circle
                cx="50%"
                cy="50%"
                r="48%"
                fill="none"
                stroke="rgba(255, 255, 255, 0.3)"
                strokeWidth="4"
                className="absolute"
              />
              <circle
                cx="50%"
                cy="50%"
                r="48%"
                fill="none"
                stroke="white"
                strokeWidth="4"
                strokeDasharray={`${2 * Math.PI * 48}%`}
                strokeDashoffset={`${2 * Math.PI * 48 * (1 - holdProgress / 100)}%`}
                className="transition-all duration-50"
              />
            </svg>
          )}
        </button>
        {holdProgress > 0 && holdProgress < 100 && (
          <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 whitespace-nowrap text-xs text-slate-600">
            Tahan {Math.ceil((3000 - holdProgress * 30) / 1000)}s...
          </div>
        )}
      </div>

      <p className="text-center text-sm text-slate-500">
        {holdProgress > 0 && holdProgress < 100
          ? 'Tahan tombol untuk mengaktifkan SOS'
          : 'Tahan tombol selama 3 detik dalam keadaan darurat'}
      </p>

      {/* Emergency Contacts */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Kontak Darurat</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex items-center justify-between rounded-lg bg-slate-50 p-3">
            <div>
              <p className="font-medium">Ops Elang</p>
              <p className="text-sm text-slate-500">Tim Operasional</p>
            </div>
            <Button size="sm" variant="outline">
              <Phone className="mr-1 h-4 w-4" />
              Hubungi
            </Button>
          </div>
          <div className="flex items-center justify-between rounded-lg bg-slate-50 p-3">
            <div>
              <p className="font-medium">SAR / Basarnas</p>
              <p className="text-sm text-slate-500">115</p>
            </div>
            <Button size="sm" variant="outline">
              <Phone className="mr-1 h-4 w-4" />
              Hubungi
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Cancel SOS Modal */}
      <Dialog open={showCancelModal} onOpenChange={setShowCancelModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Batalkan SOS</DialogTitle>
            <DialogDescription>
              Apakah Anda yakin ingin membatalkan SOS? Mohon berikan alasan.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Textarea
              placeholder="Alasan pembatalan (minimal 10 karakter)"
              value={cancelReason}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setCancelReason(e.target.value)}
              rows={3}
              className="resize-none"
            />
            {cancelReason.length > 0 && cancelReason.length < 10 && (
              <p className="mt-2 text-xs text-amber-600">
                Minimal 10 karakter ({cancelReason.length}/10)
              </p>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowCancelModal(false);
                setCancelReason('');
              }}
            >
              Batal
            </Button>
            <Button
              variant="destructive"
              onClick={handleCancelSOS}
              disabled={cancelReason.length < 10}
            >
              Konfirmasi Batalkan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

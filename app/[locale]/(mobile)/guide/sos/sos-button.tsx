'use client';

/**
 * SOS Button Component
 * Emergency panic button with GPS tracking
 */

import { AlertTriangle, Loader2, Phone, Shield, X } from 'lucide-react';
import { useRef, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    getCurrentPosition,
    SOSAlertType,
    startEmergencyTracking,
    triggerSOSAlert,
} from '@/lib/guide';
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

  const holdTimeoutRef = useRef<number | null>(null);

  const handleSOS = async (type: SOSAlertType) => {
    setSending(true);
    setError(null);

    try {
      const location = await getCurrentPosition();
      const result = await triggerSOSAlert(type, guideId, location, tripId);

      if (result.success) {
        setSent(true);
        // Start emergency tracking
        const stopTracking = startEmergencyTracking(guideId, (loc) => {
          console.log('Emergency location update:', loc);
        });
        setTracking(true);

        // Auto-stop after 30 minutes
        setTimeout(() => {
          stopTracking();
          setTracking(false);
        }, 30 * 60 * 1000);
      } else {
        setError(result.message);
      }
    } catch (err) {
      setError('Gagal mengirim SOS. Periksa koneksi internet.');
    }

    setSending(false);
  };

  const handleCancel = () => {
    setSent(false);
    setTracking(false);
    setShowPanel(false);
  };

  const startHold = () => {
    if (sending) return;
    setError(null);
    if (holdTimeoutRef.current !== null) {
      window.clearTimeout(holdTimeoutRef.current);
    }
    holdTimeoutRef.current = window.setTimeout(() => {
      setShowPanel(true);
    }, 3000);
  };

  const cancelHold = () => {
    if (holdTimeoutRef.current !== null) {
      window.clearTimeout(holdTimeoutRef.current);
      holdTimeoutRef.current = null;
    }
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
      <button
        className={cn(
          'mx-auto flex h-40 w-40 flex-col items-center justify-center rounded-full',
          'bg-red-600 text-white shadow-lg transition-all',
          'hover:bg-red-700 hover:shadow-xl active:scale-95',
          sending && 'animate-pulse'
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
      </button>

      <p className="text-center text-sm text-slate-500">
        Tahan tombol selama 3 detik dalam keadaan darurat
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
    </div>
  );
}

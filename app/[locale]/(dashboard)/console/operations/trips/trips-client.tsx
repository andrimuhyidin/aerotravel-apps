'use client';

import { MessageSquare, QrCode, UserPlus } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

type Trip = {
  id: string;
  trip_code: string;
  trip_date: string;
  status: string;
  total_pax: number;
  package?: { name: string | null } | null;
};

type TripsClientProps = {
  trips: Trip[];
  locale: string;
};

export function TripsClient({ trips, locale }: TripsClientProps) {
  const [sending, setSending] = useState<Record<string, boolean>>({});
  const [assigning, setAssigning] = useState<Record<string, boolean>>({});

  const handleAutoAssign = async (tripId: string) => {
    setAssigning((prev) => ({ ...prev, [tripId]: true }));

    try {
      const res = await fetch(`/api/admin/trips/${tripId}/auto-assign`, {
        method: 'POST',
      });

      if (!res.ok) {
        const error = (await res.json()) as { error?: string };
        throw new Error(error.error || 'Gagal auto-assign');
      }

      const data = (await res.json()) as {
        assignment?: { guide_name?: string; reason?: string };
      };
      alert(
        `Trip berhasil di-assign ke ${data.assignment?.guide_name || 'guide'}.\n${data.assignment?.reason || ''}`
      );
    } catch (error) {
      alert((error as Error).message || 'Gagal auto-assign. Periksa koneksi internet.');
    } finally {
      setAssigning((prev) => ({ ...prev, [tripId]: false }));
    }
  };

  const handleNotify = async (tripId: string, type: 'h_minus_one' | 'h_day' | 'post_trip') => {
    setSending((prev) => ({ ...prev, [tripId]: true }));

    try {
      const res = await fetch(`/api/admin/trips/${tripId}/notify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type }),
      });

      if (!res.ok) {
        throw new Error('Gagal mengirim notifikasi');
      }

      const data = (await res.json()) as { sent: number; failed: number };
      alert(
        `Notifikasi terkirim ke ${data.sent} peserta. ${data.failed > 0 ? `${data.failed} gagal.` : ''}`
      );
    } catch {
      alert('Gagal mengirim notifikasi. Periksa koneksi internet.');
    } finally {
      setSending((prev) => ({ ...prev, [tripId]: false }));
    }
  };

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://aerotravel.co.id';

  return (
    <div className="space-y-3">
      {trips.map((trip) => {
        const date = new Date(trip.trip_date).toLocaleDateString('id-ID', {
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        });
        const isSending = sending[trip.id];

        return (
          <Card key={trip.id} className="border-0 shadow-sm">
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-base">{trip.package?.name ?? trip.trip_code}</CardTitle>
                  <p className="mt-1 text-xs text-slate-500">{trip.trip_code} • {date}</p>
                  <p className="text-xs text-slate-500">{trip.total_pax} pax</p>
                </div>
                <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-medium text-slate-600">
                  {trip.status}
                </span>
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex flex-wrap gap-2">
                <Button
                  size="sm"
                  variant="default"
                  disabled={assigning[trip.id]}
                  onClick={() => handleAutoAssign(trip.id)}
                  className="bg-emerald-600 hover:bg-emerald-700"
                >
                  <UserPlus className="mr-1 h-3 w-3" />
                  {assigning[trip.id] ? 'Assigning...' : 'Auto Assign'}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={isSending}
                  onClick={() => handleNotify(trip.id, 'h_minus_one')}
                >
                  <MessageSquare className="mr-1 h-3 w-3" />
                  H-1 Reminder
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={isSending}
                  onClick={() => handleNotify(trip.id, 'h_day')}
                >
                  <MessageSquare className="mr-1 h-3 w-3" />
                  H Reminder
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={isSending}
                  onClick={() => handleNotify(trip.id, 'post_trip')}
                >
                  <MessageSquare className="mr-1 h-3 w-3" />
                  Post-Trip
                </Button>
                <Link href={`/${locale}/trip/${trip.id}`} target="_blank">
                  <Button size="sm" variant="outline">
                    <QrCode className="mr-1 h-3 w-3" />
                    QR Code
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

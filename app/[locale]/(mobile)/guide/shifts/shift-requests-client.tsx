'use client';

import { useQuery } from '@tanstack/react-query';
import { ArrowRight, Calendar, RefreshCw, Users } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

type ShiftRequestsClientProps = {
  locale: string;
};

type ShiftRequest = {
  id: string;
  trip_id: string;
  status: string;
  reason: string | null;
  admin_note: string | null;
  created_at: string;
  decided_at: string | null;
  trip?: {
    trip_code: string | null;
    trip_date: string | null;
  } | null;
  to_guide?: {
    full_name: string | null;
    email: string | null;
  } | null;
};

type ShiftRequestsResponse = {
  requests: ShiftRequest[];
};

export function ShiftRequestsClient({
  locale: _locale,
}: ShiftRequestsClientProps) {
  const { data, isLoading, refetch } = useQuery<ShiftRequestsResponse>({
    queryKey: ['guide', 'shift-requests'],
    queryFn: async () => {
      const res = await fetch('/api/guide/shifts/swap');
      if (!res.ok) {
        throw new Error('Gagal memuat permintaan shift');
      }
      return (await res.json()) as ShiftRequestsResponse;
    },
  });

  const requests = data?.requests ?? [];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold leading-tight text-slate-900">
            Permintaan Ganti Shift
          </h1>
          <p className="mt-1 text-xs text-slate-600">
            Lihat status permintaan ganti shift trip yang kamu ajukan.
          </p>
        </div>
        <Button
          size="icon"
          variant="outline"
          className="h-8 w-8"
          onClick={() => {
            void refetch();
          }}
        >
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>

      <Card className="border-0 bg-emerald-50 shadow-sm">
        <CardContent className="space-y-2 p-4 text-xs text-emerald-900">
          <p className="font-semibold">Cara kerja singkat</p>
          <ul className="list-disc space-y-1 pl-4">
            <li>
              Ajukan permintaan ganti shift melalui Admin / Ops terlebih dahulu
              sesuai SOP.
            </li>
            <li>
              Ops akan memilih guide pengganti dan menginput permintaan di
              sistem.
            </li>
            <li>Setelah disetujui, penugasan trip akan diperbarui otomatis.</li>
          </ul>
        </CardContent>
      </Card>

      {isLoading && (
        <Card className="border-0 shadow-sm">
          <CardContent className="py-8 text-center text-sm text-slate-500">
            Memuat permintaan shift...
          </CardContent>
        </Card>
      )}

      {!isLoading && requests.length === 0 && (
        <Card className="border-0 shadow-sm">
          <CardContent className="py-8 text-center text-sm text-slate-500">
            Belum ada permintaan ganti shift yang tercatat.
          </CardContent>
        </Card>
      )}

      {!isLoading && requests.length > 0 && (
        <div className="space-y-3">
          {requests.map((req) => {
            const date = req.trip?.trip_date
              ? new Date(req.trip.trip_date).toLocaleDateString('id-ID', {
                  day: '2-digit',
                  month: 'short',
                  year: 'numeric',
                })
              : '-';

            const status =
              req.status === 'approved'
                ? 'Disetujui'
                : req.status === 'rejected'
                  ? 'Ditolak'
                  : req.status === 'cancelled'
                    ? 'Dibatalkan'
                    : 'Menunggu';

            const statusColor =
              req.status === 'approved'
                ? 'bg-emerald-100 text-emerald-700'
                : req.status === 'rejected'
                  ? 'bg-red-100 text-red-700'
                  : req.status === 'cancelled'
                    ? 'bg-slate-100 text-slate-600'
                    : 'bg-amber-50 text-amber-700';

            return (
              <Card key={req.id} className="border-0 shadow-sm">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between gap-2">
                    <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                      <Users className="h-4 w-4 text-emerald-600" />
                      Trip {req.trip?.trip_code || '#'}
                    </CardTitle>
                    <span
                      className={`rounded-full px-2.5 py-1 text-[11px] font-medium ${statusColor}`}
                    >
                      {status}
                    </span>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2 text-xs text-slate-700">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-3.5 w-3.5 text-slate-500" />
                    <span>{date}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <ArrowRight className="h-3.5 w-3.5 text-slate-500" />
                    <span>
                      Dialihkan ke:{' '}
                      {req.to_guide?.full_name ||
                        req.to_guide?.email ||
                        'Guide lain'}
                    </span>
                  </div>
                  {req.reason && (
                    <p className="pt-1 text-[11px] text-slate-600">
                      Alasan: {req.reason}
                    </p>
                  )}
                  {req.admin_note && (
                    <p className="text-[11px] text-slate-600">
                      Catatan Ops: {req.admin_note}
                    </p>
                  )}
                  <div className="pt-1 text-[10px] text-slate-400">
                    Dibuat:{' '}
                    {new Date(req.created_at).toLocaleString('id-ID', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <div className="pt-2 text-center text-[11px] text-slate-500">
        Untuk mengajukan permintaan baru, ikuti SOP dan hubungi Admin/Ops
        terlebih dahulu.
      </div>
    </div>
  );
}

'use client';

/**
 * Status Client Component
 * Mengatur current status dan jadwal ketersediaan guide
 */

import { useQuery } from '@tanstack/react-query';
import {
    Calendar,
    CheckCircle,
    Clock,
    Info,
    Loader2,
    Pause,
    Play,
    Save,
    XCircle,
} from 'lucide-react';
import { useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import queryKeys from '@/lib/queries/query-keys';
import { cn } from '@/lib/utils';

import { SafetyChecklistDialog } from './safety-checklist-dialog';

type StatusClientProps = {
  locale: string;
  tripId?: string;
};

type CurrentStatus = 'standby' | 'on_trip' | 'not_available';

type StatusResponse = {
  status: {
    current_status?: CurrentStatus;
    note?: string | null;
    updated_at?: string | null;
  };
  upcoming: Array<{
    id: string;
    available_from: string;
    available_until: string;
    status: string;
    reason?: string | null;
  }>;
};

export function StatusClient({ locale: _locale, tripId }: StatusClientProps) {
  // Current status state
  const [currentStatus, setCurrentStatus] = useState<CurrentStatus>('standby');
  const [statusNote, setStatusNote] = useState('');
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [showSafetyChecklist, setShowSafetyChecklist] = useState(false);

  // Availability schedule form
  const [date, setDate] = useState('');
  const [fromTime, setFromTime] = useState('');
  const [untilTime, setUntilTime] = useState('');
  const [scheduleStatus, setScheduleStatus] = useState<'available' | 'not_available'>('available');
  const [reason, setReason] = useState('');
  const [savingSchedule, setSavingSchedule] = useState(false);

  // Messages
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [scheduleMessage, setScheduleMessage] = useState<string | null>(null);

  // Fetch current status and upcoming schedules
  const { data, isLoading, refetch } = useQuery<StatusResponse>({
    queryKey: queryKeys.guide.status(),
    queryFn: async () => {
      const res = await fetch('/api/guide/status');
      if (!res.ok) {
        throw new Error('Failed to load status');
      }
      return (await res.json()) as StatusResponse;
    },
  });

  // Initialize form with current status data (only once when data loads)
  const [initialized, setInitialized] = useState(false);
  useEffect(() => {
    if (data?.status && !initialized) {
      const status = (data.status.current_status || 'standby') as CurrentStatus;
      setCurrentStatus(status);
      setStatusNote(data.status.note || '');
      setInitialized(true);
    }
  }, [data?.status, initialized]);

  const handleUpdateStatus = async () => {
    setUpdatingStatus(true);
    setStatusMessage(null);

    try {
      const res = await fetch('/api/guide/status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: currentStatus,
          note: statusNote.trim() || undefined,
        }),
      });

      if (!res.ok) {
        const errorData = (await res.json().catch(() => ({}))) as { error?: string };
        setStatusMessage(errorData.error || 'Gagal memperbarui status.');
      } else {
        setStatusMessage('Status berhasil diperbarui.');
        void refetch();
      }
    } catch (error) {
      setStatusMessage('Gagal memperbarui status. Periksa koneksi internet.');
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleSaveSchedule = async () => {
    if (!date || !fromTime || !untilTime) {
      setScheduleMessage('Mohon isi semua field yang wajib.');
      return;
    }

    setSavingSchedule(true);
    setScheduleMessage(null);

    const availableFrom = `${date}T${fromTime}:00`;
    const availableUntil = `${date}T${untilTime}:00`;

    try {
      const res = await fetch('/api/guide/availability', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          availableFrom,
          availableUntil,
          status: scheduleStatus,
          reason: reason.trim() || undefined,
        }),
      });

      if (!res.ok) {
        const errorData = (await res.json().catch(() => ({}))) as { error?: string };
        setScheduleMessage(errorData.error || 'Gagal menyimpan jadwal.');
      } else {
        setScheduleMessage('Jadwal ketersediaan tersimpan.');
        // Reset form
        setDate('');
        setFromTime('');
        setUntilTime('');
        setReason('');
        void refetch();
      }
    } catch (error) {
      setScheduleMessage('Gagal menyimpan jadwal. Periksa koneksi internet.');
    } finally {
      setSavingSchedule(false);
    }
  };

  const statusOptions: Array<{
    value: CurrentStatus;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    bgColor: string;
    borderColor: string;
    iconBg: string;
    textColor: string;
  }> = [
    {
      value: 'standby',
      label: 'Standby',
      icon: Play,
      bgColor: 'bg-emerald-50',
      borderColor: 'border-emerald-500',
      iconBg: 'bg-emerald-500',
      textColor: 'text-emerald-700',
    },
    {
      value: 'on_trip',
      label: 'Sedang Trip',
      icon: Pause,
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-500',
      iconBg: 'bg-blue-500',
      textColor: 'text-blue-700',
    },
    {
      value: 'not_available',
      label: 'Tidak Tersedia',
      icon: XCircle,
      bgColor: 'bg-slate-50',
      borderColor: 'border-slate-500',
      iconBg: 'bg-slate-500',
      textColor: 'text-slate-700',
    },
  ];

  const formatDateTime = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleString('id-ID', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: date.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined,
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatRelativeTime = (isoString: string | null) => {
    if (!isoString) return null;
    const date = new Date(isoString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Baru saja';
    if (diffMins < 60) return `${diffMins} menit lalu`;
    if (diffHours < 24) return `${diffHours} jam lalu`;
    if (diffDays < 7) return `${diffDays} hari lalu`;

    return date.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  const currentStatusData = data?.status?.current_status || 'standby';
  const currentStatusOption = statusOptions.find((opt) => opt.value === currentStatusData);
  const upcomingSchedules = data?.upcoming || [];
  const lastUpdated = formatRelativeTime(data?.status?.updated_at || null);

  return (
    <div className="space-y-6 pb-6">
      {/* Current Status Display Card */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold text-slate-900">Status Saat Ini</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Current Status Badge */}
          {currentStatusOption && (
            <div
              className={cn(
                'flex items-center gap-3 rounded-lg border-2 p-4',
                currentStatusOption.bgColor,
                currentStatusOption.borderColor,
              )}
            >
              <div className={cn('flex h-12 w-12 items-center justify-center rounded-full', currentStatusOption.iconBg)}>
                <currentStatusOption.icon className="h-6 w-6 text-white" />
              </div>
              <div className="flex-1">
                <p className={cn('text-sm font-semibold', currentStatusOption.textColor)}>
                  {currentStatusOption.label}
                </p>
                {lastUpdated && (
                  <p className="mt-0.5 text-xs text-slate-500">Diperbarui {lastUpdated}</p>
                )}
                {data?.status?.note && (
                  <p className="mt-1 text-xs text-slate-600">{data.status.note}</p>
                )}
              </div>
            </div>
          )}

          {/* Status Selection */}
          <div className="space-y-2">
            <Label className="text-sm font-medium text-slate-700">Ubah Status</Label>
            <div className="grid grid-cols-3 gap-2">
              {statusOptions.map((option) => {
                const Icon = option.icon;
                const isActive = currentStatus === option.value;
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => {
                      // Show safety checklist if trying to set status to "on_trip"
                      if (option.value === 'on_trip' && currentStatusData !== 'on_trip') {
                        setShowSafetyChecklist(true);
                      } else {
                        setCurrentStatus(option.value);
                      }
                    }}
                    className={cn(
                      'flex min-h-[80px] flex-col items-center justify-center gap-2 rounded-xl border-2 p-3 transition-all active:scale-95',
                      isActive
                        ? `${option.borderColor} ${option.bgColor}`
                        : 'border-slate-200 bg-white hover:border-slate-300',
                    )}
                  >
                    <div
                      className={cn(
                        'flex h-10 w-10 items-center justify-center rounded-full',
                        isActive ? option.iconBg + ' text-white' : 'bg-slate-100 text-slate-600',
                      )}
                    >
                      <Icon className="h-5 w-5" />
                    </div>
                    <span
                      className={cn(
                        'text-xs font-medium',
                        isActive ? option.textColor : 'text-slate-600',
                      )}
                    >
                      {option.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Status Note */}
          <div className="space-y-2">
            <Label htmlFor="status-note" className="text-sm font-medium text-slate-700">
              Catatan (opsional)
            </Label>
            <Textarea
              id="status-note"
              placeholder="Tambahkan catatan tentang status Anda..."
              value={statusNote}
              onChange={(e) => setStatusNote(e.target.value)}
              rows={3}
              className="resize-none"
            />
            <p className="text-xs text-slate-500">
              Catatan ini akan membantu tim operasional memahami status Anda
            </p>
          </div>

          {/* Message */}
          {statusMessage && (
            <div
              className={cn(
                'rounded-lg p-3 text-sm',
                statusMessage.includes('berhasil')
                  ? 'bg-emerald-50 text-emerald-700'
                  : 'bg-red-50 text-red-700',
              )}
            >
              {statusMessage}
            </div>
          )}

          {/* Update Button */}
          <Button
            className="w-full bg-emerald-600 hover:bg-emerald-700"
            disabled={updatingStatus || currentStatus === currentStatusData}
            onClick={handleUpdateStatus}
          >
            {updatingStatus ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Memperbarui...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Perbarui Status
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Upcoming Schedules */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold text-slate-900">Jadwal Ketersediaan</CardTitle>
          {upcomingSchedules.length > 0 && (
            <p className="mt-1 text-xs text-slate-500">
              {upcomingSchedules.length} jadwal aktif
            </p>
          )}
        </CardHeader>
        <CardContent>
          {upcomingSchedules.length > 0 ? (
            <div className="space-y-3">
              {upcomingSchedules.map((schedule) => (
                <div
                  key={schedule.id}
                  className="flex items-start gap-3 rounded-lg border border-slate-200 bg-slate-50 p-4"
                >
                  <div
                    className={cn(
                      'flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl',
                      schedule.status === 'available' ? 'bg-emerald-500' : 'bg-slate-500',
                    )}
                  >
                    <Calendar className="h-5 w-5 text-white" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span
                        className={cn(
                          'text-xs font-semibold uppercase',
                          schedule.status === 'available' ? 'text-emerald-700' : 'text-slate-700',
                        )}
                      >
                        {schedule.status === 'available' ? 'Tersedia' : 'Tidak Tersedia'}
                      </span>
                    </div>
                    <p className="mt-1 text-sm font-medium text-slate-900">
                      {formatDateTime(schedule.available_from)}
                    </p>
                    <p className="text-xs text-slate-600">
                      sampai {formatDateTime(schedule.available_until)}
                    </p>
                    {schedule.reason && (
                      <div className="mt-2 flex items-start gap-1.5 rounded bg-white p-2">
                        <Info className="h-3.5 w-3.5 flex-shrink-0 text-slate-400" />
                        <p className="text-xs text-slate-600">{schedule.reason}</p>
                      </div>
                    )}
                  </div>
                  <CheckCircle className="h-5 w-5 flex-shrink-0 text-emerald-500" />
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-lg border-2 border-dashed border-slate-200 bg-slate-50 p-6 text-center">
              <Calendar className="mx-auto mb-2 h-8 w-8 text-slate-400" />
              <p className="text-sm font-medium text-slate-700">Belum ada jadwal</p>
              <p className="mt-1 text-xs text-slate-500">
                Tambahkan jadwal ketersediaan untuk membantu tim operasional merencanakan trip
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add New Schedule Card */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold text-slate-900">Tambah Jadwal Ketersediaan</CardTitle>
          <p className="mt-1 text-xs text-slate-500">
            Atur jadwal ketersediaan Anda di masa depan
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="schedule-date" className="text-sm font-medium text-slate-700">
              Tanggal <span className="text-red-500">*</span>
            </Label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                id="schedule-date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="pl-9"
                min={new Date().toISOString().split('T')[0]}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="from-time" className="text-sm font-medium text-slate-700">
                Dari Jam <span className="text-red-500">*</span>
              </Label>
              <div className="relative">
                <Clock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input
                  id="from-time"
                  type="time"
                  value={fromTime}
                  onChange={(e) => setFromTime(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="until-time" className="text-sm font-medium text-slate-700">
                Sampai Jam <span className="text-red-500">*</span>
              </Label>
              <div className="relative">
                <Clock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input
                  id="until-time"
                  type="time"
                  value={untilTime}
                  onChange={(e) => setUntilTime(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium text-slate-700">Status pada rentang waktu ini</Label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setScheduleStatus('available')}
                className={cn(
                  'flex-1 rounded-lg border-2 px-4 py-2.5 text-sm font-medium transition-all active:scale-95',
                  scheduleStatus === 'available'
                    ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                    : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300',
                )}
              >
                Tersedia
              </button>
              <button
                type="button"
                onClick={() => setScheduleStatus('not_available')}
                className={cn(
                  'flex-1 rounded-lg border-2 px-4 py-2.5 text-sm font-medium transition-all active:scale-95',
                  scheduleStatus === 'not_available'
                    ? 'border-slate-500 bg-slate-50 text-slate-700'
                    : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300',
                )}
              >
                Tidak Tersedia
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="schedule-reason" className="text-sm font-medium text-slate-700">
              Catatan (opsional)
            </Label>
            <Textarea
              id="schedule-reason"
              placeholder="Contoh: hanya bisa pagi, siang ada agenda keluarga"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={2}
              className="resize-none"
            />
            <p className="text-xs text-slate-500">
              Berikan informasi tambahan tentang jadwal ini
            </p>
          </div>

          {/* Message */}
          {scheduleMessage && (
            <div
              className={cn(
                'rounded-lg p-3 text-sm',
                scheduleMessage.includes('tersimpan')
                  ? 'bg-emerald-50 text-emerald-700'
                  : 'bg-red-50 text-red-700',
              )}
            >
              {scheduleMessage}
            </div>
          )}

          {/* Save Button */}
          <Button
            className="w-full bg-emerald-600 hover:bg-emerald-700"
            disabled={!date || !fromTime || !untilTime || savingSchedule}
            onClick={handleSaveSchedule}
          >
            {savingSchedule ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Menyimpan...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Simpan Jadwal
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Safety Checklist Dialog */}
      <SafetyChecklistDialog
        open={showSafetyChecklist}
        onOpenChange={setShowSafetyChecklist}
        onComplete={() => {
          setCurrentStatus('on_trip');
          setShowSafetyChecklist(false);
        }}
        tripId={tripId}
      />
    </div>
  );
}

'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Clock, Copy, Edit2, MapPin, Plus, Share2 } from 'lucide-react';
import { RouteOptimizerWidget } from './route-optimizer-widget';
import { useEffect, useState } from 'react';

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
import { EmptyState } from '@/components/ui/empty-state';
import { ErrorState } from '@/components/ui/error-state';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { LoadingState } from '@/components/ui/loading-state';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { logger } from '@/lib/utils/logger';
import { toast } from 'sonner';

type ItineraryActivity = {
  time?: string;
  label: string;
  location?: string;
};

type ItineraryDay = {
  dayNumber: number;
  title: string;
  activities: ItineraryActivity[];
};

type ActivityLog = {
  id: string;
  activity_type: string;
  activity_label: string;
  activity_description?: string;
  recorded_at: string;
  location_name?: string;
};

type TripItineraryTimelineProps = {
  tripId: string;
  locale?: string;
};

type ItineraryResponse = {
  days: ItineraryDay[];
};

function getActivityStatus(activity: ItineraryActivity, now: Date): 'past' | 'present' | 'future' {
  if (!activity.time) {
    return 'future';
  }

  const [hourStr, minuteStr] = activity.time.split(':');
  const activityDate = new Date(now);
  activityDate.setHours(Number(hourStr), Number(minuteStr), 0, 0);

  const diffMs = activityDate.getTime() - now.getTime();

  // Within +/- 60 minutes = present
  const oneHourMs = 60 * 60 * 1000;
  if (Math.abs(diffMs) <= oneHourMs) {
    return 'present';
  }

  return diffMs < 0 ? 'past' : 'future';
}

export function TripItineraryTimeline({ tripId, locale = 'id' }: TripItineraryTimelineProps) {
  const [data, setData] = useState<ItineraryDay[] | null>(null);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddActivity, setShowAddActivity] = useState(false);
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [newActivity, setNewActivity] = useState({
    dayNumber: 1,
    time: '',
    label: '',
    location: '',
    reason: '',
  });
  const [editingActivity, setEditingActivity] = useState<{
    dayNumber: number;
    activityIndex: number;
    activity: ItineraryActivity;
    reason?: string;
  } | null>(null);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [changeRequests, setChangeRequests] = useState<Array<{
    id: string;
    day_number: number;
    activity_index: number | null;
    change_type: string;
    requested_label: string;
    requested_time: string | null;
    requested_location: string | null;
    status: 'pending' | 'approved' | 'rejected' | 'applied';
    reason: string | null;
  }>>([]);
  const [activeDayTab, setActiveDayTab] = useState<string>('day-1');

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        const [itineraryRes, activitiesRes, changeRequestsRes] = await Promise.all([
          fetch(`/api/guide/trips/${tripId}/itinerary`),
          fetch(`/api/guide/trips/${tripId}/activities`),
          fetch(`/api/guide/trips/${tripId}/itinerary/change-request`),
        ]);

        if (!itineraryRes.ok) {
          const errorData = (await itineraryRes.json().catch(() => ({}))) as { error?: string };
          throw new Error(errorData.error || `Failed to load itinerary (${itineraryRes.status})`);
        }

        let itineraryJson: ItineraryResponse;
        try {
          itineraryJson = (await itineraryRes.json()) as ItineraryResponse;
        } catch (parseError) {
          logger.error('Failed to parse itinerary response', parseError, { tripId });
          throw new Error('Gagal memproses data itinerary');
        }

        let activitiesJson: { activities: ActivityLog[] } = { activities: [] };
        if (activitiesRes.ok) {
          try {
            activitiesJson = (await activitiesRes.json()) as { activities: ActivityLog[] };
          } catch (parseError) {
            logger.warn('Failed to parse activities response', { tripId, error: parseError });
            // Continue with empty activities if parsing fails
          }
        }

        let changeRequestsJson: { change_requests: unknown[] } = { change_requests: [] };
        if (changeRequestsRes.ok) {
          try {
            changeRequestsJson = (await changeRequestsRes.json()) as { change_requests: unknown[] };
          } catch {
            // Continue with empty change requests if parsing fails
          }
        }

        if (mounted) {
          const days = itineraryJson.days ?? [];
          setData(days);
          setActivityLogs(activitiesJson.activities ?? []);
          setChangeRequests(changeRequestsJson.change_requests as typeof changeRequests);
          // Set initial active tab for multi-day
          if (days.length > 0) {
            setActiveDayTab(`day-${days[0]?.dayNumber || 1}`);
          }
          setError(null);
        }
      } catch (err) {
        if (mounted) {
          const errorMessage = err instanceof Error ? err.message : 'Gagal memuat itinerary';
          logger.error('Failed to load itinerary timeline', err, { tripId });
          setError(errorMessage);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    void load();

    return () => {
      mounted = false;
    };
  }, [tripId]);

  const reload = async () => {
    try {
      setLoading(true);
      setError(null);
      const [itineraryRes, activitiesRes, changeRequestsRes] = await Promise.all([
        fetch(`/api/guide/trips/${tripId}/itinerary`),
        fetch(`/api/guide/trips/${tripId}/activities`),
        fetch(`/api/guide/trips/${tripId}/itinerary/change-request`),
      ]);

      if (!itineraryRes.ok) {
        const errorData = (await itineraryRes.json().catch(() => ({}))) as { error?: string };
        throw new Error(errorData.error || `Failed to load itinerary (${itineraryRes.status})`);
      }

      let itineraryJson: ItineraryResponse;
      try {
        itineraryJson = (await itineraryRes.json()) as ItineraryResponse;
      } catch (parseError) {
        logger.error('Failed to parse itinerary response on retry', parseError, { tripId });
        throw new Error('Gagal memproses data itinerary');
      }

      let activitiesJson: { activities: ActivityLog[] } = { activities: [] };
      if (activitiesRes.ok) {
        try {
          activitiesJson = (await activitiesRes.json()) as { activities: ActivityLog[] };
        } catch (parseError) {
          logger.warn('Failed to parse activities response on retry', { tripId, error: parseError });
          // Continue with empty activities if parsing fails
        }
      }

      let changeRequestsJson: { change_requests: unknown[] } = { change_requests: [] };
      if (changeRequestsRes.ok) {
        try {
          changeRequestsJson = (await changeRequestsRes.json()) as { change_requests: unknown[] };
        } catch {
          // Continue with empty change requests if parsing fails
        }
      }

      setData(itineraryJson.days ?? []);
      setActivityLogs(activitiesJson.activities ?? []);
      setChangeRequests(changeRequestsJson.change_requests as typeof changeRequests);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Gagal memuat itinerary';
      logger.error('Failed to reload itinerary timeline', err, { tripId });
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold text-slate-900">Itinerary Trip</CardTitle>
        </CardHeader>
        <CardContent>
          <LoadingState variant="skeleton" lines={3} />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold text-slate-900">Itinerary Trip</CardTitle>
        </CardHeader>
        <CardContent>
          <ErrorState
            message={error}
            onRetry={reload}
            variant="card"
            showIcon={false}
          />
        </CardContent>
      </Card>
    );
  }

  // Check if multi-day trip
  const hasMultiDay = data && data.length > 1;

  const now = new Date();

  return (
    <Card className="border-0 shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base font-semibold text-slate-900">
            <Clock className="h-5 w-5 text-emerald-600" />
            Timeline Trip
          </CardTitle>
          <div className="flex items-center gap-2">
            <RouteOptimizerWidget tripId={tripId} locale={locale} className="h-8 text-xs" />
            <Button
              size="sm"
              variant="outline"
              className="h-8 text-xs"
              onClick={() => setShowAddActivity(true)}
            >
              <Plus className="mr-1 h-3 w-3" />
              Catat
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="h-8 text-xs"
              onClick={handleShare}
            >
              <Share2 className="mr-1 h-3 w-3" />
              Share
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {hasMultiDay && data ? (
          <Tabs value={activeDayTab} onValueChange={setActiveDayTab} className="w-full">
            <TabsList 
              className="w-full h-auto p-1 gap-1 inline-grid" 
              style={{ gridTemplateColumns: `repeat(${data.length}, 1fr)` }}
            >
              {data.map((day) => (
                <TabsTrigger key={day.dayNumber} value={`day-${day.dayNumber}`} className="text-xs">
                  Day {day.dayNumber}
                </TabsTrigger>
              ))}
            </TabsList>
            {data.map((day) => (
              <TabsContent key={day.dayNumber} value={`day-${day.dayNumber}`} className="mt-4 space-y-2">
                <div className="mb-3">
                  <h3 className="text-sm font-semibold text-slate-900">{day.title}</h3>
                </div>
                <ItineraryDayContent 
                  day={day} 
                  now={now}
                  tripId={tripId}
                  onEditActivity={(dayNumber, activityIndex, activity) => {
                    setEditingActivity({ dayNumber, activityIndex, activity });
                    setShowEditDialog(true);
                  }}
                  changeRequests={changeRequests}
                />
              </TabsContent>
            ))}
          </Tabs>
        ) : data && data.length > 0 && data[0] ? (
          <ItineraryDayContent 
            day={data[0]} 
            now={now}
            tripId={tripId}
            onEditActivity={(dayNumber, activityIndex, activity) => {
              setEditingActivity({ dayNumber, activityIndex, activity });
              setShowEditDialog(true);
            }}
            changeRequests={changeRequests}
          />
        ) : (
          <EmptyState
            icon={Clock}
            title="Belum ada itinerary tersedia"
            description="Itinerary trip akan muncul setelah diatur oleh tim operasional"
            variant="subtle"
          />
        )}
        {/* Activity Logs (Recorded Activities) */}
        {activityLogs.length > 0 && (
          <div className="pt-4 border-t border-slate-200">
            <h3 className="text-sm font-semibold text-slate-700 mb-3">Aktivitas Tercatat</h3>
            <div className="space-y-2">
              {activityLogs.map((log) => {
                const recordedDate = new Date(log.recorded_at);
                const timeStr = recordedDate.toLocaleTimeString('id-ID', {
                  hour: '2-digit',
                  minute: '2-digit',
                });

                return (
                  <div
                    key={log.id}
                    className="flex items-start gap-3 rounded-lg border border-emerald-200 bg-emerald-50 p-3"
                  >
                    <div className="mt-0.5 h-3 w-3 flex-shrink-0 rounded-full bg-emerald-500" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono text-emerald-700">{timeStr}</span>
                        <span className="text-sm font-medium text-emerald-900">{log.activity_label}</span>
                      </div>
                      {log.activity_description && (
                        <p className="mt-1 text-xs text-emerald-700">{log.activity_description}</p>
                      )}
                      {log.location_name && (
                        <p className="mt-1 text-xs text-emerald-600 flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {log.location_name}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <p className="flex items-center gap-2 pt-1 text-[11px] text-slate-500">
          <span className="inline-flex h-2 w-2 rounded-full bg-emerald-500" />
          <span className="inline-flex h-2 w-2 rounded-full bg-blue-500" />
          <span className="inline-flex h-2 w-2 rounded-full bg-slate-300" />
          <span className="inline-flex items-center gap-1">
            <MapPin className="h-3 w-3" /> Jadwal bisa berubah mengikuti kondisi lapangan
          </span>
        </p>
      </CardContent>

      {/* Add Activity Dialog - Draft Itinerary */}
      <Dialog open={showAddActivity} onOpenChange={setShowAddActivity}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Tambah Draft Itinerary</DialogTitle>
            <DialogDescription>
              Tambahkan aktivitas baru ke itinerary. Perubahan akan dikirim untuk approval admin untuk tracking kesesuaian.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {data && data.length > 1 && (
              <div>
                <Label>Hari *</Label>
                <select
                  className="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  value={newActivity.dayNumber}
                  onChange={(e) =>
                    setNewActivity((prev) => ({ ...prev, dayNumber: parseInt(e.target.value) || 1 }))
                  }
                >
                  {data.map((day) => (
                    <option key={day.dayNumber} value={day.dayNumber}>
                      Day {day.dayNumber} - {day.title}
                    </option>
                  ))}
                </select>
              </div>
            )}
            <div>
              <Label>Waktu (Opsional)</Label>
              <Input
                className="mt-1"
                value={newActivity.time}
                onChange={(e) =>
                  setNewActivity((prev) => ({ ...prev, time: e.target.value }))
                }
                placeholder="08:00"
              />
            </div>
            <div>
              <Label>Nama Aktivitas *</Label>
              <Input
                className="mt-1"
                value={newActivity.label}
                onChange={(e) =>
                  setNewActivity((prev) => ({ ...prev, label: e.target.value }))
                }
                placeholder="Contoh: Boarding, Snorkeling, Makan Siang"
              />
            </div>
            <div>
              <Label>Lokasi (Opsional)</Label>
              <Input
                className="mt-1"
                value={newActivity.location}
                onChange={(e) =>
                  setNewActivity((prev) => ({ ...prev, location: e.target.value }))
                }
                placeholder="Lokasi aktivitas"
              />
            </div>
            <div>
              <Label>Alasan Penambahan *</Label>
              <Textarea
                className="mt-1"
                value={newActivity.reason}
                onChange={(e) =>
                  setNewActivity((prev) => ({ ...prev, reason: e.target.value }))
                }
                placeholder="Jelaskan alasan menambahkan aktivitas ini..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddActivity(false)}>
              Batal
            </Button>
            <Button
              onClick={handleAddDraftItinerary}
              disabled={!newActivity.label.trim() || !newActivity.reason.trim()}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              Ajukan Draft
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Activity Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ajukan Perubahan Itinerary</DialogTitle>
            <DialogDescription>
              Perubahan akan dikirim untuk approval admin. Input tetap dari admin, ini hanya untuk tracking kesesuaian.
            </DialogDescription>
          </DialogHeader>
          {editingActivity && (
            <div className="space-y-4">
              <div>
                <Label>Waktu</Label>
                <Input
                  className="mt-1"
                  value={editingActivity.activity.time || ''}
                  onChange={(e) =>
                    setEditingActivity((prev) =>
                      prev ? { ...prev, activity: { ...prev.activity, time: e.target.value } } : null
                    )
                  }
                  placeholder="08:00"
                />
              </div>
              <div>
                <Label>Nama Aktivitas *</Label>
                <Input
                  className="mt-1"
                  value={editingActivity.activity.label}
                  onChange={(e) =>
                    setEditingActivity((prev) =>
                      prev ? { ...prev, activity: { ...prev.activity, label: e.target.value } } : null
                    )
                  }
                  placeholder="Contoh: Boarding, Snorkeling, Makan Siang"
                />
              </div>
              <div>
                <Label>Lokasi (Opsional)</Label>
                <Input
                  className="mt-1"
                  value={editingActivity.activity.location || ''}
                  onChange={(e) =>
                    setEditingActivity((prev) =>
                      prev ? { ...prev, activity: { ...prev.activity, location: e.target.value } } : null
                    )
                  }
                  placeholder="Lokasi aktivitas"
                />
              </div>
              <div>
                <Label>Alasan Perubahan</Label>
                <Textarea
                  className="mt-1"
                  value={editingActivity.reason || ''}
                  placeholder="Jelaskan alasan perubahan ini..."
                  rows={3}
                  onChange={(e) =>
                    setEditingActivity((prev) =>
                      prev ? { ...prev, reason: e.target.value } : null
                    )
                  }
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>
              Batal
            </Button>
            <Button
              onClick={handleSubmitChangeRequest}
              disabled={!editingActivity?.activity.label.trim()}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              Ajukan Perubahan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Share Dialog */}
      <Dialog open={showShareDialog} onOpenChange={setShowShareDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Share Timeline</DialogTitle>
            <DialogDescription>
              Bagikan timeline trip ini ke tamu atau pihak terkait.
            </DialogDescription>
          </DialogHeader>
          {shareUrl && (
            <div className="space-y-2">
              <Label>Link Share</Label>
              <div className="flex items-center gap-2">
                <Input value={shareUrl} readOnly className="flex-1" />
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    void navigator.clipboard.writeText(shareUrl);
                  }}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-xs text-slate-500">
                Link ini dapat diakses oleh siapa saja yang memiliki link tersebut.
              </p>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowShareDialog(false)}>
              Tutup
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );

  async function handleAddDraftItinerary() {
    if (!newActivity.label.trim() || !newActivity.reason.trim()) return;

    try {
      const res = await fetch(`/api/guide/trips/${tripId}/itinerary/change-request`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          day_number: newActivity.dayNumber,
          activity_index: null, // null untuk add new
          change_type: 'add',
          original_time: null,
          original_label: null,
          original_location: null,
          requested_time: newActivity.time || null,
          requested_label: newActivity.label,
          requested_location: newActivity.location || null,
          reason: newActivity.reason,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ error: 'Failed to submit draft itinerary' }));
        throw new Error(errorData.error || 'Failed to submit draft itinerary');
      }

      // Reload change requests and itinerary
      const [changeRequestsRes] = await Promise.all([
        fetch(`/api/guide/trips/${tripId}/itinerary/change-request`),
      ]);
      
      if (changeRequestsRes.ok) {
        const json = (await changeRequestsRes.json()) as { change_requests: typeof changeRequests };
        setChangeRequests(json.change_requests || []);
      }

      setNewActivity({ dayNumber: 1, time: '', label: '', location: '', reason: '' });
      setShowAddActivity(false);
      
      toast.success('Draft itinerary berhasil dikirim. Menunggu approval admin.');
    } catch (err) {
      logger.error('Failed to submit draft itinerary', err, { tripId });
      const errorMessage = err instanceof Error ? err.message : 'Gagal mengirim draft itinerary';
      toast.error(errorMessage);
    }
  }

  async function handleShare() {
    try {
      const res = await fetch(`/api/guide/trips/${tripId}/timeline/share`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ expiresInHours: 24 * 7 }), // 7 days
      });

      if (!res.ok) {
        throw new Error('Failed to create share link');
      }

      const json = (await res.json()) as { shareUrl: string };
      setShareUrl(json.shareUrl);
      setShowShareDialog(true);
    } catch (err) {
      logger.error('Failed to create share link', err, { tripId });
    }
  }

  async function handleSubmitChangeRequest() {
    if (!editingActivity) return;

    try {
      const reason = editingActivity.reason || '';
      
      const res = await fetch(`/api/guide/trips/${tripId}/itinerary/change-request`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          day_number: editingActivity.dayNumber,
          activity_index: editingActivity.activityIndex,
          change_type: 'modify',
          original_time: editingActivity.activity.time || null,
          original_label: editingActivity.activity.label,
          original_location: editingActivity.activity.location || null,
          requested_time: editingActivity.activity.time || null,
          requested_label: editingActivity.activity.label,
          requested_location: editingActivity.activity.location || null,
          reason: reason || null,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ error: 'Failed to submit change request' }));
        throw new Error(errorData.error || 'Failed to submit change request');
      }

      // Reload change requests
      const changeRequestsRes = await fetch(`/api/guide/trips/${tripId}/itinerary/change-request`);
      if (changeRequestsRes.ok) {
        const json = (await changeRequestsRes.json()) as { change_requests: typeof changeRequests };
        setChangeRequests(json.change_requests || []);
      }

      setEditingActivity(null);
      setShowEditDialog(false);
      
      toast.success('Request perubahan berhasil dikirim. Menunggu approval admin.');
    } catch (err) {
      logger.error('Failed to submit change request', err, { tripId });
      const errorMessage = err instanceof Error ? err.message : 'Gagal mengirim request perubahan';
      toast.error(errorMessage);
    }
  }
}

/**
 * Itinerary Day Content Component
 * Displays activities for a single day
 */
function ItineraryDayContent({ 
  day, 
  now, 
  tripId,
  onEditActivity,
  changeRequests,
}: { 
  day: ItineraryDay; 
  now: Date;
  tripId: string;
  onEditActivity: (dayNumber: number, activityIndex: number, activity: ItineraryActivity) => void;
  changeRequests: Array<{
    day_number: number;
    activity_index: number | null;
    status: 'pending' | 'approved' | 'rejected' | 'applied';
  }>;
}) {
  const getChangeRequestStatus = (dayNumber: number, activityIndex: number) => {
    return changeRequests.find(
      (cr) => cr.day_number === dayNumber && cr.activity_index === activityIndex
    )?.status;
  };
  return (
    <div className="relative pl-4">
      {/* Vertical line */}
      <div className="absolute left-[7px] top-0 h-full w-px bg-slate-200" />
      <div className="space-y-3">
        {day.activities.length > 0 ? (
          day.activities.map((activity, index) => {
            const status = getActivityStatus(activity, now);
            const isLast = index === day.activities.length - 1;

            return (
              <div
                key={`${activity.time ?? 'no-time'}-${activity.label}-${index.toString()}`}
                className={cn('relative flex items-start gap-3', isLast && 'pb-1')}
              >
                {/* Dot */}
                <div
                  className={cn(
                    'mt-1 h-3 w-3 flex-shrink-0 rounded-full border-2 border-white shadow-sm z-10',
                    status === 'past' && 'bg-emerald-500',
                    status === 'present' && 'bg-blue-500 animate-pulse',
                    status === 'future' && 'bg-slate-300',
                  )}
                />
                {/* Content */}
                <div className="flex-1 min-w-0 pb-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start gap-2">
                        {activity.time && (
                          <span
                            className={cn(
                              'text-xs font-mono font-semibold whitespace-nowrap flex-shrink-0',
                              status === 'past' && 'text-slate-400',
                              status === 'present' && 'text-blue-600',
                              status === 'future' && 'text-slate-500',
                            )}
                          >
                            {activity.time}
                          </span>
                        )}
                        <div className="flex-1 min-w-0">
                          <span
                            className={cn(
                              'text-sm block',
                              status === 'past' && 'text-slate-500 line-through',
                              status === 'present' && 'font-semibold text-slate-900',
                              status === 'future' && 'text-slate-800',
                            )}
                          >
                            {activity.label}
                          </span>
                          {activity.location && (
                            <div className="flex items-center gap-1 mt-0.5">
                              <MapPin className="h-3 w-3 text-slate-400 flex-shrink-0" />
                              <span className="text-xs text-slate-500 truncate">{activity.location}</span>
                            </div>
                          )}
                          {/* Change Request Status Badge */}
                          {(() => {
                            const changeStatus = getChangeRequestStatus(day.dayNumber, index);
                            if (changeStatus === 'pending') {
                              return (
                                <span className="mt-1 inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-yellow-100 text-yellow-800">
                                  Perubahan pending
                                </span>
                              );
                            } else if (changeStatus === 'approved') {
                              return (
                                <span className="mt-1 inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-green-100 text-green-800">
                                  Perubahan disetujui
                                </span>
                              );
                            } else if (changeStatus === 'rejected') {
                              return (
                                <span className="mt-1 inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-red-100 text-red-800">
                                  Perubahan ditolak
                                </span>
                              );
                            }
                            return null;
                          })()}
                        </div>
                      </div>
                    </div>
                    {/* Edit Button */}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0 flex-shrink-0 mt-0.5"
                      onClick={() => onEditActivity(day.dayNumber, index, activity)}
                    >
                      <Edit2 className="h-3.5 w-3.5 text-slate-400" />
                    </Button>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="text-sm text-slate-500 py-4">
            Belum ada aktivitas yang dijadwalkan untuk hari ini
          </div>
        )}
      </div>
    </div>
  );
}


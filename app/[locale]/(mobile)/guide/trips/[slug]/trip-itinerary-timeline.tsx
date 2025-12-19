'use client';

import { Clock, Copy, MapPin, Plus, Share2 } from 'lucide-react';
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

type ItineraryActivity = {
  time?: string;
  label: string;
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
    activityLabel: '',
    activityDescription: '',
  });

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        const [itineraryRes, activitiesRes] = await Promise.all([
          fetch(`/api/guide/trips/${tripId}/itinerary`),
          fetch(`/api/guide/trips/${tripId}/activities`),
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

        if (mounted) {
          setData(itineraryJson.days ?? []);
          setActivityLogs(activitiesJson.activities ?? []);
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
      const [itineraryRes, activitiesRes] = await Promise.all([
        fetch(`/api/guide/trips/${tripId}/itinerary`),
        fetch(`/api/guide/trips/${tripId}/activities`),
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

      setData(itineraryJson.days ?? []);
      setActivityLogs(activitiesJson.activities ?? []);
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

  if (!data || data.length === 0) {
    return (
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold text-slate-900">Itinerary Trip</CardTitle>
        </CardHeader>
        <CardContent>
          <EmptyState
            icon={Clock}
            title="Belum ada itinerary tersedia"
            description="Itinerary trip akan muncul setelah diatur oleh tim operasional"
            variant="subtle"
          />
        </CardContent>
      </Card>
    );
  }

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
        {data.map((day) => (
          <div key={day.dayNumber} className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                Day {day.dayNumber}
              </span>
              <span className="text-xs font-medium text-slate-600 truncate">{day.title}</span>
            </div>
            <div className="relative pl-4">
              {/* Vertical line */}
              <div className="absolute left-[7px] top-0 h-full w-px bg-slate-200" />
              <div className="space-y-2">
                {day.activities.map((activity, index) => {
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
                          'mt-0.5 h-3 w-3 flex-shrink-0 rounded-full border-2 border-white shadow-sm',
                          status === 'past' && 'bg-emerald-500',
                          status === 'present' && 'bg-blue-500',
                          status === 'future' && 'bg-slate-300',
                        )}
                      />
                      {/* Content */}
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          {activity.time && (
                            <span
                              className={cn(
                                'text-xs font-mono',
                                status === 'past' && 'text-slate-400',
                                status === 'present' && 'text-blue-600',
                                status === 'future' && 'text-slate-500',
                              )}
                            >
                              {activity.time}
                            </span>
                          )}
                          <span
                            className={cn(
                              'text-sm',
                              status === 'past' && 'text-slate-500 line-through',
                              status === 'present' && 'font-semibold text-slate-900',
                              status === 'future' && 'text-slate-800',
                            )}
                          >
                            {activity.label}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        ))}
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

      {/* Add Activity Dialog */}
      <Dialog open={showAddActivity} onOpenChange={setShowAddActivity}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Catat Aktivitas</DialogTitle>
            <DialogDescription>
              Catat aktivitas yang sedang dilakukan. Timestamp akan otomatis direkam.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Nama Aktivitas *</Label>
              <Input
                className="mt-1"
                value={newActivity.activityLabel}
                onChange={(e) =>
                  setNewActivity((prev) => ({ ...prev, activityLabel: e.target.value }))
                }
                placeholder="Contoh: Boarding, Snorkeling, Makan Siang"
              />
            </div>
            <div>
              <Label>Keterangan (Opsional)</Label>
              <Textarea
                className="mt-1"
                value={newActivity.activityDescription}
                onChange={(e) =>
                  setNewActivity((prev) => ({ ...prev, activityDescription: e.target.value }))
                }
                placeholder="Detail aktivitas..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddActivity(false)}>
              Batal
            </Button>
            <Button
              onClick={handleAddActivity}
              disabled={!newActivity.activityLabel.trim()}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              Catat
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

  async function handleAddActivity() {
    if (!newActivity.activityLabel.trim()) return;

    try {
      const res = await fetch(`/api/guide/trips/${tripId}/activities`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          activityType: 'manual',
          activityLabel: newActivity.activityLabel,
          activityDescription: newActivity.activityDescription || undefined,
        }),
      });

      if (!res.ok) {
        throw new Error('Failed to record activity');
      }

      // Reload activities
      const activitiesRes = await fetch(`/api/guide/trips/${tripId}/activities`);
      if (activitiesRes.ok) {
        const json = (await activitiesRes.json()) as { activities: ActivityLog[] };
        setActivityLogs(json.activities ?? []);
      }

      setNewActivity({ activityLabel: '', activityDescription: '' });
      setShowAddActivity(false);
    } catch (err) {
      logger.error('Failed to record activity', err, { tripId });
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
}


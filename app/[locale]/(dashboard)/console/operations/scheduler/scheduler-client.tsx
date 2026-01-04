/**
 * Resource Scheduler Client Component
 * Calendar view with drag-and-drop resource assignment
 */

'use client';

import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  AlertTriangle,
  Anchor,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Home,
  RefreshCw,
  User,
  Users,
} from 'lucide-react';
import { toast } from 'sonner';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import queryKeys from '@/lib/queries/query-keys';

type ScheduleEvent = {
  id: string;
  title: string;
  subtitle: string;
  date: string;
  status: string;
  type: string;
  guides: Array<{ id: string; name: string }>;
  hasConflict: boolean;
};

type Resource = {
  id: string;
  name: string;
  email?: string;
  type?: string;
  capacity?: number;
};

type SchedulerResponse = {
  events: ScheduleEvent[];
  resources: {
    guides: Resource[];
    assets: Resource[];
  };
  dateRange: {
    start: string;
    end: string;
  };
  conflicts: number;
};

async function fetchSchedule(startDate: string, endDate: string): Promise<SchedulerResponse> {
  const params = new URLSearchParams({ startDate, endDate });
  const response = await fetch(`/api/admin/scheduler?${params}`);
  if (!response.ok) throw new Error('Failed to fetch schedule');
  return response.json();
}

function getWeekDates(baseDate: Date): string[] {
  const dates: string[] = [];
  const start = new Date(baseDate);
  start.setDate(start.getDate() - start.getDay()); // Start from Sunday
  
  for (let i = 0; i < 7; i++) {
    const date = new Date(start);
    date.setDate(date.getDate() + i);
    dates.push(date.toISOString().split('T')[0] as string);
  }
  
  return dates;
}

export function SchedulerClient() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<'week' | 'day'>('week');
  
  const weekDates = getWeekDates(currentDate);
  const startDate = weekDates[0];
  const endDate = weekDates[6];

  const {
    data,
    isLoading,
    error,
    refetch,
    isRefetching,
  } = useQuery({
    queryKey: [...queryKeys.admin.all, 'scheduler', startDate, endDate],
    queryFn: () => fetchSchedule(startDate ?? '', endDate ?? ''),
  });

  useEffect(() => {
    if (error) {
      toast.error('Gagal memuat data schedule');
    }
  }, [error]);

  const navigateWeek = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() + (direction === 'next' ? 7 : -7));
    setCurrentDate(newDate);
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  if (isLoading) {
    return <SchedulerSkeleton />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Resource Scheduler</h1>
          <p className="text-muted-foreground">
            Kelola jadwal trip, guide, dan asset
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isRefetching}
          >
            <RefreshCw className={cn('mr-2 h-4 w-4', isRefetching && 'animate-spin')} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Conflict Alert */}
      {data && data.conflicts > 0 && (
        <Card className="border-red-500 bg-red-50 dark:bg-red-900/10">
          <CardContent className="flex items-center gap-3 p-4">
            <AlertTriangle className="h-5 w-5 text-red-600" />
            <div>
              <p className="font-medium text-red-600">
                {data.conflicts} Konflik Terdeteksi
              </p>
              <p className="text-sm text-muted-foreground">
                Ada guide yang dijadwalkan di beberapa trip pada hari yang sama
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Calendar Navigation */}
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1">
                <Button variant="outline" size="icon" onClick={() => navigateWeek('prev')}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="icon" onClick={() => navigateWeek('next')}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
              <Button variant="outline" size="sm" onClick={goToToday}>
                Hari Ini
              </Button>
              <h2 className="text-lg font-semibold">
                {new Date(startDate ?? '').toLocaleDateString('id-ID', { 
                  month: 'long', 
                  year: 'numeric' 
                })}
              </h2>
            </div>
            <Select value={view} onValueChange={(v) => setView(v as 'week' | 'day')}>
              <SelectTrigger className="w-[120px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="week">Week</SelectItem>
                <SelectItem value="day">Day</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {/* Week View */}
          <div className="grid grid-cols-7 gap-2">
            {/* Day Headers */}
            {weekDates.map((date) => {
              const d = new Date(date);
              const isToday = date === new Date().toISOString().split('T')[0];
              const dayName = d.toLocaleDateString('id-ID', { weekday: 'short' });
              const dayNum = d.getDate();

              return (
                <div
                  key={date}
                  className={cn(
                    'text-center p-2 rounded-t-lg',
                    isToday && 'bg-primary text-primary-foreground'
                  )}
                >
                  <p className="text-xs font-medium uppercase">{dayName}</p>
                  <p className="text-lg font-bold">{dayNum}</p>
                </div>
              );
            })}

            {/* Day Cells */}
            {weekDates.map((date) => {
              const dayEvents = data?.events.filter((e) => e.date === date) || [];
              const isToday = date === new Date().toISOString().split('T')[0];

              return (
                <div
                  key={`cell-${date}`}
                  className={cn(
                    'min-h-[150px] border rounded-b-lg p-2',
                    isToday && 'border-primary'
                  )}
                >
                  <div className="space-y-2">
                    {dayEvents.map((event) => (
                      <EventCard key={event.id} event={event} />
                    ))}
                    {dayEvents.length === 0 && (
                      <p className="text-xs text-muted-foreground text-center py-4">
                        Tidak ada trip
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Resources Panel */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Available Guides */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Users className="h-5 w-5" />
              Available Guides
            </CardTitle>
            <CardDescription>
              {data?.resources.guides.length || 0} guide aktif
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {data?.resources.guides.map((guide) => (
                <div
                  key={guide.id}
                  className="flex items-center justify-between rounded-lg border p-3 cursor-grab hover:bg-muted/50"
                  draggable
                >
                  <div className="flex items-center gap-3">
                    <div className="rounded-full bg-primary/10 p-2">
                      <User className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">{guide.name}</p>
                      <p className="text-xs text-muted-foreground">{guide.email}</p>
                    </div>
                  </div>
                  <Badge variant="outline">Available</Badge>
                </div>
              ))}
              {(!data?.resources.guides || data.resources.guides.length === 0) && (
                <p className="text-center text-sm text-muted-foreground py-4">
                  Tidak ada guide tersedia
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Available Assets */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Anchor className="h-5 w-5" />
              Available Assets
            </CardTitle>
            <CardDescription>
              {data?.resources.assets.length || 0} asset tersedia
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {data?.resources.assets.map((asset) => {
                const Icon = asset.type === 'boat' ? Anchor : asset.type === 'villa' ? Home : Calendar;
                
                return (
                  <div
                    key={asset.id}
                    className="flex items-center justify-between rounded-lg border p-3 cursor-grab hover:bg-muted/50"
                    draggable
                  >
                    <div className="flex items-center gap-3">
                      <div className="rounded-full bg-primary/10 p-2">
                        <Icon className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">{asset.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {asset.type} • {asset.capacity} pax
                        </p>
                      </div>
                    </div>
                    <Badge variant="outline">Available</Badge>
                  </div>
                );
              })}
              {(!data?.resources.assets || data.resources.assets.length === 0) && (
                <p className="text-center text-sm text-muted-foreground py-4">
                  Tidak ada asset tersedia
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// Sub-components

function EventCard({ event }: { event: ScheduleEvent }) {
  const statusColors = {
    confirmed: 'bg-green-100 border-green-500 text-green-800',
    pending: 'bg-yellow-100 border-yellow-500 text-yellow-800',
    in_progress: 'bg-blue-100 border-blue-500 text-blue-800',
  };

  return (
    <div
      className={cn(
        'rounded-lg border-l-4 p-2 text-xs cursor-pointer hover:opacity-80',
        event.hasConflict
          ? 'bg-red-100 border-red-500 text-red-800'
          : statusColors[event.status as keyof typeof statusColors] || 'bg-gray-100'
      )}
    >
      <div className="flex items-start justify-between">
        <p className="font-semibold truncate">{event.title}</p>
        {event.hasConflict && (
          <AlertTriangle className="h-3 w-3 text-red-600 flex-shrink-0" />
        )}
      </div>
      <p className="text-muted-foreground truncate">{event.subtitle}</p>
      {event.guides.length > 0 && (
        <div className="flex items-center gap-1 mt-1">
          <User className="h-3 w-3" />
          <span className="truncate">{event.guides.map((g) => g.name).join(', ')}</span>
        </div>
      )}
    </div>
  );
}

function SchedulerSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-9 w-24" />
      </div>
      <Card>
        <CardHeader>
          <div className="flex justify-between">
            <Skeleton className="h-10 w-64" />
            <Skeleton className="h-10 w-24" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-7 gap-2">
            {[...Array(7)].map((_, i) => (
              <Skeleton key={i} className="h-8 w-full" />
            ))}
            {[...Array(7)].map((_, i) => (
              <Skeleton key={`cell-${i}`} className="h-[150px] w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardContent className="p-6">
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}


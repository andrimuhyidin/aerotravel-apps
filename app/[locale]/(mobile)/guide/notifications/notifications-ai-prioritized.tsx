'use client';

/**
 * AI-Prioritized Notifications Component
 * Smart notification prioritization dengan AI
 */

import { useQuery } from '@tanstack/react-query';
import { AlertCircle, Bell, Sparkles } from 'lucide-react';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { LoadingState } from '@/components/ui/loading-state';
import queryKeys from '@/lib/queries/query-keys';

type NotificationsAiPrioritizedProps = {
  locale: string;
};

export function NotificationsAiPrioritized({ locale: _locale }: NotificationsAiPrioritizedProps) {
  const [grouped, setGrouped] = useState(true);

  const { data, isLoading } = useQuery({
    queryKey: [...queryKeys.guide.notifications(), 'prioritized'],
    queryFn: async () => {
      const res = await fetch('/api/guide/notifications/prioritize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ group: grouped }),
      });
      if (!res.ok) throw new Error('Failed to prioritize notifications');
      type PrioritizedNotification = {
        id: string;
        type: string;
        title: string;
        message: string;
        priority: 'urgent' | 'high' | 'medium' | 'low';
        priorityScore: number;
        actionRequired: boolean;
        suggestedAction?: string;
      };

      return (await res.json()) as {
        prioritized: PrioritizedNotification[];
        grouped?: Record<string, PrioritizedNotification[]>;
      };
    },
  });

  if (isLoading) {
    return (
      <Card className="border-0 shadow-sm">
        <CardContent>
          <LoadingState variant="spinner" message="Memprioritaskan notifikasi..." />
        </CardContent>
      </Card>
    );
  }

  if (!data || data.prioritized.length === 0) {
    return null;
  }

  // Sort by priority
  const sorted = [...data.prioritized].sort((a, b) => {
    const priorityOrder = { urgent: 4, high: 3, medium: 2, low: 1 };
    if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    }
    return b.priorityScore - a.priorityScore;
  });

  const urgent = sorted.filter((n) => n.priority === 'urgent');
  const high = sorted.filter((n) => n.priority === 'high');
  const others = sorted.filter((n) => n.priority === 'medium' || n.priority === 'low');

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-emerald-600" />
          <p className="text-xs font-semibold text-slate-700">AI-Prioritized Notifications</p>
        </div>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => setGrouped(!grouped)}
          className="h-7 text-xs"
        >
          {grouped ? 'Ungroup' : 'Group'}
        </Button>
      </div>

      {/* Urgent Notifications */}
      {urgent.length > 0 && (
        <div>
          <p className="mb-2 text-xs font-semibold text-red-700">⚠️ Urgent</p>
          <div className="space-y-2">
            {urgent.map((notif) => (
              <Card
                key={notif.id}
                className="border-red-200 bg-red-50 shadow-sm"
              >
                <CardContent className="p-3">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="h-4 w-4 text-red-600 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-red-900">{notif.title}</p>
                      <p className="mt-1 text-xs text-red-800">{notif.message}</p>
                      {notif.suggestedAction && (
                        <p className="mt-2 text-xs font-medium text-red-700">
                          💡 {notif.suggestedAction}
                        </p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* High Priority */}
      {high.length > 0 && (
        <div>
          <p className="mb-2 text-xs font-semibold text-amber-700">High Priority</p>
          <div className="space-y-2">
            {high.map((notif) => (
              <Card
                key={notif.id}
                className="border-amber-200 bg-amber-50 shadow-sm"
              >
                <CardContent className="p-3">
                  <div className="flex items-start gap-2">
                    <Bell className="h-4 w-4 text-amber-600 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-amber-900">{notif.title}</p>
                      <p className="mt-1 text-xs text-amber-800">{notif.message}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Others */}
      {others.length > 0 && (
        <div>
          <p className="mb-2 text-xs font-semibold text-slate-700">Other Notifications</p>
          <div className="space-y-1.5">
            {others.map((notif) => (
              <Card
                key={notif.id}
                className="border-slate-200 bg-white shadow-sm"
              >
                <CardContent className="p-2.5">
                  <p className="text-xs font-semibold text-slate-900">{notif.title}</p>
                  <p className="mt-0.5 text-[11px] text-slate-600 line-clamp-2">
                    {notif.message}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

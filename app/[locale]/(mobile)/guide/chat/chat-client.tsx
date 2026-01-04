'use client';

/**
 * Chat Client Component
 * Lists all trips with active chat conversations
 */

import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { MessageSquare } from 'lucide-react';
import Link from 'next/link';

import { Card, CardContent } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { ErrorState } from '@/components/ui/error-state';
import { LoadingState } from '@/components/ui/loading-state';
import queryKeys from '@/lib/queries/query-keys';
import { logger } from '@/lib/utils/logger';

type ChatClientProps = {
  locale: string;
};

type TripChatItem = {
  id: string;
  tripCode: string;
  tripName: string;
  date: string;
  unreadCount?: number;
  lastMessage?: string;
  lastMessageTime?: string;
};

export function ChatClient({ locale }: ChatClientProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const queryResult = useQuery<TripChatItem[]>({
    queryKey: queryKeys.guide.trips.all(),
    queryFn: async () => {
      try {
        const res = await fetch('/api/guide/trips');
        if (!res.ok) {
          const errorText = await res.text().catch(() => 'Unknown error');
          throw new Error(`Failed to fetch trips: ${res.status} ${errorText}`);
        }
        
        let data: { trips?: Array<{
          id: string;
          code?: string;
          name?: string;
          date?: string;
        }> };
        
        try {
          data = (await res.json()) as { trips?: Array<{
            id: string;
            code?: string;
            name?: string;
            date?: string;
          }> };
        } catch (parseError) {
          logger.error('Failed to parse trips response', parseError);
          throw new Error('Invalid response format from trips API');
        }
        
        // Transform to chat items and fetch unread counts
        const trips = Array.isArray(data.trips) 
          ? data.trips.filter((trip) => trip && trip.id && typeof trip.id === 'string')
          : [];
        
        const validTrips = trips.slice(0, 20);
        
        if (validTrips.length === 0) {
          return [];
        }

        // Fetch chat message counts for each trip
        // Use Promise.allSettled to handle partial failures gracefully
        const tripsWithChatResults = await Promise.allSettled(
          validTrips.map(async (trip) => {
            try {
            // Fetch last message for this trip
            // Note: API returns messages in reverse order (oldest first), so we need to get the last item
            const chatRes = await fetch(
              `/api/guide/trips/${trip.id}/chat?limit=50`
            );
            
            if (!chatRes.ok) {
              // If API returns error (404, 403, 500, etc), return trip without chat info
              // This is fine - trip might not have messages yet
              return {
                id: trip.id,
                tripCode: trip.code ?? '',
                tripName: trip.name ?? '',
                date: trip.date ?? '',
                unreadCount: undefined,
              };
            }
            
            let chatData: {
              messages?: Array<{ messageText: string; createdAt: string }>;
              totalCount?: number;
            } = {
              messages: [],
              totalCount: 0,
            };
            
            try {
              const responseText = await chatRes.text();
              if (responseText) {
                chatData = JSON.parse(responseText) as {
                  messages?: Array<{ messageText: string; createdAt: string }>;
                  totalCount?: number;
                };
              }
            } catch (parseError) {
              logger.error('Failed to parse chat response', parseError, {
                tripId: trip.id,
                status: chatRes.status,
              });
              // Return trip without chat info on parse error
              return {
                id: trip.id,
                tripCode: trip.code ?? '',
                tripName: trip.name ?? '',
                date: trip.date ?? '',
                unreadCount: undefined,
              };
            }
            
            // Validate chatData structure
            if (!chatData || typeof chatData !== 'object') {
              return {
                id: trip.id,
                tripCode: trip.code ?? '',
                tripName: trip.name ?? '',
                date: trip.date ?? '',
                unreadCount: undefined,
              };
            }
            
            // Messages are returned in reverse order (oldest first for display)
            // Get the last message (most recent) - which is the last item in the array
            const messages = Array.isArray(chatData.messages) ? chatData.messages : [];
            // API returns messages in reverse order (oldest first), so last item is most recent
            const lastMessage = messages.length > 0 ? messages[messages.length - 1] : null;
            const totalCount = typeof chatData.totalCount === 'number' ? chatData.totalCount : 0;
            
            // Safely parse last message time
            let lastMessageTime: string | undefined = undefined;
            if (lastMessage?.createdAt) {
              try {
                const msgDate = new Date(lastMessage.createdAt);
                if (!isNaN(msgDate.getTime())) {
                  lastMessageTime = msgDate.toLocaleTimeString('id-ID', {
                    hour: '2-digit',
                    minute: '2-digit',
                  });
                }
              } catch (dateError) {
                // Ignore date parsing errors
                logger.error('Failed to parse message date', dateError, {
                  tripId: trip.id,
                  createdAt: lastMessage.createdAt,
                });
              }
            }

            return {
              id: trip.id,
              tripCode: trip.code ?? '',
              tripName: trip.name ?? '',
              date: trip.date ?? '',
              unreadCount: totalCount > 0 ? totalCount : undefined,
              lastMessage: lastMessage?.messageText,
              lastMessageTime,
            };
            } catch (error) {
              // If chat fetch fails, still show trip but without chat info
              logger.error('Failed to fetch chat info for trip', error, {
                tripId: trip.id,
              });
              return {
                id: trip.id,
                tripCode: trip.code ?? '',
                tripName: trip.name ?? '',
                date: trip.date ?? '',
                unreadCount: undefined,
              };
            }
          })
        );
        
        // Extract successful results, fallback to default for rejected promises
        const tripsWithChat = tripsWithChatResults.map((result, index) => {
            if (result.status === 'fulfilled') {
              return result.value;
            } else {
              // If promise was rejected, return default trip info
              const trip = validTrips[index];
              logger.error('Promise rejected for trip chat', result.reason, {
                tripId: trip?.id,
              });
              return {
                id: trip?.id ?? '',
                tripCode: trip?.code ?? '',
                tripName: trip?.name ?? '',
                date: trip?.date ?? '',
                unreadCount: undefined,
              };
            }
          });

        // Return all trips (even those without messages) so users can start new conversations
        // Filter out trips that completely failed to fetch or have invalid IDs
        return tripsWithChat.filter((trip) => trip && trip.id && typeof trip.id === 'string');
      } catch (error) {
        logger.error('Error in chat queryFn', error);
        // Return empty array on critical error
        return [];
      }
    },
    enabled: mounted,
    retry: 2,
    retryDelay: 1000,
  });

  const { data: trips, isLoading, error, refetch } = queryResult;

  if (!mounted) {
    return <LoadingState variant="skeleton-card" lines={3} message="Memuat chat..." />;
  }

  if (isLoading) {
    return <LoadingState variant="skeleton-card" lines={3} message="Memuat chat..." />;
  }

  if (error) {
    return (
      <ErrorState
        message={error instanceof Error ? error.message : 'Gagal memuat chat'}
        onRetry={() => void refetch()}
        variant="card"
      />
    );
  }

  if (!trips || trips.length === 0) {
    return (
      <EmptyState
        icon={MessageSquare}
        title="Belum ada trip"
        description="Trip dengan chat akan muncul di sini"
        variant="subtle"
      />
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Chat</h1>
        <p className="mt-1 text-sm text-slate-600">
          Komunikasi dengan tim operasional per trip
        </p>
      </div>

      <div className="space-y-2">
        {trips.map((trip) => {
          if (!trip || !trip.id) {
            return null; // Skip invalid trips
          }

          // Handle missing date gracefully
          let dateLabel = 'Tanggal tidak tersedia';
          if (trip.date) {
            try {
              const date = new Date(trip.date);
              if (!isNaN(date.getTime())) {
                dateLabel = date.toLocaleDateString('id-ID', {
                  weekday: 'short',
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                });
              }
            } catch (dateError) {
              // Keep default dateLabel on error
              logger.error('Failed to parse trip date', dateError, {
                tripId: trip.id,
                date: trip.date,
              });
            }
          }

          return (
            <Link
              key={trip.id}
              href={`/${locale}/guide/trips/${trip.tripCode || trip.id}/chat`}
              className="block"
            >
              <Card className="border-0 shadow-sm transition-all hover:shadow-md active:scale-[0.98]">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-slate-900 truncate">
                          {trip.tripName || 'Trip tanpa nama'}
                        </h3>
                        {trip.unreadCount && trip.unreadCount > 0 && (
                          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-600 text-[10px] font-bold text-white">
                            {trip.unreadCount}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-600 mb-1">
                        {trip.tripCode || trip.id} • {dateLabel}
                      </p>
                      {trip.lastMessage && (
                        <p className="text-sm text-slate-700 line-clamp-1">
                          {trip.lastMessage}
                        </p>
                      )}
                      {trip.lastMessageTime && (
                        <p className="text-xs text-slate-500 mt-1">
                          {trip.lastMessageTime}
                        </p>
                      )}
                    </div>
                    <MessageSquare className="h-5 w-5 text-slate-400 flex-shrink-0 mt-1" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

/**
 * Partner Inbox Client Component - MOBILE WRAPPER COMPLIANT
 * No Portal/Sheet - stays within max-w-md wrapper
 */

'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { logger } from '@/lib/utils/logger';
import {
  Inbox,
  Loader2,
  MessageSquare,
  Plus,
  RefreshCw,
  Reply,
  Send,
  Filter,
  ArrowLeft,
  Clock,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';
import { id } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { InboxAiParser } from '@/components/partner/inbox-ai-parser';

type InboxMessage = {
  id: string;
  partnerId: string;
  threadId: string | null;
  parentMessageId: string | null;
  subject: string | null;
  messageText: string;
  senderId: string | null;
  senderType: string;
  senderName: string | null;
  isRead: boolean;
  readAt: string | null;
  priority: string;
  category: string | null;
  attachments: string[];
  createdAt: string;
  updatedAt: string;
  unreadCount?: number;
};

type Thread = InboxMessage & {
  unreadCount: number;
};

type ThreadsResponse = {
  threads: Thread[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

type ThreadResponse = {
  messages: InboxMessage[];
};

type ViewMode = 'list' | 'thread' | 'filter' | 'new-message' | 'reply';

export function InboxClient({ locale }: { locale: string }) {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [threads, setThreads] = useState<Thread[]>([]);
  const [selectedThread, setSelectedThread] = useState<Thread | null>(null);
  const [threadMessages, setThreadMessages] = useState<InboxMessage[]>([]);
  const [loadingThread, setLoadingThread] = useState(false);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [replyingTo, setReplyingTo] = useState<InboxMessage | null>(null);
  const [newMessageSubject, setNewMessageSubject] = useState('');
  const [newMessageText, setNewMessageText] = useState('');
  const [replyText, setReplyText] = useState('');
  const [sending, setSending] = useState(false);

  useEffect(() => {
    loadThreads();
  }, [categoryFilter, priorityFilter, pagination.page]);

  useEffect(() => {
    if (selectedThread && viewMode === 'thread') {
      loadThread(selectedThread.threadId || selectedThread.id);
    }
  }, [selectedThread, viewMode]);

  const loadThreads = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        view: 'threads',
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
      });

      if (categoryFilter !== 'all') {
        params.append('category', categoryFilter);
      }
      if (priorityFilter !== 'all') {
        params.append('priority', priorityFilter);
      }

      const response = await fetch(`/api/partner/inbox?${params.toString()}`);

      if (!response.ok) {
        throw new Error('Failed to load inbox');
      }

      const data = (await response.json()) as ThreadsResponse;
      setThreads(data.threads);
      setPagination(data.pagination);
    } catch (error) {
      logger.error('Failed to load inbox threads', error);
      toast.error('Gagal memuat inbox');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const loadThread = async (threadId: string) => {
    try {
      setLoadingThread(true);
      const response = await fetch(`/api/partner/inbox/${threadId}`);

      if (!response.ok) {
        throw new Error('Failed to load thread');
      }

      const data = (await response.json()) as ThreadResponse;
      setThreadMessages(data.messages);

      // Mark thread as read
      await fetch(`/api/partner/inbox/${threadId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'mark-read' }),
      });

      loadThreads();
    } catch (error) {
      logger.error('Failed to load thread', error);
      toast.error('Gagal memuat thread');
    } finally {
      setLoadingThread(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadThreads();
    if (selectedThread && viewMode === 'thread') {
      loadThread(selectedThread.threadId || selectedThread.id);
    }
  };

  const handleNewMessage = async () => {
    if (!newMessageText.trim()) {
      toast.error('Pesan tidak boleh kosong');
      return;
    }

    try {
      setSending(true);
      const response = await fetch('/api/partner/inbox', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject: newMessageSubject || undefined,
          messageText: newMessageText,
          category: categoryFilter !== 'all' ? categoryFilter : undefined,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      toast.success('Pesan berhasil dikirim');
      setViewMode('list');
      setNewMessageSubject('');
      setNewMessageText('');
      loadThreads();
    } catch (error) {
      logger.error('Failed to send message', error);
      toast.error('Gagal mengirim pesan');
    } finally {
      setSending(false);
    }
  };

  const handleReply = async () => {
    if (!replyText.trim() || !replyingTo) {
      toast.error('Pesan tidak boleh kosong');
      return;
    }

    try {
      setSending(true);
      const response = await fetch('/api/partner/inbox', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messageText: replyText,
          parentMessageId: replyingTo.id,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to send reply');
      }

      toast.success('Balasan berhasil dikirim');
      setViewMode('thread');
      setReplyText('');
      setReplyingTo(null);
      if (selectedThread) {
        loadThread(selectedThread.threadId || selectedThread.id);
      }
      loadThreads();
    } catch (error) {
      logger.error('Failed to send reply', error);
      toast.error('Gagal mengirim balasan');
    } finally {
      setSending(false);
    }
  };

  const getPriorityBadge = (priority: string) => {
    const config = {
      low: { label: 'Rendah', variant: 'secondary' as const },
      normal: { label: 'Normal', variant: 'default' as const },
      high: { label: 'Tinggi', variant: 'destructive' as const },
      urgent: { label: 'Mendesak', variant: 'destructive' as const },
    };
    return config[priority as keyof typeof config] || config.normal;
  };

  const getCategoryLabel = (category: string | null): string => {
    if (!category) return 'Umum';
    const labels: Record<string, string> = {
      general: 'Umum',
      booking: 'Booking',
      payment: 'Pembayaran',
      technical: 'Teknis',
      billing: 'Billing',
    };
    return labels[category] || category;
  };

  const activeFiltersCount = [categoryFilter !== 'all', priorityFilter !== 'all'].filter(Boolean).length;

  if (loading && threads.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // Filter View
  if (viewMode === 'filter') {
    return (
      <div className="min-h-screen bg-gray-50 pb-20">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-white border-b">
          <div className="flex items-center gap-3 px-4 py-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setViewMode('list')}
              className="h-8 w-8 p-0"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <h2 className="text-lg font-semibold">Filter</h2>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          <p className="text-sm text-muted-foreground">
            Filter pesan berdasarkan kategori & prioritas
          </p>
          <div>
            <Label>Kategori</Label>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua</SelectItem>
                <SelectItem value="general">Umum</SelectItem>
                <SelectItem value="booking">Booking</SelectItem>
                <SelectItem value="payment">Pembayaran</SelectItem>
                <SelectItem value="technical">Teknis</SelectItem>
                <SelectItem value="billing">Billing</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Prioritas</Label>
            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua</SelectItem>
                <SelectItem value="low">Rendah</SelectItem>
                <SelectItem value="normal">Normal</SelectItem>
                <SelectItem value="high">Tinggi</SelectItem>
                <SelectItem value="urgent">Mendesak</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {activeFiltersCount > 0 && (
            <Button
              variant="outline"
              onClick={() => {
                setCategoryFilter('all');
                setPriorityFilter('all');
              }}
              className="w-full"
            >
              Reset Filter
            </Button>
          )}
          <Button
            onClick={() => setViewMode('list')}
            className="w-full"
          >
            Terapkan Filter
          </Button>
        </div>
      </div>
    );
  }

  // New Message View
  if (viewMode === 'new-message') {
    return (
      <div className="min-h-screen bg-gray-50 pb-20">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-white border-b">
          <div className="flex items-center gap-3 px-4 py-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setViewMode('list')}
              className="h-8 w-8 p-0"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <h2 className="text-lg font-semibold">Pesan Baru</h2>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          <p className="text-sm text-muted-foreground">
            Kirim pesan ke tim Aero
          </p>
          <div>
            <Label>Subjek (opsional)</Label>
            <Input
              value={newMessageSubject}
              onChange={(e) => setNewMessageSubject(e.target.value)}
              placeholder="Subjek pesan"
            />
          </div>
          <div>
            <Label>Pesan</Label>
            <Textarea
              value={newMessageText}
              onChange={(e) => setNewMessageText(e.target.value)}
              placeholder="Tulis pesan Anda..."
              rows={8}
            />
          </div>
          <Button
            onClick={handleNewMessage}
            disabled={sending || !newMessageText.trim()}
            className="w-full gap-2"
          >
            {sending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Mengirim...
              </>
            ) : (
              <>
                <Send className="h-4 w-4" />
                Kirim Pesan
              </>
            )}
          </Button>
        </div>
      </div>
    );
  }

  // Reply View
  if (viewMode === 'reply') {
    return (
      <div className="min-h-screen bg-gray-50 pb-20">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-white border-b">
          <div className="flex items-center gap-3 px-4 py-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setViewMode('thread')}
              className="h-8 w-8 p-0"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div className="flex-1 min-w-0">
              <h2 className="text-lg font-semibold">Balas Pesan</h2>
              <p className="text-xs text-muted-foreground truncate">
                Balas ke {replyingTo?.senderName || 'Admin'}
              </p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          <div>
            <Label>Balasan Anda</Label>
            <Textarea
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              placeholder="Tulis balasan Anda..."
              rows={8}
              autoFocus
            />
          </div>
          <Button
            onClick={handleReply}
            disabled={sending || !replyText.trim()}
            className="w-full gap-2"
          >
            {sending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Mengirim...
              </>
            ) : (
              <>
                <Send className="h-4 w-4" />
                Kirim Balasan
              </>
            )}
          </Button>
        </div>
      </div>
    );
  }

  // Thread Detail View
  if (viewMode === 'thread' && selectedThread) {
    return (
      <div className="min-h-screen bg-gray-50 pb-20">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-white border-b">
          <div className="flex items-center gap-3 px-4 py-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSelectedThread(null);
                setViewMode('list');
              }}
              className="h-8 w-8 p-0"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div className="flex-1 min-w-0">
              <h2 className="text-sm font-semibold truncate">
                {selectedThread.subject || 'Pesan'}
              </h2>
              <p className="text-xs text-muted-foreground">
                {selectedThread.senderName || 'Admin'}
              </p>
            </div>
          </div>
        </div>

        {/* Messages */}
        <div className="px-4 py-4 space-y-3">
          {loadingThread ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            threadMessages.map((message) => {
              const isPartner = message.senderType === 'partner';
              return (
                <div
                  key={message.id}
                  className={cn(
                    'flex',
                    isPartner ? 'justify-end' : 'justify-start'
                  )}
                >
                  <Card className={cn(
                    'max-w-[85%] border-0 shadow-sm',
                    isPartner ? 'bg-primary text-primary-foreground' : 'bg-white'
                  )}>
                    <CardContent className="p-3">
                      <div className="flex items-center gap-2 mb-1">
                        <p className={cn(
                          'text-xs font-medium',
                          isPartner ? 'text-primary-foreground/90' : 'text-muted-foreground'
                        )}>
                          {message.senderName || (isPartner ? 'Anda' : 'Admin')}
                        </p>
                        <span className={cn(
                          'text-[10px]',
                          isPartner ? 'text-primary-foreground/70' : 'text-muted-foreground'
                        )}>
                          •
                        </span>
                        <p className={cn(
                          'text-[10px]',
                          isPartner ? 'text-primary-foreground/70' : 'text-muted-foreground'
                        )}>
                          {formatDistanceToNow(new Date(message.createdAt), {
                            addSuffix: true,
                            locale: id,
                          })}
                        </p>
                      </div>
                      <p className={cn(
                        'text-sm whitespace-pre-wrap',
                        isPartner ? 'text-primary-foreground' : 'text-foreground'
                      )}>
                        {message.messageText}
                      </p>
                    </CardContent>
                  </Card>
                </div>
              );
            })
          )}
        </div>

        {/* AI Parser Widget */}
        <div className="px-4 py-2">
          <InboxAiParser
            threadId={selectedThread.threadId || selectedThread.id}
            onCreateBooking={(parsed) => {
              // Navigate to booking creation with pre-filled data
              const params = new URLSearchParams();
              if (parsed.destination) params.set('destination', parsed.destination);
              if (parsed.paxCount?.adults) params.set('paxCount', parsed.paxCount.adults.toString());
              if (parsed.dateRange?.start) params.set('tripDate', parsed.dateRange.start);
              window.location.href = `/partner/bookings/new?${params.toString()}`;
            }}
          />
        </div>

        {/* Reply Button */}
        <div className="px-4 pb-4 pt-2">
          <Button
            onClick={() => {
              setReplyingTo(threadMessages[0]);
              setViewMode('reply');
            }}
            className="w-full gap-2"
            disabled={loadingThread}
          >
            <Reply className="h-4 w-4" />
            Balas Pesan
          </Button>
        </div>
      </div>
    );
  }

  // Thread List View (Default)
  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white border-b">
        <div className="px-4 py-4">
          <div className="flex items-center justify-between mb-3">
            <h1 className="text-xl font-bold">Inbox</h1>
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleRefresh}
                disabled={refreshing}
                className="h-8 w-8 p-0"
              >
                <RefreshCw className={cn('h-4 w-4', refreshing && 'animate-spin')} />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setViewMode('filter')}
                className="h-8 gap-1.5"
              >
                <Filter className="h-4 w-4" />
                {activeFiltersCount > 0 && (
                  <Badge variant="destructive" className="h-4 min-w-4 px-1 text-[10px]">
                    {activeFiltersCount}
                  </Badge>
                )}
              </Button>
              <Button
                size="sm"
                onClick={() => setViewMode('new-message')}
                className="h-8 gap-1.5"
              >
                <Plus className="h-4 w-4" />
                <span className="hidden sm:inline">Baru</span>
              </Button>
            </div>
          </div>
          <p className="text-sm text-muted-foreground">
            {pagination.total} pesan
          </p>
        </div>
      </div>

      {/* Thread List */}
      <div className="px-4 py-4 space-y-2">
        {threads.length === 0 ? (
          <EmptyState
            icon={Inbox}
            title="Inbox Kosong"
            description="Belum ada pesan. Kirim pesan pertama Anda!"
          />
        ) : (
          threads.map((thread) => {
            const priorityBadge = getPriorityBadge(thread.priority);
            return (
              <Card
                key={thread.id}
                className={cn(
                  'cursor-pointer transition-all hover:shadow-md border-0',
                  !thread.isRead && 'bg-blue-50/50 ring-1 ring-blue-200'
                )}
                onClick={() => {
                  setSelectedThread(thread);
                  setViewMode('thread');
                }}
              >
                <CardContent className="p-3">
                  <div className="flex gap-3">
                    <div className={cn(
                      'flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full',
                      thread.isRead ? 'bg-muted' : 'bg-primary'
                    )}>
                      <MessageSquare className={cn(
                        'h-5 w-5',
                        thread.isRead ? 'text-muted-foreground' : 'text-primary-foreground'
                      )} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <h3 className={cn(
                          'text-sm font-medium truncate',
                          !thread.isRead && 'font-semibold'
                        )}>
                          {thread.subject || 'Pesan'}
                        </h3>
                        {!thread.isRead && thread.unreadCount > 0 && (
                          <Badge variant="destructive" className="h-5 min-w-5 px-1.5 text-[10px] font-bold flex-shrink-0">
                            {thread.unreadCount}
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground truncate mb-2">
                        {thread.messageText}
                      </p>
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant={priorityBadge.variant} className="h-5 text-[10px]">
                          {priorityBadge.label}
                        </Badge>
                        <Badge variant="outline" className="h-5 text-[10px]">
                          {getCategoryLabel(thread.category)}
                        </Badge>
                        <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formatDistanceToNow(new Date(thread.createdAt), {
                            addSuffix: true,
                            locale: id,
                          })}
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}

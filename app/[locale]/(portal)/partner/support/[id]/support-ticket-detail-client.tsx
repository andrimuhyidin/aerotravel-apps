/**
 * Partner Support Ticket Detail Client Component
 * REDESIGNED - Chat-like messages, Reply form, Status timeline
 */

'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { PageHeader, StatusBadge } from '@/components/partner';
import { logger } from '@/lib/utils/logger';
import { cn } from '@/lib/utils';
import { ArrowLeft, Send, User, Headphones } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

type TicketMessage = {
  id: string;
  message: string;
  isStaff: boolean;
  senderName: string;
  createdAt: string;
};

type TicketDetail = {
  id: string;
  ticketNumber: string;
  subject: string;
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  category: string;
  createdAt: string;
  messages: TicketMessage[];
};

export function SupportTicketDetailClient({ ticketId, locale }: { ticketId: string; locale: string }) {
  const [ticket, setTicket] = useState<TicketDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [reply, setReply] = useState('');
  const [sending, setSending] = useState(false);

  useEffect(() => {
    loadTicket();
  }, [ticketId]);

  const loadTicket = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/partner/support/tickets/${ticketId}`);
      if (!res.ok) throw new Error('Failed to fetch ticket');
      const data = (await res.json()) as TicketDetail;
      setTicket(data);
    } catch (error) {
      logger.error('Failed to load ticket', error);
      toast.error('Gagal memuat tiket');
    } finally {
      setLoading(false);
    }
  };

  const handleSendReply = async () => {
    if (!reply.trim()) return;

    setSending(true);
    try {
      const res = await fetch(`/api/partner/support/tickets/${ticketId}/reply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: reply }),
      });

      if (!res.ok) throw new Error('Failed to send reply');

      setReply('');
      await loadTicket();
      toast.success('Balasan terkirim');
    } catch (error) {
      logger.error('Failed to send reply', error);
      toast.error('Gagal mengirim balasan');
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return <TicketDetailSkeleton />;
  }

  if (!ticket) {
    return (
      <div className="p-6 text-center">
        <p className="text-muted-foreground">Tiket tidak ditemukan</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <PageHeader
        title={ticket.ticketNumber}
        description={ticket.subject}
        action={
          <Button variant="outline" size="sm" asChild>
            <Link href={`/${locale}/partner/support`}>
              <ArrowLeft className="mr-1 h-3 w-3" />
              Kembali
            </Link>
          </Button>
        }
      />

      <div className="space-y-4 px-4 pb-32">
        {/* Status Info */}
        <Card>
          <CardContent className="flex items-center justify-between p-4">
            <div>
              <p className="text-sm text-muted-foreground">Status</p>
              <div className="mt-1">
                <StatusBadge status={ticket.status} variant="pill" />
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Kategori</p>
              <p className="mt-1 font-medium text-foreground">{ticket.category}</p>
            </div>
          </CardContent>
        </Card>

        {/* Messages */}
        <div className="space-y-3">
          {ticket.messages.map((msg) => (
            <div
              key={msg.id}
              className={cn('flex gap-3', msg.isStaff ? 'flex-row' : 'flex-row-reverse')}
            >
              {/* Avatar */}
              <div
                className={cn(
                  'flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full',
                  msg.isStaff ? 'bg-primary/10 text-primary' : 'bg-gray-200 text-gray-600'
                )}
              >
                {msg.isStaff ? <Headphones className="h-5 w-5" /> : <User className="h-5 w-5" />}
              </div>

              {/* Message */}
              <div className={cn('flex-1', msg.isStaff ? 'text-left' : 'text-right')}>
                <div className="mb-1 flex items-center gap-2">
                  {msg.isStaff ? (
                    <>
                      <p className="text-xs font-semibold text-foreground">{msg.senderName}</p>
                      <span className="text-xs text-muted-foreground">
                        {new Date(msg.createdAt).toLocaleString('id-ID', {
                          day: 'numeric',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </>
                  ) : (
                    <>
                      <span className="text-xs text-muted-foreground">
                        {new Date(msg.createdAt).toLocaleString('id-ID', {
                          day: 'numeric',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                      <p className="text-xs font-semibold text-foreground">{msg.senderName}</p>
                    </>
                  )}
                </div>
                <Card
                  className={cn(
                    'inline-block max-w-[80%]',
                    msg.isStaff ? 'bg-white' : 'bg-primary text-primary-foreground'
                  )}
                >
                  <CardContent className="p-3">
                    <p className="text-sm">{msg.message}</p>
                  </CardContent>
                </Card>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Reply Form - Fixed Bottom */}
      <div className="fixed bottom-0 left-0 right-0 border-t bg-white p-4">
        <div className="mx-auto max-w-md">
          <div className="flex gap-2">
            <Textarea
              placeholder="Tulis balasan..."
              value={reply}
              onChange={(e) => setReply(e.target.value)}
              rows={2}
              className="resize-none"
            />
            <Button onClick={handleSendReply} disabled={!reply.trim() || sending} size="icon" className="h-auto">
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function TicketDetailSkeleton() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="space-y-4 p-4">
        <div>
          <Skeleton className="mb-2 h-8 w-48" />
          <Skeleton className="h-5 w-64" />
        </div>
        <Skeleton className="h-24" />
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-20" />
          ))}
        </div>
      </div>
    </div>
  );
}


/**
 * Partner Ticket Detail Client Component
 * Displays ticket detail with messages thread
 */

'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { logger } from '@/lib/utils/logger';
import { ArrowLeft, AlertCircle, CheckCircle2, Clock, Send } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

type Ticket = {
  id: string;
  subject: string;
  description: string;
  category: string | null;
  status: string;
  priority: string;
  messages: Array<{
    user_id: string;
    message: string;
    created_at: string;
    is_internal: boolean;
  }>;
  submitted_at: string;
  first_response_at: string | null;
  resolved_at: string | null;
  response_sla_hours: number;
  created_at: string;
};

type SLAStatus = {
  status: 'within_sla' | 'at_risk' | 'breached';
  timeRemaining: number | null; // in milliseconds
  timeOverdue: number | null; // in milliseconds
  deadline: Date;
};

export function TicketDetailClient({
  locale,
  ticketId,
}: {
  locale: string;
  ticketId: string;
}) {
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [loading, setLoading] = useState(true);
  const [newMessage, setNewMessage] = useState('');

  useEffect(() => {
    loadTicket();
  }, [ticketId]);

  const loadTicket = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/partner/support/tickets/${ticketId}`);

      if (!response.ok) {
        throw new Error('Failed to load ticket');
      }

      const data = (await response.json()) as { ticket: Ticket };
      setTicket(data.ticket);
    } catch (error) {
      logger.error('Failed to load ticket', error, { ticketId });
      toast.error('Gagal memuat detail ticket. Silakan refresh halaman.');
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim()) return;

    try {
      const response = await fetch(
        `/api/partner/support/tickets/${ticketId}/messages`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: newMessage }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to send message');
      }

      toast.success('Message berhasil dikirim');
      setNewMessage('');
      loadTicket();
    } catch (error) {
      logger.error('Failed to send message', error);
      toast.error(
        error instanceof Error ? error.message : 'Gagal mengirim message'
      );
    }
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleString('id-ID', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const calculateSLAStatus = (ticket: Ticket): SLAStatus => {
    const submittedAt = new Date(ticket.submitted_at);
    const slaHours = ticket.response_sla_hours || 24;
    const deadline = new Date(submittedAt.getTime() + slaHours * 60 * 60 * 1000);
    const now = new Date();
    const firstResponseAt = ticket.first_response_at
      ? new Date(ticket.first_response_at)
      : null;

    // If ticket is resolved, check if it was resolved within SLA
    if (ticket.resolved_at) {
      const resolvedAt = new Date(ticket.resolved_at);
      if (resolvedAt <= deadline) {
        return {
          status: 'within_sla',
          timeRemaining: null,
          timeOverdue: null,
          deadline,
        };
      } else {
        return {
          status: 'breached',
          timeRemaining: null,
          timeOverdue: resolvedAt.getTime() - deadline.getTime(),
          deadline,
        };
      }
    }

    // If first response exists, check if it was within SLA
    if (firstResponseAt) {
      if (firstResponseAt <= deadline) {
        return {
          status: 'within_sla',
          timeRemaining: null,
          timeOverdue: null,
          deadline,
        };
      } else {
        return {
          status: 'breached',
          timeRemaining: null,
          timeOverdue: firstResponseAt.getTime() - deadline.getTime(),
          deadline,
        };
      }
    }

    // No response yet - check current status
    if (now > deadline) {
      return {
        status: 'breached',
        timeRemaining: null,
        timeOverdue: now.getTime() - deadline.getTime(),
        deadline,
      };
    }

    // Check if at risk (within last 20% of time)
    const totalTime = slaHours * 60 * 60 * 1000;
    const elapsed = now.getTime() - submittedAt.getTime();
    const remaining = deadline.getTime() - now.getTime();
    const riskThreshold = totalTime * 0.8; // 80% of SLA time

    if (elapsed >= riskThreshold) {
      return {
        status: 'at_risk',
        timeRemaining: remaining,
        timeOverdue: null,
        deadline,
      };
    }

    return {
      status: 'within_sla',
      timeRemaining: remaining,
      timeOverdue: null,
      deadline,
    };
  };

  const formatTimeRemaining = (ms: number | null): string => {
    if (ms === null) return '';
    if (ms < 0) return 'Terlambat';

    const hours = Math.floor(ms / (1000 * 60 * 60));
    const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));

    if (hours > 0) {
      return `${hours}j ${minutes}m tersisa`;
    }
    return `${minutes}m tersisa`;
  };

  const formatTimeOverdue = (ms: number | null): string => {
    if (ms === null) return '';
    if (ms <= 0) return '';

    const hours = Math.floor(ms / (1000 * 60 * 60));
    const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));

    if (hours > 0) {
      return `Terlambat ${hours}j ${minutes}m`;
    }
    return `Terlambat ${minutes}m`;
  };

  const getSLAStatusBadge = (slaStatus: SLAStatus) => {
    switch (slaStatus.status) {
      case 'within_sla':
        return (
          <Badge variant="default" className="bg-green-500">
            <CheckCircle2 className="h-3 w-3 mr-1" />
            Dalam SLA
          </Badge>
        );
      case 'at_risk':
        return (
          <Badge variant="default" className="bg-orange-500">
            <AlertCircle className="h-3 w-3 mr-1" />
            Berisiko
          </Badge>
        );
      case 'breached':
        return (
          <Badge variant="default" className="bg-red-500">
            <AlertCircle className="h-3 w-3 mr-1" />
            Melanggar SLA
          </Badge>
        );
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 py-6 px-4">
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-muted-foreground">Memuat detail ticket...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="space-y-6 py-6 px-4">
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-muted-foreground">Ticket tidak ditemukan</p>
            <Link href={`/${locale}/partner/support`} className="mt-4 inline-block">
              <Button variant="outline">Kembali ke Daftar Tickets</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 py-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Link href={`/${locale}/partner/support`}>
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Kembali
          </Button>
        </Link>
      </div>

      {/* Ticket Info */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <CardTitle>{ticket.subject}</CardTitle>
            {ticket && getSLAStatusBadge(calculateSLAStatus(ticket))}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Status:</span>{' '}
              <span className="font-medium">{ticket.status}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Priority:</span>{' '}
              <span className="font-medium">{ticket.priority}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Category:</span>{' '}
              <span className="font-medium">{ticket.category || 'Other'}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Created:</span>{' '}
              <span className="font-medium">{formatDate(ticket.created_at)}</span>
            </div>
          </div>

          {/* SLA Status Display */}
          {ticket && (() => {
            const slaStatus = calculateSLAStatus(ticket);
            return (
              <div className="pt-4 border-t">
                <h3 className="font-semibold mb-2 flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  SLA Status
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Target Response:</span>
                    <span className="font-medium">
                      {ticket.response_sla_hours || 24} jam
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Deadline:</span>
                    <span className="font-medium">
                      {formatDate(slaStatus.deadline.toISOString())}
                    </span>
                  </div>
                  {slaStatus.timeRemaining !== null && (
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Waktu Tersisa:</span>
                      <span className="font-medium text-orange-600">
                        {formatTimeRemaining(slaStatus.timeRemaining)}
                      </span>
                    </div>
                  )}
                  {slaStatus.timeOverdue !== null && (
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Terlambat:</span>
                      <span className="font-medium text-red-600">
                        {formatTimeOverdue(slaStatus.timeOverdue)}
                      </span>
                    </div>
                  )}
                  {ticket.first_response_at && (
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">First Response:</span>
                      <span className="font-medium">
                        {formatDate(ticket.first_response_at)}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            );
          })()}

          <div className="pt-4 border-t">
            <h3 className="font-semibold mb-2">Description</h3>
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">
              {ticket.description}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Messages */}
      <Card>
        <CardHeader>
          <CardTitle>Messages</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {ticket.messages && ticket.messages.length > 0 ? (
            <div className="space-y-4">
              {ticket.messages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`p-4 rounded-lg ${
                    msg.is_internal
                      ? 'bg-muted'
                      : 'bg-primary/5 border border-primary/20'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">
                      {msg.is_internal ? 'Internal' : 'Partner'}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {formatDate(msg.created_at)}
                    </span>
                  </div>
                  <p className="text-sm whitespace-pre-wrap">{msg.message}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-8">
              Belum ada messages
            </p>
          )}

          {/* Add Message */}
          <div className="pt-4 border-t space-y-2">
            <Textarea
              placeholder="Tulis message..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              rows={4}
            />
            <Button onClick={handleSendMessage} className="w-full">
              <Send className="h-4 w-4 mr-2" />
              Send Message
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}


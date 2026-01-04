/**
 * Partner Support Tickets List Client Component
 * REDESIGNED - Tabs by status, Clean cards, Quick actions
 */

'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PageHeader, StatusBadge } from '@/components/partner';
import { logger } from '@/lib/utils/logger';
import { MessageCircle, Plus, Eye } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

type Ticket = {
  id: string;
  ticketNumber: string;
  subject: string;
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  createdAt: string;
  lastReplyAt: string | null;
};

export function SupportTicketsListClient({ locale }: { locale: string }) {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<string>('open');

  useEffect(() => {
    loadTickets();
  }, []);

  const loadTickets = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/partner/support/tickets');
      if (!res.ok) throw new Error('Failed to fetch tickets');
      const data = (await res.json()) as { tickets: Ticket[] };
      setTickets(data.tickets);
    } catch (error) {
      logger.error('Failed to load tickets', error);
      toast.error('Gagal memuat tiket support');
    } finally {
      setLoading(false);
    }
  };

  const filtered = tickets.filter((t) =>
    activeTab === 'all' ? true : t.status === activeTab
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <PageHeader
        title="Support Center"
        description="Butuh bantuan? Hubungi kami"
        action={
          <Button asChild>
            <Link href={`/${locale}/partner/support/new`}>
              <Plus className="mr-2 h-4 w-4" />
              Buat Tiket
            </Link>
          </Button>
        }
      />

      <div className="px-4 pb-4">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="all">Semua</TabsTrigger>
            <TabsTrigger value="open">Open</TabsTrigger>
            <TabsTrigger value="in_progress">Progress</TabsTrigger>
            <TabsTrigger value="resolved">Resolved</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <div className="space-y-2 px-4 pb-20">
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-28" />)
        ) : filtered.length === 0 ? (
          <EmptyState
            variant="minimal"
            icon={MessageCircle}
            title="Tidak ada tiket"
            description="Tiket support Anda akan muncul di sini"
          />
        ) : (
          filtered.map((ticket) => (
            <Card key={ticket.id} className="hover:shadow-md">
              <CardContent className="space-y-3 p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <p className="font-semibold text-foreground">{ticket.ticketNumber}</p>
                    <p className="text-sm text-muted-foreground">{ticket.subject}</p>
                  </div>
                  <StatusBadge status={ticket.status} variant="pill" />
                </div>
                <div className="flex items-center justify-between border-t pt-2 text-xs text-muted-foreground">
                  <span>
                    Dibuat: {new Date(ticket.createdAt).toLocaleDateString('id-ID')}
                  </span>
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/${locale}/partner/support/${ticket.id}`}>
                      <Eye className="mr-1 h-3 w-3" />
                      View
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}

/**
 * Partner Broadcasts Client Component
 * Manage WhatsApp broadcast campaigns
 */

'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  AlertCircle,
  Calendar,
  CheckCircle2,
  Clock,
  MessageSquare,
  MoreHorizontal,
  PauseCircle,
  PlayCircle,
  Plus,
  Send,
  Trash2,
  Users,
  XCircle,
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';
import { useRouter } from 'next/navigation';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { PageHeader } from '@/components/partner';
import { apiClient } from '@/lib/api/client';
import queryKeys from '@/lib/queries/query-keys';

type BroadcastStatus = 'draft' | 'scheduled' | 'sending' | 'completed' | 'paused' | 'failed';

type Broadcast = {
  id: string;
  name: string;
  templateName: string;
  recipientCount: number;
  sentCount: number;
  failedCount: number;
  status: BroadcastStatus;
  scheduledAt: string | null;
  sentAt: string | null;
  createdAt: string;
};

type BroadcastStats = {
  totalBroadcasts: number;
  totalSent: number;
  totalDelivered: number;
  totalFailed: number;
  deliveryRate: number;
};

function getStatusBadge(status: BroadcastStatus) {
  switch (status) {
    case 'completed':
      return (
        <Badge className="bg-green-500">
          <CheckCircle2 className="mr-1 h-3 w-3" />
          Selesai
        </Badge>
      );
    case 'sending':
      return (
        <Badge className="bg-blue-500">
          <Send className="mr-1 h-3 w-3" />
          Mengirim
        </Badge>
      );
    case 'scheduled':
      return (
        <Badge className="bg-purple-500">
          <Clock className="mr-1 h-3 w-3" />
          Terjadwal
        </Badge>
      );
    case 'paused':
      return (
        <Badge className="bg-yellow-500">
          <PauseCircle className="mr-1 h-3 w-3" />
          Dijeda
        </Badge>
      );
    case 'failed':
      return (
        <Badge variant="destructive">
          <XCircle className="mr-1 h-3 w-3" />
          Gagal
        </Badge>
      );
    case 'draft':
    default:
      return <Badge variant="secondary">Draft</Badge>;
  }
}

type BroadcastsClientProps = {
  locale: string;
};

export function BroadcastsClient({ locale }: BroadcastsClientProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // Fetch broadcast stats
  const { data: stats, isLoading: statsLoading } = useQuery<BroadcastStats>({
    queryKey: queryKeys.partner.broadcastStats,
    queryFn: async () => {
      const response = await apiClient.get<BroadcastStats>('/api/partner/broadcasts/stats');
      return response;
    },
  });

  // Fetch broadcast list
  const { data: broadcasts, isLoading: broadcastsLoading } = useQuery<Broadcast[]>({
    queryKey: queryKeys.partner.broadcasts,
    queryFn: async () => {
      const response = await apiClient.get<{ broadcasts: Broadcast[] }>('/api/partner/broadcasts');
      return response.broadcasts;
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiClient.delete(`/api/partner/broadcasts/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.partner.broadcasts });
      queryClient.invalidateQueries({ queryKey: queryKeys.partner.broadcastStats });
      toast.success('Broadcast berhasil dihapus');
      setDeleteId(null);
    },
    onError: () => {
      toast.error('Gagal menghapus broadcast');
    },
  });

  // Pause/Resume mutation
  const toggleStatusMutation = useMutation({
    mutationFn: async ({ id, action }: { id: string; action: 'pause' | 'resume' }) => {
      return apiClient.post(`/api/partner/broadcasts/${id}/${action}`);
    },
    onSuccess: (_data, { action }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.partner.broadcasts });
      toast.success(action === 'pause' ? 'Broadcast dijeda' : 'Broadcast dilanjutkan');
    },
    onError: () => {
      toast.error('Gagal mengubah status broadcast');
    },
  });

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <PageHeader
        title="WhatsApp Broadcast"
        description="Kirim pesan massal ke customer via WhatsApp"
        action={
          <Button size="sm" onClick={() => router.push(`/${locale}/partner/broadcasts/new`)}>
            <Plus className="mr-2 h-4 w-4" />
            Buat Broadcast
          </Button>
        }
      />

      <div className="space-y-4 px-4">
        {/* Stats */}
        <div className="grid grid-cols-2 gap-3">
          {statsLoading ? (
            <>
              {[1, 2, 3, 4].map((i) => (
                <Card key={i}>
                  <CardContent className="p-4">
                    <Skeleton className="h-14 w-full" />
                  </CardContent>
                </Card>
              ))}
            </>
          ) : (
            <>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <MessageSquare className="h-4 w-4" />
                    <span className="text-xs">Total Broadcast</span>
                  </div>
                  <p className="mt-1 text-2xl font-bold">{stats?.totalBroadcasts || 0}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Send className="h-4 w-4 text-blue-500" />
                    <span className="text-xs">Terkirim</span>
                  </div>
                  <p className="mt-1 text-2xl font-bold text-blue-600">{stats?.totalSent || 0}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                    <span className="text-xs">Tersampaikan</span>
                  </div>
                  <p className="mt-1 text-2xl font-bold text-green-600">{stats?.totalDelivered || 0}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <XCircle className="h-4 w-4 text-red-500" />
                    <span className="text-xs">Gagal</span>
                  </div>
                  <p className="mt-1 text-2xl font-bold text-red-600">{stats?.totalFailed || 0}</p>
                </CardContent>
              </Card>
            </>
          )}
        </div>

        {/* Delivery Rate */}
        {!statsLoading && stats && (
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Delivery Rate</span>
                <span className="text-sm font-medium">{stats.deliveryRate.toFixed(1)}%</span>
              </div>
              <Progress value={stats.deliveryRate} className="mt-2 h-2" />
            </CardContent>
          </Card>
        )}

        {/* Broadcast List */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Daftar Broadcast</CardTitle>
            <CardDescription>Semua campaign broadcast Anda</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {broadcastsLoading ? (
              <div className="space-y-3 p-4">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-20 w-full" />
                ))}
              </div>
            ) : broadcasts && broadcasts.length > 0 ? (
              <ScrollArea className="h-[400px]">
                <div className="divide-y">
                  {broadcasts.map((broadcast) => (
                    <div
                      key={broadcast.id}
                      className="flex items-center justify-between p-4 hover:bg-muted/50"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-medium">{broadcast.name}</p>
                          {getStatusBadge(broadcast.status)}
                        </div>
                        <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Users className="h-3 w-3" />
                            {broadcast.recipientCount} penerima
                          </span>
                          {broadcast.status === 'sending' || broadcast.status === 'completed' ? (
                            <span className="flex items-center gap-1">
                              <Send className="h-3 w-3" />
                              {broadcast.sentCount}/{broadcast.recipientCount}
                            </span>
                          ) : null}
                          {broadcast.scheduledAt && (
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {format(new Date(broadcast.scheduledAt), 'd MMM, HH:mm', {
                                locale: idLocale,
                              })}
                            </span>
                          )}
                        </div>
                        {(broadcast.status === 'sending' || broadcast.status === 'completed') && (
                          <Progress
                            value={(broadcast.sentCount / broadcast.recipientCount) * 100}
                            className="mt-2 h-1"
                          />
                        )}
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {broadcast.status === 'draft' && (
                            <DropdownMenuItem
                              onClick={() =>
                                router.push(`/${locale}/partner/broadcasts/${broadcast.id}/edit`)
                              }
                            >
                              Edit
                            </DropdownMenuItem>
                          )}
                          {broadcast.status === 'sending' && (
                            <DropdownMenuItem
                              onClick={() =>
                                toggleStatusMutation.mutate({ id: broadcast.id, action: 'pause' })
                              }
                            >
                              <PauseCircle className="mr-2 h-4 w-4" />
                              Jeda
                            </DropdownMenuItem>
                          )}
                          {broadcast.status === 'paused' && (
                            <DropdownMenuItem
                              onClick={() =>
                                toggleStatusMutation.mutate({ id: broadcast.id, action: 'resume' })
                              }
                            >
                              <PlayCircle className="mr-2 h-4 w-4" />
                              Lanjutkan
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem
                            className="text-red-600"
                            onClick={() => setDeleteId(broadcast.id)}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Hapus
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <MessageSquare className="mb-3 h-10 w-10 text-muted-foreground/50" />
                <p className="font-medium">Belum ada broadcast</p>
                <p className="mb-4 text-sm text-muted-foreground">
                  Buat broadcast pertama Anda untuk mengirim pesan ke customer
                </p>
                <Button onClick={() => router.push(`/${locale}/partner/broadcasts/new`)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Buat Broadcast
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Info Card */}
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="flex items-start gap-3 p-4">
            <AlertCircle className="h-5 w-5 shrink-0 text-blue-600" />
            <div className="text-sm text-blue-800">
              <p className="font-medium">Tentang WhatsApp Broadcast</p>
              <p className="mt-1 text-blue-700">
                Broadcast menggunakan WhatsApp Business API. Pastikan template pesan sudah
                disetujui oleh Meta sebelum mengirim. Rate limit: 1000 pesan/jam.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Broadcast?</AlertDialogTitle>
            <AlertDialogDescription>
              Broadcast yang dihapus tidak dapat dikembalikan. Apakah Anda yakin?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              onClick={() => deleteId && deleteMutation.mutate(deleteId)}
            >
              Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}


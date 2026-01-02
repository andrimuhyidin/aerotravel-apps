/**
 * Partner Contracts Client Component
 * View and manage partner agreements with e-signature
 */

'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import {
  AlertCircle,
  Calendar,
  CheckCircle2,
  ChevronRight,
  Clock,
  FileText,
  PenTool,
  XCircle,
} from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { PageHeader } from '@/components/partner';
import { apiClient } from '@/lib/api/client';
import queryKeys from '@/lib/queries/query-keys';
import { cn } from '@/lib/utils';

type ContractStatus = 'pending' | 'signed' | 'expired' | 'cancelled';

type Contract = {
  id: string;
  title: string;
  type: 'partnership' | 'nda' | 'addendum';
  version: string;
  status: ContractStatus;
  signedAt: string | null;
  expiresAt: string | null;
  createdAt: string;
};

function getStatusBadge(status: ContractStatus) {
  switch (status) {
    case 'signed':
      return (
        <Badge className="bg-green-500">
          <CheckCircle2 className="mr-1 h-3 w-3" />
          Sudah Ditandatangani
        </Badge>
      );
    case 'pending':
      return (
        <Badge className="bg-yellow-500">
          <Clock className="mr-1 h-3 w-3" />
          Menunggu Tanda Tangan
        </Badge>
      );
    case 'expired':
      return (
        <Badge variant="secondary">
          <XCircle className="mr-1 h-3 w-3" />
          Expired
        </Badge>
      );
    case 'cancelled':
      return (
        <Badge variant="destructive">
          Dibatalkan
        </Badge>
      );
    default:
      return null;
  }
}

type ContractsClientProps = {
  locale: string;
};

export function ContractsClient({ locale }: ContractsClientProps) {
  const router = useRouter();

  // Fetch contracts
  const { data: contracts, isLoading } = useQuery<Contract[]>({
    queryKey: queryKeys.partner.contracts,
    queryFn: async () => {
      const response = await apiClient.get<{ contracts: Contract[] }>('/api/partner/contracts');
      return response.contracts;
    },
  });

  const pendingContracts = contracts?.filter((c) => c.status === 'pending') || [];
  const signedContracts = contracts?.filter((c) => c.status === 'signed') || [];

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <PageHeader
        title="Contracts"
        description="Lihat dan tanda tangani perjanjian partner"
      />

      <div className="space-y-4 px-4">
        {/* Pending Alert */}
        {pendingContracts.length > 0 && (
          <Alert className="border-yellow-200 bg-yellow-50">
            <AlertCircle className="h-4 w-4 text-yellow-600" />
            <AlertTitle className="text-yellow-800">
              {pendingContracts.length} kontrak menunggu tanda tangan
            </AlertTitle>
            <AlertDescription className="text-yellow-700">
              Silakan tanda tangani kontrak untuk melanjutkan kerjasama.
            </AlertDescription>
          </Alert>
        )}

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3">
          <Card className="border-green-200 bg-green-50">
            <CardContent className="p-4 text-center">
              <CheckCircle2 className="mx-auto h-6 w-6 text-green-600" />
              <p className="mt-1 text-2xl font-bold text-green-700">
                {signedContracts.length}
              </p>
              <p className="text-xs text-green-600">Aktif</p>
            </CardContent>
          </Card>
          <Card className="border-yellow-200 bg-yellow-50">
            <CardContent className="p-4 text-center">
              <PenTool className="mx-auto h-6 w-6 text-yellow-600" />
              <p className="mt-1 text-2xl font-bold text-yellow-700">
                {pendingContracts.length}
              </p>
              <p className="text-xs text-yellow-600">Menunggu TTD</p>
            </CardContent>
          </Card>
        </div>

        {/* Contract List */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Daftar Kontrak</CardTitle>
            <CardDescription>Semua perjanjian partner Anda</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="space-y-3 p-4">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-20 w-full" />
                ))}
              </div>
            ) : contracts && contracts.length > 0 ? (
              <ScrollArea className="max-h-[500px]">
                <div className="divide-y">
                  {contracts.map((contract) => (
                    <div
                      key={contract.id}
                      className="flex cursor-pointer items-center justify-between p-4 hover:bg-muted/50"
                      onClick={() =>
                        router.push(`/${locale}/partner/contracts/${contract.id}`)
                      }
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={cn(
                            'flex h-10 w-10 items-center justify-center rounded-lg',
                            contract.status === 'signed'
                              ? 'bg-green-100 text-green-600'
                              : contract.status === 'pending'
                              ? 'bg-yellow-100 text-yellow-600'
                              : 'bg-muted text-muted-foreground'
                          )}
                        >
                          <FileText className="h-5 w-5" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-medium">{contract.title}</p>
                            <Badge variant="outline" className="text-xs">
                              v{contract.version}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-3 text-xs text-muted-foreground">
                            {getStatusBadge(contract.status)}
                            {contract.signedAt && (
                              <span className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {format(new Date(contract.signedAt), 'd MMM yyyy', {
                                  locale: idLocale,
                                })}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {contract.status === 'pending' && (
                          <Button
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              router.push(`/${locale}/partner/contracts/${contract.id}/sign`);
                            }}
                          >
                            <PenTool className="mr-1 h-3 w-3" />
                            Tanda Tangan
                          </Button>
                        )}
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <FileText className="mb-3 h-10 w-10 text-muted-foreground/50" />
                <p className="font-medium">Belum ada kontrak</p>
                <p className="text-sm text-muted-foreground">
                  Kontrak akan muncul di sini saat tersedia
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Renewal Notice */}
        {signedContracts.some((c) => {
          if (!c.expiresAt) return false;
          const expiresIn = new Date(c.expiresAt).getTime() - Date.now();
          const thirtyDays = 30 * 24 * 60 * 60 * 1000;
          return expiresIn > 0 && expiresIn < thirtyDays;
        }) && (
          <Card className="border-blue-200 bg-blue-50">
            <CardContent className="flex items-start gap-3 p-4">
              <Clock className="h-5 w-5 shrink-0 text-blue-600" />
              <div>
                <p className="font-medium text-blue-800">
                  Kontrak akan segera berakhir
                </p>
                <p className="text-sm text-blue-700">
                  Beberapa kontrak Anda akan berakhir dalam 30 hari. Kami akan mengirimkan
                  kontrak perpanjangan untuk ditandatangani.
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}


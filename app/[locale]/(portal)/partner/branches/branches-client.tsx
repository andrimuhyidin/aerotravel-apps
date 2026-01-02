/**
 * Partner Branches Client Component
 * Manage multiple business branches
 */

'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Building2,
  ChevronRight,
  MapPin,
  MoreHorizontal,
  Phone,
  Plus,
  Trash2,
  Users,
  Wallet,
} from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
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
import { cn } from '@/lib/utils';

type Branch = {
  id: string;
  name: string;
  address: string | null;
  phone: string | null;
  isHeadquarters: boolean;
  teamCount: number;
  bookingsCount: number;
  revenue: number;
  createdAt: string;
};

type BranchStats = {
  totalBranches: number;
  totalTeamMembers: number;
  totalRevenue: number;
};

const branchSchema = z.object({
  name: z.string().min(2, 'Nama cabang minimal 2 karakter'),
  address: z.string().optional(),
  phone: z.string().optional(),
});

type BranchFormData = z.infer<typeof branchSchema>;

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

type BranchesClientProps = {
  locale: string;
};

export function BranchesClient({ locale }: BranchesClientProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const form = useForm<BranchFormData>({
    resolver: zodResolver(branchSchema),
    defaultValues: {
      name: '',
      address: '',
      phone: '',
    },
  });

  // Fetch branch stats
  const { data: stats, isLoading: statsLoading } = useQuery<BranchStats>({
    queryKey: queryKeys.partner.branchStats,
    queryFn: async () => {
      const response = await apiClient.get<BranchStats>('/api/partner/branches/stats');
      return response;
    },
  });

  // Fetch branches
  const { data: branches, isLoading: branchesLoading } = useQuery<Branch[]>({
    queryKey: queryKeys.partner.branches,
    queryFn: async () => {
      const response = await apiClient.get<{ branches: Branch[] }>('/api/partner/branches');
      return response.branches;
    },
  });

  // Create mutation
  const createMutation = useMutation({
    mutationFn: async (data: BranchFormData) => {
      return apiClient.post('/api/partner/branches', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.partner.branches });
      queryClient.invalidateQueries({ queryKey: queryKeys.partner.branchStats });
      toast.success('Cabang berhasil dibuat!');
      setShowCreateDialog(false);
      form.reset();
    },
    onError: () => {
      toast.error('Gagal membuat cabang');
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiClient.delete(`/api/partner/branches/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.partner.branches });
      queryClient.invalidateQueries({ queryKey: queryKeys.partner.branchStats });
      toast.success('Cabang berhasil dihapus');
      setDeleteId(null);
    },
    onError: () => {
      toast.error('Gagal menghapus cabang');
    },
  });

  const handleSubmit = form.handleSubmit((data) => {
    createMutation.mutate(data);
  });

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <PageHeader
        title="Branches"
        description="Kelola cabang bisnis Anda"
        action={
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="mr-2 h-4 w-4" />
                Tambah Cabang
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Tambah Cabang Baru</DialogTitle>
                <DialogDescription>
                  Buat cabang baru untuk mengelola tim dan booking secara terpisah
                </DialogDescription>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nama Cabang</FormLabel>
                        <FormControl>
                          <Input placeholder="Cabang Jakarta Selatan" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="address"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Alamat (Opsional)</FormLabel>
                        <FormControl>
                          <Input placeholder="Jl. Sudirman No. 123" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Telepon (Opsional)</FormLabel>
                        <FormControl>
                          <Input placeholder="021-1234567" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <DialogFooter>
                    <Button type="submit" disabled={createMutation.isPending}>
                      {createMutation.isPending ? 'Membuat...' : 'Buat Cabang'}
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        }
      />

      <div className="space-y-4 px-4">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          {statsLoading ? (
            <>
              {[1, 2, 3].map((i) => (
                <Card key={i}>
                  <CardContent className="p-4">
                    <Skeleton className="h-12 w-full" />
                  </CardContent>
                </Card>
              ))}
            </>
          ) : (
            <>
              <Card>
                <CardContent className="p-4 text-center">
                  <Building2 className="mx-auto h-5 w-5 text-primary" />
                  <p className="mt-1 text-2xl font-bold">{stats?.totalBranches || 0}</p>
                  <p className="text-xs text-muted-foreground">Cabang</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <Users className="mx-auto h-5 w-5 text-blue-500" />
                  <p className="mt-1 text-2xl font-bold">{stats?.totalTeamMembers || 0}</p>
                  <p className="text-xs text-muted-foreground">Tim</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <Wallet className="mx-auto h-5 w-5 text-green-500" />
                  <p className="mt-1 text-lg font-bold">{formatCurrency(stats?.totalRevenue || 0)}</p>
                  <p className="text-xs text-muted-foreground">Total</p>
                </CardContent>
              </Card>
            </>
          )}
        </div>

        {/* Branch List */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Daftar Cabang</CardTitle>
            <CardDescription>Klik untuk melihat detail dan analytics</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {branchesLoading ? (
              <div className="space-y-3 p-4">
                {[1, 2].map((i) => (
                  <Skeleton key={i} className="h-24 w-full" />
                ))}
              </div>
            ) : branches && branches.length > 0 ? (
              <ScrollArea className="max-h-[500px]">
                <div className="divide-y">
                  {branches.map((branch) => (
                    <div
                      key={branch.id}
                      className="flex cursor-pointer items-center justify-between p-4 hover:bg-muted/50"
                      onClick={() => router.push(`/${locale}/partner/branches/${branch.id}`)}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={cn(
                            'flex h-10 w-10 items-center justify-center rounded-lg',
                            branch.isHeadquarters
                              ? 'bg-primary text-white'
                              : 'bg-muted'
                          )}
                        >
                          <Building2 className="h-5 w-5" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-medium">{branch.name}</p>
                            {branch.isHeadquarters && (
                              <Badge variant="secondary" className="text-xs">
                                HQ
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-3 text-xs text-muted-foreground">
                            {branch.address && (
                              <span className="flex items-center gap-1">
                                <MapPin className="h-3 w-3" />
                                {branch.address}
                              </span>
                            )}
                            <span className="flex items-center gap-1">
                              <Users className="h-3 w-3" />
                              {branch.teamCount} tim
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <p className="text-sm font-medium text-green-600">
                            {formatCurrency(branch.revenue)}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {branch.bookingsCount} bookings
                          </p>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation();
                                router.push(`/${locale}/partner/branches/${branch.id}`);
                              }}
                            >
                              Lihat Detail
                            </DropdownMenuItem>
                            {!branch.isHeadquarters && (
                              <DropdownMenuItem
                                className="text-red-600"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setDeleteId(branch.id);
                                }}
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Hapus
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Building2 className="mb-3 h-10 w-10 text-muted-foreground/50" />
                <p className="font-medium">Belum ada cabang</p>
                <p className="mb-4 text-sm text-muted-foreground">
                  Buat cabang pertama untuk mengelola tim secara terpisah
                </p>
                <Button onClick={() => setShowCreateDialog(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Tambah Cabang
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Cabang?</AlertDialogTitle>
            <AlertDialogDescription>
              Semua data cabang ini akan dipindahkan ke cabang utama. Tindakan ini tidak dapat
              dibatalkan.
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


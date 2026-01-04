'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Download,
  Eye,
  FileText,
  Filter,
  MoreHorizontal,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  X,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';

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
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import queryKeys from '@/lib/queries/query-keys';

type License = {
  id: string;
  licenseType: string;
  licenseNumber: string;
  licenseName: string;
  issuedBy: string;
  issuedDate: string;
  expiryDate: string | null;
  status: string;
  documentUrl: string | null;
  notes: string | null;
  daysUntilExpiry: number | null;
  asitaDetails: {
    nia: string;
    membershipType: string;
    dpdRegion: string | null;
    memberSince: string;
  } | null;
  createdAt: string;
  updatedAt: string;
  createdBy: string | null;
  updatedBy: string | null;
};

type LicensesResponse = {
  licenses: License[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

async function fetchLicenses(params: URLSearchParams): Promise<LicensesResponse> {
  const response = await fetch(`/api/admin/compliance/licenses?${params.toString()}`);
  if (!response.ok) {
    throw new Error('Failed to fetch licenses');
  }
  return response.json();
}

async function deleteLicense(id: string): Promise<void> {
  const response = await fetch(`/api/admin/compliance/licenses/${id}`, {
    method: 'DELETE',
  });
  if (!response.ok) {
    const data = await response.json();
    throw new Error(data.error || 'Failed to delete license');
  }
}

const licenseTypes = [
  { value: 'nib', label: 'NIB - Nomor Induk Berusaha' },
  { value: 'skdn', label: 'SKDN - Surat Keterangan Domisili Niaga' },
  { value: 'sisupar', label: 'SISUPAR - Sistem Informasi Usaha Pariwisata' },
  { value: 'tdup', label: 'TDUP - Tanda Daftar Usaha Pariwisata' },
  { value: 'asita', label: 'ASITA - Keanggotaan ASITA' },
  { value: 'chse', label: 'CHSE - Sertifikasi CHSE' },
];

const licenseTypeLabels: Record<string, string> = {
  nib: 'NIB',
  skdn: 'SKDN',
  sisupar: 'SISUPAR',
  tdup: 'TDUP',
  asita: 'ASITA',
  chse: 'CHSE',
};

const statusLabels: Record<string, string> = {
  valid: 'Valid',
  warning: 'Warning',
  critical: 'Critical',
  expired: 'Expired',
  suspended: 'Suspended',
};

const statusColors: Record<string, string> = {
  valid: 'bg-green-100 text-green-800 border-green-200',
  warning: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  critical: 'bg-red-100 text-red-800 border-red-200',
  expired: 'bg-gray-100 text-gray-800 border-gray-200',
  suspended: 'bg-purple-100 text-purple-800 border-purple-200',
};

function formatDate(dateString: string | null): string {
  if (!dateString) return '-';
  return new Date(dateString).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export function LicensesListClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();

  // State
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [typeFilter, setTypeFilter] = useState(searchParams.get('type') || 'all');
  const [statusFilter, setStatusFilter] = useState(searchParams.get('status') || 'all');
  const [page, setPage] = useState(parseInt(searchParams.get('page') || '1', 10));
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [licenseToDelete, setLicenseToDelete] = useState<License | null>(null);

  // Build query params
  const buildParams = () => {
    const params = new URLSearchParams();
    params.set('page', page.toString());
    params.set('limit', '10');
    if (search) params.set('search', search);
    if (typeFilter && typeFilter !== 'all') params.set('type', typeFilter);
    if (statusFilter && statusFilter !== 'all') params.set('status', statusFilter);
    return params;
  };

  // Query
  const { data, isLoading, error, refetch, isFetching } = useQuery({
    queryKey: queryKeys.admin.compliance.licenses({ page, search, type: typeFilter, status: statusFilter }),
    queryFn: () => fetchLicenses(buildParams()),
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: deleteLicense,
    onSuccess: () => {
      toast.success('Izin berhasil dihapus');
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.compliance.licenses() });
      setDeleteDialogOpen(false);
      setLicenseToDelete(null);
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Gagal menghapus izin');
    },
  });

  // Handlers
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
  };

  const handleClearFilters = () => {
    setSearch('');
    setTypeFilter('all');
    setStatusFilter('all');
    setPage(1);
  };

  const handleDeleteClick = (license: License) => {
    setLicenseToDelete(license);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (licenseToDelete) {
      deleteMutation.mutate(licenseToDelete.id);
    }
  };

  const hasFilters = search || (typeFilter && typeFilter !== 'all') || (statusFilter && statusFilter !== 'all');

  if (error) {
    return (
      <Card className="border-destructive">
        <CardContent className="pt-6">
          <div className="text-center py-8">
            <AlertCircle className="h-12 w-12 mx-auto text-destructive mb-3" />
            <p className="text-destructive font-medium">Gagal memuat data izin</p>
            <Button variant="outline" className="mt-4" onClick={() => refetch()}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Coba Lagi
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Daftar Izin Usaha</h1>
          <p className="text-muted-foreground">
            Kelola semua izin usaha perusahaan
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isFetching}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isFetching ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button size="sm" asChild>
            <Link href="/console/compliance/licenses/new">
              <Plus className="h-4 w-4 mr-2" />
              Tambah Izin
            </Link>
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Cari nama atau nomor izin..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-full sm:w-[200px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Jenis Izin" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Jenis</SelectItem>
                {licenseTypes.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[160px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Status</SelectItem>
                <SelectItem value="valid">Valid</SelectItem>
                <SelectItem value="warning">Warning</SelectItem>
                <SelectItem value="critical">Critical</SelectItem>
                <SelectItem value="expired">Expired</SelectItem>
              </SelectContent>
            </Select>
            {hasFilters && (
              <Button type="button" variant="ghost" size="icon" onClick={handleClearFilters}>
                <X className="h-4 w-4" />
              </Button>
            )}
          </form>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Izin Terdaftar
          </CardTitle>
          <CardDescription>
            {data?.pagination.total || 0} izin ditemukan
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : !data?.licenses.length ? (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
              <p className="text-muted-foreground">
                {hasFilters ? 'Tidak ada izin yang cocok dengan filter' : 'Belum ada izin yang terdaftar'}
              </p>
              {!hasFilters && (
                <Button className="mt-4" asChild>
                  <Link href="/console/compliance/licenses/new">
                    <Plus className="h-4 w-4 mr-2" />
                    Tambah Izin Pertama
                  </Link>
                </Button>
              )}
            </div>
          ) : (
            <>
              <div className="rounded-md border overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[100px]">Jenis</TableHead>
                      <TableHead>Nama Izin</TableHead>
                      <TableHead>Nomor</TableHead>
                      <TableHead>Penerbit</TableHead>
                      <TableHead>Berlaku s/d</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Aksi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.licenses.map((license) => (
                      <TableRow key={license.id}>
                        <TableCell>
                          <Badge variant="outline" className="font-mono">
                            {licenseTypeLabels[license.licenseType] || license.licenseType.toUpperCase()}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">{license.licenseName}</p>
                            {license.asitaDetails && (
                              <p className="text-xs text-muted-foreground">
                                NIA: {license.asitaDetails.nia}
                              </p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="font-mono text-sm">
                          {license.licenseNumber}
                        </TableCell>
                        <TableCell>{license.issuedBy}</TableCell>
                        <TableCell>
                          <div>
                            <p>{formatDate(license.expiryDate)}</p>
                            {license.daysUntilExpiry !== null && license.status !== 'expired' && (
                              <p className={`text-xs ${license.daysUntilExpiry <= 7 ? 'text-red-600' : license.daysUntilExpiry <= 30 ? 'text-yellow-600' : 'text-muted-foreground'}`}>
                                {license.daysUntilExpiry} hari lagi
                              </p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={statusColors[license.status]}>
                            {statusLabels[license.status] || license.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem asChild>
                                <Link href={`/console/compliance/licenses/${license.id}`}>
                                  <Eye className="h-4 w-4 mr-2" />
                                  Lihat Detail
                                </Link>
                              </DropdownMenuItem>
                              <DropdownMenuItem asChild>
                                <Link href={`/console/compliance/licenses/${license.id}/edit`}>
                                  <Pencil className="h-4 w-4 mr-2" />
                                  Edit
                                </Link>
                              </DropdownMenuItem>
                              {license.documentUrl && (
                                <DropdownMenuItem asChild>
                                  <a href={license.documentUrl} target="_blank" rel="noopener noreferrer">
                                    <Download className="h-4 w-4 mr-2" />
                                    Download Dokumen
                                  </a>
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                className="text-destructive"
                                onClick={() => handleDeleteClick(license)}
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Hapus
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              {data.pagination.totalPages > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <p className="text-sm text-muted-foreground">
                    Halaman {data.pagination.page} dari {data.pagination.totalPages}
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page === 1}
                    >
                      <ChevronLeft className="h-4 w-4 mr-1" />
                      Sebelumnya
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((p) => Math.min(data.pagination.totalPages, p + 1))}
                      disabled={page === data.pagination.totalPages}
                    >
                      Selanjutnya
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Izin?</AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin menghapus izin "{licenseToDelete?.licenseName}"?
              Tindakan ini tidak dapat dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? 'Menghapus...' : 'Hapus'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}


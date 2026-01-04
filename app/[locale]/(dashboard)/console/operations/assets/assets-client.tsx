/**
 * Assets Management Client Component
 * Asset CRUD with maintenance blocker and availability calendar
 */

'use client';

import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  AlertTriangle,
  Anchor,
  ArrowRight,
  Calendar,
  Car,
  CheckCircle2,
  Home,
  Package,
  Plus,
  RefreshCw,
  Settings,
  Wrench,
  XCircle,
} from 'lucide-react';
import { toast } from 'sonner';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import queryKeys from '@/lib/queries/query-keys';

type Asset = {
  id: string;
  name: string;
  type: 'boat' | 'villa' | 'vehicle' | 'equipment' | 'other';
  status: 'available' | 'in_use' | 'maintenance' | 'retired';
  capacity: number | null;
  location: string | null;
  notes: string | null;
  hasActiveMaintenance: boolean;
  nextMaintenanceDate: string | null;
  maintenanceReason: string | null;
};

type AssetsResponse = {
  assets: Asset[];
  stats: {
    total: number;
    available: number;
    inUse: number;
    maintenance: number;
    retired: number;
  };
};

async function fetchAssets(type: string, status: string): Promise<AssetsResponse> {
  const params = new URLSearchParams({ type, status });
  const response = await fetch(`/api/admin/assets?${params}`);
  if (!response.ok) throw new Error('Failed to fetch assets');
  return response.json();
}

export function AssetsClient() {
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showMaintenanceDialog, setShowMaintenanceDialog] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);

  const {
    data,
    isLoading,
    error,
    refetch,
    isRefetching,
  } = useQuery({
    queryKey: [...queryKeys.admin.all, 'assets', typeFilter, statusFilter],
    queryFn: () => fetchAssets(typeFilter, statusFilter),
  });

  useEffect(() => {
    if (error) {
      toast.error('Gagal memuat data assets');
    }
  }, [error]);

  const handleScheduleMaintenance = (asset: Asset) => {
    setSelectedAsset(asset);
    setShowMaintenanceDialog(true);
  };

  if (isLoading) {
    return <AssetsSkeleton />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Assets Management</h1>
          <p className="text-muted-foreground">
            Kelola kapal, villa, kendaraan, dan peralatan
          </p>
        </div>
        <div className="flex gap-2">
          <Button size="sm">
            <Plus className="mr-2 h-4 w-4" />
            Tambah Asset
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isRefetching}
          >
            <RefreshCw className={cn('mr-2 h-4 w-4', isRefetching && 'animate-spin')} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      {data?.stats && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <StatsCard
            title="Total Assets"
            value={data.stats.total}
            icon={Package}
            color="blue"
          />
          <StatsCard
            title="Available"
            value={data.stats.available}
            icon={CheckCircle2}
            color="green"
          />
          <StatsCard
            title="In Use"
            value={data.stats.inUse}
            icon={Settings}
            color="blue"
          />
          <StatsCard
            title="Maintenance"
            value={data.stats.maintenance}
            icon={Wrench}
            color="yellow"
            highlight={data.stats.maintenance > 0}
          />
          <StatsCard
            title="Retired"
            value={data.stats.retired}
            icon={XCircle}
            color="gray"
          />
        </div>
      )}

      {/* Filters and List */}
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="text-lg">Daftar Assets</CardTitle>
              <CardDescription>
                {data?.assets.length || 0} assets ditemukan
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-[130px]">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Type</SelectItem>
                  <SelectItem value="boat">Kapal</SelectItem>
                  <SelectItem value="villa">Villa</SelectItem>
                  <SelectItem value="vehicle">Kendaraan</SelectItem>
                  <SelectItem value="equipment">Peralatan</SelectItem>
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Status</SelectItem>
                  <SelectItem value="available">Available</SelectItem>
                  <SelectItem value="in_use">In Use</SelectItem>
                  <SelectItem value="maintenance">Maintenance</SelectItem>
                  <SelectItem value="retired">Retired</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Asset</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Capacity</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Maintenance</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data?.assets.map((asset) => (
                  <AssetRow
                    key={asset.id}
                    asset={asset}
                    onScheduleMaintenance={() => handleScheduleMaintenance(asset)}
                  />
                ))}
                {(!data?.assets || data.assets.length === 0) && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      Tidak ada asset ditemukan
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Schedule Maintenance Dialog */}
      <MaintenanceDialog
        open={showMaintenanceDialog}
        onOpenChange={setShowMaintenanceDialog}
        asset={selectedAsset}
        onSuccess={() => {
          refetch();
          toast.success('Maintenance berhasil dijadwalkan');
        }}
      />
    </div>
  );
}

// Sub-components

type StatsCardProps = {
  title: string;
  value: number;
  icon: React.ElementType;
  color: 'blue' | 'green' | 'yellow' | 'gray';
  highlight?: boolean;
};

function StatsCard({ title, value, icon: Icon, color, highlight }: StatsCardProps) {
  const colorClasses = {
    blue: 'text-blue-600 bg-blue-100 dark:bg-blue-900/30',
    green: 'text-green-600 bg-green-100 dark:bg-green-900/30',
    yellow: 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/30',
    gray: 'text-gray-600 bg-gray-100 dark:bg-gray-900/30',
  };

  return (
    <Card className={cn(highlight && 'border-yellow-500 bg-yellow-50 dark:bg-yellow-900/10')}>
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <div className={cn('rounded-lg p-2', colorClasses[color])}>
            <Icon className="h-4 w-4" />
          </div>
          <div>
            <p className="text-2xl font-bold">{value}</p>
            <p className="text-xs text-muted-foreground">{title}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

type AssetRowProps = {
  asset: Asset;
  onScheduleMaintenance: () => void;
};

function AssetRow({ asset, onScheduleMaintenance }: AssetRowProps) {
  const typeIcons = {
    boat: Anchor,
    villa: Home,
    vehicle: Car,
    equipment: Package,
    other: Package,
  };
  const Icon = typeIcons[asset.type];

  const typeLabels: Record<string, string> = {
    boat: 'Kapal',
    villa: 'Villa',
    vehicle: 'Kendaraan',
    equipment: 'Peralatan',
    other: 'Lainnya',
  };

  const statusColors = {
    available: 'default',
    in_use: 'secondary',
    maintenance: 'outline',
    retired: 'destructive',
  } as const;

  const statusLabels: Record<string, string> = {
    available: 'Available',
    in_use: 'In Use',
    maintenance: 'Maintenance',
    retired: 'Retired',
  };

  return (
    <TableRow className={cn(asset.status === 'maintenance' && 'bg-yellow-50 dark:bg-yellow-900/10')}>
      <TableCell>
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-muted p-2">
            <Icon className="h-4 w-4" />
          </div>
          <div>
            <p className="font-medium">{asset.name}</p>
            {asset.notes && (
              <p className="text-xs text-muted-foreground truncate max-w-[200px]">
                {asset.notes}
              </p>
            )}
          </div>
        </div>
      </TableCell>
      <TableCell>
        <Badge variant="outline">{typeLabels[asset.type]}</Badge>
      </TableCell>
      <TableCell>
        <Badge variant={statusColors[asset.status]}>
          {asset.status === 'available' && <CheckCircle2 className="mr-1 h-3 w-3" />}
          {asset.status === 'maintenance' && <Wrench className="mr-1 h-3 w-3" />}
          {statusLabels[asset.status]}
        </Badge>
      </TableCell>
      <TableCell>
        {asset.capacity ? `${asset.capacity} pax` : '-'}
      </TableCell>
      <TableCell>
        {asset.location || '-'}
      </TableCell>
      <TableCell>
        {asset.hasActiveMaintenance ? (
          <div className="flex items-center gap-1 text-yellow-600">
            <AlertTriangle className="h-3 w-3" />
            <span className="text-sm">
              {asset.nextMaintenanceDate
                ? new Date(asset.nextMaintenanceDate).toLocaleDateString('id-ID', {
                    day: 'numeric',
                    month: 'short',
                  })
                : 'Scheduled'}
            </span>
          </div>
        ) : (
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-xs"
            onClick={onScheduleMaintenance}
          >
            <Calendar className="mr-1 h-3 w-3" />
            Schedule
          </Button>
        )}
      </TableCell>
      <TableCell className="text-right">
        <Button variant="ghost" size="sm">
          <ArrowRight className="h-4 w-4" />
        </Button>
      </TableCell>
    </TableRow>
  );
}

type MaintenanceDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  asset: Asset | null;
  onSuccess: () => void;
};

function MaintenanceDialog({ open, onOpenChange, asset, onSuccess }: MaintenanceDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    startDate: '',
    endDate: '',
    reason: '',
    estimatedCost: '',
    notes: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!asset) return;

    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/admin/assets/${asset.id}/maintenance`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          estimatedCost: formData.estimatedCost ? parseInt(formData.estimatedCost, 10) : undefined,
        }),
      });

      if (!response.ok) throw new Error('Failed to schedule maintenance');

      onSuccess();
      onOpenChange(false);
      setFormData({
        startDate: '',
        endDate: '',
        reason: '',
        estimatedCost: '',
        notes: '',
      });
    } catch {
      toast.error('Gagal menjadwalkan maintenance');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Schedule Maintenance</DialogTitle>
          <DialogDescription>
            Jadwalkan maintenance untuk {asset?.name}. Asset akan tidak tersedia selama periode ini.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startDate">Tanggal Mulai</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endDate">Tanggal Selesai</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="reason">Alasan Maintenance</Label>
              <Input
                id="reason"
                value={formData.reason}
                onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                placeholder="e.g., Service rutin, Perbaikan mesin"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="estimatedCost">Estimasi Biaya (Rp)</Label>
              <Input
                id="estimatedCost"
                type="number"
                value={formData.estimatedCost}
                onChange={(e) => setFormData({ ...formData, estimatedCost: e.target.value })}
                placeholder="5000000"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">Catatan</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Catatan tambahan..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Batal
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Menjadwalkan...' : 'Jadwalkan'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function AssetsSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-9 w-32" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {[...Array(5)].map((_, i) => (
          <Card key={i}>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Skeleton className="h-10 w-10 rounded-lg" />
                <div>
                  <Skeleton className="h-6 w-12" />
                  <Skeleton className="h-3 w-16 mt-1" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      <Card>
        <CardContent className="p-6">
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}


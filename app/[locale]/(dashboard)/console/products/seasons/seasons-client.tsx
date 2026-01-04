/**
 * Seasons Management Client Component
 * Visual calendar for managing seasonal pricing
 */

'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { format, getDaysInMonth, startOfMonth, getDay, addMonths, subMonths } from 'date-fns';
import { id as localeId } from 'date-fns/locale';
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Percent,
  Plus,
  Save,
  Trash2,
  X,
} from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
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
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import queryKeys from '@/lib/queries/query-keys';
import { cn } from '@/lib/utils';

type Season = {
  id: string;
  branch_id: string | null;
  name: string;
  description: string | null;
  start_date: string;
  end_date: string;
  price_multiplier: number;
  color: string;
  is_active: boolean;
};

type SeasonsResponse = {
  seasons: Season[];
  total: number;
  activeSeason: Season | null;
  currentMultiplier: number;
};

const PRESET_COLORS = [
  '#ef4444', // red
  '#f97316', // orange
  '#eab308', // yellow
  '#22c55e', // green
  '#3b82f6', // blue
  '#8b5cf6', // purple
  '#ec4899', // pink
  '#6b7280', // gray
];

export function SeasonsClient() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [showDialog, setShowDialog] = useState(false);
  const [editingSeason, setEditingSeason] = useState<Season | null>(null);
  const [formData, setFormData] = useState<Partial<Season>>({});
  const queryClient = useQueryClient();

  const currentYear = currentMonth.getFullYear();

  const { data, isLoading } = useQuery<SeasonsResponse>({
    queryKey: queryKeys.admin.packages.seasons(currentYear),
    queryFn: async () => {
      const res = await fetch(`/api/admin/products/seasons?year=${currentYear}`);
      if (!res.ok) throw new Error('Failed to fetch seasons');
      return res.json();
    },
  });

  const createMutation = useMutation({
    mutationFn: async (season: Partial<Season>) => {
      const res = await fetch('/api/admin/products/seasons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(season),
      });
      if (!res.ok) throw new Error('Failed to create season');
      return res.json();
    },
    onSuccess: () => {
      toast.success('Season berhasil dibuat');
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.packages.all() });
      closeDialog();
    },
    onError: () => {
      toast.error('Gagal membuat season');
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (season: Partial<Season> & { id: string }) => {
      const res = await fetch('/api/admin/products/seasons', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(season),
      });
      if (!res.ok) throw new Error('Failed to update season');
      return res.json();
    },
    onSuccess: () => {
      toast.success('Season berhasil diupdate');
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.packages.all() });
      closeDialog();
    },
    onError: () => {
      toast.error('Gagal mengupdate season');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/admin/products/seasons?id=${id}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Failed to delete season');
      return res.json();
    },
    onSuccess: () => {
      toast.success('Season berhasil dihapus');
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.packages.all() });
    },
    onError: () => {
      toast.error('Gagal menghapus season');
    },
  });

  const openCreateDialog = () => {
    setEditingSeason(null);
    setFormData({
      name: '',
      description: '',
      start_date: format(currentMonth, 'yyyy-MM-dd'),
      end_date: format(addMonths(currentMonth, 1), 'yyyy-MM-dd'),
      price_multiplier: 1.0,
      color: '#3b82f6',
      is_active: true,
    });
    setShowDialog(true);
  };

  const openEditDialog = (season: Season) => {
    setEditingSeason(season);
    setFormData({ ...season });
    setShowDialog(true);
  };

  const closeDialog = () => {
    setShowDialog(false);
    setEditingSeason(null);
    setFormData({});
  };

  const handleSave = () => {
    if (!formData.name || !formData.start_date || !formData.end_date) {
      toast.error('Nama dan tanggal wajib diisi');
      return;
    }

    if (editingSeason) {
      updateMutation.mutate({ ...formData, id: editingSeason.id } as Season & { id: string });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleDelete = (id: string) => {
    if (confirm('Yakin ingin menghapus season ini?')) {
      deleteMutation.mutate(id);
    }
  };

  // Calendar rendering
  const renderCalendar = () => {
    const monthStart = startOfMonth(currentMonth);
    const daysInMonth = getDaysInMonth(currentMonth);
    const startDayOfWeek = getDay(monthStart);
    const days = [];

    // Empty cells for days before month start
    for (let i = 0; i < startDayOfWeek; i++) {
      days.push(<div key={`empty-${i}`} className="h-10" />);
    }

    // Days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = format(new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day), 'yyyy-MM-dd');
      const seasonsOnDay = (data?.seasons || []).filter(
        (s) => s.start_date <= date && s.end_date >= date && s.is_active
      );
      const season = seasonsOnDay[0];

      days.push(
        <div
          key={day}
          className={cn(
            'h-10 flex items-center justify-center text-sm rounded-md relative',
            season && 'text-white font-medium'
          )}
          style={{ backgroundColor: season?.color }}
          title={season?.name}
        >
          {day}
          {season && (
            <div
              className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-white/50"
            />
          )}
        </div>
      );
    }

    return days;
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  const seasons = data?.seasons || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
            <CalendarDays className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Season Calendar</h1>
            <p className="text-sm text-muted-foreground">
              Kelola periode musiman dan harga dinamis
            </p>
          </div>
        </div>
        <Button onClick={openCreateDialog}>
          <Plus className="h-4 w-4 mr-2" />
          Tambah Season
        </Button>
      </div>

      {/* Current Multiplier */}
      {data?.activeSeason && (
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="p-4 flex items-center gap-4">
            <div
              className="h-10 w-10 rounded-full flex items-center justify-center"
              style={{ backgroundColor: data.activeSeason.color }}
            >
              <Percent className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="font-medium">{data.activeSeason.name}</p>
              <p className="text-sm text-muted-foreground">
                Multiplier aktif: {(data.currentMultiplier * 100).toFixed(0)}%
                {data.currentMultiplier > 1
                  ? ` (+${((data.currentMultiplier - 1) * 100).toFixed(0)}%)`
                  : data.currentMultiplier < 1
                  ? ` (${((data.currentMultiplier - 1) * 100).toFixed(0)}%)`
                  : ' (Normal)'}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Calendar View */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Kalender</CardTitle>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="font-medium min-w-32 text-center">
                  {format(currentMonth, 'MMMM yyyy', { locale: localeId })}
                </span>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-7 gap-1 mb-2">
              {['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'].map((day) => (
                <div key={day} className="h-8 flex items-center justify-center text-xs font-medium text-muted-foreground">
                  {day}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-1">{renderCalendar()}</div>
          </CardContent>
        </Card>

        {/* Seasons List */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Daftar Season</CardTitle>
            <CardDescription>{seasons.length} season terdaftar</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {seasons.map((season) => (
              <div
                key={season.id}
                className="p-3 border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors"
                onClick={() => openEditDialog(season)}
              >
                <div className="flex items-center gap-2 mb-1">
                  <div
                    className="h-3 w-3 rounded-full"
                    style={{ backgroundColor: season.color }}
                  />
                  <span className="font-medium text-sm">{season.name}</span>
                  {!season.is_active && (
                    <Badge variant="secondary" className="text-xs">
                      Nonaktif
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  {format(new Date(season.start_date), 'd MMM', { locale: localeId })} -{' '}
                  {format(new Date(season.end_date), 'd MMM yyyy', { locale: localeId })}
                </p>
                <p className="text-xs font-medium mt-1">
                  Multiplier: {(season.price_multiplier * 100).toFixed(0)}%
                </p>
              </div>
            ))}

            {seasons.length === 0 && (
              <p className="text-center text-sm text-muted-foreground py-4">
                Belum ada season
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingSeason ? 'Edit Season' : 'Tambah Season Baru'}</DialogTitle>
            <DialogDescription>
              Atur periode dan multiplier harga untuk season ini
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Nama Season</Label>
              <Input
                value={formData.name || ''}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Contoh: Peak Season Lebaran"
              />
            </div>

            <div className="space-y-2">
              <Label>Deskripsi</Label>
              <Textarea
                value={formData.description || ''}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Deskripsi opsional..."
                rows={2}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Tanggal Mulai</Label>
                <Input
                  type="date"
                  value={formData.start_date || ''}
                  onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Tanggal Selesai</Label>
                <Input
                  type="date"
                  value={formData.end_date || ''}
                  onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Price Multiplier</Label>
              <div className="flex items-center gap-3">
                <Input
                  type="number"
                  step="0.05"
                  min="0.5"
                  max="3"
                  value={formData.price_multiplier || 1}
                  onChange={(e) =>
                    setFormData({ ...formData, price_multiplier: parseFloat(e.target.value) })
                  }
                  className="w-24"
                />
                <span className="text-sm text-muted-foreground">
                  = {((formData.price_multiplier || 1) * 100).toFixed(0)}% dari harga normal
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Warna</Label>
              <div className="flex gap-2">
                {PRESET_COLORS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    className={cn(
                      'h-8 w-8 rounded-full transition-transform',
                      formData.color === color && 'ring-2 ring-offset-2 ring-primary scale-110'
                    )}
                    style={{ backgroundColor: color }}
                    onClick={() => setFormData({ ...formData, color })}
                  />
                ))}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Switch
                checked={formData.is_active ?? true}
                onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
              />
              <Label>Season Aktif</Label>
            </div>
          </div>

          <DialogFooter className="flex-col-reverse sm:flex-row gap-2">
            {editingSeason && (
              <Button
                variant="destructive"
                onClick={() => {
                  handleDelete(editingSeason.id);
                  closeDialog();
                }}
                disabled={deleteMutation.isPending}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Hapus
              </Button>
            )}
            <div className="flex-1" />
            <Button variant="outline" onClick={closeDialog}>
              <X className="h-4 w-4 mr-2" />
              Batal
            </Button>
            <Button
              onClick={handleSave}
              disabled={createMutation.isPending || updateMutation.isPending}
            >
              {(createMutation.isPending || updateMutation.isPending) ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              Simpan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}


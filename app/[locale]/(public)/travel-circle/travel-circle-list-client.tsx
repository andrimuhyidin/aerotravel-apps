/**
 * Travel Circle List Client Component
 * Displays user's travel circles with create/join options
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { format } from 'date-fns';
import { id as localeId } from 'date-fns/locale';
import {
  Calendar,
  Loader2,
  MapPin,
  Plus,
  Target,
  UserPlus,
  Users,
} from 'lucide-react';
import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { logger } from '@/lib/utils/logger';
import { toast } from 'sonner';

type TravelCircle = {
  id: string;
  name: string;
  description: string | null;
  targetAmount: number;
  targetDate: string;
  currentAmount: number;
  status: string;
  isAdmin: boolean;
  memberStatus: string;
  targetContribution: number;
  currentContribution: number;
  package: {
    id: string;
    name: string;
    destination: string;
    slug: string;
  } | null;
};

type TravelCircleListClientProps = {
  locale: string;
};

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(amount);
}

function CircleCard({ circle, locale }: { circle: TravelCircle; locale: string }) {
  const progress = (circle.currentAmount / circle.targetAmount) * 100;

  return (
    <Link href={`/${locale}/travel-circle/${circle.id}`}>
      <Card className="transition-shadow hover:shadow-md">
        <CardContent className="p-4">
          <div className="mb-3 flex items-start justify-between">
            <div className="flex-1">
              <h3 className="font-semibold">{circle.name}</h3>
              {circle.package && (
                <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                  <MapPin className="h-3 w-3" />
                  {circle.package.destination}
                </div>
              )}
            </div>
            <div className="flex gap-1">
              {circle.isAdmin && (
                <Badge variant="outline" className="text-xs">Admin</Badge>
              )}
              <Badge variant={circle.status === 'completed' ? 'default' : 'secondary'} className="text-xs">
                {circle.status === 'completed' ? 'Tercapai' : 'Aktif'}
              </Badge>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Progress</span>
              <span className="font-medium">{progress.toFixed(0)}%</span>
            </div>
            <Progress value={progress} className="h-2" />
            <div className="flex justify-between text-xs">
              <span>{formatCurrency(circle.currentAmount)}</span>
              <span className="text-muted-foreground">{formatCurrency(circle.targetAmount)}</span>
            </div>
          </div>

          <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              Target: {format(new Date(circle.targetDate), 'd MMM yyyy', { locale: localeId })}
            </div>
            <div className="flex items-center gap-1">
              <Target className="h-3 w-3" />
              Kontribusi: {formatCurrency(circle.currentContribution)}
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

export function TravelCircleListClient({ locale }: TravelCircleListClientProps) {
  const [circles, setCircles] = useState<TravelCircle[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [joinOpen, setJoinOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [joining, setJoining] = useState(false);

  // Form state
  const [newCircle, setNewCircle] = useState({
    name: '',
    description: '',
    targetAmount: '',
    targetDate: '',
    memberCount: '4',
  });
  const [joinCode, setJoinCode] = useState('');

  const fetchCircles = useCallback(async () => {
    try {
      const response = await fetch('/api/public/travel-circle');
      if (!response.ok) {
        if (response.status === 401) {
          setCircles([]);
          return;
        }
        throw new Error('Failed to fetch');
      }
      const data = await response.json();
      setCircles(data.circles || []);
    } catch (error) {
      logger.error('Failed to fetch travel circles', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCircles();
  }, [fetchCircles]);

  const handleCreate = async () => {
    if (!newCircle.name || !newCircle.targetAmount || !newCircle.targetDate) {
      toast.error('Mohon lengkapi semua field');
      return;
    }

    setCreating(true);
    try {
      const response = await fetch('/api/public/travel-circle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newCircle.name,
          description: newCircle.description,
          targetAmount: Number(newCircle.targetAmount),
          targetDate: newCircle.targetDate,
          memberCount: Number(newCircle.memberCount),
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create circle');
      }

      const data = await response.json();
      toast.success(`Circle "${data.name}" berhasil dibuat!`);
      setCreateOpen(false);
      setNewCircle({ name: '', description: '', targetAmount: '', targetDate: '', memberCount: '4' });
      fetchCircles();
    } catch (error) {
      logger.error('Failed to create circle', error);
      toast.error('Gagal membuat circle');
    } finally {
      setCreating(false);
    }
  };

  const handleJoin = async () => {
    if (!joinCode) {
      toast.error('Masukkan kode circle');
      return;
    }

    setJoining(true);
    try {
      // Convert code to circle ID (first 8 chars of UUID)
      const circleIdPrefix = joinCode.toLowerCase();
      
      // Try to find circle by code (we'll search by id starting with this prefix)
      const response = await fetch(`/api/public/travel-circle/${circleIdPrefix}/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to join');
      }

      const data = await response.json();
      toast.success(`Berhasil bergabung ke ${data.circleName}!`);
      setJoinOpen(false);
      setJoinCode('');
      fetchCircles();
    } catch (error) {
      logger.error('Failed to join circle', error);
      toast.error('Gagal bergabung. Pastikan kode benar.');
    } finally {
      setJoining(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4 px-4 pb-24">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold">Travel Circle</h1>
          <p className="text-xs text-muted-foreground">Nabung bareng untuk liburan</p>
        </div>
        <div className="flex gap-2">
          {/* Join Dialog */}
          <Dialog open={joinOpen} onOpenChange={setJoinOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <UserPlus className="mr-1 h-4 w-4" />
                Join
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Join Circle</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Kode Circle</Label>
                  <Input
                    placeholder="Masukkan kode 8 karakter"
                    value={joinCode}
                    onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                    maxLength={8}
                  />
                  <p className="mt-1 text-xs text-muted-foreground">
                    Minta kode dari admin circle
                  </p>
                </div>
                <Button onClick={handleJoin} disabled={joining} className="w-full">
                  {joining ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  Gabung
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          {/* Create Dialog */}
          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="mr-1 h-4 w-4" />
                Buat
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Buat Travel Circle</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Nama Circle *</Label>
                  <Input
                    placeholder="Contoh: Trip Pahawang 2024"
                    value={newCircle.name}
                    onChange={(e) => setNewCircle({ ...newCircle, name: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Deskripsi</Label>
                  <Textarea
                    placeholder="Deskripsi singkat..."
                    value={newCircle.description}
                    onChange={(e) => setNewCircle({ ...newCircle, description: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Target Dana *</Label>
                  <Input
                    type="number"
                    placeholder="5000000"
                    value={newCircle.targetAmount}
                    onChange={(e) => setNewCircle({ ...newCircle, targetAmount: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Target Tanggal *</Label>
                  <Input
                    type="date"
                    value={newCircle.targetDate}
                    onChange={(e) => setNewCircle({ ...newCircle, targetDate: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Estimasi Anggota</Label>
                  <Input
                    type="number"
                    placeholder="4"
                    value={newCircle.memberCount}
                    onChange={(e) => setNewCircle({ ...newCircle, memberCount: e.target.value })}
                  />
                </div>
                <Button onClick={handleCreate} disabled={creating} className="w-full">
                  {creating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  Buat Circle
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Circle List */}
      {circles.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center p-8 text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
              <Users className="h-8 w-8 text-primary" />
            </div>
            <h3 className="font-semibold">Belum Ada Circle</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Buat circle baru atau gabung ke circle teman
            </p>
            <div className="mt-4 flex gap-2">
              <Button variant="outline" onClick={() => setJoinOpen(true)}>
                <UserPlus className="mr-1 h-4 w-4" />
                Join Circle
              </Button>
              <Button onClick={() => setCreateOpen(true)}>
                <Plus className="mr-1 h-4 w-4" />
                Buat Circle
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {circles.map((circle) => (
            <CircleCard key={circle.id} circle={circle} locale={locale} />
          ))}
        </div>
      )}
    </div>
  );
}


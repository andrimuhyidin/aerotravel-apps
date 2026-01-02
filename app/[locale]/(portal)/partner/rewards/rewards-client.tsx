/**
 * Partner Rewards Client Component
 * Display reward points, history, milestones, and redemption form
 */

'use client';

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
import { EmptyState } from '@/components/ui/empty-state';
import { LoadingState } from '@/components/ui/loading-state';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { usePartnerAuth } from '@/hooks/use-partner-auth';
import { logger } from '@/lib/utils/logger';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Award,
  Gift,
  History,
  Loader2,
  Star,
  Trophy,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';
import { MIN_REDEMPTION_POINTS } from '@/lib/partner/reward-rules';

type RewardBalance = {
  balance: number;
  lifetimeEarned: number;
  lifetimeRedeemed: number;
  expiredPoints: number;
};

type RewardTransaction = {
  id: string;
  type: string;
  points: number;
  sourceType?: string;
  balanceBefore: number;
  balanceAfter: number;
  description?: string;
  createdAt: string;
};

type Milestone = {
  type: string;
  label: string;
  value: number;
  points: number;
  description: string;
  achieved: boolean;
  currentValue: number;
  progress: number;
  pointsAwarded: number;
  achievedAt?: string | null;
};

const redeemSchema = z.object({
  points: z.string().min(1, 'Jumlah poin wajib diisi').refine(
    (val) => {
      const num = parseInt(val.replace(/[^0-9]/g, ''), 10);
      return !isNaN(num) && num >= MIN_REDEMPTION_POINTS;
    },
    { message: `Minimum penukaran adalah ${MIN_REDEMPTION_POINTS} poin` }
  ),
});

export function RewardsClient() {
  const [activeTab, setActiveTab] = useState('milestones');
  const { partnerId } = usePartnerAuth();
  const [loading, setLoading] = useState(true);
  const [balance, setBalance] = useState<RewardBalance | null>(null);
  const [transactions, setTransactions] = useState<RewardTransaction[]>([]);
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [redeemDialogOpen, setRedeemDialogOpen] = useState(false);
  const [redeemLoading, setRedeemLoading] = useState(false);

  const redeemForm = useForm<z.infer<typeof redeemSchema>>({
    resolver: zodResolver(redeemSchema),
    defaultValues: {
      points: '',
    },
  });

  const loadRewardsData = async () => {
    if (!partnerId) return;

    try {
      setLoading(true);
      const [balanceRes, historyRes, milestonesRes] = await Promise.allSettled([
        fetch('/api/partner/rewards/points'),
        fetch('/api/partner/rewards/points?includeHistory=true&limit=20'),
        fetch('/api/partner/rewards/milestones'),
      ]);

      if (balanceRes.status === 'fulfilled' && balanceRes.value.ok) {
        const data = await balanceRes.value.json();
        setBalance(data.balance);
      }

      if (historyRes.status === 'fulfilled' && historyRes.value.ok) {
        const data = await historyRes.value.json();
        setTransactions(data.history || []);
      }

      if (milestonesRes.status === 'fulfilled' && milestonesRes.value.ok) {
        const data = await milestonesRes.value.json();
        setMilestones(data.milestones || []);
      }
    } catch (error) {
      logger.error('Failed to load rewards data', error);
      toast.error('Gagal memuat data reward points');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRewardsData();
  }, [partnerId]);

  const handleRedeem = async (data: z.infer<typeof redeemSchema>) => {
    if (!balance) return;

    const points = parseInt(data.points.replace(/[^0-9]/g, ''), 10);
    if (points > balance.balance) {
      toast.error('Poin tidak mencukupi');
      return;
    }

    setRedeemLoading(true);
    try {
      const response = await fetch('/api/partner/rewards/redeem', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ points }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to redeem points');
      }

      const result = await response.json();
      toast.success(result.message || 'Poin berhasil ditukar');

      setRedeemDialogOpen(false);
      redeemForm.reset();
      await loadRewardsData();
    } catch (error) {
      logger.error('Redeem points failed', error);
      toast.error(
        error instanceof Error
          ? error.message
          : 'Gagal menukar poin. Silakan coba lagi.'
      );
    } finally {
      setRedeemLoading(false);
    }
  };

  if (loading) {
    return <LoadingState message="Memuat data reward points..." />;
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Reward Points</h1>
        <p className="text-sm text-foreground/70">
          Kelola poin reward dan lihat milestone achievements
        </p>
      </div>

      {/* Balance Card */}
      {balance && (
        <Card className="bg-gradient-to-br from-primary/10 to-primary/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="h-5 w-5" />
              Saldo Poin Reward
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-bold text-primary">
                {balance.balance.toLocaleString('id-ID')}
              </span>
              <span className="text-sm text-foreground/70">poin</span>
            </div>
            <div className="grid grid-cols-3 gap-4 mt-4 text-sm">
              <div>
                <p className="text-foreground/70">Total Diperoleh</p>
                <p className="font-semibold">{balance.lifetimeEarned.toLocaleString('id-ID')}</p>
              </div>
              <div>
                <p className="text-foreground/70">Total Ditukar</p>
                <p className="font-semibold">{balance.lifetimeRedeemed.toLocaleString('id-ID')}</p>
              </div>
              <div>
                <p className="text-foreground/70">Kadaluarsa</p>
                <p className="font-semibold">{balance.expiredPoints.toLocaleString('id-ID')}</p>
              </div>
            </div>
            <Button
              onClick={() => setRedeemDialogOpen(true)}
              disabled={balance.balance < MIN_REDEMPTION_POINTS}
              className="mt-4"
            >
              <Gift className="h-4 w-4 mr-2" />
              Tukar Poin
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="milestones">
            <Trophy className="h-4 w-4 mr-2" />
            Milestones
          </TabsTrigger>
          <TabsTrigger value="history">
            <History className="h-4 w-4 mr-2" />
            Riwayat
          </TabsTrigger>
        </TabsList>

        <TabsContent value="milestones" className="space-y-4">
          {milestones.length === 0 ? (
            <EmptyState
              icon={Trophy}
              title="Belum ada milestone"
              description="Lakukan booking untuk mencapai milestone pertama"
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {milestones.map((milestone) => (
                <Card
                  key={milestone.type}
                  className={milestone.achieved ? 'border-primary bg-primary/5' : ''}
                >
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{milestone.label}</CardTitle>
                      {milestone.achieved && (
                        <Badge className="bg-primary">
                          <Star className="h-3 w-3 mr-1" />
                          Tercapai
                        </Badge>
                      )}
                    </div>
                    <CardDescription>{milestone.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Progress</span>
                        <span className="font-medium">
                          {milestone.currentValue.toLocaleString('id-ID')} / {milestone.value.toLocaleString('id-ID')}
                        </span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2">
                        <div
                          className="bg-primary h-2 rounded-full transition-all"
                          style={{ width: `${Math.min(100, milestone.progress)}%` }}
                        />
                      </div>
                      <div className="flex justify-between text-sm mt-2">
                        <span className="text-foreground/70">Poin Reward</span>
                        <span className="font-semibold text-primary">
                          +{milestone.points.toLocaleString('id-ID')} poin
                        </span>
                      </div>
                      {milestone.achieved && milestone.achievedAt && (
                        <p className="text-xs text-foreground/70 mt-2">
                          Dicapai: {new Date(milestone.achievedAt).toLocaleDateString('id-ID')}
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          {transactions.length === 0 ? (
            <EmptyState
              icon={History}
              title="Belum ada transaksi"
              description="Transaksi reward points akan muncul di sini"
            />
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Riwayat Transaksi</CardTitle>
                <CardDescription>20 transaksi terakhir</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {transactions.map((tx) => (
                    <div
                      key={tx.id}
                      className="flex items-center justify-between p-4 border rounded-lg"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{tx.description || 'Reward transaction'}</span>
                          {tx.sourceType && (
                            <Badge variant="outline" className="text-xs">
                              {tx.sourceType}
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-foreground/70 mt-1">
                          {new Date(tx.createdAt).toLocaleString('id-ID')}
                        </p>
                      </div>
                      <div className="text-right">
                        <p
                          className={`font-semibold ${
                            tx.type === 'earn' ? 'text-green-600' : 'text-red-600'
                          }`}
                        >
                          {tx.type === 'earn' ? '+' : '-'}
                          {Math.abs(tx.points).toLocaleString('id-ID')} poin
                        </p>
                        <p className="text-xs text-foreground/70">
                          Saldo: {tx.balanceAfter.toLocaleString('id-ID')}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Redeem Dialog */}
      <Dialog open={redeemDialogOpen} onOpenChange={setRedeemDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Tukar Poin Reward</DialogTitle>
            <DialogDescription>
              Tukar poin menjadi diskon. 1 poin = Rp 1 diskon
            </DialogDescription>
          </DialogHeader>
          <Form {...redeemForm}>
            <form
              onSubmit={redeemForm.handleSubmit(handleRedeem)}
              className="space-y-4"
            >
              <FormField
                control={redeemForm.control}
                name="points"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Jumlah Poin (Minimum {MIN_REDEMPTION_POINTS} poin)</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="100"
                        onChange={(e) => {
                          const value = e.target.value.replace(/[^0-9]/g, '');
                          field.onChange(value);
                        }}
                      />
                    </FormControl>
                    {balance && field.value && (
                      <p className="text-xs text-foreground/70">
                        Diskon: Rp {parseInt(field.value.replace(/[^0-9]/g, '') || '0', 10).toLocaleString('id-ID')}
                      </p>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setRedeemDialogOpen(false);
                    redeemForm.reset();
                  }}
                  disabled={redeemLoading}
                >
                  Batal
                </Button>
                <Button type="submit" disabled={redeemLoading}>
                  {redeemLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Memproses...
                    </>
                  ) : (
                    <>
                      <Gift className="h-4 w-4 mr-2" />
                      Tukar Poin
                    </>
                  )}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}


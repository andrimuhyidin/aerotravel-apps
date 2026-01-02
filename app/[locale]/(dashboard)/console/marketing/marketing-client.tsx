/**
 * Marketing Dashboard Client Component
 * Campaign management, promo codes, and analytics
 */

'use client';

import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowUpRight,
  BarChart3,
  Calendar,
  ChevronRight,
  DollarSign,
  Gift,
  Globe,
  Mail,
  Megaphone,
  Pause,
  Play,
  Plus,
  RefreshCw,
  Share2,
  Target,
  TrendingUp,
  Users,
} from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { cn } from '@/lib/utils';
import queryKeys from '@/lib/queries/query-keys';

type Campaign = {
  id: string;
  name: string;
  type: 'promo' | 'referral' | 'seo' | 'email' | 'social';
  status: 'draft' | 'active' | 'paused' | 'completed';
  startDate: string;
  endDate: string | null;
  budget: number;
  spent: number;
  conversions: number;
  revenue: number;
  roi: number | null;
};

type Promo = {
  id: string;
  code: string;
  name: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  usageLimit: number | null;
  usedCount: number;
  status: 'active' | 'expired' | 'exhausted' | 'scheduled';
  startDate: string;
  endDate: string;
  remainingUsage: number | null;
};

type CampaignsResponse = {
  campaigns: Campaign[];
  summary: {
    totalCampaigns: number;
    activeCampaigns: number;
    totalBudget: number;
    totalSpent: number;
    totalConversions: number;
    totalRevenue: number;
  };
};

type PromosResponse = {
  promos: Promo[];
  summary: {
    totalPromos: number;
    activePromos: number;
    totalUsed: number;
    expiredPromos: number;
  };
};

async function fetchCampaigns(): Promise<CampaignsResponse> {
  const response = await fetch('/api/admin/marketing/campaigns');
  if (!response.ok) throw new Error('Failed to fetch campaigns');
  return response.json();
}

async function fetchPromos(): Promise<PromosResponse> {
  const response = await fetch('/api/admin/marketing/promos');
  if (!response.ok) throw new Error('Failed to fetch promos');
  return response.json();
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function MarketingClient() {
  const [activeTab, setActiveTab] = useState('campaigns');

  const {
    data: campaignsData,
    isLoading: isLoadingCampaigns,
    error: campaignsError,
    refetch: refetchCampaigns,
    isRefetching: isRefetchingCampaigns,
  } = useQuery({
    queryKey: [...queryKeys.admin.all, 'marketing-campaigns'],
    queryFn: fetchCampaigns,
  });

  const {
    data: promosData,
    isLoading: isLoadingPromos,
    refetch: refetchPromos,
    isRefetching: isRefetchingPromos,
  } = useQuery({
    queryKey: [...queryKeys.admin.all, 'marketing-promos'],
    queryFn: fetchPromos,
  });

  useEffect(() => {
    if (campaignsError) {
      toast.error('Gagal memuat data campaign');
    }
  }, [campaignsError]);

  const isLoading = isLoadingCampaigns || isLoadingPromos;
  const isRefetching = isRefetchingCampaigns || isRefetchingPromos;

  if (isLoading) {
    return <MarketingSkeleton />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Marketing</h1>
          <p className="text-muted-foreground">
            Kelola campaign, promo, dan analytics marketing
          </p>
        </div>
        <div className="flex gap-2">
          <Button size="sm">
            <Plus className="mr-2 h-4 w-4" />
            Buat Campaign
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              refetchCampaigns();
              refetchPromos();
            }}
            disabled={isRefetching}
          >
            <RefreshCw className={cn('mr-2 h-4 w-4', isRefetching && 'animate-spin')} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      {campaignsData && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatsCard
            title="Total Revenue"
            value={formatCurrency(campaignsData.summary.totalRevenue)}
            subtitle="dari semua campaign"
            icon={DollarSign}
            color="green"
          />
          <StatsCard
            title="Total Conversions"
            value={campaignsData.summary.totalConversions.toString()}
            subtitle="bookings dari campaign"
            icon={Target}
            color="blue"
          />
          <StatsCard
            title="Active Campaigns"
            value={campaignsData.summary.activeCampaigns.toString()}
            subtitle={`dari ${campaignsData.summary.totalCampaigns} total`}
            icon={Megaphone}
            color="purple"
          />
          <StatsCard
            title="Budget Spent"
            value={formatCurrency(campaignsData.summary.totalSpent)}
            subtitle={`dari ${formatCurrency(campaignsData.summary.totalBudget)} budget`}
            icon={BarChart3}
            color="orange"
          />
        </div>
      )}

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="campaigns">
            <Megaphone className="mr-2 h-4 w-4" />
            Campaigns
          </TabsTrigger>
          <TabsTrigger value="promos">
            <Gift className="mr-2 h-4 w-4" />
            Promo Codes
          </TabsTrigger>
          <TabsTrigger value="referrals">
            <Share2 className="mr-2 h-4 w-4" />
            Referrals
          </TabsTrigger>
          <TabsTrigger value="seo">
            <Globe className="mr-2 h-4 w-4" />
            SEO
          </TabsTrigger>
        </TabsList>

        <TabsContent value="campaigns" className="mt-6">
          <CampaignsTab campaigns={campaignsData?.campaigns || []} />
        </TabsContent>

        <TabsContent value="promos" className="mt-6">
          <PromosTab promos={promosData?.promos || []} summary={promosData?.summary} />
        </TabsContent>

        <TabsContent value="referrals" className="mt-6">
          <ReferralsTab />
        </TabsContent>

        <TabsContent value="seo" className="mt-6">
          <SeoTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Sub-components

type StatsCardProps = {
  title: string;
  value: string;
  subtitle?: string;
  icon: React.ElementType;
  color: 'green' | 'blue' | 'purple' | 'orange';
};

function StatsCard({ title, value, subtitle, icon: Icon, color }: StatsCardProps) {
  const colorClasses = {
    green: 'text-green-600 bg-green-100 dark:bg-green-900/30',
    blue: 'text-blue-600 bg-blue-100 dark:bg-blue-900/30',
    purple: 'text-purple-600 bg-purple-100 dark:bg-purple-900/30',
    orange: 'text-orange-600 bg-orange-100 dark:bg-orange-900/30',
  };

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className={cn('rounded-lg p-2', colorClasses[color])}>
            <Icon className="h-5 w-5" />
          </div>
        </div>
        <div className="mt-4">
          <p className="text-2xl font-bold">{value}</p>
          <p className="text-sm text-muted-foreground">{title}</p>
          {subtitle && <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>}
        </div>
      </CardContent>
    </Card>
  );
}

function CampaignsTab({ campaigns }: { campaigns: Campaign[] }) {
  const typeIcons = {
    promo: Gift,
    referral: Share2,
    seo: Globe,
    email: Mail,
    social: Users,
  };

  const statusColors = {
    draft: 'secondary',
    active: 'default',
    paused: 'outline',
    completed: 'secondary',
  } as const;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Campaign List</CardTitle>
        <CardDescription>Semua campaign marketing aktif dan selesai</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Campaign</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Period</TableHead>
                <TableHead className="text-right">Budget</TableHead>
                <TableHead className="text-right">Conversions</TableHead>
                <TableHead className="text-right">Revenue</TableHead>
                <TableHead className="text-right">ROI</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {campaigns.map((campaign) => {
                const Icon = typeIcons[campaign.type];
                const spentPercentage =
                  campaign.budget > 0 ? (campaign.spent / campaign.budget) * 100 : 0;

                return (
                  <TableRow key={campaign.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="rounded-lg bg-muted p-2">
                          <Icon className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="font-medium">{campaign.name}</p>
                          <p className="text-xs text-muted-foreground capitalize">{campaign.type}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={statusColors[campaign.status]}>
                        {campaign.status === 'active' && <Play className="mr-1 h-3 w-3" />}
                        {campaign.status === 'paused' && <Pause className="mr-1 h-3 w-3" />}
                        {campaign.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {new Date(campaign.startDate).toLocaleDateString('id-ID', {
                          day: 'numeric',
                          month: 'short',
                        })}
                        {campaign.endDate && (
                          <>
                            {' - '}
                            {new Date(campaign.endDate).toLocaleDateString('id-ID', {
                              day: 'numeric',
                              month: 'short',
                            })}
                          </>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div>
                        <p className="text-sm font-medium">
                          {formatCurrency(campaign.spent)}
                        </p>
                        {campaign.budget > 0 && (
                          <div className="mt-1">
                            <Progress value={spentPercentage} className="h-1" />
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {campaign.conversions}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCurrency(campaign.revenue)}
                    </TableCell>
                    <TableCell className="text-right">
                      {campaign.roi !== null ? (
                        <Badge variant="outline" className="gap-1">
                          <ArrowUpRight className="h-3 w-3 text-green-600" />
                          {campaign.roi}%
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}

function PromosTab({
  promos,
  summary,
}: {
  promos: Promo[];
  summary?: PromosResponse['summary'];
}) {
  const statusColors = {
    active: 'default',
    expired: 'secondary',
    exhausted: 'destructive',
    scheduled: 'outline',
  } as const;

  return (
    <div className="space-y-6">
      {/* Promo Stats */}
      {summary && (
        <div className="grid gap-4 sm:grid-cols-4">
          <Card className="p-4">
            <p className="text-sm text-muted-foreground">Total Promos</p>
            <p className="text-2xl font-bold">{summary.totalPromos}</p>
          </Card>
          <Card className="p-4">
            <p className="text-sm text-muted-foreground">Active</p>
            <p className="text-2xl font-bold text-green-600">{summary.activePromos}</p>
          </Card>
          <Card className="p-4">
            <p className="text-sm text-muted-foreground">Total Used</p>
            <p className="text-2xl font-bold">{summary.totalUsed}</p>
          </Card>
          <Card className="p-4">
            <p className="text-sm text-muted-foreground">Expired</p>
            <p className="text-2xl font-bold text-muted-foreground">{summary.expiredPromos}</p>
          </Card>
        </div>
      )}

      {/* Promo List */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-lg">Promo Codes</CardTitle>
            <CardDescription>Kelola kode promo dan diskon</CardDescription>
          </div>
          <Button size="sm">
            <Plus className="mr-2 h-4 w-4" />
            Buat Promo
          </Button>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Kode</TableHead>
                  <TableHead>Diskon</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Period</TableHead>
                  <TableHead className="text-right">Usage</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {promos.map((promo) => (
                  <TableRow key={promo.id}>
                    <TableCell>
                      <div>
                        <p className="font-mono font-bold">{promo.code}</p>
                        <p className="text-xs text-muted-foreground">{promo.name}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      {promo.discountType === 'percentage' ? (
                        <span className="font-medium">{promo.discountValue}%</span>
                      ) : (
                        <span className="font-medium">{formatCurrency(promo.discountValue)}</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant={statusColors[promo.status]}>{promo.status}</Badge>
                    </TableCell>
                    <TableCell className="text-sm">
                      {new Date(promo.startDate).toLocaleDateString('id-ID', {
                        day: 'numeric',
                        month: 'short',
                      })}{' '}
                      -{' '}
                      {new Date(promo.endDate).toLocaleDateString('id-ID', {
                        day: 'numeric',
                        month: 'short',
                      })}
                    </TableCell>
                    <TableCell className="text-right">
                      <div>
                        <span className="font-medium">{promo.usedCount}</span>
                        {promo.usageLimit && (
                          <span className="text-muted-foreground">/{promo.usageLimit}</span>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function ReferralsTab() {
  // Sample referral data
  const referralStats = {
    totalReferrals: 342,
    successfulReferrals: 128,
    pendingReferrals: 45,
    totalCommission: 12800000,
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-4">
        <Card className="p-4">
          <p className="text-sm text-muted-foreground">Total Referrals</p>
          <p className="text-2xl font-bold">{referralStats.totalReferrals}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-muted-foreground">Successful</p>
          <p className="text-2xl font-bold text-green-600">{referralStats.successfulReferrals}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-muted-foreground">Pending</p>
          <p className="text-2xl font-bold text-yellow-600">{referralStats.pendingReferrals}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-muted-foreground">Total Commission</p>
          <p className="text-2xl font-bold">{formatCurrency(referralStats.totalCommission)}</p>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Referral Program</CardTitle>
          <CardDescription>
            Member Get Member - setiap referral sukses mendapat 10.000 poin
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border p-4 text-center">
            <Share2 className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
            <p className="text-muted-foreground">
              Lihat detail referral di halaman Partner Portal
            </p>
            <Button variant="outline" size="sm" className="mt-4" asChild>
              <Link href="/console/partners">
                Lihat Partners <ChevronRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function SeoTab() {
  // Sample SEO data
  const seoStats = {
    totalPages: 1245,
    indexedPages: 1180,
    organicTraffic: 15420,
    topKeywords: 89,
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-4">
        <Card className="p-4">
          <p className="text-sm text-muted-foreground">Generated Pages</p>
          <p className="text-2xl font-bold">{seoStats.totalPages.toLocaleString()}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-muted-foreground">Indexed</p>
          <p className="text-2xl font-bold text-green-600">{seoStats.indexedPages.toLocaleString()}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-muted-foreground">Organic Traffic</p>
          <p className="text-2xl font-bold">{seoStats.organicTraffic.toLocaleString()}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-muted-foreground">Top Keywords</p>
          <p className="text-2xl font-bold">{seoStats.topKeywords}</p>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Programmatic SEO</CardTitle>
          <CardDescription>
            AI Content Spinner menghasilkan halaman landing page otomatis
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between rounded-lg border p-4">
              <div>
                <p className="font-medium">Page Generation Status</p>
                <p className="text-sm text-muted-foreground">
                  {seoStats.indexedPages} dari {seoStats.totalPages} halaman ter-index
                </p>
              </div>
              <Progress
                value={(seoStats.indexedPages / seoStats.totalPages) * 100}
                className="w-32"
              />
            </div>
            <div className="flex items-center justify-between rounded-lg border p-4">
              <div>
                <p className="font-medium">Trigger Manual Generation</p>
                <p className="text-sm text-muted-foreground">
                  Generate halaman baru dari paket yang tersedia
                </p>
              </div>
              <Button size="sm">
                <RefreshCw className="mr-2 h-4 w-4" />
                Generate
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function MarketingSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-9 w-32" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <Skeleton className="h-10 w-10 rounded-lg" />
              <Skeleton className="h-8 w-32 mt-4" />
              <Skeleton className="h-4 w-24 mt-2" />
            </CardContent>
          </Card>
        ))}
      </div>
      <Skeleton className="h-10 w-96" />
      <Card>
        <CardContent className="p-6">
          <div className="space-y-4">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}


/**
 * Partners List Client Component
 * DataTable with search, filters, and pagination
 */

'use client';

import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Building2,
  CreditCard,
  MoreVertical,
  Search,
  TrendingUp,
} from 'lucide-react';
import Link from 'next/link';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DataTable, type DataTableColumn } from '@/components/ui/data-table';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Skeleton } from '@/components/ui/skeleton';
import queryKeys from '@/lib/queries/query-keys';
import { cn } from '@/lib/utils';

type Partner = {
  id: string;
  full_name: string | null;
  email: string | null;
  company_name: string | null;
  partner_tier: string | null;
  tier_auto_calculated: boolean | null;
  tier_assigned_at: string | null;
  created_at: string;
  is_active: boolean | null;
};

type PartnersResponse = {
  partners: Partner[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

async function fetchPartners(
  search: string,
  tier: string,
  page: number
): Promise<PartnersResponse> {
  const params = new URLSearchParams({
    search,
    tier,
    page: page.toString(),
    limit: '20',
  });
  const response = await fetch(`/api/admin/partners?${params.toString()}`);
  if (!response.ok) {
    throw new Error('Failed to fetch partners');
  }
  return response.json();
}

const tierColors: Record<string, string> = {
  bronze: 'bg-amber-100 text-amber-800 border-amber-200',
  silver: 'bg-gray-100 text-gray-800 border-gray-200',
  gold: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  platinum: 'bg-purple-100 text-purple-800 border-purple-200',
};

const tierLabels: Record<string, string> = {
  bronze: 'Bronze',
  silver: 'Silver',
  gold: 'Gold',
  platinum: 'Platinum',
};

type PartnersListClientProps = {
  locale: string;
};

function PartnersListSkeleton() {
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-96 mt-2" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex gap-4">
              <Skeleton className="h-10 flex-1" />
              <Skeleton className="h-10 w-32" />
              <Skeleton className="h-10 w-32" />
            </div>
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export function PartnersListClient({ locale }: PartnersListClientProps) {
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [tier, setTier] = useState('all');
  const [page, setPage] = useState(1);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const {
    data,
    isLoading,
    error,
    refetch,
    isRefetching,
  } = useQuery({
    queryKey: [...queryKeys.admin.all, 'partners', debouncedSearch, tier, page],
    queryFn: () => fetchPartners(debouncedSearch, tier, page),
  });

  if (isLoading) {
    return <PartnersListSkeleton />;
  }

  if (error) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="text-center">
            <p className="text-destructive mb-4">Error loading partners</p>
            <Button onClick={() => refetch()}>Retry</Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  const partners = data?.partners || [];
  const pagination = data?.pagination || { page: 1, limit: 20, total: 0, totalPages: 0 };

  const columns: DataTableColumn<Partner>[] = [
    {
      key: 'partner',
      header: 'Partner',
      accessor: (partner) => (
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
            <Building2 className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="font-medium">{partner.full_name || 'N/A'}</p>
            {partner.company_name && (
              <p className="text-xs text-muted-foreground">
                {partner.company_name}
              </p>
            )}
          </div>
        </div>
      ),
    },
    {
      key: 'email',
      header: 'Email',
      accessor: (partner) => (
        <span className="text-sm">{partner.email || '-'}</span>
      ),
    },
    {
      key: 'tier',
      header: 'Tier',
      accessor: (partner) => {
        const partnerTier = partner.partner_tier || 'bronze';
        const isAuto = partner.tier_auto_calculated ?? true;
        return (
          <div className="flex items-center gap-2">
            <Badge
              variant="outline"
              className={cn(
                'font-medium',
                tierColors[partnerTier] || tierColors.bronze
              )}
            >
              {tierLabels[partnerTier] || 'Bronze'}
            </Badge>
            {isAuto && (
              <Badge variant="outline" className="text-xs">
                Auto
              </Badge>
            )}
          </div>
        );
      },
    },
    {
      key: 'status',
      header: 'Status',
      accessor: (partner) => {
        const isActive = partner.is_active ?? true;
        return (
          <Badge variant={isActive ? 'default' : 'secondary'}>
            {isActive ? 'Active' : 'Inactive'}
          </Badge>
        );
      },
    },
    {
      key: 'created',
      header: 'Created',
      accessor: (partner) => (
        <span className="text-sm text-muted-foreground">
          {new Date(partner.created_at).toLocaleDateString('id-ID', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
          })}
        </span>
      ),
    },
    {
      key: 'actions',
      header: '',
      accessor: (partner) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem asChild>
              <Link href={`/${locale}/console/partners/${partner.id}/credit-limit`}>
                <CreditCard className="mr-2 h-4 w-4" />
                Credit Limit
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href={`/${locale}/console/partners/tiers`}>
                <TrendingUp className="mr-2 h-4 w-4" />
                Manage Tiers
              </Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
      className: 'w-[50px]',
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Partners</h1>
        <p className="text-muted-foreground">
          Manage partners and their tiers
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Filters</CardTitle>
              <CardDescription>
                {pagination.total} partners found
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search by name, email, or company..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            <Select value={tier} onValueChange={(value) => {
              setTier(value);
              setPage(1);
            }}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="All Tiers" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Tiers</SelectItem>
                <SelectItem value="bronze">Bronze</SelectItem>
                <SelectItem value="silver">Silver</SelectItem>
                <SelectItem value="gold">Gold</SelectItem>
                <SelectItem value="platinum">Platinum</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <DataTable
            columns={columns}
            data={partners}
            loading={isRefetching}
            emptyMessage="No partners found"
            emptyDescription="Try adjusting your filters or search query"
          />
        </CardContent>
      </Card>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Page {pagination.page} of {pagination.totalPages} ({pagination.total} total)
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => p + 1)}
              disabled={page >= pagination.totalPages}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}


'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { Plus, Search, Filter, Eye, Edit, Trash2, FileText } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { logger } from '@/lib/utils/logger';

type Package = {
  id: string;
  code: string;
  name: string;
  destination: string;
  status: 'draft' | 'published' | 'archived';
  duration_days: number;
  duration_nights: number;
  min_pax: number;
  max_pax: number;
  package_prices: Array<{
    price_publish: number;
    price_nta: number;
    is_active: boolean;
  }>;
  created_at: string;
};

export function ProductsManagementClient({
  userBranchId,
  userRole,
}: {
  userBranchId: string;
  userRole: string;
}) {
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['admin-packages', statusFilter, searchQuery],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (statusFilter && statusFilter !== 'all') {
        params.append('status', statusFilter);
      }
      if (searchQuery) {
        params.append('search', searchQuery);
      }

      const response = await fetch(`/api/admin/packages?${params.toString()}`);
      if (!response.ok) {
        throw new Error('Failed to fetch packages');
      }
      return response.json();
    },
  });

  const packages = data?.packages || [];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'published':
        return <Badge className="bg-green-500">Published</Badge>;
      case 'draft':
        return <Badge variant="secondary">Draft</Badge>;
      case 'archived':
        return <Badge variant="outline">Archived</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(price);
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Package Management</h1>
          <p className="text-muted-foreground">
            Manage travel packages - create, edit, and publish
          </p>
        </div>
        <Link href="/console/products/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Create Package
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search packages..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="published">Published</SelectItem>
                <SelectItem value="archived">Archived</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-8 text-center">
              <p className="text-muted-foreground">Loading packages...</p>
            </div>
          ) : error ? (
            <div className="p-8 text-center">
              <p className="text-destructive">Failed to load packages</p>
              <Button variant="outline" onClick={() => refetch()} className="mt-4">
                Retry
              </Button>
            </div>
          ) : packages.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-muted-foreground">No packages found</p>
              <Link href="/console/products/new">
                <Button variant="outline" className="mt-4">
                  <Plus className="mr-2 h-4 w-4" />
                  Create Your First Package
                </Button>
              </Link>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Code</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Destination</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Capacity</TableHead>
                  <TableHead>Price Range</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {packages.map((pkg: Package) => {
                  const prices = pkg.package_prices.filter((p) => p.is_active);
                  const minPrice = Math.min(...prices.map((p) => p.price_publish));
                  const maxPrice = Math.max(...prices.map((p) => p.price_publish));

                  return (
                    <TableRow key={pkg.id}>
                      <TableCell className="font-mono text-sm">{pkg.code}</TableCell>
                      <TableCell className="font-medium">{pkg.name}</TableCell>
                      <TableCell>{pkg.destination}</TableCell>
                      <TableCell>
                        {pkg.duration_days}D{pkg.duration_nights}N
                      </TableCell>
                      <TableCell>
                        {pkg.min_pax}-{pkg.max_pax} pax
                      </TableCell>
                      <TableCell>
                        {minPrice === maxPrice
                          ? formatPrice(minPrice)
                          : `${formatPrice(minPrice)} - ${formatPrice(maxPrice)}`}
                      </TableCell>
                      <TableCell>{getStatusBadge(pkg.status)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Link href={`/console/products/${pkg.id}`}>
                            <Button variant="ghost" size="icon">
                              <Eye className="h-4 w-4" />
                            </Button>
                          </Link>
                          <Link href={`/console/products/${pkg.id}/edit`}>
                            <Button variant="ghost" size="icon">
                              <Edit className="h-4 w-4" />
                            </Button>
                          </Link>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}


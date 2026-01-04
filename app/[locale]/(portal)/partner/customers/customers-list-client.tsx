/**
 * Partner Customers List Client Component
 * REDESIGNED - Clean cards, Search, Quick view
 */

'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { PageHeader, FilterBar } from '@/components/partner';
import { formatCurrency } from '@/lib/partner/package-utils';
import { logger } from '@/lib/utils/logger';
import { Search, Users, Mail, Phone, Plus, Eye } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

type Customer = {
  id: string;
  name: string;
  email: string;
  phone: string;
  totalBookings: number;
  lifetimeValue: number;
};

export function CustomersListClient({ locale }: { locale: string }) {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadCustomers();
  }, [searchQuery]);

  const loadCustomers = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ ...(searchQuery && { search: searchQuery }) });
      const res = await fetch(`/api/partner/customers?${params}`);
      if (!res.ok) throw new Error('Failed to fetch customers');
      const data = (await res.json()) as { customers: Customer[] };
      setCustomers(data.customers);
    } catch (error) {
      logger.error('Failed to load customers', error);
      toast.error('Gagal memuat data customer');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <PageHeader
        title="Database Customer"
        description="Kelola data customer Anda"
        action={
          <Button asChild>
            <Link href={`/${locale}/partner/customers/new`}>
              <Plus className="mr-2 h-4 w-4" />
              Tambah
            </Link>
          </Button>
        }
      />

      <FilterBar className="mx-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" />
          <Input
            placeholder="Cari customer..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-10 pl-10"
          />
        </div>
      </FilterBar>

      <div className="space-y-2 px-4 pb-20">
        {loading ? (
          Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-32" />)
        ) : customers.length === 0 ? (
          <EmptyState
            icon={Users}
            title="Belum ada customer"
            description="Tambah customer pertama Anda"
          />
        ) : (
          customers.map((customer) => (
            <Card key={customer.id} className="hover:shadow-md">
              <CardContent className="space-y-2 p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold text-foreground">{customer.name}</h3>
                    <div className="mt-1 space-y-1 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Mail className="h-3 w-3" />
                        {customer.email}
                      </div>
                      <div className="flex items-center gap-1">
                        <Phone className="h-3 w-3" />
                        {customer.phone}
                      </div>
                    </div>
                  </div>
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/${locale}/partner/customers/${customer.id}`}>
                      <Eye className="h-3 w-3" />
                    </Link>
                  </Button>
                </div>
                <div className="flex items-center gap-4 border-t pt-2 text-sm">
                  <span className="text-muted-foreground">
                    {customer.totalBookings} bookings
                  </span>
                  <span className="font-semibold text-foreground">
                    LTV: {formatCurrency(customer.lifetimeValue)}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}

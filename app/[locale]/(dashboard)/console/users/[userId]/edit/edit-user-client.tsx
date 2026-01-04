/**
 * Edit User Client Component
 * Wrapper for edit user form with data fetching
 */

'use client';

import { useQuery } from '@tanstack/react-query';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import queryKeys from '@/lib/queries/query-keys';

import { EditUserForm } from './edit-user-form';

type UserDetail = {
  id: string;
  full_name: string | null;
  phone: string | null;
  role: string;
  branch_id: string | null;
  is_active: boolean;
  created_at: string;
  employee_number: string | null;
  hire_date: string | null;
  supervisor_id: string | null;
  supervisor_name: string | null;
  home_address: string | null;
  address: string | null;
  employment_status: string | null;
};

type EditUserClientProps = {
  userId: string;
  locale: string;
};

async function fetchUserDetail(userId: string): Promise<UserDetail> {
  const response = await fetch(`/api/admin/users/${userId}`);
  if (!response.ok) {
    throw new Error('Failed to fetch user details');
  }
  const data = await response.json();
  return data.user;
}

export function EditUserClient({ userId, locale }: EditUserClientProps) {
  const {
    data: user,
    isLoading,
    error,
  } = useQuery({
    queryKey: [...queryKeys.admin.all, 'users', userId],
    queryFn: () => fetchUserDetail(userId),
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10" />
          <Skeleton className="h-8 w-64" />
        </div>
        <Card>
          <CardContent className="p-6">
            <div className="space-y-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-32 w-full" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="text-center">
            <p className="text-destructive mb-4">Error loading user</p>
            <Button asChild>
              <Link href={`/${locale}/console/users`}>Back to Users</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!user) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="text-center">
            <p className="text-muted-foreground mb-4">User not found</p>
            <Button asChild>
              <Link href={`/${locale}/console/users`}>Back to Users</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/${locale}/console/users/${userId}`}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Edit User</h1>
          <p className="text-muted-foreground">
            {user.full_name || 'User'}
          </p>
        </div>
      </div>

      <EditUserForm user={user} locale={locale} />
    </div>
  );
}


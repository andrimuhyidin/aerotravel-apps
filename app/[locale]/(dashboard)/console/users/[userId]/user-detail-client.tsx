/**
 * User Detail Client Component
 * Display user profile, roles, permissions, and activity history
 */

'use client';

import { useQuery } from '@tanstack/react-query';
import {
  ArrowLeft,
  Calendar,
  Edit,
  MapPin,
  Phone,
  Shield,
  User,
  UserCheck,
  UserX,
} from 'lucide-react';
import Link from 'next/link';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DataTable, type DataTableColumn } from '@/components/ui/data-table';
import queryKeys from '@/lib/queries/query-keys';
import { cn } from '@/lib/utils';

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

type UserRole = {
  id: string;
  role: string;
  status: string;
  is_primary: boolean;
  created_at: string;
};

type ActivityLog = {
  id: string;
  action: string;
  resource_type: string;
  resource_id: string;
  created_at: string;
  user: {
    name: string;
    email: string;
  };
};

type UserDetailClientProps = {
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

async function fetchUserRoles(userId: string): Promise<UserRole[]> {
  const response = await fetch(`/api/admin/roles/users/${userId}`);
  if (!response.ok) {
    throw new Error('Failed to fetch user roles');
  }
  const data = await response.json();
  return data.roles || [];
}

async function fetchActivityLog(userId: string): Promise<ActivityLog[]> {
  // Fetch from audit log filtered by user_id
  const response = await fetch(
    `/api/admin/audit-log?resource=user&resourceId=${userId}&limit=50`
  );
  if (!response.ok) {
    return [];
  }
  const data = await response.json();
  return data.logs || [];
}

const roleColors: Record<string, string> = {
  super_admin: 'bg-red-100 text-red-800 border-red-200',
  admin: 'bg-purple-100 text-purple-800 border-purple-200',
  finance_manager: 'bg-blue-100 text-blue-800 border-blue-200',
  ops_admin: 'bg-orange-100 text-orange-800 border-orange-200',
  marketing: 'bg-pink-100 text-pink-800 border-pink-200',
  guide: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  mitra: 'bg-cyan-100 text-cyan-800 border-cyan-200',
  customer: 'bg-slate-100 text-slate-800 border-slate-200',
  corporate: 'bg-indigo-100 text-indigo-800 border-indigo-200',
};

const roleLabels: Record<string, string> = {
  super_admin: 'Super Admin',
  admin: 'Admin',
  finance_manager: 'Finance Manager',
  ops_admin: 'Ops Admin',
  marketing: 'Marketing',
  guide: 'Guide',
  mitra: 'Mitra',
  customer: 'Customer',
  corporate: 'Corporate',
};

export function UserDetailClient({ userId, locale }: UserDetailClientProps) {
  const {
    data: user,
    isLoading: isLoadingUser,
    error: userError,
  } = useQuery({
    queryKey: [...queryKeys.admin.all, 'users', userId],
    queryFn: () => fetchUserDetail(userId),
  });

  const {
    data: roles = [],
    isLoading: isLoadingRoles,
  } = useQuery({
    queryKey: [...queryKeys.admin.all, 'users', userId, 'roles'],
    queryFn: () => fetchUserRoles(userId),
    enabled: !!userId,
  });

  const {
    data: activities = [],
    isLoading: isLoadingActivities,
  } = useQuery({
    queryKey: [...queryKeys.admin.all, 'users', userId, 'activity'],
    queryFn: () => fetchActivityLog(userId),
    enabled: !!userId,
  });

  if (isLoadingUser) {
    return <UserDetailSkeleton />;
  }

  if (userError || !user) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-destructive mb-4">Failed to load user details</p>
          <Button variant="outline" asChild>
            <Link href={`/${locale}/console/users`}>Back to Users</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  const activityColumns: DataTableColumn<ActivityLog>[] = [
    {
      key: 'action',
      header: 'Action',
      accessor: (activity) => (
        <Badge variant="outline" className="uppercase text-xs">
          {activity.action}
        </Badge>
      ),
    },
    {
      key: 'resource',
      header: 'Resource',
      accessor: (activity) => (
        <div>
          <p className="text-sm font-medium">{activity.resource_type}</p>
          <p className="text-xs text-muted-foreground font-mono">
            {activity.resource_id}
          </p>
        </div>
      ),
    },
    {
      key: 'timestamp',
      header: 'Timestamp',
      accessor: (activity) => (
        <span className="text-sm text-muted-foreground">
          {new Date(activity.created_at).toLocaleString('id-ID', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          })}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href={`/${locale}/console/users`}>
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">User Details</h1>
            <p className="text-muted-foreground">View and manage user information</p>
          </div>
        </div>
        <Button asChild>
          <Link href={`/${locale}/console/users/${userId}/edit`}>
            <Edit className="mr-2 h-4 w-4" />
            Edit User
          </Link>
        </Button>
      </div>

      {/* Profile Card */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col gap-6 md:flex-row md:items-start">
            <Avatar className="h-24 w-24">
              <AvatarImage src={undefined} alt={user.full_name || 'User'} />
              <AvatarFallback className="text-2xl">
                {(user.full_name || 'U')
                  .split(' ')
                  .map((n) => n[0])
                  .join('')
                  .toUpperCase()
                  .slice(0, 2)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 space-y-4">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <h2 className="text-2xl font-bold">
                    {user.full_name || 'No name'}
                  </h2>
                  <Badge variant={user.is_active ? 'default' : 'secondary'}>
                    {user.is_active ? (
                      <>
                        <UserCheck className="mr-1 h-3 w-3" />
                        Active
                      </>
                    ) : (
                      <>
                        <UserX className="mr-1 h-3 w-3" />
                        Inactive
                      </>
                    )}
                  </Badge>
                </div>
                <p className="text-muted-foreground">
                  User ID: <span className="font-mono text-xs">{user.id}</span>
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                {user.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{user.phone}</span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">
                    Joined{' '}
                    {new Date(user.created_at).toLocaleDateString('id-ID', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })}
                  </span>
                </div>
                {user.employee_number && (
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">
                      Employee: {user.employee_number}
                    </span>
                  </div>
                )}
                {user.employment_status && (
                  <div className="flex items-center gap-2">
                    <Shield className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm capitalize">
                      {user.employment_status.replace('_', ' ')}
                    </span>
                  </div>
                )}
              </div>

              {(user.home_address || user.address) && (
                <div className="flex items-start gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <span className="text-sm">
                    {user.home_address || user.address}
                  </span>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs defaultValue="roles" className="space-y-4">
        <TabsList>
          <TabsTrigger value="roles">Roles & Permissions</TabsTrigger>
          <TabsTrigger value="activity">Activity History</TabsTrigger>
        </TabsList>

        <TabsContent value="roles" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>User Roles</CardTitle>
              <CardDescription>
                All roles assigned to this user
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingRoles ? (
                <div className="space-y-2">
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                </div>
              ) : roles.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No roles assigned
                </p>
              ) : (
                <div className="space-y-3">
                  {roles.map((role) => (
                    <div
                      key={role.id}
                      className="flex items-center justify-between rounded-lg border p-4"
                    >
                      <div className="flex items-center gap-3">
                        <Badge
                          variant="outline"
                          className={cn(
                            'text-sm',
                            roleColors[role.role] ||
                              'bg-gray-100 text-gray-800'
                          )}
                        >
                          {roleLabels[role.role] || role.role}
                        </Badge>
                        {role.is_primary && (
                          <Badge variant="default" className="text-xs">
                            Primary
                          </Badge>
                        )}
                        <Badge
                          variant={
                            role.status === 'active' ? 'default' : 'secondary'
                          }
                          className="text-xs"
                        >
                          {role.status}
                        </Badge>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        Added{' '}
                        {new Date(role.created_at).toLocaleDateString('id-ID')}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="activity" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Activity History</CardTitle>
              <CardDescription>
                Recent actions performed by or related to this user
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingActivities ? (
                <div className="space-y-2">
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                </div>
              ) : activities.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No activity found
                </p>
              ) : (
                <DataTable
                  columns={activityColumns}
                  data={activities}
                  emptyMessage="No activity found"
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function UserDetailSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-10 w-24" />
      </div>
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-6">
            <Skeleton className="h-24 w-24 rounded-full" />
            <div className="flex-1 space-y-4">
              <Skeleton className="h-8 w-64" />
              <Skeleton className="h-4 w-48" />
              <div className="grid gap-4 sm:grid-cols-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-32" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full mt-2" />
        </CardContent>
      </Card>
    </div>
  );
}


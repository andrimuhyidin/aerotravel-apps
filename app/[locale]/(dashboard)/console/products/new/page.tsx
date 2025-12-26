import { Metadata } from 'next';
import { redirect } from 'next/navigation';

import { createClient } from '@/lib/supabase/server';
import { PackageForm } from '@/components/admin/package-form';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export const metadata: Metadata = {
  title: 'Create Package | Admin Console',
  description: 'Create a new travel package',
};

export default async function NewPackagePage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/auth/login');
  }

  // Get user role
  const client = supabase as unknown as any;
  const { data: userData } = await client
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single();

  // Check if user has permission
  const allowedRoles = ['super_admin', 'marketing', 'ops_admin'];
  if (!userData || !allowedRoles.includes(userData.role)) {
    redirect('/console');
  }

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold">Create New Package</h1>
        <p className="text-muted-foreground">
          Fill in the details to create a new travel package
        </p>
      </div>

      <PackageForm mode="create" />
    </div>
  );
}


import { Metadata } from 'next';
import { redirect } from 'next/navigation';

import { createClient } from '@/lib/supabase/server';

import { ProductsManagementClient } from './products-management-client';

export const metadata: Metadata = {
  title: 'Package Management | Admin Console',
  description: 'Manage travel packages - create, edit, and publish packages',
};

export default async function ProductsPage() {
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
    .select('role, branch_id')
    .eq('id', user.id)
    .single();

  // Check if user has permission (admin, marketing, ops_admin)
  const allowedRoles = ['super_admin', 'marketing', 'ops_admin'];
  if (!userData || !allowedRoles.includes(userData.role)) {
    redirect('/console');
  }

  return <ProductsManagementClient userBranchId={userData.branch_id} userRole={userData.role} />;
}

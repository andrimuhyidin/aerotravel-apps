import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';

export type PartnerProfile = {
  id: string;
  name: string;
  email: string;
  phone: string;
  companyName: string;
  address: string;
  city: string;
  province: string;
  postalCode: string;
  siup: string;
  npwp: string;
  bankName: string;
  bankAccountNumber: string;
  bankAccountName: string;
  tier: 'bronze' | 'silver' | 'gold' | 'platinum';
  isVerified: boolean;
  logoUrl: string | null;
  avatar: string | null;
  memberSince: string;
  points: number;
  nextTierPoints: number;
  branchId: string | null;
};

export type TeamMember = {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'staff' | 'viewer';
  status: 'active' | 'inactive';
  joinedAt: string;
};

export type WhitelabelSettings = {
  enabled: boolean;
  companyName: string;
  logoUrl: string | null;
  primaryColor: string;
  secondaryColor: string;
  customDomain: string | null;
};

export async function getPartnerProfile(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string
): Promise<PartnerProfile | null> {
  try {
    const client = supabase as unknown as any;
    
    // Query users table with all available columns (after migration 116)
    const { data: profile, error } = await client
      .from('users')
      .select(`
        id, 
        full_name,
        email,
        company_name, 
        company_address,
        address,
        city,
        province,
        postal_code,
        npwp, 
        phone, 
        siup_number, 
        siup_document_url, 
        bank_name, 
        bank_account_number, 
        bank_account_name, 
        partner_tier,
        is_verified,
        logo_url,
        avatar_url,
        points,
        branch_id,
        created_at
      `)
      .eq('id', userId)
      .eq('role', 'mitra')
      .single();

    if (error) {
      // If error code is PGRST116 (0 rows), return null without logging error
      if (error.code === 'PGRST116') return null;
      
      logger.error('Failed to fetch partner profile', error);
      return null;
    }

    if (!profile) return null;

    // Map to PartnerProfile type with proper field mapping
    return {
      id: profile.id,
      name: profile.full_name || profile.company_name || 'Partner',
      email: profile.email || '',
      phone: profile.phone || '',
      companyName: profile.company_name || profile.full_name || 'Partner Company',
      address: profile.company_address || profile.address || '',
      city: profile.city || '',
      province: profile.province || '',
      postalCode: profile.postal_code || '',
      siup: profile.siup_number || '',
      npwp: profile.npwp || '',
      bankName: profile.bank_name || '',
      bankAccountNumber: profile.bank_account_number || '',
      bankAccountName: profile.bank_account_name || '',
      tier: (profile.partner_tier as any) || 'bronze',
      isVerified: profile.is_verified || false,
      logoUrl: profile.logo_url || null,
      avatar: profile.avatar_url || null,
      memberSince: profile.created_at ? new Date(profile.created_at).getFullYear().toString() : new Date().getFullYear().toString(),
      points: profile.points || 0,
      nextTierPoints: 1000,
      branchId: profile.branch_id || null,
    };
  } catch (error) {
    logger.error('Error in getPartnerProfile', error);
    return null;
  }
}

export async function getTeamMembers(
  supabase: Awaited<ReturnType<typeof createClient>>,
  partnerId: string
): Promise<TeamMember[]> {
  try {
    const client = supabase as unknown as any;
    
    // Query partner_users to get team members
    const { data, error } = await client
      .from('partner_users')
      .select(`
        id,
        user_id,
        role,
        is_active,
        created_at,
        user:users!partner_users_user_id_fkey (
          full_name,
          email
        )
      `)
      .eq('partner_id', partnerId)
      .is('deleted_at', null);

    if (error) {
      // If table doesn't exist yet, return empty array
      if (error.code === '42P01') return [];
      
      logger.error('Failed to fetch team members', error);
      return [];
    }

    return (data || []).map((member: any) => ({
      id: member.id,
      name: member.user?.full_name || 'Unknown',
      email: member.user?.email || '',
      role: member.role || 'staff',
      status: member.is_active ? 'active' : 'inactive',
      joinedAt: member.created_at,
    }));
  } catch (error) {
    logger.error('Error in getTeamMembers', error);
    return [];
  }
}

export async function getWhitelabelSettings(
  supabase: Awaited<ReturnType<typeof createClient>>,
  partnerId: string
): Promise<WhitelabelSettings | null> {
  try {
    const client = supabase as unknown as any;
    
    const { data, error } = await client
      .from('whitelabel_settings')
      .select('*')
      .eq('partner_id', partnerId)
      .single();

    if (error) {
      if (error.code === 'PGRST116' || error.code === '42P01') return null; // Not found or table missing
      logger.error('Failed to fetch whitelabel settings', error);
      return null;
    }

    if (!data) return null;

    return {
      enabled: data.is_enabled || false,
      companyName: data.company_name || '',
      logoUrl: data.logo_url || null,
      primaryColor: data.primary_color || '#000000',
      secondaryColor: data.secondary_color || '#ffffff',
      customDomain: data.custom_domain || null,
    };
  } catch (error) {
    logger.error('Error in getWhitelabelSettings', error);
    return null;
  }
}

/**
 * API: Admin Package Management
 * GET /api/admin/packages - List all packages
 * POST /api/admin/packages - Create new package
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { withErrorHandler } from '@/lib/api/error-handler';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';

const createPackageSchema = z.object({
  code: z.string().min(3).max(20),
  name: z.string().min(3).max(200),
  slug: z.string().min(3).max(200),
  description: z.string().optional(),
  shortDescription: z.string().max(500).optional(),
  packageType: z.enum(['open_trip', 'private_trip', 'corporate', 'kol_trip']).default('open_trip'),
  destination: z.string().min(2).max(200),
  city: z.string().max(100).optional(),
  province: z.string().max(100).optional(),
  durationDays: z.number().int().min(1).default(1),
  durationNights: z.number().int().min(0).default(0),
  minPax: z.number().int().min(1).default(1),
  maxPax: z.number().int().min(1).default(20),
  inclusions: z.array(z.string()).optional(),
  exclusions: z.array(z.string()).optional(),
  thumbnailUrl: z.string().url().optional(),
  priceTiers: z.array(z.object({
    minPax: z.number().int().min(1),
    maxPax: z.number().int().min(1),
    pricePublish: z.number().min(0),
    priceNta: z.number().min(0),
    priceWeekend: z.number().min(0).optional(),
  })).min(1),
});

export const GET = withErrorHandler(async (request: NextRequest) => {
  const supabase = await createClient();
  
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status');
  const branchId = searchParams.get('branch_id');
  const search = searchParams.get('search');

  try {
    const client = supabase as unknown as any;
    
    let query = client
      .from('packages')
      .select(`
        id,
        code,
        name,
        slug,
        description,
        short_description,
        package_type,
        status,
        destination,
        city,
        province,
        duration_days,
        duration_nights,
        min_pax,
        max_pax,
        thumbnail_url,
        branch_id,
        created_at,
        updated_at,
        package_prices!inner (
          id,
          min_pax,
          max_pax,
          price_publish,
          price_nta,
          price_weekend,
          is_active
        )
      `)
      .is('deleted_at', null)
      .order('created_at', { ascending: false });

    if (status) {
      query = query.eq('status', status);
    }

    if (branchId) {
      query = query.eq('branch_id', branchId);
    }

    if (search) {
      query = query.or(`name.ilike.%${search}%,destination.ilike.%${search}%,code.ilike.%${search}%`);
    }

    const { data: packages, error } = await query;

    if (error) {
      logger.error('Failed to fetch packages', error, { userId: user.id });
      return NextResponse.json(
        { error: 'Failed to fetch packages' },
        { status: 500 }
      );
    }

    return NextResponse.json({ packages });
  } catch (error) {
    logger.error('Error in GET /api/admin/packages', error, { userId: user.id });
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
});

export const POST = withErrorHandler(async (request: NextRequest) => {
  const supabase = await createClient();
  
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const validated = createPackageSchema.parse(body);

    const client = supabase as unknown as any;

    // Get user's branch_id
    const { data: userData } = await client
      .from('users')
      .select('branch_id, role')
      .eq('id', user.id)
      .single();

    if (!userData?.branch_id) {
      return NextResponse.json(
        { error: 'User branch not found' },
        { status: 400 }
      );
    }

    // Create package
    const packageData = {
      branch_id: userData.branch_id,
      code: validated.code,
      name: validated.name,
      slug: validated.slug,
      description: validated.description,
      short_description: validated.shortDescription,
      package_type: validated.packageType,
      status: 'draft' as const,
      destination: validated.destination,
      city: validated.city,
      province: validated.province,
      duration_days: validated.durationDays,
      duration_nights: validated.durationNights,
      min_pax: validated.minPax,
      max_pax: validated.maxPax,
      inclusions: validated.inclusions,
      exclusions: validated.exclusions,
      thumbnail_url: validated.thumbnailUrl,
      created_by: user.id,
    };

    const { data: newPackage, error: packageError } = await client
      .from('packages')
      .insert(packageData)
      .select()
      .single();

    if (packageError) {
      logger.error('Failed to create package', packageError, { userId: user.id });
      return NextResponse.json(
        { error: 'Failed to create package', details: packageError.message },
        { status: 500 }
      );
    }

    // Create price tiers
    const priceTiers = validated.priceTiers.map(tier => ({
      package_id: newPackage.id,
      min_pax: tier.minPax,
      max_pax: tier.maxPax,
      price_publish: tier.pricePublish,
      price_nta: tier.priceNta,
      price_weekend: tier.priceWeekend,
      is_active: true,
    }));

    const { error: priceError } = await client
      .from('package_prices')
      .insert(priceTiers);

    if (priceError) {
      logger.error('Failed to create package prices', priceError, { packageId: newPackage.id });
      // Rollback: delete the package
      await client.from('packages').delete().eq('id', newPackage.id);
      return NextResponse.json(
        { error: 'Failed to create package prices' },
        { status: 500 }
      );
    }

    logger.info('Package created successfully', { packageId: newPackage.id, userId: user.id });

    return NextResponse.json({
      success: true,
      package: newPackage,
    }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.issues },
        { status: 400 }
      );
    }

    logger.error('Error in POST /api/admin/packages', error, { userId: user.id });
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
});


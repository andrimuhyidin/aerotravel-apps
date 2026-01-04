/**
 * Admin Seed Data API
 * POST /api/admin/seed
 * Only works in development mode
 */

import { createClient as createAdminClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

import { logger } from '@/lib/utils/logger';

export async function POST() {
  // Only allow in development
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json(
      { error: 'Seed only allowed in development' },
      { status: 403 }
    );
  }

  try {
    // Use service role to bypass RLS
    const supabase = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // First, create default branch
    const { data: branch, error: branchError } = await supabase
      .from('branches')
      .upsert(
        {
          code: 'AERO-LPG',
          name: 'Aero Travel Lampung',
          address: 'Bandar Lampung, Lampung',
          phone: '+6281234567890',
          email: 'info@aerotravel.co.id',
          is_active: true,
        },
        { onConflict: 'code' }
      )
      .select()
      .single();

    if (branchError) {
      logger.error('Failed to seed branch', branchError);
      return NextResponse.json({ error: branchError.message }, { status: 500 });
    }

    const branchId = branch.id;

    // Seed Packages
    const packages = [
      {
        branch_id: branchId,
        code: 'PKG-PHW-001',
        name: 'Pahawang Island 2D1N',
        slug: 'pahawang-2d1n',
        description: 'Paket snorkeling 2 hari 1 malam di Pulau Pahawang.',
        destination: 'Pulau Pahawang',
        city: 'Pesawaran',
        province: 'Lampung',
        package_type: 'open_trip',
        status: 'published',
        duration_days: 2,
        duration_nights: 1,
        min_pax: 2,
        max_pax: 30,
        inclusions: [
          'Transportasi PP',
          'Kapal',
          'Makan 3x',
          'Snorkeling',
          'Tenda',
          'Guide',
          'Asuransi',
        ],
        exclusions: ['Pengeluaran pribadi'],
      },
      {
        branch_id: branchId,
        code: 'PKG-KLN-001',
        name: 'Kiluan Dolphin Tour 2D1N',
        slug: 'kiluan-dolphin-2d1n',
        description: 'Pengalaman melihat lumba-lumba di habitat aslinya.',
        destination: 'Teluk Kiluan',
        city: 'Tanggamus',
        province: 'Lampung',
        package_type: 'open_trip',
        status: 'published',
        duration_days: 2,
        duration_nights: 1,
        min_pax: 4,
        max_pax: 20,
        inclusions: [
          'Transportasi PP',
          'Perahu',
          'Makan 3x',
          'Homestay',
          'Guide',
        ],
        exclusions: ['Pengeluaran pribadi'],
      },
      {
        branch_id: branchId,
        code: 'PKG-LBJ-001',
        name: 'Labuan Bajo Explorer 3D2N',
        slug: 'labuan-bajo-3d2n',
        description: 'Jelajahi keajaiban Komodo dengan live on board phinisi.',
        destination: 'Labuan Bajo',
        city: 'Manggarai Barat',
        province: 'Nusa Tenggara Timur',
        package_type: 'open_trip',
        status: 'published',
        duration_days: 3,
        duration_nights: 2,
        min_pax: 6,
        max_pax: 15,
        inclusions: [
          'Live on board',
          'Full board',
          'Snorkeling',
          'Ranger',
          'Tiket TN',
        ],
        exclusions: ['Tiket pesawat'],
      },
      {
        branch_id: branchId,
        code: 'PKG-RAJ-001',
        name: 'Raja Ampat Paradise 5D4N',
        slug: 'raja-ampat-5d4n',
        description: 'Ekspedisi diving di surga bawah laut Raja Ampat.',
        destination: 'Raja Ampat',
        city: 'Raja Ampat',
        province: 'Papua Barat',
        package_type: 'open_trip',
        status: 'published',
        duration_days: 5,
        duration_nights: 4,
        min_pax: 4,
        max_pax: 10,
        inclusions: [
          'Speedboat',
          'Homestay',
          'Full board',
          'PIN Raja Ampat',
          'Guide',
        ],
        exclusions: ['Tiket pesawat'],
      },
      {
        branch_id: branchId,
        code: 'PKG-KRJ-001',
        name: 'Karimunjawa Island Hopping 3D2N',
        slug: 'karimunjawa-3d2n',
        description: 'Jelajahi kepulauan Karimunjawa dengan island hopping.',
        destination: 'Karimunjawa',
        city: 'Jepara',
        province: 'Jawa Tengah',
        package_type: 'open_trip',
        status: 'published',
        duration_days: 3,
        duration_nights: 2,
        min_pax: 4,
        max_pax: 20,
        inclusions: [
          'Kapal PP',
          'Homestay',
          'Makan 5x',
          'Island hopping',
          'Snorkeling',
        ],
        exclusions: ['Pengeluaran pribadi'],
      },
      {
        branch_id: branchId,
        code: 'PKG-TJL-001',
        name: 'Tanjung Lesung Beach Escape 2D1N',
        slug: 'tanjung-lesung-2d1n',
        description: 'Weekend getaway ke pantai Tanjung Lesung.',
        destination: 'Tanjung Lesung',
        city: 'Pandeglang',
        province: 'Banten',
        package_type: 'open_trip',
        status: 'published',
        duration_days: 2,
        duration_nights: 1,
        min_pax: 2,
        max_pax: 30,
        inclusions: ['Transportasi PP', 'Resort', 'Makan 3x', 'Water sport'],
        exclusions: ['Pengeluaran pribadi'],
      },
    ];

    const { data: insertedPkgs, error: pkgError } = await supabase
      .from('packages')
      .upsert(packages, { onConflict: 'branch_id,slug' })
      .select('id, code');

    if (pkgError) {
      logger.error('Failed to seed packages', pkgError);
      return NextResponse.json({ error: pkgError.message }, { status: 500 });
    }

    // Create price tiers for each package
    const pkgMap = new Map(insertedPkgs?.map((p) => [p.code, p.id]) || []);

    const prices = [
      {
        package_id: pkgMap.get('PKG-PHW-001'),
        min_pax: 2,
        max_pax: 10,
        price_publish: 500000,
        price_nta: 400000,
      },
      {
        package_id: pkgMap.get('PKG-PHW-001'),
        min_pax: 11,
        max_pax: 30,
        price_publish: 450000,
        price_nta: 350000,
      },
      {
        package_id: pkgMap.get('PKG-KLN-001'),
        min_pax: 4,
        max_pax: 20,
        price_publish: 550000,
        price_nta: 420000,
      },
      {
        package_id: pkgMap.get('PKG-LBJ-001'),
        min_pax: 6,
        max_pax: 15,
        price_publish: 3500000,
        price_nta: 2900000,
      },
      {
        package_id: pkgMap.get('PKG-RAJ-001'),
        min_pax: 4,
        max_pax: 10,
        price_publish: 8500000,
        price_nta: 7200000,
      },
      {
        package_id: pkgMap.get('PKG-KRJ-001'),
        min_pax: 4,
        max_pax: 20,
        price_publish: 1250000,
        price_nta: 1000000,
      },
      {
        package_id: pkgMap.get('PKG-TJL-001'),
        min_pax: 2,
        max_pax: 30,
        price_publish: 650000,
        price_nta: 520000,
      },
    ].filter((p) => p.package_id);

    if (prices.length > 0) {
      const { error: priceError } = await supabase
        .from('package_prices')
        .upsert(prices);
      if (priceError) {
        logger.error('Failed to seed prices', priceError);
      }
    }

    logger.info('Seed data inserted successfully');
    return NextResponse.json({
      success: true,
      message: `Seed data inserted: 1 branch, ${insertedPkgs?.length || 0} packages`,
    });
  } catch (error) {
    logger.error('Seed error', error);
    return NextResponse.json({ error: 'Failed to seed data' }, { status: 500 });
  }
}

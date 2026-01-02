/**
 * Loyalty Rewards Catalog API
 * GET /api/user/loyalty/rewards - Get available rewards catalog
 */

import { NextRequest, NextResponse } from 'next/server';

import { withErrorHandler } from '@/lib/api/error-handler';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';

type RewardCategory = 'voucher' | 'discount' | 'merchandise' | 'experience';

type Reward = {
  id: string;
  name: string;
  description: string;
  category: RewardCategory;
  pointsCost: number;
  valueInRupiah: number;
  imageUrl: string | null;
  isAvailable: boolean;
  stock: number | null;
  validUntil: string | null;
  terms: string[];
};

// Static rewards catalog (in production, this would come from database)
const REWARDS_CATALOG: Reward[] = [
  {
    id: 'voucher-50k',
    name: 'Voucher Diskon Rp 50.000',
    description: 'Potongan harga Rp 50.000 untuk booking berikutnya',
    category: 'voucher',
    pointsCost: 50000,
    valueInRupiah: 50000,
    imageUrl: null,
    isAvailable: true,
    stock: null, // unlimited
    validUntil: null,
    terms: [
      'Berlaku untuk semua paket wisata',
      'Tidak dapat digabung dengan promo lain',
      'Masa berlaku 30 hari setelah ditukar',
    ],
  },
  {
    id: 'voucher-100k',
    name: 'Voucher Diskon Rp 100.000',
    description: 'Potongan harga Rp 100.000 untuk booking berikutnya',
    category: 'voucher',
    pointsCost: 95000, // Slight discount for higher redemption
    valueInRupiah: 100000,
    imageUrl: null,
    isAvailable: true,
    stock: null,
    validUntil: null,
    terms: [
      'Berlaku untuk semua paket wisata',
      'Tidak dapat digabung dengan promo lain',
      'Masa berlaku 30 hari setelah ditukar',
    ],
  },
  {
    id: 'voucher-200k',
    name: 'Voucher Diskon Rp 200.000',
    description: 'Potongan harga Rp 200.000 untuk booking berikutnya',
    category: 'voucher',
    pointsCost: 180000, // Better value for bulk
    valueInRupiah: 200000,
    imageUrl: null,
    isAvailable: true,
    stock: null,
    validUntil: null,
    terms: [
      'Berlaku untuk semua paket wisata',
      'Minimum booking Rp 500.000',
      'Tidak dapat digabung dengan promo lain',
      'Masa berlaku 30 hari setelah ditukar',
    ],
  },
  {
    id: 'discount-10pct',
    name: 'Diskon 10% Booking',
    description: 'Potongan 10% untuk 1x booking (maks Rp 500.000)',
    category: 'discount',
    pointsCost: 75000,
    valueInRupiah: 0, // Variable
    imageUrl: null,
    isAvailable: true,
    stock: null,
    validUntil: null,
    terms: [
      'Maksimal potongan Rp 500.000',
      'Berlaku untuk semua paket wisata',
      'Tidak dapat digabung dengan promo lain',
      'Masa berlaku 14 hari setelah ditukar',
    ],
  },
  {
    id: 'upgrade-seat',
    name: 'Upgrade Kursi Premium',
    description: 'Upgrade ke kursi depan untuk trip berikutnya',
    category: 'experience',
    pointsCost: 25000,
    valueInRupiah: 50000,
    imageUrl: null,
    isAvailable: true,
    stock: 50,
    validUntil: null,
    terms: [
      'Subject to availability',
      'Berlaku untuk trip reguler',
      'Tidak dapat diuangkan kembali',
    ],
  },
  {
    id: 'merch-tshirt',
    name: 'Kaos Aero Travel',
    description: 'Kaos ekslusif dengan desain Aero Travel',
    category: 'merchandise',
    pointsCost: 150000,
    valueInRupiah: 200000,
    imageUrl: null,
    isAvailable: true,
    stock: 100,
    validUntil: null,
    terms: [
      'Tersedia ukuran S, M, L, XL',
      'Pengiriman gratis ke seluruh Indonesia',
      'Estimasi pengiriman 7-14 hari kerja',
    ],
  },
  {
    id: 'merch-tumbler',
    name: 'Tumbler Aero Travel',
    description: 'Tumbler stainless steel 500ml dengan logo Aero',
    category: 'merchandise',
    pointsCost: 100000,
    valueInRupiah: 150000,
    imageUrl: null,
    isAvailable: true,
    stock: 75,
    validUntil: null,
    terms: [
      'Pengiriman gratis ke seluruh Indonesia',
      'Estimasi pengiriman 7-14 hari kerja',
    ],
  },
  {
    id: 'priority-booking',
    name: 'Priority Booking Access',
    description: 'Akses booking lebih awal untuk paket populer',
    category: 'experience',
    pointsCost: 50000,
    valueInRupiah: 0,
    imageUrl: null,
    isAvailable: true,
    stock: null,
    validUntil: null,
    terms: [
      'Berlaku untuk 3 bulan',
      'Akses booking 24 jam lebih awal dari publik',
      'Berlaku untuk paket-paket favorit',
    ],
  },
];

export const GET = withErrorHandler(async (request: NextRequest) => {
  logger.info('GET /api/user/loyalty/rewards');

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Get user's current points balance
  let userBalance = 0;
  if (user) {
    const { data: balanceData } = await supabase
      .from('loyalty_points')
      .select('balance')
      .eq('user_id', user.id)
      .single();

    userBalance = balanceData?.balance || 0;
  }

  // Get query params for filtering
  const { searchParams } = new URL(request.url);
  const category = searchParams.get('category') as RewardCategory | null;

  // Filter and transform rewards
  let rewards = [...REWARDS_CATALOG];

  if (category) {
    rewards = rewards.filter((r) => r.category === category);
  }

  // Sort by points cost ascending
  rewards.sort((a, b) => a.pointsCost - b.pointsCost);

  // Add canRedeem flag based on user balance
  const rewardsWithRedeemability = rewards.map((reward) => ({
    ...reward,
    canRedeem: userBalance >= reward.pointsCost && reward.isAvailable,
    pointsShortfall:
      userBalance < reward.pointsCost ? reward.pointsCost - userBalance : 0,
  }));

  return NextResponse.json({
    rewards: rewardsWithRedeemability,
    userBalance,
    categories: [
      { id: 'voucher', name: 'Voucher', count: rewards.filter((r) => r.category === 'voucher').length },
      { id: 'discount', name: 'Diskon', count: rewards.filter((r) => r.category === 'discount').length },
      { id: 'merchandise', name: 'Merchandise', count: rewards.filter((r) => r.category === 'merchandise').length },
      { id: 'experience', name: 'Experience', count: rewards.filter((r) => r.category === 'experience').length },
    ],
  });
});


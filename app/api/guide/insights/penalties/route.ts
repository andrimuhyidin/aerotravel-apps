/**
 * API: Guide Penalty History
 * GET /api/guide/insights/penalties - Get penalty history with reasons and tips to avoid
 */

import { NextRequest, NextResponse } from 'next/server';

import { withErrorHandler } from '@/lib/api/error-handler';
import { getBranchContext } from '@/lib/branch/branch-injection';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';

type PenaltyReason =
  | 'late_check_in'
  | 'missing_documentation'
  | 'complaint'
  | 'damage'
  | 'other';

type PenaltyTip = {
  reason: PenaltyReason;
  title: string;
  description: string;
  tips: string[];
};

const PENALTY_TIPS: Record<PenaltyReason, PenaltyTip> = {
  late_check_in: {
    reason: 'late_check_in',
    title: 'Keterlambatan Check-in',
    description: 'Anda terlambat check-in atau datang ke meeting point',
    tips: [
      'Berangkat lebih awal dari estimasi waktu',
      'Cek lalu lintas sebelum berangkat',
      'Siapkan semua kebutuhan malam sebelumnya',
      'Set alarm lebih awal dari waktu yang dijadwalkan',
      'Siapkan rute alternatif jika ada kemacetan',
    ],
  },
  missing_documentation: {
    reason: 'missing_documentation',
    title: 'Dokumentasi Kurang',
    description: 'Dokumentasi trip tidak lengkap atau tidak sesuai standar',
    tips: [
      'Foto semua aktivitas penting selama trip',
      'Pastikan foto jelas dan tidak blur',
      'Lengkapi checklist dokumentasi sebelum trip selesai',
      'Gunakan aplikasi untuk dokumentasi real-time',
      'Review checklist dokumentasi sebelum check-out',
    ],
  },
  complaint: {
    reason: 'complaint',
    title: 'Komplain Tamu',
    description: 'Terdapat komplain dari tamu terkait pelayanan',
    tips: [
      'Berikan pelayanan yang ramah dan profesional',
      'Selesaikan masalah dengan cepat dan efektif',
      'Komunikasikan dengan jelas kepada tamu',
      'Pastikan semua kebutuhan tamu terpenuhi',
      'Laporkan masalah segera kepada supervisor',
    ],
  },
  damage: {
    reason: 'damage',
    title: 'Kerusakan Aset',
    description: 'Terdapat kerusakan pada aset/peralatan yang digunakan',
    tips: [
      'Gunakan aset dengan hati-hati dan sesuai prosedur',
      'Laporkan kerusakan segera saat terjadi',
      'Ikuti panduan penggunaan aset dengan benar',
      'Periksa kondisi aset sebelum digunakan',
      'Hindari penggunaan aset di luar kapasitasnya',
    ],
  },
  other: {
    reason: 'other',
    title: 'Lainnya',
    description: 'Potongan karena alasan lain',
    tips: [
      'Baca dengan teliti peraturan yang berlaku',
      'Komunikasikan masalah dengan tim',
      'Minta klarifikasi jika tidak jelas',
      'Ikuti semua panduan yang diberikan',
    ],
  },
};

export const GET = withErrorHandler(async (request: NextRequest) => {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const limit = parseInt(searchParams.get('limit') || '20', 10);

  const branchContext = await getBranchContext(user.id);
  const client = supabase as unknown as any;

  try {
    // Get penalty history
    let penaltiesQuery = client
      .from('salary_deductions')
      .select('id, amount, reason, description, created_at, trip_id')
      .eq('guide_id', user.id);

    if (!branchContext.isSuperAdmin && branchContext.branchId) {
      penaltiesQuery = penaltiesQuery.eq('branch_id', branchContext.branchId);
    }

    const { data: penalties, error: penaltiesError } = await penaltiesQuery
      .order('created_at', { ascending: false })
      .limit(limit);

    if (penaltiesError) {
      logger.error('Failed to fetch penalties', penaltiesError, {
        guideId: user.id,
      });
      return NextResponse.json(
        { error: 'Failed to fetch penalties' },
        { status: 500 }
      );
    }

    // Map penalties with tips
    const penaltiesWithTips = (penalties || []).map((penalty: any) => {
      const reason = (penalty.reason || 'other') as PenaltyReason;
      const tip = PENALTY_TIPS[reason] || PENALTY_TIPS.other;

      return {
        id: penalty.id,
        amount: Number(penalty.amount) || 0,
        reason,
        description: penalty.description || tip.description,
        createdAt: penalty.created_at,
        tripId: penalty.trip_id,
        tip,
      };
    });

    return NextResponse.json({
      penalties: penaltiesWithTips,
      totalCount: penaltiesWithTips.length,
    });
  } catch (error) {
    logger.error('Failed to fetch penalty history', error, {
      guideId: user.id,
    });
    return NextResponse.json(
      { error: 'Failed to fetch penalty history' },
      { status: 500 }
    );
  }
});

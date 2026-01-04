/**
 * API: AI Predictive Maintenance
 * GET /api/guide/equipment/predictive-maintenance
 * 
 * Predict equipment issues, maintenance scheduling, safety alerts
 * Rate Limited: 10 requests per minute per user
 */

import { NextRequest, NextResponse } from 'next/server';

import {
    getMaintenanceSchedule,
    predictEquipmentMaintenance,
    type EquipmentUsage,
} from '@/lib/ai/equipment-predictor';
import { withErrorHandler } from '@/lib/api/error-handler';
import { checkGuideRateLimit, createRateLimitHeaders, guideAiRateLimit } from '@/lib/rate-limit/guide-limits';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';

export const GET = withErrorHandler(async (_request: NextRequest) => {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Rate limit check
  const rateLimit = await checkGuideRateLimit(guideAiRateLimit, user.id, 'prediksi maintenance');
  if (!rateLimit.success) {
    return NextResponse.json(
      { error: rateLimit.error },
      { status: 429, headers: createRateLimitHeaders(rateLimit.remaining, rateLimit.reset) }
    );
  }

  const client = supabase as unknown as any;

  try {
    // Fetch equipment usage data
    const { data: equipmentData } = await client
      .from('trip_equipment_usage')
      .select(`
        equipment_id,
        equipment:equipment(name, condition),
        usage_count:count(),
        last_used:max(used_at)
      `)
      .eq('guide_id', user.id)
      .group('equipment_id, equipment');

    // Fetch maintenance records
    const { data: maintenanceData } = await client
      .from('equipment_maintenance')
      .select('equipment_id, maintenance_date')
      .order('maintenance_date', { ascending: false });

    // Fetch reported issues
    const { data: issuesData } = await client
      .from('equipment_issues')
      .select('equipment_id')
      .eq('resolved', false);

    // Build equipment usage array
    const equipment: EquipmentUsage[] = (equipmentData || []).map((eq: any) => {
      const equipmentId = eq.equipment_id;
      const maintenance = (maintenanceData || []).find((m: any) => m.equipment_id === equipmentId);
      const issues = (issuesData || []).filter((i: any) => i.equipment_id === equipmentId);

      return {
        equipmentId,
        equipmentName: eq.equipment?.name || 'Unknown',
        usageCount: eq.usage_count || 0,
        lastUsed: eq.last_used || new Date().toISOString(),
        lastMaintenance: maintenance?.maintenance_date,
        condition: eq.equipment?.condition || 'good',
        reportedIssues: issues.length,
      };
    });

    // Get predictions
    const predictions = await predictEquipmentMaintenance(equipment);
    const schedule = await getMaintenanceSchedule(equipment);

    return NextResponse.json({
      predictions,
      schedule,
    });
  } catch (error) {
    logger.error('Failed to get predictive maintenance', error, {
      guideId: user.id,
    });
    return NextResponse.json(
      { error: 'Gagal mendapatkan prediksi maintenance' },
      { status: 500 }
    );
  }
});

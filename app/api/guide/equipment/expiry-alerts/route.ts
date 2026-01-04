/**
 * API: Equipment Expiry Alerts
 * GET /api/guide/equipment/expiry-alerts
 */

import { NextRequest, NextResponse } from 'next/server';

import { withErrorHandler } from '@/lib/api/error-handler';
import { getBranchContext } from '@/lib/branch/branch-injection';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';

export const GET = withErrorHandler(async (request: NextRequest) => {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const branchContext = await getBranchContext(user.id);
  const client = supabase as unknown as any;

  try {
    const today = new Date();
    const in30Days = new Date(today);
    in30Days.setDate(in30Days.getDate() + 30);

    // Get assets with expiring certificates
    const { data: assets, error: assetsError } = await client
      .from('assets')
      .select('id, code, name, insurance_expiry, registration_expiry')
      .eq('branch_id', branchContext.branchId)
      .or(`insurance_expiry.lte.${in30Days.toISOString()},registration_expiry.lte.${in30Days.toISOString()}`)
      .order('insurance_expiry', { ascending: true, nullsFirst: false });

    if (assetsError) {
      logger.error('Failed to fetch expiry alerts', assetsError);
      return NextResponse.json({ error: 'Failed to fetch expiry alerts' }, { status: 500 });
    }

    const alerts = (assets || [])
      .map((asset: any) => {
        const alerts: Array<{
          equipmentId: string;
          equipmentName: string;
          certificateType: string;
          expiryDate: string;
          daysUntilExpiry: number;
          severity: 'expired' | 'warning' | 'info';
        }> = [];

        if (asset.insurance_expiry) {
          const expiryDate = new Date(asset.insurance_expiry);
          const daysUntilExpiry = Math.ceil((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
          
          if (daysUntilExpiry < 0) {
            alerts.push({
              equipmentId: asset.id,
              equipmentName: asset.name || asset.code,
              certificateType: 'insurance',
              expiryDate: asset.insurance_expiry,
              daysUntilExpiry,
              severity: 'expired',
            });
          } else if (daysUntilExpiry <= 7) {
            alerts.push({
              equipmentId: asset.id,
              equipmentName: asset.name || asset.code,
              certificateType: 'insurance',
              expiryDate: asset.insurance_expiry,
              daysUntilExpiry,
              severity: 'warning',
            });
          } else if (daysUntilExpiry <= 30) {
            alerts.push({
              equipmentId: asset.id,
              equipmentName: asset.name || asset.code,
              certificateType: 'insurance',
              expiryDate: asset.insurance_expiry,
              daysUntilExpiry,
              severity: 'info',
            });
          }
        }

        if (asset.registration_expiry) {
          const expiryDate = new Date(asset.registration_expiry);
          const daysUntilExpiry = Math.ceil((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
          
          if (daysUntilExpiry < 0) {
            alerts.push({
              equipmentId: asset.id,
              equipmentName: asset.name || asset.code,
              certificateType: 'registration',
              expiryDate: asset.registration_expiry,
              daysUntilExpiry,
              severity: 'expired',
            });
          } else if (daysUntilExpiry <= 7) {
            alerts.push({
              equipmentId: asset.id,
              equipmentName: asset.name || asset.code,
              certificateType: 'registration',
              expiryDate: asset.registration_expiry,
              daysUntilExpiry,
              severity: 'warning',
            });
          } else if (daysUntilExpiry <= 30) {
            alerts.push({
              equipmentId: asset.id,
              equipmentName: asset.name || asset.code,
              certificateType: 'registration',
              expiryDate: asset.registration_expiry,
              daysUntilExpiry,
              severity: 'info',
            });
          }
        }

        return alerts;
      })
      .flat()
      .sort((a: { severity: string; daysUntilExpiry: number }, b: { severity: string; daysUntilExpiry: number }) => {
        // Sort by severity: expired > warning > info
        const severityOrder: Record<string, number> = { expired: 0, warning: 1, info: 2 };
        const severityDiff = (severityOrder[a.severity] || 2) - (severityOrder[b.severity] || 2);
        if (severityDiff !== 0) return severityDiff;
        // Then by days until expiry
        return a.daysUntilExpiry - b.daysUntilExpiry;
      });

    return NextResponse.json({ alerts });
  } catch (error) {
    logger.error('Failed to fetch expiry alerts', error);
    return NextResponse.json({ error: 'Failed to fetch expiry alerts' }, { status: 500 });
  }
});


/**
 * Risk Score API
 * POST /api/guide/safety-checklist/risk-score
 * Calculate risk score for a trip based on checklist, weather, equipment, etc.
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { withErrorHandler } from '@/lib/api/error-handler';
import {
  calculateRiskScore,
  type ChecklistResponse,
  type CertificationStatus,
  type EquipmentStatus,
  type WeatherData,
} from '@/lib/guide/risk-scoring';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';

const requestSchema = z.object({
  tripId: z.string().uuid(),
  checklistResponses: z.array(z.object({
    itemId: z.string(),
    checked: z.boolean(),
    notes: z.string().optional(),
  })).optional(),
  includeWeather: z.boolean().optional().default(true),
  includeEquipment: z.boolean().optional().default(true),
  includeCertifications: z.boolean().optional().default(true),
});

export const POST = withErrorHandler(async (request: NextRequest) => {
  logger.info('POST /api/guide/safety-checklist/risk-score');

  const supabase = await createClient();

  // Verify authentication
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const parsed = requestSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid request body', details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { tripId, checklistResponses, includeWeather, includeEquipment, includeCertifications } = parsed.data;

  // Fetch trip details
  const { data: trip, error: tripError } = await supabase
    .from('trips')
    .select(`
      id,
      trip_code,
      date,
      total_pax,
      package:packages(name, destination)
    `)
    .eq('id', tripId)
    .single();

  if (tripError || !trip) {
    return NextResponse.json({ error: 'Trip not found' }, { status: 404 });
  }

  // Get checklist responses (from request or database)
  let finalChecklistResponses: ChecklistResponse[] = checklistResponses || [];

  if (!checklistResponses || checklistResponses.length === 0) {
    // Try to fetch from database
    const { data: savedChecklist } = await supabase
      .from('safety_checklists')
      .select('checked_items')
      .eq('trip_id', tripId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (savedChecklist?.checked_items) {
      const items = savedChecklist.checked_items as string[];
      finalChecklistResponses = items.map(itemId => ({
        itemId,
        checked: true,
      }));
    }
  }

  // Fetch weather data if requested
  let weather: WeatherData | undefined;
  if (includeWeather) {
    try {
      // Try to fetch latest weather from our weather API
      const weatherRes = await fetch(
        `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/guide/weather?tripId=${tripId}`,
        { headers: { Cookie: request.headers.get('Cookie') || '' } }
      );
      if (weatherRes.ok) {
        const weatherData = await weatherRes.json();
        if (weatherData.current) {
          weather = {
            condition: weatherData.current.condition || 'Unknown',
            windSpeed: weatherData.current.wind_speed,
            waveHeight: weatherData.current.wave_height,
            visibility: weatherData.current.visibility,
            hasAlert: weatherData.current.has_alert || false,
            alertType: weatherData.current.alert_type,
          };
        }
      }
    } catch (err) {
      logger.warn('Failed to fetch weather for risk scoring', { tripId, error: err });
      // Continue without weather data
    }
  }

  // Fetch equipment status if requested
  let equipment: EquipmentStatus | undefined;
  if (includeEquipment) {
    const { data: equipmentChecklist } = await supabase
      .from('equipment_checklists')
      .select('items, total_items')
      .eq('trip_id', tripId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (equipmentChecklist) {
      const items = (equipmentChecklist.items as Array<{
        checked: boolean;
        needs_repair?: boolean;
        id?: string;
        quantity?: number;
      }>) || [];
      const checkedItems = items.filter(i => i.checked).length;
      const itemsNeedingRepair = items.filter(i => i.needs_repair).length;
      const lifejacketItem = items.find(i => i.id === 'life_jacket');
      const lifejacketCount = lifejacketItem?.quantity || 0;

      equipment = {
        totalItems: equipmentChecklist.total_items || items.length,
        checkedItems,
        itemsNeedingRepair,
        lifejacketCount,
        passengerCount: trip.total_pax || 0,
      };
    }
  }

  // Fetch certification status if requested
  let certifications: CertificationStatus | undefined;
  if (includeCertifications) {
    // Fetch crew certifications
    const { data: crewCerts } = await supabase
      .from('crew_certifications')
      .select('expiry_date')
      .eq('status', 'active');

    if (crewCerts) {
      const now = new Date();
      const thirtyDaysFromNow = new Date();
      thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

      const validCertifications = crewCerts.filter(c => {
        if (!c.expiry_date) return true;
        return new Date(c.expiry_date) > now;
      }).length;

      const expiredCertifications = crewCerts.filter(c => {
        if (!c.expiry_date) return false;
        return new Date(c.expiry_date) <= now;
      }).length;

      const expiringWithin30Days = crewCerts.filter(c => {
        if (!c.expiry_date) return false;
        const expiryDate = new Date(c.expiry_date);
        return expiryDate > now && expiryDate <= thirtyDaysFromNow;
      }).length;

      certifications = {
        validCertifications,
        expiredCertifications,
        expiringWithin30Days,
      };
    }
  }

  // Calculate risk score
  const assessment = calculateRiskScore({
    checklistResponses: finalChecklistResponses,
    weather,
    equipment,
    certifications,
    passengerCount: trip.total_pax,
  });

  // Save risk assessment to database
  await supabase
    .from('safety_checklists')
    .update({
      risk_score: assessment.score,
      risk_level: assessment.level,
      risk_factors: assessment.factors,
      risk_assessed_at: assessment.assessedAt,
    })
    .eq('trip_id', tripId)
    .order('created_at', { ascending: false })
    .limit(1);

  logger.info('Risk score calculated', {
    tripId,
    score: assessment.score,
    level: assessment.level,
    blocked: assessment.blocked,
  });

  return NextResponse.json({
    success: true,
    assessment,
    trip: {
      id: trip.id,
      tripCode: trip.trip_code,
      date: trip.date,
      totalPax: trip.total_pax,
    },
  });
});


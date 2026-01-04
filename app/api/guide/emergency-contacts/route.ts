/**
 * API: Guide Emergency Contacts
 * GET  /api/guide/emergency-contacts - Get emergency contacts
 * POST /api/guide/emergency-contacts - Add emergency contact
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { withErrorHandler } from '@/lib/api/error-handler';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';

const addContactSchema = z.object({
  name: z.string().min(1).max(200),
  relationship: z.enum(['spouse', 'parent', 'sibling', 'friend', 'other']).optional(),
  phone: z.string().min(1).max(20),
  email: z.string().email().optional().or(z.literal('')),
  priority: z.number().int().min(1).max(10).optional().default(1),
  auto_notify: z.boolean().optional().default(true),
});

export const GET = withErrorHandler(async (request: NextRequest) => {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const client = supabase as unknown as any;

  const { data: contacts, error } = await client
    .from('guide_emergency_contacts')
    .select('*')
    .eq('guide_id', user.id)
    .eq('is_active', true)
    .order('priority', { ascending: true });

  if (error) {
    logger.error('Failed to fetch emergency contacts', error, { guideId: user.id });
    return NextResponse.json({ error: 'Failed to fetch contacts' }, { status: 500 });
  }

  return NextResponse.json({ contacts: contacts || [] });
});

export const POST = withErrorHandler(async (request: NextRequest) => {
  const supabase = await createClient();
  const payload = addContactSchema.parse(await request.json());

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const client = supabase as unknown as any;

  const { data: contact, error } = await client
    .from('guide_emergency_contacts')
    .insert({
      guide_id: user.id,
      name: payload.name,
      relationship: payload.relationship || 'other',
      phone: payload.phone,
      email: payload.email || null,
      priority: payload.priority,
      auto_notify: payload.auto_notify,
      is_active: true,
    })
    .select()
    .single();

  if (error) {
    logger.error('Failed to add emergency contact', error, { guideId: user.id });
    return NextResponse.json({ error: 'Failed to add contact' }, { status: 500 });
  }

  return NextResponse.json({ contact });
});


/**
 * API: Guide Emergency Contact (Single)
 * PUT    /api/guide/emergency-contacts/[id] - Update contact
 * DELETE /api/guide/emergency-contacts/[id] - Delete contact
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { withErrorHandler } from '@/lib/api/error-handler';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';

const updateContactSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  relationship: z.enum(['spouse', 'parent', 'sibling', 'friend', 'other']).optional(),
  phone: z.string().min(1).max(20).optional(),
  email: z.string().email().optional(),
  priority: z.number().int().min(1).max(10).optional(),
  auto_notify: z.boolean().optional(),
  is_active: z.boolean().optional(),
});

export const PUT = withErrorHandler(async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const { id } = await params;
  const supabase = await createClient();
  const payload = updateContactSchema.parse(await request.json());

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const client = supabase as unknown as any;

  const { data: contact, error } = await client
    .from('guide_emergency_contacts')
    .update({
      ...payload,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .eq('guide_id', user.id)
    .select()
    .single();

  if (error) {
    logger.error('Failed to update emergency contact', error, { contactId: id, guideId: user.id });
    return NextResponse.json({ error: 'Failed to update contact' }, { status: 500 });
  }

  if (!contact) {
    return NextResponse.json({ error: 'Contact not found' }, { status: 404 });
  }

  return NextResponse.json({ contact });
});

export const DELETE = withErrorHandler(async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const client = supabase as unknown as any;

  const { error } = await client
    .from('guide_emergency_contacts')
    .update({ is_active: false, updated_at: new Date().toISOString() })
    .eq('id', id)
    .eq('guide_id', user.id);

  if (error) {
    logger.error('Failed to delete emergency contact', error, { contactId: id, guideId: user.id });
    return NextResponse.json({ error: 'Failed to delete contact' }, { status: 500 });
  }

  return NextResponse.json({ success: true });
});


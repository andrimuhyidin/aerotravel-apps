/**
 * API: Partner Booking Note (Single)
 * PUT /api/partner/bookings/[id]/notes/[noteId] - Update a note
 * DELETE /api/partner/bookings/[id]/notes/[noteId] - Delete a note
 */

import { withErrorHandler } from '@/lib/api/error-handler';
import { verifyPartnerAccess, sanitizeRequestBody } from '@/lib/api/partner-helpers';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

type Params = Promise<{ id: string; noteId: string }>;

const updateNoteSchema = z.object({
  noteText: z.string().min(1, 'Note text is required'),
});

export const PUT = withErrorHandler(async (
  request: NextRequest,
  { params }: { params: Params }
) => {
  const { id: bookingId, noteId } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Verify partner access
  const { isPartner, partnerId } = await verifyPartnerAccess(user.id);
  if (!isPartner || !partnerId) {
    return NextResponse.json({ error: 'Partner access required' }, { status: 403 });
  }

  const body = await request.json();
  const validation = updateNoteSchema.safeParse(body);

  if (!validation.success) {
    return NextResponse.json(
      { error: 'Invalid request data', details: validation.error.issues },
      { status: 400 }
    );
  }

  const sanitizedBody = sanitizeRequestBody(validation.data, {
    strings: ['noteText'],
  });
  const { noteText } = sanitizedBody;
  const client = supabase as unknown as any;

  try {
    // Get note and verify ownership
    const { data: note, error: noteError } = await client
      .from('partner_booking_notes')
      .select(`
        id,
        booking_id,
        partner_id,
        user_id,
        booking:bookings(mitra_id)
      `)
      .eq('id', noteId)
      .eq('booking_id', bookingId)
      .is('deleted_at', null)
      .single();

    if (noteError || !note) {
      return NextResponse.json(
        { error: 'Note not found' },
        { status: 404 }
      );
    }

    // Check if user can edit (author or owner)
    const isAuthor = note.user_id === user.id;
    const isOwner = note.booking?.mitra_id === user.id;

    if (!isAuthor && !isOwner) {
      // Check if user is owner role in team
      const { data: teamMember } = await client
        .from('partner_users')
        .select('role')
        .eq('user_id', user.id)
        .eq('partner_id', note.partner_id)
        .eq('is_active', true)
        .is('deleted_at', null)
        .single();

      if (teamMember?.role !== 'owner') {
        return NextResponse.json(
          { error: 'Unauthorized to edit this note' },
          { status: 403 }
        );
      }
    }

    // Update note
    const { data: updatedNote, error: updateError } = await client
      .from('partner_booking_notes')
      .update({
        note_text: noteText,
        updated_at: new Date().toISOString(),
      })
      .eq('id', noteId)
      .select(`
        id,
        note_text,
        is_internal,
        user_id,
        created_at,
        updated_at,
        user:users!partner_booking_notes_user_id_fkey(id, full_name, email)
      `)
      .single();

    if (updateError) {
      logger.error('Failed to update booking note', updateError, {
        noteId,
        bookingId,
        userId: user.id,
      });
      return NextResponse.json(
        { error: 'Failed to update note' },
        { status: 500 }
      );
    }

    const transformedNote = {
      id: updatedNote.id,
      noteText: updatedNote.note_text,
      isInternal: updatedNote.is_internal,
      userId: updatedNote.user_id,
      authorName: updatedNote.user?.full_name || updatedNote.user?.email || 'Unknown',
      createdAt: updatedNote.created_at,
      updatedAt: updatedNote.updated_at,
    };

    return NextResponse.json({ note: transformedNote });
  } catch (error) {
    logger.error('Failed to update booking note', error, {
      noteId,
      bookingId,
      userId: user.id,
    });
    throw error;
  }
});

export const DELETE = withErrorHandler(async (
  request: NextRequest,
  { params }: { params: Params }
) => {
  const { id: bookingId, noteId } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Verify partner access
  const { isPartner, partnerId } = await verifyPartnerAccess(user.id);
  if (!isPartner || !partnerId) {
    return NextResponse.json({ error: 'Partner access required' }, { status: 403 });
  }

  const client = supabase as unknown as any;

  try {
    // Get note and verify ownership
    const { data: note, error: noteError } = await client
      .from('partner_booking_notes')
      .select(`
        id,
        booking_id,
        partner_id,
        user_id,
        booking:bookings(mitra_id)
      `)
      .eq('id', noteId)
      .eq('booking_id', bookingId)
      .is('deleted_at', null)
      .single();

    if (noteError || !note) {
      return NextResponse.json(
        { error: 'Note not found' },
        { status: 404 }
      );
    }

    // Check if user can delete (author or owner)
    const isAuthor = note.user_id === user.id;
    const isOwner = note.booking?.mitra_id === user.id;

    if (!isAuthor && !isOwner) {
      // Check if user is owner role in team
      const { data: teamMember } = await client
        .from('partner_users')
        .select('role')
        .eq('user_id', user.id)
        .eq('partner_id', note.partner_id)
        .eq('is_active', true)
        .is('deleted_at', null)
        .single();

      if (teamMember?.role !== 'owner') {
        return NextResponse.json(
          { error: 'Unauthorized to delete this note' },
          { status: 403 }
        );
      }
    }

    // Soft delete note
    const { error: deleteError } = await client
      .from('partner_booking_notes')
      .update({
        deleted_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', noteId);

    if (deleteError) {
      logger.error('Failed to delete booking note', deleteError, {
        noteId,
        bookingId,
        userId: user.id,
      });
      return NextResponse.json(
        { error: 'Failed to delete note' },
        { status: 500 }
      );
    }

    logger.info('Booking note deleted', {
      noteId,
      bookingId,
      userId: user.id,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error('Failed to delete booking note', error, {
      noteId,
      bookingId,
      userId: user.id,
    });
    throw error;
  }
});


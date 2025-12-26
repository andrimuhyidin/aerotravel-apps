/**
 * API: Partner Booking Notes
 * GET /api/partner/bookings/[id]/notes - Get notes for a booking
 * POST /api/partner/bookings/[id]/notes - Create a new note
 */

import { withErrorHandler } from '@/lib/api/error-handler';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

type Params = Promise<{ id: string }>;

const createNoteSchema = z.object({
  noteText: z.string().min(1, 'Note text is required'),
  isInternal: z.boolean().default(true),
});

export const GET = withErrorHandler(async (
  request: NextRequest,
  { params }: { params: Params }
) => {
  const { id: bookingId } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const client = supabase as unknown as any;

  try {
    // Verify booking belongs to partner
    const { data: booking, error: bookingError } = await client
      .from('bookings')
      .select('id, mitra_id')
      .eq('id', bookingId)
      .single();

    if (bookingError || !booking) {
      return NextResponse.json(
        { error: 'Booking not found' },
        { status: 404 }
      );
    }

    // Check if user is partner owner or team member
    const isOwner = booking.mitra_id === user.id;
    const { data: teamMember } = isOwner
      ? { data: null }
      : await client
          .from('partner_users')
          .select('id, partner_id, role')
          .eq('user_id', user.id)
          .eq('partner_id', booking.mitra_id)
          .eq('is_active', true)
          .is('deleted_at', null)
          .single();

    if (!isOwner && !teamMember) {
      return NextResponse.json(
        { error: 'Unauthorized access to booking' },
        { status: 403 }
      );
    }

    // Get notes
    const { data: notes, error: notesError } = await client
      .from('partner_booking_notes')
      .select(`
        id,
        note_text,
        is_internal,
        user_id,
        created_at,
        updated_at,
        user:users!partner_booking_notes_user_id_fkey(id, full_name, email)
      `)
      .eq('booking_id', bookingId)
      .eq('partner_id', booking.mitra_id)
      .is('deleted_at', null)
      .order('created_at', { ascending: false });

    if (notesError) {
      logger.error('Failed to fetch booking notes', notesError, {
        bookingId,
        userId: user.id,
      });
      return NextResponse.json(
        { error: 'Failed to fetch notes' },
        { status: 500 }
      );
    }

    const transformedNotes = (notes || []).map((note: any) => ({
      id: note.id,
      noteText: note.note_text,
      isInternal: note.is_internal,
      userId: note.user_id,
      authorName: note.user?.full_name || note.user?.email || 'Unknown',
      createdAt: note.created_at,
      updatedAt: note.updated_at,
    }));

    return NextResponse.json({ notes: transformedNotes });
  } catch (error) {
    logger.error('Failed to fetch booking notes', error, {
      bookingId,
      userId: user.id,
    });
    throw error;
  }
});

export const POST = withErrorHandler(async (
  request: NextRequest,
  { params }: { params: Params }
) => {
  const { id: bookingId } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const validation = createNoteSchema.safeParse(body);

  if (!validation.success) {
    return NextResponse.json(
      { error: 'Invalid request data', details: validation.error.issues },
      { status: 400 }
    );
  }

  const { noteText, isInternal } = validation.data;
  const client = supabase as unknown as any;

  try {
    // Verify booking belongs to partner
    const { data: booking, error: bookingError } = await client
      .from('bookings')
      .select('id, mitra_id')
      .eq('id', bookingId)
      .single();

    if (bookingError || !booking) {
      return NextResponse.json(
        { error: 'Booking not found' },
        { status: 404 }
      );
    }

    // Check if user is partner owner or team member
    const isOwner = booking.mitra_id === user.id;
    const { data: teamMember } = isOwner
      ? { data: null }
      : await client
          .from('partner_users')
          .select('id, partner_id, role')
          .eq('user_id', user.id)
          .eq('partner_id', booking.mitra_id)
          .eq('is_active', true)
          .is('deleted_at', null)
          .single();

    if (!isOwner && !teamMember) {
      return NextResponse.json(
        { error: 'Unauthorized access to booking' },
        { status: 403 }
      );
    }

    // Create note
    const { data: note, error: noteError } = await client
      .from('partner_booking_notes')
      .insert({
        booking_id: bookingId,
        partner_id: booking.mitra_id,
        user_id: user.id,
        note_text: noteText,
        is_internal: isInternal ?? true,
      })
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

    if (noteError) {
      logger.error('Failed to create booking note', noteError, {
        bookingId,
        userId: user.id,
      });
      return NextResponse.json(
        { error: 'Failed to create note' },
        { status: 500 }
      );
    }

    const transformedNote = {
      id: note.id,
      noteText: note.note_text,
      isInternal: note.is_internal,
      userId: note.user_id,
      authorName: note.user?.full_name || note.user?.email || 'Unknown',
      createdAt: note.created_at,
      updatedAt: note.updated_at,
    };

    logger.info('Booking note created', {
      bookingId,
      noteId: note.id,
      userId: user.id,
    });

    return NextResponse.json({ note: transformedNote }, { status: 201 });
  } catch (error) {
    logger.error('Failed to create booking note', error, {
      bookingId,
      userId: user.id,
    });
    throw error;
  }
});


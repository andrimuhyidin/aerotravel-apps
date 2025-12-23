/**
 * API: Trip Chat Messages
 * GET /api/guide/trips/[id]/chat - Get chat messages for a trip
 * POST /api/guide/trips/[id]/chat - Send a message in trip chat
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { withErrorHandler } from '@/lib/api/error-handler';
import {
  getBranchContext,
  withBranchFilter,
} from '@/lib/branch/branch-injection';
import { chatRateLimit } from '@/lib/integrations/rate-limit';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';

const sendMessageSchema = z.object({
  messageText: z.string().min(1).max(1000),
  templateType: z
    .enum(['delay_guest', 'bad_weather', 'boat_equipment_issue', 'custom'])
    .optional(),
  attachmentUrl: z.string().url().optional(),
  attachmentType: z.enum(['image', 'pdf', 'document']).optional(),
  attachmentFilename: z.string().optional(),
});

export const GET = withErrorHandler(
  async (
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
  ) => {
    const resolvedParams = await params;
    const { id: tripId } = resolvedParams;

    const supabase = await createClient();

    // Get pagination parameters
    const searchParams = request.nextUrl.searchParams;
    const limit = Math.min(
      parseInt(searchParams.get('limit') || '50', 10),
      100
    ); // Max 100
    const cursor = searchParams.get('cursor'); // ISO timestamp string

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const branchContext = await getBranchContext(user.id);
    const client = supabase as unknown as any;

    // Get user role
    let userRole = 'guide';
    try {
      const { data: userProfile, error: userProfileError } = await client
        .from('users')
        .select('role')
        .eq('id', user.id)
        .eq('branch_id', branchContext.branchId)
        .maybeSingle(); // Use maybeSingle instead of single to avoid error if not found

      if (userProfileError) {
        logger.warn(
          'Failed to fetch user profile for chat (using default role)',
          {
            userId: user.id,
            errorCode: (userProfileError as any)?.code,
            error: userProfileError,
          }
        );
        // Continue with default role 'guide'
      } else if (userProfile) {
        userRole = (userProfile as { role: string }).role || 'guide';
      }
    } catch (error) {
      logger.error('Exception fetching user profile for chat', error, {
        userId: user.id,
      });
      // Continue with default role 'guide'
    }

    // Check if guide is assigned to trip (if not ops/admin)
    if (userRole === 'guide') {
      try {
        const { data: assignment, error: assignmentError } = await client
          .from('trip_guides')
          .select('id, assignment_status, trips!inner(branch_id)')
          .eq('trip_id', tripId)
          .eq('guide_id', user.id)
          .eq('trips.branch_id', branchContext.branchId)
          .maybeSingle();

        if (assignmentError) {
          logger.warn(
            'Failed to check trip assignment for GET chat (will rely on RLS)',
            {
              tripId,
              guideId: user.id,
              errorCode: (assignmentError as any)?.code,
              error: assignmentError,
            }
          );
          // Don't return error - let RLS policy handle it
          // This allows for cases where assignment check fails but RLS allows access
        } else if (!assignment) {
          logger.warn(
            'Guide not assigned to trip for GET chat (will rely on RLS)',
            {
              tripId,
              guideId: user.id,
            }
          );
          // Don't return error - let RLS policy handle it
          // Return empty array instead if RLS blocks
        }
      } catch (error) {
        logger.error('Exception checking trip assignment', error, {
          tripId,
          guideId: user.id,
        });
        // Continue - let RLS policy handle it
      }
    }

    // Get chat messages with pagination (latest first, then reverse for display)
    // Try simpler query first without foreign key relationship
    let messagesQuery = client
      .from('trip_chat_messages')
      .select(
        `
      id,
      sender_id,
      sender_role,
      message_text,
      template_type,
      attachment_url,
      attachment_type,
      attachment_filename,
      created_at
    `,
        { count: 'exact' }
      )
      .eq('trip_id', tripId)
      .order('created_at', { ascending: false }) // Latest first for pagination
      .limit(limit + 1); // Fetch one extra to check if there are more

    // Apply cursor if provided
    if (cursor) {
      messagesQuery = messagesQuery.lt('created_at', cursor);
    }

    let messages: unknown[] | null = null;
    let messagesError: unknown = null;
    let count: number | null = null;

    try {
      const result = await messagesQuery;
      messages = result.data;
      messagesError = result.error;
      count = result.count;
    } catch (error) {
      messagesError = error;
      logger.error('Exception executing messages query', error, { tripId });
    }

    if (messagesError) {
      logger.error('Failed to fetch trip chat messages', messagesError, {
        tripId,
        guideId: user.id,
        errorCode: (messagesError as any)?.code,
        errorMessage: (messagesError as any)?.message,
        errorDetails: (messagesError as any)?.details,
        errorHint: (messagesError as any)?.hint,
      });

      // Check if table doesn't exist
      if (
        (messagesError as any)?.code === '42P01' ||
        (messagesError as any)?.code === 'PGRST205'
      ) {
        return NextResponse.json(
          { error: 'Fitur chat belum tersedia. Silakan hubungi admin.' },
          { status: 503 }
        );
      }

      // Check if RLS/permission error
      const isRlsError =
        (messagesError as any)?.code === 'PGRST301' ||
        (messagesError as any)?.code === '42501' ||
        (messagesError as any)?.message?.toLowerCase().includes('permission') ||
        (messagesError as any)?.message?.toLowerCase().includes('policy') ||
        (messagesError as any)?.message
          ?.toLowerCase()
          .includes('row-level security');

      if (isRlsError) {
        logger.warn(
          'RLS error detected for chat messages - guide may not be assigned to trip',
          {
            tripId,
            guideId: user.id,
            hint: 'Check if guide is assigned to trip via trip_guides table',
          }
        );

        // Return empty array instead of error (better UX)
        return NextResponse.json({
          messages: [],
          hasMore: false,
          nextCursor: null,
          totalCount: 0,
        });
      }

      return NextResponse.json(
        { error: 'Gagal memuat pesan chat' },
        { status: 500 }
      );
    }

    // Fetch sender info separately if messages exist
    let senderInfoMap: Record<
      string,
      { full_name: string | null; avatar_url: string | null }
    > = {};
    if (messages && messages.length > 0) {
      const senderIds = [...new Set(messages.map((msg: any) => msg.sender_id))];
      const { data: senders, error: sendersError } = await client
        .from('users')
        .select('id, full_name, avatar_url')
        .in('id', senderIds)
        .eq('branch_id', branchContext.branchId);

      if (!sendersError && senders) {
        senderInfoMap = senders.reduce(
          (
            acc: Record<
              string,
              { full_name: string | null; avatar_url: string | null }
            >,
            sender: any
          ) => {
            acc[sender.id] = {
              full_name: sender.full_name,
              avatar_url: sender.avatar_url,
            };
            return acc;
          },
          {}
        );
      }
    }

    // Check if there are more messages
    const hasMore = messages ? messages.length > limit : false;
    const messagesToReturn =
      hasMore && messages ? messages.slice(0, limit) : messages || [];

    // Reverse to show oldest first (for display)
    const formattedMessages = messagesToReturn.reverse().map((msg: any) => {
      const senderInfo = senderInfoMap[msg.sender_id] || {
        full_name: null,
        avatar_url: null,
      };
      return {
        id: msg.id,
        senderId: msg.sender_id,
        senderRole: msg.sender_role,
        messageText: msg.message_text,
        templateType: msg.template_type,
        attachmentUrl: msg.attachment_url || null,
        attachmentType: msg.attachment_type || null,
        attachmentFilename: msg.attachment_filename || null,
        createdAt: msg.created_at,
        senderName: senderInfo.full_name || 'Unknown',
        senderAvatar: senderInfo.avatar_url || null,
      };
    });

    // Get cursor for next page (oldest message timestamp)
    const nextCursor =
      formattedMessages.length > 0 && formattedMessages[0]
        ? formattedMessages[0].createdAt
        : null;

    return NextResponse.json({
      messages: formattedMessages,
      hasMore,
      nextCursor,
      totalCount: count || formattedMessages.length,
    });
  }
);

export const POST = withErrorHandler(
  async (
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
  ) => {
    const resolvedParams = await params;
    const { id: tripId } = resolvedParams;
    const supabase = await createClient();

    // Authenticate user first
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const branchContext = await getBranchContext(user.id);

    // Check if request is FormData (file upload) or JSON (text only)
    const contentType = request.headers.get('content-type') || '';
    let payload: z.infer<typeof sendMessageSchema>;
    let attachmentUrl: string | null = null;
    let attachmentType: string | null = null;
    let attachmentFilename: string | null = null;

    if (contentType.includes('multipart/form-data')) {
      // Handle file upload
      const formData = await request.formData();
      const file = formData.get('file') as File | null;
      const messageText = formData.get('messageText') as string | null;
      const templateType = formData.get('templateType') as string | null;

      if (!messageText) {
        return NextResponse.json(
          { error: 'messageText is required' },
          { status: 400 }
        );
      }

      // Validate and upload file if provided
      if (file) {
        // Validate file type
        const allowedImageTypes = [
          'image/jpeg',
          'image/jpg',
          'image/png',
          'image/webp',
        ];
        const allowedDocTypes = [
          'application/pdf',
          'application/msword',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        ];
        const allowedTypes = [...allowedImageTypes, ...allowedDocTypes];

        if (!allowedTypes.includes(file.type)) {
          return NextResponse.json(
            {
              error:
                'File type not allowed. Only images (JPG, PNG, WebP) and documents (PDF, DOC, DOCX) are supported.',
            },
            { status: 400 }
          );
        }

        // Validate file size
        const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB
        const MAX_DOC_SIZE = 5 * 1024 * 1024; // 5MB
        const maxSize = allowedImageTypes.includes(file.type)
          ? MAX_IMAGE_SIZE
          : MAX_DOC_SIZE;

        if (file.size > maxSize) {
          return NextResponse.json(
            {
              error: `File size exceeds maximum of ${maxSize / 1024 / 1024}MB`,
            },
            { status: 400 }
          );
        }

        // Determine attachment type
        if (allowedImageTypes.includes(file.type)) {
          attachmentType = 'image';
        } else {
          attachmentType = 'pdf'; // For now, treat all docs as PDF
        }

        attachmentFilename = file.name;

        // Upload to Supabase Storage
        const fileExt = file.name.split('.').pop() || 'jpg';
        const fileName = `chat_${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
        const filePath = `guide-chat-attachments/${branchContext.branchId || 'default'}/${tripId}/${fileName}`;

        const arrayBuffer = await file.arrayBuffer();
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('guide-chat-attachments')
          .upload(filePath, arrayBuffer, {
            contentType: file.type,
            upsert: false,
          });

        if (uploadError) {
          logger.error('Failed to upload chat attachment', uploadError, {
            tripId,
          });
          return NextResponse.json(
            { error: 'Failed to upload file' },
            { status: 500 }
          );
        }

        // Get public URL
        const { data: urlData } = supabase.storage
          .from('guide-chat-attachments')
          .getPublicUrl(filePath);

        attachmentUrl = urlData.publicUrl;
      }

      payload = sendMessageSchema.parse({
        messageText,
        templateType: templateType || undefined,
        attachmentUrl: attachmentUrl || undefined,
        attachmentType: attachmentType || undefined,
        attachmentFilename: attachmentFilename || undefined,
      });
    } else {
      // Handle JSON (text only)
      payload = sendMessageSchema.parse(await request.json());
      attachmentUrl = payload.attachmentUrl || null;
      attachmentType = payload.attachmentType || null;
      attachmentFilename = payload.attachmentFilename || null;
    }

    const client = supabase as unknown as any;

    // Get user role
    const { data: userProfile } = await withBranchFilter(
      client.from('users'),
      branchContext
    )
      .select('role')
      .eq('id', user.id)
      .single();

    const userRole = (userProfile as { role: string } | null)?.role || 'guide';

    // Determine sender role
    let senderRole: 'guide' | 'ops' | 'admin' = 'guide';
    if (
      userRole === 'ops' ||
      userRole === 'admin' ||
      userRole === 'super_admin'
    ) {
      senderRole =
        userRole === 'admin' || userRole === 'super_admin' ? 'admin' : 'ops';
    }

    // Check rate limit before processing
    const rateLimitResult = await chatRateLimit.limit(user.id);

    if (!rateLimitResult.success) {
      const retryAfter = Math.ceil((rateLimitResult.reset - Date.now()) / 1000);
      logger.warn('Chat rate limit exceeded', {
        userId: user.id,
        tripId,
        retryAfter,
      });

      return NextResponse.json(
        {
          error:
            'Terlalu banyak pesan. Silakan tunggu sebentar sebelum mengirim pesan lagi.',
          retryAfter,
        },
        {
          status: 429,
          headers: {
            'Retry-After': retryAfter.toString(),
            'X-RateLimit-Limit': '10',
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': rateLimitResult.reset.toString(),
          },
        }
      );
    }

    // Check if guide is assigned to trip (if not ops/admin)
    if (senderRole === 'guide') {
      const { data: assignment, error: assignmentError } =
        await withBranchFilter(client.from('trip_guides'), branchContext)
          .select('id, assignment_status')
          .eq('trip_id', tripId)
          .eq('guide_id', user.id)
          .maybeSingle();

      if (assignmentError) {
        logger.error(
          'Failed to check trip assignment for chat',
          assignmentError,
          {
            tripId,
            guideId: user.id,
          }
        );
        return NextResponse.json(
          { error: 'Gagal memverifikasi assignment trip' },
          { status: 500 }
        );
      }

      if (!assignment) {
        logger.warn('Guide not assigned to trip for chat', {
          tripId,
          guideId: user.id,
        });
        return NextResponse.json(
          {
            error:
              'Anda tidak di-assign ke trip ini. Tidak dapat mengirim pesan.',
          },
          { status: 403 }
        );
      }
    }

    // Insert message
    const { data: message, error: insertError } = await client
      .from('trip_chat_messages')
      .insert({
        trip_id: tripId,
        sender_id: user.id,
        sender_role: senderRole,
        message_text: payload.messageText,
        template_type: payload.templateType || 'custom',
        attachment_url: attachmentUrl,
        attachment_type: attachmentType,
        attachment_filename: attachmentFilename,
        created_at: new Date().toISOString(),
      })
      .select(
        'id, sender_id, sender_role, message_text, template_type, attachment_url, attachment_type, attachment_filename, created_at'
      )
      .single();

    if (insertError || !message) {
      logger.error('Failed to send trip chat message', insertError, {
        tripId,
        guideId: user.id,
        errorCode: (insertError as any)?.code,
        errorMessage: (insertError as any)?.message,
      });

      // Better error message
      const errorMsg = (insertError as any)?.message || 'Gagal mengirim pesan';
      return NextResponse.json({ error: errorMsg }, { status: 500 });
    }

    logger.info('Trip chat message sent', {
      messageId: message.id,
      tripId,
      senderId: user.id,
      senderRole,
    });

    return NextResponse.json(
      {
        success: true,
        message: {
          id: message.id,
          senderId: message.sender_id,
          senderRole: message.sender_role,
          messageText: message.message_text,
          templateType: message.template_type,
          attachmentUrl: (message as any).attachment_url || null,
          attachmentType: (message as any).attachment_type || null,
          attachmentFilename: (message as any).attachment_filename || null,
          createdAt: message.created_at,
        },
      },
      {
        headers: {
          'X-RateLimit-Limit': '10',
          'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
          'X-RateLimit-Reset': rateLimitResult.reset.toString(),
        },
      }
    );
  }
);

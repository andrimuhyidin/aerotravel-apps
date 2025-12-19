/**
 * API: Update Trip Task
 * PATCH /api/guide/trips/[id]/tasks/[taskId] - Update task completion status
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { withErrorHandler } from '@/lib/api/error-handler';
import { getBranchContext, withBranchFilter } from '@/lib/branch/branch-injection';
import { sendFeedbackRequests } from '@/lib/guide/trip-feedback';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';

const updateTaskSchema = z.object({
  completed: z.boolean(),
});

export const PATCH = withErrorHandler(async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string; taskId: string }> },
) => {
  const resolvedParams = await params;
  const { id: tripId, taskId } = resolvedParams;
  const supabase = await createClient();
  const payload = updateTaskSchema.parse(await request.json());

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const branchContext = await getBranchContext(user.id);
  const client = supabase as unknown as any;

  // Update task
  const { data: task, error: updateError } = await withBranchFilter(
    client.from('trip_tasks'),
    branchContext,
  )
    .update({
      completed: payload.completed,
      completed_at: payload.completed ? new Date().toISOString() : null,
      completed_by: payload.completed ? user.id : null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', taskId)
    .eq('trip_id', tripId)
    .select()
    .single();

  if (updateError || !task) {
    logger.error('Failed to update trip task', updateError, { tripId, taskId });
    return NextResponse.json({ error: 'Failed to update task' }, { status: 500 });
  }

  // Check if all required tasks are completed to mark trip as complete
  if (payload.completed) {
    const { data: allTasks } = await withBranchFilter(
      client.from('trip_tasks'),
      branchContext,
    )
      .select('required, completed')
      .eq('trip_id', tripId);

    const requiredTasks = allTasks?.filter((t: { required: boolean }) => t.required) || [];
    const allRequiredCompleted = requiredTasks.every((t: { completed: boolean }) => t.completed);

    if (allRequiredCompleted && requiredTasks.length > 0) {
      // Check if trip was already completed
      const { data: currentTrip } = await withBranchFilter(
        client.from('trips'),
        branchContext,
      )
        .select('status, completed_at')
        .eq('id', tripId)
        .single();

      const wasAlreadyCompleted = currentTrip?.status === 'completed' && currentTrip?.completed_at;

      // Update trip status to completed (if not already)
      await withBranchFilter(client.from('trips'), branchContext)
        .update({
          completed_at: new Date().toISOString(),
          completed_by: user.id,
          status: 'completed',
          updated_at: new Date().toISOString(),
        })
        .eq('id', tripId)
        .eq('status', 'ongoing'); // Only update if still ongoing

      logger.info('Trip marked as completed', {
        tripId,
        guideId: user.id,
        allRequiredTasksCompleted: true,
      });

      // Send feedback requests if trip was just completed (not already completed)
      if (!wasAlreadyCompleted) {
        try {
          const feedbackResult = await sendFeedbackRequests(tripId);
          logger.info('Feedback requests sent', {
            tripId,
            sentCount: feedbackResult.sentCount,
            success: feedbackResult.success,
          });
        } catch (feedbackError) {
          logger.error('Failed to send feedback requests', feedbackError, { tripId });
          // Don't fail the request if feedback sending fails
        }

        // Auto-process payment for completed trip (async, don't wait)
        // Payment will be processed using fee from trip_guides
        try {
          const { processTripPayment } = await import('@/lib/guide/contract-payment');
          processTripPayment(tripId, user.id).catch((paymentError) => {
            logger.warn('Failed to auto-process trip payment', {
              error: paymentError instanceof Error ? paymentError.message : String(paymentError),
              tripId,
              guideId: user.id,
            });
            // Don't fail - payment can be processed manually later
          });
        } catch (importError) {
          logger.warn('Failed to import payment processor', {
            error: importError instanceof Error ? importError.message : String(importError),
          });
          // Don't fail - payment can be processed manually later
        }
      }
    }
  }

  return NextResponse.json({
    success: true,
    task: {
      id: task.id,
      label: task.label,
      required: task.required,
      completed: task.completed,
      completedAt: task.completed_at,
      category: task.category,
    },
  });
});

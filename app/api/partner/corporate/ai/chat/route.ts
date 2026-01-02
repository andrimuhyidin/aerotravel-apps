/**
 * API: Corporate AI Chat
 * POST /api/partner/corporate/ai/chat - Chat with AI assistant
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { withErrorHandler } from '@/lib/api/error-handler';
import {
  chatCorporateAssistant,
  generateBudgetInsights,
  getSuggestedQuestions,
  type CorporateContext,
} from '@/lib/ai/corporate-assistant';
import { getCorporateClient, getDashboardStats } from '@/lib/corporate';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';

const chatSchema = z.object({
  message: z.string().min(1, 'Message is required').max(1000, 'Message too long'),
});

export const POST = withErrorHandler(async (request: NextRequest) => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const corporate = await getCorporateClient(user.id);

    if (!corporate) {
      return NextResponse.json(
        { error: 'No corporate access' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const parsed = chatSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { message } = parsed.data;

    // Get dashboard stats for context
    const stats = await getDashboardStats(corporate.id);

    // Get department breakdown
    const { data: employees } = await supabase
      .from('corporate_employees')
      .select('department, allocated_amount, used_amount')
      .eq('corporate_id', corporate.id)
      .eq('is_active', true);

    const departmentMap = new Map<string, { budget: number; spent: number; bookings: number }>();
    (employees || []).forEach((emp) => {
      const e = emp as { department: string | null; allocated_amount: number; used_amount: number };
      const dept = e.department || 'Unknown';
      if (!departmentMap.has(dept)) {
        departmentMap.set(dept, { budget: 0, spent: 0, bookings: 0 });
      }
      const deptData = departmentMap.get(dept)!;
      deptData.budget += Number(e.allocated_amount || 0);
      deptData.spent += Number(e.used_amount || 0);
    });

    const departmentStats = Array.from(departmentMap.entries()).map(([dept, data]) => ({
      department: dept,
      budget: data.budget,
      spent: data.spent,
      bookings: data.bookings,
    }));

    // Build context
    const context: CorporateContext = {
      corporateId: corporate.id,
      companyName: corporate.companyName,
      budget: {
        total: stats.totalAllocated,
        used: stats.totalUsed,
        remaining: stats.remainingBudget,
        usagePercentage: stats.totalAllocated > 0 
          ? Math.round((stats.totalUsed / stats.totalAllocated) * 100) 
          : 0,
      },
      employees: {
        total: stats.totalEmployees,
        active: stats.activeEmployees,
        pendingInvitations: stats.pendingInvitations,
      },
      pendingApprovals: stats.pendingApprovals,
      recentBookings: {
        count: stats.recentBookings,
        totalAmount: 0, // Would need additional query
      },
      departmentStats,
    };

    // Generate alerts
    const alerts: Array<{ type: string; message: string; severity: 'info' | 'warning' | 'critical' }> = [];
    
    if (context.budget.usagePercentage >= 90) {
      alerts.push({
        type: 'budget',
        message: 'Budget hampir habis!',
        severity: 'critical',
      });
    } else if (context.budget.usagePercentage >= 75) {
      alerts.push({
        type: 'budget',
        message: 'Budget sudah terpakai lebih dari 75%',
        severity: 'warning',
      });
    }

    if (stats.pendingApprovals > 5) {
      alerts.push({
        type: 'approval',
        message: `${stats.pendingApprovals} approval menunggu`,
        severity: 'warning',
      });
    }

    context.alerts = alerts;

    // Get AI response
    const response = await chatCorporateAssistant(message, context);

    // Get suggested follow-up questions
    const suggestions = getSuggestedQuestions(context);

    logger.info('Corporate AI chat', {
      corporateId: corporate.id,
      userId: user.id,
      messageLength: message.length,
      responseLength: response.length,
    });

    return NextResponse.json({
      response,
      suggestions,
    });
  } catch (error) {
    logger.error('Corporate AI chat error', error, { userId: user.id });
    return NextResponse.json(
      { error: 'Failed to process chat' },
      { status: 500 }
    );
  }
});

/**
 * GET /api/partner/corporate/ai/chat
 * Get initial suggestions and insights
 */
export const GET = withErrorHandler(async () => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const corporate = await getCorporateClient(user.id);

    if (!corporate) {
      return NextResponse.json(
        { error: 'No corporate access' },
        { status: 403 }
      );
    }

    const stats = await getDashboardStats(corporate.id);

    const context: CorporateContext = {
      corporateId: corporate.id,
      companyName: corporate.companyName,
      budget: {
        total: stats.totalAllocated,
        used: stats.totalUsed,
        remaining: stats.remainingBudget,
        usagePercentage: stats.totalAllocated > 0 
          ? Math.round((stats.totalUsed / stats.totalAllocated) * 100) 
          : 0,
      },
      employees: {
        total: stats.totalEmployees,
        active: stats.activeEmployees,
        pendingInvitations: stats.pendingInvitations,
      },
      pendingApprovals: stats.pendingApprovals,
      recentBookings: {
        count: stats.recentBookings,
        totalAmount: 0,
      },
    };

    const insights = await generateBudgetInsights(context);
    const suggestions = getSuggestedQuestions(context);

    return NextResponse.json({
      insights,
      suggestions,
      context: {
        companyName: corporate.companyName,
        budgetUsage: context.budget.usagePercentage,
        pendingApprovals: stats.pendingApprovals,
      },
    });
  } catch (error) {
    logger.error('Failed to get AI context', error, { userId: user.id });
    return NextResponse.json(
      { error: 'Failed to get context' },
      { status: 500 }
    );
  }
});


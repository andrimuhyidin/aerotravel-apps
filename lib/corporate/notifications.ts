/**
 * Corporate Notification Functions
 * Send notifications for corporate portal events
 */

import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';

type NotificationPayload = {
  userId: string;
  type: string;
  title: string;
  message: string;
  metadata?: Record<string, unknown>;
};

/**
 * Create a notification in the database
 */
async function createNotification(payload: NotificationPayload): Promise<boolean> {
  try {
    const supabase = await createClient();
    
    const { error } = await supabase.from('notifications').insert({
      user_id: payload.userId,
      app: 'corporate',
      type: payload.type,
      title: payload.title,
      message: payload.message,
      metadata: payload.metadata || {},
      read: false,
    });

    if (error) {
      logger.error('Failed to create notification', error, { payload });
      return false;
    }

    return true;
  } catch (error) {
    logger.error('Error creating notification', error, { payload });
    return false;
  }
}

/**
 * Notify PIC about new approval request
 * @param picUserId - PIC user ID
 * @param approvalData - Approval details
 */
export async function notifyApprovalRequested(
  picUserId: string,
  approvalData: {
    approvalId: string;
    employeeName: string;
    bookingCode: string;
    amount: number;
    packageName?: string;
  }
): Promise<boolean> {
  const formattedAmount = new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(approvalData.amount);

  return createNotification({
    userId: picUserId,
    type: 'corporate.approval_requested',
    title: 'Permintaan Approval Baru',
    message: `${approvalData.employeeName} mengajukan booking ${approvalData.bookingCode} senilai ${formattedAmount}`,
    metadata: {
      approvalId: approvalData.approvalId,
      bookingCode: approvalData.bookingCode,
      employeeName: approvalData.employeeName,
      amount: approvalData.amount,
      packageName: approvalData.packageName,
    },
  });
}

/**
 * Notify employee about approval decision
 * @param employeeUserId - Employee user ID
 * @param approved - Whether booking was approved
 * @param data - Approval details
 */
export async function notifyApprovalDecision(
  employeeUserId: string,
  approved: boolean,
  data: {
    bookingCode: string;
    amount: number;
    reason?: string;
    approverName?: string;
  }
): Promise<boolean> {
  const formattedAmount = new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(data.amount);

  if (approved) {
    return createNotification({
      userId: employeeUserId,
      type: 'corporate.approval_approved',
      title: 'Booking Disetujui! ✅',
      message: `Booking ${data.bookingCode} senilai ${formattedAmount} telah disetujui${data.approverName ? ` oleh ${data.approverName}` : ''}`,
      metadata: {
        bookingCode: data.bookingCode,
        amount: data.amount,
        approverName: data.approverName,
      },
    });
  } else {
    return createNotification({
      userId: employeeUserId,
      type: 'corporate.approval_rejected',
      title: 'Booking Ditolak',
      message: `Booking ${data.bookingCode} ditolak${data.reason ? `: ${data.reason}` : ''}`,
      metadata: {
        bookingCode: data.bookingCode,
        amount: data.amount,
        reason: data.reason,
        approverName: data.approverName,
      },
    });
  }
}

/**
 * Notify about budget threshold exceeded
 * @param userId - User to notify (PIC or admin)
 * @param data - Budget data
 */
export async function notifyBudgetThreshold(
  userId: string,
  data: {
    department?: string;
    usagePercentage: number;
    remaining: number;
    total: number;
  }
): Promise<boolean> {
  const formattedRemaining = new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(data.remaining);

  const isHighAlert = data.usagePercentage >= 90;
  const deptText = data.department ? ` untuk ${data.department}` : '';

  return createNotification({
    userId,
    type: 'corporate.budget_threshold',
    title: isHighAlert ? '⚠️ Budget Hampir Habis!' : '📊 Peringatan Budget',
    message: `Budget${deptText} sudah terpakai ${data.usagePercentage}%. Sisa: ${formattedRemaining}`,
    metadata: {
      department: data.department,
      usagePercentage: data.usagePercentage,
      remaining: data.remaining,
      total: data.total,
    },
  });
}

/**
 * Send booking reminder
 * @param userId - User to remind
 * @param data - Booking data
 */
export async function notifyBookingReminder(
  userId: string,
  data: {
    bookingCode: string;
    tripDate: string;
    packageName: string;
    daysUntilTrip: number;
  }
): Promise<boolean> {
  const formattedDate = new Date(data.tripDate).toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  let title: string;
  if (data.daysUntilTrip === 1) {
    title = '📅 Perjalanan Besok!';
  } else if (data.daysUntilTrip === 3) {
    title = '📅 Perjalanan 3 Hari Lagi';
  } else if (data.daysUntilTrip === 7) {
    title = '📅 Perjalanan Minggu Depan';
  } else {
    title = `📅 Reminder: ${data.daysUntilTrip} Hari Lagi`;
  }

  return createNotification({
    userId,
    type: 'corporate.booking_reminder',
    title,
    message: `${data.packageName} pada ${formattedDate}`,
    metadata: {
      bookingCode: data.bookingCode,
      tripDate: data.tripDate,
      packageName: data.packageName,
      daysUntilTrip: data.daysUntilTrip,
    },
  });
}

/**
 * Notify employee about invitation
 * @param employeeEmail - Employee email
 * @param data - Invitation data
 */
export async function notifyEmployeeInvited(
  userId: string,
  data: {
    companyName: string;
    invitedBy: string;
    allocatedBudget?: number;
  }
): Promise<boolean> {
  const budgetText = data.allocatedBudget
    ? ` dengan alokasi budget ${new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
      }).format(data.allocatedBudget)}`
    : '';

  return createNotification({
    userId,
    type: 'corporate.employee_invited',
    title: '🎉 Undangan Corporate Travel',
    message: `Anda diundang bergabung dengan ${data.companyName}${budgetText}`,
    metadata: {
      companyName: data.companyName,
      invitedBy: data.invitedBy,
      allocatedBudget: data.allocatedBudget,
    },
  });
}

/**
 * Check and send budget threshold notifications for all departments
 * @param corporateId - Corporate ID
 */
export async function checkBudgetThresholds(corporateId: string): Promise<void> {
  try {
    const supabase = await createClient();

    // Get corporate with PIC
    const { data: corporate } = await supabase
      .from('corporate_clients')
      .select('id, pic_id, company_name')
      .eq('id', corporateId)
      .single();

    if (!corporate || !(corporate as { pic_id: string }).pic_id) {
      return;
    }

    const picId = (corporate as { pic_id: string }).pic_id;

    // Get budget data by department
    const { data: employees } = await supabase
      .from('corporate_employees')
      .select('department, allocated_amount, used_amount')
      .eq('corporate_id', corporateId)
      .eq('is_active', true);

    if (!employees || employees.length === 0) {
      return;
    }

    // Aggregate by department
    const departmentBudgets = new Map<string, { allocated: number; used: number }>();
    
    (employees as Array<{ department: string | null; allocated_amount: number; used_amount: number }>).forEach((emp) => {
      const dept = emp.department || 'General';
      if (!departmentBudgets.has(dept)) {
        departmentBudgets.set(dept, { allocated: 0, used: 0 });
      }
      const deptData = departmentBudgets.get(dept)!;
      deptData.allocated += Number(emp.allocated_amount || 0);
      deptData.used += Number(emp.used_amount || 0);
    });

    // Check each department
    for (const [department, budget] of Array.from(departmentBudgets.entries())) {
      if (budget.allocated === 0) continue;

      const usagePercentage = Math.round((budget.used / budget.allocated) * 100);

      // Send notification if usage is >= 80%
      if (usagePercentage >= 80) {
        await notifyBudgetThreshold(picId, {
          department,
          usagePercentage,
          remaining: budget.allocated - budget.used,
          total: budget.allocated,
        });
      }
    }

    // Also check total budget
    const totalAllocated = Array.from(departmentBudgets.values()).reduce(
      (sum, d) => sum + d.allocated,
      0
    );
    const totalUsed = Array.from(departmentBudgets.values()).reduce(
      (sum, d) => sum + d.used,
      0
    );

    if (totalAllocated > 0) {
      const totalUsagePercentage = Math.round((totalUsed / totalAllocated) * 100);
      
      if (totalUsagePercentage >= 80) {
        await notifyBudgetThreshold(picId, {
          usagePercentage: totalUsagePercentage,
          remaining: totalAllocated - totalUsed,
          total: totalAllocated,
        });
      }
    }

    logger.info('Budget threshold check completed', { corporateId });
  } catch (error) {
    logger.error('Failed to check budget thresholds', error, { corporateId });
  }
}

/**
 * Send upcoming booking reminders for a corporate
 * @param corporateId - Corporate ID
 * @param daysAhead - Days to check ahead (1, 3, or 7)
 */
export async function sendBookingReminders(
  corporateId: string,
  daysAhead: number = 7
): Promise<void> {
  try {
    const supabase = await createClient();

    // Get employees with user_ids
    const { data: employees } = await supabase
      .from('corporate_employees')
      .select('id, user_id')
      .eq('corporate_id', corporateId)
      .eq('is_active', true)
      .not('user_id', 'is', null);

    if (!employees || employees.length === 0) {
      return;
    }

    const employeeUserIds = (employees as Array<{ user_id: string }>).map(
      (e) => e.user_id
    );

    // Calculate target dates
    const today = new Date();
    const targetDates: Date[] = [];
    
    for (const days of [1, 3, 7]) {
      if (days <= daysAhead) {
        const targetDate = new Date(today);
        targetDate.setDate(targetDate.getDate() + days);
        targetDates.push(targetDate);
      }
    }

    // Get upcoming bookings for these dates
    for (const targetDate of targetDates) {
      const dateStr = targetDate.toISOString().split('T')[0];
      const daysUntilTrip = Math.round(
        (targetDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
      );

      const { data: bookings } = await supabase
        .from('bookings')
        .select(`
          id,
          booking_code,
          trip_date,
          created_by,
          packages (name)
        `)
        .in('created_by', employeeUserIds)
        .eq('trip_date', dateStr)
        .eq('status', 'confirmed')
        .is('deleted_at', null);

      if (!bookings) continue;

      for (const booking of bookings) {
        const b = booking as {
          booking_code: string;
          trip_date: string;
          created_by: string;
          packages: { name: string } | null;
        };

        await notifyBookingReminder(b.created_by, {
          bookingCode: b.booking_code,
          tripDate: b.trip_date,
          packageName: b.packages?.name || 'Unknown Package',
          daysUntilTrip,
        });
      }
    }

    logger.info('Booking reminders sent', { corporateId, daysAhead });
  } catch (error) {
    logger.error('Failed to send booking reminders', error, { corporateId });
  }
}


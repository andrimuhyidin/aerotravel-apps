/**
 * Corporate Portal Library
 * Functions for managing corporate clients, employees, and invoices
 */

import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';

/**
 * Corporate Client data
 */
export type CorporateClient = {
  id: string;
  branchId: string;
  companyName: string;
  companyAddress: string | null;
  companyPhone: string | null;
  companyEmail: string | null;
  npwp: string | null;
  npwpName: string | null;
  npwpAddress: string | null;
  picId: string | null;
  picName: string | null;
  picPhone: string | null;
  picEmail: string | null;
  contractStart: string | null;
  contractEnd: string | null;
  contractDocumentUrl: string | null;
  creditLimit: number;
  isActive: boolean;
  createdAt: string;
};

/**
 * Corporate Employee data
 */
export type CorporateEmployee = {
  id: string;
  corporateId: string;
  userId: string | null;
  employeeIdNumber: string | null;
  fullName: string;
  email: string;
  phone: string | null;
  department: string | null;
  allocatedAmount: number;
  usedAmount: number;
  remainingAmount: number;
  isActive: boolean;
  invitationSentAt: string | null;
  registeredAt: string | null;
  createdAt: string;
};

/**
 * Corporate Deposit data
 */
export type CorporateDeposit = {
  id: string;
  corporateId: string;
  balance: number;
};

/**
 * Dashboard statistics
 */
export type CorporateDashboardStats = {
  totalEmployees: number;
  activeEmployees: number;
  pendingInvitations: number;
  totalAllocated: number;
  totalUsed: number;
  remainingBudget: number;
  depositBalance: number;
  pendingApprovals: number;
  recentBookings: number;
};

/**
 * Get corporate client for a user
 */
export async function getCorporateClient(
  userId: string
): Promise<CorporateClient | null> {
  const supabase = await createClient();

  // First check if user is a PIC
  const { data: asPic } = await supabase
    .from('corporate_clients')
    .select('*')
    .eq('pic_id', userId)
    .eq('is_active', true)
    .single();

  if (asPic) {
    return mapCorporateClient(asPic);
  }

  // Check if user is an employee
  const { data: asEmployee } = await supabase
    .from('corporate_employees')
    .select('corporate_id')
    .eq('user_id', userId)
    .eq('is_active', true)
    .single();

  if (asEmployee) {
    const { data: corporate } = await supabase
      .from('corporate_clients')
      .select('*')
      .eq('id', (asEmployee as { corporate_id: string }).corporate_id)
      .eq('is_active', true)
      .single();

    if (corporate) {
      return mapCorporateClient(corporate);
    }
  }

  return null;
}

function mapCorporateClient(row: unknown): CorporateClient {
  const r = row as {
    id: string;
    branch_id: string;
    company_name: string;
    company_address: string | null;
    company_phone: string | null;
    company_email: string | null;
    npwp: string | null;
    npwp_name: string | null;
    npwp_address: string | null;
    pic_id: string | null;
    pic_name: string | null;
    pic_phone: string | null;
    pic_email: string | null;
    contract_start: string | null;
    contract_end: string | null;
    contract_document_url: string | null;
    credit_limit: number;
    is_active: boolean;
    created_at: string;
  };

  return {
    id: r.id,
    branchId: r.branch_id,
    companyName: r.company_name,
    companyAddress: r.company_address,
    companyPhone: r.company_phone,
    companyEmail: r.company_email,
    npwp: r.npwp,
    npwpName: r.npwp_name,
    npwpAddress: r.npwp_address,
    picId: r.pic_id,
    picName: r.pic_name,
    picPhone: r.pic_phone,
    picEmail: r.pic_email,
    contractStart: r.contract_start,
    contractEnd: r.contract_end,
    contractDocumentUrl: r.contract_document_url,
    creditLimit: Number(r.credit_limit),
    isActive: r.is_active,
    createdAt: r.created_at,
  };
}

/**
 * Get dashboard statistics
 */
export async function getDashboardStats(
  corporateId: string
): Promise<CorporateDashboardStats> {
  const supabase = await createClient();

  // Get employee stats
  const { data: employees } = await supabase
    .from('corporate_employees')
    .select('user_id, is_active, allocated_amount, used_amount, invitation_sent_at, registered_at')
    .eq('corporate_id', corporateId);

  const employeeList = (employees || []) as Array<{
    user_id: string | null;
    is_active: boolean;
    allocated_amount: number;
    used_amount: number;
    invitation_sent_at: string | null;
    registered_at: string | null;
  }>;

  const totalEmployees = employeeList.length;
  const activeEmployees = employeeList.filter((e) => e.is_active).length;
  const pendingInvitations = employeeList.filter(
    (e) => e.invitation_sent_at && !e.registered_at
  ).length;
  const totalAllocated = employeeList.reduce(
    (sum, e) => sum + Number(e.allocated_amount || 0),
    0
  );
  const totalUsed = employeeList.reduce(
    (sum, e) => sum + Number(e.used_amount || 0),
    0
  );

  // Get deposit balance
  const { data: deposit } = await supabase
    .from('corporate_deposits')
    .select('balance')
    .eq('corporate_id', corporateId)
    .single();

  const depositBalance = deposit
    ? Number((deposit as { balance: number }).balance)
    : 0;

  // Get pending approvals count from corporate_booking_approvals
  const { count: pendingApprovalsCount, error: approvalsError } = await supabase
    .from('corporate_booking_approvals')
    .select('*', { count: 'exact', head: true })
    .eq('corporate_id', corporateId)
    .eq('status', 'pending');

  if (approvalsError) {
    logger.warn('Failed to get pending approvals count', approvalsError, { corporateId });
  }

  const pendingApprovals = pendingApprovalsCount || 0;

  // Get recent bookings count (last 30 days)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  // Get user_ids of employees to find their bookings
  const employeeUserIds = employeeList
    .map((e) => e.user_id)
    .filter((id): id is string => !!id);

  let recentBookings = 0;
  if (employeeUserIds.length > 0) {
    // Query bookings created by corporate employees in last 30 days
    const { count: recentBookingsCount, error: bookingsError } = await supabase
      .from('bookings')
      .select('*', { count: 'exact', head: true })
      .in('created_by', employeeUserIds)
      .gte('created_at', thirtyDaysAgo.toISOString())
      .is('deleted_at', null);

    if (bookingsError) {
      logger.warn('Failed to get recent bookings count', bookingsError, { corporateId });
    }

    recentBookings = recentBookingsCount || 0;
  }

  return {
    totalEmployees,
    activeEmployees,
    pendingInvitations,
    totalAllocated,
    totalUsed,
    remainingBudget: totalAllocated - totalUsed,
    depositBalance,
    pendingApprovals,
    recentBookings,
  };
}

/**
 * Get employees list with pagination
 */
export async function getEmployees(
  corporateId: string,
  options?: {
    limit?: number;
    offset?: number;
    search?: string;
    department?: string;
    status?: 'active' | 'inactive' | 'invited';
  }
): Promise<{
  employees: CorporateEmployee[];
  total: number;
}> {
  const supabase = await createClient();
  const { limit = 20, offset = 0, search, department, status } = options || {};

  let query = supabase
    .from('corporate_employees')
    .select('*', { count: 'exact' })
    .eq('corporate_id', corporateId)
    .order('created_at', { ascending: false });

  // Apply filters
  if (search) {
    query = query.or(
      `full_name.ilike.%${search}%,email.ilike.%${search}%,employee_id_number.ilike.%${search}%`
    );
  }

  if (department) {
    query = query.eq('department', department);
  }

  if (status === 'active') {
    query = query.eq('is_active', true).not('registered_at', 'is', null);
  } else if (status === 'inactive') {
    query = query.eq('is_active', false);
  } else if (status === 'invited') {
    query = query.not('invitation_sent_at', 'is', null).is('registered_at', null);
  }

  // Apply pagination
  query = query.range(offset, offset + limit - 1);

  const { data, count, error } = await query;

  if (error) {
    logger.error('Failed to get employees', error, { corporateId });
    return { employees: [], total: 0 };
  }

  const employees = (data || []).map((row) => {
    const r = row as {
      id: string;
      corporate_id: string;
      user_id: string | null;
      employee_id_number: string | null;
      full_name: string;
      email: string;
      phone: string | null;
      department: string | null;
      allocated_amount: number;
      used_amount: number;
      remaining_amount: number;
      is_active: boolean;
      invitation_sent_at: string | null;
      registered_at: string | null;
      created_at: string;
    };

    return {
      id: r.id,
      corporateId: r.corporate_id,
      userId: r.user_id,
      employeeIdNumber: r.employee_id_number,
      fullName: r.full_name,
      email: r.email,
      phone: r.phone,
      department: r.department,
      allocatedAmount: Number(r.allocated_amount),
      usedAmount: Number(r.used_amount),
      remainingAmount: Number(r.remaining_amount),
      isActive: r.is_active,
      invitationSentAt: r.invitation_sent_at,
      registeredAt: r.registered_at,
      createdAt: r.created_at,
    };
  });

  return { employees, total: count || 0 };
}

/**
 * Add a new employee
 */
export async function addEmployee(
  corporateId: string,
  data: {
    fullName: string;
    email: string;
    phone?: string;
    department?: string;
    employeeIdNumber?: string;
    allocatedAmount?: number;
  }
): Promise<{ success: boolean; employeeId?: string; error?: string }> {
  const supabase = await createClient();

  // Check if email already exists for this corporate
  const { data: existing } = await supabase
    .from('corporate_employees')
    .select('id')
    .eq('corporate_id', corporateId)
    .eq('email', data.email)
    .single();

  if (existing) {
    return { success: false, error: 'Email sudah terdaftar' };
  }

  const { data: newEmployee, error } = await supabase
    .from('corporate_employees')
    .insert({
      corporate_id: corporateId,
      full_name: data.fullName,
      email: data.email,
      phone: data.phone,
      department: data.department,
      employee_id_number: data.employeeIdNumber,
      allocated_amount: data.allocatedAmount || 0,
      used_amount: 0,
      is_active: true,
    })
    .select('id')
    .single();

  if (error) {
    logger.error('Failed to add employee', error, { corporateId });
    return { success: false, error: 'Gagal menambah karyawan' };
  }

  logger.info('Employee added', {
    corporateId,
    employeeId: (newEmployee as { id: string }).id,
  });

  return {
    success: true,
    employeeId: (newEmployee as { id: string }).id,
  };
}

/**
 * Update employee allocation
 */
export async function updateEmployeeAllocation(
  employeeId: string,
  allocatedAmount: number
): Promise<boolean> {
  const supabase = await createClient();

  const { error } = await supabase
    .from('corporate_employees')
    .update({
      allocated_amount: allocatedAmount,
      updated_at: new Date().toISOString(),
    })
    .eq('id', employeeId);

  if (error) {
    logger.error('Failed to update allocation', error, { employeeId });
    return false;
  }

  return true;
}

/**
 * Get invoices for a corporate
 */
export async function getInvoices(
  corporateId: string,
  options?: {
    limit?: number;
    offset?: number;
    status?: string;
  }
): Promise<{
  invoices: Array<{
    id: string;
    invoiceNumber: string;
    invoiceDate: string;
    dueDate: string;
    subtotal: number;
    taxAmount: number;
    totalAmount: number;
    status: string;
    paidAt: string | null;
  }>;
  total: number;
}> {
  const supabase = await createClient();
  const { limit = 20, offset = 0, status } = options || {};

  let query = supabase
    .from('corporate_invoices')
    .select('*', { count: 'exact' })
    .eq('corporate_id', corporateId)
    .order('invoice_date', { ascending: false });

  if (status) {
    query = query.eq('status', status);
  }

  query = query.range(offset, offset + limit - 1);

  const { data, count, error } = await query;

  if (error) {
    logger.error('Failed to get invoices', error, { corporateId });
    return { invoices: [], total: 0 };
  }

  const invoices = (data || []).map((row) => {
    const r = row as {
      id: string;
      invoice_number: string;
      invoice_date: string;
      due_date: string;
      subtotal: number;
      tax_amount: number;
      total_amount: number;
      status: string;
      paid_at: string | null;
    };

    return {
      id: r.id,
      invoiceNumber: r.invoice_number,
      invoiceDate: r.invoice_date,
      dueDate: r.due_date,
      subtotal: Number(r.subtotal),
      taxAmount: Number(r.tax_amount),
      totalAmount: Number(r.total_amount),
      status: r.status,
      paidAt: r.paid_at,
    };
  });

  return { invoices, total: count || 0 };
}

// ============================================
// APPROVAL TYPES
// ============================================

/**
 * Approval Status Type
 */
export type ApprovalStatus = 'pending' | 'approved' | 'rejected' | 'cancelled';

/**
 * Corporate Booking Approval data
 */
export type CorporateBookingApproval = {
  id: string;
  corporateId: string;
  bookingId: string;
  employeeId: string;
  status: ApprovalStatus;
  requestedAmount: number;
  approvedAmount: number | null;
  approvedBy: string | null;
  approvedAt: string | null;
  rejectionReason: string | null;
  requestNotes: string | null;
  approverNotes: string | null;
  createdAt: string;
  updatedAt: string;
  // Joined data
  employee?: {
    fullName: string;
    email: string;
    department: string | null;
  };
  booking?: {
    bookingCode: string;
    tripDate: string;
    totalPax: number;
    packageName: string | null;
    destination: string | null;
  };
};

/**
 * Map approval row from database
 */
function mapApproval(row: unknown): CorporateBookingApproval {
  const r = row as {
    id: string;
    corporate_id: string;
    booking_id: string;
    employee_id: string;
    status: ApprovalStatus;
    requested_amount: number;
    approved_amount: number | null;
    approved_by: string | null;
    approved_at: string | null;
    rejection_reason: string | null;
    request_notes: string | null;
    approver_notes: string | null;
    created_at: string;
    updated_at: string;
    corporate_employees?: {
      full_name: string;
      email: string;
      department: string | null;
    };
    bookings?: {
      booking_code: string;
      trip_date: string;
      adult_pax: number;
      child_pax: number;
      infant_pax: number;
      packages?: {
        name: string;
        destination: string;
      } | null;
    };
  };

  return {
    id: r.id,
    corporateId: r.corporate_id,
    bookingId: r.booking_id,
    employeeId: r.employee_id,
    status: r.status,
    requestedAmount: Number(r.requested_amount),
    approvedAmount: r.approved_amount ? Number(r.approved_amount) : null,
    approvedBy: r.approved_by,
    approvedAt: r.approved_at,
    rejectionReason: r.rejection_reason,
    requestNotes: r.request_notes,
    approverNotes: r.approver_notes,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
    employee: r.corporate_employees
      ? {
          fullName: r.corporate_employees.full_name,
          email: r.corporate_employees.email,
          department: r.corporate_employees.department,
        }
      : undefined,
    booking: r.bookings
      ? {
          bookingCode: r.bookings.booking_code,
          tripDate: r.bookings.trip_date,
          totalPax:
            r.bookings.adult_pax + r.bookings.child_pax + r.bookings.infant_pax,
          packageName: r.bookings.packages?.name || null,
          destination: r.bookings.packages?.destination || null,
        }
      : undefined,
  };
}

// ============================================
// APPROVAL FUNCTIONS
// ============================================

/**
 * Get pending approvals for a corporate
 */
export async function getPendingApprovals(
  corporateId: string,
  options?: {
    limit?: number;
    offset?: number;
    status?: ApprovalStatus;
  }
): Promise<{
  approvals: CorporateBookingApproval[];
  total: number;
}> {
  const supabase = await createClient();
  const { limit = 20, offset = 0, status = 'pending' } = options || {};

  let query = supabase
    .from('corporate_booking_approvals')
    .select(
      `
      *,
      corporate_employees (
        full_name,
        email,
        department
      ),
      bookings (
        booking_code,
        trip_date,
        adult_pax,
        child_pax,
        infant_pax,
        packages (
          name,
          destination
        )
      )
    `,
      { count: 'exact' }
    )
    .eq('corporate_id', corporateId)
    .order('created_at', { ascending: false });

  if (status) {
    query = query.eq('status', status);
  }

  query = query.range(offset, offset + limit - 1);

  const { data, count, error } = await query;

  if (error) {
    logger.error('Failed to get pending approvals', error, { corporateId });
    return { approvals: [], total: 0 };
  }

  const approvals = (data || []).map(mapApproval);

  return { approvals, total: count || 0 };
}

/**
 * Get single approval by ID
 */
export async function getApprovalById(
  approvalId: string
): Promise<CorporateBookingApproval | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('corporate_booking_approvals')
    .select(
      `
      *,
      corporate_employees (
        full_name,
        email,
        department
      ),
      bookings (
        booking_code,
        trip_date,
        adult_pax,
        child_pax,
        infant_pax,
        packages (
          name,
          destination
        )
      )
    `
    )
    .eq('id', approvalId)
    .single();

  if (error || !data) {
    logger.error('Failed to get approval', error, { approvalId });
    return null;
  }

  return mapApproval(data);
}

/**
 * Create an approval request
 */
export async function createApprovalRequest(
  corporateId: string,
  bookingId: string,
  employeeId: string,
  requestedAmount: number,
  requestNotes?: string
): Promise<{ success: boolean; approvalId?: string; error?: string }> {
  const supabase = await createClient();

  // Check if approval already exists for this booking
  const { data: existing } = await supabase
    .from('corporate_booking_approvals')
    .select('id')
    .eq('booking_id', bookingId)
    .single();

  if (existing) {
    return { success: false, error: 'Approval request already exists for this booking' };
  }

  const { data: newApproval, error } = await supabase
    .from('corporate_booking_approvals')
    .insert({
      corporate_id: corporateId,
      booking_id: bookingId,
      employee_id: employeeId,
      status: 'pending',
      requested_amount: requestedAmount,
      request_notes: requestNotes,
    })
    .select('id')
    .single();

  if (error) {
    logger.error('Failed to create approval request', error, {
      corporateId,
      bookingId,
      employeeId,
    });
    return { success: false, error: 'Gagal membuat permintaan approval' };
  }

  logger.info('Approval request created', {
    approvalId: (newApproval as { id: string }).id,
    corporateId,
    bookingId,
  });

  return {
    success: true,
    approvalId: (newApproval as { id: string }).id,
  };
}

/**
 * Approve a booking request
 */
export async function approveBooking(
  approvalId: string,
  approverId: string,
  approvedAmount?: number,
  approverNotes?: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();

  // Get the approval first
  const { data: approval, error: fetchError } = await supabase
    .from('corporate_booking_approvals')
    .select('*, corporate_clients!inner(pic_id)')
    .eq('id', approvalId)
    .single();

  if (fetchError || !approval) {
    logger.error('Approval not found', fetchError, { approvalId });
    return { success: false, error: 'Approval tidak ditemukan' };
  }

  const approvalData = approval as {
    status: string;
    requested_amount: number;
    employee_id: string;
    booking_id: string;
    corporate_clients: { pic_id: string };
  };

  // Verify approver is the PIC
  if (approvalData.corporate_clients.pic_id !== approverId) {
    return { success: false, error: 'Anda tidak berwenang untuk approve' };
  }

  // Check if already processed
  if (approvalData.status !== 'pending') {
    return { success: false, error: 'Approval sudah diproses sebelumnya' };
  }

  const finalAmount = approvedAmount ?? approvalData.requested_amount;

  // Update approval status
  const { error: updateError } = await supabase
    .from('corporate_booking_approvals')
    .update({
      status: 'approved',
      approved_by: approverId,
      approved_at: new Date().toISOString(),
      approved_amount: finalAmount,
      approver_notes: approverNotes,
      updated_at: new Date().toISOString(),
    })
    .eq('id', approvalId);

  if (updateError) {
    logger.error('Failed to approve booking', updateError, { approvalId });
    return { success: false, error: 'Gagal approve booking' };
  }

  // Update employee used amount
  const { error: employeeError } = await supabase
    .from('corporate_employees')
    .update({
      used_amount: supabase.rpc('increment_used_amount', {
        p_employee_id: approvalData.employee_id,
        p_amount: finalAmount,
      }),
    })
    .eq('id', approvalData.employee_id);

  // If RPC doesn't exist, use a simpler update
  if (employeeError) {
    // Fallback: get current used amount and update
    const { data: emp } = await supabase
      .from('corporate_employees')
      .select('used_amount')
      .eq('id', approvalData.employee_id)
      .single();

    if (emp) {
      const currentUsed = Number((emp as { used_amount: number }).used_amount) || 0;
      await supabase
        .from('corporate_employees')
        .update({
          used_amount: currentUsed + finalAmount,
          updated_at: new Date().toISOString(),
        })
        .eq('id', approvalData.employee_id);
    }
  }

  // Update booking status to confirmed
  await supabase
    .from('bookings')
    .update({
      status: 'confirmed',
      updated_at: new Date().toISOString(),
    })
    .eq('id', approvalData.booking_id);

  logger.info('Booking approved', {
    approvalId,
    approverId,
    approvedAmount: finalAmount,
  });

  return { success: true };
}

/**
 * Reject a booking request
 */
export async function rejectBooking(
  approvalId: string,
  approverId: string,
  rejectionReason: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();

  // Get the approval first
  const { data: approval, error: fetchError } = await supabase
    .from('corporate_booking_approvals')
    .select('*, corporate_clients!inner(pic_id)')
    .eq('id', approvalId)
    .single();

  if (fetchError || !approval) {
    logger.error('Approval not found', fetchError, { approvalId });
    return { success: false, error: 'Approval tidak ditemukan' };
  }

  const approvalData = approval as {
    status: string;
    booking_id: string;
    corporate_clients: { pic_id: string };
  };

  // Verify approver is the PIC
  if (approvalData.corporate_clients.pic_id !== approverId) {
    return { success: false, error: 'Anda tidak berwenang untuk reject' };
  }

  // Check if already processed
  if (approvalData.status !== 'pending') {
    return { success: false, error: 'Approval sudah diproses sebelumnya' };
  }

  // Update approval status
  const { error: updateError } = await supabase
    .from('corporate_booking_approvals')
    .update({
      status: 'rejected',
      approved_by: approverId,
      approved_at: new Date().toISOString(),
      rejection_reason: rejectionReason,
      updated_at: new Date().toISOString(),
    })
    .eq('id', approvalId);

  if (updateError) {
    logger.error('Failed to reject booking', updateError, { approvalId });
    return { success: false, error: 'Gagal reject booking' };
  }

  // Update booking status to cancelled
  await supabase
    .from('bookings')
    .update({
      status: 'cancelled',
      updated_at: new Date().toISOString(),
    })
    .eq('id', approvalData.booking_id);

  logger.info('Booking rejected', {
    approvalId,
    approverId,
    reason: rejectionReason,
  });

  return { success: true };
}

/**
 * Cancel an approval request (by employee)
 */
export async function cancelApprovalRequest(
  approvalId: string,
  userId: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();

  // Get the approval first
  const { data: approval, error: fetchError } = await supabase
    .from('corporate_booking_approvals')
    .select('*, corporate_employees!inner(user_id)')
    .eq('id', approvalId)
    .single();

  if (fetchError || !approval) {
    return { success: false, error: 'Approval tidak ditemukan' };
  }

  const approvalData = approval as {
    status: string;
    booking_id: string;
    corporate_employees: { user_id: string };
  };

  // Verify user is the employee who created the request
  if (approvalData.corporate_employees.user_id !== userId) {
    return { success: false, error: 'Anda tidak berwenang untuk membatalkan' };
  }

  // Check if still pending
  if (approvalData.status !== 'pending') {
    return { success: false, error: 'Approval sudah diproses, tidak dapat dibatalkan' };
  }

  // Update approval status
  const { error: updateError } = await supabase
    .from('corporate_booking_approvals')
    .update({
      status: 'cancelled',
      updated_at: new Date().toISOString(),
    })
    .eq('id', approvalId);

  if (updateError) {
    logger.error('Failed to cancel approval', updateError, { approvalId });
    return { success: false, error: 'Gagal membatalkan approval' };
  }

  // Update booking status
  await supabase
    .from('bookings')
    .update({
      status: 'cancelled',
      updated_at: new Date().toISOString(),
    })
    .eq('id', approvalData.booking_id);

  logger.info('Approval cancelled by employee', { approvalId, userId });

  return { success: true };
}

/**
 * Get approval count by status
 */
export async function getApprovalCounts(
  corporateId: string
): Promise<{
  pending: number;
  approved: number;
  rejected: number;
  cancelled: number;
}> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('corporate_booking_approvals')
    .select('status')
    .eq('corporate_id', corporateId);

  if (error) {
    logger.error('Failed to get approval counts', error, { corporateId });
    return { pending: 0, approved: 0, rejected: 0, cancelled: 0 };
  }

  const counts = { pending: 0, approved: 0, rejected: 0, cancelled: 0 };
  (data || []).forEach((row) => {
    const status = (row as { status: ApprovalStatus }).status;
    if (status in counts) {
      counts[status]++;
    }
  });

  return counts;
}


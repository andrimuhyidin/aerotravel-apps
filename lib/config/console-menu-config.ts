/**
 * Console Menu Configuration
 * Single source of truth for admin console navigation menu
 * Used by: Sidebar, Mobile Navigation, Command Palette
 *
 * Structure (9 Groups):
 * 1. Main - Dashboard & Reports
 * 2. Sales - Customer-facing (Bookings, Products, CRM, Marketing)
 * 3. Operations - Day-to-day ops (Trips, Scheduling, Tracking, Assets)
 * 4. Finance - Financial management
 * 5. Partnerships - B2B relations
 * 6. Human Resources - Employee/Guide contracts
 * 7. Learning & Development - Training & Certifications
 * 8. Governance - Approvals & Compliance
 * 9. AI & Automation - AI features, Knowledge Base, WhatsApp Bot
 *
 * Header Icons (not in sidebar):
 * - Chat (💬) - Unified chat panel (Ops, AI, Broadcasts)
 * - Notifications (🔔)
 *
 * Profile Dropdown:
 * - Settings (+ Integrations as sub-page)
 * - Tickets (Help & Support)
 */

import {
  Anchor,
  AlertTriangle,
  Award,
  BarChart3,
  Bell,
  BookOpen,
  Bot,
  Briefcase,
  Building2,
  Calendar,
  CalendarClock,
  CheckCircle2,
  CreditCard,
  FileBarChart,
  FileCheck,
  FileText,
  FolderKanban,
  Gauge,
  Gift,
  Globe,
  GraduationCap,
  Heart,
  Home,
  LayoutDashboard,
  Library,
  MapPin,
  Megaphone,
  MessageSquare,
  Package,
  Receipt,
  RefreshCcw,
  ScrollText,
  Shield,
  Ship,
  ShoppingCart,
  Sparkles,
  TrendingUp,
  Truck,
  UserCheck,
  Users,
  Wallet,
  Workflow,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { Database } from '@/types/supabase';

type UserRole = Database['public']['Enums']['user_role'];

// ==========================================
// TYPES
// ==========================================

export type ConsoleMenuItem = {
  id: string;
  href: string; // Relative path (without locale)
  label: string;
  icon: LucideIcon;
  description?: string;
  badge?: string | number;
  group: ConsoleMenuGroup;
  priority: number; // For sorting within group (1 = highest)
  allowedRoles?: UserRole[]; // If undefined, visible to all admin roles
  requiresPermission?: string;
};

export type ConsoleMenuGroup = {
  id: string;
  title: string;
  icon: LucideIcon;
  priority: number;
  collapsed?: boolean; // Default collapsed state
  allowedRoles?: UserRole[]; // If undefined, visible to all roles
};

// ==========================================
// MENU GROUPS (9 Groups)
// ==========================================

const createMenuGroups = () => ({
  // 1. Main - Overview & Reports
  main: {
    id: 'main',
    title: 'Main',
    icon: Home,
    priority: 1,
    collapsed: false,
    // No allowedRoles = visible to all
  },

  // 2. Sales - Customer-facing
  sales: {
    id: 'sales',
    title: 'Sales',
    icon: ShoppingCart,
    priority: 2,
    collapsed: false,
    allowedRoles: ['super_admin', 'ops_admin', 'marketing'],
  },

  // 3. Operations - Day-to-day ops
  operations: {
    id: 'operations',
    title: 'Operations',
    icon: Briefcase,
    priority: 3,
    collapsed: false,
    allowedRoles: ['super_admin', 'ops_admin'],
  },

  // 4. Finance - Financial management
  finance: {
    id: 'finance',
    title: 'Finance',
    icon: Wallet,
    priority: 4,
    collapsed: false,
    allowedRoles: ['super_admin', 'finance_manager', 'investor'],
  },

  // 5. Partnerships - B2B relations
  partnerships: {
    id: 'partnerships',
    title: 'Partnerships',
    icon: Building2,
    priority: 5,
    collapsed: false,
    allowedRoles: ['super_admin', 'marketing'],
  },

  // 6. Human Resources - Employee management
  hr: {
    id: 'hr',
    title: 'Human Resources',
    icon: Users,
    priority: 6,
    collapsed: false,
    allowedRoles: ['super_admin', 'ops_admin'],
  },

  // 7. Learning & Development - Training & Certifications
  learningDev: {
    id: 'learningDev',
    title: 'Learning & Development',
    icon: GraduationCap,
    priority: 7,
    collapsed: false,
    allowedRoles: ['super_admin', 'ops_admin'],
  },

  // 8. Governance - Approvals & Compliance
  governance: {
    id: 'governance',
    title: 'Governance',
    icon: Shield,
    priority: 8,
    collapsed: false,
    allowedRoles: ['super_admin', 'ops_admin'],
  },

  // 9. AI & Automation - AI features management
  aiAutomation: {
    id: 'aiAutomation',
    title: 'AI & Automation',
    icon: Bot,
    priority: 9,
    collapsed: false,
    allowedRoles: ['super_admin'],
  },
} satisfies Record<string, ConsoleMenuGroup>);

export const CONSOLE_MENU_GROUPS = createMenuGroups();

// ==========================================
// MENU ITEMS
// ==========================================

export const CONSOLE_MENU_ITEMS: ConsoleMenuItem[] = [
  // ========================================
  // 1. MAIN (3 items)
  // ========================================
  {
    id: 'dashboard',
    href: '/console',
    label: 'Dashboard',
    icon: LayoutDashboard,
    description: 'Overview & KPIs',
    group: CONSOLE_MENU_GROUPS.main,
    priority: 1,
  },
  {
    id: 'reports',
    href: '/console/reports',
    label: 'Reports',
    icon: FileText,
    description: 'Business reports',
    group: CONSOLE_MENU_GROUPS.main,
    priority: 2,
  },
  {
    id: 'custom-reports',
    href: '/console/reports/custom',
    label: 'Custom Reports',
    icon: FileBarChart,
    description: 'Build custom report templates',
    group: CONSOLE_MENU_GROUPS.main,
    priority: 3,
    allowedRoles: ['super_admin', 'finance_manager'],
  },

  // ========================================
  // 2. SALES (4 items)
  // ========================================
  {
    id: 'bookings',
    href: '/console/bookings',
    label: 'Bookings',
    icon: Calendar,
    description: 'Manage bookings',
    group: CONSOLE_MENU_GROUPS.sales,
    priority: 1,
  },
  {
    id: 'products',
    href: '/console/products',
    label: 'Products',
    icon: Package,
    description: 'Packages & pricing',
    group: CONSOLE_MENU_GROUPS.sales,
    priority: 2,
  },
  {
    id: 'crm',
    href: '/console/crm',
    label: 'CRM',
    icon: Users,
    description: 'Customer management',
    group: CONSOLE_MENU_GROUPS.sales,
    priority: 3,
  },
  {
    id: 'customer-communications',
    href: '/console/crm/communications',
    label: 'Customer Communications',
    icon: MessageSquare,
    description: 'Customer interaction logs',
    group: CONSOLE_MENU_GROUPS.sales,
    priority: 4,
    allowedRoles: ['super_admin', 'marketing', 'ops_admin'],
  },
  {
    id: 'loyalty-management',
    href: '/console/crm/loyalty',
    label: 'Loyalty Management',
    icon: Heart,
    description: 'Loyalty points & tiers',
    group: CONSOLE_MENU_GROUPS.sales,
    priority: 5,
    allowedRoles: ['super_admin', 'marketing'],
  },
  {
    id: 'marketing',
    href: '/console/marketing',
    label: 'Marketing',
    icon: Megaphone,
    description: 'Campaigns & promos',
    group: CONSOLE_MENU_GROUPS.sales,
    priority: 6,
  },

  // ========================================
  // 3. OPERATIONS (10 items)
  // ========================================
  {
    id: 'operations-hub',
    href: '/console/operations',
    label: 'Operations Hub',
    icon: Gauge,
    description: 'Daily operations dashboard',
    group: CONSOLE_MENU_GROUPS.operations,
    priority: 1,
  },
  {
    id: 'trips',
    href: '/console/operations/trips',
    label: 'Trips',
    icon: Ship,
    description: 'Trip management',
    group: CONSOLE_MENU_GROUPS.operations,
    priority: 2,
  },
  {
    id: 'scheduler',
    href: '/console/operations/scheduler',
    label: 'Scheduler',
    icon: Calendar,
    description: 'Resource scheduling',
    group: CONSOLE_MENU_GROUPS.operations,
    priority: 3,
  },
  {
    id: 'live-tracking',
    href: '/console/operations/live-tracking',
    label: 'Live Tracking',
    icon: MapPin,
    description: 'Real-time guide tracking',
    group: CONSOLE_MENU_GROUPS.operations,
    priority: 4,
  },
  {
    id: 'sos-alerts',
    href: '/console/operations/sos',
    label: 'SOS Alerts',
    icon: AlertTriangle,
    description: 'Emergency alerts',
    group: CONSOLE_MENU_GROUPS.operations,
    priority: 5,
  },
  {
    id: 'safety',
    href: '/console/safety',
    label: 'Safety',
    icon: Heart,
    description: 'Safety protocols',
    group: CONSOLE_MENU_GROUPS.operations,
    priority: 6,
  },
  {
    id: 'assets',
    href: '/console/operations/assets',
    label: 'Assets',
    icon: Anchor,
    description: 'Ships & villas',
    group: CONSOLE_MENU_GROUPS.operations,
    priority: 7,
  },
  {
    id: 'inventory',
    href: '/console/operations/inventory',
    label: 'Inventory',
    icon: FolderKanban,
    description: 'Stock management',
    group: CONSOLE_MENU_GROUPS.operations,
    priority: 8,
  },
  {
    id: 'vendors',
    href: '/console/operations/vendors',
    label: 'Vendors',
    icon: Truck,
    description: 'Vendor management',
    group: CONSOLE_MENU_GROUPS.operations,
    priority: 9,
  },
  {
    id: 'sustainability',
    href: '/console/operations/sustainability/carbon-footprint',
    label: 'Sustainability',
    icon: Globe,
    description: 'Carbon footprint & ESG',
    group: CONSOLE_MENU_GROUPS.operations,
    priority: 10,
  },

  // ========================================
  // 4. FINANCE (7 items)
  // ========================================
  {
    id: 'finance-dashboard',
    href: '/console/finance',
    label: 'Finance Dashboard',
    icon: BarChart3,
    description: 'Financial overview',
    group: CONSOLE_MENU_GROUPS.finance,
    priority: 1,
    allowedRoles: ['super_admin', 'finance_manager'],
  },
  {
    id: 'payments',
    href: '/console/finance/payments',
    label: 'Payment Verification',
    icon: FileCheck,
    description: 'Verify customer payments',
    group: CONSOLE_MENU_GROUPS.finance,
    priority: 2,
    allowedRoles: ['super_admin', 'finance_manager'],
  },
  {
    id: 'refunds',
    href: '/console/finance/refunds',
    label: 'Refunds',
    icon: RefreshCcw,
    description: 'Manage refund requests',
    group: CONSOLE_MENU_GROUPS.finance,
    priority: 3,
    allowedRoles: ['super_admin', 'finance_manager'],
  },
  {
    id: 'invoices',
    href: '/console/finance/invoices',
    label: 'Invoices',
    icon: Receipt,
    description: 'Invoice management',
    group: CONSOLE_MENU_GROUPS.finance,
    priority: 4,
    allowedRoles: ['super_admin', 'finance_manager'],
  },
  {
    id: 'shadow-pnl',
    href: '/console/finance/shadow-pnl',
    label: 'Shadow P&L',
    icon: TrendingUp,
    description: 'Profit & loss analysis',
    group: CONSOLE_MENU_GROUPS.finance,
    priority: 5,
    allowedRoles: ['super_admin', 'finance_manager'],
  },
  {
    id: 'payroll',
    href: '/console/finance/payroll',
    label: 'Payroll',
    icon: CreditCard,
    description: 'Payroll management',
    group: CONSOLE_MENU_GROUPS.finance,
    priority: 6,
    allowedRoles: ['super_admin', 'finance_manager'],
  },

  // ========================================
  // 5. PARTNERSHIPS (2 items)
  // ========================================
  {
    id: 'partners',
    href: '/console/partners',
    label: 'Partners',
    icon: Building2,
    description: 'Partner management',
    group: CONSOLE_MENU_GROUPS.partnerships,
    priority: 1,
  },
  {
    id: 'partner-tiers',
    href: '/console/partners/tiers',
    label: 'Partner Tiers',
    icon: Gift,
    description: 'Tier & benefits management',
    group: CONSOLE_MENU_GROUPS.partnerships,
    priority: 2,
  },

  // ========================================
  // 6. HUMAN RESOURCES (6 items)
  // ========================================
  {
    id: 'users',
    href: '/console/users',
    label: 'Users',
    icon: Users,
    description: 'User management',
    group: CONSOLE_MENU_GROUPS.hr,
    priority: 1,
    allowedRoles: ['super_admin'],
  },
  {
    id: 'role-applications',
    href: '/console/users/role-applications',
    label: 'Role Applications',
    icon: UserCheck,
    description: 'Role change requests',
    group: CONSOLE_MENU_GROUPS.hr,
    priority: 2,
  },
  {
    id: 'guide-contracts',
    href: '/console/guide/contracts',
    label: 'Guide Contracts',
    icon: ScrollText,
    description: 'Contract management',
    group: CONSOLE_MENU_GROUPS.hr,
    priority: 3,
  },
  {
    id: 'attendance',
    href: '/console/hr/attendance',
    label: 'Attendance',
    icon: CalendarClock,
    description: 'Employee attendance tracking',
    group: CONSOLE_MENU_GROUPS.hr,
    priority: 4,
    allowedRoles: ['super_admin', 'ops_admin'],
  },
  {
    id: 'leave-requests',
    href: '/console/hr/leave',
    label: 'Leave Requests',
    icon: Calendar,
    description: 'Leave management & approvals',
    group: CONSOLE_MENU_GROUPS.hr,
    priority: 5,
    allowedRoles: ['super_admin', 'ops_admin'],
  },
  {
    id: 'performance-reviews',
    href: '/console/hr/performance',
    label: 'Performance Reviews',
    icon: Award,
    description: 'Employee performance evaluations',
    group: CONSOLE_MENU_GROUPS.hr,
    priority: 6,
    allowedRoles: ['super_admin', 'ops_admin'],
  },

  // ========================================
  // 7. LEARNING & DEVELOPMENT (3 items)
  // ========================================
  {
    id: 'training',
    href: '/console/operations/training',
    label: 'Training',
    icon: BookOpen,
    description: 'Training programs',
    group: CONSOLE_MENU_GROUPS.learningDev,
    priority: 1,
  },
  {
    id: 'guide-certification',
    href: '/console/guide-license',
    label: 'Guide Certification',
    icon: Award,
    description: 'License & certifications',
    group: CONSOLE_MENU_GROUPS.learningDev,
    priority: 2,
  },
  {
    id: 'guide-feedback',
    href: '/console/guide-feedback',
    label: 'Guide Feedback',
    icon: MessageSquare,
    description: 'Performance feedback',
    group: CONSOLE_MENU_GROUPS.learningDev,
    priority: 3,
  },

  // ========================================
  // 8. GOVERNANCE (4 items)
  // ========================================
  {
    id: 'governance',
    href: '/console/governance',
    label: 'Governance',
    icon: Shield,
    description: 'Approvals & authority matrix',
    group: CONSOLE_MENU_GROUPS.governance,
    priority: 1,
    allowedRoles: ['super_admin', 'ops_admin'],
  },
  {
    id: 'compliance',
    href: '/console/compliance',
    label: 'Compliance',
    icon: CheckCircle2,
    description: 'License & permits',
    group: CONSOLE_MENU_GROUPS.governance,
    priority: 2,
  },
  {
    id: 'broadcast-notifications',
    href: '/console/notifications/broadcast',
    label: 'Broadcast Notifications',
    icon: Megaphone,
    description: 'Send mass notifications',
    group: CONSOLE_MENU_GROUPS.governance,
    priority: 3,
    allowedRoles: ['super_admin', 'marketing'],
  },
  {
    id: 'scheduled-notifications',
    href: '/console/notifications/scheduled',
    label: 'Scheduled Notifications',
    icon: Bell,
    description: 'Automated notification scheduling',
    group: CONSOLE_MENU_GROUPS.governance,
    priority: 4,
    allowedRoles: ['super_admin', 'ops_admin'],
  },

  // ========================================
  // 9. AI & AUTOMATION (4 items)
  // ========================================
  {
    id: 'ai-dashboard',
    href: '/console/ai/dashboard',
    label: 'AI Dashboard',
    icon: Sparkles,
    description: 'AI usage & analytics',
    group: CONSOLE_MENU_GROUPS.aiAutomation,
    priority: 1,
    allowedRoles: ['super_admin'],
  },
  {
    id: 'knowledge-base',
    href: '/console/ai/knowledge-base',
    label: 'Knowledge Base',
    icon: Library,
    description: 'RAG documents & embeddings',
    group: CONSOLE_MENU_GROUPS.aiAutomation,
    priority: 2,
    allowedRoles: ['super_admin'],
  },
  {
    id: 'whatsapp-bot',
    href: '/console/ai/whatsapp-bot',
    label: 'WhatsApp Bot',
    icon: MessageSquare,
    description: 'Bot configuration & logs',
    group: CONSOLE_MENU_GROUPS.aiAutomation,
    priority: 3,
    allowedRoles: ['super_admin'],
  },
  {
    id: 'automation-rules',
    href: '/console/ai/automation',
    label: 'Automation Rules',
    icon: Workflow,
    description: 'Workflow automation',
    group: CONSOLE_MENU_GROUPS.aiAutomation,
    priority: 4,
    allowedRoles: ['super_admin'],
  },
];

// ==========================================
// HELPER FUNCTIONS
// ==========================================

/**
 * Get menu items grouped by group
 */
export function getMenuItemsByGroup(
  locale: string
): Record<string, ConsoleMenuItem[]> {
  const grouped: Record<string, ConsoleMenuItem[]> = {};

  CONSOLE_MENU_ITEMS.forEach((item) => {
    const groupId = item.group.id;
    const existingGroup = grouped[groupId];
    if (!existingGroup) {
      grouped[groupId] = [];
    }
    const group = grouped[groupId];
    if (group) {
      group.push({
        ...item,
        href: `/${locale}${item.href}`,
      });
    }
  });

  // Sort items within each group by priority
  Object.keys(grouped).forEach((groupId) => {
    const group = grouped[groupId];
    if (group) {
      group.sort((a, b) => a.priority - b.priority);
    }
  });

  return grouped;
}

/**
 * Get all menu items (flat array)
 */
export function getAllMenuItems(locale: string): ConsoleMenuItem[] {
  return CONSOLE_MENU_ITEMS.map((item) => ({
    ...item,
    href: `/${locale}${item.href}`,
  })).sort((a, b) => {
    // Sort by group priority first, then item priority
    const groupDiff = a.group.priority - b.group.priority;
    if (groupDiff !== 0) return groupDiff;
    return a.priority - b.priority;
  });
}

/**
 * Get all menu items filtered by user role (flat array)
 */
export function getAllMenuItemsForRole(
  locale: string,
  userRole: UserRole | null
): ConsoleMenuItem[] {
  const allItems = CONSOLE_MENU_ITEMS.map((item) => ({
    ...item,
    href: `/${locale}${item.href}`,
  }));

  // Filter items based on role
  const filtered = allItems.filter((item) => {
    // If no allowedRoles specified, visible to all admin roles
    if (!item.allowedRoles) return true;
    // If userRole is null, hide items with restrictions
    if (!userRole) return false;
    // Check if user role is in allowed roles
    return item.allowedRoles.includes(userRole);
  });

  // Also filter by group allowedRoles
  const availableGroups = getMenuGroups(userRole);
  const availableGroupIds = new Set(availableGroups.map((g) => g.id));
  const finalFiltered = filtered.filter((item) =>
    availableGroupIds.has(item.group.id)
  );

  return finalFiltered.sort((a, b) => {
    // Sort by group priority first, then item priority
    const groupDiff = a.group.priority - b.group.priority;
    if (groupDiff !== 0) return groupDiff;
    return a.priority - b.priority;
  });
}

/**
 * Get menu items filtered by user role
 */
export function getMenuItemsForRole(
  locale: string,
  userRole: UserRole | null
): Record<string, ConsoleMenuItem[]> {
  const allGrouped = getMenuItemsByGroup(locale);

  // Filter items based on role
  const filtered: Record<string, ConsoleMenuItem[]> = {};

  Object.keys(allGrouped).forEach((groupId) => {
    const groupItems = allGrouped[groupId];
    if (!groupItems) return;
    const items = groupItems.filter((item) => {
      // If no allowedRoles specified, visible to all admin roles
      if (!item.allowedRoles) return true;
      // If userRole is null, hide items with restrictions
      if (!userRole) return false;
      // Check if user role is in allowed roles
      return item.allowedRoles.includes(userRole);
    });

    if (items.length > 0) {
      filtered[groupId] = items;
    }
  });

  return filtered;
}

/**
 * Get menu groups filtered by user role
 */
export function getMenuGroups(userRole: UserRole | null): ConsoleMenuGroup[] {
  const allGroups = Object.values(CONSOLE_MENU_GROUPS) as ConsoleMenuGroup[];

  // Super admin sees all groups
  if (userRole === 'super_admin') {
    return allGroups.sort((a, b) => a.priority - b.priority);
  }

  // Filter groups based on role
  const filtered = allGroups.filter((group) => {
    // If no allowedRoles specified, visible to all
    if (!group.allowedRoles) return true;
    // If userRole is null, hide groups with restrictions
    if (!userRole) return false;
    // Check if user role is in allowed roles
    return group.allowedRoles.includes(userRole);
  });

  return filtered.sort((a, b) => a.priority - b.priority);
}

/**
 * Get available groups for role (for switcher dropdown)
 */
export function getAvailableGroupsForRole(
  userRole: UserRole | null
): ConsoleMenuGroup[] {
  return getMenuGroups(userRole);
}

/**
 * Check if group switcher should be shown
 */
export function shouldShowGroupSwitcher(userRole: UserRole | null): boolean {
  const availableGroups = getAvailableGroupsForRole(userRole);
  // Show switcher if more than 1 group available
  return availableGroups.length > 1;
}

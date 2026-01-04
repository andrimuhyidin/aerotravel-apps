/**
 * Dashboard Layout Configuration
 * Role-based widget layouts for personalized dashboards
 * Part of Future Minimalist 2026 design system
 */

import type { Database } from '@/types/supabase';

type UserRole = Database['public']['Enums']['user_role'];

// ==========================================
// TYPES
// ==========================================

export type WidgetSize = 'sm' | 'md' | 'lg' | 'full';

export type WidgetConfig = {
  id: string;
  component: string;
  size: WidgetSize;
  priority: number;
  title?: string;
  description?: string;
};

export type QuickAction = {
  id: string;
  label: string;
  href: string;
  icon: string;
  variant?: 'primary' | 'secondary';
};

export type DashboardLayout = {
  greeting?: string;
  primaryWidgets: WidgetConfig[];
  secondaryWidgets: WidgetConfig[];
  quickActions: QuickAction[];
};

// ==========================================
// WIDGET DEFINITIONS
// ==========================================

export const WIDGET_REGISTRY = {
  // KPI Widgets
  'kpi-revenue': {
    component: 'RevenueKPIWidget',
    title: 'Revenue',
    description: 'Monthly revenue overview',
  },
  'kpi-bookings': {
    component: 'BookingsKPIWidget',
    title: 'Bookings',
    description: 'Booking statistics',
  },
  'kpi-trips': {
    component: 'TripsKPIWidget',
    title: 'Active Trips',
    description: 'Currently running trips',
  },
  'kpi-guides': {
    component: 'GuidesKPIWidget',
    title: 'Active Guides',
    description: 'Guide availability',
  },

  // Overview Widgets
  'revenue-overview': {
    component: 'RevenueOverviewWidget',
    title: 'Revenue Overview',
    description: 'Monthly revenue with trend chart',
  },
  'todays-trips': {
    component: 'TodaysTripsWidget',
    title: "Today's Trips",
    description: 'Active trips list',
  },
  'team-summary': {
    component: 'TeamSummaryWidget',
    title: 'Team Summary',
    description: 'Team performance overview',
  },
  'sos-alerts': {
    component: 'SOSAlertsWidget',
    title: 'SOS Alerts',
    description: 'Emergency alerts',
  },
  'recent-activities': {
    component: 'RecentActivitiesWidget',
    title: 'Recent Activities',
    description: 'Latest system activities',
  },
  'upcoming-trips': {
    component: 'UpcomingTripsWidget',
    title: 'Upcoming Trips',
    description: 'Next scheduled trips',
  },
  'quick-stats': {
    component: 'QuickStatsWidget',
    title: 'Quick Stats',
    description: 'Key metrics at a glance',
  },

  // Finance Widgets
  'cashflow-summary': {
    component: 'CashflowSummaryWidget',
    title: 'Cashflow',
    description: 'Cash in/out summary',
  },
  'pending-payments': {
    component: 'PendingPaymentsWidget',
    title: 'Pending Payments',
    description: 'Awaiting payment confirmation',
  },
  'invoice-summary': {
    component: 'InvoiceSummaryWidget',
    title: 'Invoices',
    description: 'Invoice status overview',
  },

  // Marketing Widgets
  'campaign-performance': {
    component: 'CampaignPerformanceWidget',
    title: 'Campaigns',
    description: 'Marketing campaign performance',
  },
  'lead-funnel': {
    component: 'LeadFunnelWidget',
    title: 'Lead Funnel',
    description: 'Lead conversion funnel',
  },
  'partner-stats': {
    component: 'PartnerStatsWidget',
    title: 'Partner Stats',
    description: 'Partner performance metrics',
  },

  // Investor Widgets
  'portfolio-overview': {
    component: 'PortfolioOverviewWidget',
    title: 'Portfolio',
    description: 'Investment portfolio overview',
  },
  'roi-chart': {
    component: 'ROIChartWidget',
    title: 'ROI',
    description: 'Return on investment chart',
  },
  'growth-metrics': {
    component: 'GrowthMetricsWidget',
    title: 'Growth Metrics',
    description: 'Business growth indicators',
  },
} as const;

export type WidgetId = keyof typeof WIDGET_REGISTRY;

// ==========================================
// ROLE-BASED LAYOUTS
// ==========================================

export const DASHBOARD_LAYOUTS: Record<UserRole, DashboardLayout> = {
  // Super Admin - Full visibility
  super_admin: {
    greeting: 'Welcome back, Admin',
    primaryWidgets: [
      { id: 'kpi-revenue', component: 'RevenueKPIWidget', size: 'sm', priority: 1 },
      { id: 'kpi-bookings', component: 'BookingsKPIWidget', size: 'sm', priority: 2 },
      { id: 'kpi-trips', component: 'TripsKPIWidget', size: 'sm', priority: 3 },
      { id: 'kpi-guides', component: 'GuidesKPIWidget', size: 'sm', priority: 4 },
    ],
    secondaryWidgets: [
      { id: 'recent-activities', component: 'RecentActivitiesWidget', size: 'lg', priority: 1 },
      { id: 'quick-stats', component: 'QuickStatsWidget', size: 'md', priority: 2 },
      { id: 'upcoming-trips', component: 'UpcomingTripsWidget', size: 'full', priority: 3 },
    ],
    quickActions: [
      { id: 'create-booking', label: 'Buat Booking', href: '/console/bookings/new', icon: 'Calendar' },
      { id: 'live-tracking', label: 'Live Tracking', href: '/console/operations/live-tracking', icon: 'MapPin' },
      { id: 'finance', label: 'Keuangan', href: '/console/finance', icon: 'DollarSign' },
      { id: 'guides', label: 'Kelola Guide', href: '/console/guide/contracts', icon: 'Users' },
    ],
  },

  // Operations Admin - Focus on trips and operations
  ops_admin: {
    greeting: 'Operations Dashboard',
    primaryWidgets: [
      { id: 'todays-trips', component: 'TodaysTripsWidget', size: 'lg', priority: 1 },
      { id: 'sos-alerts', component: 'SOSAlertsWidget', size: 'md', priority: 2 },
    ],
    secondaryWidgets: [
      { id: 'kpi-trips', component: 'TripsKPIWidget', size: 'sm', priority: 1 },
      { id: 'kpi-guides', component: 'GuidesKPIWidget', size: 'sm', priority: 2 },
      { id: 'kpi-bookings', component: 'BookingsKPIWidget', size: 'sm', priority: 3 },
      { id: 'upcoming-trips', component: 'UpcomingTripsWidget', size: 'full', priority: 4 },
      { id: 'recent-activities', component: 'RecentActivitiesWidget', size: 'lg', priority: 5 },
    ],
    quickActions: [
      { id: 'live-tracking', label: 'Live Tracking', href: '/console/operations/live-tracking', icon: 'MapPin', variant: 'primary' },
      { id: 'scheduler', label: 'Scheduler', href: '/console/operations/scheduler', icon: 'Calendar' },
      { id: 'inventory', label: 'Inventory', href: '/console/operations/inventory', icon: 'Package' },
      { id: 'guides', label: 'Guides', href: '/console/guide/contracts', icon: 'Users' },
    ],
  },

  // Finance Manager - Focus on revenue and payments
  finance_manager: {
    greeting: 'Finance Dashboard',
    primaryWidgets: [
      { id: 'revenue-overview', component: 'RevenueOverviewWidget', size: 'lg', priority: 1 },
      { id: 'cashflow-summary', component: 'CashflowSummaryWidget', size: 'md', priority: 2 },
    ],
    secondaryWidgets: [
      { id: 'kpi-revenue', component: 'RevenueKPIWidget', size: 'sm', priority: 1 },
      { id: 'pending-payments', component: 'PendingPaymentsWidget', size: 'md', priority: 2 },
      { id: 'invoice-summary', component: 'InvoiceSummaryWidget', size: 'md', priority: 3 },
      { id: 'recent-activities', component: 'RecentActivitiesWidget', size: 'lg', priority: 4 },
    ],
    quickActions: [
      { id: 'shadow-pnl', label: 'Shadow P&L', href: '/console/finance/shadow-pnl', icon: 'BarChart3', variant: 'primary' },
      { id: 'invoices', label: 'Invoices', href: '/console/finance', icon: 'FileText' },
      { id: 'payroll', label: 'Payroll', href: '/console/finance/payroll', icon: 'Wallet' },
      { id: 'reports', label: 'Reports', href: '/console/reports', icon: 'TrendingUp' },
    ],
  },

  // Marketing - Focus on campaigns and leads
  marketing: {
    greeting: 'Marketing Dashboard',
    primaryWidgets: [
      { id: 'campaign-performance', component: 'CampaignPerformanceWidget', size: 'lg', priority: 1 },
      { id: 'lead-funnel', component: 'LeadFunnelWidget', size: 'md', priority: 2 },
    ],
    secondaryWidgets: [
      { id: 'kpi-bookings', component: 'BookingsKPIWidget', size: 'sm', priority: 1 },
      { id: 'partner-stats', component: 'PartnerStatsWidget', size: 'md', priority: 2 },
      { id: 'recent-activities', component: 'RecentActivitiesWidget', size: 'lg', priority: 3 },
    ],
    quickActions: [
      { id: 'crm', label: 'CRM', href: '/console/crm', icon: 'Users', variant: 'primary' },
      { id: 'marketing', label: 'Campaigns', href: '/console/marketing', icon: 'Megaphone' },
      { id: 'partners', label: 'Partners', href: '/console/partners', icon: 'Building2' },
      { id: 'reports', label: 'Reports', href: '/console/reports', icon: 'BarChart3' },
    ],
  },

  // Investor - Focus on portfolio and ROI
  investor: {
    greeting: 'Investor Dashboard',
    primaryWidgets: [
      { id: 'portfolio-overview', component: 'PortfolioOverviewWidget', size: 'lg', priority: 1 },
      { id: 'roi-chart', component: 'ROIChartWidget', size: 'md', priority: 2 },
    ],
    secondaryWidgets: [
      { id: 'growth-metrics', component: 'GrowthMetricsWidget', size: 'md', priority: 1 },
      { id: 'revenue-overview', component: 'RevenueOverviewWidget', size: 'lg', priority: 2 },
    ],
    quickActions: [
      { id: 'reports', label: 'View Reports', href: '/console/reports', icon: 'FileText', variant: 'primary' },
      { id: 'finance', label: 'Financials', href: '/console/finance', icon: 'TrendingUp' },
    ],
  },

  // B2B Partner - Limited view
  b2b_partner: {
    greeting: 'Partner Dashboard',
    primaryWidgets: [
      { id: 'kpi-bookings', component: 'BookingsKPIWidget', size: 'md', priority: 1 },
      { id: 'kpi-revenue', component: 'RevenueKPIWidget', size: 'md', priority: 2 },
    ],
    secondaryWidgets: [
      { id: 'recent-activities', component: 'RecentActivitiesWidget', size: 'full', priority: 1 },
    ],
    quickActions: [
      { id: 'create-booking', label: 'New Booking', href: '/console/bookings/new', icon: 'Calendar', variant: 'primary' },
      { id: 'bookings', label: 'My Bookings', href: '/console/bookings', icon: 'ListTodo' },
    ],
  },

  // Guide - Minimal console access
  guide: {
    greeting: 'Guide Dashboard',
    primaryWidgets: [
      { id: 'todays-trips', component: 'TodaysTripsWidget', size: 'full', priority: 1 },
    ],
    secondaryWidgets: [
      { id: 'upcoming-trips', component: 'UpcomingTripsWidget', size: 'full', priority: 1 },
    ],
    quickActions: [
      { id: 'my-trips', label: 'My Trips', href: '/guide/my-trips', icon: 'Ship', variant: 'primary' },
    ],
  },

  // Customer - Redirect to customer portal
  customer: {
    greeting: 'Welcome',
    primaryWidgets: [],
    secondaryWidgets: [],
    quickActions: [
      { id: 'my-bookings', label: 'My Bookings', href: '/bookings', icon: 'Calendar', variant: 'primary' },
    ],
  },
};

// ==========================================
// HELPER FUNCTIONS
// ==========================================

/**
 * Get dashboard layout for a specific role
 */
export function getDashboardLayout(role: UserRole | null): DashboardLayout {
  if (!role) {
    return DASHBOARD_LAYOUTS.customer;
  }
  return DASHBOARD_LAYOUTS[role] || DASHBOARD_LAYOUTS.customer;
}

/**
 * Get widget config from registry
 */
export function getWidgetConfig(widgetId: string): (typeof WIDGET_REGISTRY)[WidgetId] | null {
  return WIDGET_REGISTRY[widgetId as WidgetId] || null;
}

/**
 * Check if user has access to dashboard
 */
export function hasConsoleDashboardAccess(role: UserRole | null): boolean {
  if (!role) return false;
  const accessibleRoles: UserRole[] = [
    'super_admin',
    'ops_admin',
    'finance_manager',
    'marketing',
    'investor',
    'b2b_partner',
  ];
  return accessibleRoles.includes(role);
}

/**
 * Get grid column class based on widget size
 */
export function getWidgetGridClass(size: WidgetSize): string {
  const sizeClasses: Record<WidgetSize, string> = {
    sm: 'col-span-1',
    md: 'col-span-1 lg:col-span-2',
    lg: 'col-span-1 lg:col-span-2 xl:col-span-3',
    full: 'col-span-full',
  };
  return sizeClasses[size];
}


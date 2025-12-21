/**
 * Guide App Type Definitions
 * Centralized type definitions for Guide App
 */

// ============================================
// Onboarding Types
// ============================================

export type OnboardingStep = {
  id: string;
  title: string;
  description?: string;
  completed: boolean;
  required: boolean;
  order: number;
};

export type OnboardingProgress = {
  status: 'not_started' | 'in_progress' | 'completed';
  completion_percentage: number;
  current_step_id?: string;
  started_at?: string;
  completed_at?: string;
};

export type OnboardingData = {
  steps: OnboardingStep[];
  currentProgress: OnboardingProgress | null;
};

// ============================================
// Greeting Types
// ============================================

export type GreetingContext = {
  hasActiveTrip?: boolean;
  upcomingTripsCount?: number;
  recentActivity?: string[];
  weatherCondition?: string;
  timeOfDay?: 'morning' | 'afternoon' | 'evening' | 'night';
};

export type GreetingData = {
  greeting: string;
  subtitle: string;
  timeOfDay: string;
  context: GreetingContext;
};

// ============================================
// Weather Types
// ============================================

export type WeatherAlert = {
  title: string;
  description: string;
  severity: 'minor' | 'moderate' | 'severe' | 'extreme';
  start: string;
  end: string;
  areas?: string[];
};

export type WeatherData = {
  current: {
    temp: number;
    feels_like: number;
    humidity: number;
    wind_speed: number;
    weather: {
      id: number;
      main: string;
      description: string;
      icon: string;
    };
  };
  alerts: WeatherAlert[];
};

// ============================================
// Challenge Types
// ============================================

export type ChallengeType = 'trip_count' | 'rating' | 'earnings' | 'perfect_month' | 'custom';

export type ChallengeStatus = 'active' | 'completed' | 'failed' | 'paused';

export type Challenge = {
  id: string;
  type?: string;
  challenge_type?: ChallengeType;
  target?: number;
  target_value?: number;
  current?: number;
  current_value?: number;
  title?: string;
  start_date?: string;
  end_date?: string | null;
  status: ChallengeStatus;
  reward?: string;
  reward_amount?: number | null;
};

// ============================================
// Promo Types
// ============================================

export type PromoType = 'promo' | 'update' | 'announcement';

export type PromoPriority = 'low' | 'medium' | 'high';

export type PromoUpdate = {
  id: string;
  type: PromoType;
  title: string;
  subtitle: string;
  description?: string;
  image?: string;
  link?: string;
  badge?: string;
  gradient: string;
  priority: PromoPriority;
  startDate?: string;
  endDate?: string;
};

// ============================================
// Menu Item Types
// ============================================

export type MenuItemSection = 'Akun' | 'Dukungan' | 'Pengaturan' | 'Operasional';

export type MenuItem = {
  href: string;
  label: string;
  icon_name: string;
  description?: string;
};

export type MenuSection = {
  section: MenuItemSection;
  items: MenuItem[];
};

// ============================================
// Quick Action Types
// ============================================

export type QuickAction = {
  id: string;
  href: string;
  label: string;
  icon_name: string;
  color: string;
  description?: string;
};

// ============================================
// Widget Data Types
// ============================================

export type WidgetData = {
  challenges?: Challenge[];
  promos?: PromoUpdate[];
  weather?: WeatherData;
  menuItems?: MenuSection[];
  quickActions?: QuickAction[];
};

// ============================================
// API Response Types
// ============================================

export type ChallengesResponse = {
  challenges: Challenge[];
};

export type PromosResponse = {
  items: PromoUpdate[];
};

export type MenuItemsResponse = {
  menuItems: MenuSection[];
};

export type QuickActionsResponse = {
  actions: QuickAction[];
};

// ============================================
// Profile Types
// ============================================

export type EmploymentStatus = 'active' | 'inactive' | 'on_leave' | 'terminated';

export type ExtendedUserProfile = {
  // Basic info (from users table)
  id: string;
  full_name: string;
  phone: string | null;
  email: string;
  nik: string | null;
  address: string | null;
  avatar_url: string | null;
  
  // Employee info (from users table)
  employee_number: string | null;
  hire_date: string | null;
  supervisor_id: string | null;
  home_address: string | null;
  employment_status: EmploymentStatus | null;
  
  // Branch info
  branch_id: string | null;
  
  // Status
  is_active: boolean;
};


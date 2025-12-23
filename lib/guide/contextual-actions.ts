/**
 * Contextual Quick Actions for Guide App
 * Enhanced with time-based and trip-based prioritization
 * Determines which quick actions to show based on user context
 */

import { logger } from '@/lib/utils/logger';

export type GuideContext = {
  hasActiveTrip: boolean;
  hasUpcomingTrip: boolean;
  hasCompletedTripToday: boolean;
  currentStatus: 'standby' | 'on_trip' | 'not_available';
  timeOfDay: 'morning' | 'afternoon' | 'evening' | 'night';
  nextTripTime?: string; // ISO string for next trip start time
};

export type QuickAction = {
  id: string;
  href: string;
  label: string;
  icon_name: string;
  color: string;
  description?: string;
  priority: 'primary' | 'secondary' | 'tertiary';
  contexts: Array<
    | 'always'
    | 'active_trip'
    | 'upcoming_trip'
    | 'completed_trip'
    | 'standby'
    | 'on_trip'
  >;
  timeBasedBoost?: number; // 0-1, boosts priority based on time
  tripBasedBoost?: number; // 0-1, boosts priority based on trip context
};

/**
 * Calculate time-based priority boost
 */
function getTimeBasedPriority(
  timeOfDay: 'morning' | 'afternoon' | 'evening' | 'night',
  href: string,
  nextTripTime?: string
): number {
  const _hour = new Date().getHours();
  let boost = 0;

  // Time-based boosts
  switch (timeOfDay) {
    case 'morning':
      // Morning: prioritize check-in related actions if trip is soon
      if (href === '/guide/status' || href === '/guide/attendance') {
        boost = 0.3;
      }
      if (nextTripTime) {
        const tripTime = new Date(nextTripTime);
        const hoursUntilTrip =
          (tripTime.getTime() - Date.now()) / (1000 * 60 * 60);
        if (hoursUntilTrip <= 2 && hoursUntilTrip > 0) {
          // Trip in next 2 hours - boost attendance/check-in
          if (href === '/guide/attendance' || href === '/guide/status') {
            boost = 0.5;
          }
        }
      }
      break;
    case 'afternoon':
      // Afternoon: prioritize trip-related actions
      if (href === '/guide/incidents' || href === '/guide/locations') {
        boost = 0.2;
      }
      break;
    case 'evening':
      // Evening: prioritize check-out and reporting
      if (href === '/guide/incidents' || href === '/guide/attendance') {
        boost = 0.2;
      }
      break;
    case 'night':
      // Night: prioritize status and availability
      if (href === '/guide/status') {
        boost = 0.3;
      }
      break;
  }

  return boost;
}

/**
 * Calculate trip-based priority boost
 */
function getTripBasedPriority(context: GuideContext, href: string): number {
  let boost = 0;

  // Active trip boosts
  if (context.hasActiveTrip) {
    if (href === '/guide/incidents' || href === '/guide/locations') {
      boost = 0.4; // High priority during active trip
    }
    if (href === '/guide/sos') {
      boost = 0.2; // SOS always important, but more during trip
    }
  }

  // Upcoming trip boosts
  if (context.hasUpcomingTrip) {
    if (href === '/guide/status') {
      boost = 0.2; // Set availability before trip
    }
  }

  // Completed trip today boosts
  if (context.hasCompletedTripToday) {
    if (href === '/guide/incidents') {
      boost = 0.3; // Report incidents after trip
    }
  }

  return boost;
}

/**
 * Calculate final priority with boosts
 */
function calculatePriority(
  action: QuickAction,
  timeBoost: number,
  tripBoost: number
): 'primary' | 'secondary' {
  const basePriority = action.priority;
  const totalBoost = timeBoost + tripBoost;

  // If boost is significant, promote to primary
  if (basePriority === 'secondary' && totalBoost >= 0.4) {
    return 'primary';
  }

  // If already primary, keep it
  if (basePriority === 'primary') {
    return 'primary';
  }

  // If tertiary, default to secondary (won't be shown anyway, but for type safety)
  if (basePriority === 'tertiary') {
    return 'secondary';
  }

  // Default to secondary for safety (should not reach here, but TypeScript needs it)
  return 'secondary';
}

/**
 * Get contextual quick actions based on guide context
 * Enhanced with time-based and trip-based prioritization
 */
export function getContextualActions(
  allActions: Array<{
    id: string;
    href: string;
    label: string;
    icon_name: string;
    color: string;
    description?: string;
  }>,
  context: GuideContext
): {
  primary: typeof allActions;
  secondary: typeof allActions;
} {
  // Map actions dengan priority dan context
  const actionMap = new Map<string, QuickAction>();

  // Default priority mapping
  // Primary: Most frequently used, always visible (max 4)
  // Secondary: Important but less frequent, expandable (max 4)
  // Tertiary: Moved to profile menu
  // NOTE: Actions that are in bottom nav (trips, attendance, manifest, profile) are already filtered out
  //       before reaching this function, so they don't need to be in these maps
  const priorityMap: Record<string, 'primary' | 'secondary' | 'tertiary'> = {
    '/guide/sos': 'primary', // Emergency - always visible, highest priority
    '/guide/insights': 'primary', // Performance tracking - always visible
    '/guide/wallet': 'primary', // Financial - always visible
    '/guide/broadcasts': 'primary', // Communication - always visible (4th primary)
    '/guide/status': 'secondary', // Availability - contextual
    '/guide/incidents': 'secondary', // Safety - contextual
    '/guide/locations': 'secondary', // Navigation - contextual
    '/guide/preferences': 'tertiary', // Settings - moved to profile
  };

  // Context mapping - determines when actions should be shown
  // NOTE: Actions in bottom nav are filtered out before this function
  const contextMap: Record<
    string,
    Array<
      | 'always'
      | 'active_trip'
      | 'upcoming_trip'
      | 'completed_trip'
      | 'standby'
      | 'on_trip'
    >
  > = {
    '/guide/sos': ['always'], // Emergency - always available
    '/guide/insights': ['always'], // Performance - always available
    '/guide/wallet': ['always'], // Financial - always available
    '/guide/broadcasts': ['always'], // Communication - always available (4th primary)
    '/guide/status': ['standby', 'on_trip'], // Availability management
    '/guide/incidents': ['active_trip', 'completed_trip'], // Safety reporting
    '/guide/locations': ['active_trip'], // Navigation during trip
    '/guide/preferences': ['always'], // Settings (moved to profile)
  };

  // Process all actions with boosts
  allActions.forEach((action) => {
    const basePriority = priorityMap[action.href] || 'tertiary';
    const contexts = contextMap[action.href] || ['always'];

    // Calculate boosts
    const timeBoost = getTimeBasedPriority(
      context.timeOfDay,
      action.href,
      context.nextTripTime
    );
    const tripBoost = getTripBasedPriority(context, action.href);

    // Calculate final priority
    const finalPriority = calculatePriority(
      { ...action, priority: basePriority, contexts },
      timeBoost,
      tripBoost
    );

    actionMap.set(action.href, {
      ...action,
      priority: finalPriority,
      contexts,
      timeBasedBoost: timeBoost,
      tripBasedBoost: tripBoost,
    });
  });

  // Debug logging (development only)
  if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
    logger.debug('[ContextualActions] Enhanced Debug', {
      allActionsCount: allActions.length,
      context,
      actionMapEntries: Array.from(actionMap.entries()).map(
        ([href, action]) => ({
          href,
          priority: action.priority,
          contexts: action.contexts,
          timeBoost: action.timeBasedBoost,
          tripBoost: action.tripBasedBoost,
        })
      ),
    });
  }

  // Filter actions based on context
  const shouldShow = (action: QuickAction): boolean => {
    // Always show if context includes 'always'
    if (action.contexts.includes('always')) {
      return true;
    }

    // Check specific contexts
    if (context.hasActiveTrip && action.contexts.includes('active_trip')) {
      return true;
    }
    if (context.hasUpcomingTrip && action.contexts.includes('upcoming_trip')) {
      return true;
    }
    if (
      context.hasCompletedTripToday &&
      action.contexts.includes('completed_trip')
    ) {
      return true;
    }
    if (
      context.currentStatus === 'standby' &&
      action.contexts.includes('standby')
    ) {
      return true;
    }
    if (
      context.currentStatus === 'on_trip' &&
      action.contexts.includes('on_trip')
    ) {
      return true;
    }

    return false;
  };

  // Separate into primary and secondary with sorting
  const primary: typeof allActions = [];
  const secondary: typeof allActions = [];

  actionMap.forEach((action) => {
    if (!shouldShow(action)) {
      return;
    }

    const actionData = {
      id: action.id,
      href: action.href,
      label: action.label,
      icon_name: action.icon_name,
      color: action.color,
      description: action.description,
    };

    if (action.priority === 'primary') {
      primary.push(actionData);
    } else if (action.priority === 'secondary') {
      secondary.push(actionData);
    }
    // Tertiary actions are moved to profile menu
  });

  // Sort primary by boost (highest first), then by original order
  primary.sort((a, b) => {
    const aAction = actionMap.get(a.href);
    const bAction = actionMap.get(b.href);
    const aBoost =
      (aAction?.timeBasedBoost || 0) + (aAction?.tripBasedBoost || 0);
    const bBoost =
      (bAction?.timeBasedBoost || 0) + (bAction?.tripBasedBoost || 0);

    // SOS always first
    if (a.href === '/guide/sos') return -1;
    if (b.href === '/guide/sos') return 1;

    // Then by boost
    return bBoost - aBoost;
  });

  // Limit primary to 4 items, secondary to 4 items
  return {
    primary: primary.slice(0, 4),
    secondary: secondary.slice(0, 4),
  };
}

/**
 * Get time of day based on current time
 */
export function getTimeOfDay(): 'morning' | 'afternoon' | 'evening' | 'night' {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 17) return 'afternoon';
  if (hour >= 17 && hour < 21) return 'evening';
  return 'night';
}

/**
 * AI Notification Prioritizer
 * Priority scoring, smart grouping, action suggestions
 */

import { generateContent } from '@/lib/gemini';
import { logger } from '@/lib/utils/logger';

export type Notification = {
  id: string;
  type: string;
  title: string;
  message: string;
  createdAt: string;
  read: boolean;
  metadata?: Record<string, unknown>;
};

export type PrioritizedNotification = Notification & {
  priority: 'urgent' | 'high' | 'medium' | 'low';
  priorityScore: number; // 0-100
  category: 'trip' | 'safety' | 'payment' | 'system' | 'social' | 'other';
  actionRequired: boolean;
  suggestedAction?: string;
  groupKey?: string; // For grouping
};

/**
 * Prioritize notifications
 */
export async function prioritizeNotifications(
  notifications: Notification[],
  context?: {
    activeTripId?: string;
    currentTime?: string;
  }
): Promise<PrioritizedNotification[]> {
  try {
    const notificationList = notifications
      .map(
        (n, idx) =>
          `${idx + 1}. Type: ${n.type}\n   Title: ${n.title}\n   Message: ${n.message}\n   Created: ${n.createdAt}`
      )
      .join('\n\n');

    const contextStr = context
      ? `\nContext:\n- Active Trip: ${context.activeTripId || 'None'}\n- Current Time: ${context.currentTime || new Date().toISOString()}`
      : '';

    const prompt = `Prioritize these notifications for a tour guide:

Notifications:
${notificationList}
${contextStr}

For each notification, provide:
- priority: "urgent" | "high" | "medium" | "low"
- priorityScore: 0-100 (higher = more important)
- category: "trip" | "safety" | "payment" | "system" | "social" | "other"
- actionRequired: true/false
- suggestedAction: "what guide should do" (if actionRequired)
- groupKey: "key for grouping similar notifications" (optional)

Return JSON array matching notification order:
[
  {
    "priority": "urgent",
    "priorityScore": 95,
    "category": "safety",
    "actionRequired": true,
    "suggestedAction": "action",
    "groupKey": "trip-123"
  }
]

Return ONLY the JSON array, no additional text.`;

    const response = await generateContent(prompt, undefined, 'gemini-1.5-flash');

    try {
      const cleaned = response.replace(/```json\n?|\n?```/g, '').trim();
      const priorities = JSON.parse(cleaned) as Array<{
        priority: 'urgent' | 'high' | 'medium' | 'low';
        priorityScore: number;
        category: string;
        actionRequired: boolean;
        suggestedAction?: string;
        groupKey?: string;
      }>;

      return notifications.map((notif, idx) => {
        const priority = priorities[idx] || getDefaultPriority(notif);
        return {
          ...notif,
          priority: priority.priority,
          priorityScore: priority.priorityScore,
          category: (priority.category || 'other') as PrioritizedNotification['category'],
          actionRequired: priority.actionRequired || false,
          suggestedAction: priority.suggestedAction,
          groupKey: priority.groupKey,
        };
      });
    } catch {
      // Fallback: use default prioritization
      return notifications.map((notif) => ({
        ...notif,
        ...getDefaultPriority(notif),
      }));
    }
  } catch (error) {
    logger.error('Failed to prioritize notifications', error);
    return notifications.map((notif) => ({
      ...notif,
      ...getDefaultPriority(notif),
    }));
  }
}

/**
 * Group notifications intelligently
 */
export async function groupNotifications(
  notifications: PrioritizedNotification[]
): Promise<Record<string, PrioritizedNotification[]>> {
  const groups: Record<string, PrioritizedNotification[]> = {};

  // Group by groupKey if available
  notifications.forEach((notif) => {
    if (notif.groupKey) {
      if (!groups[notif.groupKey]) {
        groups[notif.groupKey] = [];
      }
      groups[notif.groupKey]!.push(notif);
    } else {
      // Group by category and type
      const key = `${notif.category}-${notif.type}`;
      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key]!.push(notif);
    }
  });

  return groups;
}

function getDefaultPriority(notif: Notification): Omit<
  PrioritizedNotification,
  keyof Notification
> {
  // Keyword-based default prioritization
  const text = `${notif.title} ${notif.message}`.toLowerCase();

  let priority: 'urgent' | 'high' | 'medium' | 'low' = 'medium';
  let priorityScore = 50;
  let category: PrioritizedNotification['category'] = 'other';
  let actionRequired = false;
  let suggestedAction: string | undefined;

  // Urgent keywords
  if (
    text.includes('sos') ||
    text.includes('emergency') ||
    text.includes('urgent') ||
    text.includes('darurat')
  ) {
    priority = 'urgent';
    priorityScore = 95;
    category = 'safety';
    actionRequired = true;
    suggestedAction = 'Segera baca dan tindak lanjuti';
  }
  // High priority: trip-related
  else if (
    text.includes('trip') ||
    text.includes('check-in') ||
    text.includes('manifest') ||
    notif.type.includes('trip')
  ) {
    priority = 'high';
    priorityScore = 75;
    category = 'trip';
    actionRequired = true;
  }
  // Payment-related
  else if (text.includes('payment') || text.includes('pembayaran') || text.includes('wallet')) {
    priority = 'high';
    priorityScore = 70;
    category = 'payment';
    actionRequired = false;
  }
  // Safety-related
  else if (text.includes('safety') || text.includes('keselamatan') || text.includes('alert')) {
    priority = 'high';
    priorityScore = 80;
    category = 'safety';
    actionRequired = true;
  }

  return {
    priority,
    priorityScore,
    category,
    actionRequired,
    suggestedAction,
  };
}

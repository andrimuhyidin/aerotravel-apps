/**
 * AI Predictive Maintenance
 * Predict equipment issues, maintenance scheduling, safety alerts
 */

import { generateContent } from '@/lib/gemini';
import { logger } from '@/lib/utils/logger';

export type EquipmentUsage = {
  equipmentId: string;
  equipmentName: string;
  usageCount: number;
  lastUsed: string;
  lastMaintenance?: string;
  condition?: 'good' | 'fair' | 'poor';
  reportedIssues: number;
};

export type MaintenancePrediction = {
  equipmentId: string;
  equipmentName: string;
  issueProbability: number; // 0-100
  predictedIssue: string;
  recommendedAction: string;
  urgency: 'low' | 'medium' | 'high' | 'critical';
  estimatedMaintenanceDate: string;
  safetyAlert: boolean;
  confidence: number;
};

/**
 * Predict equipment maintenance needs
 */
export async function predictEquipmentMaintenance(
  equipment: EquipmentUsage[]
): Promise<MaintenancePrediction[]> {
  try {
    const equipmentList = equipment
      .map(
        (eq) =>
          `- ${eq.equipmentName} (ID: ${eq.equipmentId}): Used ${eq.usageCount}x, Last used: ${eq.lastUsed}, Last maintenance: ${eq.lastMaintenance || 'Never'}, Condition: ${eq.condition || 'Unknown'}, Reported issues: ${eq.reportedIssues}`
      )
      .join('\n');

    const prompt = `Analyze equipment usage and predict maintenance needs:

Equipment:
${equipmentList}

For each equipment, predict:
1. Probability of issues (0-100%)
2. Type of issue likely to occur
3. Recommended maintenance action
4. Urgency level
5. Estimated maintenance date
6. Safety concerns

Return JSON array:
[
  {
    "equipmentId": "id",
    "equipmentName": "name",
    "issueProbability": 0-100,
    "predictedIssue": "issue description",
    "recommendedAction": "what to do",
    "urgency": "low" | "medium" | "high" | "critical",
    "estimatedMaintenanceDate": "YYYY-MM-DD",
    "safetyAlert": true/false,
    "confidence": 0-1
  }
]

Return ONLY the JSON array, no additional text.`;

    const response = await generateContent(prompt, undefined, 'gemini-1.5-pro');

    try {
      const cleaned = response.replace(/```json\n?|\n?```/g, '').trim();
      const predictions = JSON.parse(cleaned) as MaintenancePrediction[];

      // Filter and sort by urgency and probability
      return predictions
        .filter((p) => p.issueProbability > 20) // Only show if >20% probability
        .sort((a, b) => {
          const urgencyOrder = { critical: 4, high: 3, medium: 2, low: 1 };
          if (urgencyOrder[a.urgency] !== urgencyOrder[b.urgency]) {
            return urgencyOrder[b.urgency] - urgencyOrder[a.urgency];
          }
          return b.issueProbability - a.issueProbability;
        });
    } catch {
      return getFallbackPredictions(equipment);
    }
  } catch (error) {
    logger.error('Failed to predict equipment maintenance', error);
    return getFallbackPredictions(equipment);
  }
}

/**
 * Get maintenance schedule suggestions
 */
export async function getMaintenanceSchedule(
  equipment: EquipmentUsage[]
): Promise<Array<{
  equipmentId: string;
  equipmentName: string;
  nextMaintenance: string;
  frequency: 'weekly' | 'monthly' | 'quarterly' | 'as_needed';
  reason: string;
}>> {
  try {
    const equipmentList = equipment
      .map(
        (eq) =>
          `${eq.equipmentName}: Used ${eq.usageCount}x, Last maintenance: ${eq.lastMaintenance || 'Never'}, Condition: ${eq.condition || 'Unknown'}`
      )
      .join('\n');

    const prompt = `Suggest maintenance schedule for this equipment:

${equipmentList}

For each equipment, suggest:
- Next maintenance date
- Frequency (weekly, monthly, quarterly, as_needed)
- Reason

Return JSON array:
[
  {
    "equipmentId": "id",
    "equipmentName": "name",
    "nextMaintenance": "YYYY-MM-DD",
    "frequency": "weekly" | "monthly" | "quarterly" | "as_needed",
    "reason": "why this schedule"
  }
]

Return ONLY the JSON array, no additional text.`;

    const response = await generateContent(prompt, undefined, 'gemini-1.5-flash');

    try {
      const cleaned = response.replace(/```json\n?|\n?```/g, '').trim();
      return JSON.parse(cleaned);
    } catch {
      return getFallbackSchedule(equipment);
    }
  } catch (error) {
    logger.error('Failed to get maintenance schedule', error);
    return getFallbackSchedule(equipment);
  }
}

function getFallbackPredictions(equipment: EquipmentUsage[]): MaintenancePrediction[] {
  return equipment
    .filter((eq) => {
      // High usage or no maintenance
      const daysSinceLastUse = Math.floor(
        (new Date().getTime() - new Date(eq.lastUsed).getTime()) / (1000 * 60 * 60 * 24)
      );
      const daysSinceMaintenance = eq.lastMaintenance
        ? Math.floor(
            (new Date().getTime() - new Date(eq.lastMaintenance).getTime()) / (1000 * 60 * 60 * 24)
          )
        : Infinity;

      return eq.usageCount > 50 || daysSinceMaintenance > 90 || eq.condition === 'poor';
    })
    .map((eq) => {
      const daysSinceMaintenance = eq.lastMaintenance
        ? Math.floor(
            (new Date().getTime() - new Date(eq.lastMaintenance).getTime()) / (1000 * 60 * 60 * 24)
          )
        : Infinity;

      let urgency: 'low' | 'medium' | 'high' | 'critical' = 'medium';
      let issueProbability = 50;

      if ((eq.condition === 'poor' && eq.reportedIssues > 5) || eq.reportedIssues > 10) {
        urgency = 'critical';
        issueProbability = 95;
      } else if (eq.condition === 'poor' || eq.reportedIssues > 3) {
        urgency = 'high';
        issueProbability = 80;
      } else if (daysSinceMaintenance > 180) {
        urgency = 'high';
        issueProbability = 70;
      } else if (daysSinceMaintenance > 90) {
        urgency = 'medium';
        issueProbability = 50;
      }

      const isHighOrCritical = urgency === 'high' || urgency === 'critical';

      return {
        equipmentId: eq.equipmentId,
        equipmentName: eq.equipmentName,
        issueProbability,
        predictedIssue: 'General wear and tear or maintenance needed',
        recommendedAction: 'Schedule maintenance inspection',
        urgency,
        estimatedMaintenanceDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
          .toISOString()
          .split('T')[0]!,
        safetyAlert: isHighOrCritical,
        confidence: 0.7,
      };
    });
}

function getFallbackSchedule(equipment: EquipmentUsage[]): Array<{
  equipmentId: string;
  equipmentName: string;
  nextMaintenance: string;
  frequency: 'weekly' | 'monthly' | 'quarterly' | 'as_needed';
  reason: string;
}> {
  return equipment.map((eq) => {
    const daysSinceMaintenance = eq.lastMaintenance
      ? Math.floor(
          (new Date().getTime() - new Date(eq.lastMaintenance).getTime()) / (1000 * 60 * 60 * 24)
        )
      : Infinity;

    let frequency: 'weekly' | 'monthly' | 'quarterly' | 'as_needed' = 'monthly';
    let nextMaintenanceDays = 30;

    if (eq.usageCount > 100) {
      frequency = 'weekly';
      nextMaintenanceDays = 7;
    } else if (eq.usageCount > 50) {
      frequency = 'monthly';
      nextMaintenanceDays = 30;
    } else {
      frequency = 'quarterly';
      nextMaintenanceDays = 90;
    }

    return {
      equipmentId: eq.equipmentId,
      equipmentName: eq.equipmentName,
      nextMaintenance: new Date(Date.now() + nextMaintenanceDays * 24 * 60 * 60 * 1000)
        .toISOString()
        .split('T')[0]!,
      frequency,
      reason: `Based on usage count: ${eq.usageCount} times`,
    };
  });
}

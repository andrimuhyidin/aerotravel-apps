/**
 * AI Manifest Assistant
 * Auto-suggest notes, safety alerts, grouping suggestions
 */

import { generateContent } from '@/lib/gemini';
import { logger } from '@/lib/utils/logger';

export type Passenger = {
  id?: string;
  name: string;
  type: 'adult' | 'child' | 'infant';
  age?: number;
  notes?: string;
  allergy?: string;
  specialRequest?: string;
};

export type TripContext = {
  destination?: string;
  tripType?: string;
  duration?: number;
  itinerary?: Array<{
    activity: string;
    location?: string;
  }>;
  weather?: {
    temp: number;
    description: string;
    hasAlert: boolean;
  };
};

/**
 * Suggest manifest notes for a passenger with trip context
 */
export async function suggestManifestNotes(
  passenger: Passenger,
  tripContext?: TripContext
): Promise<{
  suggestedNotes: string;
  safetyAlerts: string[];
  priority: 'high' | 'medium' | 'low';
}> {
  try {
    // Build context-aware prompt
    let contextInfo = '';
    if (tripContext) {
      contextInfo = `\nTrip Context:
- Destination: ${tripContext.destination || 'Unknown'}
- Trip Type: ${tripContext.tripType || 'general'}
- Duration: ${tripContext.duration || 1} day(s)
${tripContext.weather ? `- Weather: ${tripContext.weather.description} (${tripContext.weather.temp}°C)${tripContext.weather.hasAlert ? ' - ⚠️ Weather Alert' : ''}` : ''}
${tripContext.itinerary && tripContext.itinerary.length > 0 ? `- Activities: ${tripContext.itinerary.map(i => i.activity).join(', ')}` : ''}

Based on trip type and activities, consider:
${tripContext.tripType?.toLowerCase().includes('boat') || tripContext.tripType?.toLowerCase().includes('cruise') || tripContext.itinerary?.some(i => i.activity?.toLowerCase().includes('boat') || i.activity?.toLowerCase().includes('cruise')) ? '- Seasickness warnings for sensitive passengers\n' : ''}
${tripContext.tripType?.toLowerCase().includes('hiking') || tripContext.itinerary?.some(i => i.activity?.toLowerCase().includes('hiking') || i.activity?.toLowerCase().includes('trek')) ? '- Physical fitness considerations\n' : ''}
${tripContext.tripType?.toLowerCase().includes('diving') || tripContext.itinerary?.some(i => i.activity?.toLowerCase().includes('diving') || i.activity?.toLowerCase().includes('snorkel')) ? '- Medical clearance for diving activities\n' : ''}
`;
    }

    const prompt = `You are an AI assistant helping a tour guide manage passengers. Analyze this passenger information and suggest helpful manifest notes:

Passenger:
- Name: ${passenger.name}
- Type: ${passenger.type}
${passenger.age ? `- Age: ${passenger.age}` : ''}
${passenger.allergy ? `- Allergy: ${passenger.allergy}` : ''}
${passenger.specialRequest ? `- Special Request: ${passenger.specialRequest}` : ''}
${passenger.notes ? `- Existing Notes: ${passenger.notes}` : ''}${contextInfo}

Provide practical, actionable suggestions in JSON format:
{
  "suggestedNotes": "brief, practical note suggestion based on passenger info and trip context",
  "safetyAlerts": ["important alert 1", "important alert 2"],
  "priority": "high" | "medium" | "low"
}

Consider:
- Trip-specific risks (seasickness for boat trips, physical requirements for hiking, etc.)
- Age-appropriate concerns
- Medical/allergy safety
- Special needs accommodation

Return ONLY the JSON object, no additional text.`;

    const response = await generateContent(prompt, undefined, 'gemini-1.5-flash');

    try {
      const cleaned = response.replace(/```json\n?|\n?```/g, '').trim();
      const result = JSON.parse(cleaned) as {
        suggestedNotes: string;
        safetyAlerts: string[];
        priority: 'high' | 'medium' | 'low';
      };

      return {
        suggestedNotes: result.suggestedNotes || '',
        safetyAlerts: Array.isArray(result.safetyAlerts) ? result.safetyAlerts : [],
        priority: result.priority || 'low',
      };
    } catch {
      // Fallback
      const alerts: string[] = [];
      if (passenger.allergy) {
        alerts.push(`⚠️ Passenger has allergy: ${passenger.allergy}`);
      }
      if (passenger.type === 'child' || passenger.type === 'infant') {
        alerts.push('⚠️ Child/infant - requires extra attention');
      }

      return {
        suggestedNotes: passenger.allergy
          ? `Allergy: ${passenger.allergy}. ${passenger.specialRequest || ''}`
          : passenger.specialRequest || '',
        safetyAlerts: alerts,
        priority: passenger.allergy ? 'high' : passenger.type === 'child' ? 'medium' : 'low',
      };
    }
  } catch (error) {
    logger.error('Failed to suggest manifest notes', error);
    return {
      suggestedNotes: '',
      safetyAlerts: [],
      priority: 'low',
    };
  }
}

/**
 * Get grouping suggestions for passengers with trip context
 */
export async function getPassengerGroupingSuggestions(
  passengers: Passenger[],
  tripContext?: TripContext
): Promise<Array<{
  groupName: string;
  passengerNames: string[];
  reason: string;
  priority: 'high' | 'medium' | 'low';
}>> {
  try {
    const passengerList = passengers
      .map(
        (p) =>
          `- ${p.name} (${p.type}${p.age ? `, ${p.age} years` : ''})${p.allergy ? ` - Allergy: ${p.allergy}` : ''}${p.specialRequest ? ` - Request: ${p.specialRequest}` : ''}`
      )
      .join('\n');

    let contextInfo = '';
    if (tripContext) {
      contextInfo = `\nTrip Context:
- Destination: ${tripContext.destination || 'Unknown'}
- Trip Type: ${tripContext.tripType || 'general'}
- Activities: ${tripContext.itinerary?.map(i => i.activity).join(', ') || 'Various'}
`;
    }

    const prompt = `You are an AI assistant helping a tour guide organize passengers into logical groups for better management during the trip.

Passengers:
${passengerList}${contextInfo}

Suggest practical groups based on:
- Age (children/infants together for supervision)
- Special needs (allergies, medical conditions, dietary restrictions)
- Family relationships (if names suggest family - same surname, similar names)
- Language/communication needs
- Activity requirements (physical fitness, special equipment)
- Safety considerations (high-risk passengers together for extra attention)

Return JSON array:
[
  {
    "groupName": "descriptive group name",
    "passengerNames": ["name1", "name2"],
    "reason": "why grouped together (practical reason)",
    "priority": "high" | "medium" | "low"
  }
]

Return ONLY the JSON array, no additional text.`;

    const response = await generateContent(prompt, undefined, 'gemini-1.5-flash');

    try {
      const cleaned = response.replace(/```json\n?|\n?```/g, '').trim();
      const groups = JSON.parse(cleaned) as Array<{
        groupName: string;
        passengerNames: string[];
        reason: string;
        priority: 'high' | 'medium' | 'low';
      }>;

      return Array.isArray(groups) ? groups : [];
    } catch {
      // Fallback: group by type
      const children = passengers.filter((p) => p.type === 'child' || p.type === 'infant');
      const withAllergies = passengers.filter((p) => p.allergy);

      const groups: Array<{
        groupName: string;
        passengerNames: string[];
        reason: string;
        priority: 'high' | 'medium' | 'low';
      }> = [];

      if (children.length > 0) {
        groups.push({
          groupName: 'Children/Infants',
          passengerNames: children.map((p) => p.name),
          reason: 'Require extra attention and supervision',
          priority: 'high',
        });
      }

      if (withAllergies.length > 0) {
        groups.push({
          groupName: 'Special Dietary Needs',
          passengerNames: withAllergies.map((p) => p.name),
          reason: 'Have allergies - ensure safe food options',
          priority: 'high',
        });
      }

      return groups;
    }
  } catch (error) {
    logger.error('Failed to get passenger grouping suggestions', error);
    return [];
  }
}

/**
 * Get safety alerts for entire manifest with trip context
 */
export async function getManifestSafetyAlerts(
  passengers: Passenger[],
  tripContext?: TripContext
): Promise<Array<{
  type: 'allergy' | 'medical' | 'age' | 'special' | 'trip_specific';
  message: string;
  affectedPassengers: string[];
  priority: 'high' | 'medium' | 'low';
}>> {
  try {
    const alerts: Array<{
      type: 'allergy' | 'medical' | 'age' | 'special' | 'trip_specific';
      message: string;
      affectedPassengers: string[];
      priority: 'high' | 'medium' | 'low';
    }> = [];

    // Check allergies
    const withAllergies = passengers.filter((p) => p.allergy);
    if (withAllergies.length > 0) {
      alerts.push({
        type: 'allergy',
        message: `${withAllergies.length} penumpang memiliki alergi. Pastikan opsi makanan aman tersedia.`,
        affectedPassengers: withAllergies.map((p) => p.name),
        priority: 'high',
      });
    }

    // Check children/infants
    const children = passengers.filter((p) => p.type === 'child' || p.type === 'infant');
    if (children.length > 0) {
      alerts.push({
        type: 'age',
        message: `${children.length} anak/bayi di trip ini. Pastikan pengawasan dan peralatan keselamatan memadai.`,
        affectedPassengers: children.map((p) => p.name),
        priority: 'high',
      });
    }

    // Check special requests
    const withSpecialRequests = passengers.filter((p) => p.specialRequest);
    if (withSpecialRequests.length > 0) {
      alerts.push({
        type: 'special',
        message: `${withSpecialRequests.length} penumpang memiliki permintaan khusus. Periksa dan akomodasi.`,
        affectedPassengers: withSpecialRequests.map((p) => p.name),
        priority: 'medium',
      });
    }

    // Trip-specific alerts based on context
    if (tripContext) {
      const isBoatTrip = tripContext.tripType?.toLowerCase().includes('boat') ||
        tripContext.tripType?.toLowerCase().includes('cruise') ||
        tripContext.itinerary?.some(i => 
          i.activity?.toLowerCase().includes('boat') || 
          i.activity?.toLowerCase().includes('cruise') ||
          i.activity?.toLowerCase().includes('sailing')
        );

      const isHikingTrip = tripContext.tripType?.toLowerCase().includes('hiking') ||
        tripContext.itinerary?.some(i => 
          i.activity?.toLowerCase().includes('hiking') || 
          i.activity?.toLowerCase().includes('trek') ||
          i.activity?.toLowerCase().includes('climb')
        );

      const isDivingTrip = tripContext.tripType?.toLowerCase().includes('diving') ||
        tripContext.itinerary?.some(i => 
          i.activity?.toLowerCase().includes('diving') || 
          i.activity?.toLowerCase().includes('snorkel')
        );

      if (isBoatTrip) {
        // Check for passengers who might be prone to seasickness
        const elderlyOrChildren = passengers.filter(p => 
          p.type === 'child' || p.type === 'infant' || (p.age && p.age > 60)
        );
        if (elderlyOrChildren.length > 0) {
          alerts.push({
            type: 'trip_specific',
            message: `⚠️ Trip melibatkan perjalanan laut. ${elderlyOrChildren.length} penumpang (anak/lansia) mungkin lebih rentan mabuk laut. Siapkan obat anti-mabuk.`,
            affectedPassengers: elderlyOrChildren.map((p) => p.name),
            priority: 'medium',
          });
        }
      }

      if (isHikingTrip) {
        const elderlyOrChildren = passengers.filter(p => 
          p.type === 'child' || p.type === 'infant' || (p.age && p.age > 60)
        );
        if (elderlyOrChildren.length > 0) {
          alerts.push({
            type: 'trip_specific',
            message: `⚠️ Trip melibatkan hiking/trekking. ${elderlyOrChildren.length} penumpang (anak/lansia) mungkin membutuhkan perhatian ekstra untuk aktivitas fisik.`,
            affectedPassengers: elderlyOrChildren.map((p) => p.name),
            priority: 'medium',
          });
        }
      }

      if (isDivingTrip) {
        const withMedicalConditions = passengers.filter(p => 
          p.allergy || p.specialRequest?.toLowerCase().includes('medical') || 
          p.specialRequest?.toLowerCase().includes('asthma') ||
          p.specialRequest?.toLowerCase().includes('heart')
        );
        if (withMedicalConditions.length > 0) {
          alerts.push({
            type: 'trip_specific',
            message: `⚠️ Trip melibatkan diving/snorkeling. ${withMedicalConditions.length} penumpang dengan kondisi medis perlu clearance medis sebelum diving.`,
            affectedPassengers: withMedicalConditions.map((p) => p.name),
            priority: 'high',
          });
        }
      }

      // Weather alerts
      if (tripContext.weather?.hasAlert) {
        alerts.push({
          type: 'trip_specific',
          message: `⚠️ Peringatan cuaca untuk trip ini. Periksa kondisi cuaca dan siapkan rencana alternatif jika diperlukan.`,
          affectedPassengers: passengers.map((p) => p.name),
          priority: 'high',
        });
      }
    }

    return alerts;
  } catch (error) {
    logger.error('Failed to get manifest safety alerts', error);
    return [];
  }
}

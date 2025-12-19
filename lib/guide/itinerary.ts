/**
 * Itinerary utilities for Guide App
 *
 * Source of truth:
 * - package_itineraries table (preferred)
 * - fallback to JSONB itinerary field on packages if needed
 */

export type ItineraryActivity = {
  time?: string;
  label: string;
};

export type ItineraryDay = {
  dayNumber: number;
  title: string;
  activities: ItineraryActivity[];
};

/**
 * Parse raw description (newline separated, optionally with HH:MM prefixes)
 * into structured activities.
 */
export function parseItineraryDescription(description: string | null | undefined): ItineraryActivity[] {
  if (!description) {
    return [];
  }

  const lines = description.split('\n').map((line) => line.trim()).filter((line) => line.length > 0);

  const activities: ItineraryActivity[] = [];

  for (const line of lines) {
    // Match lines like "08:30 Briefing di dermaga"
    const timeMatch = line.match(/^(\d{1,2}:\d{2})\s+(.+)$/);

    if (timeMatch) {
      const [, time, label] = timeMatch;
      if (label && label.length >= 3) {
        activities.push({ time, label });
      }
      continue;
    }

    // Fallback: treat whole line as label without explicit time
    if (line.length >= 3) {
      activities.push({ label: line });
    }
  }

  return activities;
}

/**
 * Build itinerary days from package_itineraries rows.
 *
 * The caller is responsible for fetching rows from Supabase with shape:
 * { day_number: number; title: string | null; description: string | null }[]
 */
export function buildItineraryDaysFromRows(
  rows: Array<{ day_number: number; title: string | null; description: string | null }>,
): ItineraryDay[] {
  if (!rows || rows.length === 0) {
    return [];
  }

  return rows
    .sort((a, b) => a.day_number - b.day_number)
    .map((row) => {
      const activities = parseItineraryDescription(row.description);

      return {
        dayNumber: row.day_number,
        title: row.title ?? `Day ${row.day_number}`,
        activities,
      };
    });
}

/**
 * Build itinerary days from JSONB itinerary field in packages table.
 *
 * Expected JSONB structure:
 * - Array of days: [{ day: 1, title: "Day 1", activities: [...] }]
 * - Or object with days: { days: [...] }
 */
export function buildItineraryDaysFromJsonb(
  jsonbItinerary: unknown,
): ItineraryDay[] {
  if (!jsonbItinerary) {
    return [];
  }

  try {
    // Handle string JSONB
    let parsed: unknown = jsonbItinerary;
    if (typeof jsonbItinerary === 'string') {
      parsed = JSON.parse(jsonbItinerary);
    }

    // Handle array of days
    if (Array.isArray(parsed)) {
      return parsed
        .map((day: unknown, index: number) => {
          if (typeof day === 'object' && day !== null) {
            const dayObj = day as {
              day?: number;
              dayNumber?: number;
              title?: string;
              activities?: Array<{ time?: string; label: string } | string>;
            };

            const dayNumber = dayObj.day ?? dayObj.dayNumber ?? index + 1;
            const title = dayObj.title ?? `Day ${dayNumber}`;
            
            let activities: ItineraryActivity[] = [];
            if (Array.isArray(dayObj.activities)) {
              activities = dayObj.activities.map((act) => {
                if (typeof act === 'string') {
                  return { label: act };
                }
                return {
                  time: act.time,
                  label: act.label,
                };
              });
            }

            return {
              dayNumber,
              title,
              activities,
            };
          }
          return null;
        })
        .filter((day): day is ItineraryDay => day !== null);
    }

    // Handle object with days array
    if (typeof parsed === 'object' && parsed !== null && 'days' in parsed) {
      const days = (parsed as { days: unknown }).days;
      if (Array.isArray(days)) {
        return buildItineraryDaysFromJsonb(days);
      }
    }

    return [];
  } catch (error) {
    console.error('Failed to parse JSONB itinerary', error);
    return [];
  }
}


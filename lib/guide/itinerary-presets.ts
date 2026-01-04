/**
 * Itinerary Presets
 * Predefined itinerary structure based on best practices for trip planning
 */

import type { ItineraryActivity, ItineraryDay } from './itinerary';

/**
 * Generate predefined itinerary structure for a trip
 * @param durationDays - Number of days for the trip
 * @param destination - Destination name (optional)
 * @param meetingPoint - Meeting point location (optional)
 */
export function generatePredefinedItinerary(
  durationDays: number,
  destination?: string | null,
  meetingPoint?: string | null
): ItineraryDay[] {
  const days: ItineraryDay[] = [];

  for (let day = 1; day <= durationDays; day++) {
    const isFirstDay = day === 1;
    const isLastDay = day === durationDays;
    const dayTitle = destination 
      ? `Day ${day} - ${destination}`
      : `Day ${day}`;

    const activities: ItineraryActivity[] = [];

    if (isFirstDay) {
      // Day 1 activities
      activities.push(
        { time: '07:00', label: `Meeting Point: ${meetingPoint || 'TBD'}` },
        { time: '07:30', label: 'Briefing & Safety Instructions' },
        { time: '08:00', label: 'Departure' },
        { time: '09:00', label: 'Aktivitas 1' },
        { time: '12:00', label: 'Makan Siang' },
        { time: '13:00', label: 'Aktivitas 2' },
        { time: '15:00', label: 'Snack Time' },
        { time: '16:00', label: 'Aktivitas 3' },
        { time: '17:00', label: durationDays > 1 ? 'Check-in Akomodasi' : 'Return' },
        ...(durationDays > 1 ? [{ time: '19:00', label: 'Makan Malam' }] : [])
      );
    } else if (isLastDay) {
      // Last day activities
      activities.push(
        { time: '07:00', label: 'Sarapan' },
        { time: '08:00', label: 'Check-out Akomodasi' },
        { time: '09:00', label: 'Aktivitas 1' },
        { time: '12:00', label: 'Makan Siang' },
        { time: '13:00', label: 'Aktivitas 2' },
        { time: '15:00', label: 'Snack Time' },
        { time: '16:00', label: 'Return to Meeting Point' },
        { time: '17:00', label: 'Farewell & Dismissal' }
      );
    } else {
      // Middle days activities
      activities.push(
        { time: '07:00', label: 'Sarapan' },
        { time: '08:00', label: 'Aktivitas 1' },
        { time: '10:00', label: 'Coffee Break' },
        { time: '11:00', label: 'Aktivitas 2' },
        { time: '12:30', label: 'Makan Siang' },
        { time: '14:00', label: 'Aktivitas 3' },
        { time: '16:00', label: 'Snack Time' },
        { time: '17:00', label: 'Aktivitas 4' },
        { time: '19:00', label: 'Makan Malam' },
        { time: '20:00', label: 'Free Time / Acara Tambahan' }
      );
    }

    days.push({
      dayNumber: day,
      title: dayTitle,
      activities,
    });
  }

  return days;
}

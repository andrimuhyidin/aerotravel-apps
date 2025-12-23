/**
 * AI Trip Assistant
 * Context-aware AI assistant untuk trip-specific queries
 * Menggunakan RAG (Retrieval Augmented Generation) dengan trip context
 */

import { retrieveContextWithVector } from '@/lib/ai/rag';
import { chat } from '@/lib/gemini';
import { logger } from '@/lib/utils/logger';

export type TripContext = {
  tripId: string;
  tripCode: string;
  tripDate: string;
  status: string;
  totalPax: number;
  packageName?: string;
  manifest?: {
    total: number;
    boarded: number;
    returned: number;
    passengers: Array<{
      name: string;
      type: string;
      status: string;
      notes?: string;
      allergy?: string;
    }>;
  };
  tasks?: Array<{
    id: string;
    title: string;
    status: string;
    dueTime?: string;
  }>;
  weather?: {
    temp: number;
    description: string;
    hasAlert: boolean;
  };
  itinerary?: Array<{
    time: string;
    activity: string;
    location?: string;
  }>;
  expenses?: {
    total: number;
    count: number;
    categories: Record<string, number>;
  };
  attendance?: {
    hasCheckedIn: boolean;
    hasCheckedOut: boolean;
    checkInTime?: string;
  };
};

const SYSTEM_PROMPT = `You are an AI assistant helping a tour guide during their trip. You have access to real-time trip information including:
- Trip details (code, date, status, number of guests)
- Manifest (passenger list, boarding status, special notes/allergies)
- Tasks (what needs to be done, completion status)
- Weather conditions
- Itinerary (schedule of activities)
- Expenses (tracking)
- Attendance (check-in/check-out status)

Your role:
1. Answer questions about the trip using the provided context
2. Provide helpful suggestions based on trip data
3. Alert about important information (allergies, special requests, incomplete tasks)
4. Be concise and practical - guides are often busy during trips
5. If you don't have information, say so clearly

Always respond in Indonesian (Bahasa Indonesia) unless asked otherwise.
Be friendly but professional.`;

/**
 * Chat with AI assistant about specific trip
 * @param question - User question
 * @param context - Trip context
 * @param branchId - Optional branch ID untuk filter SOP documents
 */
export async function chatTripAssistant(
  question: string,
  context: TripContext,
  branchId?: string | null
): Promise<string> {
  try {
    // Build context string
    const contextString = buildContextString(context);

    // Retrieve SOP documents using RAG if question seems to be about procedures/safety
    let sopContext = '';
    const isSOPQuestion =
      /(prosedur|sop|safety|keselamatan|darurat|emergency|penanganan|handle|bagaimana|gimana|cara)/i.test(
        question
      );

    if (isSOPQuestion) {
      try {
        const ragContext = await retrieveContextWithVector(
          question,
          branchId,
          0.7,
          3
        );
        if (ragContext.documents && ragContext.documents.length > 0) {
          sopContext = '\n\nRELEVANT SOP/SAFETY DOCUMENTS:\n';
          ragContext.documents.forEach((doc: unknown, idx: number) => {
            sopContext += `${idx + 1}. ${doc.title || 'Document'} (${doc.document_type || 'sop'}):\n`;
            sopContext += `${doc.content?.slice(0, 500) || ''}${doc.content && doc.content.length > 500 ? '...' : ''}\n\n`;
          });
        }
      } catch (ragError) {
        logger.warn('RAG retrieval failed, continuing without SOP context', {
          error: ragError,
          question,
          branchId,
        });
      }
    }

    // Build prompt with context
    const prompt = `${contextString}${sopContext}

Guide Question: ${question}

Please provide a helpful answer based on the trip information above${sopContext ? ' and the relevant SOP/safety documents' : ''}.`;

    // Call Gemini AI
    const response = await chat(
      [{ role: 'user', content: prompt }],
      SYSTEM_PROMPT,
      'gemini-1.5-flash' // Use flash for faster responses
    );

    logger.info('AI Trip Assistant response generated', {
      tripId: context.tripId,
      questionLength: question.length,
      responseLength: response.length,
      hasSOPContext: !!sopContext,
    });

    return response;
  } catch (error) {
    logger.error('Failed to generate AI trip assistant response', error, {
      tripId: context.tripId,
    });
    throw new Error('Gagal mendapatkan respons dari AI assistant');
  }
}

/**
 * Build context string from trip data
 */
function buildContextString(context: TripContext): string {
  let contextStr = `TRIP INFORMATION:
- Trip Code: ${context.tripCode}
- Date: ${context.tripDate}
- Status: ${context.status}
- Total Passengers: ${context.totalPax}
${context.packageName ? `- Package: ${context.packageName}` : ''}

`;

  // Manifest info
  if (context.manifest) {
    contextStr += `MANIFEST:
- Total: ${context.manifest.total} passengers
- Boarded: ${context.manifest.boarded}
- Returned: ${context.manifest.returned}
`;

    if (context.manifest.passengers.length > 0) {
      contextStr += '\nPassengers:\n';
      context.manifest.passengers.forEach((p, idx) => {
        contextStr += `${idx + 1}. ${p.name} (${p.type}) - Status: ${p.status}`;
        if (p.allergy) contextStr += ` - ⚠️ ALLERGY: ${p.allergy}`;
        if (p.notes) contextStr += ` - Notes: ${p.notes}`;
        contextStr += '\n';
      });
    }
    contextStr += '\n';
  }

  // Tasks info
  if (context.tasks && context.tasks.length > 0) {
    contextStr += `TASKS:
`;
    context.tasks.forEach((task) => {
      const status = task.status === 'completed' ? '✓' : '○';
      contextStr += `${status} ${task.title}${task.dueTime ? ` (Due: ${task.dueTime})` : ''}\n`;
    });
    contextStr += '\n';
  }

  // Weather info
  if (context.weather) {
    contextStr += `WEATHER:
- Temperature: ${context.weather.temp}°C
- Condition: ${context.weather.description}
${context.weather.hasAlert ? '⚠️ Weather Alert: Conditions may affect trip' : ''}

`;
  }

  // Itinerary
  if (context.itinerary && context.itinerary.length > 0) {
    contextStr += `ITINERARY:
`;
    context.itinerary.forEach((item) => {
      contextStr += `${item.time} - ${item.activity}${item.location ? ` @ ${item.location}` : ''}\n`;
    });
    contextStr += '\n';
  }

  // Expenses
  if (context.expenses) {
    contextStr += `EXPENSES:
- Total: Rp ${context.expenses.total.toLocaleString('id-ID')}
- Count: ${context.expenses.count}
`;
    if (Object.keys(context.expenses.categories).length > 0) {
      contextStr += 'Categories:\n';
      Object.entries(context.expenses.categories).forEach(([cat, amount]) => {
        contextStr += `  - ${cat}: Rp ${amount.toLocaleString('id-ID')}\n`;
      });
    }
    contextStr += '\n';
  }

  // Attendance
  if (context.attendance) {
    contextStr += `ATTENDANCE:
- Check-in: ${context.attendance.hasCheckedIn ? '✓' : '○'}${context.attendance.checkInTime ? ` (${context.attendance.checkInTime})` : ''}
- Check-out: ${context.attendance.hasCheckedOut ? '✓' : '○'}
`;
  }

  return contextStr;
}

/**
 * Get quick suggestions based on trip context
 */
export async function getTripSuggestions(
  context: TripContext
): Promise<string[]> {
  try {
    const contextString = buildContextString(context);

    const prompt = `${contextString}

Based on this trip information, provide 3-5 practical suggestions for the guide.
Focus on:
- Safety concerns (allergies, weather alerts)
- Incomplete tasks
- Important reminders
- Efficiency tips

Return as a JSON array of strings: ["suggestion 1", "suggestion 2", ...]`;

    const response = await chat(
      [{ role: 'user', content: prompt }],
      SYSTEM_PROMPT,
      'gemini-1.5-flash'
    );

    // Parse JSON response
    try {
      const cleaned = response.replace(/```json\n?|\n?```/g, '').trim();
      const suggestions = JSON.parse(cleaned) as string[];
      return Array.isArray(suggestions) ? suggestions : [];
    } catch {
      // Fallback: split by lines if JSON parse fails
      return response
        .split('\n')
        .filter((line) => line.trim().length > 0)
        .slice(0, 5);
    }
  } catch (error) {
    logger.error('Failed to get trip suggestions', error, {
      tripId: context.tripId,
    });
    return [];
  }
}

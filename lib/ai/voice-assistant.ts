/**
 * AI Voice Assistant
 * Voice commands, hands-free operation, voice-to-text
 */

import { generateContent } from '@/lib/gemini';
import { logger } from '@/lib/utils/logger';

export type VoiceCommand = {
  intent: 'check_status' | 'check_manifest' | 'check_weather' | 'sos' | 'add_expense' | 'other';
  action: string;
  parameters: Record<string, unknown>;
  confidence: number;
};

/**
 * Process voice command (transcribed text)
 */
export async function processVoiceCommand(
  transcribedText: string,
  context?: {
    activeTripId?: string;
    currentLocation?: { lat: number; lng: number };
  }
): Promise<VoiceCommand> {
  try {
    const contextStr = context
      ? `\nContext:\n${context.activeTripId ? `- Active Trip: ${context.activeTripId}\n` : ''}${context.currentLocation ? `- Current Location: ${context.currentLocation.lat}, ${context.currentLocation.lng}\n` : ''}`
      : '';

    const prompt = `Process this voice command from a tour guide:

Command: "${transcribedText}"
${contextStr}

Identify the intent and extract parameters. Possible intents:
- check_status: Check trip status, attendance status
- check_manifest: Check passenger manifest, boarding status
- check_weather: Check weather conditions
- sos: Emergency/SOS request
- add_expense: Add expense with amount and description
- other: Other commands

Return JSON:
{
  "intent": "intent name",
  "action": "what action to take",
  "parameters": {
    "key": "value"
  },
  "confidence": 0-1
}

Return ONLY the JSON object, no additional text.`;

    const response = await generateContent(prompt, undefined, 'gemini-1.5-flash');

    try {
      const cleaned = response.replace(/```json\n?|\n?```/g, '').trim();
      const command = JSON.parse(cleaned) as VoiceCommand;

      // Validate intent
      const validIntents = ['check_status', 'check_manifest', 'check_weather', 'sos', 'add_expense', 'other'];
      if (!validIntents.includes(command.intent)) {
        command.intent = 'other';
      }

      return command;
    } catch {
      return getFallbackCommand(transcribedText);
    }
  } catch (error) {
    logger.error('Failed to process voice command', error);
    return getFallbackCommand(transcribedText);
  }
}

/**
 * Convert voice command to action
 */
export function commandToAction(command: VoiceCommand): {
  endpoint: string;
  method: 'GET' | 'POST';
  payload?: Record<string, unknown>;
} {
  switch (command.intent) {
    case 'check_status':
      return {
        endpoint: '/api/guide/status',
        method: 'GET',
      };
    case 'check_manifest':
      return {
        endpoint: command.parameters.tripId
          ? `/api/guide/manifest?tripId=${command.parameters.tripId}`
          : '/api/guide/manifest',
        method: 'GET',
      };
    case 'check_weather':
      return {
        endpoint: '/api/guide/weather',
        method: 'GET',
      };
    case 'sos':
      return {
        endpoint: '/api/guide/sos',
        method: 'POST',
        payload: {
          location: command.parameters.location,
        },
      };
    case 'add_expense':
      return {
        endpoint: '/api/guide/expenses',
        method: 'POST',
        payload: {
          amount: command.parameters.amount,
          description: command.parameters.description,
          category: command.parameters.category || 'other',
        },
      };
    default:
      return {
        endpoint: '/api/guide/status',
        method: 'GET',
      };
  }
}

function getFallbackCommand(text: string): VoiceCommand {
  const lowerText = text.toLowerCase();

  if (lowerText.includes('sos') || lowerText.includes('emergency') || lowerText.includes('darurat')) {
    return {
      intent: 'sos',
      action: 'Trigger SOS',
      parameters: {},
      confidence: 0.8,
    };
  } else if (lowerText.includes('manifest') || lowerText.includes('penumpang')) {
    return {
      intent: 'check_manifest',
      action: 'Check manifest',
      parameters: {},
      confidence: 0.7,
    };
  } else if (lowerText.includes('weather') || lowerText.includes('cuaca')) {
    return {
      intent: 'check_weather',
      action: 'Check weather',
      parameters: {},
      confidence: 0.7,
    };
  } else if (lowerText.includes('status')) {
    return {
      intent: 'check_status',
      action: 'Check status',
      parameters: {},
      confidence: 0.6,
    };
  }

  return {
    intent: 'other',
    action: 'Unknown command',
    parameters: {},
    confidence: 0.3,
  };
}

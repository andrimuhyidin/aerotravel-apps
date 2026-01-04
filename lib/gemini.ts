import { GoogleGenerativeAI } from '@google/generative-ai';

import { logger } from '@/lib/utils/logger';

// Client cache with key-based invalidation
let geminiClient: GoogleGenerativeAI | null = null;
let cachedApiKey: string | null = null;
let cachedModel: string | null = null;

/**
 * Get Gemini client (sync - uses env vars)
 * For backward compatibility with existing code
 */
function getGeminiClient(): GoogleGenerativeAI {
  const apiKey = process.env.GEMINI_API_KEY;
  
  // Return cached client if API key hasn't changed
  if (geminiClient && cachedApiKey === apiKey) {
    return geminiClient;
  }
  
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY environment variable is not set');
  }
  
  geminiClient = new GoogleGenerativeAI(apiKey);
  cachedApiKey = apiKey;
  return geminiClient;
}

/**
 * Get Gemini client with database settings fallback (async)
 * Tries to get API key from database first, falls back to env
 */
async function getGeminiClientAsync(): Promise<{ client: GoogleGenerativeAI; model: string }> {
  try {
    // Import dynamically to avoid circular dependencies and support server-only
    const { getSensitiveConfigValue, getConfigValue } = await import(
      '@/lib/settings/env-fallback'
    );
    
    // Try to get API key from database first, then fall back to env
    const apiKey = await getSensitiveConfigValue('ai.api_key');
    const model = await getConfigValue('ai.model', 'gemini-2.0-flash');
    
    if (!apiKey) {
      throw new Error('AI API key not configured in database or environment');
    }
    
    // Return cached client if API key and model haven't changed
    if (geminiClient && cachedApiKey === apiKey && cachedModel === model) {
      return { client: geminiClient, model };
    }
    
    geminiClient = new GoogleGenerativeAI(apiKey);
    cachedApiKey = apiKey;
    cachedModel = model;
    
    logger.debug('Gemini client initialized from database settings');
    
    return { client: geminiClient, model };
  } catch (error) {
    // Fallback to env-based client
    logger.warn('Falling back to env-based Gemini client', { error });
    return { client: getGeminiClient(), model: DEFAULT_MODEL };
  }
}

/**
 * Invalidate cached client (call when settings are updated)
 */
export function invalidateGeminiClient(): void {
  geminiClient = null;
  cachedApiKey = null;
  cachedModel = null;
}

/**
 * Gemini Model Selection (January 2026):
 * - gemini-2.0-flash: Latest fast model (recommended)
 * - gemini-2.0-flash-lite: Ultra-fast, cheaper
 * - gemini-1.5-pro: More capable, requires paid API
 * - gemini-1.5-flash: Stable, compatible with free tier
 *
 * Default: gemini-2.0-flash (configured via admin panel or env)
 */
const DEFAULT_MODEL = process.env.GEMINI_MODEL || 'gemini-2.0-flash';

export type ChatMessage = {
  role: 'user' | 'model';
  parts: { text: string }[];
};

/**
 * Chat with Gemini AI (uses env-based config)
 * For backward compatibility
 */
export async function chat(
  messages: { role: 'user' | 'assistant'; content: string }[],
  systemPrompt?: string,
  modelName?: string
) {
  const client = getGeminiClient();
  const model = client.getGenerativeModel({
    model: modelName || DEFAULT_MODEL,
    systemInstruction: systemPrompt,
  });

  // Convert messages to Gemini format
  const history: ChatMessage[] = messages.slice(0, -1).map((m) => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: m.content }],
  }));

  const chatSession = model.startChat({ history });
  const lastMessage = messages[messages.length - 1];

  if (!lastMessage) {
    throw new Error('No messages provided');
  }

  const result = await chatSession.sendMessage(lastMessage.content);
  return result.response.text();
}

/**
 * Chat with Gemini AI (uses database settings with env fallback)
 * Recommended for new implementations
 */
export async function chatWithConfig(
  messages: { role: 'user' | 'assistant'; content: string }[],
  systemPrompt?: string,
  overrideModel?: string
) {
  const { client, model: configuredModel } = await getGeminiClientAsync();
  const modelName = overrideModel || configuredModel;
  
  const model = client.getGenerativeModel({
    model: modelName,
    systemInstruction: systemPrompt,
  });

  // Convert messages to Gemini format
  const history: ChatMessage[] = messages.slice(0, -1).map((m) => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: m.content }],
  }));

  const chatSession = model.startChat({ history });
  const lastMessage = messages[messages.length - 1];

  if (!lastMessage) {
    throw new Error('No messages provided');
  }

  const result = await chatSession.sendMessage(lastMessage.content);
  return result.response.text();
}

/**
 * Generate content (single turn, uses env-based config)
 */
export async function generateContent(
  prompt: string,
  systemPrompt?: string,
  modelName?: string
) {
  const client = getGeminiClient();
  const model = client.getGenerativeModel({
    model: modelName || DEFAULT_MODEL,
    systemInstruction: systemPrompt,
  });

  const result = await model.generateContent(prompt);
  return result.response.text();
}

/**
 * Generate content (uses database settings with env fallback)
 * Recommended for new implementations
 */
export async function generateContentWithConfig(
  prompt: string,
  systemPrompt?: string,
  overrideModel?: string
) {
  const { client, model: configuredModel } = await getGeminiClientAsync();
  const modelName = overrideModel || configuredModel;
  
  const model = client.getGenerativeModel({
    model: modelName,
    systemInstruction: systemPrompt,
  });

  const result = await model.generateContent(prompt);
  return result.response.text();
}

/**
 * Generate content with fallback models
 * Tries primary model first, then falls back to alternative models
 */
export async function generateContentWithFallback(
  prompt: string,
  systemPrompt?: string,
  primaryModel?: string
): Promise<string> {
  const models = [
    primaryModel || DEFAULT_MODEL,
    'gemini-pro', // Fallback to older stable model
    'gemini-1.5-flash', // Try again with explicit name
  ].filter((m, i, arr) => arr.indexOf(m) === i); // Remove duplicates

  let lastError: Error | null = null;

  for (const model of models) {
    try {
      const client = getGeminiClient();
      const geminiModel = client.getGenerativeModel({
        model,
        systemInstruction: systemPrompt,
      });
      const result = await geminiModel.generateContent(prompt);
      return result.response.text();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      // Continue to next model
      continue;
    }
  }

  // If all models fail, throw the last error
  throw lastError || new Error('All Gemini models failed');
}

/**
 * Analyze image with Vision AI (OCR for payment verification)
 */
export async function analyzeImage(
  imageBase64: string,
  mimeType: 'image/png' | 'image/jpeg' | 'image/webp' | 'image/gif',
  prompt: string,
  modelName?: string
) {
  const client = getGeminiClient();
  const model = client.getGenerativeModel({
    model: modelName || DEFAULT_MODEL,
  });

  const result = await model.generateContent([
    {
      inlineData: {
        mimeType,
        data: imageBase64,
      },
    },
    { text: prompt },
  ]);

  return result.response.text();
}

/**
 * Analyze image with Vision AI (uses database settings with env fallback)
 * Recommended for new implementations
 */
export async function analyzeImageWithConfig(
  imageBase64: string,
  mimeType: 'image/png' | 'image/jpeg' | 'image/webp' | 'image/gif',
  prompt: string,
  overrideModel?: string
) {
  const { client, model: configuredModel } = await getGeminiClientAsync();
  const modelName = overrideModel || configuredModel;
  
  const model = client.getGenerativeModel({
    model: modelName,
  });

  const result = await model.generateContent([
    {
      inlineData: {
        mimeType,
        data: imageBase64,
      },
    },
    { text: prompt },
  ]);

  return result.response.text();
}

/**
 * OCR Payment Receipt - Extract data from transfer receipt
 */
export async function ocrPaymentReceipt(imageBase64: string, mimeType: string) {
  const prompt = `Analyze this payment receipt/transfer proof image and extract the following information in JSON format:
{
  "bank_sender": "nama bank pengirim",
  "bank_receiver": "nama bank penerima", 
  "account_number": "nomor rekening tujuan",
  "account_name": "nama pemilik rekening tujuan",
  "amount": nomor (tanpa titik/koma),
  "date": "YYYY-MM-DD",
  "time": "HH:mm:ss",
  "reference_number": "nomor referensi jika ada",
  "confidence": 0-100
}

If any field cannot be extracted, set it to null.
Return ONLY the JSON object, no additional text.`;

  const result = await analyzeImage(
    imageBase64,
    mimeType as 'image/png' | 'image/jpeg' | 'image/webp' | 'image/gif',
    prompt
  );

  try {
    // Clean response and parse JSON
    const cleaned = result.replace(/```json\n?|\n?```/g, '').trim();
    return JSON.parse(cleaned);
  } catch {
    return { error: 'Failed to parse OCR result', raw: result };
  }
}

export default getGeminiClient;

import { GoogleGenerativeAI } from '@google/generative-ai';

let geminiClient: GoogleGenerativeAI | null = null;

function getGeminiClient(): GoogleGenerativeAI {
  if (!geminiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY environment variable is not set');
    }
    geminiClient = new GoogleGenerativeAI(apiKey);
  }
  return geminiClient;
}

/**
 * Gemini Model Selection (December 2025):
 * - gemini-1.5-pro: Recommended for production - More capable, best for complex reasoning
 * - gemini-1.5-flash: Fast, for high-volume tasks
 * - gemini-2.0-flash-exp: Latest experimental, fastest (use with caution in production)
 * 
 * Default: gemini-1.5-pro (most stable and capable for Google AI Studio)
 */
const DEFAULT_MODEL = process.env.GEMINI_MODEL || 'gemini-1.5-pro';

export type ChatMessage = {
  role: 'user' | 'model';
  parts: { text: string }[];
};

/**
 * Chat with Gemini AI
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

  const chat = model.startChat({ history });
  const lastMessage = messages[messages.length - 1];

  if (!lastMessage) {
    throw new Error('No messages provided');
  }

  const result = await chat.sendMessage(lastMessage.content);
  return result.response.text();
}

/**
 * Generate content (single turn)
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

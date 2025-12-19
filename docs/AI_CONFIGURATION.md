# AI Configuration - Google AI Studio

**Last Updated:** December 20, 2025

## Overview

Project ini menggunakan **Google AI Studio (Gemini)** untuk:
- **Chat AI (AeroBot)**: Conversational AI untuk customer service
- **Vision AI**: OCR untuk payment receipt verification
- **RAG (Retrieval Augmented Generation)**: Context-aware responses

## Configuration

### API Key
- **Location**: `.env.local`
- **Variable**: `GEMINI_API_KEY`
- **Status**: ✅ Configured

### Model Selection

Default model: **`gemini-1.5-pro`** (recommended for production)

Available models:
- **`gemini-1.5-pro`**: Most capable, best for complex reasoning (default)
- **`gemini-1.5-flash`**: Fast, for high-volume tasks
- **`gemini-2.0-flash-exp`**: Latest experimental, fastest (use with caution)

### Custom Model Selection

You can override the default model via environment variable:

```bash
# In .env.local
GEMINI_MODEL=gemini-1.5-flash  # For faster responses
# or
GEMINI_MODEL=gemini-2.0-flash-exp  # For latest features (experimental)
```

Or programmatically:

```typescript
import { chat } from '@/lib/gemini';

// Use default model (gemini-1.5-pro)
await chat(messages, systemPrompt);

// Use specific model
await chat(messages, systemPrompt, 'gemini-1.5-flash');
```

## Usage Examples

### Chat AI (AeroBot)

```typescript
import { chat } from '@/lib/gemini';

const messages = [
  { role: 'user', content: 'Apa saja paket wisata ke Lombok?' }
];

const response = await chat(messages, 'You are a helpful travel assistant.');
```

### Vision AI (OCR)

```typescript
import { analyzeImage, ocrPaymentReceipt } from '@/lib/gemini';

// Analyze image with custom prompt
const result = await analyzeImage(imageBase64, 'image/jpeg', 'What is in this image?');

// OCR Payment Receipt
const receiptData = await ocrPaymentReceipt(imageBase64, 'image/jpeg');
```

### Generate Content

```typescript
import { generateContent } from '@/lib/gemini';

const content = await generateContent(
  'Write a travel itinerary for 3 days in Bali',
  'You are a professional travel planner'
);
```

## Files

- **`lib/gemini.ts`**: Main Gemini AI integration
- **`lib/ai/rag.ts`**: RAG implementation for context-aware responses
- **`lib/ai/vision.ts`**: Vision AI utilities
- **`lib/ai/vision-sentiment.ts`**: Sentiment analysis from images

## Rate Limiting

AI endpoints are rate-limited via `lib/integrations/rate-limit.ts`:
- **Chat**: 10 requests per minute per user
- **Vision**: 5 requests per minute per user

## Best Practices

1. **Use `gemini-1.5-pro` for production** - Most stable and capable
2. **Use `gemini-1.5-flash` for high-volume tasks** - Faster responses
3. **Use `gemini-2.0-flash-exp` for testing** - Latest features but experimental
4. **Always provide system prompts** - Better context and responses
5. **Handle errors gracefully** - AI responses can be unpredictable

## Troubleshooting

### API Key Issues
```bash
# Verify API key is set
echo $GEMINI_API_KEY

# Check .env.local
cat .env.local | grep GEMINI
```

### Model Not Available
- Ensure you're using a valid model name
- Check Google AI Studio documentation for latest models
- Some models may require specific API access

### Rate Limiting
- Check rate limit configuration in `lib/integrations/rate-limit.ts`
- Implement exponential backoff for retries
- Consider caching responses for common queries

---

**Maintained By:** Development Team


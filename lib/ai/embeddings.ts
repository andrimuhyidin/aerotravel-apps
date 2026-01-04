/**
 * Embedding Generation Utility
 * Generate vector embeddings untuk RAG (Retrieval Augmented Generation)
 * 
 * Uses Google Gemini embedding-001 (768 dimensions)
 * Compatible with existing database schema
 */

import 'server-only';

import { logger } from '@/lib/utils/logger';

const EMBEDDING_DIMENSION = 768; // Gemini embedding-001 dengan output_dimensions=768

/**
 * Generate embedding dari text menggunakan Gemini embedding-001
 * @param text - Text yang akan di-embed
 * @returns Array of numbers (768 dimensions)
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  try {
    // Clean text (remove extra whitespace, limit length)
    // Gemini embedding-001 supports up to 2048 tokens
    const cleanText = text.trim().slice(0, 8000); // Safe limit

    // Use REST API approach for embeddings
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY environment variable is not set');
    }

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/embedding-001:embedContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'models/embedding-001',
          content: {
            parts: [{ text: cleanText }],
          },
          taskType: 'RETRIEVAL_DOCUMENT', // or 'RETRIEVAL_QUERY' for queries
          outputDimensionality: EMBEDDING_DIMENSION,
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      let errorMessage = `Gemini API error: ${errorText}`;
      
      // Parse error untuk better message
      try {
        const errorData = JSON.parse(errorText);
        if (errorData.error?.code === 429) {
          errorMessage = `Gemini API quota exceeded. Please check your plan or retry later.`;
        } else if (errorData.error?.message) {
          errorMessage = `Gemini API error: ${errorData.error.message}`;
        }
      } catch {
        // Keep original error message
      }
      
      throw new Error(errorMessage);
    }

    const data = (await response.json()) as {
      embedding?: { values?: number[] };
    };

    const embedding = data.embedding?.values;

    if (!embedding || embedding.length !== EMBEDDING_DIMENSION) {
      throw new Error(`Invalid embedding response: expected ${EMBEDDING_DIMENSION} dimensions, got ${embedding?.length || 0}`);
    }

    logger.info('Embedding generated', {
      textLength: cleanText.length,
      embeddingLength: embedding.length,
      model: 'gemini-embedding-001',
    });

    return embedding;
  } catch (error) {
    logger.error('Failed to generate embedding', error, {
      textLength: text.length,
    });
    throw new Error('Gagal membuat embedding');
  }
}

/**
 * Generate embeddings untuk multiple texts (batch)
 * @param texts - Array of texts
 * @returns Array of embeddings
 */
export async function generateEmbeddings(texts: string[]): Promise<number[][]> {
  try {
    // Gemini embedding API supports batch via batchEmbedContents
    // For now, we'll do sequential calls (can optimize later)
    const embeddings: number[][] = [];

    for (const text of texts) {
      const embedding = await generateEmbedding(text);
      embeddings.push(embedding);
    }

    logger.info('Batch embeddings generated', {
      count: embeddings.length,
      dimension: EMBEDDING_DIMENSION,
      model: 'gemini-embedding-001',
    });

    return embeddings;
  } catch (error) {
    logger.error('Failed to generate batch embeddings', error, {
      textCount: texts.length,
    });
    throw new Error('Gagal membuat embeddings');
  }
}

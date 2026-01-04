/**
 * Test RAG Search Functionality
 * Verify vector similarity search working correctly
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const geminiApiKey = process.env.GEMINI_API_KEY;

if (!supabaseUrl || !supabaseServiceKey || !geminiApiKey) {
  console.error('❌ Missing credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function generateEmbedding(text) {
  const cleanText = text.trim().slice(0, 8000);
  
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/embedding-001:embedContent?key=${geminiApiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'models/embedding-001',
        content: { parts: [{ text: cleanText }] },
        taskType: 'RETRIEVAL_QUERY',
        outputDimensionality: 768,
      }),
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Gemini API error: ${error}`);
  }

  const data = await response.json();
  return data.embedding?.values || [];
}

async function testRAGSearch() {
  console.log('🧪 Testing RAG Search...\n');

  const testQueries = [
    'Tamu kena bulu babi, penanganannya gimana?',
    'Apa yang harus dilakukan saat cuaca buruk?',
    'Bagaimana cara handle kecelakaan di air?',
    'Prosedur evakuasi darurat',
    'First aid untuk luka bakar',
  ];

  for (const query of testQueries) {
    console.log(`\n📝 Query: "${query}"`);
    console.log('─'.repeat(60));

    try {
      // Generate embedding
      console.log('   Generating embedding...');
      const queryEmbedding = await generateEmbedding(query);
      console.log(`   ✅ Embedding generated (${queryEmbedding.length} dimensions)`);

      // Vector search
      console.log('   Searching documents...');
      const { data: results, error } = await supabase.rpc('match_documents', {
        query_embedding: `[${queryEmbedding.join(',')}]`,
        match_threshold: 0.7,
        match_count: 3,
        filter_branch_id: null,
      });

      if (error) {
        console.error(`   ❌ Search error:`, error.message);
        continue;
      }

      if (!results || results.length === 0) {
        console.log('   ⚠️  No documents found (similarity < 0.7)');
        console.log('   💡 Try lowering threshold or seed documents first');
      } else {
        console.log(`   ✅ Found ${results.length} relevant documents:\n`);
        results.forEach((doc, idx) => {
          console.log(`   ${idx + 1}. ${doc.title} (${doc.document_type})`);
          console.log(`      Similarity: ${(doc.similarity * 100).toFixed(1)}%`);
          console.log(`      Preview: ${doc.content.substring(0, 100)}...\n`);
        });
      }
    } catch (error) {
      console.error(`   ❌ Error:`, error.message);
    }
  }

  console.log('\n✅ RAG Search test completed!');
}

testRAGSearch().catch(console.error);

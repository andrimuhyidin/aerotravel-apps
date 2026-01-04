/**
 * Seed Sample AI Documents (SOP)
 * Create sample SOP documents untuk testing RAG
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

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
        taskType: 'RETRIEVAL_DOCUMENT',
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

const sampleDocuments = [
  {
    title: 'Penanganan Bulu Babi',
    document_type: 'sop',
    content: `PROSEDUR PENANGANAN BULU BABI (Sea Urchin Sting)

1. PERTOLONGAN PERTAMA:
   - Jangan panik, tenangkan korban
   - Cuci area yang terkena dengan air tawar (BUKAN air laut)
   - Jangan digosok atau ditekan
   - Oleskan cuka atau air lemon untuk melarutkan bulu
   - Gunakan pinset steril untuk ambil bulu yang masih menempel (jika terlihat)

2. PERAWATAN LANJUTAN:
   - Oleskan salep antihistamin jika gatal
   - Kompres dengan air hangat untuk mengurangi nyeri
   - Berikan paracetamol jika nyeri
   - Monitor kondisi korban

3. TINDAKAN MEDIS:
   - Jika bulu masuk ke sendi atau dalam, segera ke dokter
   - Jika ada tanda infeksi (kemerahan, bengkak, nanah), ke dokter
   - Jika korban alergi atau reaksi parah, segera ke UGD

4. PENCEGAHAN:
   - Gunakan sepatu air saat snorkeling/diving
   - Hindari step langsung di karang
   - Perhatikan area sebelum masuk air`,
  },
  {
    title: 'Prosedur Emergency Evacuation',
    document_type: 'sop',
    content: `PROSEDUR EVACUASI DARURAT DI LAUT

1. DETEKSI SITUASI DARURAT:
   - Cuaca buruk (ombak tinggi, badai)
   - Kecelakaan serius di kapal
   - Kebakaran atau kebocoran
   - Medical emergency yang memerlukan evakuasi

2. TINDAKAN SEGERA:
   - Aktifkan SOS alert via aplikasi
   - Hubungi ops center: [NOMOR DARURAT]
   - Kumpulkan semua penumpang di area aman
   - Pastikan semua life jacket terpasang
   - Siapkan emergency kit

3. EVACUASI:
   - Ikuti instruksi dari kapten/guide
   - Gunakan life raft jika perlu
   - Bawa emergency supplies (air, makanan, first aid)
   - Tetap bersama grup, jangan terpisah
   - Tunggu bantuan di lokasi yang aman

4. SETELAH EVACUASI:
   - Lakukan head count
   - Cek kondisi semua penumpang
   - Berikan first aid jika perlu
   - Tunggu bantuan dari tim rescue`,
  },
  {
    title: 'First Aid Basic untuk Tour Guide',
    document_type: 'sop',
    content: `FIRST AID BASIC UNTUK TOUR GUIDE

1. PERALATAN WAJIB:
   - First aid kit lengkap
   - Antiseptik, perban, plester
   - Paracetamol, antihistamin
   - Salep luka bakar
   - Thermometer

2. LUKA RINGAN:
   - Cuci dengan air bersih
   - Oleskan antiseptik
   - Tutup dengan perban
   - Ganti perban setiap hari

3. LUKA BAKAR:
   - Dinginkan dengan air mengalir 10-15 menit
   - Jangan oleskan apapun kecuali salep khusus
   - Tutup dengan perban steril
   - Jika parah, segera ke dokter

4. PINGSAN:
   - Baringkan di tempat datar
   - Angkat kaki lebih tinggi
   - Longgarkan pakaian
   - Cek nadi dan pernapasan
   - Jika tidak sadar > 1 menit, hubungi medis

5. SEASICKNESS:
   - Pindah ke area yang lebih stabil
   - Berikan obat anti mabuk (jika ada)
   - Fokus ke horizon
   - Berikan air minum
   - Monitor kondisi`,
  },
  {
    title: 'Weather Emergency Protocol',
    document_type: 'sop',
    content: `PROTOKOL DARURAT CUACA

1. MONITORING CUACA:
   - Cek prakiraan cuaca sebelum trip
   - Monitor perubahan cuaca selama trip
   - Perhatikan tanda-tanda cuaca buruk:
     * Awan gelap mendekat
     * Angin kencang
     * Ombak tinggi
     * Hujan deras

2. TINDAKAN PENCEGAHAN:
   - Jika cuaca memburuk, segera kembali ke darat
   - Hindari area dengan ombak tinggi
   - Cari shelter terdekat
   - Informasikan ke ops center

3. SAAT CUACA BURUK:
   - Kumpulkan semua penumpang
   - Pastikan semua pakai life jacket
   - Cari tempat aman (shelter, kapal besar)
   - Jangan panik, tetap tenang
   - Tunggu cuaca membaik atau evakuasi

4. SETELAH CUACA BURUK:
   - Cek kondisi semua penumpang
   - Lakukan head count
   - Berikan first aid jika perlu
   - Laporkan ke ops center`,
  },
  {
    title: 'Penanganan Kecelakaan di Air',
    document_type: 'sop',
    content: `PENANGANAN KECELAKAAN DI AIR

1. DETEKSI KECELAKAAN:
   - Korban tenggelam
   - Kram otot di air
   - Terjebak di karang
   - Terbentur benda keras

2. TINDAKAN PENYELAMATAN:
   - Jangan langsung lompat (kecuali terlatih)
   - Lempar alat bantu (life ring, tali)
   - Panggil bantuan
   - Jika aman, bantu korban ke darat/kapal

3. SETELAH DI DARAT:
   - Cek kesadaran dan pernapasan
   - Jika tidak bernapas, lakukan CPR
   - Jika sadar, baringkan dengan posisi recovery
   - Hangatkan tubuh korban
   - Hubungi medis segera

4. CPR DASAR:
   - 30 kompresi dada
   - 2 kali napas buatan
   - Ulangi sampai bantuan datang
   - Jangan berhenti kecuali korban sadar`,
  },
];

async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function generateEmbeddingWithRetry(text, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await generateEmbedding(text);
    } catch (error) {
      const errorData = error.message.includes('{') ? JSON.parse(error.message) : null;
      if (errorData?.error?.code === 429) {
        // Rate limit - wait and retry
        const retryDelay = errorData.error.details?.find(d => d['@type']?.includes('RetryInfo'))?.retryDelay 
          ? parseFloat(errorData.error.details.find(d => d['@type']?.includes('RetryInfo')).retryDelay.replace('s', '')) * 1000
          : 5000;
        console.log(`   ⏳ Rate limited, waiting ${retryDelay/1000}s...`);
        await sleep(retryDelay);
        continue;
      }
      throw error;
    }
  }
  throw new Error('Max retries exceeded');
}

async function seedDocuments() {
  console.log('🌱 Seeding AI Documents...\n');
  console.log('⚠️  Note: Gemini embedding API has rate limits. This may take a while.\n');

  let successCount = 0;
  let errorCount = 0;
  let skippedCount = 0;

  for (let i = 0; i < sampleDocuments.length; i++) {
    const doc = sampleDocuments[i];
    try {
      console.log(`📝 [${i + 1}/${sampleDocuments.length}] Creating: ${doc.title}...`);

      // Check if already exists
      const { data: existing } = await supabase
        .from('ai_documents')
        .select('id')
        .eq('title', doc.title)
        .maybeSingle();

      if (existing) {
        console.log(`⚠️  ${doc.title} already exists, skipping...`);
        skippedCount++;
        continue;
      }

      // Generate embedding with retry
      console.log(`   Generating embedding...`);
      const embedding = await generateEmbeddingWithRetry(doc.content);
      console.log(`   ✅ Embedding generated (${embedding.length} dimensions)`);

      // Insert document with embedding
      const { data: inserted, error } = await supabase
        .from('ai_documents')
        .insert({
          title: doc.title,
          document_type: doc.document_type,
          content: doc.content,
          branch_id: null,
          is_active: true,
          embedding: `[${embedding.join(',')}]`,
          created_by: (await supabase.auth.admin.listUsers()).data.users[0]?.id || null,
        })
        .select()
        .single();

      if (error) {
        throw error;
      }

      console.log(`✅ ${doc.title} created with embedding\n`);
      successCount++;

      // Delay between documents to avoid rate limit
      if (i < sampleDocuments.length - 1) {
        await sleep(2000); // 2 second delay
      }
    } catch (error) {
      const errorMsg = error.message || String(error);
      if (errorMsg.includes('quota') || errorMsg.includes('429')) {
        console.error(`❌ Quota exceeded for ${doc.title}`);
        console.log(`💡 Please use admin UI to create documents, or upgrade Gemini API plan\n`);
      } else {
        console.error(`❌ Error creating ${doc.title}:`, errorMsg.substring(0, 200));
      }
      errorCount++;
    }
  }

  console.log(`\n📊 Summary:`);
  console.log(`   ✅ Success: ${successCount}`);
  console.log(`   ⚠️  Skipped: ${skippedCount}`);
  console.log(`   ❌ Errors: ${errorCount}`);
  
  if (errorCount > 0) {
    console.log(`\n💡 If you hit quota limits:`);
    console.log(`   1. Use admin UI at /console/ai-documents to create documents`);
    console.log(`   2. Or upgrade Gemini API plan for higher limits`);
    console.log(`   3. Or wait and retry later`);
  }
  
  if (successCount > 0) {
    console.log(`\n✅ Documents ready for RAG search!`);
  }
}

seedDocuments().catch(console.error);

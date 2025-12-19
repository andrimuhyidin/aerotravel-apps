# Strategi Implementasi Fitur AI Tour Guide

**Tanggal:** 2025-01-XX  
**Status:** 📋 Planning

---

## 📊 Ringkasan Status

| Fitur | Status | Prioritas | Estimasi |
|-------|--------|-----------|----------|
| **1. AI Field Assistant (RAG Full)** | ⚠️ Sebagian | 🔴 High | 3-5 hari |
| **2. Voice-to-Text UI** | ❌ Belum Ada | 🔴 High | 2-3 hari |
| **3. Automated Briefing Generator** | ⚠️ Sebagian | 🟡 Medium | 2-3 hari |

---

## 🎯 1. AI Field Assistant - Full RAG dengan pgvector

### **Strategi Implementasi**

**Current State:**
- ✅ Database: Tabel `ai_documents` dengan kolom `embedding vector(1536)` sudah ada
- ✅ Extension: `pgvector` sudah enabled di migration
- ⚠️ Backend: Masih pakai `textSearch` (full-text search), belum vector similarity
- ❌ Embedding: Belum ada fungsi untuk generate embedding dari text

**Target State:**
- Full vector similarity search menggunakan pgvector
- Auto-generate embedding saat create/update document
- Semantic search yang lebih akurat untuk SOP/Safety questions

**Pilihan Embedding Model:**
1. **Gemini Embedding** (Recommended - sudah pakai Gemini untuk AI)
   - Model: `text-embedding-004` (768 dimensions) atau `text-embedding-004-large` (768 dimensions)
   - Pro: Satu provider, konsisten dengan AI model
   - Con: Perlu update dimension di database (1536 → 768)

2. **OpenAI ada-002** (Current schema)
   - Model: `text-embedding-ada-002` (1536 dimensions)
   - Pro: Dimension sudah sesuai dengan schema
   - Con: Perlu API key tambahan, biaya terpisah

**Rekomendasi:** Gunakan **Gemini Embedding** untuk konsistensi, update schema ke 768 dimensions.

---

### **Checklist Implementasi**

#### **Phase 1: Setup Embedding Infrastructure** (1-2 hari)

- [ ] **1.1. Update Database Schema**
  - [ ] Buat migration untuk update `embedding` column dari `vector(1536)` ke `vector(768)` (Gemini)
  - [ ] Atau tetap `vector(1536)` jika pakai OpenAI
  - [ ] Buat index untuk vector similarity: `CREATE INDEX ON ai_documents USING ivfflat (embedding vector_cosine_ops);`
  - [ ] File: `supabase/migrations/XXX-add-vector-index.sql`

- [ ] **1.2. Create Embedding Utility**
  - [ ] Buat `lib/ai/embeddings.ts` dengan fungsi:
    - `generateEmbedding(text: string): Promise<number[]>`
    - Support Gemini embedding API
  - [ ] Add error handling & retry logic
  - [ ] Add caching untuk avoid duplicate API calls

- [ ] **1.3. Update Environment Variables**
  - [ ] Pastikan `GEMINI_API_KEY` sudah ada (sudah ada)
  - [ ] Add `GEMINI_EMBEDDING_MODEL` (optional, default: `text-embedding-004`)

#### **Phase 2: Update RAG Implementation** (1-2 hari)

- [ ] **2.1. Update `lib/ai/rag.ts`**
  - [ ] Replace `textSearch` dengan vector similarity search
  - [ ] Implement `retrieveContextWithVector(query: string)`:
    ```typescript
    // Generate embedding dari query
    const queryEmbedding = await generateEmbedding(query);
    
    // Vector similarity search
    const { data } = await supabase.rpc('match_documents', {
      query_embedding: queryEmbedding,
      match_threshold: 0.7,
      match_count: 5
    });
    ```
  - [ ] Buat PostgreSQL function `match_documents` untuk vector search
  - [ ] Fallback ke text search jika embedding gagal

- [ ] **2.2. Create Database Function**
  - [ ] Buat migration dengan function:
    ```sql
    CREATE OR REPLACE FUNCTION match_documents(
      query_embedding vector(768),
      match_threshold float,
      match_count int
    )
    RETURNS TABLE (
      id uuid,
      title text,
      content text,
      document_type ai_document_type,
      similarity float
    )
    LANGUAGE plpgsql
    AS $$
    BEGIN
      RETURN QUERY
      SELECT
        ai_documents.id,
        ai_documents.title,
        ai_documents.content,
        ai_documents.document_type,
        1 - (ai_documents.embedding <=> query_embedding) as similarity
      FROM ai_documents
      WHERE ai_documents.is_active = true
        AND 1 - (ai_documents.embedding <=> query_embedding) > match_threshold
      ORDER BY ai_documents.embedding <=> query_embedding
      LIMIT match_count;
    END;
    $$;
    ```

- [ ] **2.3. Update Document Management**
  - [ ] Update API create/update document untuk auto-generate embedding
  - [ ] File: `app/api/admin/ai-documents/route.ts` (perlu dibuat)
  - [ ] Generate embedding saat document dibuat/diupdate
  - [ ] Handle error jika embedding generation gagal

#### **Phase 3: Integration & Testing** (1 hari)

- [ ] **3.1. Update Trip Chat Assistant**
  - [ ] Integrate RAG ke `app/api/guide/trips/[id]/chat-ai/route.ts`
  - [ ] Call `retrieveContextWithVector()` untuk SOP questions
  - [ ] Add context dari SOP documents ke system prompt

- [ ] **3.2. Testing**
  - [ ] Test dengan sample SOP documents
  - [ ] Test query: "Tamu kena bulu babi, penanganannya gimana?"
  - [ ] Verify response menggunakan SOP content
  - [ ] Test fallback jika embedding gagal

- [ ] **3.3. Documentation**
  - [ ] Update `docs/AI_CONFIGURATION.md` dengan embedding info
  - [ ] Add guide untuk admin upload SOP documents

---

## 🎙️ 2. Voice-to-Text UI untuk Laporan Insiden

### **Strategi Implementasi**

**Current State:**
- ✅ Backend: `lib/ai/incident-assistant.ts` dengan `extractIncidentInfoFromVoice()` sudah ada
- ✅ API: `app/api/guide/incidents/ai-assist/route.ts` menerima `voiceText` parameter
- ❌ UI: Belum ada voice recording component di `incident-form.tsx`

**Target State:**
- Voice recording button di incident form
- Real-time transcription menggunakan Web Speech API atau external service
- Auto-fill form fields dari transcribed text

**Pilihan Transcription Service:**
1. **Web Speech API (Browser Native)** - Recommended untuk MVP
   - Pro: Free, no API key needed, works offline (browser)
   - Con: Accuracy mungkin kurang, hanya support Chrome/Edge
   - Implementation: `navigator.mediaDevices.getUserMedia()` + `SpeechRecognition`

2. **Google Speech-to-Text API**
   - Pro: High accuracy, support multiple languages
   - Con: Perlu API key, ada biaya per request
   - Implementation: `@google-cloud/speech` atau REST API

3. **Gemini Speech-to-Text** (jika available)
   - Pro: Konsisten dengan AI stack
   - Con: Perlu cek availability

**Rekomendasi:** Mulai dengan **Web Speech API** untuk MVP, upgrade ke Google Speech-to-Text jika perlu accuracy lebih tinggi.

---

### **Checklist Implementasi**

#### **Phase 1: Voice Recording Component** (1 hari)

- [ ] **1.1. Create Voice Recorder Hook**
  - [ ] Buat `hooks/use-voice-recorder.ts`:
    - State: `isRecording`, `transcript`, `error`
    - Functions: `startRecording()`, `stopRecording()`, `clearTranscript()`
    - Use Web Speech API: `window.SpeechRecognition` atau `window.webkitSpeechRecognition`
  - [ ] Handle browser compatibility
  - [ ] Add error handling untuk permission denied

- [ ] **1.2. Create Voice Recorder UI Component**
  - [ ] Buat `components/guide/voice-recorder.tsx`:
    - Button dengan icon microphone
    - Visual indicator saat recording (pulse animation)
    - Display transcript real-time
    - Button untuk stop & clear
  - [ ] Style dengan Tailwind, follow design system
  - [ ] Add loading state saat processing

- [ ] **1.3. Browser Compatibility Check**
  - [ ] Add polyfill atau fallback untuk browsers yang tidak support
  - [ ] Show message jika browser tidak support
  - [ ] Fallback: Manual text input tetap available

#### **Phase 2: Integration dengan Incident Form** (1 hari)

- [ ] **2.1. Update `incident-form.tsx`**
  - [ ] Import `VoiceRecorder` component
  - [ ] Add voice recorder section di form
  - [ ] On transcript ready, auto-fill `chronology` field
  - [ ] Optional: Call AI assist untuk extract structured info

- [ ] **2.2. Enhance AI Assist Integration**
  - [ ] Update `generateAiReport()` untuk accept voice transcript
  - [ ] Auto-trigger AI assist setelah voice transcription selesai
  - [ ] Pre-fill form fields dari AI-extracted info

- [ ] **2.3. UX Improvements**
  - [ ] Add toast notification saat transcription selesai
  - [ ] Show confidence score (jika available)
  - [ ] Allow edit transcript sebelum submit

#### **Phase 3: Advanced Features (Optional)** (1 hari)

- [ ] **3.1. Offline Support**
  - [ ] Cache transcript jika offline
  - [ ] Queue untuk sync saat online kembali

- [ ] **3.2. Multi-language Support**
  - [ ] Detect language dari transcript
  - [ ] Support Bahasa Indonesia & English

- [ ] **3.3. Google Speech-to-Text Integration (Upgrade)**
  - [ ] Create API route: `app/api/guide/voice/transcribe/route.ts`
  - [ ] Use Google Cloud Speech-to-Text API
  - [ ] Add `GOOGLE_SPEECH_API_KEY` env variable
  - [ ] Update component untuk use API instead of browser API

---

## 📝 3. Automated Briefing Generator

### **Strategi Implementasi**

**Current State:**
- ✅ Task: "Briefing kepada peserta" auto-generated di task list
- ✅ Manifest Assistant: Bisa suggest grouping berdasarkan profil
- ❌ API: Belum ada API khusus untuk generate briefing points
- ❌ UI: Belum ada UI untuk display & edit briefing points

**Target State:**
- AI generate briefing points berdasarkan profil rombongan
- Personalized briefing: fokus keselamatan untuk lansia, fokus fun activities untuk muda
- Display briefing points di trip detail page
- Allow guide edit & customize briefing points

---

### **Checklist Implementasi**

#### **Phase 1: Briefing Generator API** (1-2 hari)

- [ ] **1.1. Create Briefing Generator Library**
  - [ ] Buat `lib/ai/briefing-generator.ts`:
    - Function: `generateBriefingPoints(tripContext: TripBriefingContext): Promise<BriefingPoints>`
    - Analyze passenger profile: age distribution, special needs, trip type
    - Generate personalized points
  - [ ] Types:
    ```typescript
    type BriefingPoints = {
      sections: Array<{
        title: string;
        points: string[];
        priority: 'high' | 'medium' | 'low';
      }>;
      estimatedDuration: number; // minutes
      targetAudience: 'all' | 'elderly' | 'young' | 'families';
    };
    ```

- [ ] **1.2. Create API Route**
  - [ ] Buat `app/api/guide/trips/[id]/briefing/route.ts`:
    - `GET`: Retrieve existing briefing points
    - `POST`: Generate new briefing points
    - `PUT`: Update/customize briefing points
  - [ ] Fetch trip context: manifest, itinerary, weather, package info
  - [ ] Call `generateBriefingPoints()` dengan context
  - [ ] Save briefing points ke database (table baru atau JSONB di trips)

- [ ] **1.3. Database Schema**
  - [ ] Buat migration untuk add `briefing_points` JSONB column di `trips` table
  - [ ] Atau buat table terpisah `trip_briefings`:
    ```sql
    CREATE TABLE trip_briefings (
      id UUID PRIMARY KEY,
      trip_id UUID REFERENCES trips(id),
      briefing_points JSONB NOT NULL,
      generated_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ,
      updated_by UUID REFERENCES users(id)
    );
    ```

#### **Phase 2: Briefing Generator Logic** (1 hari)

- [ ] **2.1. Implement Profile Analysis**
  - [ ] Analyze passenger age distribution
  - [ ] Detect special needs (allergies, medical conditions)
  - [ ] Identify trip type (boat, hiking, diving, etc.)
  - [ ] Determine target audience focus

- [ ] **2.2. Generate Personalized Points**
  - [ ] Use Gemini AI dengan prompt:
    ```
    Generate briefing points for tour guide based on:
    - Passenger profile: [age distribution, special needs]
    - Trip type: [boat tour, hiking, etc.]
    - Activities: [itinerary]
    - Weather: [current conditions]
    
    Focus areas:
    - If many elderly: Emphasize safety, pace, medical assistance
    - If many young: Emphasize fun activities, photo spots, adventure
    - If families: Emphasize child safety, family-friendly activities
    ```

- [ ] **2.3. Structure Briefing Points**
  - [ ] Sections: Safety, Activities, Logistics, Emergency
  - [ ] Priority levels untuk each point
  - [ ] Estimated duration per section

#### **Phase 3: UI Integration** (1 hari)

- [ ] **3.1. Create Briefing Component**
  - [ ] Buat `components/guide/trip-briefing.tsx`:
    - Display briefing points dengan sections
    - Show priority indicators
    - Allow edit/customize points
    - Save button untuk update

- [ ] **3.2. Integrate ke Trip Detail Page**
  - [ ] Add briefing section di `app/[locale]/(mobile)/guide/trips/[slug]/page.tsx`
  - [ ] Auto-generate saat trip dimulai (status = 'in_progress')
  - [ ] Show "Generate Briefing" button jika belum ada
  - [ ] Allow regenerate jika perlu update

- [ ] **3.3. Briefing Display Options**
  - [ ] Compact view: Collapsible sections
  - [ ] Full view: All points expanded
  - [ ] Print-friendly view untuk guide print sebelum trip

---

## 📋 Implementation Priority & Timeline

### **Sprint 1 (Week 1): High Priority**
1. ✅ Voice-to-Text UI (2-3 hari)
2. ✅ Automated Briefing Generator API (2-3 hari)

**Total: 4-6 hari kerja**

### **Sprint 2 (Week 2): Enhancement**
3. ✅ Full RAG dengan pgvector (3-5 hari)

**Total: 3-5 hari kerja**

---

## 🔧 Technical Dependencies

### **New Dependencies**
```json
{
  "@google-cloud/speech": "^6.0.0" // Optional, untuk advanced voice transcription
}
```

### **Environment Variables**
```bash
# Sudah ada
GEMINI_API_KEY=...

# Baru (jika pakai Google Speech-to-Text)
GOOGLE_SPEECH_API_KEY=...
GOOGLE_SPEECH_PROJECT_ID=...
```

### **Database Migrations**
1. `XXX-add-vector-index.sql` - Vector similarity index
2. `XXX-add-briefing-points.sql` - Briefing points storage

---

## 🧪 Testing Checklist

### **Voice-to-Text**
- [ ] Test recording di Chrome/Edge
- [ ] Test transcription accuracy (Bahasa Indonesia)
- [ ] Test error handling (permission denied, no internet)
- [ ] Test auto-fill form dari transcript

### **Briefing Generator**
- [ ] Test dengan rombongan lansia (focus safety)
- [ ] Test dengan rombongan muda (focus fun activities)
- [ ] Test dengan mixed age group
- [ ] Test regenerate briefing
- [ ] Test edit & save customization

### **RAG Full**
- [ ] Test vector similarity search
- [ ] Test dengan sample SOP documents
- [ ] Test fallback ke text search
- [ ] Test embedding generation saat create document

---

## 📚 Documentation Updates

- [ ] Update `docs/AI_CONFIGURATION.md` dengan embedding info
- [ ] Add guide untuk admin: "How to Upload SOP Documents"
- [ ] Add user guide: "How to Use Voice Recording for Incident Reports"
- [ ] Add user guide: "How to Generate & Customize Briefing Points"

---

## 🚀 Deployment Checklist

- [ ] Run database migrations
- [ ] Update environment variables
- [ ] Test di staging environment
- [ ] Monitor API usage (Gemini, Google Speech jika pakai)
- [ ] Set up error monitoring (Sentry)
- [ ] Update feature flags jika perlu

---

**Last Updated:** 2025-01-XX

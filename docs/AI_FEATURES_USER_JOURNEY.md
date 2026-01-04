# AI Features - User Journey & Implementation Guide

**Tanggal:** 2025-01-22  
**Status:** ✅ Implemented

---

## 📍 Lokasi Implementasi

### 1. AI Field Assistant (RAG Full dengan Vector Search)

#### **Backend Files:**
- `lib/ai/embeddings.ts` - Gemini embedding generation (768 dimensions)
- `lib/ai/rag.ts` - RAG retrieval dengan vector similarity search
- `lib/ai/trip-assistant.ts` - Trip chat assistant (updated dengan RAG integration)
- `app/api/guide/trips/[id]/chat-ai/route.ts` - API endpoint untuk trip chat
- `app/api/admin/ai-documents/route.ts` - Admin API untuk manage AI documents (create/list)
- `app/api/admin/ai-documents/[id]/route.ts` - Admin API untuk update/delete documents

#### **Database:**
- `supabase/migrations/20250122000004_046-rag-vector-search.sql` - Vector index & match_documents function
- Table: `ai_documents` (embedding column: `vector(768)`)
- Function: `match_documents(query_embedding, match_threshold, match_count, filter_branch_id)`

#### **UI Files:**
- `app/[locale]/(mobile)/guide/trips/[slug]/trip-ai-chat.tsx` - Chat UI untuk trip assistant

---

### 2. Automated Briefing Generator

#### **Backend Files:**
- `lib/ai/briefing-generator.ts` - AI briefing generator dengan profile analysis
- `app/api/guide/trips/[id]/briefing/route.ts` - API untuk generate/get/update briefing

#### **Database:**
- `supabase/migrations/20250122000005_047-trip-briefings.sql` - Briefing storage schema
- Table: `trips` (columns: `briefing_points`, `briefing_generated_at`, `briefing_generated_by`, etc.)

#### **UI Files:**
- `components/guide/trip-briefing.tsx` - Briefing display & edit component
- `app/[locale]/(mobile)/guide/trips/[slug]/trip-detail-client.tsx` - Integrated briefing component

#### **Query Keys:**
- `lib/queries/query-keys.ts` - Added `tripsBriefing(tripId)` query key

---

## 🚶 User Journey

### **Journey 1: Guide Bertanya SOP/Safety ke AI Assistant**

**Scenario:** Guide di laut perlu tahu prosedur darurat untuk tamu yang kena bulu babi.

**Flow:**
1. **Guide buka trip detail page**
   - Navigate: `/guide/trips/[trip-code]`
   - File: `app/[locale]/(mobile)/guide/trips/[slug]/trip-detail-client.tsx`

2. **Klik "AI Chat" atau buka chat assistant**
   - Component: `TripAiChat` di trip detail page
   - File: `app/[locale]/(mobile)/guide/trips/[slug]/trip-ai-chat.tsx`

3. **Guide tanya: "Tamu kena bulu babi, penanganannya gimana?"**
   - Input text → API call ke `/api/guide/trips/[id]/chat-ai`
   - File: `app/api/guide/trips/[id]/chat-ai/route.ts`

4. **System process:**
   - Detect SOP question (regex: prosedur|sop|safety|keselamatan|darurat|emergency|penanganan)
   - Generate embedding dari query menggunakan Gemini
   - File: `lib/ai/embeddings.ts` → `generateEmbedding(query)`
   - Vector similarity search di `ai_documents` table
   - File: `lib/ai/rag.ts` → `retrieveContextWithVector(query, branchId)`
   - Function: `match_documents()` di database
   - Retrieve relevant SOP documents (similarity > 0.7)
   - Add SOP context ke AI prompt
   - File: `lib/ai/trip-assistant.ts` → `chatTripAssistant(question, context, branchId)`
   - Generate response dengan Gemini menggunakan SOP context

5. **AI response dengan SOP content:**
   - "Berdasarkan SOP yang tersedia, penanganan bulu babi: [langkah-langkah dari SOP document]"
   - Guide dapat jawaban langsung tanpa perlu buka PDF manual

**Files Involved:**
```
User Input
  ↓
trip-ai-chat.tsx (UI)
  ↓
/api/guide/trips/[id]/chat-ai (API)
  ↓
lib/ai/trip-assistant.ts (detect SOP question)
  ↓
lib/ai/rag.ts → retrieveContextWithVector()
  ↓
lib/ai/embeddings.ts → generateEmbedding()
  ↓
Database: match_documents() function
  ↓
Return SOP documents
  ↓
lib/ai/trip-assistant.ts → chatTripAssistant() dengan SOP context
  ↓
Gemini AI generate response
  ↓
Display di UI
```

---

### **Journey 2: Admin Upload SOP Document**

**Scenario:** Admin ingin upload SOP baru tentang "Penanganan Kecelakaan di Laut".

**Flow:**
1. **Admin buka admin panel** (future: perlu buat UI)
   - API endpoint: `POST /api/admin/ai-documents`
   - File: `app/api/admin/ai-documents/route.ts`

2. **Admin create document:**
   ```json
   {
     "title": "Penanganan Kecelakaan di Laut",
     "document_type": "sop",
     "content": "Langkah-langkah penanganan...",
     "branch_id": null  // null = global document
   }
   ```

3. **System process:**
   - Generate embedding dari content menggunakan Gemini
   - File: `lib/ai/embeddings.ts` → `generateEmbedding(content)`
   - Save document + embedding ke database
   - Table: `ai_documents` dengan `embedding vector(768)`

4. **Document ready untuk RAG search:**
   - Document akan muncul saat guide tanya tentang topik terkait
   - Vector similarity search akan find document ini jika relevan

**Files Involved:**
```
Admin Input (API call)
  ↓
POST /api/admin/ai-documents
  ↓
lib/ai/embeddings.ts → generateEmbedding(content)
  ↓
Save ke ai_documents table dengan embedding
  ↓
Ready untuk RAG search
```

---

### **Journey 3: Guide Generate Briefing Points**

**Scenario:** Guide mau generate briefing points untuk trip besok dengan rombongan lansia.

**Flow:**
1. **Guide buka trip detail page**
   - Navigate: `/guide/trips/[trip-code]`
   - File: `app/[locale]/(mobile)/guide/trips/[slug]/trip-detail-client.tsx`

2. **Scroll ke section "Briefing Points"**
   - Component: `TripBriefing`
   - File: `components/guide/trip-briefing.tsx`

3. **Klik "Generate Briefing" button**
   - API call: `POST /api/guide/trips/[id]/briefing`
   - File: `app/api/guide/trips/[id]/briefing/route.ts`

4. **System process:**
   - Fetch trip context: manifest, itinerary, weather, package info
   - Analyze passenger profile:
     - Age distribution (elderly, adult, young, children)
     - Special needs (allergies, medical conditions)
     - Trip type (boat, hiking, diving, etc.)
   - File: `lib/ai/briefing-generator.ts` → `analyzePassengerProfile()`
   - Determine target audience: `elderly` | `young` | `families` | `mixed`
   - Generate personalized briefing points dengan Gemini AI
   - File: `lib/ai/briefing-generator.ts` → `generateBriefingPoints(context)`
   - Sections: Keselamatan, Aktivitas, Logistik, Kebutuhan Khusus
   - Save ke database: `trips.briefing_points` (JSONB)

5. **Display briefing points:**
   - Show sections dengan priority indicators (high/medium/low)
   - Show summary, estimated duration, target audience
   - Guide bisa edit points jika perlu
   - Guide bisa regenerate jika ada perubahan

**Files Involved:**
```
User Click "Generate Briefing"
  ↓
trip-briefing.tsx (UI)
  ↓
POST /api/guide/trips/[id]/briefing
  ↓
Fetch trip context (manifest, itinerary, weather)
  ↓
lib/ai/briefing-generator.ts → analyzePassengerProfile()
  ↓
lib/ai/briefing-generator.ts → generateBriefingPoints(context)
  ↓
Gemini AI generate personalized points
  ↓
Save ke trips.briefing_points
  ↓
Display di UI dengan edit functionality
```

---

### **Journey 4: Guide Edit Briefing Points**

**Scenario:** Guide mau customize briefing points yang sudah di-generate.

**Flow:**
1. **Guide buka briefing section** (sudah ada briefing points)
   - Component: `TripBriefing`
   - File: `components/guide/trip-briefing.tsx`

2. **Klik edit icon di section tertentu**
   - Open dialog dengan textarea
   - Pre-filled dengan existing points

3. **Guide edit points:**
   - Modify points (satu per baris)
   - Click "Simpan"

4. **System process:**
   - API call: `PUT /api/guide/trips/[id]/briefing`
   - File: `app/api/guide/trips/[id]/briefing/route.ts`
   - Update `trips.briefing_points` dengan edited sections
   - Update `briefing_updated_at` dan `briefing_updated_by`

5. **UI refresh dengan updated points**

**Files Involved:**
```
User Edit Points
  ↓
trip-briefing.tsx (Dialog)
  ↓
PUT /api/guide/trips/[id]/briefing
  ↓
Update trips.briefing_points
  ↓
Refresh UI
```

---

## 🧪 Testing & Verification

### **Test 1: RAG Search untuk SOP**

**Steps:**
1. Admin upload SOP document via API:
   ```bash
   curl -X POST http://localhost:3000/api/admin/ai-documents \
     -H "Content-Type: application/json" \
     -d '{
       "title": "Penanganan Bulu Babi",
       "document_type": "sop",
       "content": "Langkah 1: Cuci dengan air tawar. Langkah 2: Oleskan cuka. Langkah 3: ..."
     }'
   ```

2. Guide buka trip chat assistant
3. Tanya: "Tamu kena bulu babi, penanganannya gimana?"
4. Verify: Response mengandung content dari SOP document

**Expected Result:**
- AI response include langkah-langkah dari SOP
- Response lebih akurat karena menggunakan RAG context

---

### **Test 2: Generate Briefing untuk Rombongan Lansia**

**Steps:**
1. Create trip dengan manifest:
   - 5 passengers age 65+
   - 2 passengers age 30-40
2. Guide buka trip detail page
3. Click "Generate Briefing"
4. Verify briefing points:
   - Focus pada keselamatan (high priority)
   - Emphasis pada kecepatan yang nyaman
   - Perhatian khusus untuk aksesibilitas

**Expected Result:**
- `targetAudience: "elderly"`
- Section "Keselamatan" dengan priority "high"
- Points tentang keamanan, pace yang nyaman, bantuan medis

---

### **Test 3: Generate Briefing untuk Rombongan Muda**

**Steps:**
1. Create trip dengan manifest:
   - 8 passengers age 18-25
   - 2 passengers age 26-30
2. Generate briefing
3. Verify briefing points:
   - Focus pada aktivitas seru
   - Emphasis pada spot foto & adventure
   - Interaksi sosial

**Expected Result:**
- `targetAudience: "young"`
- Section "Aktivitas" dengan fun activities
- Points tentang adventure, photo spots, social interaction

---

### **Test 4: Edit Briefing Points**

**Steps:**
1. Generate briefing (atau gunakan existing)
2. Click edit icon di section "Keselamatan"
3. Edit points, tambah custom point
4. Save
5. Verify: Points updated di UI

**Expected Result:**
- Custom points tersimpan
- `briefing_updated_at` updated
- UI refresh dengan new points

---

## 📊 API Endpoints Summary

### **Guide Endpoints:**

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/guide/trips/[id]/chat-ai` | Chat dengan AI assistant (dengan RAG) |
| `GET` | `/api/guide/trips/[id]/briefing` | Get briefing points |
| `POST` | `/api/guide/trips/[id]/briefing` | Generate briefing points |
| `PUT` | `/api/guide/trips/[id]/briefing` | Update briefing points |

### **Admin Endpoints:**

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/admin/ai-documents` | List AI documents |
| `POST` | `/api/admin/ai-documents` | Create AI document (auto-embedding) |
| `PATCH` | `/api/admin/ai-documents/[id]` | Update document (regenerate embedding if content changed) |
| `DELETE` | `/api/admin/ai-documents/[id]` | Delete document |

---

## 🔍 Key Implementation Details

### **Vector Embedding:**
- **Model:** Gemini `embedding-001`
- **Dimension:** 768
- **Max Input:** 2048 tokens
- **Output:** Array of 768 numbers

### **Vector Search:**
- **Function:** `match_documents(query_embedding, match_threshold, match_count, filter_branch_id)`
- **Similarity Metric:** Cosine distance (1 - cosine similarity)
- **Default Threshold:** 0.7
- **Index:** `ivfflat` dengan `vector_cosine_ops`

### **Briefing Generation:**
- **Model:** Gemini `1.5-pro`
- **Profile Analysis:** Age distribution, special needs detection
- **Target Audience:** `elderly` | `young` | `families` | `mixed` | `all`
- **Sections:** Keselamatan, Aktivitas, Logistik, Kebutuhan Khusus

---

## 📝 Notes

- **Embedding Dimension:** Changed dari 1536 (OpenAI) ke 768 (Gemini) untuk efisiensi
- **Existing Embeddings:** Akan dihapus saat migration (perlu regenerate)
- **Branch Filtering:** RAG search support branch filtering untuk multi-tenant
- **Fallback:** Jika vector search gagal, fallback ke text search
- **Offline Support:** Briefing points tersimpan di database, bisa diakses offline

---

**Last Updated:** 2025-01-22
